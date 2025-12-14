import { useState, useEffect } from "react";
import api from "../api";

export default function MechanicDashboard() {
  const [requests, setRequests] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const interval=setInterval(fetchRequests,5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/mechanic/requests");
      setRequests(res.data);
    } catch (err) {
      console.log("Waiting for location update...");
    }
  };

  const toggleAvailability = async () => {
    setLoading(true);
    // Use fixed location for MVP (NYC) or use navigator.geolocation
    const lat = 40.7128; 
    const lng = -74.0060;

    try {
      const res = await api.post("/mechanic/availability?lat=" + lat + "&lng=" + lng);
      setIsAvailable(res.data.is_available);
      if (res.data.is_available) fetchRequests();
    } catch (err) {
      alert("Error updating status");
    }
    setLoading(false);
  };

  const acceptRequest = async (id) => {
    try {
      // DEBUG: Print exactly what we are sending
      console.log("Attempting to accept request ID:", id);
      const url = "/requests/" + id + "/accept";
      console.log("Target URL:", url);

      await api.post(url); // <--- Using variable instead of backticks
      
      alert("Job Accepted! Head to the location.");
      setRequests(requests.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed: " + (err.response?.data?.detail || "Check Console")); 
    }
  };

    return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">🔧 Mechanic Dashboard</h2>
      
      {/* Availability Toggle */}
      <div className="flex items-center justify-between bg-gray-100 p-4 rounded mb-6">
        <span className="font-medium">Status: 
          <span className={isAvailable ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
            {isAvailable ? "ONLINE (Scanning...)" : "OFFLINE"}
          </span>
        </span>
        <button 
          onClick={toggleAvailability}
          disabled={loading}
          className={`px-4 py-2 rounded text-white font-bold ${isAvailable ? 'bg-red-500' : 'bg-green-500'}`}
        >
          {isAvailable ? "Go Offline" : "Go Online"}
        </button>
      </div>

      {/* Requests List */}
      <h3 className="font-bold text-xl mb-4">Nearby Requests (10km)</h3>
      {requests.length === 0 ? (
        <p className="text-gray-500">No pending requests nearby.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="border p-4 rounded shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg">{req.vehicle_type} - {req.problem_desc}</h4>
                  <p className="text-sm text-gray-600">Distance: ~0.5 km</p>
                  <p className="text-xs text-gray-400">Time: {new Date(req.created_at).toLocaleTimeString()}</p>
                </div>
                <button 
                  onClick={() => acceptRequest(req.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  ACCEPT JOB
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}