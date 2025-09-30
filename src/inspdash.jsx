
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wrench, 
  ClipboardList,
  Camera,
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  Upload,
  X,
  BarChart3,
  History,
  ScanLine,
  AlertCircle
} from 'lucide-react';
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
  const [stats, setStats] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [activeTab, setActiveTab] = useState('scanner');
  const [inspectionsLoading, setInspectionsLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadRecentInspections();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await inspectorService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentInspections = async () => {
    try {
      setInspectionsLoading(true);
      const inspectionsData = await inspectorService.getInspections(1, 5);
      setInspections(inspectionsData.inspections || []);
    } catch (error) {
      console.error('Failed to load inspections:', error);
    } finally {
      setInspectionsLoading(false);
    }
  };

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
      setActiveTab('inspection');
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
        images: [...prev.images, ...files.slice(0, 3)]
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
        images: inspectionForm.images
      });
      
      setSuccess('Inspection recorded successfully!');
      await loadStats();
      await loadRecentInspections();
      
      setScanResult(null);
      setBatchHistory(null);
      setInspectionForm({
        status: 'approved',
        notes: '',
        damages: '',
        correctiveActions: '',
        images: []
      });
      
      setActiveTab('history');
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError('Failed to record inspection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      approved: { 
        color: 'bg-emerald-500', 
        icon: CheckCircle,
        textColor: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500'
      },
      rejected: { 
        color: 'bg-red-500', 
        icon: XCircle,
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-500'
      },
      pending: { 
        color: 'bg-amber-500', 
        icon: Clock,
        textColor: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500'
      },
      'needs-repair': { 
        color: 'bg-orange-500', 
        icon: Wrench,
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-500'
      }
    };
    return configs[status] || configs.pending;
  };

  const StatCard = ({ title, value, type, icon: Icon }) => {
    const config = getStatusConfig(type);
    return (
      <div className="bg-white rounded-xl p-6 border-2 border-[#f2d8b1] shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} text-white`}>
            {type.toUpperCase()}
          </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-1">{value || 0}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
    );
  };

  const InspectionCard = ({ inspection }) => {
    const config = getStatusConfig(inspection.status);
    const StatusIcon = config.icon;
    
    return (
      <div className="bg-white border-2 border-[#f2d8b1] rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <StatusIcon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <div>
              <div className="font-mono text-gray-500 text-xs">
                #{inspection._id.slice(-6)}
              </div>
              <div className="font-semibold text-gray-900 mt-1">
                {inspection.batchDetails?.batchNumber || 'N/A'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} text-white`}>
              {inspection.status.toUpperCase()}
            </span>
            <span className="text-gray-500 text-xs">
              {new Date(inspection.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {inspection.notes && (
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">{inspection.notes}</p>
        )}
        
        {inspection.damages && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-red-900 mb-1">Damages Reported</div>
                <div className="text-sm text-red-700">{inspection.damages}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2d8b1] via-[#f5e5c8] to-[#f2d8b1]">
      <header className="bg-white border-b-4 border-[#b35100] shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#b35100] rounded-xl">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Inspector Dashboard
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Quality Control & Inspection Management
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#b35100] to-[#8a3f00] px-6 py-4 rounded-xl text-white shadow-md">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-6 h-6" />
                <div>
                  <div className="text-xs opacity-90">Total Inspections</div>
                  <div className="text-2xl font-bold">{stats?.total_inspections || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b-2 border-[#f2d8b1] sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 flex gap-2">
          <button 
            className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all duration-200 ${
              activeTab === 'scanner' 
                ? 'border-[#b35100] text-[#b35100] bg-[#f2d8b1] bg-opacity-30' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('scanner')}
          >
            <ScanLine className="w-5 h-5" />
            <span className="font-medium">QR Scanner</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all duration-200 ${
              activeTab === 'inspection' 
                ? 'border-[#b35100] text-[#b35100] bg-[#f2d8b1] bg-opacity-30' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            } ${!scanResult ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => scanResult && setActiveTab('inspection')}
            disabled={!scanResult}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">Current Inspection</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all duration-200 ${
              activeTab === 'history' 
                ? 'border-[#b35100] text-[#b35100] bg-[#f2d8b1] bg-opacity-30' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('history')}
          >
            <History className="w-5 h-5" />
            <span className="font-medium">History</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-6 py-4 border-b-4 transition-all duration-200 ${
              activeTab === 'stats' 
                ? 'border-[#b35100] text-[#b35100] bg-[#f2d8b1] bg-opacity-30' 
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Statistics</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {error && (
          <div className="flex items-center justify-between p-4 rounded-xl mb-6 bg-red-50 border-2 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="flex items-center justify-between p-4 rounded-xl mb-6 bg-emerald-50 border-2 border-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-800">{success}</span>
            </div>
            <button 
              onClick={() => setSuccess('')}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f2d8b1] shadow-lg">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-[#f2d8b1] rounded-lg">
                  <ScanLine className="w-6 h-6 text-[#b35100]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">QR Code Scanner</h2>
              </div>
              <p className="text-gray-600">Scan QR codes or upload text files to begin inspection process</p>
            </div>
            
            <QRScanner 
              scanning={scanning}
              onScanResult={handleScanResult}
              onStartScan={() => setScanning(true)}
              onStopScan={() => setScanning(false)}
              processTextFile={processTextFile}
              decodeGrid={decodeGrid}
            />

            {loading && (
              <div className="flex flex-col items-center justify-center p-8 bg-[#f2d8b1] bg-opacity-30 rounded-xl my-6">
                <RefreshCw className="w-10 h-10 text-[#b35100] animate-spin" />
                <p className="mt-4 text-gray-700 font-medium">Loading batch details...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspection' && scanResult && batchHistory && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f2d8b1] shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f2d8b1] rounded-lg">
                  <ClipboardList className="w-6 h-6 text-[#b35100]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Current Inspection</h2>
              </div>
              <button 
                onClick={() => {
                  setScanResult(null);
                  setBatchHistory(null);
                  setActiveTab('scanner');
                }}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                New Scan
              </button>
            </div>

            <div className="mb-8 p-6 bg-gradient-to-br from-[#f2d8b1] to-[#f5e5c8] rounded-xl border border-[#b35100] border-opacity-20">
              <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#b35100]" />
                Batch Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#b35100] border-opacity-20">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Object ID</label>
                  <span className="font-mono text-sm bg-gray-100 px-3 py-1.5 rounded block">
                    {scanResult.objectId}
                  </span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#b35100] border-opacity-20">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Batch Number</label>
                  <span className="text-gray-900 font-medium">{scanResult.batchDetails.batchNumber}</span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#b35100] border-opacity-20">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Material Type</label>
                  <span className="text-gray-900 font-medium">{scanResult.batchDetails.materialType}</span>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#b35100] border-opacity-20">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Vendor</label>
                  <span className="text-gray-900 font-medium">{scanResult.batchDetails.vendorName}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-gray-900 font-semibold text-lg mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-[#b35100]" />
                History Timeline
              </h3>
              <div className="border-l-4 border-[#f2d8b1] ml-4 pl-8">
                {batchHistory.scans.map((scan, index) => (
                  <div key={index} className="relative mb-6 last:mb-0">
                    <div className="absolute -left-10 top-0 w-4 h-4 rounded-full bg-[#b35100] border-4 border-white"></div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                        <strong className="text-gray-900">{getScanTypeDisplay(scan.scanType)}</strong>
                        <span className="text-gray-500 text-sm">
                          {new Date(scan.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm mb-2">
                        By: <span className="font-medium">{scan.scannedBy}</span> • {scan.status || 'completed'}
                      </div>
                      {scan.notes && (
                        <p className="text-gray-700 text-sm mt-2 italic">{scan.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-gray-900 font-semibold text-lg mb-6 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#b35100]" />
                Inspection Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <label className="font-semibold text-gray-700 mb-2 text-sm">Inspection Status</label>
                  <select 
                    name="status" 
                    value={inspectionForm.status}
                    onChange={handleInspectionChange}
                    className={`p-3 border-2 rounded-lg text-base transition-all focus:outline-none focus:ring-2 focus:ring-[#b35100] focus:ring-opacity-50 border-l-4 ${
                      inspectionForm.status === 'approved' ? 'border-emerald-500 bg-emerald-50' :
                      inspectionForm.status === 'rejected' ? 'border-red-500 bg-red-50' :
                      inspectionForm.status === 'pending' ? 'border-amber-500 bg-amber-50' :
                      'border-orange-500 bg-orange-50'
                    }`}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="needs-repair">Needs Repair</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="font-semibold text-gray-700 mb-2 text-sm">Inspection Notes</label>
                  <textarea
                    name="notes"
                    value={inspectionForm.notes}
                    onChange={handleInspectionChange}
                    placeholder="General observations and comments..."
                    rows="3"
                    className="p-3 border-2 border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-[#b35100] focus:ring-2 focus:ring-[#b35100] focus:ring-opacity-50"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-semibold text-gray-700 mb-2 text-sm">Damages Found</label>
                  <textarea
                    name="damages"
                    value={inspectionForm.damages}
                    onChange={handleInspectionChange}
                    placeholder="Describe any damages or defects..."
                    rows="3"
                    className="p-3 border-2 border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-[#b35100] focus:ring-2 focus:ring-[#b35100] focus:ring-opacity-50"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="font-semibold text-gray-700 mb-2 text-sm">Corrective Actions</label>
                  <textarea
                    name="correctiveActions"
                    value={inspectionForm.correctiveActions}
                    onChange={handleInspectionChange}
                    placeholder="Corrective actions taken or recommended..."
                    rows="3"
                    className="p-3 border-2 border-gray-300 rounded-lg text-base transition-all focus:outline-none focus:border-[#b35100] focus:ring-2 focus:ring-[#b35100] focus:ring-opacity-50"
                  />
                </div>

                <div className="flex flex-col md:col-span-2">
                  <label className="font-semibold text-gray-700 mb-2 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Upload Images (Max 3)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={inspectionForm.images.length >= 3}
                    className="p-3 border-2 border-gray-300 rounded-lg text-base file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#b35100] file:text-white file:cursor-pointer hover:file:bg-[#8a3f00] transition-colors"
                  />
                  <div className="flex gap-4 mt-4 flex-wrap">
                    {inspectionForm.images.map((image, index) => (
                      <div key={index} className="relative w-24 h-24 group">
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border-2 border-[#f2d8b1]"
                        />
                        <button 
                          type="button" 
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  type="button" 
                  onClick={handleSubmitInspection}
                  disabled={loading}
                  className={`flex items-center gap-2 bg-gradient-to-r from-[#b35100] to-[#8a3f00] text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#b35100] hover:shadow-opacity-30 ${
                    loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Record Inspection
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f2d8b1] shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f2d8b1] rounded-lg">
                  <History className="w-6 h-6 text-[#b35100]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Inspections</h2>
              </div>
              <button 
                onClick={loadRecentInspections}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {inspectionsLoading ? (
              <div className="flex flex-col items-center justify-center p-12 bg-[#f2d8b1] bg-opacity-30 rounded-xl">
                <RefreshCw className="w-10 h-10 text-[#b35100] animate-spin" />
                <p className="mt-4 text-gray-700 font-medium">Loading inspections...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {inspections.map(inspection => (
                  <InspectionCard key={inspection._id} inspection={inspection} />
                ))}
                {inspections.length === 0 && (
                  <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No inspections found</p>
                    <p className="text-sm mt-1">Start scanning QR codes to create inspections</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white rounded-2xl p-8 border-2 border-[#f2d8b1] shadow-lg">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#f2d8b1] rounded-lg">
                  <BarChart3 className="w-6 h-6 text-[#b35100]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Inspection Statistics</h2>
              </div>
              <button 
                onClick={loadStats}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Approved Inspections" value={stats?.approved} type="approved" icon={CheckCircle} />
              <StatCard title="Pending Review" value={stats?.pending} type="pending" icon={Clock} />
              <StatCard title="Needs Repair" value={stats?.needs_repair} type="needs-repair" icon={Wrench} />
              <StatCard title="Rejected Items" value={stats?.rejected} type="rejected" icon={XCircle} />
            </div>

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#f2d8b1] to-[#f5e5c8] p-6 rounded-xl border-2 border-[#b35100] border-opacity-20">
                  <div className="flex items-center gap-3 mb-2">
                    <ClipboardList className="w-5 h-5 text-[#b35100]" />
                    <span className="text-gray-700 font-medium">Total Inspections</span>
                  </div>
                  <div className="text-3xl font-bold text-[#b35100]">{stats.total_inspections}</div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl border-2 border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                    <span className="text-gray-700 font-medium">Approval Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {stats.total_inspections > 0 
                      ? Math.round((stats.approved / stats.total_inspections) * 100) 
                      : 0}%
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-blue-700" />
                    <span className="text-gray-700 font-medium">Rejection Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {stats.total_inspections > 0 
                      ? Math.round((stats.rejected / stats.total_inspections) * 100) 
                      : 0}%
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
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