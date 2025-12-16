import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  // Tentar primeiro o token de admin
  let token = localStorage.getItem('adminToken');
  
  // Se não houver token de admin, tentar token de utilizador
  if (!token) {
    token = localStorage.getItem('token');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }
  
  return config;
});

// Auth
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data)
};

// Products
export const products = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getPrice: (id, quantity) => api.get(`/products/${id}/price/${quantity}`),
  getCategories: () => api.get('/products/categories/list')
};

// Cart
export const cart = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart/add', data),
  update: (id, quantity) => api.put(`/cart/${id}`, { quantity }),
  remove: (id) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart')
};

// Orders
export const orders = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
};

// Quotes
export const quotes = {
  create: (data) => api.post('/quotes', data),
  getAll: () => api.get('/quotes'),
  getById: (id) => api.get(`/quotes/${id}`),
  updateStatus: (id, status) => api.put(`/quotes/${id}/status`, { status })
};

// Import
export const importData = {
  uploadProducts: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getHistory: () => api.get('/import/history')
};

export default api;
