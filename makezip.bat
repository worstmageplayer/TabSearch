@echo off
setlocal

set ZIPNAME=TabSearch.zip
set TEMPDIR=_zip_temp

rem Clean up any old temp dir or zip
if exist %ZIPNAME% del /f /q %ZIPNAME%
if exist %TEMPDIR% rmdir /s /q %TEMPDIR%

rem Create temp structure
mkdir %TEMPDIR%

rem Copy files
copy /y background.js %TEMPDIR%\ >nul
copy /y fuzzy.js %TEMPDIR%\ >nul
copy /y manifest.json %TEMPDIR%\ >nul
copy /y popup.html %TEMPDIR%\ >nul
copy /y popup.js %TEMPDIR%\ >nul
copy /y style.css %TEMPDIR%\ >nul
copy /y icon.png %TEMPDIR%\ >nul

rem Use PowerShell to zip from inside the temp dir to preserve folder structure
powershell -Command "Compress-Archive -Path '%TEMPDIR%\*' -DestinationPath '%ZIPNAME%'"

rem Clean up temp
rmdir /s /q %TEMPDIR%

echo ✅ Created %ZIPNAME%
pause

