@echo off
echo Starting GHOST GRID...
echo.

start "GHOST GRID Backend (FastAPI)" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 >nul
start "GHOST GRID Frontend (Vite)" cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

echo.
echo Opening GHOST GRID in your browser...
start http://localhost:5173

echo.
echo ========================================================
echo  GHOST GRID is now running!
echo  Frontend: http://localhost:5173
echo  Backend:  http://127.0.0.1:8000
echo ========================================================
pause
