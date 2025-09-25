const API_BASE = 'http://localhost:5000/api';

export const depotService = {
  // Get batch details by ObjectId
  async getBatchDetails(objectId) {
    const token = localStorage.getItem('token');
    
    // First validate the objectId format
    if (!this.validateObjectId(objectId)) {
      throw new Error('Invalid ObjectId format');
    }

    const response = await fetch(`${API_BASE}/depot/batch/${objectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch batch details');
    }

    return response.json();
  },

  // Record a depot scan
  async recordScan(scanData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...scanData,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to record scan');
    }

    return response.json();
  },

  // Get recent scans by depot staff
  async getRecentScans(depotId, limit = 10) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/scans/recent?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent scans');
    }

    return response.json();
  },

  // Get scan statistics for depot
  async getScanStatistics(depotId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/statistics`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch scan statistics');
    }

    return response.json();
  },

  // Get scans by date range
  async getScansByDateRange(startDate, endDate) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE}/depot/scans?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch scans by date range');
    }

    return response.json();
  },

  // Update scan information
  async updateScan(scanId, updateData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/scan/${scanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update scan');
    }

    return response.json();
  },

  // Search scans by various criteria
  async searchScans(searchCriteria) {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(searchCriteria).toString();
    const response = await fetch(`${API_BASE}/depot/scans/search?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search scans');
    }

    return response.json();
  },

  // Export scans data
  async exportScansData(format = 'csv', criteria = {}) {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams({ format, ...criteria }).toString();
    const response = await fetch(`${API_BASE}/depot/scans/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export scans data');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depot-scans-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Validate ObjectId format
  validateObjectId(objectId) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(objectId);
  },

  // Process QR code from text file
  processQrTextFile(fileContent) {
    try {
      // Extract ObjectId from various possible text formats
      const lines = fileContent.split('\n');
      let objectId = null;

      for (const line of lines) {
        // Look for ObjectId pattern in the text
        const idMatch = line.match(/[0-9a-fA-F]{24}/);
        if (idMatch && this.validateObjectId(idMatch[0])) {
          objectId = idMatch[0];
          break;
        }

        // Look for QR mapping format: "QR X: objectId"
        const qrMatch = line.match(/QR\s+\d+:\s*([0-9a-fA-F]{24})/i);
        if (qrMatch && this.validateObjectId(qrMatch[1])) {
          objectId = qrMatch[1];
          break;
        }
      }

      if (!objectId) {
        throw new Error('No valid ObjectId found in the text file');
      }

      return objectId;
    } catch (error) {
      throw new Error(`Error processing text file: ${error.message}`);
    }
  },

  // Simulate batch details fetch for demo
  async simulateGetBatchDetails(objectId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockBatchDetails = {
          objectId: objectId,
          batchNumber: 'BATCH-20231201-ABC123',
          materialType: 'Titanium Alloy',
          vendorId: 'vendor123',
          vendorName: 'AeroSpace Industries',
          createdDate: '2023-12-01T10:00:00Z',
          warranty: 24,
          fittingType: 'Type A Fitting'
        };
        resolve(mockBatchDetails);
      }, 500);
    });
  },

  // Simulate scan recording for demo
  async simulateRecordScan(scanData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockResponse = {
          message: 'Scan recorded successfully',
          scanId: 'scan-' + Date.now(),
          timestamp: new Date().toISOString()
        };
        resolve(mockResponse);
      }, 500);
    });
  },

  // Get depot inventory summary
  async getInventorySummary(depotId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/inventory/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory summary');
    }

    return response.json();
  },

  // Get items needing attention (expired warranty, etc.)
  async getItemsNeedingAttention(depotId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/depot/inventory/attention-needed`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch items needing attention');
    }

    return response.json();
  }
};