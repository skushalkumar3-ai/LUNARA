@echo off
setlocal
set "ROOT=%~dp0"
set "PYTHON=%ROOT%backend\.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
  echo Backend Python environment is missing.
  echo Create it with: python -m venv backend\.venv
  exit /b 1
)

if not exist "%ROOT%frontend\node_modules" (
  echo Frontend dependencies are missing.
  echo Install them with: npm install --prefix frontend
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Install Node.js and try again.
  exit /b 1
)

"%PYTHON%" -c "import fastapi, uvicorn" >nul 2>nul
if errorlevel 1 (
  echo FastAPI dependencies are missing.
  echo Install them with: backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
  exit /b 1
)

pushd "%ROOT%frontend"
call npm run build
set "BUILD_EXIT=%ERRORLEVEL%"
popd
if not "%BUILD_EXIT%"=="0" exit /b %BUILD_EXIT%

start "LUNARA API" /D "%ROOT%backend" "%PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000
timeout /t 2 /nobreak >nul
start "LUNARA Web" /D "%ROOT%frontend" cmd /c "npm run preview -- --host 127.0.0.1 --open"
