[CmdletBinding()]
param(
    [string]$CurrentSpec = (Join-Path $PSScriptRoot '..\Front\docAPI\api-spect.json'),
    [string]$TargetSpec = (Join-Path $PSScriptRoot '..\Front\docAPI\api-target.json'),
    [switch]$RequireExplicitStatus
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Operations($document) {
    $operations = @{}
    foreach ($pathProperty in $document.paths.PSObject.Properties) {
        foreach ($operationProperty in $pathProperty.Value.PSObject.Properties) {
            if ($operationProperty.Name -in @('get', 'post', 'put', 'patch', 'delete', 'options', 'head')) {
                $key = "$($pathProperty.Name) $($operationProperty.Name.ToUpperInvariant())"
                $operations[$key] = $operationProperty.Value
            }
        }
    }
    return $operations
}

function Get-ReferenceNames($document) {
    $raw = $document | ConvertTo-Json -Depth 100 -Compress
    return [regex]::Matches($raw, '#/components/(schemas|responses)/([A-Za-z0-9_]+)') |
        ForEach-Object { $_.Value } |
        Sort-Object -Unique
}

function Get-OptionalValue($object, [string]$name) {
    $property = $object.PSObject.Properties[$name]
    if ($null -eq $property) { return $null }
    return $property.Value
}

$current = Get-Content -LiteralPath $CurrentSpec -Raw | ConvertFrom-Json
$target = Get-Content -LiteralPath $TargetSpec -Raw | ConvertFrom-Json
$currentOperations = Get-Operations $current
$targetOperations = Get-Operations $target
$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

foreach ($key in $targetOperations.Keys) {
    $operation = $targetOperations[$key]
    $declaredStatus = Get-OptionalValue $operation 'x-implementation-status'
    $isCurrent = $currentOperations.ContainsKey($key)
    $effectiveStatus = if ($null -ne $declaredStatus) { [string]$declaredStatus } elseif ($isCurrent) { 'implemented' } else { 'new' }

    if ($effectiveStatus -notin @('implemented', 'partial', 'new')) {
        $errors.Add("$key has invalid x-implementation-status '$effectiveStatus'")
    }
    if ($effectiveStatus -eq 'implemented' -and -not $isCurrent) {
        $errors.Add("$key is marked implemented but is absent from current API")
    }
    if ($effectiveStatus -eq 'new' -and $isCurrent) {
        $warnings.Add("$key is marked new but already exists in current API")
    }
    if ($RequireExplicitStatus -and $null -eq $declaredStatus) {
        $errors.Add("$key has no explicit x-implementation-status")
    }
    if ($effectiveStatus -ne 'new' -and $null -eq (Get-OptionalValue $operation 'security')) {
        $warnings.Add("$key has no security declaration")
    }
    if ($null -eq (Get-OptionalValue $operation 'x-roles')) {
        $warnings.Add("$key has no x-roles declaration")
    }
}

foreach ($key in $currentOperations.Keys) {
    if (-not $targetOperations.ContainsKey($key)) {
        $errors.Add("Current operation is missing from target spec: $key")
    }
}

$operationIds = @($targetOperations.Values | ForEach-Object { Get-OptionalValue $_ 'operationId' } | Where-Object { $_ })
$duplicateOperationIds = @($operationIds | Group-Object | Where-Object { $_.Count -gt 1 })
foreach ($duplicate in $duplicateOperationIds) {
    $errors.Add("Duplicate operationId '$($duplicate.Name)'")
}

foreach ($reference in Get-ReferenceNames $target) {
    $parts = $reference -split '/'
    $section = $parts[2]
    $name = $parts[3]
    if ($null -eq $target.components.$section -or $null -eq $target.components.$section.PSObject.Properties[$name]) {
        $errors.Add("Unresolved reference: $reference")
    }
}

[pscustomobject]@{
    CurrentOperations = $currentOperations.Count
    TargetOperations = $targetOperations.Count
    Implemented = @($targetOperations.Keys | Where-Object {
        $op = $targetOperations[$_]
        $status = Get-OptionalValue $op 'x-implementation-status'
        (($null -ne $status -and $status -eq 'implemented') -or
            ($null -eq $status -and $currentOperations.ContainsKey($_)))
    }).Count
    Partial = @($targetOperations.Values | Where-Object { (Get-OptionalValue $_ 'x-implementation-status') -eq 'partial' }).Count
    New = @($targetOperations.Values | Where-Object { (Get-OptionalValue $_ 'x-implementation-status') -eq 'new' }).Count
    Errors = $errors.Count
    Warnings = $warnings.Count
} | Format-List

if ($warnings.Count -gt 0) {
    Write-Host 'Warnings:' -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "- $_" }
}
if ($errors.Count -gt 0) {
    Write-Host 'Errors:' -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "- $_" }
    exit 1
}

Write-Host 'API contract validation passed.' -ForegroundColor Green
exit 0
