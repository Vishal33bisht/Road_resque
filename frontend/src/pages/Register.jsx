import { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  Car,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';
import api from '../api';
import { AuthContext } from '../context/auth-context';
import { getApiErrorMessage } from '../utils/errorHandler';
import './AuthPages.css';

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
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    password: '',
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/register', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: normalizePhone(`${normalizeCountryCode(formData.countryCode)}${formData.phone}`),
        role: formData.role,
      });
      const nextUser = res.data.user;
      login(nextUser);
      toast.success(formData.role === 'mechanic' ? 'Mechanic account created!' : 'Account created!');
      navigate(nextUser?.role === 'mechanic' ? '/mechanic-dashboard' : '/user-dashboard', {
        replace: true,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell auth-shell-register">
      <section className="auth-showcase" aria-label="Roadside Rescue signup overview">
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <Car size={26} />
          </span>
          <span>Roadside Rescue</span>
        </div>

        <div className="auth-hero-copy">
          <span className="auth-kicker">Join the assistance network</span>
          <h1>Create your account and get moving in minutes.</h1>
          <p>
            Drivers can request trusted help. Mechanics can receive nearby jobs, update
            availability, and complete service from the dashboard.
          </p>
        </div>

        <div className="auth-role-preview">
          <div className="auth-preview-row active">
            <span>
              <Car size={18} />
            </span>
            <div>
              <strong>Driver dashboard</strong>
              <small>Request help and track arrival</small>
            </div>
          </div>
          <div className="auth-preview-row">
            <span>
              <Wrench size={18} />
            </span>
            <div>
              <strong>Mechanic dashboard</strong>
              <small>Accept jobs and manage routes</small>
            </div>
          </div>
          <div className="auth-preview-row">
            <span>
              <ShieldCheck size={18} />
            </span>
            <div>
              <strong>Secure account</strong>
              <small>Protected access to service data</small>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="register-title">
        <div className="auth-card auth-card-wide">
          <div className="auth-card-header">
            <span className="auth-card-icon">
              <User size={22} />
            </span>
            <div>
              <h2 id="register-title">Create account</h2>
              <p>Choose your role and fill in your details.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-role-toggle" aria-label="Account role">
              <button
                type="button"
                className={formData.role === 'user' ? 'selected' : ''}
                onClick={() => updateField('role', 'user')}
              >
                <Car size={18} />
                Driver
              </button>
              <button
                type="button"
                className={formData.role === 'mechanic' ? 'selected' : ''}
                onClick={() => updateField('role', 'mechanic')}
              >
                <Wrench size={18} />
                Mechanic
              </button>
            </div>

            <label className="auth-field">
              <span>Full name</span>
              <div className="auth-input-wrap">
                <User size={18} />
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="auth-field">
              <span>Email address</span>
              <div className="auth-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
              </div>
            </label>

            <div className="auth-field">
              <span>Phone number</span>
              <div className="auth-phone-row">
                <div className="auth-input-wrap auth-country-code">
                  <input
                    type="tel"
                    inputMode="tel"
                    aria-label="Country code"
                    placeholder="+91"
                    value={formData.countryCode}
                    onChange={(e) => updateField('countryCode', e.target.value)}
                    required
                  />
                </div>
                <div className="auth-input-wrap">
                  <Phone size={18} />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <Lock size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  minLength={8}
                  title="Use at least 8 characters with one uppercase letter and one number"
                  onChange={(e) => updateField('password', e.target.value)}
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
              <small>Use at least 8 characters with one uppercase letter and one number.</small>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
              <ArrowRight size={19} />
            </button>
          </form>

          <p className="auth-switch">
            Already registered?
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
