# LUNARA — Junior Astronaut Mission Trainer

LUNARA is a React, Three.js, and Vite lunar-outpost simulation with a five-step surface orientation and a sequential five-emergency mission. The existing NASA LOLA terrain, habitat model, astronauts, rover, and Earth visualization are loaded from `frontend/public`.

## Run on Windows

For the production frontend with its FastAPI health check, run `run-lunara-windows.bat` from the repository root. It builds the frontend, starts the API on `127.0.0.1:8000`, and opens the production preview on `127.0.0.1:4173`.

Install prerequisites if needed:

```powershell
python -m venv backend\.venv
backend\.venv\Scripts\python -m pip install -r backend\requirements.txt
npm install --prefix frontend
```

For development, use two terminals:

```powershell
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
cd frontend
npm run dev
```

The Vite development and preview servers proxy `/api` requests to the local FastAPI service. The simulation and mission store run in the browser. The API provides `/api/health` and NASA DONKI space-weather endpoints. Copy `backend\.env.example` to `backend\.env` for local configuration; the current official [CCMC DONKI API](https://ccmc.gsfc.nasa.gov/DONKI/api/) does not require an API key.

## Production deployment configuration

The frontend defaults to the production LUNARA API when built for production. Set `VITE_API_BASE_URL=https://lunara-api-vmvk.onrender.com/api` in the frontend host's build environment to configure it explicitly. For local development, the default `/api` path uses the Vite proxy to `http://127.0.0.1:8000`; `frontend/.env.example` shows the optional direct local API override.

The backend CORS allowlist always includes `https://lunara-mission-trainer.onrender.com`; `LUNARA_FRONTEND_ORIGINS` adds the configured local or additional origins. Render free instances can sleep after inactivity, so the dashboard retries failed API and NASA requests with backoff while clearly showing demo mode until live data is available.

## Mission flow

After the five-point orientation, LUNARA runs a 15-second countdown before each event:

1. Solar radiation emergency
2. Power system failure
3. Water recycling failure
4. Oxygen supply malfunction
5. Habitat temperature failure

Each event has three distinct responses. Resources and crew safety carry forward, are clamped to 0–100%, and feed the final mission report. The 3D scene reads persistent system flags from the same Zustand store.

## Test one event quickly

In development, append a mission event ID and zero-duration timers to the Vite URL, then finish the orientation:

```text
http://localhost:5173/?missionEvent=water-recycling&missionCountdown=0&missionRecovery=0
```

Valid `missionEvent` values are `solar-radiation`, `power-failure`, `water-recycling`, `oxygen-supply`, and `habitat-temperature`. Supplying `missionEvent` runs that emergency by itself and ends with a clearly labeled event-test report; it does not claim the full five-event mission is complete. Omit `missionEvent` to run the full mission, and omit the timing parameters for the normal 15-second countdown and recovery.

## Build and checks

```powershell
npm --prefix frontend run build
npm --prefix frontend run lint
```

There is no desktop installer configured. `run-lunara-windows.bat` launches the verified production web build and the local API; Electron/Tauri packaging remains a separate release step.
