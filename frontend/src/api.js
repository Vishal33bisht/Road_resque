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

const storeTokensFromResponse = (response) => {
  const { access_token: accessToken, refresh_token: refreshToken } = response.data || {};
  if (accessToken && refreshToken) {
    setStoredTokens(accessToken, refreshToken);
  }
};

const sessionExpiredError = (error) => ({
  ...error,
  response: {
    ...error.response,
    data: {
      ...(error.response?.data || {}),
      detail: 'Could not verify your login session. Please sign in again.',
    },
  },
});

api.interceptors.request.use((config) => {
  config.headers['X-Requested-With'] = 'XMLHttpRequest';

  const url = config.url || '';
  const token = getStoredAccessToken();
  if (token && !url.includes('/refresh')) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || '';
    if (url.includes('/logout')) {
      clearStoredTokens();
    } else {
      storeTokensFromResponse(response);
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
        const refreshToken = getStoredRefreshToken();
        await api.post('/refresh', refreshToken ? { refresh_token: refreshToken } : undefined);
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
