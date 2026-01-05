import api from './api';

const losService = {
  // Calculate line of sight
  calculate: async (poleId, agentLatitude, agentLongitude, notes = null) => {
    const response = await api.post('/line-of-sight/calculate', {
      pole_id: poleId,
      agent_latitude: agentLatitude,
      agent_longitude: agentLongitude,
      calculation_notes: notes,
    });
    return response.data.data; // Return the data object from the response
  },

  // Get calculation history for a pole
  getHistory: async (poleId) => {
    const response = await api.get(`/line-of-sight/history/${poleId}`);
    return response.data.data; // Return the data array from the response
  },

  // Get all calculations with pagination
  getAll: async () => {
    const response = await api.get('/line-of-sight');
    return response.data.data;
  },
};

export default losService;
