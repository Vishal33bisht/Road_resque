import { useContext, useState } from 'react';
import api from '../api';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getApiErrorMessage } from '../utils/errorHandler';
import { AuthContext } from '../context/auth-context';

const normalizePhone = (phone) => {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
};

const normalizeCountryCode = (code) => {
  const digits = code.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

export default function Register() {
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const initialRole = requestedRole === 'mechanic' ? 'mechanic' : 'user';
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    password: "",
    role: initialRole
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: normalizePhone(`${normalizeCountryCode(formData.countryCode)}${formData.phone}`),
        role: formData.role,
      });
      const nextUser = res.data.user;
      login(nextUser);
      toast.success(formData.role === 'mechanic' ? "Mechanic account created!" : "Account created!");
      navigate(nextUser?.role === 'mechanic' ? '/mechanic-dashboard' : '/user-dashboard');
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-800 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-white rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
            <div className="mb-6 bg-white/20 p-6 rounded-full backdrop-blur-md">
                <span className="text-6xl">🚀</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">Join Roadside Rescue</h1>
            <p className="text-lg text-blue-100 text-center max-w-md">
                Become part of the fastest growing emergency assistance network. 
                Whether you drive or fix, we have a spot for you.
            </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
            <p className="text-gray-600">Get started in less than a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-xl mb-6">
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`py-2 text-sm font-bold rounded-lg transition-all ${
                        formData.role === 'user' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    👤 User
                </button>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'mechanic' })}
                    className={`py-2 text-sm font-bold rounded-lg transition-all ${
                        formData.role === 'mechanic' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    🔧 Mechanic
                </button>
            </div>
            {formData.role === 'mechanic' && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Your account will open the mechanic dashboard after signup.
                </div>
            )}

            {/* Inputs */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder=""
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                    type="email" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder=""
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="flex gap-2">
                    <input
                        type="tel"
                        inputMode="tel"
                        className="w-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+91"
                        aria-label="Country code"
                        value={formData.countryCode}
                        onChange={(e) => setFormData({...formData, countryCode: e.target.value})}
                        required
                    />
                    <input
                        type="tel"
                        inputMode="tel"
                        className="flex-1 min-w-0 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Phone number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">You can edit the country code before signing up.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    type="password" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder=""
                    value={formData.password}
                    minLength={8}
                    title="Use at least 8 characters with one uppercase letter and one number"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                />
                <p className="mt-1 text-xs text-gray-500">At least 8 characters with one uppercase letter and one number.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all mt-4 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
