import React, { useState, useEffect } from 'react';
import QRScanner from './qscan';
import { inspectorService } from './inspserv';
import { useNavigate } from 'react-router-dom';

const REDUNDANCY = 3;
const EXPECTED_GRID_SIZE = 18;

// Convert hex string to bits
const textToBits = (hexStr) => {
  const bits = [];
  const bytes = new Uint8Array(hexStr.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  
  for (let byte of bytes) {
    const binaryStr = byte.toString(2).padStart(8, '0');
    for (let bit of binaryStr) {
      bits.push(parseInt(bit));
    }
  }
  return bits;
};

// Bits to hex
const bitsToText = (bits, length) => {
  const reducedBits = [];
  for (let i = 0; i < bits.length; i += REDUNDANCY) {
    const chunk = bits.slice(i, i + REDUNDANCY);
    const sum = chunk.reduce((a, b) => a + b, 0);
    reducedBits.push(sum > REDUNDANCY / 2 ? 1 : 0);
  }
  
  const byteStr = reducedBits.join('');
  const truncatedBits = byteStr.slice(0, length * 4);
  
  const bytes = [];
  for (let i = 0; i < truncatedBits.length; i += 8) {
    const byteBits = truncatedBits.slice(i, i + 8);
    if (byteBits.length === 8) {
      bytes.push(parseInt(byteBits, 2));
    }
  }
  
  const hexArray = bytes.map(b => b.toString(16).padStart(2, '0'));
  let result = hexArray.join('');
  
  if (result.length < length) {
    result = result.padEnd(length, '0');
  } else if (result.length > length) {
    result = result.slice(0, length);
  }
  
  return result;
};

// Decode 18x18 grid
const decodeGrid = (grid, length) => {
  const bits = [];
  const gridSize = grid.length;
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if ((i === 0 && j === 0) || 
          (i === 0 && j === gridSize - 1) || 
          (i === gridSize - 1 && j === 0) || 
          (i === gridSize - 1 && j === gridSize - 1)) {
        continue;
      }
      bits.push(grid[i][j] === '\\' ? 1 : 0);
    }
  }
  
  return bitsToText(bits, length);
};

// Process uploaded text file and extract grid pattern
const processTextFile = (text) => {
  const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/ /g, '');
  const lines = cleanText.split('\n').filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('File is empty or contains no valid grid data');
  }
  
  const firstLineLength = lines[0].length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length !== firstLineLength) {
      throw new Error('Invalid grid format: lines have different lengths');
    }
  }
  
  if (lines.length !== EXPECTED_GRID_SIZE || firstLineLength !== EXPECTED_GRID_SIZE) {
    throw new Error(`Expected ${EXPECTED_GRID_SIZE}x${EXPECTED_GRID_SIZE} grid, but got ${lines.length}x${firstLineLength}`);
  }
  
  const grid = [];
  for (let i = 0; i < lines.length; i++) {
    const row = [];
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char !== '/' && char !== '\\') {
        throw new Error(`Invalid character '${char}' at position (${i+1},${j+1}). Only '/' and '\\' are allowed.`);
      }
      row.push(char);
    }
    grid.push(row);
  }
  
  return grid;
};

// Inline CSS Styles
const styles = {
  dashboard: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  headerTitle: {
    flex: 1,
    minWidth: '300px'
  },
  headerStats: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    padding: '1rem 2rem',
    borderRadius: '15px',
    color: 'white',
    textAlign: 'center',
    minWidth: '200px'
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
    borderBottomColor: '#3b82f6',
    color: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.05)'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  tabContent: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  },
  sectionHeader: {
    marginBottom: '2rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '15px',
    padding: '1.5rem',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.3s ease'
  },
  statContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    position: 'relative',
    zIndex: 2
  },
  inspectionsGrid: {
    display: 'grid',
    gap: '1.5rem'
  },
  inspectionCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'all 0.3s ease'
  },
  inspectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  formInput: {
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.3s ease'
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  alert: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem'
  },
  alertError: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626'
  },
  alertSuccess: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#16a34a'
  },
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '10px',
    margin: '1rem 0'
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite'
  },
  timeline: {
    borderLeft: '3px solid #e5e7eb',
    marginLeft: '1rem',
    paddingLeft: '2rem'
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '2rem'
  },
  timelineMarker: {
    position: 'absolute',
    left: '-2.3rem',
    top: '0',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#3b82f6'
  }
};

const InspectorDashboard = ({ user }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [batchHistory, setBatchHistory] = useState(null);
  const [inspectionForm, setInspectionForm] = useState({
    status: 'approved',
    notes: '',
    damages: '',
    correctiveActions: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner');
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    loadStats();
    loadRecentInspections();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await inspectorService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentInspections = async () => {
    try {
      setInspectionsLoading(true);
      const inspectionsData = await inspectorService.getInspections(1, 5);
      setInspections(inspectionsData.inspections || []);
    } catch (error) {
      console.error('Failed to load inspections:', error);
    } finally {
      setInspectionsLoading(false);
    }
  };

  const handleInspectionChange = (e) => {
    setInspectionForm({
      ...inspectionForm,
      [e.target.name]: e.target.value
    });
  };

  const handleScanResult = async (objectId) => {
    try {
      setLoading(true);
      const batchDetails = await inspectorService.getBatchDetails(objectId);
      const history = await inspectorService.getBatchHistory(objectId);
      
      setScanResult({ objectId, batchDetails });
      setBatchHistory(history);
      setError('');
      setActiveTab('inspection');
    } catch (error) {
      setError('Failed to fetch batch details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setInspectionForm(prev => ({
        ...prev,
        images: [...prev.images, ...files.slice(0, 3)]
      }));
    }
  };

  const removeImage = (index) => {
    setInspectionForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!scanResult) return;

    setLoading(true);
    try {
      await inspectorService.recordInspection({
        objectId: scanResult.objectId,
        status: inspectionForm.status,
        notes: inspectionForm.notes,
        damages: inspectionForm.damages,
        correctiveActions: inspectionForm.correctiveActions,
        inspectedBy: user._id,
        images: inspectionForm.images
      });
      
      setSuccess('Inspection recorded successfully!');
      await loadStats();
      await loadRecentInspections();
      
      setScanResult(null);
      setBatchHistory(null);
      setInspectionForm({
        status: 'approved',
        notes: '',
        damages: '',
        correctiveActions: '',
        images: []
      });
      
      setActiveTab('history');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to record inspection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'linear-gradient(135deg, #10b981, #059669)',
      rejected: 'linear-gradient(135deg, #ef4444, #dc2626)',
      pending: 'linear-gradient(135deg, #f59e0b, #d97706)',
      'needs-repair': 'linear-gradient(135deg, #f97316, #ea580c)'
    };
    return colors[status] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  };

  const getStatusIcon = (status) => {
    const icons = {
      approved: '✅',
      rejected: '❌',
      pending: '⏳',
      'needs-repair': '🔧'
    };
    return icons[status] || '📋';
  };

  const StatCard = ({ title, value, type, icon }) => (
    <div 
      style={styles.statCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={styles.statContent}>
        <div style={{ fontSize: '2.5rem' }}>{icon}</div>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>{title}</h3>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', display: 'block' }}>
            {value || 0}
          </span>
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '-10px',
        right: '-10px',
        width: '100px',
        height: '100px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%'
      }}></div>
    </div>
  );

  const InspectionCard = ({ inspection }) => (
    <div 
      style={styles.inspectionCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={styles.inspectionHeader}>
        <div style={{ fontFamily: 'Courier New, monospace', color: '#6b7280', fontSize: '0.9rem' }}>
          #{inspection._id.slice(-6)}
        </div>
        <div 
          style={{
            ...styles.statusBadge,
            background: getStatusColor(inspection.status)
          }}
        >
          {getStatusIcon(inspection.status)} {inspection.status.toUpperCase()}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontWeight: '600', color: '#1f2937' }}>
            {inspection.batchDetails?.batchNumber || 'N/A'}
          </span>
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {new Date(inspection.timestamp).toLocaleDateString()}
          </span>
        </div>
        {inspection.notes && (
          <p style={{ color: '#4b5563', margin: '0', lineHeight: '1.5' }}>{inspection.notes}</p>
        )}
        {inspection.damages && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            background: '#fef2f2',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '0.9rem'
          }}>
            <strong>Damages:</strong> {inspection.damages}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2.5rem', fontWeight: '700' }}>
              🔍 Inspector Dashboard
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '1.1rem' }}>
              Welcome back, <strong>{user.name}</strong> • {user.organization}
            </p>
            <button style={{
          backgroundColor: "#4CAF50",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          transition: "0.3s",
        }} onClick={()=>{nav('/analytics/installation')}}>View Analytics</button>
          </div>
          <div style={styles.headerStats}>
            <span style={{ display: 'block', fontSize: '0.9rem', opacity: 0.9 }}>Total Inspections</span>
            <span style={{ display: 'block', fontSize: '2rem', fontWeight: 'bold' }}>
              {stats?.total_inspections || 0}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={styles.nav}>
        <button 
          style={{
            ...styles.navTab,
            ...(activeTab === 'scanner' && styles.navTabActive)
          }}
          onClick={() => setActiveTab('scanner')}
        >
          📱 QR Scanner
        </button>
        <button 
          style={{
            ...styles.navTab,
            ...(activeTab === 'inspection' && styles.navTabActive),
            ...(!scanResult && { opacity: 0.5, cursor: 'not-allowed' })
          }}
          onClick={() => scanResult && setActiveTab('inspection')}
          disabled={!scanResult}
        >
          🔍 Current Inspection
        </button>
        <button 
          style={{
            ...styles.navTab,
            ...(activeTab === 'history' && styles.navTabActive)
          }}
          onClick={() => setActiveTab('history')}
        >
          📊 Inspection History
        </button>
        <button 
          style={{
            ...styles.navTab,
            ...(activeTab === 'stats' && styles.navTabActive)
          }}
          onClick={() => setActiveTab('stats')}
        >
          📈 Statistics
        </button>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Alerts */}
        {error && (
          <div style={{...styles.alert, ...styles.alertError}}>
            <span>⚠️ {error}</span>
            <button 
              onClick={() => setError('')}
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{...styles.alert, ...styles.alertSuccess}}>
            <span>✅ {success}</span>
            <button 
              onClick={() => setSuccess('')}
              style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Scanner Tab */}
        {activeTab === 'scanner' && (
          <div style={styles.tabContent}>
            <div style={styles.sectionHeader}>
              <h2 style={{ margin: '0', color: '#1f2937', fontSize: '2rem' }}>QR Code Scanner</h2>
              <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>Scan QR codes to begin inspection process</p>
            </div>
            
            <QRScanner 
              scanning={scanning}
              onScanResult={handleScanResult}
              onStartScan={() => setScanning(true)}
              onStopScan={() => setScanning(false)}
              processTextFile={processTextFile}
              decodeGrid={decodeGrid}
            />

            {loading && (
              <div style={styles.loadingOverlay}>
                <div style={styles.spinner}></div>
                <p>Loading batch details...</p>
              </div>
            )}
          </div>
        )}

        {/* Current Inspection Tab */}
        {activeTab === 'inspection' && scanResult && batchHistory && (
          <div style={styles.tabContent}>
            <div style={{...styles.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2 style={{ margin: '0', color: '#1f2937', fontSize: '2rem' }}>Current Inspection</h2>
              <button 
                onClick={() => {
                  setScanResult(null);
                  setBatchHistory(null);
                  setActiveTab('scanner');
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ← New Scan
              </button>
            </div>

            {/* Batch Summary */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Batch Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Object ID</label>
                  <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                    {scanResult.objectId}
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Batch Number</label>
                  <span>{scanResult.batchDetails.batchNumber}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Material Type</label>
                  <span>{scanResult.batchDetails.materialType}</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Vendor</label>
                  <span>{scanResult.batchDetails.vendorName}</span>
                </div>
              </div>
            </div>

            {/* History Timeline */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>History Timeline</h3>
              <div style={styles.timeline}>
                {batchHistory.scans.map((scan, index) => (
                  <div key={index} style={styles.timelineItem}>
                    <div style={styles.timelineMarker}></div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <strong>{getScanTypeDisplay(scan.scanType)}</strong>
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                          {new Date(scan.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        By: {scan.scannedBy} • {scan.status || 'completed'}
                      </div>
                      {scan.notes && (
                        <p style={{ color: '#4b5563', margin: '0' }}>{scan.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection Form */}
            <form onSubmit={handleSubmitInspection}>
              <h3 style={{ color: '#1f2937', marginBottom: '1rem' }}>Inspection Details</h3>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Inspection Status</label>
                  <select 
                    name="status" 
                    value={inspectionForm.status}
                    onChange={handleInspectionChange}
                    style={{
                      ...styles.formInput,
                      borderLeft: `4px solid ${getStatusColor(inspectionForm.status).split(',')[0]}`
                    }}
                  >
                    <option value="approved">Approved ✅</option>
                    <option value="pending">Pending ⏳</option>
                    <option value="needs-repair">Needs Repair 🔧</option>
                    <option value="rejected">Rejected ❌</option>
                  </select>
                </div>

                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Inspection Notes</label>
                  <textarea
                    name="notes"
                    value={inspectionForm.notes}
                    onChange={handleInspectionChange}
                    placeholder="General observations and comments..."
                    rows="3"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Damages Found</label>
                  <textarea
                    name="damages"
                    value={inspectionForm.damages}
                    onChange={handleInspectionChange}
                    placeholder="Describe any damages or defects..."
                    rows="2"
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Corrective Actions</label>
                  <textarea
                    name="correctiveActions"
                    value={inspectionForm.correctiveActions}
                    onChange={handleInspectionChange}
                    placeholder="Corrective actions taken or recommended..."
                    rows="2"
                    style={styles.formInput}
                  />
                </div>

                <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                  <label style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Upload Images (Max 3)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={inspectionForm.images.length >= 3}
                    style={styles.formInput}
                  />
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {inspectionForm.images.map((image, index) => (
                      <div key={index} style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`Preview ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{
                    ...styles.btnPrimary,
                    ...(loading && { opacity: 0.7, cursor: 'not-allowed' })
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(59, 130, 246, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {loading ? '📤 Recording...' : '✅ Record Inspection'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={styles.tabContent}>
            <div style={{...styles.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2 style={{ margin: '0', color: '#1f2937', fontSize: '2rem' }}>Recent Inspections</h2>
              <button 
                onClick={loadRecentInspections}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {inspectionsLoading ? (
              <div style={styles.loadingOverlay}>
                <div style={styles.spinner}></div>
                <p>Loading inspections...</p>
              </div>
            ) : (
              <div style={styles.inspectionsGrid}>
                {inspections.map(inspection => (
                  <InspectionCard key={inspection._id} inspection={inspection} />
                ))}
                {inspections.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <p>No inspections found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div style={styles.tabContent}>
            <div style={{...styles.sectionHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2 style={{ margin: '0', color: '#1f2937', fontSize: '2rem' }}>Inspection Statistics</h2>
              <button 
                onClick={loadStats}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            <div style={styles.statsGrid}>
              <StatCard title="Approved" value={stats?.approved} type="approved" icon="✅" />
              <StatCard title="Pending" value={stats?.pending} type="pending" icon="⏳" />
              <StatCard title="Needs Repair" value={stats?.needs_repair} type="needs-repair" icon="🔧" />
              <StatCard title="Rejected" value={stats?.rejected} type="rejected" icon="❌" />
            </div>

            {stats && (
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <span>Total Inspections: </span>
                  <strong>{stats.total_inspections}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                  <span>Approval Rate: </span>
                  <strong>
                    {stats.total_inspections > 0 
                      ? Math.round((stats.approved / stats.total_inspections) * 100) 
                      : 0}%
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add CSS animation for spinner */}
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

const getScanTypeDisplay = (scanType) => {
  const types = {
    'depot_receival': 'Depot Receival',
    'installation': 'Installation',
    'inspection': 'Inspection'
  };
  return types[scanType] || scanType;
};

export default InspectorDashboard;