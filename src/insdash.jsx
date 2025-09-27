import React, { useState } from 'react';
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

  return (
    <div className="dashboard-container">
      <h1>Installation Crew Dashboard</h1>
      <p>Welcome, {user.name} ({user.organization})</p>

      <div className="scanner-section">
        <h2>QR Code Scanner</h2>
        
        <QRScanner 
          scanning={scanning}
          onScanResult={handleScanResult}
          onStartScan={() => setScanning(true)}
          onStopScan={() => setScanning(false)}
          processTextFile = {processTextFile}
          decodeGrid = {decodeGrid}
        />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            Loading batch details...
          </div>
        )}

        {scanResult && batchHistory && (
          <div className="scan-result">
            <div className="result-header">
              <h3>📦 Installation Details</h3>
              <button 
                onClick={() => {
                  setScanResult(null);
                  setBatchHistory(null);
                }}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>

            <div className="batch-details-card">
              <h4>Batch Information</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <label>ObjectId:</label>
                  <span className="monospace">{scanResult.objectId}</span>
                </div>
                <div className="detail-item">
                  <label>Batch Number:</label>
                  <span>{scanResult.batchDetails.batchNumber}</span>
                </div>
                <div className="detail-item">
                  <label>Material:</label>
                  <span>{scanResult.batchDetails.materialType}</span>
                </div>
                <div className="detail-item">
                  <label>Vendor:</label>
                  <span>{scanResult.batchDetails.vendorName}</span>
                </div>
              </div>
            </div>

            {/* Installation History */}
            <div className="history-section">
              <h4>📋 Tracking History</h4>
              <div className="timeline">
                {batchHistory.scans.map((scan, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-marker">
                      {scan.scanType === 'depot_receival' ? '🏭' : 
                       scan.scanType === 'installation' ? '🔧' : '📦'}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <strong>{getScanTypeDisplay(scan.scanType)}</strong>
                        <span className="timeline-date">
                          {new Date(scan.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="timeline-details">
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
            <form onSubmit={handleSubmitInstallation} className="installation-form">
              <h4>🔧 Record Installation</h4>
              
              <div className="form-group">
                <label>GPS Location:</label>
                <div className="location-input-group">
                  <input
                    type="text"
                    name="gpsLocation"
                    value={installationForm.gpsLocation}
                    onChange={handleInstallationChange}
                    placeholder="Latitude, Longitude"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={getCurrentLocation}
                    className="btn-secondary"
                  >
                    Get Current Location
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Track ID:</label>
                <input
                  type="text"
                  name="trackId"
                  value={installationForm.trackId}
                  onChange={handleInstallationChange}
                  placeholder="Enter track or section identifier"
                  required
                />
              </div>

              <div className="form-group">
                <label>Installation Notes:</label>
                <textarea
                  name="installationNotes"
                  value={installationForm.installationNotes}
                  onChange={handleInstallationChange}
                  placeholder="Add any installation notes, observations, or special instructions..."
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setScanResult(null);
                    setBatchHistory(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Recording...' : 'Record Installation'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Recent Installations */}
      <div className="recent-installations">
        <h2>Recent Installations</h2>
        <div className="placeholder-message">
          <p>Your recent installations will appear here after scanning and recording.</p>
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