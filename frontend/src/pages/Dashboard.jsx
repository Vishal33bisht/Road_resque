// src/pages/Dashboard.jsx
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import DriverDashboard from "../components/DriverDashboard";
import MechanicDashboard from "../components/MechanicDashboard"; // <--- IMPORT THIS!
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-bold">Roadside Rescue 🚗</h1>
        <div className="flex items-center gap-4">
            <span className="capitalize font-semibold">
              {user?.name ? `${user.name} (` : ''}
              {user?.role === 'mechanic' ? '🔧 Mechanic' : '👤 Driver'}
              {user?.name ? ')' : ''}
            </span>
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600">
                Logout
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-4">
        {user?.role === "mechanic" ? (
          <MechanicDashboard />  // <--- THIS REPLACES THE "COMING SOON" TEXT
        ) : (
          <DriverDashboard />
        )}
      </div>
    </div>
  );
}