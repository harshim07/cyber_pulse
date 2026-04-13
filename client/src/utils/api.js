const API_BASE = 'http://localhost:5000';

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with auth headers
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Authentication required');
  }

  return response;
};

// API methods
export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint) => apiRequest(endpoint, {
    method: 'DELETE',
  }),
};

export default api;
