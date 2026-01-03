import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Bike, Truck, MapPin, Clock, Phone, 
  CheckCircle, XCircle, Loader, Navigation,
  AlertCircle, LogOut, History, Plus
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { toast } from 'react-hot-toast';
import api from '../api';
import './DriverDashboard.css';
import 'leaflet/dist/leaflet.css';
//const [lastFetchTime, setLastFetchTime] = useState(0);

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  
  // New Request Form State
  const [vehicleType, setVehicleType] = useState('car');
  const [problemDesc, setProblemDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
    getUserLocation();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

//   useEffect(() => {
//   if (isOnline) {
//     fetchRequests(); // Fetch immediately when going online
//   }
// }, [isOnline]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          toast.error('Please enable location services');
        }
      );
    }
  };

  const fetchRequests = async () => {
    const now = Date.now();
  if (now - lastFetchTime < 3000) return;
  
    try {
      const response = await api.get('/my-requests');
      setRequests(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      toast.error('Waiting for location...');
      return;
    }

    if (problemDesc.length < 5) {
      toast.error('Please describe your problem in detail');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/requests', {
        vehicle_type: vehicleType,
        problem_desc: problemDesc,
        lat: userLocation.lat,
        lng: userLocation.lng
      });

      toast.success('🚨 Help request sent! Finding nearby mechanics...');
      setShowNewRequest(false);
      setProblemDesc('');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      await api.post(`/requests/${requestId}/cancel`);
      toast.success('Request cancelled');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to cancel request');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const activeRequests = requests.filter(r => 
    ['Pending', 'Accepted', 'En Route'].includes(r.status)
  );
  
  const historyRequests = requests.filter(r => 
    ['Completed', 'Cancelled', 'Rejected'].includes(r.status)
  );

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'status-pending',
      'Accepted': 'status-accepted',
      'En Route': 'status-enroute',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled',
      'Rejected': 'status-rejected'
    };
    return colors[status] || 'status-pending';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <Clock className="w-5 h-5" />;
      case 'Accepted': return <CheckCircle className="w-5 h-5" />;
      case 'En Route': return <Navigation className="w-5 h-5" />;
      case 'Completed': return <CheckCircle className="w-5 h-5" />;
      case 'Cancelled': return <XCircle className="w-5 h-5" />;
      case 'Rejected': return <AlertCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const VehicleIcon = ({ type }) => {
    switch(type.toLowerCase()) {
      case 'car': return <Car className="w-6 h-6" />;
      case 'bike': return <Bike className="w-6 h-6" />;
      case 'truck': return <Truck className="w-6 h-6" />;
      default: return <Car className="w-6 h-6" />;
    }
  };

  return (
    <div className="driver-dashboard">
      {/* Header */}
      <motion.header 
        className="dashboard-header glass-effect"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="header-content">
          <div className="header-left">
            <Car className="header-icon" />
            <div>
              <h1>Driver Dashboard</h1>
              <p className="header-subtitle">Request help anytime</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-create"
              onClick={() => setShowNewRequest(true)}
            >
              <Plus className="w-5 h-5" />
              Request Help
            </button>
            <button 
              className="btn-logout"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <div className="dashboard-container">
        {/* Tabs */}
        <div className="tabs-container">
          <motion.button
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Clock className="w-5 h-5" />
            Active ({activeRequests.length})
          </motion.button>
          <motion.button
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <History className="w-5 h-5" />
            History ({historyRequests.length})
          </motion.button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              className="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader className="spinner" />
              <p>Loading requests...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="requests-grid"
            >
              {activeTab === 'active' ? (
                activeRequests.length === 0 ? (
                  <div className="empty-state glass-effect">
                    <div className="empty-icon">🚗</div>
                    <h3>No Active Requests</h3>
                    <p>Click "Request Help" when you need assistance</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowNewRequest(true)}
                    >
                      <Plus className="w-5 h-5" />
                      Create Request
                    </button>
                  </div>
                ) : (
                  activeRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="request-card glass-effect"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="request-header">
                        <div className="vehicle-badge">
                          <VehicleIcon type={request.vehicle_type} />
                          <span>{request.vehicle_type}</span>
                        </div>
                        <div className={`status-badge ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status}</span>
                        </div>
                      </div>

                      <div className="request-body">
                        <div className="problem-section">
                          <AlertCircle className="w-5 h-5 text-orange-400" />
                          <p>{request.problem_desc}</p>
                        </div>

                        {request.mechanic && (
                          <motion.div 
                            className="mechanic-info"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                          >
                            <div className="mechanic-header">
                              <div className="mechanic-avatar">
                                🔧
                              </div>
                              <div>
                                <p className="mechanic-name">{request.mechanic.name}</p>
                                <p className="mechanic-label">Assigned Mechanic</p>
                              </div>
                            </div>
                            <a 
                              href={`tel:${request.mechanic.phone}`}
                              className="btn-call"
                            >
                              <Phone className="w-4 h-4" />
                              Call Mechanic
                            </a>
                          </motion.div>
                        )}

                        <div className="request-meta">
                          <div className="meta-item">
                            <MapPin className="w-4 h-4" />
                            <span>Location saved</span>
                          </div>
                          <div className="meta-item">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(request.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {request.status === 'Pending' && (
                        <div className="request-actions">
                          <button
                            className="btn-cancel"
                            onClick={() => handleCancelRequest(request.id)}
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Request
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )
              ) : (
                historyRequests.length === 0 ? (
                  <div className="empty-state glass-effect">
                    <div className="empty-icon">📋</div>
                    <h3>No History Yet</h3>
                    <p>Your completed requests will appear here</p>
                  </div>
                ) : (
                  historyRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="request-card glass-effect history-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="request-header">
                        <div className="vehicle-badge">
                          <VehicleIcon type={request.vehicle_type} />
                          <span>{request.vehicle_type}</span>
                        </div>
                        <div className={`status-badge ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span>{request.status}</span>
                        </div>
                      </div>

                      <div className="request-body">
                        <p className="problem-text">{request.problem_desc}</p>
                        <div className="request-meta">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Request Modal */}
{/* New Request Modal */}
<AnimatePresence>
  {showNewRequest && (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowNewRequest(false)}
    >
      <motion.div 
        className="modal-content glass-effect"
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()} // ✅ Prevent closing when clicking inside
      >
        <div className="modal-header">
          <h2>Request Assistance</h2>
          <button 
            className="modal-close"
            onClick={() => setShowNewRequest(false)}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleCreateRequest} className="request-form">
          <div className="form-group">
            <label>Vehicle Type</label>
            <div className="vehicle-selector">
              {['car', 'bike', 'truck'].map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  className={`vehicle-option ${vehicleType === type ? 'selected' : ''}`}
                  onClick={() => setVehicleType(type)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <VehicleIcon type={type} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>What's the problem?</label>
            <textarea
              value={problemDesc}
              onChange={(e) => setProblemDesc(e.target.value)}
              placeholder="e.g., Flat tire, battery dead, engine not starting..."
              rows={4}
              required
              minLength={5}
              className="form-textarea"
            />
            <p className="input-hint">{problemDesc.length}/500 characters</p>
          </div>

          <div className="form-group">
            <div className="location-indicator">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span>
                {userLocation 
                  ? '✓ Location detected' 
                  : '⏳ Getting your location...'}
              </span>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowNewRequest(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting || !userLocation}
            >
              {isSubmitting ? (
                <>
                  <Loader className="spinner-small" />
                  Sending...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  Request Help Now
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
};

export default DriverDashboard;
