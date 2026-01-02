import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wrench, Car, MapPin, Clock, Shield, Zap } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Response",
      desc: "Get help within minutes, 24/7"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Real-time Tracking",
      desc: "Track mechanic location live"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Verified Mechanics",
      desc: "All mechanics are certified"
    }
  ];

  return (
    <div className="landing-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        className="navbar glass-effect"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="nav-content">
          <div className="logo-section">
            <Car className="logo-icon" />
            <span className="logo-text">Roadside Rescue</span>
          </div>
          <div className="nav-buttons">
            <button 
              className="btn-secondary"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button 
              className="btn-primary"
              onClick={() => navigate('/register')}
            >
              Get Started
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Stranded on the Road?
            <span className="gradient-text"> Help is Here.</span>
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Connect with nearby mechanics instantly. Get back on the road in minutes, not hours.
          </motion.p>

          <motion.div 
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button 
              className="cta-button primary"
              onClick={() => navigate('/register?role=driver')}
            >
              <span>I Need Help</span>
              <Car className="ml-2" />
            </button>
            <button 
              className="cta-button secondary"
              onClick={() => navigate('/register?role=mechanic')}
            >
              <span>I'm a Mechanic</span>
              <Wrench className="ml-2" />
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="stats-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="stat-item">
              <h3>5 min</h3>
              <p>Avg Response Time</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h3>500+</h3>
              <p>Verified Mechanics</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Always Available</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Image/Animation */}
        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="floating-card">
            <div className="card-content">
              <div className="pulse-dot"></div>
              <p className="card-text">Mechanic is 2 km away</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why Choose Us?
        </motion.h2>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card glass-effect"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        
        <div className="steps-container">
          {[
            { step: "1", title: "Request Help", desc: "Tap the button and describe your problem" },
            { step: "2", title: "Get Matched", desc: "We find the nearest available mechanic" },
            { step: "3", title: "Track Arrival", desc: "Watch them arrive in real-time" },
            { step: "4", title: "Get Fixed", desc: "Your vehicle is ready to go!" }
          ].map((item, index) => (
            <motion.div
              key={index}
              className="step-card"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="step-number">{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <motion.div 
          className="cta-card glass-effect"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of drivers and mechanics already using our platform</p>
          <button 
            className="cta-button primary large"
            onClick={() => navigate('/register')}
          >
            Sign Up Free
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Roadside Rescue. Help is on the way.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
