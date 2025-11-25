@echo off
setlocal
title BIOME Web Mode Launcher

echo Starting BIOME Web Mode...

:: Set environment to production
set NODE_ENV=production

:: Get the directory where this script is located
set "APP_DIR=%~dp0"

:: Look for Node.js executable
if exist "%APP_DIR%node.exe" (
    set "NODE_EXE=%APP_DIR%node.exe"
) else (
    echo Bundled Node.js not found, trying system Node.js...
    set "NODE_EXE=node"
)

:: Check if production-server.js exists
if not exist "%APP_DIR%production-server.js" (
    echo Error: production-server.js not found in %APP_DIR%
    pause
    exit /b 1
)

:: Start the server in a new window
echo Starting server...
start "BIOME Server" "%NODE_EXE%" "%APP_DIR%production-server.js"

:: Wait a moment for the server to start
echo Waiting for server to initialize...
timeout /t 3 /nobreak >nul

:: Open the default browser
echo Opening browser...
start http://localhost:3001

echo.
echo BIOME Web Mode is running.
echo You can close this window, but keep the "BIOME Server" window open.
echo.
timeout /t 5
