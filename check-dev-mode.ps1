# Dev Mode Check Script

Write-Host "=== DEV MODE CHECK ===" -ForegroundColor Cyan
Write-Host ""

# Check web server
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 2
    Write-Host "Web Server: Running at http://localhost:8080" -ForegroundColor Green
}
catch {
    Write-Host "Web Server: NOT running at http://localhost:8080" -ForegroundColor Red
}

# Check desktop app
$desktopProcess = Get-Process | Where-Object {$_.ProcessName -like "*Stomadiagnosis*"}
if ($desktopProcess) {
    Write-Host "Desktop App: Running (PID: $($desktopProcess.Id))" -ForegroundColor Green
}
else {
    Write-Host "Desktop App: NOT running" -ForegroundColor Red
}

# Check environment variable
$devUrl = $env:STOMA_DEV_URL
if ($devUrl) {
    Write-Host "STOMA_DEV_URL: $devUrl" -ForegroundColor Green
}
else {
    Write-Host "STOMA_DEV_URL: NOT set" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== INSTRUCTIONS ===" -ForegroundColor Yellow
Write-Host "1. DevTools should open automatically in desktop app" -ForegroundColor White
Write-Host "2. If not, press Ctrl+Shift+I in desktop app" -ForegroundColor White
Write-Host "3. In DevTools Console, run:" -ForegroundColor White
Write-Host "   location.href" -ForegroundColor Cyan
Write-Host "   Array.from(document.styleSheets).map(s=>s.href || 'inline')" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== EXPECTED RESULTS ===" -ForegroundColor Yellow
Write-Host "CORRECT (Dev Mode): location.href = 'http://localhost:8080/...'" -ForegroundColor Green
Write-Host "WRONG (Prod Mode): location.href = 'https://appassets/index.html' or 'file:///...'" -ForegroundColor Red
Write-Host ""
Write-Host "If you see 'appassets' or 'file:///', app is in PROD mode." -ForegroundColor Yellow
Write-Host "Run: npm run start-both or restart with STOMA_DEV_URL" -ForegroundColor Yellow