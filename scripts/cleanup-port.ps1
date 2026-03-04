# Cleanup Port 3001 (PowerShell Version)
#
# Kills any lingering Node.js processes listening on port 3001
# to prevent EADDRINUSE errors when starting tauri-dev.
#
# Usage: .\scripts\cleanup-port.ps1

param(
    [switch]$Verbose = $false
)

$PORT = 3001

Write-Host "`n📦 BIOME Port $PORT Cleanup Utility`n" -ForegroundColor Cyan

try {
    Write-Host "🔍 Checking for processes on port $PORT..." -ForegroundColor Yellow
    
    # Get all TCP connections on the specified port
    $connections = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction SilentlyContinue
    
    if ($null -eq $connections -or $connections.Count -eq 0) {
        Write-Host "✅ Port $PORT is free. No cleanup needed." -ForegroundColor Green
        Write-Host "`n✨ Cleanup complete. Ready to start development.`n" -ForegroundColor Green
        exit 0
    }
    
    # Convert single result to array for consistent iteration
    if ($connections -is [Single]) {
        $connections = @($connections)
    }
    
    Write-Host "Found $($connections.Count) process(es) on port $PORT" -ForegroundColor Yellow
    
    # Kill each process
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        
        try {
            $process = Get-Process -Id $pid -ErrorAction Stop
            $processName = $process.Name
            
            Write-Host "🔪 Killing process $pid ($processName)..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction Stop
            Start-Sleep -Milliseconds 500
            
            Write-Host "✅ Process $pid terminated." -ForegroundColor Green
        }
        catch {
            if ($_.Exception.Message -like "*cannot find a process with the process identifier*") {
                Write-Host "⚠️  Process $pid already terminated." -ForegroundColor Yellow
            } else {
                Write-Host "⚠️  Failed to kill process $pid`: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n✨ Cleanup complete. Ready to start development.`n" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Error during cleanup: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`n✨ Continuing anyway. Ready to start development.`n" -ForegroundColor Green
    # Don't throw - this is a best-effort cleanup utility
}
