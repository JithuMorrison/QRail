import React, { useState, useRef } from 'react';
import { depotService } from './depotserv';
import QRScanner from './qscan';
import { useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('scan');
  const navigate = useNavigate();

  // Modern color palette
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    light: '#f8fafc',
    dark: '#1e293b',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #5a6fd8 0%, #6a4196 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626'
  };

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
      
      try {
        batchDetails = await depotService.getBatchDetails(objectId);
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        batchDetails = await depotService.simulateGetBatchDetails(objectId);
      }
      
      setScanResult({ objectId, batchDetails });
      setActiveTab('results');
      
      setScanHistory(prev => [{
        objectId,
        timestamp: new Date().toLocaleString(),
        status: 'scanned',
        batchDetails
      }, ...prev.slice(0, 9)]);
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
      
      setScanHistory(prev => prev.map(scan => 
        scan.objectId === scanResult.objectId 
          ? { ...scan, status: 'recorded', recordedAt: new Date().toLocaleString() }
          : scan
      ));
      
      setScanResult(null);
      setDepotForm({ location: '', storeArea: '', rackNo: '' });
      setError('');
      setActiveTab('history');
      
    } catch (error) {
      setError('Failed to record scan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearScanResult = () => {
    setScanResult(null);
    setError('');
    setActiveTab('scan');
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    padding: '30px 20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

  const headerStyle = {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
    letterSpacing: '-0.02em'
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    color: colors.secondary,
    marginBottom: '30px',
    fontWeight: '400'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '40px',
    background: 'rgba(0, 0, 0, 0.02)',
    padding: '8px',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.05)'
  };

  const tabStyle = (isActive) => ({
    padding: '14px 28px',
    borderRadius: '12px',
    border: 'none',
    background: isActive ? colors.gradient : 'transparent',
    color: isActive ? 'white' : colors.secondary,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '0.95rem',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  });

  const buttonStyle = {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    letterSpacing: '0.5px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: colors.gradient,
    color: 'white',
    boxShadow: `0 4px 15px ${colors.primary}40`
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`
  };

  const successButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${colors.success} 0%, #34d399 100%)`,
    color: 'white',
    boxShadow: `0 4px 15px ${colors.success}40`
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Depot Staff Dashboard</h1>
        <p style={subtitleStyle}>
          Welcome back, <strong style={{color: colors.primary}}>{user.name}</strong> from {user.organization}
        </p>
        <div style={{display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap'}}>
          <button 
            onClick={() => navigate('/rules')}
            style={successButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 8px 25px ${colors.success}60`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${colors.success}40`;
            }}
          >
            📋 Update Rules
          </button>
          <button 
            onClick={() => navigate('/analytics/depot')}
            style={primaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 8px 25px ${colors.primary}60`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
            }}
          >
            📊 View Analytics
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        {/* Tab Navigation */}
        <div style={tabContainerStyle}>
          <button 
            style={tabStyle(activeTab === 'scan')}
            onClick={() => setActiveTab('scan')}
          >
            <span>🔍</span>
            Scan QR Code
          </button>
          <button 
            style={tabStyle(activeTab === 'results')}
            onClick={() => scanResult && setActiveTab('results')}
            disabled={!scanResult}
          >
            <span>📦</span>
            Scan Results
          </button>
          <button 
            style={tabStyle(activeTab === 'history')}
            onClick={() => setActiveTab('history')}
          >
            <span>📚</span>
            Scan History
          </button>
          <button 
            style={tabStyle(activeTab === 'help')}
            onClick={() => setActiveTab('help')}
          >
            <span>💡</span>
            How to Scan
          </button>
        </div>

        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <ScanTab 
            scanning={scanning}
            scanResult={scanResult}
            error={error}
            onScanResult={handleScanResult}
            onStartScan={() => setScanning(true)}
            onStopScan={() => setScanning(false)}
            processTextFile={processTextFile}
            decodeGrid={decodeGrid}
            colors={colors}
          />
        )}

        {/* Results Tab */}
        {activeTab === 'results' && scanResult && (
          <ResultsTab 
            scanResult={scanResult}
            depotForm={depotForm}
            loading={loading}
            error={error}
            user={user}
            onDepotChange={handleDepotChange}
            onSubmitScan={handleSubmitScan}
            onClearScan={clearScanResult}
            colors={colors}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryTab 
            scanHistory={scanHistory}
            colors={colors}
          />
        )}

        {/* Help Tab */}
        {activeTab === 'help' && (
          <HelpTab colors={colors} />
        )}
      </div>
    </div>
  );
};

// ----------------- Tab Components -----------------

const ScanTab = ({ scanning, scanResult, error, onScanResult, onStartScan, onStopScan, processTextFile, decodeGrid, colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          Scan QR Code
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Scan material QR codes using text files, images, or camera to record depot information
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <QRScanner 
          scanning={scanning}
          onScanResult={onScanResult}
          onStartScan={onStartScan}
          onStopScan={onStopScan}
          processTextFile={processTextFile}
          decodeGrid={decodeGrid}
        />
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          color: colors.error,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          textAlign: 'center',
          fontWeight: '600',
          border: `1px solid ${colors.error}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{fontSize: '1.2rem'}}>⚠️</span>
          {error}
        </div>
      )}

      {scanResult && (
        <div style={{
          background: `linear-gradient(135deg, ${colors.success}15 0%, #34d39915 100%)`,
          padding: '25px',
          borderRadius: '16px',
          border: `2px solid ${colors.success}30`,
          textAlign: 'center'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '15px'}}>✅</div>
          <h3 style={{color: colors.success, marginBottom: '10px'}}>Scan Successful!</h3>
          <p style={{color: colors.secondary, margin: 0}}>
            Object ID: <strong>{scanResult.objectId}</strong>
          </p>
          <p style={{color: colors.secondary, margin: '5px 0 0 0'}}>
            Switch to <strong>Scan Results</strong> tab to view details and record information
          </p>
        </div>
      )}
    </div>
  );
};

const ResultsTab = ({ scanResult, depotForm, loading, error, user, onDepotChange, onSubmitScan, onClearScan, colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          Scan Results
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Review batch details and record depot storage information
        </p>
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          color: colors.error,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          textAlign: 'center',
          fontWeight: '600',
          border: `1px solid ${colors.error}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{fontSize: '1.2rem'}}>⚠️</span>
          {error}
        </div>
      )}

      <div style={{
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        color: 'white',
        padding: '35px',
        borderRadius: '20px',
        textAlign: 'center',
        marginBottom: '35px',
        boxShadow: `0 10px 30px ${colors.primary}30`
      }}>
        <div style={{fontSize: '3.5rem', marginBottom: '20px'}}>✅</div>
        <h2 style={{margin: '0 0 12px 0', fontSize: '2rem', fontWeight: '700'}}>
          QR Code Scanned Successfully!
        </h2>
        <p style={{margin: 0, opacity: 0.9, fontSize: '1.1rem'}}>
          Object ID: <strong>{scanResult.objectId}</strong>
        </p>
      </div>

      {/* Batch Details */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{color: colors.dark, marginBottom: '25px', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px'}}>
          📦 Batch Information
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Object ID</h4>
            <p style={{margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.primary, fontFamily: "'Monaco', 'Consolas', monospace"}}>
              {scanResult.objectId}
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Batch Number</h4>
            <p style={{margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.primary}}>
              {scanResult.batchDetails.batchNumber}
            </p>
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.6)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.1)'
          }}>
            <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Material Type</h4>
            <p style={{margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.primary}}>
              {scanResult.batchDetails.materialType}
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          <div style={detailItemStyle(colors)}>
            <span style={detailLabelStyle(colors)}>Vendor</span>
            <span style={detailValueStyle(colors)}>{scanResult.batchDetails.vendorName}</span>
          </div>
          <div style={detailItemStyle(colors)}>
            <span style={detailLabelStyle(colors)}>Created Date</span>
            <span style={detailValueStyle(colors)}>
              {new Date(scanResult.batchDetails.createdDate).toLocaleDateString()}
            </span>
          </div>
          <div style={detailItemStyle(colors)}>
            <span style={detailLabelStyle(colors)}>Warranty Period</span>
            <span style={detailValueStyle(colors)}>{scanResult.batchDetails.warranty} months</span>
          </div>
          <div style={detailItemStyle(colors)}>
            <span style={detailLabelStyle(colors)}>Fitting Type</span>
            <span style={detailValueStyle(colors)}>{scanResult.batchDetails.fittingType}</span>
          </div>
        </div>
      </div>

      {/* Depot Form */}
      <form onSubmit={onSubmitScan} style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{color: colors.dark, marginBottom: '25px', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px'}}>
          🏭 Depot Storage Information
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          <div style={formGroupStyle(colors)}>
            <label style={formLabelStyle(colors)}>
              📍 Location
            </label>
            <input
              type="text"
              name="location"
              value={depotForm.location}
              onChange={onDepotChange}
              placeholder="e.g., Main Warehouse, Building A"
              required
              style={formInputStyle(colors)}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={formGroupStyle(colors)}>
            <label style={formLabelStyle(colors)}>
              📦 Store Area
            </label>
            <input
              type="text"
              name="storeArea"
              value={depotForm.storeArea}
              onChange={onDepotChange}
              placeholder="e.g., Section 3, Cold Storage"
              required
              style={formInputStyle(colors)}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={formGroupStyle(colors)}>
            <label style={formLabelStyle(colors)}>
              🔢 Rack Number
            </label>
            <input
              type="text"
              name="rackNo"
              value={depotForm.rackNo}
              onChange={onDepotChange}
              placeholder="e.g., Rack 12-B, Shelf 3"
              required
              style={formInputStyle(colors)}
              onFocus={(e) => {
                e.target.style.borderColor = colors.primary;
                e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div style={formGroupStyle(colors)}>
            <label style={formLabelStyle(colors)}>
              👤 Staff ID
            </label>
            <input
              type="text"
              value={user._id}
              disabled
              style={disabledInputStyle(colors)}
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'flex-end',
          marginTop: '30px'
        }}>
          <button 
            type="button" 
            onClick={onClearScan}
            style={{
              ...secondaryButtonStyle(colors),
              padding: '14px 28px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.background = colors.primary;
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'transparent';
              e.target.style.color = colors.primary;
            }}
          >
            🔄 New Scan
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...primaryButtonStyle(colors),
              padding: '14px 28px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite'
                }}>🔄</span>
                Recording...
              </>
            ) : (
              '💾 Record Scan'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const HistoryTab = ({ scanHistory, colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          Scan History
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Recent QR code scans and their status
        </p>
      </div>

      {scanHistory.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {scanHistory.map((scan, index) => (
            <div 
              key={index} 
              style={{
                background: 'white',
                padding: '25px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <div>
                  <h3 style={{color: colors.dark, margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '600'}}>
                    {scan.batchDetails?.batchNumber || 'Unknown Batch'}
                  </h3>
                  <p style={{color: colors.secondary, margin: 0, fontSize: '0.9rem', fontFamily: "'Monaco', 'Consolas', monospace"}}>
                    {scan.objectId.slice(0, 12)}...
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: scan.status === 'scanned' ? '#fef3c7' : '#d1fae5',
                  color: scan.status === 'scanned' ? '#d97706' : '#065f46'
                }}>
                  {scan.status === 'scanned' ? '🔍 Scanned' : '✅ Recorded'}
                </span>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <p style={{color: colors.secondary, margin: '5px 0', fontSize: '0.9rem'}}>
                  <strong>Material:</strong> {scan.batchDetails?.materialType || 'N/A'}
                </p>
                <p style={{color: colors.secondary, margin: '5px 0', fontSize: '0.9rem'}}>
                  <strong>Scanned:</strong> {scan.timestamp}
                </p>
                {scan.recordedAt && (
                  <p style={{color: colors.secondary, margin: '5px 0', fontSize: '0.9rem'}}>
                    <strong>Recorded:</strong> {scan.recordedAt}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: colors.secondary
        }}>
          <div style={{fontSize: '5rem', marginBottom: '25px', opacity: 0.5}}>📋</div>
          <h3 style={{color: colors.dark, marginBottom: '12px', fontSize: '1.5rem'}}>
            No scan history yet
          </h3>
          <p style={{fontSize: '1.1rem'}}>
            Scan your first QR code to see it here
          </p>
        </div>
      )}
    </div>
  );
};

const HelpTab = ({ colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          How to Scan QR Codes
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Learn how to scan QR codes using different methods
        </p>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${colors.warning}15 0%, #fbbf2415 100%)`,
        borderRadius: '16px',
        padding: '35px',
        border: `1px solid ${colors.warning}30`
      }}>
        <div style={helpStepsStyle(colors)}>
          {[
            { icon: '📄', title: 'Text File Upload', desc: 'Upload .txt files containing the 18×18 grid pattern of forward and back slashes' },
            { icon: '🖼️', title: 'Image Upload', desc: 'Upload PNG images of QR codes for automatic pattern recognition' },
            { icon: '📷', title: 'Camera Scan', desc: 'Use your device camera to scan QR codes in real-time' },
            { icon: '💾', title: 'Record Information', desc: 'Fill in depot storage details and save the scan record' }
          ].map((step, index) => (
            <div key={index} style={stepStyle(colors)}>
              <div style={stepNumberStyle(colors)}>{index + 1}</div>
              <div style={stepContentStyle(colors)}>
                <div style={{fontSize: '2rem', marginBottom: '10px'}}>{step.icon}</div>
                <h4 style={{color: colors.dark, margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '600'}}>
                  {step.title}
                </h4>
                <p style={{color: colors.secondary, margin: 0, lineHeight: '1.5'}}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ----------------- Helper Style Functions -----------------

const detailItemStyle = (colors) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '15px',
  background: 'rgba(255, 255, 255, 0.6)',
  borderRadius: '10px',
  border: '1px solid rgba(0, 0, 0, 0.1)'
});

const detailLabelStyle = (colors) => ({
  fontSize: '0.875rem',
  color: colors.secondary,
  fontWeight: '500'
});

const detailValueStyle = (colors) => ({
  fontSize: '1rem',
  color: colors.dark,
  fontWeight: '600'
});

const formGroupStyle = (colors) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
});

const formLabelStyle = (colors) => ({
  fontSize: '0.95rem',
  color: colors.dark,
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
});

const formInputStyle = (colors) => ({
  padding: '14px 16px',
  border: `2px solid #e2e8f0`,
  borderRadius: '10px',
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontWeight: '500',
  color: colors.dark,
  outline: 'none'
});

const disabledInputStyle = (colors) => ({
  padding: '14px 16px',
  border: `2px solid #e2e8f0`,
  borderRadius: '10px',
  fontSize: '1rem',
  background: '#f8fafc',
  color: colors.secondary,
  fontWeight: '500'
});

const primaryButtonStyle = (colors) => ({
  padding: '12px 24px',
  borderRadius: '10px',
  border: 'none',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  letterSpacing: '0.5px',
  background: colors.gradient,
  color: 'white',
  boxShadow: `0 4px 15px ${colors.primary}40`
});

const secondaryButtonStyle = (colors) => ({
  padding: '12px 24px',
  borderRadius: '10px',
  border: `2px solid ${colors.primary}`,
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  letterSpacing: '0.5px',
  background: 'transparent',
  color: colors.primary
});

const helpStepsStyle = (colors) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '25px'
});

const stepStyle = (colors) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '15px',
  padding: '25px',
  background: 'rgba(255, 255, 255, 0.9)',
  borderRadius: '12px',
  transition: 'all 0.3s ease'
});

const stepNumberStyle = (colors) => ({
  background: colors.primary,
  color: 'white',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1rem',
  fontWeight: '600',
  flexShrink: 0
});

const stepContentStyle = (colors) => ({
  flex: 1,
  textAlign: 'center'
});

export default DepotDashboard;

<style>
  {`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
</style>