import { useState, useEffect, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Map from "../components/Map";
import { toast } from 'react-hot-toast';

export default function MechanicDashboard() {
    const { user, logout } = useContext(AuthContext);
    

    const [requests, setRequests] = useState([]);
    const [activeJob, setActiveJob] = useState(null); // New: Track active job
    const [isAvailable, setIsAvailable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [skippedIds, setSkippedIds] = useState([]); // New: For "Skip" feature

    // Effects
    useEffect(() => {
        const interval = setInterval(fetchRequests, 5000);
        return () => clearInterval(interval);
    }, [isAvailable]); // Re-fetch if availability changes


    const fetchRequests = async () => {
        try {
            // 1. Get nearby requests
            const res = await api.get("/mechanic/requests");
            

            const active = res.data.find(r => r.status === "Accepted");
            const pending = res.data.filter(r => r.status === "Pending");
            
            setActiveJob(active || null);
            setRequests(pending);

        } catch (err) {
            console.log("Polling error:", err);
        }
    };

    const toggleAvailability = async () => {
        setLoading(true);
        if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        setLoading(false);
        return;
    }
navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            try {
                const res = await api.post(`/mechanic/availability?lat=${lat}&lng=${lng}`);
                setIsAvailable(res.data.is_available);
                if (res.data.is_available) fetchRequests(); 
            } catch (err) {
                console.error(err);
                toast.error("Error updating status");
            } finally {
                setLoading(false);
            }
        },
        (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location. Make sure GPS is enabled.");
            setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
};

    const acceptRequest = async (id) => {
        try {
            await api.post(`/requests/${id}/accept`);
            toast.success("Job Accepted! Head to the location.");
            fetchRequests(); // Refresh immediately
        } catch (err) {
            toast.error("Failed: " + (err.response?.data?.detail || "Check Console")); 
        }
    };

    const rejectRequest = async (id) => {
        if(!confirm("Decline this job?")) return;
        try {
            await api.post(`/requests/${id}/reject`);
            setRequests(prev => prev.filter(req => req.id !== id));
        } catch (err) {
            toast.error("Error declining: " + (err.response?.data?.detail || err.message));
        }
    };

    const skipRequest = (id) => {
        setSkippedIds(prev => [...prev, id]);
    };

const completeJob = async () => {
    if(!activeJob) return;
    if(!confirm("Mark job as complete?")) return;

    try {
        await api.post(`/requests/${activeJob.id}/complete`);

        toast.success("Job Completed Successfully!");
        setActiveJob(null);
        fetchRequests(); // Refresh the list
    } catch (err) {
        toast.error("Error completing job: " + (err.response?.data?.detail || err.message));
    }
};


    const visibleRequests = requests.filter(req => !skippedIds.includes(req.id));

    return (
        <div className="min-h-screen bg-gray-50 pb-12">

            <Navbar className="bg-white shadow-sm p-4 mb-6">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <span className="font-bold text-xl text-blue-600">RoadResque Partner</span>
                    <span className="text-gray-500 text-sm">Welcome, {user?.name || 'Mechanic'}</span>
                </div>
            </Navbar>

            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                        🔧 Mechanic Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your jobs and help people</p>
                </div>
            
                {/* Status Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                                activeJob 
                                    ? "bg-blue-100 text-blue-600" 
                                    : isAvailable 
                                        ? "bg-green-100 text-green-600" 
                                        : "bg-gray-100 text-gray-600"
                            }`}>
                                {activeJob ? "🚗" : isAvailable ? "✅" : "😴"}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {activeJob 
                                        ? "On Active Job" 
                                        : isAvailable 
                                            ? "Online & Scanning" 
                                            : "Currently Offline"
                                    }
                                </h2>
                                <p className="text-gray-500">
                                    {activeJob 
                                        ? "Complete your current job" 
                                        : isAvailable 
                                            ? "Looking for nearby requests..." 
                                            : "Go online to receive jobs"
                                    }
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={toggleAvailability}
                            disabled={loading || activeJob}
                            className={`px-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                                activeJob
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : isAvailable
                                        ? "bg-red-500 hover:bg-red-600"
                                        : "bg-green-500 hover:bg-green-600"
                            }`}
                        >
                            {loading ? "Updating..." : activeJob ? "🔒 Busy" : isAvailable ? "Go Offline 😴" : "Go Online ⚡"}
                        </button>
                    </div>
                </div>

                {/* Active Job Card */}
                {activeJob && (
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl shadow-2xl p-6 mb-6 text-white">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">🚨</span>
                            <h3 className="text-xl font-bold">Active Job</h3>
                            <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full uppercase">
                                {activeJob.status}
                            </span>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <span className="text-3xl">
                                    {activeJob.vehicle_type === "Car" ? "🚗" : "🏍️"}
                                </span>
                                <div>
                                    <h4 className="font-bold text-lg">{activeJob.vehicle_type}</h4>
                                    <p className="text-white/80">{activeJob.problem_desc}</p>
                                </div>
                            </div>
                        </div>

                        {/* Map Link */}
                        <a
                            href={`https://www.google.com/maps?q=${activeJob.lat},${activeJob.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-center font-medium mb-4 transition-all"
                        >
                            🗺️ Open in Google Maps
                        </a>

                        <div className="mb-4 text-gray-900"> {/* Added text-gray-900 to reset color inside the map */}
                             <Map lat={activeJob.lat} lng={activeJob.lng} />
                        </div>

                        {/* Complete Job Button */}
                        <button
                            onClick={completeJob}
                            className="w-full py-4 bg-green-500 hover:bg-green-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            <span>✅</span>
                            <span>COMPLETE JOB</span>
                        </button>
                    </div>
                )}

                {/* Requests List */}
                {!activeJob && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span>📍</span> Nearby Requests
                            </h3>
                            {skippedIds.length > 0 && (
                                <button
                                    onClick={() => setSkippedIds([])}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Show {skippedIds.length} skipped
                                </button>
                            )}
                        </div>

                        {!isAvailable ? (
                            <div className="py-12 text-center text-gray-500">
                                <div className="text-6xl mb-4">😴</div>
                                <p>Go online to see nearby requests</p>
                            </div>
                        ) : visibleRequests.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <div className="text-6xl mb-4">🔍</div>
                                <p>No requests nearby</p>
                                <p className="text-sm mt-1">We'll notify you when someone needs help</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {visibleRequests.map((req) => (
                                    <div key={req.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:shadow-md transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-2xl">
                                                    {req.vehicle_type === "Car" ? "🚗" : "🏍️"}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{req.vehicle_type}</h4>
                                                    <p className="text-gray-600 text-sm">{req.problem_desc}</p>
                                                    <p className="text-gray-400 text-xs mt-1">
                                                        {new Date(req.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <button
                                                onClick={() => acceptRequest(req.id)}
                                                className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-all"
                                            >
                                                ACCEPT
                                            </button>
                                         
                                            <button
                                                onClick={() => rejectRequest(req.id)} 
                                                className="py-3 bg-red-100 hover:bg-red-200 text-red-600 font-medium rounded-xl transition-all"
                                            >
                                                DECLINE
                                            </button>
                                        </div>
                                       
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}