import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  Car,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import api from '../api';
import { AuthContext } from '../context/auth-context';
import './AuthPages.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    try {
      const res = await api.post('/login', params);
      const nextUser = res.data.user;
      login(nextUser);
      navigate(nextUser?.role === 'mechanic' ? '/mechanic-dashboard' : '/user-dashboard', {
        replace: true,
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-showcase" aria-label="Roadside Rescue overview">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <Car size={26} />
          </span>
          <span>Roadside Rescue</span>
        </div>

        <div className="auth-hero-copy">
          <span className="auth-kicker">Fast help, clear tracking</span>
          <h1>Welcome back to your roadside command center.</h1>
          <p>
            Continue managing live help requests, mechanic availability, and secure service
            updates from one focused dashboard.
          </p>
        </div>

        <div className="auth-map-preview">
          <div className="auth-route-line" />
          <span className="auth-map-pin auth-map-pin-user">
            <Car size={16} />
          </span>
          <span className="auth-map-pin auth-map-pin-mechanic">
            <Wrench size={16} />
          </span>
          <div className="auth-status-card">
            <MapPin size={18} />
            <div>
              <strong>Mechanic nearby</strong>
              <span>Live ETA updates enabled</span>
            </div>
          </div>
        </div>

        <div className="auth-benefits">
          <div>
            <ShieldCheck size={20} />
            <span>Protected sessions</span>
          </div>
          <div>
            <MapPin size={20} />
            <span>Location-aware support</span>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="auth-card-icon">
              <Lock size={22} />
            </span>
            <div>
              <h2 id="login-title">Sign in</h2>
              <p>Use your account to open the right dashboard.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span>Email address</span>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="auth-icon-button"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight size={19} />
            </button>
          </form>

          <p className="auth-switch">
            New to Roadside Rescue?
            <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
