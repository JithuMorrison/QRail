import React, { useState } from 'react';
import QRScanner from './qscan';
import { inspectorService } from './inspserv';

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
  const [selectedImage, setSelectedImage] = useState(null);

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
        images: [...prev.images, ...files.slice(0, 3)] // Limit to 3 images
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
        images: inspectionForm.images // In real app, you'd upload these to a server
      });
      
      setSuccess('Inspection recorded successfully!');
      setScanResult(null);
      setBatchHistory(null);
      setInspectionForm({
        status: 'approved',
        notes: '',
        damages: '',
        correctiveActions: '',
        images: []
      });
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to record inspection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: '#28a745',
      rejected: '#dc3545',
      pending: '#ffc107',
      'needs-repair': '#fd7e14'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="dashboard-container">
      <h1>Inspector Dashboard</h1>
      <p>Welcome, {user.name} ({user.organization})</p>

      <div className="scanner-section">
        <h2>QR Code Scanner</h2>
        
        <QRScanner 
          scanning={scanning}
          onScanResult={handleScanResult}
          onStartScan={() => setScanning(true)}
          onStopScan={() => setScanning(false)}
          processTextFile={processTextFile}
          decodeGrid={decodeGrid}
        />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            Loading batch history...
          </div>
        )}

        {scanResult && batchHistory && (
          <div className="scan-result">
            <div className="result-header">
              <h3>🔍 Inspection Panel</h3>
              <button 
                onClick={() => {
                  setScanResult(null);
                  setBatchHistory(null);
                }}
                className="btn-secondary"
              >
                New Inspection
              </button>
            </div>

            {/* Batch Summary */}
            <div className="batch-summary-card">
              <h4>Batch Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <label>ObjectId:</label>
                  <span className="monospace">{scanResult.objectId}</span>
                </div>
                <div className="summary-item">
                  <label>Batch:</label>
                  <span>{scanResult.batchDetails.batchNumber}</span>
                </div>
                <div className="summary-item">
                  <label>Material:</label>
                  <span>{scanResult.batchDetails.materialType}</span>
                </div>
                <div className="summary-item">
                  <label>Vendor:</label>
                  <span>{scanResult.batchDetails.vendorName}</span>
                </div>
              </div>
            </div>

            {/* Complete History Timeline */}
            <div className="full-history-section">
              <h4>📊 Complete History Timeline</h4>
              <div className="history-timeline">
                {batchHistory.scans.map((scan, index) => (
                  <div key={index} className="history-item">
                    <div className="history-icon">
                      {scan.scanType === 'depot_receival' ? '🏭' : 
                       scan.scanType === 'installation' ? '🔧' : 
                       scan.scanType === 'inspection' ? '🔍' : '📦'}
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <strong>{getScanTypeDisplay(scan.scanType)}</strong>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: scan.status ? getStatusColor(scan.status) : '#6c757d' 
                          }}
                        >
                          {scan.status || 'completed'}
                        </span>
                      </div>
                      <div className="history-meta">
                        <span>{new Date(scan.timestamp).toLocaleString()}</span>
                        <span>By: {scan.scannedBy}</span>
                      </div>
                      {scan.notes && (
                        <div className="history-notes">
                          <strong>Notes:</strong> {scan.notes}
                        </div>
                      )}
                      {scan.damages && (
                        <div className="history-damages">
                          <strong>Damages:</strong> {scan.damages}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection Form */}
            <form onSubmit={handleSubmitInspection} className="inspection-form">
              <h4>✅ New Inspection</h4>
              
              <div className="form-group">
                <label>Inspection Status:</label>
                <select 
                  name="status" 
                  value={inspectionForm.status}
                  onChange={handleInspectionChange}
                  style={{ borderLeft: `4px solid ${getStatusColor(inspectionForm.status)}` }}
                >
                  <option value="approved">Approved ✅</option>
                  <option value="pending">Pending ⏳</option>
                  <option value="needs-repair">Needs Repair 🔧</option>
                  <option value="rejected">Rejected ❌</option>
                </select>
              </div>

              <div className="form-group">
                <label>Inspection Notes:</label>
                <textarea
                  name="notes"
                  value={inspectionForm.notes}
                  onChange={handleInspectionChange}
                  placeholder="General inspection observations and comments..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Damages Found (if any):</label>
                <textarea
                  name="damages"
                  value={inspectionForm.damages}
                  onChange={handleInspectionChange}
                  placeholder="Describe any damages, defects, or issues found..."
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Corrective Actions Taken:</label>
                <textarea
                  name="correctiveActions"
                  value={inspectionForm.correctiveActions}
                  onChange={handleInspectionChange}
                  placeholder="Describe corrective actions taken or recommended..."
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Upload Images (Max 3):</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={inspectionForm.images.length >= 3}
                  />
                  <div className="image-preview-grid">
                    {inspectionForm.images.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img src={URL.createObjectURL(image)} alt={`Inspection ${index + 1}`} />
                        <button 
                          type="button" 
                          onClick={() => removeImage(index)}
                          className="remove-image-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
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
                  {loading ? 'Recording...' : 'Record Inspection'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Inspection Statistics */}
      <div className="stats-section">
        <h2>Inspection Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card approved">
            <h3>Approved</h3>
            <span className="stat-number">0</span>
          </div>
          <div className="stat-card pending">
            <h3>Pending</h3>
            <span className="stat-number">0</span>
          </div>
          <div className="stat-card needs-repair">
            <h3>Needs Repair</h3>
            <span className="stat-number">0</span>
          </div>
          <div className="stat-card rejected">
            <h3>Rejected</h3>
            <span className="stat-number">0</span>
          </div>
        </div>
      </div>
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