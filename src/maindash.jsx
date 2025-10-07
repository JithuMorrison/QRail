// MaintenanceDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MaintenanceDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('work-orders');
  const [workOrders, setWorkOrders] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMaintenanceData();
  }, []);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      const [orders, schedule] = await Promise.all([
        fetchWorkOrders(),
        fetchMaintenanceSchedule()
      ]);
      setWorkOrders(orders);
      setMaintenanceSchedule(schedule);
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    dashboard: {
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
    nav: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      padding: '0 2rem',
      display: 'flex',
      gap: '0',
      borderBottom: '1px solid #e5e7eb',
      overflowX: 'auto'
    },
    navTab: {
      padding: '1rem 2rem',
      background: 'none',
      border: 'none',
      borderBottom: '3px solid transparent',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#6b7280',
      whiteSpace: 'nowrap'
    },
    navTabActive: {
      borderBottomColor: '#0f766e',
      color: '#0f766e',
      background: 'rgba(15, 118, 110, 0.05)'
    },
    main: {
      maxWidth: '1400px',
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
    workOrderCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      padding: '1.5rem',
      transition: 'all 0.3s ease',
      marginBottom: '1rem',
      cursor: 'pointer'
    },
    priorityBadge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '20px',
      color: 'white',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    progressBar: {
      height: '8px',
      background: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      margin: '0.5rem 0'
    },
    progressFill: {
      height: '100%',
      transition: 'width 0.3s ease'
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    };
    return colors[priority] || '#6b7280';
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

  const WorkOrderCard = ({ workOrder }) => (
    <div 
      style={styles.workOrderCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onClick={() => navigate(`/work-order/${workOrder.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
            WO-{workOrder.id} • {workOrder.title}
          </h4>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Chainage: {workOrder.chainage} km • {workOrder.trackSection}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{
            ...styles.priorityBadge,
            background: getPriorityColor(workOrder.priority)
          }}>
            {workOrder.priority === 'critical' ? '🚨' : 
             workOrder.priority === 'high' ? '⚠️' : 
             workOrder.priority === 'medium' ? '🔔' : '📋'}
            {workOrder.priority.toUpperCase()}
          </div>
          <div style={{
            ...styles.priorityBadge,
            background: getStatusColor(workOrder.status)
          }}>
            {workOrder.status.replace('-', ' ').toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        <div>
          <strong>Defect Type:</strong> {workOrder.defectType}
        </div>
        <div>
          <strong>Assigned To:</strong> {workOrder.assignedTo}
        </div>
        <div>
          <strong>Due Date:</strong> {new Date(workOrder.dueDate).toLocaleDateString()}
        </div>
        <div>
          <strong>Estimated Duration:</strong> {workOrder.estimatedDuration}
        </div>
      </div>

      {workOrder.status === 'in-progress' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
            <span>Progress</span>
            <span>{workOrder.progress}%</span>
          </div>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${workOrder.progress}%`,
              background: getStatusColor(workOrder.status)
            }}></div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <button style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.8rem'
        }}>
          📋 Update Progress
        </button>
        <button style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '0.8rem'
        }}>
          📊 View Details
        </button>
      </div>
    </div>
  );

  const MaintenanceScheduleCard = ({ schedule }) => (
    <div style={styles.workOrderCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
            {schedule.type} Maintenance
          </h4>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            Track Section: {schedule.trackSection} • Chainage: {schedule.chainageStart} - {schedule.chainageEnd} km
          </p>
        </div>
        <div style={{
          ...styles.priorityBadge,
          background: schedule.status === 'scheduled' ? '#3b82f6' : 
                     schedule.status === 'in-progress' ? '#f59e0b' : '#10b981'
        }}>
          {schedule.status.toUpperCase()}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        <div>
          <strong>Scheduled Date:</strong> {new Date(schedule.scheduledDate).toLocaleDateString()}
        </div>
        <div>
          <strong>Duration:</strong> {schedule.duration}
        </div>
        <div>
          <strong>Crew Size:</strong> {schedule.crewSize} members
        </div>
        <div>
          <strong>Equipment:</strong> {schedule.equipmentRequired.join(', ')}
        </div>
      </div>

      <div style={{ 
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        fontSize: '0.9rem'
      }}>
        <strong>Work Description:</strong> {schedule.description}
      </div>
    </div>
  );

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2rem', fontWeight: '700' }}>
              🔧 ITMS - Maintenance Crew
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
              Work orders, maintenance scheduling, and track repair management
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              color: 'white',
              fontWeight: '600'
            }}>
              👷 Assigned: {workOrders.filter(wo => wo.status === 'in-progress').length} Active
            </div>
            <button 
              onClick={() => navigate('/analytics/maintenance')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📈 View Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        {['work-orders', 'schedule', 'resources', 'reports', 'history'].map(tab => (
          <button
            key={tab}
            style={{
              ...styles.navTab,
              ...(activeTab === tab && styles.navTabActive)
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'work-orders' && '📋 Work Orders'}
            {tab === 'schedule' && '🗓️ Schedule'}
            {tab === 'resources' && '🛠️ Resources'}
            {tab === 'reports' && '📊 Reports'}
            {tab === 'history' && '📚 History'}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '3rem',
            color: 'white'
          }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #0f766e',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ marginLeft: '1rem' }}>Loading maintenance data...</span>
          </div>
        ) : (
          <>
            {/* Work Orders Tab */}
            {activeTab === 'work-orders' && (
              <div style={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ margin: '0', color: '#1f2937', fontSize: '1.8rem' }}>
                    Active Work Orders
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button style={{
                      background: '#0f766e',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}>
                      ➕ New Work Order
                    </button>
                    <button 
                      onClick={loadMaintenanceData}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                </div>

                {/* Work Order Filters */}
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  marginBottom: '2rem',
                  flexWrap: 'wrap'
                }}>
                  {['all', 'critical', 'high', 'medium', 'low'].map(priority => (
                    <button
                      key={priority}
                      style={{
                        background: priority === 'all' ? '#6b7280' : getPriorityColor(priority),
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                      }}
                    >
                      {priority.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Work Orders List */}
                <div>
                  {workOrders.map(workOrder => (
                    <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
                  ))}
                </div>
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div style={styles.section}>
                <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
                  Maintenance Schedule
                </h2>

                <div style={{ 
                  background: '#f8fafc', 
                  borderRadius: '12px', 
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ 
                    height: '400px', 
                    background: 'white',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6b7280',
                    border: '2px dashed #e5e7eb'
                  }}>
                    📅 Interactive Calendar View
                    <br />
                    <span style={{ fontSize: '0.9rem' }}>
                      (Gantt chart showing scheduled maintenance activities)
                    </span>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Upcoming Maintenance</h3>
                  {maintenanceSchedule.map(schedule => (
                    <MaintenanceScheduleCard key={schedule.id} schedule={schedule} />
                  ))}
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div style={styles.section}>
                <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
                  Crew & Equipment Resources
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div style={styles.workOrderCard}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>👥 Crew Availability</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { team: 'Track Maintenance A', available: 8, total: 12 },
                        { team: 'Welding Crew B', available: 5, total: 6 },
                        { team: 'Inspection Team C', available: 3, total: 4 }
                      ].map(team => (
                        <div key={team.team}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span>{team.team}</span>
                            <span>{team.available}/{team.total}</span>
                          </div>
                          <div style={styles.progressBar}>
                            <div style={{
                              ...styles.progressFill,
                              width: `${(team.available / team.total) * 100}%`,
                              background: '#10b981'
                            }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.workOrderCard}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>🛠️ Equipment Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { equipment: 'Track Recording Car', status: 'Operational', usage: '85%' },
                        { equipment: 'Rail Grinder', status: 'Maintenance', usage: '0%' },
                        { equipment: 'Tamping Machine', status: 'Operational', usage: '92%' }
                      ].map(item => (
                        <div key={item.equipment} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          background: '#f8fafc',
                          borderRadius: '6px'
                        }}>
                          <span>{item.equipment}</span>
                          <span style={{
                            color: item.status === 'Operational' ? '#10b981' : '#f59e0b',
                            fontWeight: '600'
                          }}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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

// Mock data functions
const fetchWorkOrders = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    {
      id: '001',
      title: 'Emergency Gauge Adjustment',
      chainage: 45.2,
      trackSection: 'Section A-12',
      defectType: 'Gauge Widening',
      priority: 'critical',
      status: 'in-progress',
      assignedTo: 'Track Maintenance A',
      dueDate: '2024-01-20',
      estimatedDuration: '4 hours',
      progress: 60
    },
    {
      id: '002',
      title: 'Rail Grinding - Wear Correction',
      chainage: 128.7,
      trackSection: 'Section B-08',
      defectType: 'Rail Wear',
      priority: 'high',
      status: 'pending',
      assignedTo: 'Welding Crew B',
      dueDate: '2024-01-22',
      estimatedDuration: '6 hours',
      progress: 0
    }
  ];
};

const fetchMaintenanceSchedule = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: 1,
      type: 'Preventive',
      trackSection: 'Section C-15',
      chainageStart: 89.2,
      chainageEnd: 92.8,
      scheduledDate: '2024-01-25',
      duration: '8 hours',
      crewSize: 6,
      equipmentRequired: ['Track Recording Car', 'Tamping Machine'],
      description: 'Routine track alignment and ballast regulation',
      status: 'scheduled'
    }
  ];
};

export default MaintenanceDashboard;