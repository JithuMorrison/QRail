// maintenanceserv.js - UPDATED
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

    const data = await response.json();
    return data;
  },

  async getWorkOrder(workOrderId) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/maintenance/work-orders/${workOrderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Work order not found');
      }
      throw new Error('Failed to fetch work order details');
    }

    const data = await response.json();
    return data;
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
      throw new Error(error.message || 'Failed to create work order');
    }

    const data = await response.json();
    return data;
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
      throw new Error(error.message || 'Failed to update work order');
    }

    const data = await response.json();
    return data;
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

    const data = await response.json();
    return data;
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

    const data = await response.json();
    return data;
  },

  // Mock data for development (fallback)
  async getMockWorkOrders() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      workOrders: [
        {
          id: 'WO-20241231-1234',
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
          id: 'WO-20241231-5678',
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