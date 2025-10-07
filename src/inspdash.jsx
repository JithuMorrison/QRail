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
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: '1.5rem 2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  headerContent: {
    maxWidth: '1400px',
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
    maxWidth: '1400px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem'
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
  },
  trackCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.5rem',
    transition: 'all 0.3s ease',
    marginBottom: '1rem'
  },
  gauge: {
    height: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  mapContainer: {
    height: '400px',
    background: 'linear-gradient(135deg, #374151, #4b5563)',
    borderRadius: '12px',
    position: 'relative',
    overflow: 'hidden'
  },
  defectMarker: {
    position: 'absolute',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    cursor: 'pointer',
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  timeFilter: {
    display: 'flex',
    gap: '0.5rem',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '0.5rem',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    marginBottom: '1rem'
  },
  timeButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    background: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  timeButtonActive: {
    background: '#3b82f6',
    color: 'white'
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
  const [activeTab, setActiveTab] = useState('overview');
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [trackData, setTrackData] = useState(null);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const nav = useNavigate();

  useEffect(() => {
    loadStats();
    loadRecentInspections();
    loadTrackData();
    const interval = setInterval(loadTrackData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadTrackData = async () => {
    try {
      const data = await fetchTrackData(timeRange);
      setTrackData(data);
    } catch (error) {
      console.error('Failed to load track data:', error);
    }
  };

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

  const handleDefectClick = (defect) => {
    setSelectedDefect(defect);
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'linear-gradient(135deg, #10b981, #059669)',
      rejected: 'linear-gradient(135deg, #ef4444, #dc2626)',
      pending: 'linear-gradient(135deg, #f59e0b, #d97706)',
      'needs-repair': 'linear-gradient(135deg, #f97316, #ea580c)',
      normal: 'linear-gradient(135deg, #10b981, #059669)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
      critical: 'linear-gradient(135deg, #ef4444, #dc2626)'
    };
    return colors[status] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  };

  const getStatusIcon = (status) => {
    const icons = {
      approved: '✅',
      rejected: '❌',
      pending: '⏳',
      'needs-repair': '🔧',
      normal: '✅',
      warning: '⚠️',
      critical: '🚨'
    };
    return icons[status] || '📋';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      normal: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[severity] || colors.normal;
  };

  const StatCard = ({ title, value, subtitle, icon, trend }) => (
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
          {subtitle && (
            <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.5rem' }}>
              {subtitle}
            </div>
          )}
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
          #{inspection._id?.slice(-6) || 'N/A'}
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

  const TrackParameterGauge = ({ parameter, value, unit, threshold, currentValue }) => {
    const percentage = Math.min((currentValue / threshold) * 100, 100);
    const status = currentValue < threshold * 0.7 ? 'normal' : currentValue < threshold * 0.9 ? 'warning' : 'critical';
    
    return (
      <div style={styles.trackCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, color: '#1f2937' }}>{parameter}</h4>
          <div style={{
            ...styles.statusBadge,
            background: getStatusColor(status)
          }}>
            {getStatusIcon(status)} {status.toUpperCase()}
          </div>
        </div>
        
        <div style={styles.gauge}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(
              ${status === 'normal' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'} 0% ${percentage}%,
              #e5e7eb ${percentage}% 100%
            )`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'white',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                {currentValue}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {unit}
              </span>
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '1rem',
          fontSize: '0.8rem',
          color: '#6b7280'
        }}>
          <span>Min: 0{unit}</span>
          <span>Threshold: {threshold}{unit}</span>
        </div>
      </div>
    );
  };

  const DefectMarker = ({ defect, onDefectClick }) => (
    <div 
      style={{
        ...styles.trackCard,
        borderLeft: `4px solid ${getSeverityColor(defect.severity)}`,
        cursor: 'pointer'
      }}
      onClick={() => onDefectClick(defect)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>
            Chainage: {defect.chainage} km
          </h4>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
            {defect.type} • Detected: {new Date(defect.detectedAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{
          ...styles.statusBadge,
          background: getStatusColor(defect.severity)
        }}>
          {defect.severity === 'critical' ? '🚨' : '⚠️'} 
          {defect.severity.toUpperCase()}
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        fontSize: '0.9rem'
      }}>
        <div>
          <strong>Parameters:</strong>
          <div style={{ marginTop: '0.5rem' }}>
            {Object.entries(defect.parameters).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{key}:</span>
                <span style={{
                  color: value.status === 'normal' ? '#10b981' : 
                         value.status === 'warning' ? '#f59e0b' : '#ef4444',
                  fontWeight: '600'
                }}>
                  {value.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <strong>Maintenance Required:</strong>
          <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontWeight: '600' }}>
            {defect.maintenanceRequired}
          </p>
        </div>
      </div>
      
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
          📋 Create Work Order
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
          📊 View Analytics
        </button>
      </div>
    </div>
  );

  const InteractiveMap = ({ defects, onDefectClick }) => {
    const getMarkerPosition = (chainage, totalLength = 250) => {
      const x = (chainage / totalLength) * 80 + 10;
      const y = 50 + (Math.sin(chainage * 0.1) * 30);
      return { x, y };
    };

    return (
      <div style={styles.mapContainer}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          right: '5%',
          height: '4px',
          background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)',
          transform: 'translateY(-50%)'
        }}></div>
        
        {[0, 50, 100, 150, 200, 250].map(chainage => (
          <div key={chainage} style={{
            position: 'absolute',
            left: `${(chainage / 250) * 90 + 5}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '0.8rem',
            background: '#374151',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px'
          }}>
            {chainage}km
          </div>
        ))}
        
        {defects.map(defect => {
          const position = getMarkerPosition(defect.chainage);
          return (
            <div
              key={defect.id}
              style={{
                ...styles.defectMarker,
                left: `${position.x}%`,
                top: `${position.y}%`,
                background: getSeverityColor(defect.severity)
              }}
              onClick={() => onDefectClick(defect)}
              title={`${defect.type} at ${defect.chainage}km`}
            >
              <div style={{
                fontSize: '10px',
                color: 'white',
                textAlign: 'center',
                lineHeight: '16px',
                fontWeight: 'bold'
              }}>
                {defect.severity === 'critical' ? '🚨' : '⚠️'}
              </div>
            </div>
          );
        })}
        
        <div style={{
          position: 'absolute',
          left: '60%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#3b82f6',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📍 Current Position: 150.2km
        </div>
      </div>
    );
  };

  const DefectDetailModal = ({ defect, onClose }) => {
    if (!defect) return null;

    return (
      <div style={styles.modalOverlay} onClick={onClose}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>Defect Details</h2>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              ...styles.statusBadge,
              background: getStatusColor(defect.severity),
              marginBottom: '1rem'
            }}>
              {defect.severity === 'critical' ? '🚨 CRITICAL' : '⚠️ WARNING'}
            </div>
            
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{defect.type}</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>Chainage: {defect.chainage} km</p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Track Parameters</h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {Object.entries(defect.parameters).map(([key, value]) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <span style={{ fontWeight: '600' }}>{key}:</span>
                  <span style={{
                    color: value.status === 'normal' ? '#10b981' : 
                           value.status === 'warning' ? '#f59e0b' : '#ef4444',
                    fontWeight: '600'
                  }}>
                    {value.value} {value.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>Maintenance Required</h4>
            <p style={{ margin: 0, color: '#ef4444', fontWeight: '600' }}>
              {defect.maintenanceRequired}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
            onClick={() => nav("/work-order/new")}
            >
              📋 Create Work Order
            </button>
            <button style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              📊 Generate Report
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.dashboard}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerTitle}>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2.5rem', fontWeight: '700' }}>
              🛤️ ITMS - Inspector Dashboard
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
              marginTop: "1rem"
            }} onClick={()=>{nav('/analytics/inspector')}}>View Analytics</button>
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
            ...(activeTab === 'overview' && styles.navTabActive)
          }}
          onClick={() => setActiveTab('overview')}
        >
          📊 Track Overview
        </button>
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
            ...(activeTab === 'defects' && styles.navTabActive)
          }}
          onClick={() => setActiveTab('defects')}
        >
          ⚠️ Track Defects
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

        {/* Track Overview Tab */}
        {activeTab === 'overview' && trackData && (
          <div>
            <div style={styles.timeFilter}>
              {['1h', '24h', '7d', '30d'].map(range => (
                <button
                  key={range}
                  style={{
                    ...styles.timeButton,
                    ...(timeRange === range && styles.timeButtonActive)
                  }}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>

            <div style={styles.tabContent}>
              <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '2rem' }}>
                Track Health Overview
              </h2>
              
              <div style={styles.statsGrid}>
                <StatCard 
                  title="Total Track Length" 
                  value={`${trackData.totalLength} km`} 
                  subtitle="Monitored sections"
                  icon="🛤️"
                />
                <StatCard 
                  title="Active Defects" 
                  value={trackData.defectsSummary.active} 
                  subtitle={`${trackData.defectsSummary.critical} critical`}
                  icon="⚠️"
                />
                <StatCard 
                  title="Avg. Gauge Width" 
                  value={trackData.avgParameters.gauge} 
                  subtitle="Within tolerance"
                  icon="📏"
                />
                <StatCard 
                  title="Maintenance Score" 
                  value={`${trackData.maintenanceScore}%`} 
                  subtitle="Overall track health"
                  icon="⭐"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Track Parameters */}
              <div style={styles.tabContent}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937' }}>Key Parameters</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {trackData.parameters.map(param => (
                    <TrackParameterGauge key={param.name} {...param} />
                  ))}
                </div>
              </div>

              {/* Recent Defects */}
              <div style={styles.tabContent}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, color: '#1f2937' }}>Recent Defects</h3>
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Last 24 hours
                  </span>
                </div>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {trackData.recentDefects.map(defect => (
                    <DefectMarker 
                      key={defect.id} 
                      defect={defect} 
                      onDefectClick={handleDefectClick}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Map */}
            <div style={styles.tabContent}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Track Map</h3>
              <InteractiveMap 
                defects={trackData.recentDefects} 
                onDefectClick={handleDefectClick}
              />
            </div>
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

        {/* Defects Tab */}
        {activeTab === 'defects' && trackData && (
          <div style={styles.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#1f2937', fontSize: '2rem' }}>
                Track Defects Management
              </h2>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  🚨 Report New Defect
                </button>
                <button style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  📊 Defect Analytics
                </button>
              </div>
            </div>

            {/* Defects Summary */}
            <div style={styles.statsGrid}>
              <StatCard 
                title="Critical Defects" 
                value={trackData.defectsSummary.critical} 
                subtitle="Require immediate attention"
                icon="🚨"
              />
              <StatCard 
                title="Warning Defects" 
                value={trackData.defectsSummary.warning} 
                subtitle="Monitor closely"
                icon="⚠️"
              />
              <StatCard 
                title="Normal Defects" 
                value={trackData.defectsSummary.normal} 
                subtitle="Routine maintenance"
                icon="✅"
              />
              <StatCard 
                title="Total Defects" 
                value={trackData.defectsSummary.active} 
                subtitle="All severity levels"
                icon="📋"
              />
            </div>

            {/* Defects List */}
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>All Track Defects</h3>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {trackData.recentDefects.map(defect => (
                  <DefectMarker 
                    key={defect.id} 
                    defect={defect} 
                    onDefectClick={handleDefectClick}
                  />
                ))}
              </div>
            </div>
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

      {/* Defect Detail Modal */}
      {selectedDefect && (
        <DefectDetailModal 
          defect={selectedDefect} 
          onClose={() => setSelectedDefect(null)} 
        />
      )}

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

// Mock data function for track data
const fetchTrackData = async (timeRange) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    totalLength: 245.7,
    defectsSummary: {
      active: 12,
      critical: 3,
      warning: 7,
      normal: 2
    },
    avgParameters: {
      gauge: 1435,
      twist: 2.1,
      wear: 1.8,
      alignment: 0.8
    },
    maintenanceScore: 87,
    parameters: [
      { 
        name: 'Gauge Width', 
        currentValue: 1435, 
        unit: 'mm', 
        threshold: 1445 
      },
      { 
        name: 'Track Twist', 
        currentValue: 2.1, 
        unit: 'mm/m', 
        threshold: 3.0 
      },
      { 
        name: 'Rail Wear', 
        currentValue: 1.8, 
        unit: 'mm', 
        threshold: 2.5 
      },
      { 
        name: 'Alignment', 
        currentValue: 0.8, 
        unit: 'mm', 
        threshold: 1.5 
      }
    ],
    recentDefects: [
      {
        id: 1,
        chainage: 45.2,
        type: 'Gauge Widening',
        severity: 'critical',
        detectedAt: '2024-01-15T10:30:00Z',
        parameters: {
          gauge: { value: 1448, unit: 'mm', status: 'critical' },
          twist: { value: 2.8, unit: 'mm/m', status: 'warning' }
        },
        maintenanceRequired: 'Urgent gauge adjustment required within 24 hours'
      },
      {
        id: 2,
        chainage: 128.7,
        type: 'Rail Wear',
        severity: 'warning',
        detectedAt: '2024-01-14T14:20:00Z',
        parameters: {
          wear: { value: 2.3, unit: 'mm', status: 'warning' },
          alignment: { value: 1.2, unit: 'mm', status: 'normal' }
        },
        maintenanceRequired: 'Schedule rail grinding within 7 days'
      }
    ]
  };
};

export default InspectorDashboard;