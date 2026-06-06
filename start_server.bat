@echo off
echo ===================================================
echo   AI-Netram Local Backend Starter (Windows)
echo ===================================================
echo.

:: Check for Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed on this system!
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b
)

echo [1/2] Installing required dependencies...
pip install -r requirements.txt

echo.
echo [2/2] Launching local AI server...
echo Server will be running at http://127.0.0.1:5010
echo.
echo Leave this window open while using the app. Press Ctrl+C to stop.
echo ===================================================
echo.

python app.py
pause
