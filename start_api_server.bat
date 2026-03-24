@echo off
echo Starting Cacao Fermentation API Server...
echo.
echo Make sure you have installed the requirements:
echo   pip install -r python_api_requirements.txt
echo.
echo Starting Flask server on http://192.168.1.40:8000
echo Press Ctrl+C to stop the server
echo.

REM Activate virtual environment and start the server
call venv\Scripts\activate
python python_api_example.py

pause
