import { useState, useEffect } from "react";
import api from "../api";

export default function DriverDashboard(){
    const [vehicle, setVehicle] = useState("Car");
    const [problem, setProblem] = useState("");
    const [location, setLocation] = useState({lat: null, lng: null});
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [myRequests, setMyRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get("/my-requests");
            setMyRequests(res.data);
        } catch(err) {
            console.error("Failed to fetch requests", err);
        }
    };
    
    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            alert("Geolocation is not supported by your browser");
            return;
        }

        setLoadingLoc(true);
        setLocationError(null);

        // Try with low accuracy first (faster, uses network location)
        const quickOptions = {
            enableHighAccuracy: false, // Use network location (faster)
            timeout: 15000, // 15 seconds
            maximumAge: 60000 // Accept cached location up to 1 minute old
        };

        console.log("🔍 Attempting to get location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("✅ Location detected:", position.coords);
                console.log("📍 Accuracy:", position.coords.accuracy, "meters");
                console.log("⏰ Timestamp:", new Date(position.timestamp).toLocaleString());
                console.log("🎯 Method:", position.coords.accuracy < 100 ? "GPS" : "Network/WiFi");
                
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setLoadingLoc(false);
                setLocationError(null);
            },
            (error) => {
                console.error("❌ Geolocation error:", error);
                console.error("Error code:", error.code);
                console.error("Error message:", error.message);
                
                setLoadingLoc(false);
                
                let errorMessage = "";
                let suggestion = "";
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission denied.";
                        suggestion = "Click the lock icon in your browser's address bar and allow location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        suggestion = "Make sure location services are enabled on your device. Try using the Test Location button below.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        suggestion = "This usually happens indoors or in areas with poor GPS signal. Try: 1) Moving near a window, 2) Using Test Location button, or 3) Enabling WiFi for better location accuracy.";
                        break;
                    default:
                        errorMessage = "An unknown error occurred.";
                        suggestion = "Try using the Test Location button below.";
                        break;
                }
                
                const fullError = `${errorMessage}\n\n${suggestion}`;
                setLocationError(fullError);
                alert(fullError);
            },
            quickOptions
        );
    };

    const useTestLocation = () => {
        // Dehradun coordinates (since you mentioned you're in Dehradun)
        setLocation({ lat: 30.3165, lng: 78.0322 }); 
        setLocationError(null);
        alert("✅ Test location set to Dehradun city center");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location.lat) {
            alert("Please get your location first!");
            return;
        }

        try {
            await api.post("/requests", {
                vehicle_type: vehicle,
                problem_desc: problem,
                lat: location.lat,
                lng: location.lng,  // Backend expects lng but stores as lon
            });
            alert("Help Requested! Waiting for a mechanic...");
            setProblem("");
            setLocation({lat: null, lng: null});
            fetchRequests(); // Refresh list
        } catch (err) {
            console.error("Submit error:", err);
            alert("Error submitting request: " + (err.response?.data?.detail || err.message));
        }
    };

   return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">🚑 Request Roadside Assistance</h2>

            {/* Request Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Vehicle Type</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                    >
                        <option value="Car">Car</option>
                        <option value="Bike">Bike</option>
                        <option value="Truck">Truck</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">Problem Description</label>
                    <textarea
                        className="w-full p-2 border rounded"
                        placeholder="e.g. Flat tire, battery dead..."
                        value={problem}
                        onChange={(e) => setProblem(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    
                    {/* Location Error Display */}
                    {locationError && (
                        <div className="mb-2 p-3 bg-red-50 border border-red-300 text-red-800 rounded text-sm whitespace-pre-line">
                            {locationError}
                        </div>
                    )}

                    {/* Location Buttons */}
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={getLocation}
                            disabled={loadingLoc}
                            className={`${
                                loadingLoc 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600'
                            } text-white font-bold py-2 px-4 rounded inline-flex items-center justify-center`}
                        >
                            {loadingLoc ? (
                                <>🔄 Detecting Location...</>
                            ) : location.lat ? (
                                <>✅ Location Set</>
                            ) : (
                                <>📍 Get GPS Location</>
                            )}
                        </button>

                        {/* Test Location Button for Development */}
                        <button
                            type="button"
                            onClick={useTestLocation}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded text-sm"
                        >
                            🧪 Use Test Location (Dev)
                        </button>
                    </div>

                    {/* Display Current Coordinates */}
                    {location.lat && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <div className="text-xs text-green-700 mb-2">
                                📍 Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                            </div>
                            <a
                                href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                                🗺️ View on Google Maps
                            </a>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!location.lat || loadingLoc}
                >
                    REQUEST HELP NOW
                </button>
            </form>

            {/* My Requests Section */}
            <div className="mt-8 border-t pt-4">
                <h3 className="font-bold text-lg mb-2">My Requests</h3>
                {myRequests.length === 0 ? (
                    <p className="text-gray-500">No active requests.</p>
                ) : (
                    <ul className="space-y-2">
                        {myRequests.map((req) => (
                            <li key={req.id} className="p-3 bg-gray-50 border rounded flex justify-between">
                                <span>{req.vehicle_type}: {req.problem_desc}</span>
                                <span className={`font-bold ${req.status === 'Pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {req.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}