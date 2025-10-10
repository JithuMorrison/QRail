// WorkOrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { maintenanceService } from './maintenanceserv';
import { inspectorService } from './inspserv';

const WorkOrderDetail = ({ user }) => {
  const { workOrderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState({
    progress: 0,
    notes: '',
    status: 'in-progress'
  });
  const [defectData, setDefectData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationForm, setCreationForm] = useState({
    title: '',
    defectType: '',
    priority: 'high',
    assignedTo: '',
    dueDate: '',
    estimatedDuration: '',
    description: '',
    requiredTools: [],
    safetyRequirements: []
  });

  // Check if we're creating a new work order or viewing existing one
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const defectId = searchParams.get('defectId');
    const createNew = searchParams.get('create');
    
    if (createNew === 'true' && defectId) {
      // Inspector creating work order from defect
      setIsCreating(true);
      loadDefectData(defectId);
    } else if (workOrderId && workOrderId !== 'new') {
      // Viewing existing work order - only allowed for maintenance
      if (user.role === 'maintenance') {
        loadWorkOrderDetails();
      } else {
        // Redirect inspectors back to their dashboard
        navigate('/inspector');
      }
    } else if (workOrderId === 'new') {
      // Creating new work order without defect - only allowed for maintenance
      if (user.role === 'maintenance') {
        setIsCreating(true);
      } else {
        // Redirect inspectors to defect reporting
        navigate('/defect-report');
      }
    }
  }, [workOrderId, location.search, user.role, navigate]);

  const loadDefectData = async (defectId) => {
    try {
      const defect = await inspectorService.getDefectDetails(defectId);
      setDefectData(defect);
      
      // Pre-fill form with defect data
      setCreationForm(prev => ({
        ...prev,
        title: `Repair: ${defect.defectType} at ${defect.chainage}km`,
        defectType: defect.defectType,
        description: `Address ${defect.defectType} identified at chainage ${defect.chainage}km. ${defect.description}`,
        priority: defect.severity === 'critical' ? 'critical' : 'high',
        chainage: defect.chainage
      }));
    } catch (error) {
      console.error('Failed to load defect data:', error);
    }
  };

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

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const workOrderData = {
        ...creationForm,
        defectId: defectData?.defectId,
        chainage: defectData?.chainage,
        createdBy: user.id,
        createdByName: user.name,
        createdFrom: user.role
      };
      
      const result = await maintenanceService.createWorkOrder(workOrderData);
      
      // Navigate based on user role
      if (user.role === 'inspector') {
        // Redirect inspector back to their dashboard after creation
        navigate('/inspector', { 
          state: { message: `Work order ${result.workOrder.id} created successfully!!` } 
        });
      } else {
        // Redirect maintenance to the newly created work order
        navigate(`/work-order/${result.workOrder.id}`);
      }
    } catch (error) {
      console.error('Failed to create work order:', error);
      alert('Failed to create work order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.updateWorkOrder(workOrderId, {
        ...newUpdate,
        updatedBy: user.name
      });
      await loadWorkOrderDetails();
      setNewUpdate({ progress: 0, notes: '', status: 'in-progress' });
    } catch (error) {
      console.error('Failed to update work order:', error);
    }
  };

  const handleCompleteWorkOrder = async () => {
    try {
      await maintenanceService.updateWorkOrder(workOrderId, {
        progress: 100,
        status: 'completed',
        notes: 'Work order completed successfully.',
        updatedBy: user.name
      });
      await loadWorkOrderDetails();
    } catch (error) {
      console.error('Failed to complete work order:', error);
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
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#1f2937'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'border-color 0.3s ease'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      resize: 'vertical',
      minHeight: '100px'
    },
    button: {
      background: '#0f766e',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s ease'
    },
    dangerButton: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '600'
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#f59e0b',
      'in-progress': '#3b82f6',
      'completed': '#10b981',
      'cancelled': '#6b7280',
      'critical': '#ef4444',
      'high': '#f59e0b',
      'medium': '#3b82f6',
      'low': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getBackButtonPath = () => {
    if (isCreating) {
      return user.role === 'inspector' ? '/inspector' : '/maintenance';
    }
    return '/maintenance'; // Only maintenance can view work orders
  };

  // Redirect inspectors trying to view work orders directly
  if (!isCreating && user.role === 'inspector') {
    navigate('/inspector');
    return null;
  }

  if (loading && !isCreating) {
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
          <span style={{ marginLeft: '1rem' }}>
            {isCreating ? 'Creating Work Order...' : 'Loading work order details...'}
          </span>
        </div>
      </div>
    );
  }

  // Create Work Order Form (for both inspector and maintenance)
  if (isCreating) {
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
                onClick={() => navigate(getBackButtonPath())}
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
                ← Back to {user.role === 'inspector' ? 'Inspector Dashboard' : 'Maintenance Dashboard'}
              </button>
              <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2rem', fontWeight: '700' }}>
                📋 Create New Work Order
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
                {defectData 
                  ? `Based on defect at chainage ${defectData.chainage}km` 
                  : user.role === 'maintenance' 
                    ? 'Create a new maintenance work order' 
                    : 'Create work order from defect report'
                }
              </p>
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={{ display: 'grid', gridTemplateColumns: defectData ? '2fr 1fr' : '1fr', gap: '2rem' }}>
            {/* Left Column - Form */}
            <div style={styles.section}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>Work Order Details</h2>
              
              <form onSubmit={handleCreateWorkOrder}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Work Order Title *</label>
                    <input
                      type="text"
                      value={creationForm.title}
                      onChange={(e) => setCreationForm({...creationForm, title: e.target.value})}
                      required
                      style={styles.input}
                      placeholder="Enter work order title"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Defect Type *</label>
                    <select
                      value={creationForm.defectType}
                      onChange={(e) => setCreationForm({...creationForm, defectType: e.target.value})}
                      required
                      style={styles.input}
                    >
                      <option value="">Select Defect Type</option>
                      <option value="gauge-widening">Gauge Widening</option>
                      <option value="rail-wear">Rail Wear</option>
                      <option value="track-settlement">Track Settlement</option>
                      <option value="alignment-issue">Alignment Issue</option>
                      <option value="surface-defect">Surface Defect</option>
                      <option value="preventive">Preventive Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Priority *</label>
                    <select
                      value={creationForm.priority}
                      onChange={(e) => setCreationForm({...creationForm, priority: e.target.value})}
                      required
                      style={{
                        ...styles.input,
                        borderLeft: `4px solid ${getStatusColor(creationForm.priority)}`
                      }}
                    >
                      <option value="critical">Critical 🚨</option>
                      <option value="high">High ⚠️</option>
                      <option value="medium">Medium 🔔</option>
                      <option value="low">Low 📋</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Assigned To *</label>
                    <select
                      value={creationForm.assignedTo}
                      onChange={(e) => setCreationForm({...creationForm, assignedTo: e.target.value})}
                      required
                      style={styles.input}
                    >
                      <option value="">Select Crew</option>
                      <option value="Track Maintenance A">Track Maintenance A</option>
                      <option value="Welding Crew B">Welding Crew B</option>
                      <option value="Inspection Team C">Inspection Team C</option>
                      <option value="Emergency Response">Emergency Response</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Due Date *</label>
                    <input
                      type="date"
                      value={creationForm.dueDate}
                      onChange={(e) => setCreationForm({...creationForm, dueDate: e.target.value})}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                {user.role === 'maintenance' && !defectData && (
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Chainage (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={creationForm.chainage || ''}
                      onChange={(e) => setCreationForm({...creationForm, chainage: e.target.value})}
                      style={styles.input}
                      placeholder="Enter chainage in kilometers"
                    />
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Estimated Duration</label>
                  <input
                    type="text"
                    value={creationForm.estimatedDuration}
                    onChange={(e) => setCreationForm({...creationForm, estimatedDuration: e.target.value})}
                    style={styles.input}
                    placeholder="e.g., 4 hours, 2 days"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Work Description *</label>
                  <textarea
                    value={creationForm.description}
                    onChange={(e) => setCreationForm({...creationForm, description: e.target.value})}
                    required
                    style={styles.textarea}
                    placeholder="Describe the work to be performed, including specific tasks and requirements..."
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Required Tools & Equipment</label>
                  <input
                    type="text"
                    value={creationForm.requiredTools.join(', ')}
                    onChange={(e) => setCreationForm({
                      ...creationForm, 
                      requiredTools: e.target.value.split(',').map(item => item.trim())
                    })}
                    style={styles.input}
                    placeholder="e.g., track gauge, welding machine, safety gear"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Safety Requirements</label>
                  <textarea
                    value={creationForm.safetyRequirements.join('\n')}
                    onChange={(e) => setCreationForm({
                      ...creationForm, 
                      safetyRequirements: e.target.value.split('\n').filter(item => item.trim())
                    })}
                    style={styles.textarea}
                    placeholder="List safety requirements (one per line)..."
                    rows="3"
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => navigate(getBackButtonPath())}
                    style={{
                      ...styles.button,
                      background: '#6b7280'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={styles.button}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : '🛠️ Create Work Order'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column - Defect Info (if available) */}
            {defectData && (
              <div style={styles.section}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Related Defect</h3>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getStatusColor(defectData.severity)}`
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                    {defectData.defectType} at {defectData.chainage}km
                  </h4>
                  <div style={{ 
                    ...styles.statusBadge, 
                    background: getStatusColor(defectData.severity),
                    marginBottom: '1rem'
                  }}>
                    {defectData.severity.toUpperCase()}
                  </div>
                  <p style={{ margin: '0 0 1rem 0', color: '#4b5563' }}>
                    <strong>Description:</strong> {defectData.description}
                  </p>
                  {defectData.recommendedActions && (
                    <p style={{ margin: '0 0 1rem 0', color: '#4b5563' }}>
                      <strong>Recommended Actions:</strong> {defectData.recommendedActions}
                    </p>
                  )}
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Reported: {new Date(defectData.reportedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Existing Work Order View (Maintenance only)
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
            ← Back to Maintenance Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Work Order Detail View (Maintenance only)
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
              ← Back to Maintenance Dashboard
            </button>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2rem', fontWeight: '700' }}>
              🔧 Work Order: {workOrder.id}
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
              {workOrder.title} • Chainage: {workOrder.chainage} km
              {workOrder.createdFrom === 'inspector' && ' • Created from Inspector Report'}
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
                  <div style={{
                    ...styles.statusBadge,
                    background: getStatusColor(workOrder.priority),
                    display: 'inline-flex',
                    marginTop: '0.5rem'
                  }}>
                    {workOrder.priority.toUpperCase()}
                  </div>
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

              {workOrder.estimatedDuration && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Estimated Duration:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#1f2937' }}>{workOrder.estimatedDuration}</p>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <strong>Description:</strong>
                <p style={{ margin: '0.5rem 0 0 0', color: '#4b5563', lineHeight: '1.6' }}>
                  {workOrder.description}
                </p>
              </div>

              {workOrder.requiredTools && workOrder.requiredTools.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Required Tools:</strong>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#4b5563' }}>
                    {workOrder.requiredTools.join(', ')}
                  </p>
                </div>
              )}

              {workOrder.safetyRequirements && workOrder.safetyRequirements.length > 0 && (
                <div>
                  <strong>Safety Requirements:</strong>
                  <ul style={{ margin: '0.5rem 0 0 0', color: '#4b5563', paddingLeft: '1.5rem' }}>
                    {workOrder.safetyRequirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Progress Updates */}
            <div style={styles.section}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>Progress Updates</h2>
              
              {updates.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
                  No progress updates yet.
                </p>
              ) : (
                updates.map((update, index) => (
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
                ))
              )}
            </div>
          </div>

          {/* Right Column - Maintenance actions */}
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
                    <option value="cancelled">Cancelled</option>
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
                    placeholder="Add update notes, work performed, issues encountered..."
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
                  style={styles.button}
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

              {workOrder.progress === 100 && workOrder.status !== 'completed' && (
                <button
                  onClick={handleCompleteWorkOrder}
                  style={{
                    ...styles.button,
                    background: '#10b981',
                    width: '100%',
                    marginTop: '1rem'
                  }}
                >
                  ✅ Mark as Completed
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div style={styles.section}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button style={{
                  ...styles.button,
                  background: '#3b82f6'
                }}>
                  📞 Request Assistance
                </button>
                <button style={{
                  ...styles.button,
                  background: '#f59e0b'
                }}>
                  🛠️ Request Tools
                </button>
                <button style={styles.dangerButton}>
                  🚨 Report Issue
                </button>
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

export default WorkOrderDetail;