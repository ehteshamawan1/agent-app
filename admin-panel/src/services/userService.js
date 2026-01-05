import api from './api';

const userService = {
  // Get all users
  getAll: async () => {
    const response = await api.get('/super-admin/users');
    return response.data.users || response.data;
  },

  // Get single user by ID
  getById: async (id) => {
    const response = await api.get(`/super-admin/users/${id}`);
    return response.data.user || response.data;
  },

  // Create new user
  create: async (userData) => {
    const response = await api.post('/super-admin/users', userData);
    return response.data.user || response.data;
  },

  // Update user
  update: async (id, userData) => {
    const response = await api.put(`/super-admin/users/${id}`, userData);
    return response.data.user || response.data;
  },

  // Delete user
  delete: async (id) => {
    const response = await api.delete(`/super-admin/users/${id}`);
    return response.data;
  },

  // Toggle user status
  toggleStatus: async (id) => {
    const response = await api.patch(`/super-admin/users/${id}/status`);
    return response.data.user || response.data;
  },

  // Get all admins
  getAdmins: async () => {
    const response = await api.get('/super-admin/admins');
    return response.data.users || response.data;
  },

  // Get all agents
  getAgents: async () => {
    const response = await api.get('/super-admin/agents');
    return response.data.users || response.data;
  },
};

export default userService;
