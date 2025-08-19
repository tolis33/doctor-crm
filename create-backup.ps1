# StomaDiagnosis Backup Creation Script
# Creates a complete backup of the system with timestamp

param(
    [string]$BackupName = "",
    [string]$BackupLocation = ".\backups"
)

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    switch ($Color) {
        "Success" { Write-Host $Message -ForegroundColor Green }
        "Warning" { Write-Host $Message -ForegroundColor Yellow }
        "Error" { Write-Host $Message -ForegroundColor Red }
        "Info" { Write-Host $Message -ForegroundColor Cyan }
        "Header" { Write-Host $Message -ForegroundColor Magenta }
        default { Write-Host $Message }
    }
}

# Create timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Set backup name
if ([string]::IsNullOrEmpty($BackupName)) {
    $BackupName = "StomaDiagnosis_Backup_$timestamp"
}

# Create backup directory
$backupPath = Join-Path $BackupLocation $BackupName

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "    StomaDiagnosis Backup Creator       " -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

Write-ColorOutput "Creating backup: $BackupName" "Info"
Write-ColorOutput "Location: $backupPath" "Info"
Write-Host ""

# Create backup directory
try {
    if (-not (Test-Path $BackupLocation)) {
        New-Item -ItemType Directory -Path $BackupLocation -Force | Out-Null
        Write-ColorOutput "Created backup directory: $BackupLocation" "Success"
    }
    
    if (-not (Test-Path $backupPath)) {
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
        Write-ColorOutput "Created backup folder: $backupPath" "Success"
    }
} catch {
    Write-ColorOutput "ERROR: Could not create backup directory: $($_.Exception.Message)" "Error"
    exit 1
}

# Files and directories to include in backup
$itemsToBackup = @(
    # Core HTML files
    "index.html",
    "doctor-crm.html", 
    "diagnosis.html",
    "mapping.html",
    "measurements.html",
    "analysis.html",
    "bone-measurements.html",
    "imaging-window.html",
    "stomadiagnosis-standalone.html",
    "ai-training-ui.html",
    "xray-analysis.html",
    "test-mapping.html",
    
    # Core JavaScript files
    "main.js",
    "data-manager.js",
    "embedded_patients.js",
    "patients_inline.js",
    "local-storage.js",
    "error-handler.js",
    "export-manager.js",
    "export-ui.js",
    "imaging-window.js",
    "sync-protection.js",
    "performance-optimizer.js",
    "search-optimizer.js",
    "utils.js",
    "validation.js",
    "xrays.js",
    "xray-analysis.js",
    "tooth-mapping.js",
    "api-manager.js",
    "ai-backend.js",
    "ai-training.js",
    "ai-training-ui.js",
    "batch-ai-training.js",
    "bone-measurement-system.js",
    "advanced-measurements.js",
    "syntax-check.js",
    "syntax-checker.js",
    "xray-syntax-fixes.js",
    "check-syntax.js",
    
    # Directories
    "css",
    "js",
    "patients",
    "dist",
    "desktop",
    
    # PowerShell scripts
    "server.ps1",
    "simple-server.ps1",
    "sync-protection-powershell.ps1",
    "sync-to-dist.ps1",
    "sync-versions.ps1",
    "cleanup-project.ps1",
    "check-brackets.ps1",
    
    # Configuration files
    "last-sync.json",
    "sync.bat",
    
    # Python scripts
    "convert_all_patients.py",
    "create_inline_patients.py",
    "embed_patients_in_html.py",
    
    # VS Code settings
    ".vscode"
)

# Copy files and directories
$copiedCount = 0
$errorCount = 0

Write-ColorOutput "Starting backup process..." "Info"
Write-Host ""

foreach ($item in $itemsToBackup) {
    if (Test-Path $item) {
        try {
            $destinationPath = Join-Path $backupPath $item
            
            if (Test-Path $item -PathType Container) {
                # It's a directory
                Copy-Item -Path $item -Destination $destinationPath -Recurse -Force
                Write-ColorOutput "[DIR]  Copied: $item" "Success"
            } else {
                # It's a file
                $destinationDir = Split-Path $destinationPath -Parent
                if (-not (Test-Path $destinationDir)) {
                    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
                }
                Copy-Item -Path $item -Destination $destinationPath -Force
                Write-ColorOutput "[FILE] Copied: $item" "Success"
            }
            $copiedCount++
        } catch {
            Write-ColorOutput "[ERROR] Failed to copy $item : $($_.Exception.Message)" "Error"
            $errorCount++
        }
    } else {
        Write-ColorOutput "[SKIP] Not found: $item" "Warning"
    }
}

# Create backup summary
$summaryContent = @"
# StomaDiagnosis Backup Summary

**Backup Name:** $BackupName
**Created:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Location:** $backupPath
**Computer:** $env:COMPUTERNAME
**User:** $env:USERNAME

## Backup Statistics
- **Files/Directories Copied:** $copiedCount
- **Errors:** $errorCount
- **Status:** $(if ($errorCount -eq 0) { "✅ SUCCESS" } else { "⚠️ COMPLETED WITH ERRORS" })

## Contents
This backup includes:
- Core HTML files (index.html, diagnosis.html, etc.)
- JavaScript modules and libraries
- CSS stylesheets
- Patient data and configurations
- Desktop application files
- PowerShell automation scripts
- VS Code settings
- Documentation files

## Restore Instructions
1. Copy the contents of this backup to your desired location
2. Run ``sync-protection-powershell.ps1 check`` to verify integrity
3. Run ``server.ps1`` or ``simple-server.ps1`` to start the application
4. Open http://localhost:8000 in your browser

## Notes
- This backup was created automatically by create-backup.ps1
- All essential files for running StomaDiagnosis are included
- The backup is self-contained and portable

---
*Backup created by StomaDiagnosis Backup System*
"@

try {
    $summaryPath = Join-Path $backupPath "BACKUP_SUMMARY.md"
    Set-Content -Path $summaryPath -Value $summaryContent -Encoding UTF8
    Write-ColorOutput "Created backup summary: BACKUP_SUMMARY.md" "Success"
} catch {
    Write-ColorOutput "Warning: Could not create backup summary" "Warning"
}

# Final status
Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-ColorOutput "BACKUP COMPLETED!" "Header"
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""
Write-ColorOutput "Backup Name: $BackupName" "Info"
Write-ColorOutput "Location: $backupPath" "Info"
Write-ColorOutput "Files Copied: $copiedCount" "Success"
if ($errorCount -gt 0) {
    Write-ColorOutput "Errors: $errorCount" "Error"
}
Write-ColorOutput "Status: $(if ($errorCount -eq 0) { "✅ SUCCESS" } else { "⚠️ COMPLETED WITH ERRORS" })" $(if ($errorCount -eq 0) { "Success" } else { "Warning" })
Write-Host ""
Write-ColorOutput "To restore this backup:" "Info"
Write-ColorOutput "1. Copy contents to desired location" "Info"
Write-ColorOutput "2. Run: .\sync-protection-powershell.ps1 check" "Info"
Write-ColorOutput "3. Run: .\server.ps1" "Info"
Write-Host ""