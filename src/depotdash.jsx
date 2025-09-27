import React, { useState, useRef } from 'react';
import { depotService } from './depotserv';
import QRScanner from './qscan';

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

  return (
    <div className="dashboard-container">
      <h1>Depot Staff Dashboard</h1>
      <div className="dashboard-header">
        <p>Welcome, {user.name} ({user.organization})</p>
        <div className="scan-stats">
          <span>Recent Scans: {scanHistory.length}</span>
        </div>
      </div>

      <div className="scanner-section">
        <h2>🔍 QR Code Scanner</h2>
        <div className="scanner-info">
          <p>Scan QR codes from materials to record depot information</p>
        </div>
        
        <QRScanner 
          scanning={scanning}
          onScanResult={handleScanResult}
          onStartScan={() => setScanning(true)}
          onStopScan={() => setScanning(false)}
          processTextFile = {processTextFile}
          decodeGrid = {decodeGrid}
        />

        {error && (
          <div className="error-message">
            ❌ {error}
            <button onClick={clearScanResult} className="btn-secondary" style={{marginLeft: '10px'}}>
              Clear
            </button>
          </div>
        )}

        {scanResult && (
          <div className="scan-result">
            <div className="result-header">
              <h3>✅ Scan Successful!</h3>
              <button onClick={clearScanResult} className="btn-secondary">
                New Scan
              </button>
            </div>
            
            <div className="batch-details-card">
              <h4>📦 Batch Information</h4>
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
                  <label>Material Type:</label>
                  <span>{scanResult.batchDetails.materialType}</span>
                </div>
                <div className="detail-item">
                  <label>Vendor:</label>
                  <span>{scanResult.batchDetails.vendorName}</span>
                </div>
                <div className="detail-item">
                  <label>Created Date:</label>
                  <span>{new Date(scanResult.batchDetails.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <label>Warranty:</label>
                  <span>{scanResult.batchDetails.warranty} months</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitScan} className="depot-form">
              <h4>🏭 Depot Storage Information</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>📍 Location:</label>
                  <input
                    type="text"
                    name="location"
                    value={depotForm.location}
                    onChange={handleDepotChange}
                    placeholder="e.g., Main Warehouse, Building A"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>📦 Store Area:</label>
                  <input
                    type="text"
                    name="storeArea"
                    value={depotForm.storeArea}
                    onChange={handleDepotChange}
                    placeholder="e.g., Section 3, Cold Storage"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>🔢 Rack Number:</label>
                  <input
                    type="text"
                    name="rackNo"
                    value={depotForm.rackNo}
                    onChange={handleDepotChange}
                    placeholder="e.g., Rack 12-B, Shelf 3"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>👤 Staff ID:</label>
                  <input
                    type="text"
                    value={user._id}
                    disabled
                    className="disabled-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={clearScanResult}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? '⏳ Recording...' : '💾 Record Scan'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Recent Scan History */}
      {scanHistory.length > 0 && (
        <div className="scan-history">
          <h3>📋 Recent Scans</h3>
          <div className="history-list">
            {scanHistory.map((scan, index) => (
              <div key={index} className="history-item">
                <div className="history-info">
                  <span className="object-id">{scan.objectId.slice(0, 12)}...</span>
                  <span className="timestamp">{scan.timestamp}</span>
                </div>
                <span className={`status ${scan.status}`}>
                  {scan.status === 'scanned' ? '🔍 Scanned' : '✅ Recorded'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Help */}
      <div className="help-section">
        <h3>💡 How to Scan</h3>
        <div className="help-steps">
          <div className="step">
            <strong>1. Text File Upload:</strong> Upload .txt files containing the 18×18 grid pattern
          </div>
          <div className="step">
            <strong>2. Image Upload:</strong> Upload PNG images of QR codes
          </div>
          <div className="step">
            <strong>3. Camera Scan:</strong> Use your device camera to scan QR codes in real-time
          </div>
          <div className="step">
            <strong>4. Record Information:</strong> Fill in depot details and save the scan
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotDashboard;