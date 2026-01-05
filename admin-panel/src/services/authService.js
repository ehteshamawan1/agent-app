import api from './api';

const authService = {
  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });
      const { token, user } = response.data;

      // Store token and user info in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/me');
      const user = response.data.user;

      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to get user info';
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored user from localStorage
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check user role
  hasRole: (role) => {
    const user = authService.getStoredUser();
    return user?.role === role;
  },

  // Check if user is super admin
  isSuperAdmin: () => {
    const user = authService.getStoredUser();
    return user?.role === 'super_admin';
  },

  // Check if user is admin (regular admin, not super admin)
  isAdmin: () => {
    const user = authService.getStoredUser();
    return user?.role === 'admin';
  },

  // Check if user is agent
  isAgent: () => {
    const user = authService.getStoredUser();
    return user?.role === 'agent';
  },
};

export default authService;
