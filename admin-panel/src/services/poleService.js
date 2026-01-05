import api from './api';

const poleService = {
  // Get all poles (automatically filtered by zone for admins)
  getAll: async (params = {}) => {
    const response = await api.get('/admin/poles', { params });
    return response.data.poles || response.data;
  },

  // Get single pole by ID
  getById: async (id) => {
    const response = await api.get(`/admin/poles/${id}`);
    return response.data.pole || response.data;
  },

  // Create new pole
  create: async (poleData) => {
    const response = await api.post('/admin/poles', poleData);
    return response.data.pole || response.data;
  },

  // Update pole
  update: async (id, poleData) => {
    const response = await api.put(`/admin/poles/${id}`, poleData);
    return response.data.pole || response.data;
  },

  // Delete pole
  delete: async (id) => {
    const response = await api.delete(`/admin/poles/${id}`);
    return response.data;
  },

  // Toggle pole status
  toggleStatus: async (id) => {
    const response = await api.patch(`/admin/poles/${id}/status`);
    return response.data.pole || response.data;
  },

  // Get poles for specific zone (Super Admin only)
  getByZone: async (zoneId) => {
    const response = await api.get(`/admin/zones/${zoneId}/poles`);
    return response.data.poles || response.data;
  },

  // Get poles for map display
  getForMap: async () => {
    const response = await api.get('/map/poles');
    return response.data.poles || response.data;
  },
};

export default poleService;
