import React, { useState, useEffect, useRef } from 'react';
import { Package, History, CheckCircle, Download, FileText, Plus, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

// Mock vendor service
const vendorService = {
  createBatch: async (formData) => {
    throw new Error('API not available');
  },
  simulateBatchCreation: async (formData) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const batchNumber = `BATCH-${Date.now().toString().slice(-6)}`;
    const generatedQrs = Array.from({ length: parseInt(formData.qrCount) }, (_, i) => ({
      objectId: Math.random().toString(16).slice(2, 26).padEnd(24, '0')
    }));
    return {
      batch: {
        _id: Date.now().toString(),
        batchNumber,
        materialType: formData.materialType,
        warranty: formData.warranty,
        fittingType: formData.fittingType,
        generatedQrs,
        createdDate: new Date().toISOString()
      }
    };
  }
};

const VendorDashboard = ({ user = { name: 'John Doe', organization: 'Industrial Supply Co.' } }) => {
  const [batchForm, setBatchForm] = useState({
    materialType: '',
    warranty: '',
    fittingType: '',
    qrCount: 1
  });
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadedQrs, setDownloadedQrs] = useState([]);
  const [vendorBatches, setVendorBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => { 
    loadVendorBatches(); 
  }, [user]);

  const loadVendorBatches = async () => {
    try {
      const mockBatches = [
        {
          _id: '1',
          batchNumber: 'BATCH-001',
          materialType: 'Titanium Alloy',
          generatedQrs: Array(5).fill({ objectId: '507f1f77bcf86cd799439011' }),
          createdDate: new Date().toISOString()
        },
        {
          _id: '2',
          batchNumber: 'BATCH-002', 
          materialType: 'Carbon Fiber',
          generatedQrs: Array(3).fill({ objectId: '507f1f77bcf86cd799439012' }),
          createdDate: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setVendorBatches(mockBatches);
    } catch (error) {
      console.error('Failed to load vendor batches:', error);
    }
  };

  const handleBatchChange = (e) =>
    setBatchForm({ ...batchForm, [e.target.name]: e.target.value });

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    try {
      let newBatch;
      try { 
        newBatch = await vendorService.createBatch(batchForm); 
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        newBatch = await vendorService.simulateBatchCreation(batchForm);
      }
      setBatch(newBatch.batch);
      setVendorBatches(prev => [newBatch.batch, ...prev]);
      setActiveTab('results');
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleQrDownload = (index) =>
    setDownloadedQrs(prev => [...prev, index]);

  const downloadQrAsText = (qr) => {
    if (!qr) return;
    const { grid } = encodeObjectId(qr.objectId);
    const gridText = grid.map(row => row.join('')).join('\n');
    const blob = new Blob([gridText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${qr.objectId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const downloadAllQrCodes = async () => {
    if (!batch) return;
    try {
      for (let i = 0; i < batch.generatedQrs.length; i++) {
        const { grid } = encodeObjectId(batch.generatedQrs[i].objectId);
        downloadGridAsImage(grid, `qr-${batch.batchNumber}-${i + 1}.png`);
        downloadQrAsText(batch.generatedQrs[i]);
        await new Promise(r => setTimeout(r, 100));
      }
      setDownloadedQrs(Array.from({ length: batch.generatedQrs.length }, (_, i) => i));
    } catch (err) { 
      setError('Error downloading QR codes: ' + err.message); 
    }
  };

  const createNewBatch = () => {
    setBatch(null);
    setBatchForm({ materialType: '', warranty: '', fittingType: '', qrCount: 1 });
    setDownloadedQrs([]); 
    setError('');
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mb-3">
            Vendor Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            {/* Welcome back, <span className="font-semibold text-gray-800">{user.name}</span> from {user.organization} */}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-amber-100 overflow-hidden">
        <div className="flex gap-2 p-6 border-b border-gray-200 bg-gradient-to-r from-[#f2d8b1]/20 to-transparent">
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'create' 
                ? 'bg-gradient-to-r from-[#b35100] to-orange-600 text-white shadow-lg shadow-orange-300' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-[#b35100] to-orange-600 text-white shadow-lg shadow-orange-300' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History className="w-5 h-5" />
            History
          </button>
          {batch && (
            <button 
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'results' 
                  ? 'bg-gradient-to-r from-[#b35100] to-orange-600 text-white shadow-lg shadow-orange-300' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Current Batch
            </button>
          )}
        </div>

        <div className="p-8">
          {activeTab === 'create' && (
            <div>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f2d8b1] to-amber-200 rounded-2xl mb-4">
                  <Package className="w-8 h-8 text-[#b35100]" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Create New Batch
                </h2>
                <p className="text-gray-600 text-lg">
                  Generate QR codes for your material batches
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Material Type
                    </label>
                    <select 
                      name="materialType" 
                      value={batchForm.materialType} 
                      onChange={handleBatchChange} 
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#b35100] focus:ring-4 focus:ring-[#f2d8b1]/30 transition-all outline-none bg-white"
                    >
                      <option value="">Select Material Type</option>
                      <option value="Titanium Alloy">Titanium Alloy</option>
                      <option value="Carbon Fiber">Carbon Fiber</option>
                      <option value="Stainless Steel">Stainless Steel</option>
                      <option value="Aluminum 6061">Aluminum 6061</option>
                      <option value="Copper Alloy">Copper Alloy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Warranty Period (months)
                    </label>
                    <input 
                      type="number" 
                      name="warranty" 
                      min="1" 
                      max="120"
                      placeholder="Enter months"
                      value={batchForm.warranty} 
                      onChange={handleBatchChange} 
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#b35100] focus:ring-4 focus:ring-[#f2d8b1]/30 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fitting Type
                    </label>
                    <input 
                      type="text" 
                      name="fittingType" 
                      placeholder="e.g., Type A, Bushing, Coupling"
                      value={batchForm.fittingType} 
                      onChange={handleBatchChange} 
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#b35100] focus:ring-4 focus:ring-[#f2d8b1]/30 transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      QR Codes Quantity
                    </label>
                    <input 
                      type="number" 
                      name="qrCount" 
                      min="1" 
                      max="100"
                      placeholder="Number of QR codes"
                      value={batchForm.qrCount} 
                      onChange={handleBatchChange} 
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#b35100] focus:ring-4 focus:ring-[#f2d8b1]/30 transition-all outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  onClick={handleCreateBatch}
                  disabled={loading}
                  className="w-full md:w-auto mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#b35100] to-orange-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-orange-300 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Batch...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Generate Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#f2d8b1] to-amber-200 rounded-2xl mb-4">
                  <History className="w-8 h-8 text-[#b35100]" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Batch History
                </h2>
                <p className="text-gray-600 text-lg">
                  View all your previously created batches
                </p>
              </div>

              {vendorBatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vendorBatches.map((b) => (
                    <div 
                      key={b._id} 
                      className="bg-gradient-to-br from-white to-amber-50/50 p-6 rounded-2xl border border-gray-200 hover:border-[#b35100] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{b.batchNumber}</h3>
                        <span className="bg-gradient-to-r from-[#b35100] to-orange-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {b.generatedQrs.length} QR{b.generatedQrs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <p className="text-gray-600">
                          <span className="font-semibold text-gray-700">Material:</span> {b.materialType}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(b.createdDate).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setBatch(b);
                          setActiveTab('results');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-[#b35100] text-[#b35100] rounded-xl font-semibold hover:bg-[#b35100] hover:text-white transition-all"
                      >
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                    <Package className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No batches yet</h3>
                  <p className="text-gray-600">Create your first batch to get started with QR code generation</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && batch && (
            <div>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8 rounded-2xl text-center mb-8 shadow-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-2">
                  Batch Created Successfully!
                </h2>
                <p className="text-white/90 text-lg">
                  Your QR codes are ready for download
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-[#f2d8b1]/30 to-amber-100/30 p-6 rounded-xl border border-amber-200">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Batch Number</h4>
                  <p className="text-2xl font-bold text-[#b35100]">{batch.batchNumber}</p>
                </div>
                <div className="bg-gradient-to-br from-[#f2d8b1]/30 to-amber-100/30 p-6 rounded-xl border border-amber-200">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Material Type</h4>
                  <p className="text-2xl font-bold text-[#b35100]">{batch.materialType}</p>
                </div>
                <div className="bg-gradient-to-br from-[#f2d8b1]/30 to-amber-100/30 p-6 rounded-xl border border-amber-200">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">QR Codes</h4>
                  <p className="text-2xl font-bold text-[#b35100]">{batch.generatedQrs.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center mb-8">
                <button 
                  onClick={downloadAllQrCodes}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Download All QR Images & TXT
                </button>
                <button 
                  onClick={createNewBatch}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#b35100] text-[#b35100] rounded-xl font-semibold hover:bg-[#b35100] hover:text-white transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create New Batch
                </button>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
                  Generated QR Codes ({batch.generatedQrs.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {batch.generatedQrs.map((qr, i) => (
                    <QRPreview 
                      key={qr.objectId} 
                      objectId={qr.objectId}
                      batchNumber={batch.batchNumber} 
                      index={i}
                      onDownload={handleQrDownload}
                      onDownloadTxt={() => downloadQrAsText(qr)}
                    />
                  ))}
                </div>

                {downloadedQrs.length === batch.generatedQrs.length && batch.generatedQrs.length > 0 && (
                  <div className="flex items-center justify-center gap-3 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mt-8">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">
                      All {batch.generatedQrs.length} QR codes downloaded successfully!
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QRPreview = ({ objectId, batchNumber, index, onDownload, onDownloadTxt }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const { grid } = encodeObjectId(objectId);
    drawGridToCanvas(canvasRef.current, grid);
  }, [objectId]);

  const download = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; 
    a.download = `qr-${batchNumber}-${index + 1}.png`; 
    a.click();
    onDownload(index);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400}
        className="w-full h-auto rounded-lg border border-gray-200 mb-3 bg-white"
      />
      <p className="text-center text-sm font-semibold text-gray-600 mb-3">
        QR #{index + 1}
      </p>
      <div className="flex gap-2">
        <button 
          onClick={download}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#b35100] to-orange-600 text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
        >
          <Download className="w-4 h-4" />
          PNG
        </button>
        <button 
          onClick={onDownloadTxt}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border-2 border-[#b35100] text-[#b35100] rounded-lg text-sm font-semibold hover:bg-[#b35100] hover:text-white transition-all"
        >
          <FileText className="w-4 h-4" />
          TXT
        </button>
      </div>
    </div>
  );
};

const encodeObjectId = (oid) => {
  const REDUNDANCY = 3, SIZE = 18;
  const bits = [...oid.match(/.{1,2}/g).map(b => parseInt(b,16))]
    .flatMap(byte => byte.toString(2).padStart(8,'0').split('').map(Number))
    .flatMap(bit => Array(REDUNDANCY).fill(bit));
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('/'));
  grid[0][0]=grid[0][SIZE-1]=grid[SIZE-1][0]=grid[SIZE-1][SIZE-1]='\\';
  let idx=0;
  for(let i=0;i<SIZE;i++)for(let j=0;j<SIZE;j++){
    if((i===0||i===SIZE-1)&&(j===0||j===SIZE-1))continue;
    if(idx<bits.length)grid[i][j]=bits[idx++]?'\\':'/';
  }
  return {grid};
};

const drawGridToCanvas = (canvas, grid) => {
  if(!canvas) return;
  const ctx=canvas.getContext('2d'), cell=20, pad=20, N=grid.length;
  canvas.width=N*cell+pad*2; canvas.height=N*cell+pad*2;
  ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#000'; ctx.lineWidth=2;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    const x=pad+j*cell, y=pad+i*cell, m=2;
    ctx.beginPath();
    if(grid[i][j]==='\\'){ctx.moveTo(x+m,y+m);ctx.lineTo(x+cell-m,y+cell-m);}
    else {ctx.moveTo(x+cell-m,y+m);ctx.lineTo(x+m,y+cell-m);}
    ctx.stroke();
  }
};

const downloadGridAsImage = (grid, filename='grid.png') => {
  const canvas=document.createElement('canvas');
  drawGridToCanvas(canvas,grid);
  canvas.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
  });
};

export default VendorDashboard;