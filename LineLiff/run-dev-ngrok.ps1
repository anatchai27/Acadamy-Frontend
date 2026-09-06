$ErrorActionPreference = 'Stop'

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host 'Starting LineLiff Vite server on port 5173...'
Start-Process -FilePath 'npm.cmd' `
  -ArgumentList 'run', 'dev' `
  -WorkingDirectory $projectPath

Start-Sleep -Seconds 2

Write-Host 'Starting ngrok tunnel...'
Start-Process -FilePath 'ngrok' `
  -ArgumentList 'http', '5173' `
  -WorkingDirectory $projectPath

$tunnel = $null
for ($attempt = 0; $attempt -lt 15 -and $null -eq $tunnel; $attempt++) {
  Start-Sleep -Seconds 1

  try {
    $tunnel = (Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels').tunnels |
      Where-Object { $_.proto -eq 'https' } |
      Select-Object -First 1
  } catch {
    # Wait for ngrok's local API to become available.
  }
}

if ($null -eq $tunnel) {
  Write-Error 'Could not retrieve the ngrok public URL.'
  exit 1
}

Write-Host ''
Write-Host 'LineLiff is running:' -ForegroundColor Green
Write-Host 'Local:  http://localhost:5173/liff/'
Write-Host "LIFF:   $($tunnel.public_url)/liff/" -ForegroundColor Cyan
Write-Host ''
Write-Host 'Stop the processes from the terminal or Task Manager when finished.'
