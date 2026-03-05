import { create } from 'zustand';
import { authAPI } from '../lib/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  // Initialize auth state from localStorage
  initialize: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      set({
        token,
        user: JSON.parse(user),
        isAuthenticated: true,
      });
    }
  },

  // Login
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return { success: true };
    } catch (error) {
      set({ isLoading: false });
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // Update user profile
  updateProfile: (userData) => {
    const updatedUser = { ...get().user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  // Check if user has specific role
  hasRole: (role) => {
    const user = get().user;
    if (!user) return false;
    
    // Admin has access to everything
    if (user.role === 'admin') return true;
    
    // Company role has read-only access to most things
    if (user.role === 'company') {
      // Company can view templates, assignments, executions, reports, and dashboard
      return ['company', 'tester', 'qa_manager'].includes(role);
    }
    
    // Check specific role
    return user.role === role;
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roles) => {
    const { user } = get();
    return roles.includes(user?.role);
  },

  // New method to check if user can modify data
  canModify: (resource) => {
    const user = get().user;
    if (!user) return false;
    
    // Company role is read-only
    if (user.role === 'company') return false;
    
    // Admin can modify everything
    if (user.role === 'admin') return true;
    
    // Role-specific modification permissions
    switch (resource) {
      case 'templates':
        return user.role === 'admin';
      case 'assignments':
        return user.role === 'admin';
      case 'executions':
        return user.role === 'tester';
      case 'qa_approval':
        return user.role === 'qa_manager';
      case 'reports':
        return ['admin', 'qa_manager'].includes(user.role);
      case 'users':
        return user.role === 'admin';
      default:
        return false;
    }
  },

  // Verify token validity
  verifyToken: async () => {
    const { token } = get();
    if (!token) return false;

    try {
      const response = await authAPI.verify();
      return response.data.valid;
    } catch (error) {
      get().logout();
      return false;
    }
  },
}));

export default useAuthStore;
