import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('scan');
  const [recentInstallations, setRecentInstallations] = useState([]);
  const navigate = useNavigate();

  // Modern color palette
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    light: '#f8fafc',
    dark: '#1e293b',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626'
  };

  const handleInstallationChange = (e) => {
    setInstallationForm({
      ...installationForm,
      [e.target.name]: e.target.value
    });
  };

  const handleScanResult = async (objectId) => {
    try {
      setLoading(true);
      setError('');
      
      let batchDetails, history;
      try {
        batchDetails = await installationService.getBatchDetails(objectId);
        history = await installationService.getBatchHistory(objectId);
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        batchDetails = await installationService.simulateGetBatchDetails(objectId);
        history = await installationService.simulateGetBatchHistory(objectId);
      }
      
      setScanResult({ objectId, batchDetails });
      setBatchHistory(history);
      setActiveTab('results');
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
            gpsLocation: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
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
      let response;
      try {
        response = await installationService.recordInstallation({
          objectId: scanResult.objectId,
          gpsLocation: installationForm.gpsLocation,
          trackId: installationForm.trackId,
          installationNotes: installationForm.installationNotes,
          installedBy: user._id
        });
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        response = await installationService.simulateRecordInstallation({
          objectId: scanResult.objectId,
          gpsLocation: installationForm.gpsLocation,
          trackId: installationForm.trackId,
          installationNotes: installationForm.installationNotes,
          installedBy: user._id
        });
      }
      
      setSuccess('✅ Installation recorded successfully!');
      setRecentInstallations(prev => [{
        objectId: scanResult.objectId,
        batchNumber: scanResult.batchDetails.batchNumber,
        materialType: scanResult.batchDetails.materialType,
        trackId: installationForm.trackId,
        timestamp: new Date().toLocaleString(),
        gpsLocation: installationForm.gpsLocation
      }, ...prev.slice(0, 4)]);
      
      setScanResult(null);
      setBatchHistory(null);
      setInstallationForm({ gpsLocation: '', trackId: '', installationNotes: '' });
      setActiveTab('history');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to record installation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearScanResult = () => {
    setScanResult(null);
    setBatchHistory(null);
    setInstallationForm({ gpsLocation: '', trackId: '', installationNotes: '' });
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

  const successButtonStyle = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${colors.success} 0%, #34d399 100%)`,
    color: 'white',
    boxShadow: `0 4px 15px ${colors.success}40`,
    margin: '0 auto'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Installation Crew Dashboard</h1>
        <p style={subtitleStyle}>
          Welcome back, <strong style={{color: colors.primary}}>{user.name}</strong> from {user.organization}
        </p>
        <button 
          onClick={() => navigate('/analytics/installation')}
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
          📊 View Analytics
        </button>
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
            Installation History
          </button>
        </div>

        {/* Scan Tab */}
        {activeTab === 'scan' && (
          <ScanTab 
            scanning={scanning}
            scanResult={scanResult}
            error={error}
            success={success}
            loading={loading}
            onScanResult={handleScanResult}
            onStartScan={() => setScanning(true)}
            onStopScan={() => setScanning(false)}
            processTextFile={processTextFile}
            decodeGrid={decodeGrid}
            colors={colors}
          />
        )}

        {/* Results Tab */}
        {activeTab === 'results' && scanResult && batchHistory && (
          <ResultsTab 
            scanResult={scanResult}
            batchHistory={batchHistory}
            installationForm={installationForm}
            loading={loading}
            error={error}
            user={user}
            onInstallationChange={handleInstallationChange}
            onSubmitInstallation={handleSubmitInstallation}
            onClearScan={clearScanResult}
            onGetCurrentLocation={getCurrentLocation}
            colors={colors}
          />
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <HistoryTab 
            recentInstallations={recentInstallations}
            colors={colors}
          />
        )}
      </div>
    </div>
  );
};

// ----------------- Tab Components -----------------

const ScanTab = ({ scanning, scanResult, error, success, loading, onScanResult, onStartScan, onStopScan, processTextFile, decodeGrid, colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          Scan QR Code
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Scan material QR codes to record installation details and track progress
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

      {success && (
        <div style={{
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          color: colors.success,
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          textAlign: 'center',
          fontWeight: '600',
          border: `1px solid ${colors.success}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{fontSize: '1.2rem'}}>✅</span>
          {success}
        </div>
      )}

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

      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          padding: '25px',
          background: '#f8fafc',
          borderRadius: '12px',
          margin: '20px 0',
          color: colors.secondary,
          fontWeight: '600',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading batch details...
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
            Switch to <strong>Scan Results</strong> tab to view details and record installation
          </p>
        </div>
      )}
    </div>
  );
};

const ResultsTab = ({ scanResult, batchHistory, installationForm, loading, error, user, onInstallationChange, onSubmitInstallation, onClearScan, onGetCurrentLocation, colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          Installation Details
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Review batch information and record installation details
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
        <div style={{fontSize: '3.5rem', marginBottom: '20px'}}>🔧</div>
        <h2 style={{margin: '0 0 12px 0', fontSize: '2rem', fontWeight: '700'}}>
          Ready for Installation
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
          📊 Batch Information
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          <div style={statCardStyle(colors)}>
            <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Object ID</h4>
            <p style={{margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.primary, fontFamily: "'Monaco', 'Consolas', monospace"}}>
              {scanResult.objectId}
            </p>
          </div>
          <div style={statCardStyle(colors)}>
            <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Batch Number</h4>
            <p style={{margin: 0, fontSize: '1.1rem', fontWeight: '700', color: colors.primary}}>
              {scanResult.batchDetails.batchNumber}
            </p>
          </div>
          <div style={statCardStyle(colors)}>
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

      {/* Tracking History */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{color: colors.dark, marginBottom: '25px', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px'}}>
          📋 Tracking History
        </h3>
        
        <div style={timelineStyle(colors)}>
          {batchHistory.scans.map((scan, index) => (
            <TimelineItem key={index} scan={scan} colors={colors} />
          ))}
        </div>
      </div>

      {/* Installation Form */}
      <form onSubmit={onSubmitInstallation} style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <h3 style={{color: colors.dark, marginBottom: '25px', fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px'}}>
          🔧 Record Installation
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          marginBottom: '30px'
        }}>
          <div style={formGroupStyle(colors)}>
            <label style={formLabelStyle(colors)}>
              📍 GPS Location
            </label>
            <div style={locationInputGroupStyle(colors)}>
              <input
                type="text"
                name="gpsLocation"
                value={installationForm.gpsLocation}
                onChange={onInstallationChange}
                placeholder="Latitude, Longitude"
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
              <button 
                type="button" 
                onClick={onGetCurrentLocation}
                style={locationButtonStyle(colors)}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.background = colors.primary;
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'transparent';
                  e.target.style.color = colors.primary;
                }}
              >
                📍 Get Location
              </button>
            </div>
          </div>
          
          <div style={formGroupStyle(colors)}>
            <label style={formLabelStyle(colors)}>
              🛤️ Track ID
            </label>
            <input
              type="text"
              name="trackId"
              value={installationForm.trackId}
              onChange={onInstallationChange}
              placeholder="Enter track or section identifier"
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

          <div style={{...formGroupStyle(colors), gridColumn: '1 / -1'}}>
            <label style={formLabelStyle(colors)}>
              📝 Installation Notes
            </label>
            <textarea
              name="installationNotes"
              value={installationForm.installationNotes}
              onChange={onInstallationChange}
              placeholder="Add any installation notes, observations, or special instructions..."
              style={textareaStyle(colors)}
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
            style={secondaryButtonStyle(colors)}
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
              '💾 Record Installation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const HistoryTab = ({ recentInstallations, colors }) => {
  return (
    <div>
      <div style={{textAlign: 'center', marginBottom: '45px'}}>
        <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
          Installation History
        </h2>
        <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
          Recent installations recorded by your team
        </p>
      </div>

      {recentInstallations.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {recentInstallations.map((installation, index) => (
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
                    {installation.batchNumber}
                  </h3>
                  <p style={{color: colors.secondary, margin: 0, fontSize: '0.9rem', fontFamily: "'Monaco', 'Consolas', monospace"}}>
                    {installation.objectId.slice(0, 12)}...
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  background: '#d1fae5',
                  color: '#065f46'
                }}>
                  ✅ Installed
                </span>
              </div>
              
              <div style={{marginBottom: '15px'}}>
                <p style={{color: colors.secondary, margin: '5px 0', fontSize: '0.9rem'}}>
                  <strong>Material:</strong> {installation.materialType}
                </p>
                <p style={{color: colors.secondary, margin: '5px 0', fontSize: '0.9rem'}}>
                  <strong>Track ID:</strong> {installation.trackId}
                </p>
                <p style={{color: colors.secondary, margin: '5px 0', fontSize: '0.9rem'}}>
                  <strong>GPS:</strong> {installation.gpsLocation}
                </p>
              </div>
              
              <p style={{color: colors.secondary, margin: '8px 0', fontSize: '0.85rem'}}>
                📅 {installation.timestamp}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: colors.secondary
        }}>
          <div style={{fontSize: '5rem', marginBottom: '25px', opacity: 0.5}}>🔧</div>
          <h3 style={{color: colors.dark, marginBottom: '12px', fontSize: '1.5rem'}}>
            No installations yet
          </h3>
          <p style={{fontSize: '1.1rem'}}>
            Scan and record your first installation to see it here
          </p>
        </div>
      )}
    </div>
  );
};

// ----------------- Helper Components -----------------

const TimelineItem = ({ scan, colors }) => {
  const getScanIcon = (scanType) => {
    const icons = {
      'depot_receival': '🏭',
      'installation': '🔧',
      'inspection': '✅'
    };
    return icons[scanType] || '📦';
  };

  const getScanColor = (scanType) => {
    const colorsMap = {
      'depot_receival': '#f59e0b',
      'installation': '#10b981',
      'inspection': '#3b82f6'
    };
    return colorsMap[scanType] || colors.secondary;
  };

  return (
    <div style={timelineItemStyle(colors)}>
      <div style={{
        ...timelineMarkerStyle(colors),
        background: getScanColor(scan.scanType)
      }}>
        {getScanIcon(scan.scanType)}
      </div>
      <div style={timelineContentStyle(colors)}>
        <div style={timelineHeaderStyle(colors)}>
          <strong>{getScanTypeDisplay(scan.scanType)}</strong>
          <span style={timelineDateStyle(colors)}>
            {new Date(scan.timestamp).toLocaleString()}
          </span>
        </div>
        <div style={timelineDetailsStyle(colors)}>
          <span>By: {scan.scannedBy} ({scan.role})</span>
          {scan.location && <span>Location: {scan.location}</span>}
          {scan.storeArea && <span>Store Area: {scan.storeArea}</span>}
          {scan.rackNo && <span>Rack: {scan.rackNo}</span>}
        </div>
      </div>
    </div>
  );
};

// ----------------- Helper Functions -----------------

const getScanTypeDisplay = (scanType) => {
  const types = {
    'depot_receival': 'Depot Receival',
    'installation': 'Installation',
    'inspection': 'Inspection'
  };
  return types[scanType] || scanType;
};

// ----------------- Style Functions -----------------

const statCardStyle = (colors) => ({
  background: 'rgba(255, 255, 255, 0.6)',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  textAlign: 'center'
});

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

const timelineStyle = (colors) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  marginTop: '15px'
});

const timelineItemStyle = (colors) => ({
  display: 'flex',
  gap: '15px',
  alignItems: 'flex-start'
});

const timelineMarkerStyle = (colors) => ({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: '#f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  flexShrink: 0
});

const timelineContentStyle = (colors) => ({
  flex: 1,
  background: '#f8fafc',
  padding: '15px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0'
});

const timelineHeaderStyle = (colors) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
});

const timelineDateStyle = (colors) => ({
  fontSize: '0.875rem',
  color: colors.secondary
});

const timelineDetailsStyle = (colors) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '0.875rem',
  color: colors.secondary
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

const textareaStyle = (colors) => ({
  ...formInputStyle(colors),
  resize: 'vertical',
  minHeight: '100px',
  fontFamily: 'inherit'
});

const locationInputGroupStyle = (colors) => ({
  display: 'flex',
  gap: '10px'
});

const locationButtonStyle = (colors) => ({
  padding: '14px 16px',
  borderRadius: '10px',
  border: `2px solid ${colors.primary}`,
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'transparent',
  color: colors.primary,
  whiteSpace: 'nowrap'
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

export default InstallationDashboard;

<style>
  {`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}
</style>