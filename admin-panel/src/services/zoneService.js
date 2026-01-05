import api from './api';

const zoneService = {
  // Get all zones
  getAll: async () => {
    const response = await api.get('/super-admin/zones');
    return response.data.zones || response.data;
  },

  // Get single zone by ID
  getById: async (id) => {
    const response = await api.get(`/super-admin/zones/${id}`);
    return response.data.zone || response.data;
  },

  // Create new zone
  create: async (zoneData) => {
    const response = await api.post('/super-admin/zones', zoneData);
    return response.data.zone || response.data;
  },

  // Update zone
  update: async (id, zoneData) => {
    const response = await api.put(`/super-admin/zones/${id}`, zoneData);
    return response.data.zone || response.data;
  },

  // Delete zone
  delete: async (id) => {
    const response = await api.delete(`/super-admin/zones/${id}`);
    return response.data;
  },

  // Toggle zone status
  toggleStatus: async (id) => {
    const response = await api.patch(`/super-admin/zones/${id}/status`);
    return response.data.zone || response.data;
  },

  // Get users assigned to a zone
  getZoneUsers: async (zoneId) => {
    const response = await api.get(`/super-admin/zones/${zoneId}/users`);
    return response.data.users || response.data;
  },
};

export default zoneService;
