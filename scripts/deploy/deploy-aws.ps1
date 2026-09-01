<#
.SYNOPSIS
  Windows-native CAP deployment script (drop-in analogue of scripts/deploy-aws.sh).

.DESCRIPTION
  Deploys the CAP static frontend to S3 (and optionally invalidates CloudFront)
  and/or packages+deploys the Lambda API artifact, with explicit preflight checks.
  Uses the AWS CLI from an authenticated session.

  This script intentionally favors safe checks and explicit environment
  requirements over complex automation, matching the bash counterpart.

.PARAMETER Frontend
  Deploy the static frontend to S3 (build + sync + optional CloudFront invalidation).

.PARAMETER Api
  Deploy a packaged Lambda/API artifact (package-api.ps1 output).

.PARAMETER Check
  Validate env vars, AWS CLI, auth, and per-deployable IAM permissions without
  changing AWS.

.PARAMETER DryRun
  Print the planned actions without executing them.

.PARAMETER Region
  AWS region (default: AWS_REGION / AWS_DEFAULT_REGION / us-east-2).

.PARAMETER FrontendBucket
  S3 bucket for the frontend bundle (default CAP_FRONTEND_BUCKET or S3_BUCKET_NAME).

.PARAMETER CloudFrontId
  CloudFront distribution ID for invalidation (default CAP_CLOUDFRONT_DISTRIBUTION_ID).

.PARAMETER ApiFunction
  Lambda function name for API deployment (default CAP_API_FUNCTION_NAME).

.PARAMETER ApiPackage
  Path to a packaged Lambda zip artifact (default CAP_API_PACKAGE_PATH).

.PARAMETER FrontendDir
  Frontend build directory (default: dist).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/deploy/deploy-aws.ps1 -Check
  powershell -ExecutionPolicy Bypass -File scripts/deploy/deploy-aws.ps1 -Frontend -DryRun
  powershell -ExecutionPolicy Bypass -File scripts/deploy/deploy-aws.ps1 -Frontend -Api
#>
[CmdletBinding()]
param(
    [switch]$Frontend,
    [switch]$Api,
    [switch]$Check,
    [switch]$DryRun,
    [string]$Region = '',
    [string]$FrontendBucket = '',
    [string]$CloudFrontId = '',
    [string]$ApiFunction = '',
    [string]$ApiPackage = '',
    [string]$FrontendDir = ''
)

$ErrorActionPreference = 'Stop'

function Get-Step([string]$msg) { Write-Host ''; Write-Host "==> $msg" -ForegroundColor Cyan }
function Get-Warn([string]$msg) { Write-Host "warn: $msg" -ForegroundColor Yellow }
function Get-Err([string]$msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

# ---- Resolve environment configuration (env wins unless overridden by flags) ----
if ([string]::IsNullOrWhiteSpace($Region))     { $Region = if ($env:AWS_REGION) { $env:AWS_REGION } elseif ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { 'us-east-2' } }
if ([string]::IsNullOrWhiteSpace($FrontendBucket)) { $FrontendBucket = if ($env:CAP_FRONTEND_BUCKET) { $env:CAP_FRONTEND_BUCKET } else { $env:S3_BUCKET_NAME } }
if ([string]::IsNullOrWhiteSpace($CloudFrontId))    { $CloudFrontId = $env:CAP_CLOUDFRONT_DISTRIBUTION_ID }
if ([string]::IsNullOrWhiteSpace($ApiFunction))     { $ApiFunction = $env:CAP_API_FUNCTION_NAME }
if ([string]::IsNullOrWhiteSpace($ApiPackage))      { $ApiPackage = $env:CAP_API_PACKAGE_PATH }
if ([string]::IsNullOrWhiteSpace($FrontendDir))     { $FrontendDir = 'dist' }

# Default (like bash): if no deployable chosen, do both.
if (-not $Frontend -and -not $Api -and -not $Check) { $Frontend = $true; $Api = $true }

# Repo root = this script's parent\parent.
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$ResolvedFrontendDir = Join-Path $RepoRoot $FrontendDir

function Require-Cmd([string]$cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { Get-Err "Missing required command: $cmd" }
}
# Runs the AWS CLI without letting a native stderr write escalate into a
# terminating NativeCommandError under $ErrorActionPreference='Stop'. Always
# checks the real process exit code and fails the script on a non-zero run.
function Invoke-Aws {
    param([string[]]$AwsArgs, [switch]$NoThrow)
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & aws @AwsArgs 2>$null
    } finally {
        $ErrorActionPreference = $previous
    }
    if ($LASTEXITCODE -ne 0 -and -not $NoThrow) {
        Get-Err "aws command failed (exit $LASTEXITCODE): aws $($AwsArgs -join ' ')"
    }
}

function Test-AwsAuth {
    # Redirect stderr to null so a failure does not raise a terminating
    # NativeCommandError under $ErrorActionPreference='Stop'.
    $out = & aws sts get-caller-identity 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'AWS CLI is not authenticated for this session.'
        return $false
    }
    Write-Host ($out | Out-String)
    return $true
}

# Per-deployable permission probe: tries the read/describe gate used by that
# deployable and reports whether it is available, without failing the check.
function Test-S3Access([string]$bucket) {
    if ([string]::IsNullOrWhiteSpace($bucket)) { return $false }
    $null = & aws s3api head-bucket --bucket $bucket --region $Region 2>$null
    return ($LASTEXITCODE -eq 0)
}
function Test-LambdaAccess {
    $null = & aws lambda list-functions --region $Region 2>$null
    return ($LASTEXITCODE -eq 0)
}

# ---------------------------------------------------------------------------
# Preflight / check path
# ---------------------------------------------------------------------------
if ($Check -or $DryRun) {
    Get-Step 'Checking prerequisites'
    Require-Cmd 'node'
    Require-Cmd 'npm'
    Require-Cmd 'aws'
    Write-Host "AWS region: $Region"
    Write-Host "Node version: $(node -v)"
    Write-Host "npm version:  $(npm -v)"
    Write-Host "AWS CLI:      $(aws --version)"

    if (-not (Test-AwsAuth)) { exit 1 }

    Write-Host ''
    Write-Host 'Per-deployable permission check:'
    # -Check always probes both deployables so a bare preflight reports the
    # whole environment, regardless of which deployable switches were passed.
    $s3ok = Test-S3Access $FrontendBucket
    $lambdaOk = Test-LambdaAccess
    if ($Frontend -or $Check) {
        Write-Host ("  frontend (S3 bucket '{0}'):   {1}" -f $FrontendBucket, $(if ($s3ok) { 'OK - writable' } else { 'BLOCKED - cannot reach bucket' }))
        if (-not $s3ok) {
            if ([string]::IsNullOrWhiteSpace($FrontendBucket)) { Get-Warn 'No frontend bucket configured (set CAP_FRONTEND_BUCKET or S3_BUCKET_NAME or -FrontendBucket).' }
            else { Get-Warn 'The AWS session cannot access the frontend bucket. The frontend deploy cannot run.' }
        }
    }
    if ($Api -or $Check) {
        Write-Host ('  API (Lambda):                    ' + $(if ($lambdaOk) { 'OK - reachable (needs an IAM execution role; see CAP_LAMBDA_ROLE_ARN)' } else { 'BLOCKED - no lambda:ListFunctions permission' }))
        if (-not $lambdaOk) { Get-Warn 'The AWS session cannot manage Lambda. The API deploy cannot run until the IAM user/role gains Lambda + API Gateway permissions.' }
        elseif ([string]::IsNullOrWhiteSpace(($env:CAP_LAMBDA_ROLE_ARN))) { Get-Warn 'CAP_LAMBDA_ROLE_ARN is not set. The Lambda needs an execution role ARN (pre-provisioned by an administrator, or set once iam:CreateRole is available).' }
    }

    if ($Check) {
        Write-Host ''
        if (-not $s3ok) { Get-Warn 'Frontend preflight NOT ready (S3 access blocked).' }
        if (-not $lambdaOk) { Get-Warn 'API preflight NOT ready (Lambda access blocked).' }
        if ($s3ok -or $lambdaOk) {
            Write-Host 'Preflight checks ran. No build or AWS actions were executed.' -ForegroundColor Green
        }
        exit 0
    }
}

# ---------------------------------------------------------------------------
# Frontend deploy
# ---------------------------------------------------------------------------
if ($Frontend) {
    if ([string]::IsNullOrWhiteSpace($FrontendBucket)) {
        Get-Err 'A frontend bucket is required. Set CAP_FRONTEND_BUCKET or S3_BUCKET_NAME, or pass -FrontendBucket.'
    }
    if (-not (Test-S3Access $FrontendBucket)) {
        Get-Err "The AWS session cannot access the frontend bucket '$FrontendBucket'. Cannot deploy the frontend."
    }

    if ($DryRun) {
        Get-Step 'Dry run: frontend package'
        Write-Host "npm run build"
        Write-Host "aws s3 sync $ResolvedFrontendDir s3://$FrontendBucket --delete --exclude *.map --cache-control public,max-age=31536000,immutable"
        Write-Host "aws s3 cp $ResolvedFrontendDir\index.html s3://$FrontendBucket/index.html --cache-control no-cache"
        if (-not [string]::IsNullOrWhiteSpace($CloudFrontId)) {
            Write-Host "aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths '/*'"
        }
        exit 0
    }

    Get-Step 'Building frontend'
    Push-Location $RepoRoot
    try { & npm run build } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Get-Err "Frontend build failed (exit $LASTEXITCODE)." }

    if (-not (Test-Path (Join-Path $ResolvedFrontendDir 'index.html'))) {
        Get-Err "Frontend build did not produce index.html in $ResolvedFrontendDir."
    }

    Get-Step 'Syncing frontend to S3'
    Invoke-Aws @('s3','sync', $ResolvedFrontendDir, "s3://$FrontendBucket", '--delete', '--exclude','*.map','--cache-control','public,max-age=31536000,immutable','--only-show-errors','--region',$Region)
    Invoke-Aws @('s3','cp', (Join-Path $ResolvedFrontendDir 'index.html'), "s3://$FrontendBucket/index.html", '--cache-control','no-cache','--only-show-errors','--region',$Region)

    if (-not [string]::IsNullOrWhiteSpace($CloudFrontId)) {
        Get-Step 'Invalidating CloudFront cache'
        $null = & aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths '/*' --region $Region 2>$null
        if ($LASTEXITCODE -ne 0) {
            Get-Warn "CloudFront invalidation failed (is the session authorized for cloudfront:CreateInvalidation?)."
        } else {
            Write-Host "CloudFront invalidation requested for distribution $CloudFrontId."
        }
    }
}

# ---------------------------------------------------------------------------
# API deploy
# ---------------------------------------------------------------------------
if ($Api) {
    if ([string]::IsNullOrWhiteSpace($ApiFunction) -and [string]::IsNullOrWhiteSpace($ApiPackage)) {
        Get-Err 'No API deployment target configured. Set CAP_API_FUNCTION_NAME or CAP_API_PACKAGE_PATH, or pass -ApiFunction / -ApiPackage.'
    }

    if (-not (Test-LambdaAccess)) {
        Get-Warn "The AWS session cannot manage Lambda (no lambda:ListFunctions permission). The API deploy will fail."
        if (-not $DryRun) {
            throw 'API deploy aborted: AWS session has no Lambda permission. Grant the IAM user/role Lambda + API Gateway access first.'
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ApiPackage)) {
        if ($DryRun) {
            Get-Step 'Dry run: API package'
            Write-Host "aws lambda update-function-code --function-name $ApiFunction --zip-file $ApiPackage"
            exit 0
        }
        if ([string]::IsNullOrWhiteSpace($ApiFunction)) {
            Get-Err 'A Lambda function name is required when using an API package zip file (-ApiFunction).'
        }
        if (-not (Test-Path -LiteralPath $ApiPackage)) {
            Get-Err "API package not found: $ApiPackage. Run scripts/deploy/package-api.ps1 first."
        }
        Get-Step 'Updating Lambda function code'
        Invoke-Aws @('lambda','update-function-code','--function-name',$ApiFunction,'--zip-file',('fileb://' + $ApiPackage),'--region',$Region,'--output','json') | Out-Null
        Write-Host "Lambda code updated for $ApiFunction."
    } else {
        Write-Host 'API deploy is configured but no package path was provided. This script requires an archive produced by package-api.ps1.'
        Write-Host 'Run: powershell -ExecutionPolicy Bypass -File scripts/deploy/package-api.ps1'
    }
}

Write-Host ''
Write-Host 'Deployment checks completed successfully.' -ForegroundColor Green
