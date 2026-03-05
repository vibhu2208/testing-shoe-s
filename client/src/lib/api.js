import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
  verify: () => api.get('/auth/verify'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  deactivateUser: (id) => api.put(`/users/${id}/deactivate`),
  activateUser: (id) => api.put(`/users/${id}/activate`),
  seedQA: () => api.post('/users/seed-qa'),
};

// Templates API
export const templatesAPI = {
  getTemplates: (params) => api.get('/templates', { params }),
  createTemplate: (data) => api.post('/templates', data),
  getTemplate: (id) => api.get(`/templates/${id}`),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
};

// Assignments API
export const assignmentsAPI = {
  getAssignments: (params) => api.get('/assignments', { params }),
  createAssignment: (data) => api.post('/assignments', data),
  getAssignment: (id) => api.get(`/assignments/${id}`),
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  updateAssignmentStatus: (id, data) => api.put(`/assignments/${id}/status`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
};

// Executions API
export const executionsAPI = {
  getExecutions: (params) => api.get('/executions', { params }),
  startExecution: (assignmentId) => api.post(`/executions/start/${assignmentId}`),
  submitResults: (id, data) => api.post(`/executions/${id}/submit`, data),
  getExecution: (id) => api.get(`/executions/${id}`),
  getAssignmentExecutions: (assignmentId) => api.get(`/executions/assignment/${assignmentId}`),
  reviewExecution: (id, data) => api.put(`/executions/${id}/qa-review`, data),
};

// Reports API
export const reportsAPI = {
  getReports: (params) => api.get('/reports', { params }),
  generateReport: (executionId) => api.post(`/reports/generate/${executionId}`),
  getReport: (reportNumber) => api.get(`/reports/${reportNumber}`),
  downloadReport: (reportNumber) => api.get(`/reports/download/${reportNumber}`, {
    responseType: 'blob',
  }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getPerformance: (params) => api.get('/dashboard/performance', { params }),
  getTrends: (params) => api.get('/dashboard/trends', { params }),
};

export default api;
