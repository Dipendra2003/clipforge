import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = true; // Important for httpOnly cookies

// Token management (fallback if not using httpOnly cookies)
export const setToken = (token) => {
  localStorage.setItem('accessToken', token);
};

export const getToken = () => {
  return localStorage.getItem('accessToken');
};

export const removeToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// User management
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Auth API calls
export const authAPI = {
  // Signup
  signup: async (userData) => {
    const response = await axios.post(`${API_URL}/api/auth/signup`, userData);
    return response.data;
  },

  // Login
  login: async (credentials) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
    if (response.data.accessToken) {
      setToken(response.data.accessToken);
    }
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  },

  // Google OAuth
  googleAuth: async (googleToken) => {
    const response = await axios.post(`${API_URL}/api/auth/google`, { token: googleToken });
    if (response.data.accessToken) {
      setToken(response.data.accessToken);
    }
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  },

  // Logout (single device)
  logout: async () => {
    const response = await axios.post(`${API_URL}/api/auth/logout`);
    removeToken();
    return response.data;
  },

  // Logout all devices
  logoutAll: async () => {
    const response = await axios.post(`${API_URL}/api/auth/logout-all`);
    removeToken();
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await axios.post(`${API_URL}/api/auth/refresh-token`);
    if (response.data.accessToken) {
      setToken(response.data.accessToken);
    }
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await axios.post(`${API_URL}/api/auth/verify-email`, { token });
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await axios.post(`${API_URL}/api/auth/resend-verification`, { email });
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await axios.post(`${API_URL}/api/auth/reset-password`, { token, password });
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axios.get(`${API_URL}/api/auth/me`);
    if (response.data.user) {
      setUser(response.data.user);
    }
    return response.data;
  }
};

// Axios interceptor for adding token to requests
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios interceptor for handling token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        await authAPI.refreshToken();
        
        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        removeToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authAPI;
