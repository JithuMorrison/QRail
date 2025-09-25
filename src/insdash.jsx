import React, { useState } from 'react';
import QRScanner from './qscan';
import { installationService } from './insserv';

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