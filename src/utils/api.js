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

// Guest API methods
export const guestApi = {
  getAll: async () => {
    return apiRequest('/guests');
  },

  getById: async (id) => {
    return apiRequest(`/guests/${id}`);
  },

  create: async (data) => {
    return apiRequest('/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id, data) => {
    return apiRequest(`/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id) => {
    return apiRequest(`/guests/${id}`, {
      method: 'DELETE',
    });
  },
};

// Document API methods
export const documentApi = {
  // Get all documents for a startup
  getByStartupId: async (startupId) => {
    return apiRequest(`/documents?startupId=${startupId}`);
  },

  // Get download URL for a document
  getDownloadUrl: async (id) => {
    return apiRequest(`/documents/download/${id}`);
  },

  // Upload a document (uses FormData, not JSON)
  upload: async (file, startupId) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('startupId', startupId);

    const response = await fetch(`${API_URL}/documents`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  // Delete a document
  delete: async (id) => {
    return apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },
};

// Achievement API methods
export const achievementApi = {
  // Get all achievements for a startup
  getByStartupId: async (startupId) => {
    return apiRequest(`/achievements/${startupId}`);
  },

  // Create achievement
  create: async (startupId, data) => {
    return apiRequest(`/achievements/${startupId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update achievement
  update: async (startupId, achievementId, data) => {
    return apiRequest(`/achievements/${startupId}/${achievementId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete achievement
  delete: async (startupId, achievementId) => {
    return apiRequest(`/achievements/${startupId}/${achievementId}`, {
      method: 'DELETE',
    });
  },
};

// Progress API methods
export const progressApi = {
  // Create progress entry
  create: async (startupId, data) => {
    return apiRequest(`/progress/${startupId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update progress entry
  update: async (startupId, progressId, data) => {
    return apiRequest(`/progress/${startupId}/${progressId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete progress entry
  delete: async (startupId, progressId) => {
    return apiRequest(`/progress/${startupId}/${progressId}`, {
      method: 'DELETE',
    });
  },
};

export default { startupApi, authApi, smcApi, oneOnOneApi, guestApi, documentApi, achievementApi, progressApi };
