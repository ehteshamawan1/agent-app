import api from './api';

const settingsService = {
  // Get all settings
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data.settings || response.data;
  },

  // Get setting by key
  getByKey: async (key) => {
    const response = await api.get(`/settings/${key}`);
    return response.data.setting || response.data;
  },

  // Update setting
  update: async (key, value) => {
    const response = await api.put(`/settings/${key}`, { value });
    return response.data;
  },

  // Create new setting
  create: async (settingData) => {
    const response = await api.post('/settings', settingData);
    return response.data;
  },

  // Update Google Maps API Key specifically
  updateGoogleMapsApiKey: async (apiKey) => {
    const response = await api.put('/settings/google_maps_api_key', {
      value: apiKey,
    });
    return response.data;
  },

  // Get Google Maps API Key
  getGoogleMapsApiKey: async () => {
    const response = await api.get('/settings/google_maps_api_key');
    return response.data.value;
  },
};

export default settingsService;
