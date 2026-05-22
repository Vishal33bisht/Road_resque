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
