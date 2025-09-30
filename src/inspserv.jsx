// Update your inspectorService in inspserv.js
const API_BASE = 'http://localhost:5000/api';

export const inspectorService = {
  async getBatchDetails(objectId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/batch/${objectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch details');
    }

    return response.json();
  },

  async getBatchHistory(objectId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/batch/${objectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch history');
    }

    return response.json();
  },

  async recordInspection(inspectionData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/inspector/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(inspectionData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  // Add these new methods
  async getInspections(page = 1, per_page = 20) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/inspector/inspections?page=${page}&per_page=${per_page}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inspections');
    }

    return response.json();
  },

  async getStats() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/inspector/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch statistics');
    }

    return response.json();
  }
};