#Requires -Version 5.1
<#
.SYNOPSIS
  Build HappyBites admin + PWA and create a distributable ZIP.

.DESCRIPTION
  Reads .distignore, runs npm builds, stages files, and outputs dist/happybites-<version>.zip

.PARAMETER SkipBuild
  Skip npm build steps (use existing public/admin and public/pwa output).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\release.ps1
#>
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$PluginRoot = Split-Path -Parent $PSScriptRoot
$DistIgnorePath = Join-Path $PluginRoot ".distignore"
$DistDir = Join-Path $PluginRoot "dist"

function Get-PluginVersion {
    param([string]$MainFile)
    $content = Get-Content -Path $MainFile -Raw
    if ($content -match 'Version:\s*([0-9]+(?:\.[0-9]+)*)') {
        return $Matches[1]
    }
    throw "Could not read plugin version from $MainFile"
}

function Read-DistIgnoreRules {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw ".distignore not found at $Path"
    }

    $rules = @()
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if ($trimmed -eq "" -or $trimmed.StartsWith("#")) {
            continue
        }
        $rules += $trimmed
    }

    return $rules
}

function Test-ShouldExclude {
    param(
        [string]$RelativePath,
        [string[]]$Rules
    )

    $normalized = $RelativePath -replace "\\", "/"

    foreach ($rule in $Rules) {
        if ($rule.StartsWith("!")) {
            continue
        }

        if ($rule.EndsWith("/")) {
            $dir = $rule.TrimEnd("/")
            if ($normalized -eq $dir -or $normalized.StartsWith("$dir/")) {
                return $true
            }
            continue
        }

        if ($rule -like "*.*") {
            if ($normalized -like $rule) {
                return $true
            }
            $leaf = Split-Path $normalized -Leaf
            if ($leaf -like $rule) {
                return $true
            }
            continue
        }

        if ($normalized -eq $rule) {
            return $true
        }
    }

    foreach ($rule in $Rules) {
        if (-not $rule.StartsWith("!")) {
            continue
        }

        $include = $rule.Substring(1)
        if ($normalized -eq $include) {
            return $false
        }
    }

    return $false
}

function Invoke-BuildStep {
    param(
        [string]$Name,
        [string]$Directory
    )

    Write-Host "==> Building $Name..." -ForegroundColor Cyan
    Push-Location $Directory
    try {
        if (-not (Test-Path "node_modules")) {
            npm install
            if ($LASTEXITCODE -ne 0) { throw "npm install failed in $Directory" }
        }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed in $Directory" }
    }
    finally {
        Pop-Location
    }
}

$version = Get-PluginVersion -MainFile (Join-Path $PluginRoot "happybites.php")
$rules = Read-DistIgnoreRules -Path $DistIgnorePath
$zipName = "happybites-$version.zip"
$stagingRoot = Join-Path $env:TEMP "happybites-release-$version"
$stagingDir = Join-Path $stagingRoot "happybites"

Write-Host "HappyBites release $version" -ForegroundColor Green

if (-not $SkipBuild) {
    Invoke-BuildStep -Name "admin-app" -Directory (Join-Path $PluginRoot "admin-app")
    Invoke-BuildStep -Name "pwa" -Directory (Join-Path $PluginRoot "pwa")
}
else {
    Write-Host "==> Skipping builds (-SkipBuild)" -ForegroundColor Yellow
}

if (Test-Path $stagingRoot) {
    Remove-Item $stagingRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

Write-Host "==> Staging files..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $PluginRoot -Recurse -File -Force
foreach ($file in $files) {
    $relative = $file.FullName.Substring($PluginRoot.Length).TrimStart("\", "/")
    if (Test-ShouldExclude -RelativePath $relative -Rules $rules) {
        continue
    }

    $target = Join-Path $stagingDir $relative
    $targetParent = Split-Path $target -Parent
    if (-not (Test-Path $targetParent)) {
        New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
    }
    Copy-Item -Path $file.FullName -Destination $target -Force
}

if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

$zipPath = Join-Path $DistDir $zipName
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Write-Host "==> Creating ZIP..." -ForegroundColor Cyan
Compress-Archive -Path $stagingDir -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item $stagingRoot -Recurse -Force

$sizeMb = [Math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "Done: $zipPath ($sizeMb MB)" -ForegroundColor Green
