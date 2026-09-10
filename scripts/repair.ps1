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
  Write-Host "Update Node.js, reopen PowerShell, then run npm run repair again." -ForegroundColor Yellow
  exit 1
}
Write-Host "Node.js v$nodeRaw: OK" -ForegroundColor Green

if (-not (Test-Path ".env")) {
  Write-Host "ERROR: .env was not found at $Root\.env" -ForegroundColor Red
  exit 1
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

$envValues = @{}
Get-Content ".env" | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
    $parts = $line -split '=', 2
    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $envValues[$name] = $value
  }
}

$missing = @()
foreach ($name in $requiredEnv) {
  if (-not $envValues.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($envValues[$name])) {
    $missing += $name
  }
}

if ($missing.Count -gt 0) {
  Write-Host "ERROR: These Firebase values are missing/blank in .env:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
  exit 1
}

$apiKey = $envValues['EXPO_PUBLIC_FIREBASE_API_KEY']
if ($apiKey -match 'apiKey\s*:' -or $apiKey -match '^YOUR_' -or -not $apiKey.StartsWith('AIza')) {
  Write-Host "ERROR: EXPO_PUBLIC_FIREBASE_API_KEY looks malformed." -ForegroundColor Red
  Write-Host "Paste ONLY the Firebase Web API key value. It normally starts with AIza." -ForegroundColor Yellow
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
