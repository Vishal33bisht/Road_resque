<<<<<<< HEAD
# Roadside Rescue

Roadside Rescue is a full-stack roadside assistance app that connects drivers with mechanics, tracks request status, and shows live mechanic location while a job is actively in progress.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-646cff)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Auth](https://img.shields.io/badge/auth-HttpOnly%20cookies-orange)

## What It Does

**For users**
- Create roadside help requests for car, bike, or truck issues.
- Share current location with nearby mechanics.
- Track request status: `Pending`, `Accepted`, `En Route`, `Completed`, `Cancelled`, `Rejected`.
- View assigned mechanic details.
- See live mechanic location only while the job is active.
- View request history without exposing old mechanic live coordinates.

**For mechanics**
- Go online/offline with current location.
- View nearby pending requests.
- Accept, reject, start, and complete jobs.
- Broadcast live location to the customer during active jobs.
- Open customer location in maps.

**Security highlights**
- Access and refresh tokens are stored only in HttpOnly cookies.
- No JWT is stored in `localStorage` or `sessionStorage`.
- Public signup always creates a normal user account.
- Mechanic role must be granted by trusted admin/database workflow.
- Mechanic coordinates are hidden for completed/cancelled/rejected/history jobs.
- One multiplexed WebSocket sends all live mechanic updates for a user.
- Security headers, CORS config, CSRF-style XHR header checks, rate limiting, and regression tests are included.

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router
- Axios
- React Leaflet + OpenStreetMap
- Framer Motion
- React Hot Toast
- Tailwind CSS
- Lucide Icons

**Backend**
- FastAPI
- SQLAlchemy
- Alembic
- SQLite for local development, PostgreSQL-ready through `DATABASE_URL`
- PyJWT
- Passlib + bcrypt
- SlowAPI rate limiting
- Pytest

## Project Structure

```text
road-side2/
  backend/
    main.py                 FastAPI app setup, CORS, security middleware
    config.py               Environment-based settings
    database.py             SQLAlchemy engine/session
    models.py               Database models and indexes
    schemas.py              Pydantic request/response schemas
    dependencies.py         Auth dependencies
    routers/                Auth, health, request, mechanic routes
    services/               Auth, location, realtime WebSocket helpers
    migrations/             Alembic config and migrations
    tests/                  Security regression tests
  frontend/
    src/
      pages/                Landing, login, register, user/mechanic dashboards
      context/              Auth context
      utils/                Error helpers
      api.js                Axios client with cookie credentials
```

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- Git

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `backend/.env`:

```env
SECRET_KEY=generate-a-long-random-secret
DATABASE_URL=sqlite:///./roadside_rescue.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
APP_ENV=development
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
SECURE_COOKIES=false
COOKIE_SAMESITE=lax
```

Run the backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:

```text
http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Testing

Backend:

```bash
cd backend
venv\Scripts\activate
python -m pytest tests
```

Frontend build:

```bash
cd frontend
npm run build
```

## Mobile Testing And Location Notes

Location works best on a real mobile phone because phones usually have GPS hardware. A PC or laptop often estimates location from Wi-Fi/IP data, which can be weak, inaccurate, delayed, or unavailable.

If location is not detected on your PC/laptop:
- Try the app on a mobile phone.
- Make sure location permission is allowed in the browser.
- Use HTTPS in production. Browser geolocation is restricted on insecure origins, except `localhost`.
- If testing on the same Wi-Fi network, run the backend with `--host 0.0.0.0` and open the frontend from your phone using your computer's local IP.

Example:

```text
http://YOUR_COMPUTER_LOCAL_IP:5173
```

For local-network testing, include that origin in `CORS_ORIGINS`:

```env
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://YOUR_COMPUTER_LOCAL_IP:5173
```

## Production Notes

Use secure cookie settings in production:

```env
APP_ENV=production
SECURE_COOKIES=true
COOKIE_SAMESITE=none
CORS_ORIGINS=https://your-frontend-domain.com
DATABASE_URL=postgresql://...
```

Also recommended:
- Use a strong unique `SECRET_KEY`.
- Run Alembic migrations against production DB.
- Serve frontend over HTTPS.
- Keep backend behind HTTPS/proxy.
- Do not commit `.env`, logs, local DB files, `venv`, `node_modules`, or `dist`.
- Add an admin-only mechanic approval flow before granting mechanic role.

## API Overview

Core endpoints:

- `POST /register` - Creates a normal user account.
- `POST /login` - Sets HttpOnly access/refresh cookies.
- `POST /refresh` - Rotates refresh token and issues a new access cookie.
- `POST /logout` - Clears auth cookies.
- `GET /me` - Returns the current authenticated user.
- `POST /requests` - Creates a roadside assistance request.
- `GET /my-requests` - Lists the user's requests.
- `POST /requests/{id}/accept` - Mechanic accepts a pending request.
- `POST /mechanic/update-location` - Mechanic sends live location updates.
- `WS /ws/mechanic-locations` - User receives live mechanic updates for active jobs.

## Current Status

The app is ready for local development and structured for production deployment. The major security fixes are implemented, including cookie-only auth, role escalation prevention, live-location privacy controls, and tests for critical paths.
=======
Markdown
# 🚗 Roadside Rescue Platform

A real-time, "Uber-like" web application connecting drivers in distress with nearby available mechanics. Built with a focus on scalable WebSocket architecture, robust geographic data processing, and enterprise-grade security.

## ✨ Key Features

* **Real-Time Location Tracking:** Custom WebSocket multiplexing architecture pushes live mechanic coordinates to the user's map interface. Includes automated connection healing (exponential backoff) for unstable mobile networks.
* **Dynamic Geographic Mapping:** Integrates `react-leaflet` to render interactive maps, plotting user locations and live-updating mechanic positions using dynamic Haversine distance calculations.
* **Enterprise-Grade Security:**
  * **Authentication:** Secure JWT implementation using `HttpOnly` cookies and automatic background token rotation via Axios interceptors. 
  * **Protection:** Complete defense against BOLA/IDOR vulnerabilities, Cross-Site Request Forgery (CSRF), and strict HTTP security headers.
  * **Rate Limiting:** Backend endpoints are protected by `slowapi` to prevent abuse and brute-force attacks.
* **Polished User Experience:** Utilizes `framer-motion` for fluid, mobile-app-like page transitions, micro-interactions, and complex state management across multiple user roles (Drivers and Mechanics).

## 🛠️ Technology Stack

**Frontend**
* React.js (Vite)
* React-Leaflet (OpenStreetMap integration)
* Framer Motion (Animations)
* Axios (with custom interceptors)

**Backend**
* Python 3 & FastAPI
* SQLAlchemy (ORM) & Alembic (Database Migrations)
* WebSockets (Real-time bidirectional communication)
* PyJWT & Passlib (Authentication & Hashing)

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Node.js v18+
* PostgreSQL or SQLite (configured via SQLAlchemy)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
Create and activate a virtual environment:

Bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
Install dependencies:

Bash
pip install -r requirements.txt
Configure your .env file (see .env.example for required variables like SECRET_KEY and Database URLs).

Run database migrations:

Bash
alembic upgrade head
Start the FastAPI server:

Bash
uvicorn main:app --reload
Frontend Setup
Navigate to the frontend directory:

Bash
cd frontend
Install dependencies:

Bash
npm install
Configure your .env file to point to your backend API:

Code snippet
VITE_API_BASE_URL=http://localhost:8000
Start the Vite development server:

Bash
npm run dev
🔒 Security & Privacy Notes
This platform prioritizes user data protection. Mechanic coordinates are strictly localized to active jobs and are completely nullified on the backend once a job transitions to Completed or Cancelled, ensuring privacy. Registration endpoints default strictly to least-privileged user roles to prevent horizontal privilege escalation.

👨‍💻 Author
Vishal Bisht

GitHub Profile
>>>>>>> 23c5f0fc674bee6b9370b6aba4005f643d498e24
