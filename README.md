
# Roadside Rescue

Roadside Rescue is a full-stack roadside assistance app that connects drivers with mechanics, tracks request status, and shows live mechanic location while a job is actively in progress.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-646cff)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Auth](https://img.shields.io/badge/auth-Cookies%20%2B%20mobile%20token%20fallback-orange)

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
- Access and refresh tokens are set in HttpOnly cookies when the browser accepts cross-site cookies.
- Deployed/mobile browsers can also use returned JWTs as an Authorization fallback when Vercel and the API are on different domains.
- Public signup can create either a driver or mechanic account.
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
      api.js                Axios client with cookie credentials and deployed-mobile token fallback
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
- Add identity/business verification before approving real-world mechanic operations.

## API Overview

Core endpoints:

- `POST /register` - Creates a driver or mechanic account.
- `POST /login` - Sets HttpOnly access/refresh cookies and returns fallback tokens.
- `POST /refresh` - Rotates refresh token and issues a new access cookie/token pair.
- `POST /logout` - Clears auth cookies.
- `GET /me` - Returns the current authenticated user.
- `POST /requests` - Creates a roadside assistance request.
- `GET /my-requests` - Lists the user's requests.
- `POST /requests/{id}/accept` - Mechanic accepts a pending request.
- `POST /mechanic/update-location` - Mechanic sends live location updates.
- `WS /ws/mechanic-locations` - User receives live mechanic updates for active jobs.

## Current Status

The app is ready for local development and structured for production deployment. The major security fixes are implemented, including hybrid cookie/token auth for mobile deployments, role-based dashboard access, live-location privacy controls, and tests for critical paths.

