$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "`nAuronix Seller - Expo SDK 57 repair" -ForegroundColor Cyan
Write-Host "Project: $Root`n"

$nodeRaw = (& node -v).Trim().TrimStart('v')
try {
  $nodeVersion = [version]$nodeRaw
} catch {
  Write-Host "ERROR: Could not read your Node.js version." -ForegroundColor Red
  exit 1
}

$minimumNode = [version]'22.13.0'
if ($nodeVersion -lt $minimumNode) {
  Write-Host "ERROR: Expo SDK 57 requires Node.js 22.13.0 or newer." -ForegroundColor Red
  Write-Host "Installed Node.js: v$nodeRaw" -ForegroundColor Yellow
  exit 1
}
Write-Host "Node.js v$nodeRaw: OK" -ForegroundColor Green

if (-not (Test-Path ".env")) {
  Write-Host "ERROR: .env was not found at $Root\.env" -ForegroundColor Red
  exit 1
}

function Read-DotEnv {
  $values = @{}
  Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
      $parts = $line -split '=', 2
      $name = $parts[0].Trim()
      $value = $parts[1].Trim().Trim('"').Trim("'")
      $values[$name] = $value
    }
  }
  return $values
}

$envValues = Read-DotEnv

# Expo client-side environment variables MUST use EXPO_PUBLIC_*.
# Migrate values from the old Next.js names as well as the accidental
# EXPO_NEXT_PUBLIC_* names created during an earlier repair attempt.
$aliases = [ordered]@{
  'EXPO_PUBLIC_FIREBASE_API_KEY' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY'
  )
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
  )
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    'EXPO_NEXT_PUBLIC_FIREBASE_DB_URL',
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    'NEXT_PUBLIC_FIREBASE_DB_URL',
    'FIREBASE_DB_URL',
    'CLOUD_FIREBASE_DB_URL'
  )
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'FIREBASE_PROJECT_ID'
  )
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'
  )
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
  )
  'EXPO_PUBLIC_FIREBASE_APP_ID' = @(
    'EXPO_NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  )
}

$added = @()
foreach ($target in $aliases.Keys) {
  if ($envValues.ContainsKey($target) -and -not [string]::IsNullOrWhiteSpace($envValues[$target])) {
    continue
  }

  foreach ($source in $aliases[$target]) {
    if ($envValues.ContainsKey($source) -and -not [string]::IsNullOrWhiteSpace($envValues[$source])) {
      Add-Content -Path ".env" -Value "`n$target=$($envValues[$source])"
      $added += "$target <- $source"
      break
    }
  }
}

if ($added.Count -gt 0) {
  Write-Host "Migrated Firebase variable names to EXPO_PUBLIC_*:" -ForegroundColor Green
  $added | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGreen }
  $envValues = Read-DotEnv
}

$requiredEnv = @(
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID'
)

$missing = @()
foreach ($name in $requiredEnv) {
  if (-not $envValues.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($envValues[$name])) {
    $missing += $name
  }
}

if ($missing.Count -gt 0) {
  Write-Host "ERROR: These Firebase values are still missing/blank in .env:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  Write-Host "No compatible legacy Firebase value was found for the missing names." -ForegroundColor Yellow
  exit 1
}

$apiKey = $envValues['EXPO_PUBLIC_FIREBASE_API_KEY']
if ($apiKey -match 'apiKey\s*:' -or $apiKey -match '^YOUR_' -or -not $apiKey.StartsWith('AIza')) {
  Write-Host "ERROR: EXPO_PUBLIC_FIREBASE_API_KEY looks malformed." -ForegroundColor Red
  Write-Host "It must be the Firebase Web API key value and normally starts with AIza." -ForegroundColor Yellow
  exit 1
}

Write-Host "Firebase .env check: OK" -ForegroundColor Green
Write-Host "Cleaning old Expo/Metro/dependency state..." -ForegroundColor Cyan

Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 700

if (Test-Path ".expo") { cmd /c "rmdir /s /q .expo" }
if (Test-Path "node_modules") { cmd /c "rmdir /s /q node_modules" }
if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force }

Write-Host "Installing clean dependencies..." -ForegroundColor Cyan
& npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Aligning all Expo SDK 57 packages..." -ForegroundColor Cyan
& npx expo install --fix
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Running Expo Doctor..." -ForegroundColor Cyan
& npx expo-doctor@latest
if ($LASTEXITCODE -ne 0) {
  Write-Host "Expo Doctor reported issues. Review the output above before continuing." -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "Running TypeScript check..." -ForegroundColor Cyan
& npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
  Write-Host "TypeScript found code errors. The dependency repair is complete, but these errors must be fixed." -ForegroundColor Yellow
  exit $LASTEXITCODE
}

Write-Host "`nRepair complete. Starting Metro with a fresh cache...`n" -ForegroundColor Green
& npx expo start --clear
