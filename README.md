# 🌕 LUNARA
### Junior Astronaut Mission Trainer

<p align="center">
  **TRAIN. EXPLORE. SURVIVE.**
</p>

<p align="center">
  An interactive lunar-outpost simulation that prepares junior astronauts for the challenges of living and working on the Moon.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PROJECT-NASA%20SPACE%20APPS%20CHALLENGE-0B3D91?style=for-the-badge" />
  <img src="https://img.shields.io/badge/STATUS-DEPLOYED-22C55E?style=for-the-badge" />
  <img src="https://img.shields.io/badge/PLATFORM-WEB-38BDF8?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://lunara-mission-trainer.onrender.com"><strong>🚀 Launch LUNARA</strong></a>
  &nbsp; • &nbsp;
  <a href="#-features">Features</a>
  &nbsp; • &nbsp;
  <a href="#-technology-stack">Technology</a>
  &nbsp; • &nbsp;
  <a href="#-installation--setup">Installation</a>
</p>

---

## 🌌 About LUNARA

What would it take to survive on the Moon?

**LUNARA — Junior Astronaut Mission Trainer** is an interactive 3D lunar-outpost simulation designed to introduce users to the challenges of lunar exploration, astronaut orientation, habitat management, and emergency response.

Built using React, Three.js, and FastAPI, LUNARA combines an immersive lunar environment with a structured astronaut training experience.

Users begin with a five-point surface orientation before entering a sequential emergency mission in which their decisions affect crew safety and available resources.

The experience brings together lunar terrain visualization, astronaut operations, habitat systems, and real NASA space-weather observations.

## 🚀 Live Experience

| Component | Link |
|---|---|
| Live Mission Trainer | https://lunara-mission-trainer.onrender.com |
| Backend API | https://lunara-api-vmvk.onrender.com |
| API Health Check | https://lunara-api-vmvk.onrender.com/api/health |
| Space Weather API | https://lunara-api-vmvk.onrender.com/api/space-weather |

## ✨ Features

### 🌕 1. Immersive 3D Lunar Environment

Explore a simulated lunar outpost featuring:

- NASA LOLA-based lunar elevation terrain.
- Detailed lunar surface visualization.
- 3D astronaut models.
- Lunar habitat environment.
- Rover visualization.
- Earth visualization from the lunar surface.

The existing 3D assets and environment are loaded from `frontend/public`.

### 🧭 2. Five-Point Astronaut Surface Orientation

Before beginning the emergency mission, users complete a five-step surface orientation experience.

This introduces the lunar environment and familiarizes users with the outpost before mission operations begin.

### 🚨 3. Sequential Emergency Mission

LUNARA challenges users with five consecutive lunar-outpost emergencies.

| Mission | Emergency |
|---|---|
| 01 | ☀️ Solar Radiation Emergency |
| 02 | ⚡ Power System Failure |
| 03 | 💧 Water Recycling Failure |
| 04 | 🫁 Oxygen Supply Malfunction |
| 05 | 🌡️ Habitat Temperature Failure |

Each emergency includes three distinct response choices.

User decisions influence resource availability and crew safety throughout the mission.

### 🧑‍🚀 4. Mission Resource Management

Mission decisions have consequences.

- Resources are tracked across emergency events.
- Crew safety carries forward between missions.
- Resource values are maintained between 0–100%.
- System conditions influence the final mission report.
- The 3D environment reads persistent system flags from the shared Zustand store.

### ☀️ 5. NASA Space Weather Integration

LUNARA integrates NASA's Community Coordinated Modeling Center (CCMC) DONKI API to retrieve space-weather event information.

The backend provides access to:

- Solar flares (FLR)
- Solar energetic particle events (SEP)
- Geomagnetic storms (GST)
- Coronal mass ejections (CME)

The application distinguishes verified live NASA observations from unavailable or demonstration data.

**Data source:** [NASA CCMC DONKI API](https://ccmc.gsfc.nasa.gov/DONKI/api/)

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Language | TypeScript |
| 3D Rendering | Three.js |
| React 3D Integration | React Three Fiber |
| 3D Utilities | Drei |
| Styling | Tailwind CSS + Custom CSS |
| State Management | Zustand |
| Backend | Python + FastAPI |
| API Communication | HTTPX |
| Lunar Terrain | NASA LOLA elevation data |
| Space Weather | NASA CCMC DONKI API |
| Deployment | Render |

## 🏗️ System Architecture

```text
                 LUNARA WEB APPLICATION
                          |
                          v
               React + TypeScript + Vite
                          |
              +-----------+-----------+
              |           |           |
              v           v           v
          Three.js     Zustand     NASA Data UI
          3D Scene     Mission       |
              |        State         |
              |                      |
              |                      v
              |                 FastAPI Backend
              |                      |
              |                      v
              |                NASA CCMC DONKI
              |                   API
              |
              v
        Lunar Environment
        - LOLA Terrain
        - Astronauts
        - Habitat
        - Rover
        - Earth
```

The frontend communicates with the FastAPI backend for health checks and NASA space-weather information.

The mission simulation and mission state run in the browser.

---

## 💻 Installation & Setup

### Prerequisites

Install the following:

- Python
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/skushalkumar3-ai/LUNARA.git

cd LUNARA
```

### 2. Set up the backend

```bash
cd backend

python -m venv .venv
```

Activate the environment on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI backend:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend

npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite development and preview servers proxy `/api` requests to the local FastAPI backend.

### 4. Run the production preview on Windows

From the repository root:

```text
run-lunara-windows.bat
```

This script builds the frontend, starts the API on `127.0.0.1:8000`, and opens the production preview on `127.0.0.1:4173`.

For local configuration, copy:

```text
backend/.env.example
```

to:

```text
backend/.env
```

The current official CCMC DONKI API does not require an API key.

---

## 🌐 Production Deployment

LUNARA uses two Render services.

| Service | Deployment |
|---|---|
| Frontend | Render Static Site |
| Backend | Render Web Service |

### Frontend environment variable

```env
VITE_API_BASE_URL=https://lunara-api-vmvk.onrender.com/api
```

### Backend environment variable

```env
LUNARA_FRONTEND_ORIGINS=https://lunara-mission-trainer.onrender.com
```

The frontend variable must be available during the production build.

The backend CORS configuration allows the production frontend origin and supports additional configured origins.

**Note:** Render free instances may sleep after inactivity. LUNARA retries temporary API failures with capped backoff and clearly identifies unavailable NASA data rather than falsely presenting it as live.

---

## 🧪 Mission Testing

LUNARA supports testing an individual emergency event during development.

Example:

```text
http://localhost:5173/?missionEvent=water-recycling&missionCountdown=0&missionRecovery=0
```

Supported mission event IDs:

| Event ID | Emergency |
|---|---|
| `solar-radiation` | Solar Radiation |
| `power-failure` | Power System Failure |
| `water-recycling` | Water Recycling |
| `oxygen-supply` | Oxygen Supply |
| `habitat-temperature` | Habitat Temperature |

When `missionEvent` is provided, LUNARA runs that emergency individually and generates a clearly labelled event-test report.

It does not claim that the complete five-event mission has been completed.

Without `missionEvent`, the full mission sequence runs normally with its default 15-second countdown and recovery timings.

---

## 🔍 Build & Testing

Build the frontend:

```bash
npm --prefix frontend run build
```

Run frontend linting:

```bash
npm --prefix frontend run lint
```

Run backend tests:

```bash
cd backend

python -m pytest
```

Compile Python modules:

```bash
python -m compileall app
```

---

## 📁 Project Structure

```text
LUNARA/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── ...
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   ├── terrain/
│   │   └── 3D assets
│   │
│   ├── src/
│   │   ├── scenes/
│   │   ├── tutorial/
│   │   ├── launch/
│   │   └── services/
│   │
│   ├── index.html
│   └── package.json
│
├── run-lunara-windows.bat
└── README.md
```

---

## 🛰️ Data Sources & Acknowledgements

LUNARA uses NASA-related data and resources as part of its lunar exploration experience.

- **NASA LOLA:** Lunar elevation data used for the lunar terrain.
- **NASA CCMC DONKI:** Space-weather event information.
- **Three.js:** 3D rendering technology.
- **React Three Fiber:** React renderer for Three.js.

NASA data and services remain subject to their respective usage policies and availability.

---

## 🔮 Future Scope

Potential future development directions include:

- Expanded lunar exploration scenarios.
- Additional astronaut training missions.
- More detailed habitat system simulations.
- Enhanced lunar surface interactions.
- Additional NASA data integrations.
- More advanced mission performance analysis.

---

## 👨‍🚀 Project

**LUNARA — Junior Astronaut Mission Trainer**

Developed as a project for the NASA Space Apps Challenge.

**GitHub:** [skushalkumar3-ai](https://github.com/skushalkumar3-ai)

**Live Demo:** [Launch LUNARA](https://lunara-mission-trainer.onrender.com)

---

<p align="center">
  🌕 **TRAIN FOR THE MOON. PREPARE FOR THE UNKNOWN.** 🚀
</p>

<p align="center">
  <i>One mission. Five emergencies. One lunar outpost.</i>
</p>
