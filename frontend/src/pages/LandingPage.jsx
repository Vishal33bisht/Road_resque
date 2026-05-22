import { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { AuthContext } from '../context/auth-context';
import './LandingPage.css';

const MotionDiv = motion.div;
const MotionSection = motion.section;

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useContext(AuthContext);

  const goToDashboard = () => {
    if (user?.role === 'mechanic') {
      navigate('/mechanic-dashboard');
      return;
    }
    if (user?.role === 'user') {
      navigate('/user-dashboard');
      return;
    }
    navigate('/login');
  };

  const liveJobs = [
    { vehicle: 'Car', issue: 'Battery jump start', eta: '6 min', status: 'Accepted' },
    { vehicle: 'Bike', issue: 'Flat tyre support', eta: '11 min', status: 'En Route' },
    { vehicle: 'Truck', issue: 'Engine diagnostic', eta: '18 min', status: 'Pending' },
  ];

  return (
    <div className="landing-shell">
      <nav className="landing-nav">
        <button className="brand-lockup" onClick={() => navigate('/')} type="button">
          <span className="brand-mark">
            <Car size={22} />
          </span>
          <span>Roadside Rescue</span>
        </button>

        <div className="nav-actions">
          {!loading && user ? (
            <button className="nav-primary" onClick={goToDashboard} type="button">
              Dashboard
              <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <button className="nav-ghost" onClick={() => navigate('/login')} type="button">
                Login
              </button>
              <button className="nav-primary" onClick={() => navigate('/register')} type="button">
                Sign Up
                <ArrowRight size={18} />
              </button>
            </>
          )}
        </div>
      </nav>

      <main>
        <MotionSection
          className="hero-dashboard"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={16} />
              Smart roadside assistance dashboard
            </div>
            <h1>Roadside Rescue</h1>
            <p>
              Request help, track mechanics live, and manage roadside jobs from one fast,
              secure dashboard.
            </p>

            <div className="hero-actions">
              <button className="hero-primary" onClick={() => navigate('/register?role=user')} type="button">
                I Need Help
                <Car size={20} />
              </button>
              <button className="hero-secondary" onClick={() => navigate('/register?role=mechanic')} type="button">
                Join as Mechanic
                <Wrench size={20} />
              </button>
            </div>

            <div className="trust-strip" aria-label="Platform metrics">
              <div>
                <strong>24/7</strong>
                <span>Live dispatch</span>
              </div>
              <div>
                <strong>30m</strong>
                <span>Secure sessions</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Mechanic network</span>
              </div>
            </div>
          </div>

          <MotionDiv
            className="dashboard-preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="preview-topbar">
              <div>
                <span className="preview-label">Control Center</span>
                <h2>Live Roadside Desk</h2>
              </div>
              <span className="online-pill">
                <Activity size={15} />
                Online
              </span>
            </div>

            <div className="status-grid">
              <div className="metric-card urgent">
                <Clock3 size={22} />
                <span>Avg ETA</span>
                <strong>9 min</strong>
              </div>
              <div className="metric-card calm">
                <ShieldCheck size={22} />
                <span>Secure auth</span>
                <strong>HttpOnly</strong>
              </div>
            </div>

            <div className="map-panel">
              <div className="route-line" />
              <span className="map-pin driver">
                <Car size={16} />
              </span>
              <span className="map-pin mechanic">
                <Wrench size={16} />
              </span>
              <div className="arrival-card">
                <Navigation size={18} />
                <div>
                  <strong>Mechanic arriving</strong>
                  <span>2.4 km away</span>
                </div>
              </div>
            </div>

            <div className="jobs-list">
              {liveJobs.map((job) => (
                <div className="job-row" key={`${job.vehicle}-${job.issue}`}>
                  <div className="job-icon">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <strong>{job.issue}</strong>
                    <span>{job.vehicle} service</span>
                  </div>
                  <div className="job-meta">
                    <span>{job.eta}</span>
                    <small>{job.status}</small>
                  </div>
                </div>
              ))}
            </div>
          </MotionDiv>
        </MotionSection>

        <section className="quick-actions">
          {[
            {
              icon: <PhoneCall size={24} />,
              title: 'Request assistance',
              text: 'Create a service request with location, vehicle type, and issue details.',
            },
            {
              icon: <MapPin size={24} />,
              title: 'Track live arrival',
              text: 'Follow assigned mechanic location in real time from the customer dashboard.',
            },
            {
              icon: <CheckCircle2 size={24} />,
              title: 'Complete the job',
              text: 'Mechanics accept, start, complete, and manage active work cleanly.',
            },
          ].map((item) => (
            <MotionDiv className="action-card" key={item.title} whileHover={{ y: -6 }}>
              <div className="action-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </MotionDiv>
          ))}
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
