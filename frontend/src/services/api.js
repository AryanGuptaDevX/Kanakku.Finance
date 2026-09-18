import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const dashboardAPI = {
  getSummary: (month) => api.get('/dashboard', { params: { month } }),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export const categoryAPI = {
  getAll: (type) => api.get('/categories', { params: { type } }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const budgetAPI = {
  getAll: (month) => api.get('/budgets', { params: { month } }),
  save: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export const recurringAPI = {
  getAll: (type) => api.get('/recurring', { params: { type } }),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  delete: (id) => api.delete(`/recurring/${id}`),
  process: (month) => api.post('/recurring/process', null, { params: { month } }),
};

export const emiAPI = {
  getAll: () => api.get('/emis'),
  create: (data) => api.post('/emis', data),
  update: (id, data) => api.put(`/emis/${id}`, data),
  pay: (id, amount) => api.post(`/emis/${id}/pay`, { amount }),
  delete: (id) => api.delete(`/emis/${id}`),
};

export const sipAPI = {
  getAll: () => api.get('/sips'),
  create: (data) => api.post('/sips', data),
  update: (id, data) => api.put(`/sips/${id}`, data),
  delete: (id) => api.delete(`/sips/${id}`),
};

export const goalAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const analyticsAPI = {
  get: (params) => api.get('/analytics', { params }),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (key, value) => api.post('/settings', { key, value }),
  resetData: () => api.post('/settings/reset-data'),
};

export default api;
