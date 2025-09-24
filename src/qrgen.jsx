// Same QR generation utilities as in your original code, but optimized for white background

const downloadGridAsImage = (grid, filename = 'grid.png') => {
  const gridSize = grid.length;
  const cellSize = 20; // Smaller cells for denser QR
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
  ctx.lineWidth = 3; // Thicker lines for better visibility
  ctx.lineCap = 'round';
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = padding + j * cellSize;
      const y = padding + i * cellSize;
      const margin = 2; // Reduced margin for denser pattern
      
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

// Export all the original QR functions along with the optimized download function
export {
  // ... all your original functions ...
  downloadGridAsImage,
  // ... other functions ...
};