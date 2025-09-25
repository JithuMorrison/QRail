const API_BASE = 'http://localhost:5000/api';

export const vendorService = {
  // Create a new batch
  async createBatch(batchData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create batch');
    }

    return response.json();
  },

  // Get all batches created by the vendor
  async getVendorBatches(vendorId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batches`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vendor batches');
    }

    return response.json();
  },

  // Get batch details by batch ID
  async getBatchDetails(batchId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batch/${batchId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch details');
    }

    return response.json();
  },

  // Update batch information
  async updateBatch(batchId, updateData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batch/${batchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update batch');
    }

    return response.json();
  },

  // Generate additional QR codes for an existing batch
  async generateAdditionalQrs(batchId, qrCount) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batch/${batchId}/generate-qrs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ qrCount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate additional QR codes');
    }

    return response.json();
  },

  // Get batch statistics
  async getBatchStatistics(vendorId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch statistics');
    }

    return response.json();
  },

  // Download QR codes mapping as CSV
  async downloadQrMapping(batchId, format = 'csv') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batch/${batchId}/qr-mapping?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download QR mapping');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-mapping-batch-${batchId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Get scan history for a specific batch
  async getBatchScanHistory(batchId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/vendor/batch/${batchId}/scan-history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch batch scan history');
    }

    return response.json();
  },

  // Validate ObjectId format
  validateObjectId(objectId) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(objectId);
  },

  // Generate QR code data for display (without actual generation)
  generateQrCodeData(objectId, index, batchNumber) {
    return {
      objectId,
      qrIndex: index + 1,
      batchNumber,
      downloadUrl: `#`, // Placeholder for actual download URL
      textMapping: `QR ${index + 1}: ${objectId}`
    };
  },

  // Simulate batch creation for demo purposes
  async simulateBatchCreation(batchData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockBatch = {
          _id: 'mock-batch-id-' + Date.now(),
          batchNumber: 'BATCH-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-ABC123',
          vendorId: batchData.vendorId,
          materialType: batchData.materialType,
          warranty: parseInt(batchData.warranty),
          fittingType: batchData.fittingType,
          qrCount: parseInt(batchData.qrCount),
          createdDate: new Date().toISOString(),
          status: 'created',
          generatedQrs: Array.from({ length: batchData.qrCount }, (_, index) => ({
            objectId: this.generateMockObjectId(),
            qrIndex: index + 1,
            generatedAt: new Date().toISOString()
          }))
        };
        resolve({ batch: mockBatch, message: 'Batch created successfully' });
      }, 1000);
    });
  },

  // Generate mock ObjectId for demo
  generateMockObjectId() {
    const hexChars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 24; i++) {
      result += hexChars[Math.floor(Math.random() * 16)];
    }
    return result;
  }
};