import React, { useState } from 'react';

// QR Generation Utilities (same as before)
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

const encodeObjectId = (oid) => {
  const hexStr = oid;
  const bits = textToBits(hexStr);
  
  const expandedBits = [];
  for (let bit of bits) {
    for (let i = 0; i < REDUNDANCY; i++) {
      expandedBits.push(bit);
    }
  }
  
  const gridSize = EXPECTED_GRID_SIZE;
  const totalCells = gridSize * gridSize;
  const dataCells = totalCells - 4;
  
  if (expandedBits.length > dataCells) {
    console.warn(`Too many bits for ${gridSize}x${gridSize} grid. Truncating.`);
  }
  
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill('/'));
  
  grid[0][0] = '\\';
  grid[0][gridSize - 1] = '\\';
  grid[gridSize - 1][0] = '\\';
  grid[gridSize - 1][gridSize - 1] = '\\';
  
  let idx = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if ((i === 0 && j === 0) || 
          (i === 0 && j === gridSize - 1) || 
          (i === gridSize - 1 && j === 0) || 
          (i === gridSize - 1 && j === gridSize - 1)) {
        continue;
      }
      if (idx < expandedBits.length && idx < dataCells) {
        grid[i][j] = expandedBits[idx] === 1 ? '\\' : '/';
        idx++;
      }
    }
  }
  
  return { grid, length: hexStr.length };
};

const gridToText = (grid) => {
  return grid.map(row => row.join('')).join('\n');
};

const downloadGridAsImage = (grid, filename = 'grid.png') => {
  const gridSize = grid.length;
  const cellSize = 20;
  const padding = 30;
  const canvasSize = gridSize * cellSize + padding * 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = padding + j * cellSize;
      const y = padding + i * cellSize;
      const margin = 2;
      
      if (grid[i][j] === '\\') {
        ctx.beginPath();
        ctx.moveTo(x + margin, y + margin);
        ctx.lineTo(x + cellSize - margin, y + cellSize - margin);
        ctx.stroke();
      } else if (grid[i][j] === '/') {
        ctx.beginPath();
        ctx.moveTo(x + cellSize - margin, y + margin);
        ctx.lineTo(x + margin, y + cellSize - margin);
        ctx.stroke();
      }
    }
  }
  
  ctx.fillStyle = 'black';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('18×18 Grid QR Code', canvasSize / 2, 20);
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
};

const downloadGridAsText = (gridText, filename = 'grid.txt') => {
  const blob = new Blob([gridText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const QRGenerator = () => {
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/my-batches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const handleGenerate = async () => {
    if (!batchId || quantity < 1) {
      alert('Please select a batch and enter quantity');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/generate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: new URLSearchParams({
          batch_id: batchId,
          quantity: quantity.toString()
        })
      });

      const data = await response.json();
      if (response.ok) {
        setGeneratedCodes(data.qr_codes || []);
        alert(`Successfully generated ${quantity} QR codes!`);
      } else {
        alert(data.detail || 'Error generating QR codes');
      }
    } catch (error) {
      alert('Network error generating QR codes');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllQRCodes = () => {
    generatedCodes.forEach((code, index) => {
      const { grid } = encodeObjectId(code.product_id);
      downloadGridAsImage(grid, `QR-${code.batch_id}-${index + 1}.png`);
      downloadGridAsText(gridToText(grid), `QR-${code.batch_id}-${index + 1}.txt`);
    });
    alert(`Downloaded ${generatedCodes.length} QR codes`);
  };

  const QRPreview = ({ code, index }) => {
    const { grid } = encodeObjectId(code.product_id);

    const downloadQR = () => {
      downloadGridAsImage(grid, `QR-${code.batch_id}-${code.product_id.slice(-8)}.png`);
      downloadGridAsText(gridToText(grid), `QR-${code.batch_id}-${code.product_id.slice(-8)}.txt`);
    };

    return (
      <div className="qr-preview-card">
        <div className="qr-code-preview">
          {grid.map((row, i) => (
            <div key={i} className="qr-row">
              {row.map((cell, j) => (
                <div key={j} className={`qr-cell ${cell === '\\' ? 'backslash' : 'slash'}`}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="qr-info">
          <p><strong>Product ID:</strong> {code.product_id.slice(-8)}</p>
          <p><strong>Batch:</strong> {code.batch_id}</p>
          <p><strong>Sequence:</strong> {index + 1}</p>
        </div>
        <button onClick={downloadQR} className="download-btn">
          Download QR
        </button>
      </div>
    );
  };

  return (
    <div className="qr-generator">
      <div className="generator-header">
        <h3>QR Code Generator</h3>
        <button onClick={loadBatches} className="btn-secondary">
          Refresh Batches
        </button>
      </div>

      <div className="generator-controls">
        <div className="control-group">
          <label>Select Batch:</label>
          <select 
            value={batchId} 
            onChange={(e) => setBatchId(e.target.value)}
            className="form-select"
          >
            <option value="">Select a batch</option>
            {batches.map(batch => (
              <option key={batch.batch_id} value={batch.batch_id}>
                {batch.batch_id} - {batch.material} ({batch.quantity} units)
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            max="1000"
            className="form-input"
          />
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={loading || !batchId}
          className="generate-btn"
        >
          {loading ? 'Generating...' : 'Generate QR Codes'}
        </button>
      </div>

      {generatedCodes.length > 0 && (
        <div className="qr-results">
          <div className="results-header">
            <h4>Generated QR Codes ({generatedCodes.length} codes)</h4>
            <button onClick={downloadAllQRCodes} className="btn-primary">
              Download All as ZIP
            </button>
          </div>

          <div className="qr-grid">
            {generatedCodes.map((code, index) => (
              <QRPreview key={code.product_id} code={code} index={index} />
            ))}
          </div>
        </div>
      )}

      {batches.length === 0 && (
        <div className="empty-state">
          <p>No batches found. Create a batch first to generate QR codes.</p>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;