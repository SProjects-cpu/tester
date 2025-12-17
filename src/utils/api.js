// API utilities for communicating with the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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

export default { startupApi, authApi };
