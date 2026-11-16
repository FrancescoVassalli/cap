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
  Deploy a packaged Lambda/API artifact (package-api.ps1 output). Updates the
  function code if the Lambda already exists; otherwise creates the function
  (runtime nodejs20.x, handler handler.handler) using CAP_LAMBDA_ROLE_ARN.

.PARAMETER Check
  Validate env vars, AWS CLI, auth, and per-deployable IAM permissions without
  changing AWS. Reports Lambda reachability, the execution-role gate
  (CAP_LAMBDA_ROLE_ARN, or the iam:CreateRole option), API Gateway access
  (v1/v2 read probe), CloudFront distribution presence, and S3 bucket access.

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

.PARAMETER LambdaEnvFile
  Optional JSON file with the `{"Variables":{...}}` shape to apply as the Lambda
  environment on create and on every code/config update (default
  CAP_LAMBDA_ENV_FILE). Keep this file gitignored — it carries runtime secrets
  such as the   S3 credentials used by the S3 presigner.

.PARAMETER ApiBaseUrl
  Public base URL of the live API (API Gateway/Lambda) to bake into the frontend
  build. When provided (or set via VITE_CAP_API_BASE_URL / CAP_API_BASE_URL), the
  frontend build sets VITE_CAP_SUBMISSION_MODE=api and VITE_CAP_UPLOAD_MODE=s3 so
  the deployed bundle calls the live Lambda instead of the in-memory mocks. Vite
  inlines these at build time.

.PARAMETER FrontendDir
  Frontend build directory (default: dist).

.PARAMETER Description
  Human-readable description of this deployment, recorded in the deployment
  log. Required for real deploys (-Frontend/-Api without -Check/-DryRun);
  -Check/-DryRun default to "Preflight check"/"Dry run" when omitted. May also
  be supplied via the CAP_DEPLOY_DESCRIPTION environment variable.

.NOTES
  Every run appends one JSONL record to logs/deployments/deployments.jsonl
  (timestamp, git revision/dirty state, description, mode, targets, resolved
  config, result, error, and the actions taken/planned) plus a matching
  human-readable logs/deployments/<runId>.log companion. logs/ is gitignored;
  records are operational, not committed. Secrets (LambdaEnvFile contents,
  credentials) are never logged — only paths/flags/presence.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/deploy/deploy-aws.ps1 -Check
  powershell -ExecutionPolicy Bypass -File scripts/deploy/deploy-aws.ps1 -Frontend -DryRun
  powershell -ExecutionPolicy Bypass -File scripts/deploy/deploy-aws.ps1 -Frontend -Api -Description "Release v1.2.0" -ApiBaseUrl "https://example.execute-api.us-east-2.amazonaws.com"
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
    [string]$LambdaEnvFile = '',
    [string]$ApiBaseUrl = '',
    [string]$FrontendDir = '',
    [string]$Description = ''
)

$ErrorActionPreference = 'Stop'

function Get-Step([string]$msg) { Write-Host ''; Write-Host "==> $msg" -ForegroundColor Cyan }
function Get-Warn([string]$msg) { Write-Host "warn: $msg" -ForegroundColor Yellow }
# Records the outcome on the deployment log context (so a guaranteed end-of-run
# writer can persist it) and throws. Throwing — rather than exit — lets the
# try/catch/finally around the main body always emit a log record, even on a
# validation abort. $Kind is 'failed' for runtime errors or 'blocked' for
# preflight/permission/configuration aborts.
function Get-Err {
    param([string]$msg, [string]$Kind = 'failed')
    if ($script:DeployLog) {
        if ([string]::IsNullOrWhiteSpace($script:DeployLog.result)) { $script:DeployLog.result = $Kind }
        $script:DeployLog.error = $msg
    }
    throw [System.Exception]::new($msg)
}

# ---- Resolve environment configuration (env wins unless overridden by flags) ----
$FrontendBucketExplicit = -not [string]::IsNullOrWhiteSpace($FrontendBucket)
# Normalize the Lambda execution-role ARN env name: CAP_LAMBDA_ROLE_ARN is
# canonical; AWS_LAMBDA_ROLE_ARN is accepted as an alias when the CAP_ form is
# unset (the admin .env currently stores it under the AWS_ name).
if ([string]::IsNullOrWhiteSpace($env:CAP_LAMBDA_ROLE_ARN) -and -not [string]::IsNullOrWhiteSpace($env:AWS_LAMBDA_ROLE_ARN)) {
    $env:CAP_LAMBDA_ROLE_ARN = $env:AWS_LAMBDA_ROLE_ARN
}
if ([string]::IsNullOrWhiteSpace($Region))     { $Region = if ($env:AWS_REGION) { $env:AWS_REGION } elseif ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { 'us-east-2' } }
if ([string]::IsNullOrWhiteSpace($FrontendBucket)) { $FrontendBucket = if ($env:CAP_FRONTEND_BUCKET) { $env:CAP_FRONTEND_BUCKET } else { $env:S3_BUCKET_NAME } }
if ([string]::IsNullOrWhiteSpace($CloudFrontId))    { $CloudFrontId = $env:CAP_CLOUDFRONT_DISTRIBUTION_ID }
if ([string]::IsNullOrWhiteSpace($ApiFunction))     { $ApiFunction = $env:CAP_API_FUNCTION_NAME }
if ([string]::IsNullOrWhiteSpace($ApiPackage))      { $ApiPackage = $env:CAP_API_PACKAGE_PATH }
if ([string]::IsNullOrWhiteSpace($LambdaEnvFile))   { $LambdaEnvFile = $env:CAP_LAMBDA_ENV_FILE }
if ([string]::IsNullOrWhiteSpace($ApiBaseUrl))      { $ApiBaseUrl = if ($env:VITE_CAP_API_BASE_URL) { $env:VITE_CAP_API_BASE_URL } elseif ($env:CAP_API_BASE_URL) { $env:CAP_API_BASE_URL } else { '' } }
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
        # Re-run capturing stderr to a temp file under 'Continue' (the native
        # stderr->NativeCommandError conversion in PS 5.1 must not throw), so
        # the real AWS error is reported instead of a bare exit code.
        $errFile = Join-Path $env:TEMP ('cap-aws-err-' + [guid]::NewGuid().ToString('N') + '.txt')
        $prev2 = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $null = & aws @AwsArgs 1>$null 2>$errFile
        } finally {
            $ErrorActionPreference = $prev2
        }
        $err = if (Test-Path -LiteralPath $errFile) { Get-Content -LiteralPath $errFile -Raw } else { '' }
        Remove-Item -LiteralPath $errFile -Force -ErrorAction SilentlyContinue
        Get-Err "aws command failed (exit $LASTEXITCODE): aws $($AwsArgs -join ' ')`n$err"
    }
}

function Test-AwsAuth {
    # The 'Continue' guard keeps a native stderr write from escalating into a
    # terminating NativeCommandError under this script's 'Stop' preference.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $out = & aws sts get-caller-identity 2>$null
    } finally {
        $ErrorActionPreference = $previous
    }
    if ($LASTEXITCODE -ne 0) {
        return $false
    }
    Write-Host ($out | Out-String)
    return $true
}

# Per-deployable permission probe: tries the read/describe gate used by that
# deployable and reports whether it is available, without failing the check.
function Test-S3Access([string]$bucket) {
    if ([string]::IsNullOrWhiteSpace($bucket)) { return $false }
    # The 'Continue' guard keeps a native stderr write (e.g. a 403/404 from
    # head-bucket) from becoming a terminating NativeCommandError under 'Stop'.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = & aws s3api head-bucket --bucket $bucket --region $Region 2>$null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previous
    }
}
function Test-LambdaAccess {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = & aws lambda list-functions --region $Region 2>$null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previous
    }
}
function Test-ApiGatewayAccess {
    # Read gate for the public HTTP API layer. Both v1 (REST) and v2 (HTTP) are
    # probed so -Check can distinguish "endpoints can be created" from "denied".
    # The temporary 'Continue' guard keeps an AccessDenied (stderr) from becoming
    # a terminating NativeCommandError under this script's 'Stop' preference.
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = & aws apigatewayv2 get-apis --region $Region 2>$null
        $v2 = ($LASTEXITCODE -eq 0)
        $null = & aws apigateway get-rest-apis --region $Region 2>$null
        $v1 = ($LASTEXITCODE -eq 0)
        return ($v2 -or $v1)
    } finally {
        $ErrorActionPreference = $previous
    }
}
function Get-LambdaExecRoleStatus {
    # Reports whether a Lambda execution role is available for create/update:
    # an explicitly configured CAP_LAMBDA_ROLE_ARN (verified via iam:GetRole)
    # or the ability to create one. iam:GetRole is a safe read probe.
    $roleArn = $env:CAP_LAMBDA_ROLE_ARN
    if ([string]::IsNullOrWhiteSpace($roleArn)) {
        return 'MISSING - set CAP_LAMBDA_ROLE_ARN to a Lambda execution role (or obtain iam:CreateRole + iam:PassRole)'
    }
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $roleName = ($roleArn -split '/')[-1]
        $null = & aws iam get-role --role-name $roleName 2>$null
        if ($LASTEXITCODE -eq 0) { return "OK - $roleArn" }
        return "NOT CONFIRMED - cannot verify $roleArn (iam:GetRole denied or role not found)"
    } finally {
        $ErrorActionPreference = $previous
    }
}
function Test-CloudFrontList {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = & aws cloudfront list-distributions --query 'DistributionList.Items[].Id' --output text 2>$null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previous
    }
}
function Test-LambdaFunctionExists([string]$fn) {
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $null = & aws lambda get-function --function-name $fn --region $Region 2>$null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previous
    }
}

# Waits until the function's LastUpdateStatus is no longer InProgress (i.e.
# "Successful") so a follow-up update-function-configuration does not race a
# still-Applying code update. Times out after $TimeoutSec seconds.
function Wait-LambdaReady([string]$fn, [int]$TimeoutSec = 120) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    if (-not $TimeoutSec) { Get-Err 'Wait-LambdaReady requires a positive TimeoutSec.' }
    while ((Get-Date) -lt $deadline) {
        # Guard so a not-found (stderr) does not throw a terminating
        # NativeCommandError under 'Stop'; the exit code is checked below.
        $previous = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $status = (& aws lambda get-function --function-name $fn --region $Region --query 'Configuration.LastUpdateStatus' --output text 2>$null)
        } finally {
            $ErrorActionPreference = $previous
        }
        if ($LASTEXITCODE -ne 0) {
            # Function not found yet (just created) - treat as not ready.
            Start-Sleep -Seconds 2
            continue
        }
        if ($status -ne 'InProgress') {
            if ($status -ne 'Successful') {
                Write-Host "Lambda status is '$status' (not Successful) - see CloudWatch for details."
            }
            return
        }
        Start-Sleep -Seconds 2
    }
    Get-Err "Timed out waiting for Lambda function $fn to finish updating."
}

# ---------------------------------------------------------------------------
# Deployment log (per-run visibility)
# ---------------------------------------------------------------------------
# Reads the current git revision once. Best-effort: a missing git binary or a
# non-repo checkout yields null revision fields rather than failing the deploy.
function Get-GitRevisionInfo {
    param([string]$Root)
    $info = [ordered]@{ revision = $null; commit = $null; dirty = $false; subject = $null }
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) { return $info }
    $previous = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $info.revision = (& git -C $Root rev-parse --short HEAD 2>$null | Select-Object -First 1)
        $info.commit   = (& git -C $Root rev-parse HEAD 2>$null | Select-Object -First 1)
        $info.subject  = (& git -C $Root log -1 --pretty=%s 2>$null | Select-Object -First 1)
        $status = (& git -C $Root status --porcelain 2>$null | Out-String)
        $info.dirty = -not [string]::IsNullOrWhiteSpace($status)
    } finally {
        $ErrorActionPreference = $previous
    }
    return $info
}

# Appends a human-readable action to the current run's record so the log
# explains what was actually built/synced/created, not just metadata.
function Add-DeployAction([string]$action) {
    # Note: an empty List is falsy in PowerShell, so test for null, not truthiness.
    if ($null -ne $script:DeployLog -and $null -ne $script:DeployLog.actions) { $script:DeployLog.actions.Add($action) }
}

# Builds and persists the run record: one compressed JSON object appended to
# logs/deployments/deployments.jsonl, plus a matching human-readable companion
# at logs/deployments/<runId>.log. Never writes secret values (env file
# contents, credentials) — only paths/flags/presence. Logging failures warn
# instead of aborting so visibility never breaks a deploy.
function Write-DeploymentLog {
    try {
        $logsDir = Join-Path $RepoRoot 'logs\deployments'
        if (-not (Test-Path -LiteralPath $logsDir)) { New-Item -ItemType Directory -Force -Path $logsDir | Out-Null }
        $log = $script:DeployLog
        $finished = [datetime]::UtcNow
        $result = if ([string]::IsNullOrWhiteSpace($log.result)) { 'success' } else { $log.result }
        $detailsRel = 'logs/deployments/' + $log.runId + '.log'
        $detailsFile = Join-Path $logsDir ($log.runId + '.log')
        $record = [ordered]@{
            timestamp   = $log.startedAt.ToString('o')
            finishedAt  = $finished.ToString('o')
            durationSec = [math]::Round(($finished - $log.startedAt).TotalSeconds, 3)
            runId       = $log.runId
            description = $log.description
            mode        = $log.mode
            gitRevision = $log.git.revision
            gitCommit   = $log.git.commit
            gitDirty    = [bool]$log.git.dirty
            gitSubject  = $log.git.subject
            targets     = [ordered]@{ frontend = [bool]$log.targets.frontend; api = [bool]$log.targets.api }
            config      = $log.config
            result      = $result
            error       = $(if ([string]::IsNullOrWhiteSpace($log.error)) { $null } else { $log.error })
            actions     = @($log.actions)
            detailsPath = $detailsRel
        }
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        $jsonlPath = Join-Path $logsDir 'deployments.jsonl'
        $json = $record | ConvertTo-Json -Compress -Depth 8
        [System.IO.File]::AppendAllText($jsonlPath, $json + "`n", $utf8NoBom)

        $text = New-Object System.Collections.Generic.List[string]
        $text.Add("CAP deployment run $($record.runId)")
        $text.Add("Description: $($record.description)")
        $text.Add("Mode:        $($record.mode)")
        $text.Add("Result:      $($record.result)")
        $text.Add("Started:     $($record.timestamp)")
        $text.Add("Finished:    $($record.finishedAt) ($($record.durationSec)s)")
        $text.Add("Git:         $($record.gitRevision) ($($record.gitCommit)) dirty=$($record.gitDirty) subject=$($record.gitSubject)")
        $text.Add("Targets:     frontend=$($record.targets.frontend) api=$($record.targets.api)")
        $text.Add("Config:      region=$($record.config.region) bucket=$($record.config.frontendBucket) cloudFrontId=$($record.config.cloudFrontId) function=$($record.config.apiFunction) package=$($record.config.apiPackage) envFileSet=$($record.config.lambdaEnvFileSet) apiBaseUrlSet=$($record.config.apiBaseUrlSet)")
        $text.Add('Actions:')
        if ($record.actions.Count -gt 0) { foreach ($a in $record.actions) { $text.Add("  - $a") } } else { $text.Add('  (none)') }
        if (-not [string]::IsNullOrWhiteSpace($record.error)) { $text.Add("Error:       $($record.error)") }
        [System.IO.File]::WriteAllText($detailsFile, ($text -join "`n") + "`n", $utf8NoBom)
        Write-Host "Deployment log written: $detailsRel"
    } catch {
        Get-Warn "Failed to write deployment log: $($_.Exception.Message)"
    }
}

# ---- Deployment log context (resolved once, before any AWS side effects) ----
$deployStartedAt = [datetime]::UtcNow
$deployRunId = $deployStartedAt.ToString('yyyyMMddTHHmmssZ') + '-' + [guid]::NewGuid().ToString('N').Substring(0, 8)
$gitInfo = Get-GitRevisionInfo $RepoRoot
$deployMode = if ($Check) { 'check' } elseif ($DryRun) { 'dry-run' } else { 'deploy' }
$deployDescription = if (-not [string]::IsNullOrWhiteSpace($Description)) { $Description } elseif (-not [string]::IsNullOrWhiteSpace($env:CAP_DEPLOY_DESCRIPTION)) { $env:CAP_DEPLOY_DESCRIPTION } else { '' }
$script:DeployLog = [ordered]@{
    startedAt   = $deployStartedAt
    runId       = $deployRunId
    mode        = $deployMode
    description = $deployDescription
    git         = $gitInfo
    targets     = [ordered]@{ frontend = [bool]$Frontend; api = [bool]$Api }
    config      = [ordered]@{
        region           = $Region
        frontendBucket   = $FrontendBucket
        cloudFrontId     = $CloudFrontId
        apiFunction      = $ApiFunction
        apiPackage       = $ApiPackage
        lambdaEnvFile    = $LambdaEnvFile
        lambdaEnvFileSet = -not [string]::IsNullOrWhiteSpace($LambdaEnvFile)
        apiBaseUrlSet    = -not [string]::IsNullOrWhiteSpace($ApiBaseUrl)
        apiBaseUrl       = $ApiBaseUrl
    }
    result      = ''
    error       = ''
    actions     = New-Object System.Collections.Generic.List[string]
}

# ---------------------------------------------------------------------------
# Main execution (wrapped by the caller so a log record is always written)
# ---------------------------------------------------------------------------
function Invoke-DeployMain {
    # A real deploy must be described; check/dry-run runs get a sensible default
    # so preflight runs stay low-friction. Enforced here so the abort is logged.
    if ([string]::IsNullOrWhiteSpace($script:DeployLog.description)) {
        if ($script:DeployLog.mode -eq 'deploy') {
            Get-Err 'A deployment description is required for real deploys. Pass -Description or set CAP_DEPLOY_DESCRIPTION.' -Kind blocked
        } elseif ($script:DeployLog.mode -eq 'check') {
            $script:DeployLog.description = 'Preflight check'
        } else {
            $script:DeployLog.description = 'Dry run'
        }
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

    if (-not (Test-AwsAuth)) { Get-Err 'AWS CLI is not authenticated for this session.' -Kind blocked }

    Write-Host ''
    Write-Host 'Per-deployable permission check:'
    # -Check always probes both deployables so a bare preflight reports the
    # whole environment, regardless of which deployable switches were passed.
    $s3ok = Test-S3Access $FrontendBucket
    $lambdaOk = Test-LambdaAccess
    $apiGwOk = $false
    $cfOk = $false
    if ($Frontend -or $Check) {
        Write-Host ("  frontend (S3 bucket '{0}'):   {1}" -f $FrontendBucket, $(if ($s3ok) { 'OK - writable' } else { 'BLOCKED - cannot reach bucket' }))
        if (-not $s3ok) {
            if ([string]::IsNullOrWhiteSpace($FrontendBucket)) { Get-Warn 'No frontend bucket configured (set CAP_FRONTEND_BUCKET or S3_BUCKET_NAME or -FrontendBucket).' }
            else { Get-Warn 'The AWS session cannot access the frontend bucket. The frontend deploy cannot run.' }
        }
        if (-not $FrontendBucketExplicit -and $FrontendBucket -eq $env:S3_BUCKET_NAME -and -not [string]::IsNullOrWhiteSpace($FrontendBucket)) {
            Get-Warn "'$FrontendBucket' was resolved from S3_BUCKET_NAME, which is the backend documents bucket. Set CAP_FRONTEND_BUCKET (or pass -FrontendBucket) to the static-host bucket before a real frontend deploy."
        }
        $cfOk = Test-CloudFrontList
        if ($cfOk) {
            # --output text prints a literal 'None' when the query result is null
            # (zero distributions), so guard against counting it as a distribution.
            $distIds = (& aws cloudfront list-distributions --query 'DistributionList.Items[].Id' --output text 2>$null)
            $distCount = 0
            if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($distIds) -and $distIds.Trim() -ne 'None') {
                $distCount = ($distIds.Trim() -split '\s+').Count
            }
            Write-Host ('  frontend (CloudFront):          OK - {0} distribution(s) present' -f $distCount)
            if ([string]::IsNullOrWhiteSpace($CloudFrontId)) { Get-Warn 'CAP_CLOUDFRONT_DISTRIBUTION_ID is not set; the CloudFront invalidation step will be skipped.' }
        } else {
            Write-Host '  frontend (CloudFront):          BLOCKED - no cloudfront:ListDistributions permission'
        }
    }
    if ($Api -or $Check) {
        $roleStatus = Get-LambdaExecRoleStatus
        $apiGwOk = Test-ApiGatewayAccess
        Write-Host ('  API (Lambda):                    ' + $(if ($lambdaOk) { 'OK - reachable' } else { 'BLOCKED - no lambda:ListFunctions permission' }))
        Write-Host ('  API (execution role):           ' + $roleStatus)
        Write-Host ('  API (API Gateway):              ' + $(if ($apiGwOk) { 'OK - endpoint layer reachable' } else { 'BLOCKED - apigateway:GET/POST denied on v1 & v2' }))
        if (-not $lambdaOk) { Get-Warn 'The AWS session cannot manage Lambda. The API deploy cannot run until the IAM user/role gains Lambda + API Gateway permissions.' }
        if ($lambdaOk -and -not $apiGwOk) { Get-Warn 'API Gateway is not accessible. No public HTTPS endpoint can be created for the API until apigateway permissions are granted.' }
    }

    if ($Check) {
        Write-Host ''
        if (-not $s3ok) { Get-Warn 'Frontend preflight NOT ready (S3 access blocked).' }
        if (-not $lambdaOk) { Get-Warn 'API preflight NOT ready (Lambda access blocked).' }
        if ($lambdaOk -and -not $apiGwOk) { Get-Warn 'API preflight NOT ready (API Gateway blocked).' }
        if (-not $cfOk) { Get-Warn 'Frontend preflight NOT ready (CloudFront list denied).' }
        if ($s3ok -or $lambdaOk -or $cfOk) {
            Write-Host 'Preflight checks ran. No build or AWS actions were executed.' -ForegroundColor Green
        }
        Add-DeployAction ("preflight: node/npm/aws checked; s3={0} lambda={1} apiGateway={2} cloudfront={3}" -f $s3ok, $lambdaOk, $apiGwOk, $cfOk)
        return
    }
    Add-DeployAction ("dry run: node/npm/aws checked; s3={0} lambda={1} apiGateway={2} cloudfront={3}" -f $s3ok, $lambdaOk, $apiGwOk, $cfOk)
}

# ---------------------------------------------------------------------------
# Frontend deploy
# ---------------------------------------------------------------------------
if ($Frontend) {
    if ([string]::IsNullOrWhiteSpace($FrontendBucket)) {
        Get-Err 'A frontend bucket is required. Set CAP_FRONTEND_BUCKET or S3_BUCKET_NAME, or pass -FrontendBucket.' -Kind blocked
    }
    if (-not $FrontendBucketExplicit -and $env:S3_BUCKET_NAME -and $FrontendBucket -eq $env:S3_BUCKET_NAME) {
        Get-Err "Refusing to sync the frontend into '$FrontendBucket' because it was resolved from S3_BUCKET_NAME (the backend documents bucket). Pass -FrontendBucket or set CAP_FRONTEND_BUCKET to the static-host bucket so a '--delete' sync can never touch case documents." -Kind blocked
    }
    if (-not (Test-S3Access $FrontendBucket)) {
        Get-Err "The AWS session cannot access the frontend bucket '$FrontendBucket'. Cannot deploy the frontend." -Kind blocked
    }

    $liveFrontend = -not [string]::IsNullOrWhiteSpace($ApiBaseUrl)

    if ($DryRun) {
        Get-Step 'Dry run: frontend package'
        if ($liveFrontend) {
            Write-Host "VITE_CAP_SUBMISSION_MODE=api VITE_CAP_UPLOAD_MODE=s3 VITE_CAP_API_BASE_URL=<set> npm run build"
        } else {
            Get-Warn 'No API base URL configured (set -ApiBaseUrl or VITE_CAP_API_BASE_URL / CAP_API_BASE_URL). The frontend will be built with the static-prototype mocks and will NOT call the live Lambda.'
            Write-Host "npm run build"
        }
        Write-Host "aws s3 sync $ResolvedFrontendDir s3://$FrontendBucket --delete --exclude *.map --cache-control public,max-age=31536000,immutable"
        Write-Host "aws s3 cp $ResolvedFrontendDir\index.html s3://$FrontendBucket/index.html --cache-control no-cache"
        if (-not [string]::IsNullOrWhiteSpace($CloudFrontId)) {
            Write-Host "aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths '/*'"
        }
        Add-DeployAction ("frontend: dry run planned (build + s3 sync to {0}{1})" -f $FrontendBucket, $(if ([string]::IsNullOrWhiteSpace($CloudFrontId)) { '' } else { " + invalidation $CloudFrontId" }))
        return
    }

    if (-not $liveFrontend) {
        Get-Warn 'No API base URL configured (set -ApiBaseUrl or VITE_CAP_API_BASE_URL / CAP_API_BASE_URL). Building with static-prototype mocks; the deployed frontend will NOT call the live Lambda.'
    }

    Get-Step 'Building frontend'
    Push-Location $RepoRoot
    $prevSubmit = $env:VITE_CAP_SUBMISSION_MODE
    $prevUpload = $env:VITE_CAP_UPLOAD_MODE
    $prevApi = $env:VITE_CAP_API_BASE_URL
    try {
        if ($liveFrontend) {
            $env:VITE_CAP_SUBMISSION_MODE = 'api'
            $env:VITE_CAP_UPLOAD_MODE = 's3'
            $env:VITE_CAP_API_BASE_URL = $ApiBaseUrl
        }
        & npm run build
    } finally {
        $env:VITE_CAP_SUBMISSION_MODE = $prevSubmit
        $env:VITE_CAP_UPLOAD_MODE = $prevUpload
        $env:VITE_CAP_API_BASE_URL = $prevApi
        Pop-Location
    }
    if ($LASTEXITCODE -ne 0) { Get-Err "Frontend build failed (exit $LASTEXITCODE)." }

    if (-not (Test-Path (Join-Path $ResolvedFrontendDir 'index.html'))) {
        Get-Err "Frontend build did not produce index.html in $ResolvedFrontendDir."
    }
    Add-DeployAction ("frontend: built static bundle (liveApi={0})" -f $liveFrontend)

    Get-Step 'Syncing frontend to S3'
    Invoke-Aws @('s3','sync', $ResolvedFrontendDir, "s3://$FrontendBucket", '--delete', '--exclude','*.map','--cache-control','public,max-age=31536000,immutable','--only-show-errors','--region',$Region)
    Invoke-Aws @('s3','cp', (Join-Path $ResolvedFrontendDir 'index.html'), "s3://$FrontendBucket/index.html", '--cache-control','no-cache','--only-show-errors','--region',$Region)
    Add-DeployAction "frontend: synced to s3://$FrontendBucket"

    if (-not [string]::IsNullOrWhiteSpace($CloudFrontId)) {
        Get-Step 'Invalidating CloudFront cache'
        # Guard so a denied/failed invalidation warns instead of throwing a
        # terminating NativeCommandError under $ErrorActionPreference='Stop'.
        $previous = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try {
            $null = & aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths '/*' --region $Region 2>$null
        } finally {
            $ErrorActionPreference = $previous
        }
        if ($LASTEXITCODE -ne 0) {
            Get-Warn "CloudFront invalidation failed (is the session authorized for cloudfront:CreateInvalidation?)."
            Add-DeployAction "frontend: cloudfront invalidation failed ($CloudFrontId)"
        } else {
            Write-Host "CloudFront invalidation requested for distribution $CloudFrontId."
            Add-DeployAction "frontend: cloudfront invalidation requested ($CloudFrontId)"
        }
    }
}

# ---------------------------------------------------------------------------
# API deploy
# ---------------------------------------------------------------------------
if ($Api) {
    if ([string]::IsNullOrWhiteSpace($ApiFunction) -and [string]::IsNullOrWhiteSpace($ApiPackage)) {
        Get-Err 'No API deployment target configured. Set CAP_API_FUNCTION_NAME or CAP_API_PACKAGE_PATH, or pass -ApiFunction / -ApiPackage.' -Kind blocked
    }

    if (-not (Test-LambdaAccess)) {
        Get-Warn "The AWS session cannot manage Lambda (no lambda:ListFunctions permission). The API deploy will fail."
        if (-not $DryRun) {
            Get-Err 'API deploy aborted: AWS session has no Lambda permission. Grant the IAM user/role Lambda + API Gateway access first.' -Kind blocked
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($ApiPackage)) {
        if ([string]::IsNullOrWhiteSpace($ApiFunction)) {
            Get-Err 'A Lambda function name is required when using an API package zip file (-ApiFunction).' -Kind blocked
        }
        if (-not (Test-Path -LiteralPath $ApiPackage)) {
            Get-Err "API package not found: $ApiPackage. Run scripts/deploy/package-api.ps1 first." -Kind blocked
        }
        $functionExists = Test-LambdaFunctionExists $ApiFunction
        $execRole = $env:CAP_LAMBDA_ROLE_ARN

        # Optional environment file (gitignored) with the { "Variables": {...} }
        # shape (UTF-8 without BOM - the AWS CLI file:// parser rejects a BOM).
        # Validated here so a bad file never reaches the create/update.
        $envArgs = @()
        if (-not [string]::IsNullOrWhiteSpace($LambdaEnvFile)) {
            if (-not (Test-Path -LiteralPath $LambdaEnvFile)) {
                Get-Err "Lambda environment file not found: $LambdaEnvFile" -Kind blocked
            }
            try {
                $envDoc = Get-Content -LiteralPath $LambdaEnvFile -Raw | ConvertFrom-Json
                if (-not $envDoc.PSObject.Properties['Variables']) {
                    Get-Err "Lambda environment file '$LambdaEnvFile' must contain a 'Variables' object."
                }
            } catch {
                Get-Err "Lambda environment file '$LambdaEnvFile' is not valid JSON."
            }
            # Pass the env file via a file:// URI. PS 5.1 native-command splatting
            # does NOT quote arguments containing braces/parentheses, so inline
            # JSON (which contains { } and ") gets split into multiple argv tokens.
            # A file:// URI is a single "token" with no such characters, so it is
            # passed intact. Use forward slashes; two leading slashes after scheme.
            $envFileUri = 'file://' + ($LambdaEnvFile -replace '\\', '/')
            $envArgs = @('--environment', $envFileUri)
        }

        if ($DryRun) {
            Get-Step 'Dry run: API package'
            if ($functionExists) {
                Write-Host "aws lambda update-function-code --function-name $ApiFunction --zip-file $ApiPackage"
            } else {
                $roleDisplay = if ([string]::IsNullOrWhiteSpace($execRole)) { '<CAP_LAMBDA_ROLE_ARN>' } else { $execRole }
                Write-Host "aws lambda create-function --function-name $ApiFunction --runtime nodejs20.x --handler handler.handler --role $roleDisplay --zip-file $ApiPackage --timeout 30"
                if ([string]::IsNullOrWhiteSpace($execRole)) {
                    Get-Warn 'CAP_LAMBDA_ROLE_ARN is not set; the create-function path will refuse to run without it.'
                }
            }
            if ($envArgs.Count -gt 0) {
                Write-Host "aws lambda update-function-configuration --function-name $ApiFunction --timeout 30 $($envArgs -join ' ')"
            }
            Add-DeployAction ("api: dry run planned ({0} {1}{2})" -f $(if ($functionExists) { 'update-code' } else { 'create' }), $ApiFunction, $(if ($envArgs.Count -gt 0) { ' + env config' } else { '' }))
            return
        }

        if ($functionExists) {
            Get-Step 'Updating Lambda function code'
            Invoke-Aws @('lambda','update-function-code','--function-name',$ApiFunction,'--zip-file',('fileb://' + $ApiPackage),'--region',$Region,'--output','json') | Out-Null
            Write-Host "Lambda code updated for $ApiFunction."
            Add-DeployAction "api: lambda code updated ($ApiFunction)"
        } else {
            if ([string]::IsNullOrWhiteSpace($execRole)) {
                Get-Err 'The Lambda function does not exist and CAP_LAMBDA_ROLE_ARN is not set. An execution role ARN is required to create it (admin-provided, or via iam:CreateRole/iam:PassRole grants).' -Kind blocked
            }
            Get-Step 'Creating Lambda function'
            Invoke-Aws @('lambda','create-function','--function-name',$ApiFunction,'--runtime','nodejs20.x','--handler','handler.handler','--role',$execRole,'--zip-file',('fileb://' + $ApiPackage),'--timeout','30','--region',$Region,'--output','json') | Out-Null
            Write-Host "Lambda function created for $ApiFunction."
            Add-DeployAction "api: lambda created ($ApiFunction)"
        }
        if ($envArgs.Count -gt 0) {
            Wait-LambdaReady $ApiFunction
            Get-Step 'Applying Lambda environment configuration'
            $base = @('lambda','update-function-configuration','--function-name',$ApiFunction,'--timeout','30','--handler','handler.handler','--region',$Region,'--output','json')
            $all = @($base) + @($envArgs)
            Invoke-Aws $all | Out-Null
            Write-Host "Lambda environment and timeout applied for $ApiFunction."
            Add-DeployAction "api: lambda environment configuration applied ($ApiFunction)"
        }
    } else {
        Write-Host 'API deploy is configured but no package path was provided. This script requires an archive produced by package-api.ps1.'
        Write-Host 'Run: powershell -ExecutionPolicy Bypass -File scripts/deploy/package-api.ps1'
        Add-DeployAction 'api: no package path configured; nothing deployed'
    }
}

    Write-Host ''
    Write-Host 'Deployment checks completed successfully.' -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Run the main body and guarantee a deployment log record on every exit path
# (success, validation abort, AWS error, or thrown failure).
# ---------------------------------------------------------------------------
$exitCode = 0
try {
    Invoke-DeployMain
} catch {
    $errMsg = $_.Exception.Message
    if ($null -ne $script:DeployLog -and [string]::IsNullOrWhiteSpace($script:DeployLog.result)) { $script:DeployLog.result = 'failed' }
    if ($null -ne $script:DeployLog) { $script:DeployLog.error = $errMsg }
    Write-Host "ERROR: $errMsg" -ForegroundColor Red
    $exitCode = 1
} finally {
    if ($null -ne $script:DeployLog) { Write-DeploymentLog }
}
exit $exitCode
