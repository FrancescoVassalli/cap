# Builds the CAP backend into a self-contained AWS Lambda deployment artifact.
# Works on Windows PowerShell (and pwsh) with no extra tooling beyond Node/npm.
#
# Output: a zip at <RepoRoot>\dist-lambda\cap-api.zip (or the -OutDir/-OutFile
# you pass) containing the compiled handler (dist root), the local modules
# (handlers/, presigner/, repository/, validation/), and a node_modules/ tree
# holding exactly the runtime dependencies the backend imports.
#
# The Lambda handler name to configure is: handler.handler
#
# Usage:
#   .\scripts\deploy\package-api.ps1 [-OutDir <dir>] [-OutFile <file>] [-SkipBuild]
[CmdletBinding()]
param(
    [string]$OutDir = "",
    [string]$OutFile = "",
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
# Resolve repo root = directory that contains package.json (this script's parent's parent).
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$BackendDist = Join-Path $RepoRoot 'backend\dist'
$Staging = Join-Path $RepoRoot 'dist-lambda\staging'
$OutDirFallback = Join-Path $RepoRoot 'dist-lambda'

if ([string]::IsNullOrWhiteSpace($OutDir)) { $OutDir = $OutDirFallback }
if ([string]::IsNullOrWhiteSpace($OutFile)) {
    $OutFile = Join-Path $OutDir 'cap-api.zip'
}

function Write-Step([string]$msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Err([string]$msg) { Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Write-Err 'node is required.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Write-Err 'npm is required.' }

# 1. Compile the backend TypeScript to ES modules.
if (-not $SkipBuild) {
    Write-Step 'Compiling backend (tsc -p backend/tsconfig.build.json)'
    Push-Location $RepoRoot
    try { & npm run build:api } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0) { Write-Err "backend build failed (exit $LASTEXITCODE)." }
}

if (-not (Test-Path (Join-Path $BackendDist 'handler.js'))) {
    Write-Err "Compiled Lambda entrypoint not found at backend\dist\handler.js. Run the build first."
}

# 2. Reset the staging directory.
Write-Step 'Preparing staging directory'
if (Test-Path $Staging) { Remove-Item -LiteralPath $Staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Staging | Out-Null

# 3. Copy the compiled modules to the package root (preserving relative imports).
Copy-Item -Path (Join-Path $BackendDist '*') -Destination $Staging -Recurse -Force

# 4. Emit a minimal package.json so `npm install --omit=dev` fetches only the
#    runtime AWS SDK dependencies the handler actually needs.
$runtimeDeps = @{
    '@aws-sdk/client-s3' = '*'
    '@aws-sdk/s3-request-presigner' = '*'
}
$pkg = [ordered]@{
    name = 'cap-api'
    version = '0.0.0'
    private = $true
    type = 'module'
    main = 'handler.js'
    dependencies = $runtimeDeps
}
$pkg | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $Staging 'package.json') -Encoding UTF8

# 5. Install runtime dependencies (no dev deps, no scripts).
Write-Step 'Installing runtime dependencies (npm install --omit=dev)'
Push-Location $Staging
try {
    & npm install --omit=dev --no-audit --no-fund --ignore-scripts --no-package-lock
} finally { Pop-Location }
if ($LASTEXITCODE -ne 0) { Write-Err "npm install in staging failed (exit $LASTEXITCODE)." }

# 6. Prune any accidentally-dev-only packages and the source maps, then zip.
Remove-Item -Path (Join-Path $Staging 'node_modules\.bin') -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $Staging -Recurse -File -Filter '*.map' | ForEach-Object { Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
if (Test-Path $OutFile) { Remove-Item -LiteralPath $OutFile -Force }

Write-Step "Zipping Lambda artifact -> $OutFile"
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($OutFile, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $files = Get-ChildItem -Path $Staging -Recurse -File
    $base = $Staging.TrimEnd('\') + '\'
    foreach ($f in $files) {
        $entryName = $f.FullName.Substring($base.Length).Replace('\', '/')
        # zip slashes are forward slashes; add entry relative to package root.
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $f.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal
        ) | Out-Null
    }
} finally {
    $zip.Dispose()
}

$zipSizeKB = [math]::Round((Get-Item $OutFile).Length / 1KB, 1)
Write-Host "Package created: $OutFile ($zipSizeKB KB)" -ForegroundColor Green
Write-Host "Lambda handler:  handler.handler" -ForegroundColor Green
