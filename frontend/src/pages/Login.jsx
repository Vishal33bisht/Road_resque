import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    try {
      const res = await api.post("/login", params);
      login(res.data.access_token);
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      alert(
        "Login failed: " +
          (error.response?.data?.detail || "Check console for details")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Logo/Icon */}
          <div className="mb-8 transform hover:scale-110 transition-transform duration-300">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🚑</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold mb-4 text-center">
            Roadside Rescue
          </h1>
          <p className="text-xl text-blue-100 mb-8 text-center max-w-md">
            Help is just a click away. Connect with nearby mechanics instantly.
          </p>

          {/* Features */}
          <div className="space-y-4 max-w-md w-full">
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
               ⚡
              </div>
              <div>
                <h3 className="font-semibold">Fast Response</h3>
                <p className="text-sm text-blue-100">
                  Get help in under 15 minutes
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
               📍
              </div>
              <div>
                <h3 className="font-semibold">Real-time Tracking</h3>
                <p className="text-sm text-blue-100">
                  Track mechanic location live
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
               ✅
              </div>
              <div>
                <h3 className="font-semibold">Verified Mechanics</h3>
                <p className="text-sm text-blue-100">
                  All professionals are vetted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-3xl">
              🚑
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6">
            <Link
              to="/register"
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-semibold transition-all"
            >
              Create new account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}