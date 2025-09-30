import React, { useState } from 'react';
import { Package, MapPin, Wrench, Calendar, User, Building2, CheckCircle, XCircle, Loader2, Navigation, FileText, History } from 'lucide-react';
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
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to record installation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getScanTypeDisplay = (scanType) => {
    const types = {
      'depot_receival': 'Depot Receival',
      'installation': 'Installation',
      'inspection': 'Inspection'
    };
    return types[scanType] || scanType;
  };

  const getScanIcon = (scanType) => {
    switch(scanType) {
      case 'depot_receival': return <Building2 className="w-5 h-5" />;
      case 'installation': return <Wrench className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#b35100]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Wrench className="w-8 h-8 text-[#b35100]" />
                Installation Crew Dashboard
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                {/* <span>Welcome, <strong>{user.name}</strong></span> */}
                <span className="text-gray-400">|</span>
                <Building2 className="w-4 h-4" />
                {/* <span>{user.organization}</span> */}
              </div>
            </div>
          </div>
        </div>

        {/* Scanner Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#f2d8b1] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-[#b35100]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">QR Code Scanner</h2>
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
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          )}

          {loading && (
            <div className="mt-8 flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-[#b35100] animate-spin" />
                <span className="text-gray-600 font-medium">Loading batch details...</span>
              </div>
            </div>
          )}

          {scanResult && batchHistory && (
            <div className="mt-8 space-y-6">
              {/* Header with Clear Button */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#f2d8b1]">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-[#b35100]" />
                  Installation Details
                </h3>
                <button 
                  onClick={() => {
                    setScanResult(null);
                    setBatchHistory(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Clear
                </button>
              </div>

              {/* Batch Information Card */}
              <div className="bg-gradient-to-br from-[#f2d8b1] to-amber-100 rounded-xl p-6 shadow-md border border-[#b35100]/20">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#b35100]" />
                  Batch Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">ObjectId</label>
                    <span className="font-mono text-sm text-gray-900 font-semibold">{scanResult.objectId}</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Batch Number</label>
                    <span className="text-gray-900 font-semibold">{scanResult.batchDetails.batchNumber}</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Material</label>
                    <span className="text-gray-900 font-semibold">{scanResult.batchDetails.materialType}</span>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Vendor</label>
                    <span className="text-gray-900 font-semibold">{scanResult.batchDetails.vendorName}</span>
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#b35100]" />
                  Tracking History
                </h4>
                <div className="space-y-1">
                  {batchHistory.scans.map((scan, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#f2d8b1] text-[#b35100] border-2 border-[#b35100]">
                          {getScanIcon(scan.scanType)}
                        </div>
                        {index < batchHistory.scans.length - 1 && (
                          <div className="w-0.5 flex-1 bg-[#f2d8b1] my-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200">
                          <div className="flex items-start justify-between mb-3">
                            <strong className="text-gray-900 font-semibold">{getScanTypeDisplay(scan.scanType)}</strong>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(scan.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-700">
                              <User className="w-4 h-4 text-[#b35100]" />
                              <span><strong>By:</strong> {scan.scannedBy} ({scan.role})</span>
                            </div>
                            {scan.location && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <MapPin className="w-4 h-4 text-[#b35100]" />
                                <span><strong>Location:</strong> {scan.location}</span>
                              </div>
                            )}
                            {scan.storeArea && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Building2 className="w-4 h-4 text-[#b35100]" />
                                <span><strong>Store Area:</strong> {scan.storeArea}</span>
                              </div>
                            )}
                            {scan.rackNo && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <Package className="w-4 h-4 text-[#b35100]" />
                                <span><strong>Rack:</strong> {scan.rackNo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Installation Form */}
              <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border-2 border-[#b35100] p-6 shadow-lg">
                <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#b35100]" />
                  Record Installation
                </h4>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#b35100]" />
                      GPS Location
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="gpsLocation"
                        value={installationForm.gpsLocation}
                        onChange={handleInstallationChange}
                        placeholder="Latitude, Longitude"
                        required
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b35100] focus:border-[#b35100] transition-all duration-200"
                      />
                      <button 
                        type="button" 
                        onClick={getCurrentLocation}
                        className="px-4 py-3 bg-[#f2d8b1] text-[#b35100] rounded-lg hover:bg-[#b35100] hover:text-white transition-all duration-200 whitespace-nowrap font-medium flex items-center gap-2 border-2 border-[#b35100]"
                      >
                        <Navigation className="w-4 h-4" />
                        Get Location
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#b35100]" />
                      Track ID
                    </label>
                    <input
                      type="text"
                      name="trackId"
                      value={installationForm.trackId}
                      onChange={handleInstallationChange}
                      placeholder="Enter track or section identifier"
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b35100] focus:border-[#b35100] transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#b35100]" />
                      Installation Notes
                    </label>
                    <textarea
                      name="installationNotes"
                      value={installationForm.installationNotes}
                      onChange={handleInstallationChange}
                      placeholder="Add any installation notes, observations, or special instructions..."
                      rows="4"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#b35100] focus:border-[#b35100] transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                    <button 
                      type="button" 
                      onClick={() => {
                        setScanResult(null);
                        setBatchHistory(null);
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleSubmitInstallation}
                      disabled={loading} 
                      className="px-6 py-3 bg-[#b35100] text-white rounded-lg hover:bg-[#8a3e00] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-md"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Record Installation
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Installations */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#f2d8b1] rounded-lg flex items-center justify-center">
              <History className="w-6 h-6 text-[#b35100]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Installations</h2>
          </div>
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Your recent installations will appear here after scanning and recording.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationDashboard;