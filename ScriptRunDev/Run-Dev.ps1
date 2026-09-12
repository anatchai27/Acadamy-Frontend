$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$frontPath = Join-Path $projectRoot 'Front'
$apiPath = Join-Path $projectRoot 'API'
$lineLiffPath = Join-Path $projectRoot 'LineLiff'
$appSettingsPath = Join-Path $apiPath 'appsettings.json'

foreach ($path in @($frontPath, $apiPath, $lineLiffPath)) {
    if (-not (Test-Path -LiteralPath $path -PathType Container)) {
        throw "Project folder not found: $path"
    }
}

if (-not (Test-Path -LiteralPath $appSettingsPath -PathType Leaf)) {
    throw "API configuration not found: $appSettingsPath"
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm was not found. Install Node.js and check PATH.'
}

if (-not (Get-Command dotnet.exe -ErrorAction SilentlyContinue)) {
    throw 'dotnet was not found. Install the .NET SDK and check PATH.'
}

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    throw 'ngrok was not found. Install ngrok and check PATH.'
}

function Start-DevWindow {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command
    )

    $windowTitle = "Acadamy - $Name Dev"
    $windowCommand = "`$Host.UI.RawUI.WindowTitle = '$windowTitle'; $Command"

    Start-Process `
        -FilePath 'powershell.exe' `
        -WorkingDirectory $WorkingDirectory `
        -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $windowCommand)
}

function Get-NgrokHttpsUrl {
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Seconds 1

        try {
            $tunnel = (Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels').tunnels |
                Where-Object { $_.proto -eq 'https' } |
                Select-Object -First 1

            if ($null -ne $tunnel -and -not [string]::IsNullOrWhiteSpace($tunnel.public_url)) {
                return $tunnel.public_url.TrimEnd('/')
            }
        } catch {
            # Wait for ngrok's local API to become available.
        }
    }

    throw 'Could not retrieve the ngrok public URL.'
}

function Add-CorsOriginToSettings {
    param(
        [string]$FilePath,
        [string]$Origin
    )

    $settings = Get-Content -LiteralPath $FilePath -Raw | ConvertFrom-Json

    if ($null -eq $settings.Cors) {
        $settings | Add-Member -MemberType NoteProperty -Name 'Cors' -Value ([pscustomobject]@{})
    }

    if ($null -eq $settings.Cors.AllowedOrigins) {
        $settings.Cors | Add-Member -MemberType NoteProperty -Name 'AllowedOrigins' -Value @()
    }

    $origins = @($settings.Cors.AllowedOrigins | ForEach-Object { [string]$_ })
    if ($origins -contains $Origin) {
        Write-Host "CORS already contains $Origin" -ForegroundColor Gray
        return
    }

    $settings.Cors.AllowedOrigins = @($origins + $Origin)
    $updatedContent = $settings | ConvertTo-Json -Depth 10
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($FilePath, $updatedContent, $utf8NoBom)

    Write-Host "Added $Origin to API appsettings.json CORS." -ForegroundColor Green
}

Start-DevWindow -Name 'Front' -WorkingDirectory $frontPath -Command 'npm run dev'
Start-DevWindow -Name 'LineLiff' -WorkingDirectory $lineLiffPath -Command 'powershell.exe -ExecutionPolicy Bypass -File .\run-dev-ngrok.ps1'

Write-Host 'Waiting for the LineLiff ngrok HTTPS URL...' -ForegroundColor Yellow
$ngrokUrl = Get-NgrokHttpsUrl
$ngrokOrigin = $ngrokUrl
Add-CorsOriginToSettings -FilePath $appSettingsPath -Origin $ngrokOrigin

Start-DevWindow -Name 'API' -WorkingDirectory $apiPath -Command 'dotnet watch run --launch-profile http'

Write-Host ''
Write-Host 'Started all 3 development servers.' -ForegroundColor Green
Write-Host "LineLiff HTTPS: $ngrokUrl/liff/" -ForegroundColor Cyan
Write-Host 'The current ngrok origin was added to API/appsettings.json.' -ForegroundColor Gray
