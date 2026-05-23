import axios from 'axios';

const getDefaultApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8000';
  }

  return `http://${window.location.hostname}:8000`;
};

const api=axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl(),
    timeout: 10000,
    withCredentials: true,
});

const clearStoredTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

const sessionExpiredError = (error) => ({
  ...error,
  response: {
    ...error.response,
    data: {
      ...(error.response?.data || {}),
      detail: 'Could not verify your login session. Please sign in again using the same localhost or 127.0.0.1 address.',
    },
  },
});

api.interceptors.request.use((config) => {
  config.headers['X-Requested-With'] = 'XMLHttpRequest';
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';
    const shouldClearStoredTokens =
      url.includes('/login') || url.includes('/register') || url.includes('/logout');

    if (shouldClearStoredTokens) {
      clearStoredTokens();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const originalUrl = originalRequest?.url || '';
    const isAuthEndpoint =
      originalUrl.includes('/login') || originalUrl.includes('/refresh') || originalUrl.includes('/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const response = await api.post('/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        clearStoredTokens();
        return Promise.reject(sessionExpiredError(refreshError));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
