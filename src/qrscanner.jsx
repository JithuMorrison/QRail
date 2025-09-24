import React, { useState, useRef } from 'react';
import { processTextFile, decodeGrid } from './qrcode';

const QRScanner = ({ user, onScan }) => {
  const [scanMethod, setScanMethod] = useState('camera');
  const [scanResult, setScanResult] = useState(null);
  const [scanData, setScanData] = useState({});
  const fileInputRef = useRef();
  const textFileInputRef = useRef();

  const handleTextFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const grid = processTextFile(e.target.result);
        const productId = decodeGrid(grid, 24);
        setScanResult({ productId, method: 'text file' });
      } catch (error) {
        alert(`Error processing file: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleScanSubmit = async () => {
    if (!scanResult) {
      alert('Please scan a QR code first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: scanResult.productId,
          scanData: getScanDataByRole()
        })
      });

      const data = await response.json();
      if (response.ok) {
        onScan(data);
        alert('Scan recorded successfully!');
        setScanResult(null);
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Error recording scan');
    }
  };

  const getScanDataByRole = () => {
    const baseData = {
      currentLocation: scanData.location || '',
      scanTimestamp: new Date().toISOString()
    };

    switch (user.role) {
      case 'depot':
        return {
          ...baseData,
          depotId: scanData.depotId || '',
          storeArea: scanData.storeArea || '',
          rackNumber: scanData.rackNumber || ''
        };
      case 'installation':
        return {
          ...baseData,
          gpsLocation: scanData.gpsLocation || {},
          installationDetails: scanData.installationDetails || {}
        };
      case 'inspector':
        return {
          ...baseData,
          inspectionDetails: scanData.inspectionDetails || {}
        };
      default:
        return baseData;
    }
  };

  const renderRoleSpecificFields = () => {
    switch (user.role) {
      case 'depot':
        return (
          <div className="scan-fields">
            <input
              type="text"
              placeholder="Depot ID"
              value={scanData.depotId || ''}
              onChange={(e) => setScanData({...scanData, depotId: e.target.value})}
            />
            <input
              type="text"
              placeholder="Store Area"
              value={scanData.storeArea || ''}
              onChange={(e) => setScanData({...scanData, storeArea: e.target.value})}
            />
            <input
              type="text"
              placeholder="Rack Number"
              value={scanData.rackNumber || ''}
              onChange={(e) => setScanData({...scanData, rackNumber: e.target.value})}
            />
          </div>
        );
      case 'installation':
        return (
          <div className="scan-fields">
            <input
              type="text"
              placeholder="Latitude"
              value={scanData.gpsLocation?.latitude || ''}
              onChange={(e) => setScanData({
                ...scanData, 
                gpsLocation: {...scanData.gpsLocation, latitude: e.target.value}
              })}
            />
            <input
              type="text"
              placeholder="Longitude"
              value={scanData.gpsLocation?.longitude || ''}
              onChange={(e) => setScanData({
                ...scanData,
                gpsLocation: {...scanData.gpsLocation, longitude: e.target.value}
              })}
            />
            <textarea
              placeholder="Installation Details"
              value={scanData.installationDetails?.notes || ''}
              onChange={(e) => setScanData({
                ...scanData,
                installationDetails: {notes: e.target.value}
              })}
            />
          </div>
        );
      case 'inspector':
        return (
          <div className="scan-fields">
            <select
              value={scanData.inspectionDetails?.status || ''}
              onChange={(e) => setScanData({
                ...scanData,
                inspectionDetails: {...scanData.inspectionDetails, status: e.target.value}
              })}
            >
              <option value="">Select Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="needs_review">Needs Review</option>
            </select>
            <textarea
              placeholder="Inspection Notes"
              value={scanData.inspectionDetails?.notes || ''}
              onChange={(e) => setScanData({
                ...scanData,
                inspectionDetails: {...scanData.inspectionDetails, notes: e.target.value}
              })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="qr-scanner">
      <h3>QR Code Scanner - {user.role.toUpperCase()}</h3>
      
      <div className="scan-methods">
        <button 
          className={scanMethod === 'camera' ? 'active' : ''}
          onClick={() => setScanMethod('camera')}
        >
          Camera Scan
        </button>
        <button 
          className={scanMethod === 'text' ? 'active' : ''}
          onClick={() => setScanMethod('text')}
        >
          Upload Text File
        </button>
      </div>

      {scanMethod === 'text' && (
        <div className="text-upload">
          <input
            type="file"
            accept=".txt"
            ref={textFileInputRef}
            onChange={handleTextFileUpload}
          />
          <p>Upload a .txt file containing the QR grid pattern</p>
        </div>
      )}

      {scanMethod === 'camera' && (
        <div className="camera-scan">
          <div className="camera-placeholder">
            <p>Camera feed would be displayed here</p>
            <button onClick={() => setScanResult({ productId: '507f1f77bcf86cd799439011', method: 'camera' })}>
              Simulate Camera Scan
            </button>
          </div>
        </div>
      )}

      {scanResult && (
        <div className="scan-result">
          <h4>Scan Result</h4>
          <p><strong>Product ID:</strong> {scanResult.productId}</p>
          <p><strong>Method:</strong> {scanResult.method}</p>
          
          {renderRoleSpecificFields()}
          
          <button onClick={handleScanSubmit} className="submit-scan">
            Submit Scan Data
          </button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;