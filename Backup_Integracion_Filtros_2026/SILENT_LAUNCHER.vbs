Set WshShell = CreateObject("WScript.Shell") 
strPath = "c:\KoraApp\ComexIA-Trae-main\AUTO_START_HEADLESS.bat"
' Run invisible (0)
WshShell.Run chr(34) & strPath & Chr(34), 0
Set WshShell = Nothing
