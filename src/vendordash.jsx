import React, { useState, useEffect, useRef } from 'react';
import { vendorService } from './vendserv';

const VendorDashboard = ({ user }) => {
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
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => { loadVendorBatches(); }, [user]);

  const loadVendorBatches = async () => {
    try {
      // const batches = await vendorService.getVendorBatches(user._id);
      // setVendorBatches(batches);
    } catch (error) {
      console.error('Failed to load vendor batches:', error);
    }
  };

  const handleBatchChange = (e) =>
    setBatchForm({ ...batchForm, [e.target.name]: e.target.value });

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      let newBatch;
      try { newBatch = await vendorService.createBatch(batchForm); }
      catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        newBatch = await vendorService.simulateBatchCreation(batchForm);
      }
      setBatch(newBatch.batch);
      setVendorBatches(prev => [newBatch.batch, ...prev]);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleQrDownload = (index) =>
    setDownloadedQrs(prev => [...prev, index]);

  /* ---------- DOWNLOAD EACH QR AS TXT ---------- */
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
        downloadQrAsText(batch.generatedQrs[i]); // download individual TXT
        await new Promise(r => setTimeout(r, 100));
      }
      setDownloadedQrs(Array.from({ length: batch.generatedQrs.length }, (_, i) => i));
    } catch (err) { setError('Error downloading QR codes: ' + err.message); }
  };

  const createNewBatch = () => {
    setBatch(null);
    setBatchForm({ materialType: '', warranty: '', fittingType: '', qrCount: 1 });
    setDownloadedQrs([]); setError('');
  };

  return (
    <div className="dashboard-container">
      <h1>Vendor Dashboard</h1>
      <div className="dashboard-header">
        <p>Welcome, {user.name} ({user.organization})</p>
        <div className="header-actions">
          <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary">
            {showHistory ? 'Hide History' : 'Show Batch History'}
          </button>
        </div>
      </div>

      {showHistory && vendorBatches.length > 0 && (
        <div className="batch-history">
          <h3>Batch History</h3>
          <div className="batches-grid">
            {vendorBatches.map((b) => (
              <div key={b._id} className="batch-card">
                <h4>{b.batchNumber}</h4>
                <p>Material: {b.materialType}</p>
                <p>QR Codes: {b.generatedQrs.length}</p>
                <p>Created: {new Date(b.createdDate).toLocaleDateString()}</p>
                <button onClick={() => setBatch(b)} className="btn-secondary">View Details</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!batch ? (
        <div className="batch-form">
          <h2>Create New Batch</h2>
          <form onSubmit={handleCreateBatch}>
            <div className="form-row">
              <div className="form-group">
                <label>Material Type:</label>
                <select name="materialType" value={batchForm.materialType} onChange={handleBatchChange} required>
                  <option value="">Select Material</option>
                  <option value="Titanium Alloy">Titanium Alloy</option>
                  <option value="Carbon Fiber">Carbon Fiber</option>
                  <option value="Stainless Steel">Stainless Steel</option>
                  <option value="Aluminum 6061">Aluminum 6061</option>
                  <option value="Copper Alloy">Copper Alloy</option>
                </select>
              </div>
              <div className="form-group">
                <label>Warranty (months):</label>
                <input type="number" name="warranty" min="1" max="120"
                       value={batchForm.warranty} onChange={handleBatchChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Fitting Type:</label>
                <input type="text" name="fittingType" placeholder="e.g., Type A"
                       value={batchForm.fittingType} onChange={handleBatchChange} required />
              </div>
              <div className="form-group">
                <label>Number of QR Codes:</label>
                <input type="number" name="qrCount" min="1" max="100"
                       value={batchForm.qrCount} onChange={handleBatchChange} required />
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <><span className="spinner"></span>Creating Batch...</> : 'Create Batch'}
            </button>
          </form>
        </div>
      ) : (
        <div className="batch-results">
          <div className="batch-header">
            <div>
              <h2>Batch Created Successfully! 🎉</h2>
              <div className="batch-info">
                <p><strong>Batch Number:</strong> {batch.batchNumber}</p>
                <p><strong>Material:</strong> {batch.materialType}</p>
                <p><strong>QR Codes Generated:</strong> {batch.generatedQrs.length}</p>
                <p><strong>Created:</strong> {new Date(batch.createdDate).toLocaleString()}</p>
              </div>
            </div>
            <button onClick={createNewBatch} className="btn-secondary">Create New Batch</button>
          </div>

          <div className="qr-section">
            <div className="qr-header">
              <h3>Generated QR Codes</h3>
              <div className="qr-actions">
                <button onClick={downloadAllQrCodes} className="btn-primary">🖼️ Download All QR Images & TXT</button>
              </div>
            </div>

            <div className="qr-grid">
              {batch.generatedQrs.map((qr, i) => (
                <QRPreview key={qr.objectId} objectId={qr.objectId}
                           batchNumber={batch.batchNumber} index={i}
                           onDownload={handleQrDownload}
                           onDownloadTxt={() => downloadQrAsText(qr)}/>
              ))}
            </div>

            {downloadedQrs.length === batch.generatedQrs.length && batch.generatedQrs.length > 0 && (
              <div className="success-message">✅ All {batch.generatedQrs.length} QR codes downloaded!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------ QR Preview Canvas ------------ */
const QRPreview = ({ objectId, batchNumber, index, onDownload, onDownloadTxt }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const { grid } = encodeObjectId(objectId);
    drawGridToCanvas(canvasRef.current, grid);
  }, [objectId]);

  const download = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `qr-${batchNumber}-${index + 1}.png`; a.click();
    onDownload(index);
  };

  return (
    <div className="qr-card">
      <canvas ref={canvasRef} width={400} height={400}
              style={{ width: 180, height: 180, border: '1px solid #ddd' }}/>
      <div style={{ marginTop: 5 }}>
        <button onClick={download} className="btn-secondary">⬇ Download PNG</button>
        <button onClick={onDownloadTxt} className="btn-secondary" style={{ marginLeft: 5 }}>📄 Download TXT</button>
      </div>
    </div>
  );
};

/* ------------ GRID ENCODING + DRAW ------------ */
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