// maintenanceserv.js
const API_BASE = 'http://localhost:5000/api';

export const maintenanceService = {
  // Work Order Management
  async getWorkOrders(status = 'all', page = 1, per_page = 20) {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/maintenance/work-orders?page=${page}&per_page=${per_page}&status=${status}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch work orders');
    }

    return response.json();
  },

  async getWorkOrder(workOrderId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/work-orders/${workOrderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch work order details');
    }

    return response.json();
  },

  async createWorkOrder(workOrderData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/work-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(workOrderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  async updateWorkOrder(workOrderId, updateData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/work-orders/${workOrderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  async getWorkOrderUpdates(workOrderId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/work-orders/${workOrderId}/updates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch work order updates');
    }

    return response.json();
  },

  // Maintenance Analytics
  async getMaintenanceStats(timeRange = '30d') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/stats?time_range=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch maintenance statistics');
    }

    return response.json();
  },

  async getMaintenanceAnalytics(filters = {}) {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_BASE}/maintenance/analytics?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch maintenance analytics');
    }

    return response.json();
  },

  // Resource Management
  async getCrewAvailability() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/crew-availability`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch crew availability');
    }

    return response.json();
  },

  async getEquipmentStatus() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/equipment-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch equipment status');
    }

    return response.json();
  },

  // Maintenance Schedule
  async getMaintenanceSchedule(startDate, endDate) {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE}/maintenance/schedule?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch maintenance schedule');
    }

    return response.json();
  },

  async updateMaintenanceSchedule(scheduleData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  // Defect Management
  async getDefects(severity = 'all', page = 1, per_page = 20) {
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/maintenance/defects?page=${page}&per_page=${per_page}&severity=${severity}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch defects');
    }

    return response.json();
  },

  async createDefect(defectData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/defects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(defectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  },

  // Reports
  async generateMaintenanceReport(type, filters = {}) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/reports/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      throw new Error('Failed to generate maintenance report');
    }

    return response.json();
  },

  // Mock data for development
  async getMockWorkOrders() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      workOrders: [
        {
          id: 'WO-001',
          title: 'Emergency Gauge Adjustment',
          defectType: 'Gauge Widening',
          priority: 'critical',
          status: 'in-progress',
          assignedTo: 'Track Maintenance A',
          dueDate: '2024-01-20',
          estimatedDuration: '4 hours',
          progress: 60,
          chainage: 45.2,
          trackSection: 'Section A-12'
        },
        {
          id: 'WO-002',
          title: 'Rail Grinding - Wear Correction',
          defectType: 'Rail Wear',
          priority: 'high',
          status: 'pending',
          assignedTo: 'Welding Crew B',
          dueDate: '2024-01-22',
          estimatedDuration: '6 hours',
          progress: 0,
          chainage: 128.7,
          trackSection: 'Section B-08'
        }
      ],
      total: 2,
      page: 1,
      per_page: 20
    };
  },

  async getMockMaintenanceStats() {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      workOrdersCompleted: 156,
      activeWorkOrders: 23,
      onTimeCompletion: 87,
      avgRepairTime: 4.2,
      criticalRepairs: 12,
      preventiveMaintenance: 45,
      backlogTasks: 23,
      resourceUtilization: 78
    };
  }
};