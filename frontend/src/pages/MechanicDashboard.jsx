  import { useState, useEffect } from 'react';
  import { motion, AnimatePresence } from 'framer-motion';
  import { useNavigate } from 'react-router-dom';
  import { 
    Wrench, MapPin, Phone, CheckCircle, XCircle, 
    Loader, Navigation, AlertCircle, LogOut, Power,
    User, Clock, Car, Bike, Truck, Map, ArrowRight
  } from 'lucide-react';
  import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
  import { toast } from 'react-hot-toast';
  import Confetti from 'react-confetti';
  import api from '../api';
  import './MechanicDashboard.css';
  import 'leaflet/dist/leaflet.css';

  const MechanicDashboard = () => {
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(false);
    const [nearbyRequests, setNearbyRequests] = useState([]);
    const [activeJob, setActiveJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

useEffect(() => {
  // Update location every 10 seconds when online
  if (isOnline && userLocation) {
    const locationInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.post('/mechanic/update-location', null, {
              params: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            });
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        },
        (error) => console.error('Geolocation error:', error)
      );
    }, 10000); // Every 10 seconds

    return () => clearInterval(locationInterval);
  }
}, [isOnline, userLocation]);


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

    const toggleAvailability = async () => {
      if (!userLocation) {
        toast.error('Waiting for location...');
        return;
      }

      try {
        const response = await api.post('/mechanic/availability', null, {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng
          }
        });
        
        setIsOnline(response.data.is_available);
        
        if (response.data.is_available) {
          toast.success('🟢 You are now ONLINE and visible to customers');
          fetchNearbyRequests();
        } else {
          toast('⚫ You are now OFFLINE', { icon: '💤' });
          setNearbyRequests([]);
        }
      } catch (error) {
        toast.error('Failed to update availability');
      }
    };

    const fetchNearbyRequests = async () => {
      try {
        const response = await api.get('/mechanic/requests');
        setNearbyRequests(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setLoading(false);
      }
    };

    const checkActiveJob = async () => {
      try {
        const response = await api.get('/mechanic/active-job');
        setActiveJob(response.data);
        setLoading(false);
      } catch (error) {
        setActiveJob(null);
        setLoading(false);
      }
    };

    const handleAcceptJob = async (requestId) => {
      try {
        await api.post(`/requests/${requestId}/accept`);
        toast.success('🎯 Job accepted! Customer notified.');
        setNearbyRequests([]);
        checkActiveJob();
        setSelectedRequest(null);
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to accept job');
      }
    };

    const handleRejectJob = async (requestId) => {
      try {
        await api.post(`/requests/${requestId}/reject`);
        toast('Job rejected', { icon: '❌' });
        fetchNearbyRequests();
        setSelectedRequest(null);
      } catch (error) {
        toast.error('Failed to reject job');
      }
    };

    const handleStartTrip = async () => {
      if (!activeJob) return;

      try {
        await api.post(`/requests/${activeJob.id}/start`);
        toast.success('🚗 Trip started! Navigate to customer location.');
        checkActiveJob();
      } catch (error) {
        toast.error('Failed to start trip');
      }
    };

    const handleCompleteJob = async () => {
      if (!activeJob) return;

      try {
        await api.post(`/requests/${activeJob.id}/complete`);
        toast.success('🎉 Job completed successfully!');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setActiveJob(null);
        checkActiveJob();
      } catch (error) {
        toast.error('Failed to complete job');
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
      toast.success('Logged out successfully');
    };

    const getVehicleIcon = (type) => {
      switch(type?.toLowerCase()) {
        case 'car': return <Car className="w-5 h-5" />;
        case 'bike': return <Bike className="w-5 h-5" />;
        case 'truck': return <Truck className="w-5 h-5" />;
        default: return <Car className="w-5 h-5" />;
      }
    };

    const calculateDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return (R * c).toFixed(1);
    };

    return (
      <div className="mechanic-dashboard">
        {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

        {/* Header */}
        <motion.header 
          className="dashboard-header glass-effect"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
        >
          <div className="header-content">
            <div className="header-left">
              <Wrench className="header-icon" />
              <div>
                <h1>Mechanic Dashboard</h1>
                <p className="header-subtitle">Manage jobs and help drivers</p>
              </div>
            </div>
            <div className="header-actions">
              <motion.button 
                className={`toggle-availability ${isOnline ? 'online' : 'offline'}`}
                onClick={toggleAvailability}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Power className="w-5 h-5" />
                <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
                <div className={`status-dot ${isOnline ? 'active' : ''}`}></div>
              </motion.button>
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
          {/* Status Card */}
          <motion.div 
            className="status-card glass-effect"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="status-info">
              <div className="status-badge-large">
                {isOnline ? (
                  <>
                    <div className="pulse-ring"></div>
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </>
                ) : (
                  <Power className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="status-title">
                  {isOnline ? 'Currently Online' : 'Currently Offline'}
                </h3>
                <p className="status-subtitle">
                  {isOnline 
                    ? 'You are visible to customers in your area' 
                    : 'Go online to receive job requests'}
                </p>
              </div>
            </div>
            {userLocation && (
              <div className="location-info">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              </div>
            )}
          </motion.div>

          {/* Active Job Section */}
          {activeJob && (
            <motion.div 
              className="active-job-section"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="section-header">
                <h2>Active Job</h2>
                <div className={`job-status ${activeJob.status.toLowerCase().replace(' ', '-')}`}>
                  {activeJob.status}
                </div>
              </div>

              <div className="active-job-card glass-effect">
                <div className="job-header">
                  <div className="customer-info">
                    <div className="customer-avatar">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3>{activeJob.customer?.name || 'Customer'}</h3>
                      <p className="customer-label">Requesting Help</p>
                    </div>
                  </div>
                  <a 
                    href={`tel:${activeJob.customer?.phone}`}
                    className="btn-call-customer"
                  >
                    <Phone className="w-5 h-5" />
                  </a>
                </div>

                <div className="job-details">
                  <div className="detail-row">
                    <div className="detail-item">
                      {getVehicleIcon(activeJob.vehicle_type)}
                      <span>{activeJob.vehicle_type}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <span>
                        {userLocation 
                          ? `${calculateDistance(userLocation.lat, userLocation.lng, activeJob.lat, activeJob.lng)} km away`
                          : 'Calculating...'}
                      </span>
                    </div>
                  </div>

                  <div className="problem-box">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="problem-label">Problem Description</p>
                      <p className="problem-text">{activeJob.problem_desc}</p>
                    </div>
                  </div>

                  <div className="job-map">
                    {userLocation && (
                      <MapContainer
                        center={[activeJob.lat, activeJob.lng]}
                        zoom={13}
                        style={{ height: '250px', width: '100%', borderRadius: '12px' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap contributors'
                        />
                        <Marker position={[activeJob.lat, activeJob.lng]}>
                          <Popup>Customer Location</Popup>
                        </Marker>
                        <Marker position={[userLocation.lat, userLocation.lng]}>
                          <Popup>Your Location</Popup>
                        </Marker>
                      </MapContainer>
                    )}
                  </div>

                  <div className="job-actions">
                    {activeJob.status === 'Accepted' && (
                      <motion.button
                        className="btn-action primary"
                        onClick={handleStartTrip}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Navigation className="w-5 h-5" />
                        Start Trip
                      </motion.button>
                    )}
                    {activeJob.status === 'En Route' && (
                      <motion.button
                        className="btn-action success"
                        onClick={handleCompleteJob}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Mark as Completed
                      </motion.button>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.lat},${activeJob.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action secondary"
                    >
                      <Map className="w-5 h-5" />
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Nearby Requests */}
          {!activeJob && (
            <div className="nearby-section">
              <div className="section-header">
                <h2>Nearby Requests</h2>
                {isOnline && (
                  <div className="refresh-indicator">
                    <Loader className="spinner-small" />
                    <span>Auto-refreshing...</span>
                  </div>
                )}
              </div>

              {!isOnline ? (
                <motion.div 
                  className="empty-state glass-effect"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="empty-icon">💤</div>
                  <h3>You're Offline</h3>
                  <p>Go online to start receiving job requests from nearby customers</p>
                  <button 
                    className="btn-primary"
                    onClick={toggleAvailability}
                  >
                    <Power className="w-5 h-5" />
                    Go Online Now
                  </button>
                </motion.div>
              ) : loading ? (
                <div className="loading-state">
                  <Loader className="spinner" />
                  <p>Loading nearby requests...</p>
                </div>
              ) : nearbyRequests.length === 0 ? (
                <motion.div 
                  className="empty-state glass-effect"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="empty-icon">😴</div>
                  <h3>No Requests Nearby</h3>
                  <p>Waiting for customers to request help in your area</p>
                </motion.div>
              ) : (
                <div className="requests-grid">
                  {nearbyRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="request-card glass-effect"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -5 }}
                      onClick={() => setSelectedRequest(request)}
                    >
                      <div className="request-header">
                        <div className="vehicle-badge">
                          {getVehicleIcon(request.vehicle_type)}
                          <span>{request.vehicle_type}</span>
                        </div>
                        {userLocation && (
                          <div className="distance-badge">
                            <MapPin className="w-4 h-4" />
                            {calculateDistance(userLocation.lat, userLocation.lng, request.lat, request.lng)} km
                          </div>
                        )}
                      </div>

                      <div className="request-body">
                        <p className="problem-preview">{request.problem_desc}</p>
                        
                        <div className="request-meta">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(request.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <button className="btn-view-details">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Request Details Modal */}
        <AnimatePresence>
          {selectedRequest && (
            <>
              <motion.div 
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRequest(null)}
              />
              <motion.div 
                className="modal-content glass-effect"
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Job Request Details</h2>
                  <button 
                    className="modal-close"
                    onClick={() => setSelectedRequest(null)}
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="request-details-content">
                  <div className="detail-section">
                    <div className="detail-label">Vehicle Type</div>
                    <div className="detail-value">
                      {getVehicleIcon(selectedRequest.vehicle_type)}
                      <span>{selectedRequest.vehicle_type}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Distance</div>
                    <div className="detail-value">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <span>
                        {userLocation 
                          ? `${calculateDistance(userLocation.lat, userLocation.lng, selectedRequest.lat, selectedRequest.lng)} km away`
                          : 'Calculating...'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Problem Description</div>
                    <div className="problem-detail">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      <p>{selectedRequest.problem_desc}</p>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Location Preview</div>
                    {userLocation && (
                      <div className="mini-map">
                        <MapContainer
                          center={[selectedRequest.lat, selectedRequest.lng]}
                          zoom={13}
                          style={{ height: '200px', width: '100%', borderRadius: '12px' }}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[selectedRequest.lat, selectedRequest.lng]} />
                          <Circle 
                            center={[selectedRequest.lat, selectedRequest.lng]} 
                            radius={500}
                            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
                          />
                        </MapContainer>
                      </div>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectJob(selectedRequest.id)}
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptJob(selectedRequest.id)}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accept Job
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  export default MechanicDashboard;
