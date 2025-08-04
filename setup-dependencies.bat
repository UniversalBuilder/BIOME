@echo off
echo Setting up BIOME dependencies...

echo Installing frontend dependencies...
cd projet-analyse-image-frontend
call npm install --silent
cd ..

echo Installing backend dependencies...
cd backend
call npm install --silent
cd ..

echo Setting up Tauri build environment...

echo Creating resources directory...
if not exist "projet-analyse-image-frontend\src-tauri\resources" mkdir "projet-analyse-image-frontend\src-tauri\resources"

echo Copying backend to resources...
if exist "projet-analyse-image-frontend\src-tauri\resources\backend" rmdir /s /q "projet-analyse-image-frontend\src-tauri\resources\backend"
robocopy "backend" "projet-analyse-image-frontend\src-tauri\resources\backend" /E /XD node_modules target .git /XF "*.log" /NFL /NDL /NP >nul

echo Installing backend dependencies in resources...
cd projet-analyse-image-frontend\src-tauri\resources\backend
call npm install --omit=dev --silent
cd ..\..\..\..

echo Setting up Node.js binary...
if not exist "projet-analyse-image-frontend\src-tauri\bin" mkdir "projet-analyse-image-frontend\src-tauri\bin"

for /f "tokens=*" %%i in ('where node') do set NODE_PATH=%%i
copy "%NODE_PATH%" "projet-analyse-image-frontend\src-tauri\bin\node.exe" >nul
copy "%NODE_PATH%" "projet-analyse-image-frontend\src-tauri\bin\node-x86_64-pc-windows-msvc.exe" >nul

echo.
echo All dependencies set up successfully!
echo Next steps:
echo   • Development: cd projet-analyse-image-frontend ^&^& npm run start-both
echo   • Desktop dev: cd projet-analyse-image-frontend ^&^& npm run tauri-dev  
echo   • Production build: cd projet-analyse-image-frontend ^&^& npm run simple-msi
