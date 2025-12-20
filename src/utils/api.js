// API utilities for communicating with the backend

// Determine API URL - always use /api in production, ignore localhost settings
const getApiUrl = () => {
  // In browser, check if we're on production (not localhost)
  if (typeof window !== 'undefined') {
    const isProduction = !window.location.hostname.includes('localhost');
    if (isProduction) {
      return '/api'; // Always use relative /api in production
    }
  }
  // In development or SSR, use env var or default to /api
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  // Ignore localhost URLs that might be misconfigured
  if (envUrl && envUrl.includes('localhost')) {
    return '/api';
  }
  return envUrl || '/api';
};

const API_URL = getApiUrl();

// Get auth token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Server error' }));
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

// Main API object used by useAuth hook
export const api = {
  // Check if user is authenticated (has token)
  isAuthenticated: () => {
    return !!getToken();
  },

  // Login user
  login: async (username, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    // Store token in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  },

  // Logout user
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Get current user
  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// Startup API methods
export const startupApi = {
  // Get all startups
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/startups?${queryString}` : '/startups';
    return apiRequest(endpoint);
  },

  // Get single startup
  getById: async (id) => {
    return apiRequest(`/startups/${id}`);
  },

  // Create startup
  create: async (data) => {
    return apiRequest('/startups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update startup
  update: async (id, data) => {
    return apiRequest(`/startups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete startup
  delete: async (id) => {
    return apiRequest(`/startups/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk import startups
  bulkCreate: async (startups) => {
    const results = [];
    const errors = [];
    
    for (const startup of startups) {
      try {
        const result = await startupApi.create(startup);
        results.push(result);
      } catch (error) {
        errors.push({ startup: startup.companyName, error: error.message });
      }
    }
    
    return { results, errors };
  },

  // Get stats
  getStats: async () => {
    return apiRequest('/startups/stats/overview');
  },
};

// Auth API methods
export const authApi = {
  login: async (username, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  me: async () => {
    return apiRequest('/auth/me');
  },

  changePassword: async (currentPassword, newPassword) => {
    return apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// SMC Meeting API methods
export const smcApi = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/smc?${queryString}` : '/smc';
    return apiRequest(endpoint);
  },

  create: async (data) => {
    return apiRequest('/smc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/smc/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/smc/${id}`, {
      method: 'DELETE',
    });
  },
};

// One-on-One Meeting API methods
export const oneOnOneApi = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/one-on-one?${queryString}` : '/one-on-one';
    return apiRequest(endpoint);
  },

  create: async (data) => {
    return apiRequest('/one-on-one', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/one-on-one/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/one-on-one/${id}`, {
      method: 'DELETE',
    });
  },
};

export default { startupApi, authApi, smcApi, oneOnOneApi };
