$desktopPath = [Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $desktopPath "CareConnect Healthcare.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "c:\Users\dixit\OneDrive\Pictures\Documents\CareConnect\start-careconnect.bat"
$shortcut.WorkingDirectory = "c:\Users\dixit\OneDrive\Pictures\Documents\CareConnect"
$shortcut.Description = "Launch CareConnect Healthcare Management Portal"
$shortcut.Save()
Write-Host "CareConnect Desktop shortcut created at $shortcutPath" -ForegroundColor Green
