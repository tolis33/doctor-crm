# Cleanup Script for Stomadiagnosis Project
# This script cleans unnecessary files and folders

Write-Host "Cleanup starting..." -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Gray

# Items to delete
$itemsToDelete = @(
    # Backup folders
    "COMPLETE_BACKUP_2025-08-13_11-58",
    "backup_ai_system_2025-08-13_11-55",
    "backup_complete_2025-01-15",
    "backup_patient_modal_improvements_2025-08-13_09-44",
    "patients_backup_2025-01-15",
    "index_backup.html",
    
    # Old folders
    "Old build",
    "Stomadiagnosisold",
    "NewBuild",
    "maping",
    
    # Backup files
    "patients_backup.json",
    "embedded_patients_backup_2025-01-15.js",
    "index_backup_xray_fix_2025-01-15.html",
    "stomadiagnosis_backup_2025-08-05_11-50-14.json",
    "stomadiagnosis_backup_2025-08-05_19-52-34.json",
    
    # ZIP files
    "AI_Training_System_Backup_2025-08-13.zip",
    "COMPLETE_SYSTEM_BACKUP_2025-08-13.zip",
    "desktop.zip",
    
    # Test and Debug files
    "debug-iframe.html",
    "debug-main-script.html",
    "debug-maximize.html",
    "debug-patients.html",
    "debug-syntax.html",
    "debug_search.html",
    "test-data.html",
    "test-embedded-loading.html",
    "test-external-scripts.html",
    "test-iframe-src.html",
    "test-index-syntax.html",
    "test-maximize-functionality.html",
    "test-patient-modal.html",
    "test-syntax.html",
    "validate-syntax.html",
    "syntax-test.html",
    "maximize-test.html",
    "modal-focus-demo.html",
    "simple-test.html",
    "simple-embedded-test.html",
    "batch-training-demo.html",
    "bone-measurement-demo.html",
    "measurements-demo.html",
    "notes-demo.html",
    "patient-demo.html",
    "tooth-history-demo.html",
    "tooth-mapping-test.html",
    "xray-demo.html",
    "local-storage-demo.html",
    "desktop-bridge-demo.html",
    "demo-aggelopoulos.html",
    "search_test.html",
    "simple_search_test.html",
    
    # Temporary files
    "patients_array_only.txt",
    "patients_data_extract.txt",
    "patients_inline_script.txt",
    
    # Duplicate files
    "stomadiagnosis_fixed.html",
    "doctor-crm-desktop.html",
    
    # Visual Studio files
    ".vs",
    
    # Old CSV
    "test1.csv"
)

# Counters
$deletedFiles = 0
$deletedFolders = 0
$totalSizeSaved = 0

# Function to calculate folder size
function Get-FolderSize {
    param([string]$Path)
    if (Test-Path $Path) {
        $size = (Get-ChildItem -Path $Path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        return if ($size) { $size } else { 0 }
    }
    return 0
}

# Function to safely delete items
function Remove-ItemSafely {
    param(
        [string]$Path,
        [string]$Type = "File"
    )
    
    if (Test-Path $Path) {
        try {
            $size = if ($Type -eq "Folder") { Get-FolderSize $Path } else { (Get-Item $Path -ErrorAction SilentlyContinue).Length }
            if (-not $size) { $size = 0 }
            
            Write-Host "Deleting $Type`: $Path" -ForegroundColor Yellow
            
            if ($Type -eq "Folder") {
                Remove-Item -Path $Path -Recurse -Force -ErrorAction SilentlyContinue
                $script:deletedFolders++
            } else {
                Remove-Item -Path $Path -Force -ErrorAction SilentlyContinue
                $script:deletedFiles++
            }
            
            $script:totalSizeSaved += $size
            $sizeMB = [math]::Round($size/1MB, 2)
            Write-Host "   Deleted ($sizeMB MB)" -ForegroundColor Green
            
        } catch {
            Write-Host "   Error deleting: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Delete files and folders
foreach ($item in $itemsToDelete) {
    $fullPath = Join-Path (Get-Location) $item
    if (Test-Path $fullPath -PathType Container) {
        Remove-ItemSafely $fullPath "Folder"
    } elseif (Test-Path $fullPath) {
        Remove-ItemSafely $fullPath "File"
    }
}

# Clean backup files with patterns
Write-Host "\nCleaning backup files with patterns..." -ForegroundColor Cyan

$backupPatterns = @(
    "*.backup-*",
    "*_backup_*.json",
    "*_backup_*.js",
    "*_backup_*.html"
)

foreach ($pattern in $backupPatterns) {
    $matches = Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
        $fullPath = Join-Path (Get-Location) $match
        if (Test-Path $fullPath -PathType Container) {
            Remove-ItemSafely $fullPath "Folder"
        } else {
            Remove-ItemSafely $fullPath "File"
        }
    }
}

# Clean Visual Studio build files
Write-Host "\nCleaning Visual Studio build files..." -ForegroundColor Cyan

$buildPaths = @(
    "desktop\Stomadiagnosis.Host\bin\Debug",
    "desktop\Stomadiagnosis.Host\obj\Debug"
)

foreach ($buildPath in $buildPaths) {
    $fullBuildPath = Join-Path (Get-Location) $buildPath
    if (Test-Path $fullBuildPath) {
        Remove-ItemSafely $fullBuildPath "Folder"
    }
}

# Results
Write-Host "\n" + "=" * 50 -ForegroundColor Gray
Write-Host "Cleanup Results:" -ForegroundColor Cyan
Write-Host "   Folders deleted: $deletedFolders" -ForegroundColor White
Write-Host "   Files deleted: $deletedFiles" -ForegroundColor White
Write-Host "   Space saved: $([math]::Round($totalSizeSaved/1MB, 2)) MB" -ForegroundColor Green

Write-Host "\nCleanup completed successfully!" -ForegroundColor Green
Write-Host "Project is now cleaner and more organized." -ForegroundColor Blue

# Suggestions
Write-Host "\nSuggestions:" -ForegroundColor Yellow
Write-Host "   - Run 'git status' to see changes" -ForegroundColor White
Write-Host "   - Commit changes if satisfied" -ForegroundColor White
Write-Host "   - Run sync script for synchronization" -ForegroundColor White

Write-Host "\nTo run sync:" -ForegroundColor Cyan
Write-Host "   .\sync-protection-powershell.ps1 check" -ForegroundColor Gray
Write-Host "   .\sync-protection-powershell.ps1 sync" -ForegroundColor Gray