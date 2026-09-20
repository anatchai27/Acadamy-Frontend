$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'ScriptRunDev\Run-Dev.ps1'
if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
    throw "Development runner not found: $scriptPath"
}

& powershell.exe -ExecutionPolicy Bypass -File $scriptPath
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
