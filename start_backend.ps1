Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting AI-Powered ATS Resume Builder Backend..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Set-Location -Path "$PSScriptRoot\backend"
$env:PYTHONPATH = "."
& "C:\Users\logeshwarann\AppData\Local\Python\bin\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
