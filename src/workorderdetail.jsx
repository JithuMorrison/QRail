// WorkOrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceService } from './maintenanceserv';

const WorkOrderDetail = ({ user }) => {
  const { workOrderId } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState({
    progress: 0,
    notes: '',
    status: 'in-progress'
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkOrderDetails();
  }, [workOrderId]);

  const loadWorkOrderDetails = async () => {
    try {
      setLoading(true);
      const [orderData, updatesData] = await Promise.all([
        maintenanceService.getWorkOrder(workOrderId),
        maintenanceService.getWorkOrderUpdates(workOrderId)
      ]);
      setWorkOrder(orderData);
      setUpdates(updatesData);
    } catch (error) {
      console.error('Failed to load work order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.updateWorkOrder(workOrderId, newUpdate);
      await loadWorkOrderDetails();
      setNewUpdate({ progress: 0, notes: '', status: 'in-progress' });
    } catch (error) {
      console.error('Failed to update work order:', error);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '1.5rem 2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    main: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem'
    },
    section: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    },
    statusBadge: {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    progressBar: {
      height: '8px',
      background: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      margin: '1rem 0'
    },
    updateCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'in-progress': '#3b82f6',
      'completed': '#10b981',
      'cancelled': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', color: 'white' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0f766e',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ marginLeft: '1rem' }}>Loading work order details...</span>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'white' }}>
          <h2>Work Order Not Found</h2>
          <button 
            onClick={() => navigate('/maintenance')}
            style={{
              background: 'white',
              color: '#0f766e',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              marginTop: '1rem'
            }}
          >
            ← Back to Maintenance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <button 
              onClick={() => navigate('/maintenance')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              ← Back to Maintenance
            </button>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2rem', fontWeight: '700' }}>
              🔧 Work Order: {workOrder.id}
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
              {workOrder.title} • Chainage: {workOrder.chainage} km
            </p>
          </div>
          <div style={{
            ...styles.statusBadge,
            background: getStatusColor(workOrder.status)
          }}>
            {workOrder.status.replace('-', ' ').toUpperCase()}
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Left Column */}
          <div>
            {/* Work Order Details */}
            <div style={styles.section}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>Work Order Details</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <strong>Defect Type:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1f2937' }}>{workOrder.defectType}</p>
                </div>
                <div>
                  <strong>Priority:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1f2937' }}>{workOrder.priority}</p>
                </div>
                <div>
                  <strong>Assigned To:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1f2937' }}>{workOrder.assignedTo}</p>
                </div>
                <div>
                  <strong>Due Date:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1f2937' }}>
                    {new Date(workOrder.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <strong>Description:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#4b5563', lineHeight: '1.6' }}>
                  {workOrder.description}
                </p>
              </div>
            </div>

            {/* Progress Updates */}
            <div style={styles.section}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>Progress Updates</h2>
              
              {updates.map((update, index) => (
                <div key={index} style={styles.updateCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                      }}>
                        {update.progress}%
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>
                          Progress Update
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                          By {update.updatedBy} • {new Date(update.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      ...styles.statusBadge,
                      background: getStatusColor(update.status)
                    }}>
                      {update.status.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                  
                  {update.notes && (
                    <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.5' }}>
                      {update.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Progress Update Form */}
            <div style={styles.section}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Update Progress</h3>
              
              <form onSubmit={handleUpdateProgress}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Progress (%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newUpdate.progress}
                    onChange={(e) => setNewUpdate({...newUpdate, progress: parseInt(e.target.value)})}
                    style={{ width: '100%' }}
                  />
                  <div style={{ textAlign: 'center', fontWeight: '600', marginTop: '0.5rem' }}>
                    {newUpdate.progress}%
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Status
                  </label>
                  <select
                    value={newUpdate.status}
                    onChange={(e) => setNewUpdate({...newUpdate, status: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Notes
                  </label>
                  <textarea
                    value={newUpdate.notes}
                    onChange={(e) => setNewUpdate({...newUpdate, notes: e.target.value})}
                    rows="4"
                    placeholder="Add update notes..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    background: '#0f766e',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    width: '100%'
                  }}
                >
                  📤 Update Progress
                </button>
              </form>
            </div>

            {/* Work Order Progress */}
            <div style={styles.section}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Current Progress</h3>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f766e' }}>
                  {workOrder.progress}%
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                  Overall Completion
                </div>
              </div>
              <div style={styles.progressBar}>
                <div style={{
                  height: '100%',
                  width: `${workOrder.progress}%`,
                  background: getStatusColor(workOrder.status),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Mock service
export const maintenanceService = {
  async getWorkOrder(id) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: id,
      title: 'Emergency Gauge Adjustment',
      defectType: 'Gauge Widening',
      priority: 'critical',
      status: 'in-progress',
      assignedTo: 'Track Maintenance A',
      dueDate: '2024-01-20',
      progress: 60,
      chainage: 45.2,
      description: 'Urgent gauge adjustment required at chainage 45.2km. Track parameters showing critical gauge widening beyond safety thresholds.'
    };
  },
  async getWorkOrderUpdates(id) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
      {
        progress: 25,
        status: 'in-progress',
        notes: 'Initial assessment completed. Safety barriers installed.',
        updatedBy: 'John Doe',
        timestamp: '2024-01-18T10:30:00Z'
      },
      {
        progress: 60,
        status: 'in-progress',
        notes: 'Gauge measurement completed. Adjustment in progress.',
        updatedBy: 'John Doe',
        timestamp: '2024-01-19T14:20:00Z'
      }
    ];
  },
  async updateWorkOrder(id, update) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Updating work order:', id, update);
    return { success: true };
  }
};

export default WorkOrderDetail;