import api from './api';

const landOwnerService = {
  // Get all land owners (automatically filtered by zone for admins)
  getAll: async (params = {}) => {
    const response = await api.get('/admin/land-owners', { params });
    return response.data.land_owners || response.data;
  },

  // Get single land owner by ID
  getById: async (id) => {
    const response = await api.get(`/admin/land-owners/${id}`);
    return response.data.land_owner || response.data;
  },

  // Create new land owner
  create: async (landOwnerData) => {
    const response = await api.post('/admin/land-owners', landOwnerData);
    return response.data.land_owner || response.data;
  },

  // Update land owner
  update: async (id, landOwnerData) => {
    const response = await api.put(`/admin/land-owners/${id}`, landOwnerData);
    return response.data.land_owner || response.data;
  },

  // Delete land owner
  delete: async (id) => {
    const response = await api.delete(`/admin/land-owners/${id}`);
    return response.data;
  },
};

export default landOwnerService;
