@echo off
chcp 65001 > nul 2>&1

echo.
echo  opencode RESET (clean every trace of opencode from this machine)
echo  =================================================================
echo.
echo  This will delete:
echo    - %%LOCALAPPDATA%%\opencode\          (binary)
echo    - %%USERPROFILE%%\.config\opencode\   (tools, skills, config, ms_config.json)
echo    - %%USERPROFILE%%\.local\share\opencode\  (logs, sqlite db, session storage)
echo    - %%USERPROFILE%%\.local\state\opencode\  (state)
echo    - %%USERPROFILE%%\.cache\opencode\        (cache)
echo    - %%APPDATA%%\opencode\               (legacy wrong-path config)
echo    - User env vars: HIMAX_TOKEN, HF_TOKEN, RAG_BASE_URL
echo    - PATH entry: %%LOCALAPPDATA%%\opencode
echo.
echo  After this, opencode is completely uninstalled. Run install.bat or
echo  opencode-setup.exe to reinstall from scratch.
echo.
set /p CONFIRM="Proceed? Type YES to confirm: "
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause
    exit /b 1
)

echo.
echo Removing directories...

if exist "%LOCALAPPDATA%\opencode"          rd /s /q "%LOCALAPPDATA%\opencode"          && echo [OK] %%LOCALAPPDATA%%\opencode
if exist "%USERPROFILE%\.config\opencode"   rd /s /q "%USERPROFILE%\.config\opencode"   && echo [OK] %%USERPROFILE%%\.config\opencode
if exist "%USERPROFILE%\.local\share\opencode" rd /s /q "%USERPROFILE%\.local\share\opencode" && echo [OK] %%USERPROFILE%%\.local\share\opencode
if exist "%USERPROFILE%\.local\state\opencode" rd /s /q "%USERPROFILE%\.local\state\opencode" && echo [OK] %%USERPROFILE%%\.local\state\opencode
if exist "%USERPROFILE%\.cache\opencode"    rd /s /q "%USERPROFILE%\.cache\opencode"    && echo [OK] %%USERPROFILE%%\.cache\opencode
if exist "%APPDATA%\opencode"               rd /s /q "%APPDATA%\opencode"               && echo [OK] %%APPDATA%%\opencode (legacy)

echo.
echo Removing user environment variables...
reg delete "HKCU\Environment" /v HIMAX_TOKEN  /f > nul 2>&1 && echo [OK] HIMAX_TOKEN
reg delete "HKCU\Environment" /v HF_TOKEN     /f > nul 2>&1 && echo [OK] HF_TOKEN
reg delete "HKCU\Environment" /v RAG_BASE_URL /f > nul 2>&1 && echo [OK] RAG_BASE_URL

echo.
echo Removing PATH entry...
:: PowerShell handles ;-separated dedup + drop opencode dir without 1024-char setx limit
powershell -NoProfile -Command "$dir='%LOCALAPPDATA%\opencode'; $raw=[Environment]::GetEnvironmentVariable('PATH','User'); if($raw){ $clean=@(($raw -split ';') | Where-Object { $_.Trim() -ne '' -and $_.Trim() -ine $dir }); [Environment]::SetEnvironmentVariable('PATH', ($clean -join ';'), 'User') }"
echo [OK] PATH cleaned

echo.
echo  Done. opencode has been completely removed from this machine.
echo  Open a NEW terminal (env var changes need a fresh shell) and run
echo  install.bat or opencode-setup.exe to reinstall.
echo.
pause
