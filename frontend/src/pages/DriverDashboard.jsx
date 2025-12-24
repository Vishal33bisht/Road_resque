import { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Map from "../components/Map";

export default function DriverDashboard() {
    const { user } = useContext(AuthContext);

    // --- STATE ---
    const [vehicle, setVehicle] = useState("Car");
    const [problem, setProblem] = useState("");
    const [location, setLocation] = useState({ lat: null, lng: null });
    
    // UI States
    const [loadingLoc, setLoadingLoc] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("active");
    const [loading, setLoading] = useState(false);
    
    // Data
    const [myRequests, setMyRequests] = useState([]);

    // --- EFFECTS ---
    useEffect(() => {
        fetchRequests();
    }, []);

    // --- LOGIC ---

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get("/my-requests");
            // Sort by newest first
            const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setMyRequests(sorted);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
        setLoading(false);
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setLoadingLoc(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setLoadingLoc(false);
            },
            (error) => {
                setLoadingLoc(false);
                setLocationError("Unable to retrieve your location. Please try the test button.");
            },
            { enableHighAccuracy: false, timeout: 15000 }
        );
    };

    const useTestLocation = () => {
        setLocation({ lat: 30.3165, lng: 78.0322 }); // Dehradun
        setLocationError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location.lat) {
            alert("Please get your location first!");
            return;
        }

        setSubmitting(true);
        try {
            await api.post("/requests", {
                vehicle_type: vehicle,
                problem_desc: problem,
                lat: location.lat,
                lng: location.lng,
            });
            alert("Help Requested! Waiting for a mechanic...");
            setProblem("");
            setLocation({ lat: null, lng: null });
            fetchRequests(); // Refresh list
        } catch (err) {
            alert("Error submitting: " + (err.response?.data?.detail || err.message));
        }
        setSubmitting(false);
    };

    // --- NEW: CANCEL FUNCTION ---
    const cancelRequest = async (id) => {
        if (!confirm("Are you sure you want to cancel this request?")) return;
        try {
            await api.post(`/requests/${id}/cancel`);
            fetchRequests(); // Refresh list to show updated status
        } catch (err) {
            alert("Error cancelling: " + (err.response?.data?.detail || err.message));
        }
    };

    // --- FILTERING ---
    const activeRequests = myRequests.filter(
        req => req.status === 'Pending' || req.status === 'Accepted' || req.status === 'En Route'
    );
    const historyRequests = myRequests.filter(
        req => req.status === 'Completed' || req.status === 'Cancelled' || req.status === 'Rejected'
    );

    // --- HELPERS (Replacements for missing components) ---
    
    const StatusBadge = ({ status }) => {
        const styles = {
            Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
            Accepted: "bg-blue-100 text-blue-700 border-blue-200",
            "En Route": "bg-purple-100 text-purple-700 border-purple-200",
            Completed: "bg-green-100 text-green-700 border-green-200",
            Cancelled: "bg-red-100 text-red-700 border-red-200",
            Rejected: "bg-red-100 text-red-700 border-red-200",
        };
        const defaultStyle = "bg-gray-100 text-gray-700 border-gray-200";

        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || defaultStyle}`}>
                {status}
            </span>
        );
    };

    const LoadingSpinner = ({ size }) => (
        <svg 
            className={`animate-spin ${size === 'large' ? 'h-8 w-8' : 'h-5 w-5'} text-current`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            
            {/* Navbar Replacement */}
            <Navbar className="bg-white shadow-sm p-4 mb-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <span className="font-bold text-xl text-blue-600">RoadResque</span>
                    <span className="text-gray-500 text-sm">Welcome, {user?.name || 'Driver'}</span>
                </div>
            </Navbar>

            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="mb-6 animate-fade-in">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        🚑 Request Assistance
                    </h1>
                    <p className="text-gray-500 mt-1">Help is just a click away</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Request Form Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in h-fit">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                🆘
                            </span>
                            New Request
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Vehicle Type */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Vehicle Type
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {["Car", "Bike", "Truck"].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setVehicle(v)}
                                            className={`p-3 rounded-xl border-2 transition-all ${
                                                vehicle === v
                                                    ? "border-blue-500 bg-blue-50 shadow-md"
                                                    : "border-gray-200 hover:border-gray-300"
                                            }`}
                                        >
                                            <div className="text-2xl mb-1">
                                                {v === "Car" ? "🚗" : v === "Bike" ? "🏍️" : "🚛"}
                                            </div>
                                            <div className={`text-sm font-medium ${vehicle === v ? "text-blue-700" : "text-gray-600"}`}>
                                                {v}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Problem Description */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    What's the problem?
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-800 placeholder-gray-400 resize-none"
                                    rows="3"
                                    placeholder="e.g. Flat tire, battery dead, engine not starting..."
                                    value={problem}
                                    onChange={(e) => setProblem(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Your Location
                                </label>
                                
                                {locationError && (
                                    <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                                        ⚠️ {locationError}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        disabled={loadingLoc}
                                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                                            location.lat
                                                ? "bg-green-100 text-green-700 border-2 border-green-300"
                                                : "bg-blue-500 hover:bg-blue-600 text-white"
                                        }`}
                                    >
                                        {loadingLoc ? (
                                            <LoadingSpinner size="small" />
                                        ) : location.lat ? (
                                            <>✅ Location Set</>
                                        ) : (
                                            <>📍 Get Location</>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={useTestLocation}
                                        className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                                        title="Use Test Location"
                                    >
                                        🧪
                                    </button>
                                </div>

                                {location.lat && (
                                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-xs text-green-700 flex items-center justify-between">
                                        <span>📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
                                        <a
                                            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            <Map lat={location.lat} lng={location.lng} />
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!location.lat || loadingLoc || submitting}
                                className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span>Sending Request...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">🆘</span>
                                        <span>REQUEST HELP NOW</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                    
                    {/* Requests List Card */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in stagger-1">
                        {/* Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab("active")}
                                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                                    activeTab === "active"
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                Active ({activeRequests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-all ${
                                    activeTab === "history"
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                History ({historyRequests.length})
                            </button>
                        </div>

                        {/* Request List */}
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {loading ? (
                                <div className="py-12 flex flex-col items-center">
                                    <LoadingSpinner size="large" />
                                    <p className="mt-2 text-gray-400">Loading requests...</p>
                                </div>
                            ) : (activeTab === "active" ? activeRequests : historyRequests).length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="text-5xl mb-3">
                                        {activeTab === "active" ? "🎉" : "📋"}
                                    </div>
                                    <p className="text-gray-500">
                                        {activeTab === "active" 
                                            ? "No active requests" 
                                            : "No past requests yet"
                                        }
                                    </p>
                                </div>
                            ) : (
                                (activeTab === "active" ? activeRequests : historyRequests).map((req, index) => (
                                    <div
                                        key={req.id}
                                        className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl hover:shadow-md transition-all animate-fade-in"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">
                                                    {req.vehicle_type === "Car" ? "🚗" : req.vehicle_type === "Bike" ? "🏍️" : "🚛"}
                                                </span>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{req.vehicle_type}</h4>
                                                    <p className="text-sm text-gray-500">{req.problem_desc}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={req.status} />
                                        </div>

                                        {/* Mechanic Info */}
                                        {req.mechanic && (
                                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                                                            {(req.mechanic.name || "M").charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{req.mechanic.name || "Mechanic"}</p>
                                                            <p className="text-sm text-gray-500">{req.mechanic.phone}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`tel:${req.mechanic.phone}`}
                                                        className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all"
                                                    >
                                                        📞
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* Status Messages */}
                                        {req.status === "En Route" && (
                                            <div className="mt-3 p-2 bg-purple-50 rounded-lg text-purple-700 text-sm flex items-center gap-2 animate-pulse">
                                                <span>🚗</span>
                                                <span>Mechanic is on the way!</span>
                                            </div>
                                        )}

                                        {/* Cancel Button */}
                                        {req.status === "Pending" && (
                                            <button
                                                onClick={() => cancelRequest(req.id)}
                                                className="mt-3 w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-all border border-red-200"
                                            >
                                                ❌ Cancel Request
                                            </button>
                                        )}

                                        {/* Timestamp */}
                                        <p className="mt-2 text-xs text-gray-400">
                                            {new Date(req.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}