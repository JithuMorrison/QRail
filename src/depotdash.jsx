import React, { useState } from 'react';
import { depotService } from './depotserv';
import QRScanner from './qscan';
import { Warehouse, QrCode, Package, AlertCircle, CheckCircle, MapPin, Layers, Hash, User, X, Save, RotateCcw, Clock, FileText } from 'lucide-react';

// QR Scanning Utilities
const REDUNDANCY = 3;
const EXPECTED_GRID_SIZE = 18;

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

const parseGridText = (text) => {
  const lines = text.trim().split('\n');
  const grid = lines.map(line => line.split(''));
  return grid;
};

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
      
      try {
        batchDetails = await depotService.getBatchDetails(objectId);
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        batchDetails = await depotService.simulateGetBatchDetails(objectId);
      }
      
      setScanResult({ objectId, batchDetails });
      
      setScanHistory(prev => [{
        objectId,
        timestamp: new Date().toLocaleString(),
        status: 'scanned'
      }, ...prev.slice(0, 4)]);
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
      
      alert('Scan recorded successfully!');
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-5">
      <div className="max-w-7xl mx-auto bg-white/95 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-8 py-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Warehouse className="w-12 h-12" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold">Depot Staff Dashboard</h1>
          </div>
          <div className="flex flex-wrap justify-between items-center max-w-5xl mx-auto gap-4">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl">
              <p className="text-lg font-semibold">
                {/* Welcome, {user.name} ({user.organization}) */}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Recent Scans: {scanHistory.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Scanner Section */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <QrCode className="w-7 h-7 text-orange-600" strokeWidth={1.5} />
              <h2 className="text-2xl font-bold text-gray-800">QR Code Scanner</h2>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <p className="text-gray-700 text-lg">
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
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-4 rounded-xl mt-5 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                  <span className="font-medium">{error}</span>
                </div>
                <button 
                  onClick={clearScanResult} 
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            )}

            {scanResult && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mt-6 border border-green-200">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2} />
                    <h3 className="text-2xl font-bold text-green-800">Scan Successful!</h3>
                  </div>
                  <button 
                    onClick={clearScanResult} 
                    className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-xl font-semibold border-2 border-gray-200 transition-all flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    New Scan
                  </button>
                </div>
                
                {/* Batch Details */}
                <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
                  <div className="flex items-center gap-2 mb-5">
                    <Package className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
                    <h4 className="text-xl font-bold text-gray-800">Batch Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium">ObjectId:</span>
                      <span className="text-base text-gray-900 font-semibold font-mono">{scanResult.objectId}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium">Batch Number:</span>
                      <span className="text-base text-gray-900 font-semibold font-mono">{scanResult.batchDetails.batchNumber}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium">Material Type:</span>
                      <span className="text-base text-gray-900 font-semibold font-mono">{scanResult.batchDetails.materialType}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium">Vendor:</span>
                      <span className="text-base text-gray-900 font-semibold font-mono">{scanResult.batchDetails.vendorName}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium">Created Date:</span>
                      <span className="text-base text-gray-900 font-semibold font-mono">
                        {new Date(scanResult.batchDetails.createdDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-gray-600 font-medium">Warranty:</span>
                      <span className="text-base text-gray-900 font-semibold font-mono">{scanResult.batchDetails.warranty} months</span>
                    </div>
                  </div>
                </div>

                {/* Depot Form */}
                <form onSubmit={handleSubmitScan} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="flex items-center gap-2 mb-5">
                    <Warehouse className="w-6 h-6 text-orange-600" strokeWidth={1.5} />
                    <h4 className="text-xl font-bold text-gray-800">Depot Storage Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={depotForm.location}
                        onChange={handleDepotChange}
                        placeholder="e.g., Main Warehouse, Building A"
                        required
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-gray-500" />
                        Store Area
                      </label>
                      <input
                        type="text"
                        name="storeArea"
                        value={depotForm.storeArea}
                        onChange={handleDepotChange}
                        placeholder="e.g., Section 3, Cold Storage"
                        required
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        Rack Number
                      </label>
                      <input
                        type="text"
                        name="rackNo"
                        value={depotForm.rackNo}
                        onChange={handleDepotChange}
                        placeholder="e.g., Rack 12-B, Shelf 3"
                        required
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        Staff ID
                      </label>
                      <input
                        type="text"
                        value={user._id}
                        disabled
                        className="px-4 py-3 border-2 border-gray-200 rounded-xl text-base bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 justify-end">
                    <button 
                      type="button" 
                      onClick={clearScanResult}
                      className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 transition-all flex items-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-600/30 transition-all hover:-translate-y-1 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      {loading ? 'Recording...' : 'Record Scan'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Recent Scan History */}
          {scanHistory.length > 0 && (
            <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <FileText className="w-7 h-7 text-orange-600" strokeWidth={1.5} />
                <h3 className="text-2xl font-bold text-gray-800">Recent Scans</h3>
              </div>
              <div className="flex flex-col gap-3">
                {scanHistory.map((scan, index) => (
                  <div key={index} className="flex justify-between items-center px-5 py-4 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-gray-900 font-mono">{scan.objectId.slice(0, 12)}...</span>
                      <span className="text-sm text-gray-600">{scan.timestamp}</span>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      scan.status === 'scanned' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {scan.status === 'scanned' ? 'Scanned' : 'Recorded'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Help */}
          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-8 border border-yellow-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">How to Scan</h3>
            <div className="flex flex-col gap-4">
              {[
                { num: 1, title: 'Text File Upload', desc: 'Upload .txt files containing the 18×18 grid pattern' },
                { num: 2, title: 'Image Upload', desc: 'Upload PNG images of QR codes' },
                { num: 3, title: 'Camera Scan', desc: 'Use your device camera to scan QR codes in real-time' },
                { num: 4, title: 'Record Information', desc: 'Fill in depot details and save the scan' }
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4 px-5 py-4 bg-white/80 rounded-xl">
                  <div className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 mb-1">{step.title}</div>
                    <div className="text-gray-600 text-sm leading-relaxed">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepotDashboard;