import React, { use, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from './qscan';
import { installationService } from './insserv';

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

// Parse grid text back to grid array
const parseGridText = (text) => {
  const lines = text.trim().split('\n');
  const grid = lines.map(line => line.split(''));
  return grid;
};

// Process uploaded text file and extract grid pattern
const processTextFile = (text) => {
  // Remove any extra spaces and clean the text
  const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/ /g, '');
  
  // Split into lines and filter out empty lines
  const lines = cleanText.split('\n').filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('File is empty or contains no valid grid data');
  }
  
  // Check if it's a valid grid pattern (all lines should have same length)
  const firstLineLength = lines[0].length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length !== firstLineLength) {
      throw new Error('Invalid grid format: lines have different lengths');
    }
  }
  
  // Check if it's an 18x18 grid
  if (lines.length !== EXPECTED_GRID_SIZE || firstLineLength !== EXPECTED_GRID_SIZE) {
    throw new Error(`Expected ${EXPECTED_GRID_SIZE}x${EXPECTED_GRID_SIZE} grid, but got ${lines.length}x${firstLineLength}`);
  }
  
  // Validate characters (only / and \ allowed)
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

const InstallationDashboard = ({ user }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [installationForm, setInstallationForm] = useState({
    gpsLocation: '',
    trackId: '',
    installationNotes: ''
  });
  const [batchHistory, setBatchHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const nav = useNavigate();

  const handleInstallationChange = (e) => {
    setInstallationForm({
      ...installationForm,
      [e.target.name]: e.target.value
    });
  };

  const handleScanResult = async (objectId) => {
    try {
      setLoading(true);
      const batchDetails = await installationService.getBatchDetails(objectId);
      const history = await installationService.getBatchHistory(objectId);
      
      setScanResult({ objectId, batchDetails });
      setBatchHistory(history);
      setError('');
    } catch (error) {
      setError('Failed to fetch batch details: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInstallationForm(prev => ({
            ...prev,
            gpsLocation: `${latitude}, ${longitude}`
          }));
        },
        (error) => {
          setError('Unable to retrieve location: ' + error.message);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  const handleSubmitInstallation = async (e) => {
    e.preventDefault();
    if (!scanResult) return;

    setLoading(true);
    try {
      await installationService.recordInstallation({
        objectId: scanResult.objectId,
        gpsLocation: installationForm.gpsLocation,
        trackId: installationForm.trackId,
        installationNotes: installationForm.installationNotes,
        installedBy: user._id
      });
      
      setSuccess('Installation recorded successfully!');
      setScanResult(null);
      setBatchHistory(null);
      setInstallationForm({ gpsLocation: '', trackId: '', installationNotes: '' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to record installation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Inline CSS Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    dashboard: {
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)'
    },
    header: {
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: 'white',
      padding: '40px 30px',
      textAlign: 'center'
    },
    headerTitle: {
      margin: '0 0 15px 0',
      fontSize: '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(45deg, #fff, #d1fae5)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    headerSubtitle: {
      fontSize: '1.2rem',
      opacity: '0.9',
      fontWeight: '500'
    },
    content: {
      padding: '40px'
    },
    section: {
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    scannerInfo: {
      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid #86efac'
    },
    errorMessage: {
      background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
      color: '#dc2626',
      padding: '16px 20px',
      borderRadius: '12px',
      margin: '20px 0',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    successMessage: {
      background: 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)',
      color: '#065f46',
      padding: '16px 20px',
      borderRadius: '12px',
      margin: '20px 0',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    loadingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '20px',
      background: '#f8fafc',
      borderRadius: '12px',
      margin: '20px 0',
      color: '#64748b',
      fontWeight: '500'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid #e2e8f0',
      borderTop: '2px solid #059669',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    scanResult: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      borderRadius: '16px',
      padding: '30px',
      marginTop: '20px',
      border: '1px solid #c7d2fe'
    },
    resultHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px'
    },
    batchCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '25px',
      boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)'
    },
    detailsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginTop: '15px'
    },
    detailItem: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    },
    detailLabel: {
      fontSize: '0.875rem',
      color: '#6b7280',
      fontWeight: '500'
    },
    detailValue: {
      fontSize: '1rem',
      color: '#1f2937',
      fontWeight: '600',
      fontFamily: "'Monaco', 'Consolas', monospace"
    },
    historySection: {
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      marginBottom: '25px',
      boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)'
    },
    timeline: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      marginTop: '15px'
    },
    timelineItem: {
      display: 'flex',
      gap: '15px',
      alignItems: 'flex-start'
    },
    timelineMarker: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem',
      flexShrink: 0
    },
    timelineContent: {
      flex: 1,
      background: '#f8fafc',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    },
    timelineHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    timelineDate: {
      fontSize: '0.875rem',
      color: '#64748b'
    },
    timelineDetails: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      fontSize: '0.875rem',
      color: '#475569'
    },
    installationForm: {
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      marginBottom: '20px'
    },
    formLabel: {
      fontSize: '0.875rem',
      color: '#374151',
      fontWeight: '600'
    },
    formInput: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      outline: 'none'
    },
    formInputFocus: {
      borderColor: '#059669',
      boxShadow: '0 0 0 3px rgba(5, 150, 105, 0.1)'
    },
    textarea: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s ease',
      outline: 'none',
      resize: 'vertical',
      minHeight: '100px',
      fontFamily: 'inherit'
    },
    locationInputGroup: {
      display: 'flex',
      gap: '10px'
    },
    formActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '25px'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 30px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)'
    },
    buttonSecondary: {
      background: 'white',
      color: '#374151',
      border: '2px solid #e5e7eb',
      padding: '12px 30px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    recentInstallations: {
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
    },
    placeholderMessage: {
      textAlign: 'center',
      padding: '40px',
      background: '#f8fafc',
      borderRadius: '12px',
      color: '#64748b'
    },
    // Animation keyframes
    spin: {
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' }
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>🔧 Installation Crew Dashboard</h1>
          <div style={styles.headerSubtitle}>
            Welcome, {user.name} ({user.organization})
          </div>
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

        {/* Main Content */}
        <div style={styles.content}>
          {/* Scanner Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📱 QR Code Scanner</h2>
            
            <div style={styles.scannerInfo}>
              <p style={{ margin: 0, color: '#374151', fontSize: '1.05rem' }}>
                Scan QR codes from materials to record installation details and track progress
              </p>
            </div>
            
            <QRScanner 
              scanning={scanning}
              onScanResult={handleScanResult}
              onStartScan={() => setScanning(true)}
              onStopScan={() => setScanning(false)}
              processTextFile={processTextFile}
              decodeGrid={decodeGrid}
            />

            {error && (
              <div style={styles.errorMessage}>
                <span>❌ {error}</span>
              </div>
            )}

            {success && (
              <div style={styles.successMessage}>
                <span>✅ {success}</span>
              </div>
            )}

            {loading && (
              <div style={styles.loadingIndicator}>
                <div style={styles.spinner}></div>
                Loading batch details...
              </div>
            )}

            {scanResult && batchHistory && (
              <div style={styles.scanResult}>
                <div style={styles.resultHeader}>
                  <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.5rem' }}>
                    📦 Installation Details
                  </h3>
                  <button 
                    onClick={() => {
                      setScanResult(null);
                      setBatchHistory(null);
                    }}
                    style={styles.buttonSecondary}
                    onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseOut={(e) => e.target.style.background = 'white'}
                  >
                    Clear
                  </button>
                </div>

                {/* Batch Details */}
                <div style={styles.batchCard}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.25rem' }}>
                    📊 Batch Information
                  </h4>
                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>ObjectId:</span>
                      <span style={styles.detailValue}>{scanResult.objectId}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Batch Number:</span>
                      <span style={styles.detailValue}>{scanResult.batchDetails.batchNumber}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Material:</span>
                      <span style={styles.detailValue}>{scanResult.batchDetails.materialType}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Vendor:</span>
                      <span style={styles.detailValue}>{scanResult.batchDetails.vendorName}</span>
                    </div>
                  </div>
                </div>

                {/* Installation History */}
                <div style={styles.historySection}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.25rem' }}>
                    📋 Tracking History
                  </h4>
                  <div style={styles.timeline}>
                    {batchHistory.scans.map((scan, index) => (
                      <div key={index} style={styles.timelineItem}>
                        <div style={styles.timelineMarker}>
                          {scan.scanType === 'depot_receival' ? '🏭' : 
                           scan.scanType === 'installation' ? '🔧' : '📦'}
                        </div>
                        <div style={styles.timelineContent}>
                          <div style={styles.timelineHeader}>
                            <strong>{getScanTypeDisplay(scan.scanType)}</strong>
                            <span style={styles.timelineDate}>
                              {new Date(scan.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div style={styles.timelineDetails}>
                            <span>By: {scan.scannedBy} ({scan.role})</span>
                            {scan.location && <span>Location: {scan.location}</span>}
                            {scan.storeArea && <span>Store Area: {scan.storeArea}</span>}
                            {scan.rackNo && <span>Rack: {scan.rackNo}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Installation Form */}
                <form onSubmit={handleSubmitInstallation} style={styles.installationForm}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.25rem' }}>
                    🔧 Record Installation
                  </h4>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>📍 GPS Location</label>
                    <div style={styles.locationInputGroup}>
                      <input
                        type="text"
                        name="gpsLocation"
                        value={installationForm.gpsLocation}
                        onChange={handleInstallationChange}
                        placeholder="Latitude, Longitude"
                        required
                        style={styles.formInput}
                        onFocus={(e) => e.target.style = { ...styles.formInput, ...styles.formInputFocus }}
                        onBlur={(e) => e.target.style = styles.formInput}
                      />
                      <button 
                        type="button" 
                        onClick={getCurrentLocation}
                        style={{
                          ...styles.buttonSecondary,
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.background = 'white'}
                      >
                        Get Current Location
                      </button>
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>🛤️ Track ID</label>
                    <input
                      type="text"
                      name="trackId"
                      value={installationForm.trackId}
                      onChange={handleInstallationChange}
                      placeholder="Enter track or section identifier"
                      required
                      style={styles.formInput}
                      onFocus={(e) => e.target.style = { ...styles.formInput, ...styles.formInputFocus }}
                      onBlur={(e) => e.target.style = styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>📝 Installation Notes</label>
                    <textarea
                      name="installationNotes"
                      value={installationForm.installationNotes}
                      onChange={handleInstallationChange}
                      placeholder="Add any installation notes, observations, or special instructions..."
                      style={styles.textarea}
                      onFocus={(e) => e.target.style = { ...styles.textarea, ...styles.formInputFocus }}
                      onBlur={(e) => e.target.style = styles.textarea}
                    />
                  </div>

                  <div style={styles.formActions}>
                    <button 
                      type="button" 
                      onClick={() => {
                        setScanResult(null);
                        setBatchHistory(null);
                      }}
                      style={styles.buttonSecondary}
                      onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.target.style.background = 'white'}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      style={{
                        ...styles.buttonPrimary,
                        opacity: loading ? 0.7 : 1,
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                      onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                      onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
                    >
                      {loading ? '⏳ Recording...' : '💾 Record Installation'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Recent Installations */}
          <div style={styles.recentInstallations}>
            <h2 style={styles.sectionTitle}>📋 Recent Installations</h2>
            <div style={styles.placeholderMessage}>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                Your recent installations will appear here after scanning and recording.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to display scan types
const getScanTypeDisplay = (scanType) => {
  const types = {
    'depot_receival': 'Depot Receival',
    'installation': 'Installation',
    'inspection': 'Inspection'
  };
  return types[scanType] || scanType;
};

export default InstallationDashboard;