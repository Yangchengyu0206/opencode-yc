@echo off
chcp 65001 > nul 2>&1

echo.
echo  opencode installer (no admin required)
echo  ========================================
echo.

set "SCRIPT_DIR=%~dp0"
set "INSTALL_DIR=%LOCALAPPDATA%\opencode"
set "CONFIG_DIR=%USERPROFILE%\.config\opencode"

:: Check opencode.exe exists
if not exist "%SCRIPT_DIR%opencode.exe" (
    echo [ERROR] opencode.exe not found in %SCRIPT_DIR%
    echo         Please place opencode.exe in the same folder as this script.
    pause
    exit /b 1
)

:: Create install dir and copy exe
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
copy /Y "%SCRIPT_DIR%opencode.exe" "%INSTALL_DIR%\opencode.exe" > nul
echo [OK] opencode.exe installed

:: Create config dirs
if not exist "%CONFIG_DIR%\tool"                        mkdir "%CONFIG_DIR%\tool"
if not exist "%CONFIG_DIR%\skills\rag"                  mkdir "%CONFIG_DIR%\skills\rag"
if not exist "%CONFIG_DIR%\node_modules"                mkdir "%CONFIG_DIR%\node_modules"

:: Copy zod dependency (required by tool files)
if exist "%SCRIPT_DIR%.opencode\node_modules\zod" (
    xcopy /E /I /Y /Q "%SCRIPT_DIR%.opencode\node_modules\zod" "%CONFIG_DIR%\node_modules\zod" > nul
    echo [OK] zod installed
)

:: Copy RAG tools
if exist "%SCRIPT_DIR%.opencode\tool\ragSearch.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\ragSearch.ts" "%CONFIG_DIR%\tool\ragSearch.ts" > nul
    echo [OK] ragSearch.ts installed
)
if exist "%SCRIPT_DIR%.opencode\tool\ragAsk.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\ragAsk.ts" "%CONFIG_DIR%\tool\ragAsk.ts" > nul
    echo [OK] ragAsk.ts installed
)

:: Copy RAG skill
if exist "%SCRIPT_DIR%.opencode\skills\rag\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\rag\SKILL.md" "%CONFIG_DIR%\skills\rag\SKILL.md" > nul
    echo [OK] rag skill installed
)

:: Add to user PATH
echo.
echo Updating PATH...
for /f "skip=2 tokens=3*" %%A in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "OLD_PATH=%%A %%B"
if "%OLD_PATH%"=="" (
    setx PATH "%INSTALL_DIR%" > nul
) else (
    echo %OLD_PATH% | find /i "%INSTALL_DIR%" > nul
    if errorlevel 1 (
        setx PATH "%OLD_PATH%;%INSTALL_DIR%" > nul
    ) else (
        echo [SKIP] already in PATH
    )
)
echo [OK] PATH updated

echo.
echo  Done! Re-open terminal and type: opencode
echo.
pause
