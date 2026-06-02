; opencode-setup.iss
; Inno Setup script for opencode (Himax internal build).
;
; Mirrors install.bat behaviour:
;   - opencode.exe        -> %LOCALAPPDATA%\opencode\opencode.exe
;   - .opencode\tool\*    -> %USERPROFILE%\.config\opencode\tool\*
;   - .opencode\skills\*  -> %USERPROFILE%\.config\opencode\skills\*
;   - .opencode\node_modules\zod -> %USERPROFILE%\.config\opencode\node_modules\zod
;   - ms_config.json      -> %USERPROFILE%\.config\opencode\ms_config.json (only if absent)
;   - opencode.jsonc      -> %USERPROFILE%\.config\opencode\opencode.jsonc (always, with API keys)
;
; Critical: writes config to %USERPROFILE%\.config\opencode (NOT %APPDATA%\opencode),
; because the bundled bun runtime resolves xdg-config-home there on Windows.
;
; Compile:
;   "%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe" opencode-setup.iss

#define MyAppName        "opencode"
#define MyAppVersion     "1.14.39-himax"
#define MyAppPublisher   "Himax Internal"
#define MyAppExeName     "opencode.exe"

; Source dir = the deploy folder layout (opencode.exe, .opencode\, ms_config.json, .env)
#define SourceDir        "..\..\deploy"

[Setup]
AppId={{A8C1B7E0-5F2A-4B6E-9F1D-7CFB1CD80B0E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\opencode
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
DisableDirPage=yes
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=..\..\deploy
OutputBaseFilename=opencode-setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\{#MyAppExeName}
SetupLogging=yes
; Only ask to close opencode.exe itself, not unrelated bun processes.
; (opencode is bun-compiled, so Windows sometimes mis-identifies any running bun
; as the same app and Setup wrongly asks to close it.)
CloseApplications=force
CloseApplicationsFilter=opencode.exe
RestartApplications=no

[Languages]
Name: "english";  MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "addpath";     Description: "Add opencode to PATH (so you can type 'opencode' in any terminal)"; GroupDescription: "Environment:"; Flags: checkedonce
Name: "npmpackages"; Description: "Auto-install xlsx & pdf-parse via npm (requires Node.js)";          GroupDescription: "Optional tools:"; Flags: unchecked

[Files]
; Main binary
Source: "{#SourceDir}\opencode.exe"; DestDir: "{app}"; Flags: ignoreversion

; Tools (TypeScript files) and shared _config.ts
Source: "{#SourceDir}\.opencode\tool\*"; DestDir: "{%USERPROFILE}\.config\opencode\tool"; \
    Flags: ignoreversion recursesubdirs createallsubdirs; \
    Excludes: "github-triage.ts,github-pr-search.ts"

; Skills (each skill is a folder with SKILL.md)
Source: "{#SourceDir}\.opencode\skills\*"; DestDir: "{%USERPROFILE}\.config\opencode\skills"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; zod dependency (required by every tool .ts)
Source: "{#SourceDir}\.opencode\node_modules\zod\*"; DestDir: "{%USERPROFILE}\.config\opencode\node_modules\zod"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ms_config.json (do NOT overwrite if user already has it filled in)
Source: "{#SourceDir}\ms_config.json"; DestDir: "{%USERPROFILE}\.config\opencode"; Flags: onlyifdoesntexist

; Optional .env (only included if present in source, lets users override baked-in tokens)
Source: "{#SourceDir}\.env"; DestDir: "{app}"; Flags: onlyifdoesntexist skipifsourcedoesntexist

[Dirs]
; Ensure all expected skill / tool subdirs exist even if empty
Name: "{%USERPROFILE}\.config\opencode\tool"
Name: "{%USERPROFILE}\.config\opencode\skills\rag"
Name: "{%USERPROFILE}\.config\opencode\skills\docx"
Name: "{%USERPROFILE}\.config\opencode\skills\excel"
Name: "{%USERPROFILE}\.config\opencode\skills\powerpoint"
Name: "{%USERPROFILE}\.config\opencode\skills\pdf"
Name: "{%USERPROFILE}\.config\opencode\skills\file-reading"
Name: "{%USERPROFILE}\.config\opencode\skills\teams"
Name: "{%USERPROFILE}\.config\opencode\skills\outlook"
Name: "{%USERPROFILE}\.config\opencode\skills\web-search"
Name: "{%USERPROFILE}\.config\opencode\skills\sql"
Name: "{%USERPROFILE}\.config\opencode\skills\ocr"
Name: "{%USERPROFILE}\.config\opencode\node_modules"

[InstallDelete]
; Wipe legacy / stale config locations so old tokens cannot poison the merged config.
; opencode reads config.json -> opencode.json -> opencode.jsonc in order; the earliest
; file wins when keys overlap but apiKey override is fragile across versions, so just
; delete the legacy variants and let our fresh opencode.jsonc be the single source.
Type: files; Name: "{%USERPROFILE}\.config\opencode\config.json"
Type: files; Name: "{%USERPROFILE}\.config\opencode\opencode.json"
; Also clean the wrong-path location used by older install.bat versions
Type: files; Name: "{userappdata}\opencode\opencode.jsonc"
Type: files; Name: "{userappdata}\opencode\opencode.json"
; Wipe the entire tool/ and skills/ trees before re-copying. Necessary because
; older deploys shipped tools (e.g. rag-buglist-search.ts) that import npm packages
; not present in current node_modules, so leftover files crash opencode on startup
; with "Cannot find module '@opencode-ai/plugin'". Re-copy from [Files] restores the
; current set; user-editable state (ms_config.json, node_modules/) is preserved.
Type: filesandordirs; Name: "{%USERPROFILE}\.config\opencode\tool"
Type: filesandordirs; Name: "{%USERPROFILE}\.config\opencode\skills"

[Run]
; Post-install: write opencode.jsonc with API keys, set env vars (handled in [Code])

; Optional npm install for xlsx and pdf-parse
Filename: "cmd.exe"; \
    Parameters: "/c cd /d ""{%USERPROFILE}\.config\opencode"" && npm install zod xlsx pdf-parse --save-dev"; \
    StatusMsg: "Installing optional npm packages (xlsx, pdf-parse)..."; \
    Flags: runhidden waituntilterminated; \
    Tasks: npmpackages

[UninstallDelete]
; On uninstall, remove the install dir (opencode.exe etc.); preserve config so a re-install
; keeps user-customised ms_config.json / tools. To wipe config too, run uninstall then
; manually delete %USERPROFILE%\.config\opencode.
Type: filesandordirs; Name: "{app}"

[Code]
const
  // Baked-in defaults. If a .env sits next to setup.exe at install time we
  // override these with its values.
  DEFAULT_RAG_BASE_URL = 'http://10.240.235.72:8000';
  DEFAULT_HIMAX_TOKEN  = '3e2fc0f6-77a7-4279-a1f0-53c53b5450bd';
  DEFAULT_HF_TOKEN     = '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';

var
  RagBaseUrl, HimaxToken, HfToken: string;

function GetEnvValue(EnvLines: TArrayOfString; const Key: string; const Fallback: string): string;
var
  i: Integer;
  line, name, value: string;
  pos1: Integer;
begin
  Result := Fallback;
  for i := 0 to GetArrayLength(EnvLines) - 1 do
  begin
    line := Trim(EnvLines[i]);
    if (line = '') or (Copy(line, 1, 1) = '#') then Continue;
    pos1 := Pos('=', line);
    if pos1 = 0 then Continue;
    name  := Trim(Copy(line, 1, pos1 - 1));
    value := Trim(Copy(line, pos1 + 1, Length(line)));
    // Strip surrounding quotes if present
    if (Length(value) >= 2) and (value[1] = '"') and (value[Length(value)] = '"') then
      value := Copy(value, 2, Length(value) - 2);
    if CompareText(name, Key) = 0 then
    begin
      Result := value;
      Exit;
    end;
  end;
end;

procedure LoadTokensFromEnv;
var
  EnvPath: string;
  EnvLines: TArrayOfString;
begin
  RagBaseUrl := DEFAULT_RAG_BASE_URL;
  HimaxToken := DEFAULT_HIMAX_TOKEN;
  HfToken    := DEFAULT_HF_TOKEN;

  // Look for .env next to the setup.exe (ExpandConstant('{src}') is the dir of setup.exe)
  EnvPath := ExpandConstant('{src}\.env');
  if FileExists(EnvPath) then
  begin
    if LoadStringsFromFile(EnvPath, EnvLines) then
    begin
      RagBaseUrl := GetEnvValue(EnvLines, 'RAG_BASE_URL', DEFAULT_RAG_BASE_URL);
      HimaxToken := GetEnvValue(EnvLines, 'HIMAX_TOKEN',  DEFAULT_HIMAX_TOKEN);
      HfToken    := GetEnvValue(EnvLines, 'HF_TOKEN',     DEFAULT_HF_TOKEN);
    end;
  end;
end;

procedure WriteOpencodeJsonc;
var
  ConfigDir, ConfigPath: string;
  Lines: TArrayOfString;
begin
  ConfigDir  := ExpandConstant('{%USERPROFILE}\.config\opencode');
  ConfigPath := ConfigDir + '\opencode.jsonc';
  ForceDirectories(ConfigDir);

  SetArrayLength(Lines, 13);
  Lines[0]  := '{';
  Lines[1]  := '  "$schema": "https://opencode.ai/config.json",';
  Lines[2]  := '  "provider": {';
  Lines[3]  := '    "himax": {';
  Lines[4]  := '      "options": {';
  Lines[5]  := '        "apiKey": "' + HimaxToken + '"';
  Lines[6]  := '      }';
  Lines[7]  := '    },';
  Lines[8]  := '    "huggingface": {';
  Lines[9]  := '      "options": {';
  Lines[10] := '        "apiKey": "' + HfToken + '"';
  Lines[11] := '      }';
  Lines[12] := '    }';
  SetArrayLength(Lines, 15);
  Lines[13] := '  }';
  Lines[14] := '}';

  SaveStringsToFile(ConfigPath, Lines, False);
end;

procedure SetEnvVarsAndPath;
var
  CurrentPath, InstallDir: string;
begin
  // Set HIMAX_TOKEN, HF_TOKEN, RAG_BASE_URL as user-scope env vars
  RegWriteStringValue(HKCU, 'Environment', 'RAG_BASE_URL', RagBaseUrl);
  RegWriteStringValue(HKCU, 'Environment', 'HIMAX_TOKEN',  HimaxToken);
  RegWriteStringValue(HKCU, 'Environment', 'HF_TOKEN',     HfToken);

  if WizardIsTaskSelected('addpath') then
  begin
    InstallDir := ExpandConstant('{app}');
    if RegQueryStringValue(HKCU, 'Environment', 'PATH', CurrentPath) then
    begin
      if Pos(LowerCase(InstallDir), LowerCase(CurrentPath)) = 0 then
      begin
        if (CurrentPath <> '') and (Copy(CurrentPath, Length(CurrentPath), 1) <> ';') then
          CurrentPath := CurrentPath + ';';
        CurrentPath := CurrentPath + InstallDir;
        RegWriteExpandStringValue(HKCU, 'Environment', 'PATH', CurrentPath);
      end;
    end
    else
      RegWriteExpandStringValue(HKCU, 'Environment', 'PATH', InstallDir);
  end;
end;

procedure RemoveFromPath;
var
  CurrentPath, InstallDir, NewPath, segment: string;
  parts: TStringList;
  i: Integer;
begin
  InstallDir := ExpandConstant('{app}');
  if not RegQueryStringValue(HKCU, 'Environment', 'PATH', CurrentPath) then Exit;

  parts := TStringList.Create;
  try
    parts.Delimiter := ';';
    parts.StrictDelimiter := True;
    parts.DelimitedText := CurrentPath;
    NewPath := '';
    for i := 0 to parts.Count - 1 do
    begin
      segment := Trim(parts[i]);
      if (segment <> '') and (CompareText(segment, InstallDir) <> 0) then
      begin
        if NewPath <> '' then NewPath := NewPath + ';';
        NewPath := NewPath + segment;
      end;
    end;
    RegWriteExpandStringValue(HKCU, 'Environment', 'PATH', NewPath);
  finally
    parts.Free;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
    LoadTokensFromEnv;
  if CurStep = ssPostInstall then
  begin
    WriteOpencodeJsonc;
    SetEnvVarsAndPath;
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usPostUninstall then
    RemoveFromPath;
end;
