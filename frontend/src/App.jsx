import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from './pages/LandingPage';
import DriverDashboard from "./pages/DriverDashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import { AuthProvider } from "./context/AuthContext";
import { AuthContext } from "./context/auth-context";
import { Toaster } from 'react-hot-toast';

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useContext(AuthContext);
    const role = user?.role;

    if (loading) {
        return null;
    }

    // Not logged in
    if (!user) {
        return <Navigate to="/login" />;
    }

    // Wrong role - redirect to correct dashboard
    if (allowedRole && role !== allowedRole) {
        if (role === "mechanic") {
            return <Navigate to="/mechanic-dashboard" />;
        } else if(role === "user"){
            return <Navigate to="/user-dashboard" />;
        }
        else {
        // If role is missing or unknown, force logout/login
        return <Navigate to="/login" />;
    }
    }

    return children;
}

// Redirect logged-in users away from login/register
function PublicRoute({ children }) {
    const { user, loading } = useContext(AuthContext);
    const role = user?.role;

    if (loading) {
        return null;
    }

    if (user) {
        if (role === "mechanic") {
            return <Navigate to="/mechanic-dashboard" />;
        } else {
            return <Navigate to="/user-dashboard" />;
        }
    }

    return children;
}

function DashboardRedirect() {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return null;
    }

    if (user?.role === "mechanic") {
        return <Navigate to="/mechanic-dashboard" />;
    }

    return <Navigate to="/user-dashboard" />;
}

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-center" />
            <Routes>
                {/* Public dashboard */}
                <Route path="/" element={<LandingPage />} />

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
                    path="/user-dashboard" 
                    element={
                        <ProtectedRoute allowedRole="user">
                            <DriverDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route path="/driver-dashboard" element={<Navigate to="/user-dashboard" />} />
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
                            <DashboardRedirect />
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
