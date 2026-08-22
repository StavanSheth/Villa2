@echo off
setlocal enabledelayedexpansion

:: gitnexus-index.bat
:: Automates GitNexus local indexing and wiki generation

echo ===================================================
echo GitNexus Local Indexer ^& Wiki Generator
echo ===================================================
echo.

:: 1. Check GitNexus Installation
call gitnexus --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] GitNexus is not installed globally.
    echo Please run: npm install -g gitnexus@latest
    exit /b 1
)

:: 2. Get Target Repository
set "TARGET_REPO=%~1"
if "%TARGET_REPO%"=="" (
    set /p "TARGET_REPO=Enter absolute path to the target repository: "
)

:: Remove trailing slash if present
if "%TARGET_REPO:~-1%"=="\" set "TARGET_REPO=%TARGET_REPO:~0,-1%"

:: 3. Validate Repository
if not exist "%TARGET_REPO%\.git\" (
    echo [ERROR] The path "%TARGET_REPO%" is not a valid Git repository.
    exit /b 1
)

:: 4. Get Output Destination
echo.
echo By default, the index and wiki will be saved to:
echo %TARGET_REPO%\.gitnexus\
set /p "CUSTOM_DEST=Enter a different output path (or press Enter to use default): "

if "%CUSTOM_DEST%"=="" (
    set "DEST_DIR=%TARGET_REPO%\.gitnexus"
    set "IS_CUSTOM_DEST=0"
) else (
    set "DEST_DIR=%CUSTOM_DEST%"
    set "IS_CUSTOM_DEST=1"
    if not exist "!DEST_DIR!" mkdir "!DEST_DIR!"
)

:: 5. Run Analysis
echo.
echo [1/3] Running GitNexus analysis on %TARGET_REPO%...
cd /d "%TARGET_REPO%"
call gitnexus analyze

if %errorlevel% neq 0 (
    echo [ERROR] GitNexus analysis failed.
    exit /b 1
)

:: 6. Generate Wiki
echo.
echo [2/3] Generating Wiki locally (no internet required)...
set "SCRIPT_DIR=%~dp0"
call node "%SCRIPT_DIR%gitnexus-wiki-local.mjs" "%TARGET_REPO%"

if %errorlevel% neq 0 (
    echo [ERROR] Wiki generation failed.
    exit /b 1
)

:: 7. Move Files (if custom destination)
if "!IS_CUSTOM_DEST!"=="1" (
    echo.
    echo [3/3] Copying files to custom destination: !DEST_DIR!...
    copy /Y "%TARGET_REPO%\.gitnexus\lbug" "!DEST_DIR!\lbug" >nul
    copy /Y "%TARGET_REPO%\.gitnexus\wiki.md" "!DEST_DIR!\wiki.md" >nul
    copy /Y "%TARGET_REPO%\.gitnexus\gitnexus.json" "!DEST_DIR!\gitnexus.json" >nul
    echo Done.
) else (
    echo.
    echo [3/3] Files saved in default location.
)

echo.
echo ===================================================
echo SUCCESS!
echo Graph Database (lbug): %DEST_DIR%\lbug
echo Wiki Document (wiki.md): %DEST_DIR%\wiki.md
echo ===================================================
echo.
pause
