import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (res) => res.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ==================== Auth ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ==================== Chat ====================
export const chatAPI = {
  // Primary consultation endpoint (connects to backend RAG + QVAC)
  consult: (query) => api.post('/consult', { query }),
  // Streaming consultation
  consultStream: (query) => api.post('/consult/stream', { query }),
  // Legacy chat endpoints (v2 API)
  sendMessage: (message, sessionId) =>
    api.post('/v2/chat/send', { message, sessionId }),
  getHistory: (sessionId) => api.get(`/v2/chat/history/${sessionId}`),
  getSessions: () => api.get('/v2/chat/sessions'),
  createSession: () => api.post('/v2/chat/sessions'),
  deleteSession: (id) => api.delete(`/v2/chat/sessions/${id}`),
};

// ==================== Knowledge Base ====================
export const knowledgeAPI = {
  list: (params) => api.get('/knowledge', { params }),
  get: (id) => api.get(`/knowledge/${id}`),
  create: (data) => api.post('/knowledge', data),
  update: (id, data) => api.put(`/knowledge/${id}`, data),
  delete: (id) => api.delete(`/knowledge/${id}`),
  search: (query) => api.get('/knowledge/search', { params: { q: query } }),
  uploadDocument: (formData) =>
    api.post('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ==================== Assessment ====================
export const assessmentAPI = {
  getAvailable: () => api.get('/assessments'),
  get: (id) => api.get(`/assessments/${id}`),
  submit: (id, answers) => api.post(`/assessments/${id}/submit`, { answers }),
  getResults: (userId) => api.get(`/assessments/results/${userId}`),
  getResult: (resultId) => api.get(`/assessments/results/detail/${resultId}`),
};

// ==================== Emotion ====================
export const emotionAPI = {
  record: (data) => api.post('/emotions', data),
  getTrends: (userId, params) =>
    api.get(`/emotions/trends/${userId}`, { params }),
  getSummary: (userId, period) =>
    api.get(`/emotions/summary/${userId}`, { params: { period } }),
};

// ==================== Analytics ====================
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getTreatmentProgress: (userId) =>
    api.get(`/analytics/treatment/${userId}`),
  getUserStats: (userId) => api.get(`/analytics/stats/${userId}`),
  getRiskAssessment: (userId) => api.get(`/analytics/risk/${userId}`),
  exportReport: (userId, format) =>
    api.get(`/analytics/export/${userId}`, {
      params: { format },
      responseType: 'blob',
    }),
};

// ==================== Crisis ====================
export const crisisAPI = {
  getResources: () => api.get('/crisis/resources'),
  report: (data) => api.post('/crisis/report', data),
  getHotlines: () => api.get('/crisis/hotlines'),
};

export default api;
