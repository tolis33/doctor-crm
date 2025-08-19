# Auto-sync script για συγχρονισμό web αρχείων στο ui folder της desktop εφαρμογής

# Ορισμός paths
$webPath = $PSScriptRoot
$uiPath = Join-Path $PSScriptRoot "desktop\Stomadiagnosis.Host\bin\Debug\net9.0-windows\win-x64\ui"

Write-Host "Starting auto-sync from web to ui folder..." -ForegroundColor Green
Write-Host "Source: $webPath" -ForegroundColor Yellow
Write-Host "Target: $uiPath" -ForegroundColor Yellow

# Αρχική αντιγραφή όλων των αρχείων
Write-Host "Initial sync..." -ForegroundColor Cyan
robocopy $webPath $uiPath *.html *.css *.js /S /XD desktop dist backups .vscode .git node_modules /XF *.ps1 *.py *.bat *.md package.json *.log *.tmp /NP

if (Test-Path $uiPath) {
    Write-Host "Initial sync completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to create ui folder!" -ForegroundColor Red
    exit 1
}

# Δημιουργία FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $webPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

Write-Host "File watcher started. Monitoring changes..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

# Event handlers
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $changeType = $Event.SourceEventArgs.ChangeType
    $name = $Event.SourceEventArgs.Name
    
    # Φιλτράρισμα αρχείων που μας ενδιαφέρουν
    $extension = [System.IO.Path]::GetExtension($name).ToLower()
    if ($extension -eq ".html" -or $extension -eq ".css" -or $extension -eq ".js") {
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] $changeType : $name" -ForegroundColor Yellow
        
        # Μικρή καθυστέρηση για να αποφύγουμε πολλαπλά events
        Start-Sleep -Milliseconds 500
        
        # Συγχρονισμός με robocopy
        robocopy $webPath $uiPath *.html *.css *.js /S /XD desktop dist backups .vscode .git node_modules /XF *.ps1 *.py *.bat *.md package.json *.log *.tmp /NP > $null
        
        Write-Host "Synced!" -ForegroundColor Green
    }
}

# Καταχώρηση event handlers
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action

try {
    # Κρατάμε το script ενεργό
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    # Cleanup
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
    Write-Host "Auto-sync stopped" -ForegroundColor Red
}