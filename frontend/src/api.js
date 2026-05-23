import axios from 'axios';

const api=axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    timeout: 10000,
    withCredentials: true,
});

// Store tokens in localStorage as backup to cookies
const getStoredAccessToken = () => localStorage.getItem('access_token');
const getStoredRefreshToken = () => localStorage.getItem('refresh_token');
const setStoredTokens = (accessToken, refreshToken) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};
const clearStoredTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

api.interceptors.request.use((config) => {
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  
  // Add Authorization header with stored token if available
  const token = getStoredAccessToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/login') || originalRequest?.url?.includes('/refresh') || originalRequest?.url?.includes('/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const response = await api.post('/refresh');
        // Store new tokens from refresh response if provided
        if (response.data?.access_token && response.data?.refresh_token) {
          setStoredTokens(response.data.access_token, response.data.refresh_token);
        }
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
