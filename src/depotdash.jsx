import React, { useState, useRef } from 'react';
import { depotService } from './depotserv';
import QRScanner from './qscan';
import RulesManagement from './rulesmanage';

// ----------------- QR Scanning Utilities -----------------
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

// ----------------- Depot Dashboard Component -----------------
const DepotDashboard = ({ user }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [depotForm, setDepotForm] = useState({
    location: '',
    storeArea: '',
    rackNo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState([]);

  const handleDepotChange = (e) => {
    setDepotForm({
      ...depotForm,
      [e.target.name]: e.target.value
    });
  };

  const handleScanResult = async (objectId) => {
    try {
      setError('');
      let batchDetails;
      
      // Try real API first, fallback to simulation
      try {
        batchDetails = await depotService.getBatchDetails(objectId);
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        batchDetails = await depotService.simulateGetBatchDetails(objectId);
      }
      
      setScanResult({ objectId, batchDetails });
      
      // Add to scan history
      setScanHistory(prev => [{
        objectId,
        timestamp: new Date().toLocaleString(),
        status: 'scanned'
      }, ...prev.slice(0, 4)]); // Keep last 5 scans
    } catch (error) {
      setError('Failed to fetch batch details: ' + error.message);
    }
  };

  const handleSubmitScan = async (e) => {
    e.preventDefault();
    if (!scanResult) return;

    setLoading(true);
    try {
      let response;
      try {
        response = await depotService.recordScan({
          objectId: scanResult.objectId,
          depotId: user._id,
          staffId: user._id,
          location: depotForm.location,
          storeArea: depotForm.storeArea,
          rackNo: depotForm.rackNo
        });
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        response = await depotService.simulateRecordScan({
          objectId: scanResult.objectId,
          depotId: user._id,
          staffId: user._id,
          location: depotForm.location,
          storeArea: depotForm.storeArea,
          rackNo: depotForm.rackNo
        });
      }
      
      // Update scan history
      setScanHistory(prev => prev.map(scan => 
        scan.objectId === scanResult.objectId 
          ? { ...scan, status: 'recorded', recordedAt: new Date().toLocaleString() }
          : scan
      ));
      
      setScanResult(null);
      setDepotForm({ location: '', storeArea: '', rackNo: '' });
      setError('');
      
      alert('✅ Scan recorded successfully!');
    } catch (error) {
      setError('Failed to record scan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearScanResult = () => {
    setScanResult(null);
    setError('');
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
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: 'white',
      padding: '40px 30px',
      textAlign: 'center',
      position: 'relative'
    },
    headerTitle: {
      margin: '0 0 25px 0',
      fontSize: '2.5rem',
      fontWeight: '700',
      background: 'linear-gradient(45deg, #fff, #e0e7ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '1000px',
      margin: '0 auto'
    },
    welcomeSection: {
      textAlign: 'center',
      flex: 1
    },
    welcomeText: {
      fontSize: '1.3rem',
      fontWeight: '600',
      margin: '0',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '12px 24px',
      borderRadius: '25px',
      display: 'inline-block',
      color: '#4f46e5'
    },
    statsSection: {
      background: 'rgba(255, 255, 255, 0.2)',
      padding: '15px 25px',
      borderRadius: '15px',
      fontWeight: '600',
      fontSize: '1.1rem',
      minWidth: '200px'
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
      background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '20px',
      border: '1px solid #c7d2fe'
    },
    errorMessage: {
      background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
      color: '#dc2626',
      padding: '16px 20px',
      borderRadius: '12px',
      margin: '20px 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: '500'
    },
    scanResult: {
      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
      borderRadius: '16px',
      padding: '30px',
      marginTop: '20px',
      border: '1px solid #86efac'
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
    form: {
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 2px 15px rgba(0, 0, 0, 0.1)'
    },
    formRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
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
      borderColor: '#4f46e5',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
    },
    disabledInput: {
      padding: '12px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      background: '#f9fafb',
      color: '#6b7280'
    },
    formActions: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '25px'
    },
    buttonPrimary: {
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      color: 'white',
      border: 'none',
      padding: '12px 30px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
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
    buttonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)'
    },
    historySection: {
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
    },
    historyList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    historyItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      transition: 'all 0.3s ease'
    },
    historyInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    objectId: {
      fontWeight: '600',
      color: '#1f2937',
      fontFamily: "'Monaco', 'Consolas', monospace"
    },
    timestamp: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    status: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.875rem',
      fontWeight: '600'
    },
    statusScanned: {
      background: '#fef3c7',
      color: '#d97706'
    },
    statusRecorded: {
      background: '#d1fae5',
      color: '#065f46'
    },
    helpSection: {
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '16px',
      padding: '30px',
      border: '1px solid #fcd34d'
    },
    helpSteps: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      marginTop: '20px'
    },
    step: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '15px 20px',
      background: 'rgba(255, 255, 255, 0.8)',
      borderRadius: '10px',
      fontSize: '1rem',
      lineHeight: '1.5'
    },
    stepNumber: {
      background: '#4f46e5',
      color: 'white',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.875rem',
      fontWeight: '600',
      flexShrink: 0
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.dashboard}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>🏭 Depot Staff Dashboard</h1>
          <div style={styles.headerContent}>
            <div style={styles.welcomeSection}>
              <div style={styles.welcomeText}>
                Welcome, {user.name} ({user.organization})
              </div>
            </div>
            <div style={styles.statsSection}>
              📊 Recent Scans: {scanHistory.length}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={styles.content}>
          {/* Scanner Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🔍 QR Code Scanner</h2>
            
            <div style={styles.scannerInfo}>
              <p style={{ margin: 0, color: '#374151', fontSize: '1.05rem' }}>
                Scan QR codes from materials to record depot information using text files, images, or camera
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
                <button 
                  onClick={clearScanResult} 
                  style={{
                    ...styles.buttonSecondary,
                    padding: '8px 16px',
                    fontSize: '0.875rem'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseOut={(e) => e.target.style.background = 'white'}
                >
                  Clear
                </button>
              </div>
            )}

            {scanResult && (
              <div style={styles.scanResult}>
                <div style={styles.resultHeader}>
                  <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.5rem' }}>
                    ✅ Scan Successful!
                  </h3>
                  <button 
                    onClick={clearScanResult} 
                    style={styles.buttonSecondary}
                    onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                    onMouseOut={(e) => e.target.style.background = 'white'}
                  >
                    New Scan
                  </button>
                </div>
                
                {/* Batch Details */}
                <div style={styles.batchCard}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.25rem' }}>
                    📦 Batch Information
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
                      <span style={styles.detailLabel}>Material Type:</span>
                      <span style={styles.detailValue}>{scanResult.batchDetails.materialType}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Vendor:</span>
                      <span style={styles.detailValue}>{scanResult.batchDetails.vendorName}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Created Date:</span>
                      <span style={styles.detailValue}>
                        {new Date(scanResult.batchDetails.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Warranty:</span>
                      <span style={styles.detailValue}>{scanResult.batchDetails.warranty} months</span>
                    </div>
                  </div>
                </div>

                {/* Depot Form */}
                <form onSubmit={handleSubmitScan} style={styles.form}>
                  <h4 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '1.25rem' }}>
                    🏭 Depot Storage Information
                  </h4>
                  
                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>📍 Location</label>
                      <input
                        type="text"
                        name="location"
                        value={depotForm.location}
                        onChange={handleDepotChange}
                        placeholder="e.g., Main Warehouse, Building A"
                        required
                        style={styles.formInput}
                        onFocus={(e) => e.target.style = { ...styles.formInput, ...styles.formInputFocus }}
                        onBlur={(e) => e.target.style = styles.formInput}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>📦 Store Area</label>
                      <input
                        type="text"
                        name="storeArea"
                        value={depotForm.storeArea}
                        onChange={handleDepotChange}
                        placeholder="e.g., Section 3, Cold Storage"
                        required
                        style={styles.formInput}
                        onFocus={(e) => e.target.style = { ...styles.formInput, ...styles.formInputFocus }}
                        onBlur={(e) => e.target.style = styles.formInput}
                      />
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>🔢 Rack Number</label>
                      <input
                        type="text"
                        name="rackNo"
                        value={depotForm.rackNo}
                        onChange={handleDepotChange}
                        placeholder="e.g., Rack 12-B, Shelf 3"
                        required
                        style={styles.formInput}
                        onFocus={(e) => e.target.style = { ...styles.formInput, ...styles.formInputFocus }}
                        onBlur={(e) => e.target.style = styles.formInput}
                      />
                    </div>
                    
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>👤 Staff ID</label>
                      <input
                        type="text"
                        value={user._id}
                        disabled
                        style={styles.disabledInput}
                      />
                    </div>
                  </div>

                  <div style={styles.formActions}>
                    <button 
                      type="button" 
                      onClick={clearScanResult}
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
                      {loading ? '⏳ Recording...' : '💾 Record Scan'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Recent Scan History */}
          {scanHistory.length > 0 && (
            <div style={styles.historySection}>
              <h3 style={styles.sectionTitle}>📋 Recent Scans</h3>
              <div style={styles.historyList}>
                {scanHistory.map((scan, index) => (
                  <div key={index} style={styles.historyItem}>
                    <div style={styles.historyInfo}>
                      <span style={styles.objectId}>{scan.objectId.slice(0, 12)}...</span>
                      <span style={styles.timestamp}>{scan.timestamp}</span>
                    </div>
                    <span style={{
                      ...styles.status,
                      ...(scan.status === 'scanned' ? styles.statusScanned : styles.statusRecorded)
                    }}>
                      {scan.status === 'scanned' ? '🔍 Scanned' : '✅ Recorded'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Help */}
          <div style={styles.helpSection}>
            <h3 style={styles.sectionTitle}>💡 How to Scan</h3>
            <div style={styles.helpSteps}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div>
                  <strong>Text File Upload:</strong> Upload .txt files containing the 18×18 grid pattern
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div>
                  <strong>Image Upload:</strong> Upload PNG images of QR codes
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div>
                  <strong>Camera Scan:</strong> Use your device camera to scan QR codes in real-time
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>4</div>
                <div>
                  <strong>Record Information:</strong> Fill in depot details and save the scan
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RulesManagement />
    </div>
  );
};

export default DepotDashboard;