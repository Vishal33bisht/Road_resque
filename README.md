Markdown

# 🚑 Roadside Resque

**Roadside Resque** is a full-stack web application designed to connect stranded drivers with nearby mechanics in real-time. It features role-based dashboards, geolocation tracking, and instant service requests to ensure help arrives quickly.

![Project Status](https://img.shields.io/badge/Status-Active-green)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🌟 Features

### 👤 For Drivers
- **One-Click Assistance:** Request help for Cars, Bikes, or Trucks instantly.
- **Real-Time Location:** Automatically detects your GPS location to share with mechanics.
- **Live Status Updates:** Track your request status (Pending, Accepted, En Route, Completed).
- **Request History:** View past service requests.
- **Cancel Requests:** Ability to cancel a request if help is no longer needed.

### 🔧 For Mechanics
- **Job Dashboard:** View nearby service requests with distance and problem details.
- **Availability Toggle:** Go "Online" or "Offline" to control when you receive jobs.
- **Interactive Map:** View the stranded driver's location on an embedded map.
- **Job Management:** Accept, Reject, or Mark jobs as Completed.
- **Celebration Effects:** Fun confetti animation upon successful job completion!

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **State Management:** Context API
- **Maps:** React Leaflet & OpenStreetMap
- **Animations:** Framer Motion & React Confetti
- **Notifications:** React Hot Toast
- **HTTP Client:** Axios

### **Backend**
- **Framework:** FastAPI (Python)
- **Database:** SQLite (via SQLAlchemy)
- **Authentication:** JWT (JSON Web Tokens)
- **Server:** Uvicorn

---

## 🚀 Installation & Setup

Follow these steps to run the project locally.

### **Prerequisites**
- Node.js (v16+)
- Python (v3.9+)
- Git

### **1. Clone the Repository**
git clone [https://github.com/yourusername/roadside-rescue.git](https://github.com/yourusername/roadside-rescue.git)
cd roadside-rescue


2. Backend Setup
Navigate to the backend folder and set up the Python environment.

cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy python-jose[cryptography] passlib[bcrypt] python-multipart

# Run the server (Exposed to network)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
The backend will start at http://0.0.0.0:8000 (accessible via your local IP).

3. Frontend Setup
Open a new terminal, navigate to the frontend folder, and install dependencies.

Bash

cd frontend

# Install Node modules
npm install

# Install required UI libraries (if not already installed)
npm install axios react-router-dom react-hot-toast react-leaflet leaflet framer-motion react-confetti

# Start the development server
npm run dev
The frontend will start at http://localhost:5173.


📱 Running on Mobile (Local Network)
To test the application on your phone:

Ensure your phone and laptop are on the same Wi-Fi network.

Find your laptop's Local IP address (Run ipconfig on Windows or ifconfig on Mac).

Update frontend/src/api.js:

JavaScript

const api = axios.create({
    baseURL: 'http://YOUR_LAPTOP_IP:8000', // e.g., 192.168.1.5:8000
});
Access the app on your phone via: http://YOUR_LAPTOP_IP:5173

🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request.

📄 License
This project is licensed under the MIT License.
