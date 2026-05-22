import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

const MotionHeader = motion.header;
const MotionButton = motion.button;
const MotionDiv = motion.div;

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationError, setLocationError] = useState('');
  const [liveMechanicLocations, setLiveMechanicLocations] = useState({});
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const lastFetchTimeRef = useRef(lastFetchTime);
  
  // New Request Form State
  const [vehicleType, setVehicleType] = useState('car');
  const [problemDesc, setProblemDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocationErrorMessage = (error) => {
    if (!window.isSecureContext) {
      return 'Location works only on HTTPS or localhost. Open this app with a secure URL.';
    }

    switch (error?.code) {
      case error?.PERMISSION_DENIED:
        return 'Location permission is blocked. Allow location access in your browser settings.';
      case error?.POSITION_UNAVAILABLE:
        return 'Your device location is unavailable right now. Check GPS or network location.';
      case error?.TIMEOUT:
        return 'Location request timed out. Try again from a place with better signal.';
      default:
        return 'Unable to get your location. Please try again.';
    }
  };

  const getUserLocation = useCallback(() => {
    setLocationStatus('loading');
    setLocationError('');

    if (!navigator.geolocation) {
      const message = 'Your browser does not support location services.';
      setLocationStatus('error');
      setLocationError(message);
      setUserLocation(null);
      toast.error(message);
      return;
    }

    if (!window.isSecureContext) {
      const message = 'Location works only on HTTPS or localhost. Open this app with a secure URL.';
      setLocationStatus('error');
      setLocationError(message);
      setUserLocation(null);
      toast.error(message);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('success');
      },
      (error) => {
        const message = getLocationErrorMessage(error);
        setLocationStatus('error');
        setLocationError(message);
        setUserLocation(null);
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  }, []);

  const fetchRequests = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 3000) return;
    lastFetchTimeRef.current = now;
    setLastFetchTime(now);
  
    try {
      const response = await api.get('/my-requests');
      setRequests(response.data.requests ?? response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setLoading(false);
    }
  }, []);

  const getWebSocketUrl = useCallback((requestId) => {
    const baseUrl = new URL(api.defaults.baseURL || window.location.origin, window.location.origin);
    baseUrl.protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    baseUrl.pathname = `/ws/requests/${requestId}/mechanic-location`;
    baseUrl.search = '';
    return baseUrl.toString();
  }, []);

  useEffect(() => {
    fetchRequests();
    getUserLocation();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests, getUserLocation]);

  useEffect(() => {
    if (showNewRequest && !userLocation && locationStatus !== 'loading') {
      getUserLocation();
    }
  }, [showNewRequest, userLocation, locationStatus, getUserLocation]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      if (locationStatus === 'error') {
        toast.error(locationError || 'Please enable location services');
      } else {
        toast.error('Still getting your location...');
        getUserLocation();
      }
      return;
    }

    if (problemDesc.trim().length < 10) {
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
    } catch {
      toast.error('Failed to cancel request');
    }
  };

  const handleLogout = () => {
    api.post('/logout').catch(() => {});
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const activeRequests = useMemo(() => requests.filter(r => 
    ['Pending', 'Accepted', 'En Route'].includes(r.status)
  ), [requests]);
  
  const historyRequests = useMemo(() => requests.filter(r => 
    ['Completed', 'Cancelled', 'Rejected'].includes(r.status)
  ), [requests]);

  const trackedRequestIds = useMemo(
    () => activeRequests
      .filter((request) => request.mechanic && ['Accepted', 'En Route'].includes(request.status))
      .map((request) => request.id),
    [activeRequests]
  );

  useEffect(() => {
    if (trackedRequestIds.length === 0) return undefined;

    const sockets = trackedRequestIds.map((requestId) => {
      const socket = new WebSocket(getWebSocketUrl(requestId));

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type !== 'mechanic_location') return;

        setLiveMechanicLocations((current) => ({
          ...current,
          [payload.request_id]: {
            lat: payload.lat,
            lng: payload.lng,
            distanceKm: payload.distance_km,
            updatedAt: Date.now()
          }
        }));
      };

      return socket;
    });

    return () => sockets.forEach((socket) => socket.close());
  }, [trackedRequestIds, getWebSocketUrl]);

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const radiusKm = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * Math.PI / 180)
      * Math.cos(lat2 * Math.PI / 180)
      * Math.sin(dLng / 2)
      * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (radiusKm * c).toFixed(1);
  };

  const getMechanicLocation = (request) => {
    const liveLocation = liveMechanicLocations[request.id];
    if (liveLocation) return liveLocation;
    if (request.mechanic?.latitude != null && request.mechanic?.longitude != null) {
      return {
        lat: request.mechanic.latitude,
        lng: request.mechanic.longitude,
        distanceKm: request.mechanic.distance_km,
        updatedAt: null
      };
    }
    return null;
  };

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
      <MotionHeader 
        className="dashboard-header glass-effect"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="header-content">
          <div className="header-left">
            <Car className="header-icon" />
            <div>
              <h1>User Dashboard</h1>
              <p className="header-subtitle">Request help anytime</p>
            </div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-create"
              onClick={() => setShowNewRequest(true)}
            >
              <Plus className="w-5 h-5" />
              <span>Request Help</span>
            </button>
            <button 
              className="btn-logout"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </MotionHeader>

      <div className="dashboard-container">
        {/* Tabs */}
        <div className="tabs-container">
          <MotionButton
            className={`tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Clock className="w-5 h-5" />
            Active ({activeRequests.length})
          </MotionButton>
          <MotionButton
            className={`tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <History className="w-5 h-5" />
            History ({historyRequests.length})
          </MotionButton>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <MotionDiv 
              className="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader className="spinner" />
              <p>Loading requests...</p>
            </MotionDiv>
          ) : (
            <MotionDiv
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
                  activeRequests.map((request) => {
                    const mechanicLocation = getMechanicLocation(request);
                    const mechanicDistance = mechanicLocation?.distanceKm
                      ?? (mechanicLocation
                        ? calculateDistance(request.lat, request.lng, mechanicLocation.lat, mechanicLocation.lng)
                        : null);

                    return (
                    <MotionDiv
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
                          <MotionDiv 
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
                            {mechanicLocation && (
                              <div className="live-location-status">
                                <MapPin className="w-4 h-4 text-green-400" />
                                <span>
                                  Live location active
                                  {mechanicDistance ? ` - ${mechanicDistance} km away` : ''}
                                </span>
                              </div>
                            )}
                            <a 
                              href={`tel:${request.mechanic.phone}`}
                              className="btn-call"
                            >
                              <Phone className="w-4 h-4" />
                              Call Mechanic
                            </a>
                          </MotionDiv>
                        )}

                        {mechanicLocation && (
                          <div className="live-map">
                            <MapContainer
                              center={[mechanicLocation.lat, mechanicLocation.lng]}
                              zoom={13}
                              style={{ height: '220px', width: '100%', borderRadius: '12px' }}
                            >
                              <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                              />
                              <Marker position={[request.lat, request.lng]}>
                                <Popup>Your Location</Popup>
                              </Marker>
                              <Marker position={[mechanicLocation.lat, mechanicLocation.lng]}>
                                <Popup>{request.mechanic.name}</Popup>
                              </Marker>
                            </MapContainer>
                          </div>
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
                    </MotionDiv>
                  );
                  })
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
                    <MotionDiv
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
                    </MotionDiv>
                  ))
                )
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      {/* New Request Modal */}
{/* New Request Modal */}
<AnimatePresence>
  {showNewRequest && (
    <MotionDiv 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowNewRequest(false)}
    >
      <MotionDiv 
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
                <MotionButton
                  key={type}
                  type="button"
                  className={`vehicle-option ${vehicleType === type ? 'selected' : ''}`}
                  onClick={() => setVehicleType(type)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <VehicleIcon type={type} />
                  <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                </MotionButton>
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
              minLength={10}
              className="form-textarea"
            />
            <p className="input-hint">{problemDesc.length}/500 characters</p>
          </div>

          <div className="form-group">
            <div className={`location-indicator location-${locationStatus}`}>
              <MapPin className="w-5 h-5 text-blue-400" />
              <div className="location-copy">
                <span>
                  {userLocation 
                    ? 'Location detected' 
                    : locationStatus === 'error'
                      ? 'Location unavailable'
                      : 'Getting your location...'}
                </span>
                {locationStatus === 'error' && (
                  <small>{locationError}</small>
                )}
              </div>
              {locationStatus === 'error' && (
                <button
                  type="button"
                  className="btn-location-retry"
                  onClick={getUserLocation}
                >
                  Retry
                </button>
              )}
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
      </MotionDiv>
    </MotionDiv>
  )}
</AnimatePresence>
    </div>
  );
};

export default DriverDashboard;
