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
if not exist "%CONFIG_DIR%\skills\docx"                 mkdir "%CONFIG_DIR%\skills\docx"
if not exist "%CONFIG_DIR%\skills\file-reading"         mkdir "%CONFIG_DIR%\skills\file-reading"
if not exist "%CONFIG_DIR%\skills\teams"                mkdir "%CONFIG_DIR%\skills\teams"
if not exist "%CONFIG_DIR%\skills\outlook"              mkdir "%CONFIG_DIR%\skills\outlook"
if not exist "%CONFIG_DIR%\skills\web-search"           mkdir "%CONFIG_DIR%\skills\web-search"
if not exist "%CONFIG_DIR%\skills\sql"                  mkdir "%CONFIG_DIR%\skills\sql"
if not exist "%CONFIG_DIR%\skills\ocr"                  mkdir "%CONFIG_DIR%\skills\ocr"
if not exist "%CONFIG_DIR%\skills\excel"                mkdir "%CONFIG_DIR%\skills\excel"
if not exist "%CONFIG_DIR%\skills\powerpoint"           mkdir "%CONFIG_DIR%\skills\powerpoint"
if not exist "%CONFIG_DIR%\skills\pdf"                  mkdir "%CONFIG_DIR%\skills\pdf"
if not exist "%CONFIG_DIR%\node_modules"                mkdir "%CONFIG_DIR%\node_modules"

:: Copy ms_config.json (only if not already exists ??preserve user settings)
if exist "%SCRIPT_DIR%ms_config.json" (
    if not exist "%CONFIG_DIR%\ms_config.json" (
        copy /Y "%SCRIPT_DIR%ms_config.json" "%CONFIG_DIR%\ms_config.json" > nul
        echo [OK] ms_config.json created (please fill in your API keys)
    ) else (
        echo [SKIP] ms_config.json already exists, not overwritten
    )
)

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

:: Copy document generation skills
if exist "%SCRIPT_DIR%.opencode\skills\docx\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\docx\SKILL.md" "%CONFIG_DIR%\skills\docx\SKILL.md" > nul
    echo [OK] docx skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\excel\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\excel\SKILL.md" "%CONFIG_DIR%\skills\excel\SKILL.md" > nul
    echo [OK] excel skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\powerpoint\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\powerpoint\SKILL.md" "%CONFIG_DIR%\skills\powerpoint\SKILL.md" > nul
    echo [OK] powerpoint skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\pdf\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\pdf\SKILL.md" "%CONFIG_DIR%\skills\pdf\SKILL.md" > nul
    echo [OK] pdf skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\file-reading\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\file-reading\SKILL.md" "%CONFIG_DIR%\skills\file-reading\SKILL.md" > nul
    echo [OK] file-reading skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\teams\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\teams\SKILL.md" "%CONFIG_DIR%\skills\teams\SKILL.md" > nul
    echo [OK] teams skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\outlook\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\outlook\SKILL.md" "%CONFIG_DIR%\skills\outlook\SKILL.md" > nul
    echo [OK] outlook skill installed
)

:: Copy web tools
if exist "%SCRIPT_DIR%.opencode\tool\webScrape.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\webScrape.ts" "%CONFIG_DIR%\tool\webScrape.ts" > nul
    echo [OK] webScrape.ts installed
)
if exist "%SCRIPT_DIR%.opencode\tool\arxivSearch.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\arxivSearch.ts" "%CONFIG_DIR%\tool\arxivSearch.ts" > nul
    echo [OK] arxivSearch.ts installed
)
if exist "%SCRIPT_DIR%.opencode\skills\sql\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\sql\SKILL.md" "%CONFIG_DIR%\skills\sql\SKILL.md" > nul
    echo [OK] sql skill installed
)
if exist "%SCRIPT_DIR%.opencode\skills\ocr\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\ocr\SKILL.md" "%CONFIG_DIR%\skills\ocr\SKILL.md" > nul
    echo [OK] ocr skill installed
)

:: Copy Tavily search tool
if exist "%SCRIPT_DIR%.opencode\tool\tavilySearch.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\tavilySearch.ts" "%CONFIG_DIR%\tool\tavilySearch.ts" > nul
    echo [OK] tavilySearch.ts installed
)
if exist "%SCRIPT_DIR%.opencode\skills\web-search\SKILL.md" (
    copy /Y "%SCRIPT_DIR%.opencode\skills\web-search\SKILL.md" "%CONFIG_DIR%\skills\web-search\SKILL.md" > nul
    echo [OK] web-search skill installed
)

:: Copy Teams / Outlook tools
if exist "%SCRIPT_DIR%.opencode\tool\teamsNotify.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\teamsNotify.ts" "%CONFIG_DIR%\tool\teamsNotify.ts" > nul
    echo [OK] teamsNotify.ts installed
)
if exist "%SCRIPT_DIR%.opencode\tool\teamsRead.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\teamsRead.ts" "%CONFIG_DIR%\tool\teamsRead.ts" > nul
    echo [OK] teamsRead.ts installed
)
if exist "%SCRIPT_DIR%.opencode\tool\outlookSend.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\outlookSend.ts" "%CONFIG_DIR%\tool\outlookSend.ts" > nul
    echo [OK] outlookSend.ts installed
)
if exist "%SCRIPT_DIR%.opencode\tool\outlookRead.ts" (
    copy /Y "%SCRIPT_DIR%.opencode\tool\outlookRead.ts" "%CONFIG_DIR%\tool\outlookRead.ts" > nul
    echo [OK] outlookRead.ts installed
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
