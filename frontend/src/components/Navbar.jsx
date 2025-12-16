import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem("role");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        navigate("/login");
    };

    return (
        <>
            <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-xl">🚗</span>
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    Roadside Rescue
                                </h1>
                                <p className="text-xs text-gray-400 -mt-1">Help is on the way</p>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            {/* Role Badge */}
                            <div className={`
                                hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                                ${role === "mechanic" 
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" 
                                    : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                                }
                                shadow-lg
                            `}>
                                <span className="text-lg">{role === "mechanic" ? "🔧" : "👤"}</span>
                                <span className="capitalize">{role || "Guest"}</span>
                            </div>

                            {/* Mobile Role Icon */}
                            <div className={`
                                sm:hidden w-10 h-10 rounded-full flex items-center justify-center
                                ${role === "mechanic" 
                                    ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
                                    : "bg-gradient-to-r from-blue-500 to-cyan-500"
                                }
                            `}>
                                <span className="text-lg">{role === "mechanic" ? "🔧" : "👤"}</span>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="
                                    flex items-center gap-2 px-4 py-2 
                                    bg-gradient-to-r from-red-500 to-pink-500 
                                    hover:from-red-600 hover:to-pink-600
                                    text-white font-medium rounded-full
                                    shadow-lg hover:shadow-red-500/25
                                    transition-all duration-300 hover:scale-105
                                "
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3zm10.293 9.293a1 1 0 0 0 1.414 1.414l3-3a1 1 0 0 0 0-1.414l-3-3a1 1 0 1 0-1.414 1.414L14.586 9H7a1 1 0 1 0 0 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full shadow-2xl animate-slide-in">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">👋</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Leaving so soon?</h3>
                            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium rounded-xl transition"
                                >
                                    Yes, Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}