@echo off
echo ===================================================
echo Starting AI-Powered ATS Resume Builder Backend...
echo ===================================================
cd backend
set PYTHONPATH=.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
