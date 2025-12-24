import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DriverDashboard from "./pages/DriverDashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import { AuthProvider, AuthContext } from "./context/AuthContext";

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Not logged in
    if (!token) {
        return <Navigate to="/login" />;
    }

    // Wrong role - redirect to correct dashboard
    if (allowedRole && role !== allowedRole) {
        if (role === "mechanic") {
            return <Navigate to="/mechanic-dashboard" />;
        } else if(role === "user"){
            return <Navigate to="/driver-dashboard" />;
        }
        else {
        // If role is missing or unknown, force logout/login
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        return <Navigate to="/login" />;
    }
    }

    return children;
}

// Redirect logged-in users away from login/register
function PublicRoute({ children }) {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
        if (role === "mechanic") {
            return <Navigate to="/mechanic-dashboard" />;
        } else {
            return <Navigate to="/driver-dashboard" />;
        }
    }

    return children;
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Default - Redirect to login */}
                <Route path="/" element={<Navigate to="/login" />} />

                {/* Public Routes */}
                <Route 
                    path="/login" 
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    } 
                />
                <Route 
                    path="/register" 
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    } 
                />

                {/* Protected Routes */}
                <Route 
                    path="/driver-dashboard" 
                    element={
                        <ProtectedRoute allowedRole="user">
                            <DriverDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/mechanic-dashboard" 
                    element={
                        <ProtectedRoute allowedRole="mechanic">
                            <MechanicDashboard />
                        </ProtectedRoute>
                    } 
                />

                {/* Old dashboard route - redirect based on role */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            {localStorage.getItem("role") === "mechanic" 
                                ? <Navigate to="/mechanic-dashboard" />
                                : <Navigate to="/driver-dashboard" />
                            }
                        </ProtectedRoute>
                    } 
                />

                {/* 404 - Redirect to login */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;