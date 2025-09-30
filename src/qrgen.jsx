import React, { useState, useRef } from 'react';

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

// Encode ObjectId to 18x18 grid
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
  
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill('/'));
  
  // Orientation corners
  grid[0][0] = '\\';
  grid[0][gridSize - 1] = '\\';
  grid[gridSize - 1][0] = '\\';
  grid[gridSize - 1][gridSize - 1] = '\\';
  
  // Fill grid with data bits
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

// Download Grid as PNG image
const downloadGridAsImage = (grid, filename = 'grid.png') => {
  const gridSize = grid.length;
  const cellSize = 20;
  const padding = 20;
  const canvasSize = gridSize * cellSize + padding * 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  // Draw grid content with black lines
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
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
  
  // Convert to blob and download
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

const QRGenerator = ({ objectId, batchNumber, index, onDownload }) => {
  const [downloaded, setDownloaded] = useState(false);
  
  const handleDownload = () => {
    const { grid } = encodeObjectId(objectId);
    const filename = `qr-${batchNumber}-${index + 1}.png`;
    downloadGridAsImage(grid, filename);
    setDownloaded(true);
    onDownload && onDownload(objectId, index);
  };

  const { grid } = encodeObjectId(objectId);
  const gridText = grid.map(row => row.join('')).join('\n');

  return (
    <div className="qr-item">
      <div className="qr-info">
        <h4>QR #{index + 1}</h4>
        <p>ObjectId: {objectId}</p>
      </div>
      <div className="qr-preview">
        <pre>{gridText.substring(0, 100)}...</pre>
      </div>
      <button onClick={handleDownload} className="btn-secondary">
        {downloaded ? '✓ Downloaded' : 'Download PNG'}
      </button>
    </div>
  );
};

export default QRGenerator;