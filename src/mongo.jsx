import React, { useState, useRef, useEffect } from "react";

// ----------------- Utilities -----------------
const REDUNDANCY = 3;

// Generate random MongoDB ObjectId
const generateObjectId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

// Generate sample product data for a MongoDB ObjectId
const generateProductData = (oid) => {
  const materials = ["Steel", "Aluminum", "Plastic", "Carbon Fiber", "Titanium", "Copper", "Brass"];
  const manufacturers = ["TechCorp", "IndustrialWorks", "PrecisionMfg", "GlobalParts", "QualityGoods"];
  
  const seed = parseInt(oid.slice(0, 8), 16);
  const materialIndex = seed % materials.length;
  const manufacturerIndex = Math.floor(seed / 1000) % manufacturers.length;
  
  const baseDate = new Date('2020-01-01');
  const randomDays = (seed % 1000) + 200;
  const manufactureDate = new Date(baseDate.getTime() + randomDays * 24 * 60 * 60 * 1000);
  
  return {
    productId: oid,
    material: materials[materialIndex],
    manufacturer: manufacturers[manufacturerIndex],
    manufactureDate: manufactureDate.toLocaleDateString(),
    batchNumber: `BT${(seed % 9999).toString().padStart(4, '0')}`,
    quality: seed % 2 === 0 ? "Grade A" : "Grade B",
    weight: `${((seed % 50) + 10) / 10}kg`
  };
};

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

// Encode ObjectId to grid
const encodeObjectId = (oid) => {
  const hexStr = oid;
  const bits = textToBits(hexStr);
  
  const expandedBits = [];
  for (let bit of bits) {
    for (let i = 0; i < REDUNDANCY; i++) {
      expandedBits.push(bit);
    }
  }
  
  const totalNeeded = expandedBits.length + 4;
  const gridSize = Math.ceil(Math.sqrt(totalNeeded));
  
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill('/'));
  
  // Orientation corners
  grid[0][0] = '\\';
  grid[0][gridSize - 1] = '\\';
  grid[gridSize - 1][0] = '\\';
  grid[gridSize - 1][gridSize - 1] = '\\';
  
  // Fill grid
  let idx = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if ((i === 0 && j === 0) || 
          (i === 0 && j === gridSize - 1) || 
          (i === gridSize - 1 && j === 0) || 
          (i === gridSize - 1 && j === gridSize - 1)) {
        continue;
      }
      if (idx < expandedBits.length) {
        grid[i][j] = expandedBits[idx] === 1 ? '\\' : '/';
        idx++;
      }
    }
  }
  
  return { grid, length: hexStr.length };
};

// Decode grid
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

// Convert grid to text
const gridToText = (grid) => {
  return grid.map(row => row.join('')).join('\n');
};

// Enhanced image processing for green line detection
const detectGridFromImage = (imageData, width, height, expectedSize) => {
  // Detect grid size automatically if not provided
  if (!expectedSize) {
    expectedSize = detectGridSize(imageData, width, height);
    if (!expectedSize) return null;
  }

  const cellSize = Math.floor(Math.min(width, height) / expectedSize);
  if (cellSize < 3) return null;
  
  // Find grid boundaries using corner detection
  const boundaries = findGridBoundaries(imageData, width, height, expectedSize);
  if (!boundaries) return null;
  
  const { startX, startY, gridWidth, gridHeight } = boundaries;
  const actualCellSizeX = gridWidth / expectedSize;
  const actualCellSizeY = gridHeight / expectedSize;
  
  const detectedGrid = [];
  for (let i = 0; i < expectedSize; i++) {
    const row = [];
    for (let j = 0; j < expectedSize; j++) {
      const centerX = startX + j * actualCellSizeX + actualCellSizeX / 2;
      const centerY = startY + i * actualCellSizeY + actualCellSizeY / 2;
      
      // Sample multiple points along potential line directions
      const isBackslash = detectLinePattern(imageData, width, height, centerX, centerY, 
                                           actualCellSizeX * 0.4, true); // \ direction
      const isSlash = detectLinePattern(imageData, width, height, centerX, centerY, 
                                       actualCellSizeX * 0.4, false); // / direction
      
      // Determine which pattern is stronger
      if (isBackslash && !isSlash) {
        row.push('\\');
      } else if (isSlash && !isBackslash) {
        row.push('/');
      } else {
        // Fallback to brightness detection
        const brightness = getAreaBrightness(imageData, width, height, 
                                           centerX, centerY, actualCellSizeX * 0.3);
        row.push(brightness < 128 ? '\\' : '/');
      }
    }
    detectedGrid.push(row);
  }
  
  return detectedGrid;
};

// Detect grid size by finding the pattern repetition
const detectGridSize = (imageData, width, height) => {
  const edgeMap = detectEdges(imageData, width, height);
  
  // Look for repeating patterns in the edge density
  const horizontalProjection = new Array(height).fill(0);
  const verticalProjection = new Array(width).fill(0);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edgeMap[y * width + x] > 0) {
        horizontalProjection[y]++;
        verticalProjection[x]++;
      }
    }
  }
  
  // Find peaks in projections to estimate grid size
  const hPeaks = findPeaks(horizontalProjection);
  const vPeaks = findPeaks(verticalProjection);
  
  if (hPeaks.length < 3 || vPeaks.length < 3) return 7; // Default fallback
  
  const estimatedSize = Math.min(hPeaks.length, vPeaks.length) - 1;
  return Math.max(5, Math.min(15, estimatedSize)); // Reasonable grid size range
};

// Find grid boundaries using corner detection
const findGridBoundaries = (imageData, width, height, expectedSize) => {
  const corners = findCorners(imageData, width, height);
  
  if (corners.length < 4) {
    // Fallback: assume centered grid
    const gridSizePixels = Math.min(width, height) * 0.7;
    return {
      startX: (width - gridSizePixels) / 2,
      startY: (height - gridSizePixels) / 2,
      gridWidth: gridSizePixels,
      gridHeight: gridSizePixels
    };
  }
  
  // Use the four extreme corners
  const left = Math.min(...corners.map(c => c.x));
  const right = Math.max(...corners.map(c => c.x));
  const top = Math.min(...corners.map(c => c.y));
  const bottom = Math.max(...corners.map(c => c.y));
  
  return {
    startX: left,
    startY: top,
    gridWidth: right - left,
    gridHeight: bottom - top
  };
};

// Detect line patterns (green lines specifically)
const detectLinePattern = (imageData, width, height, centerX, centerY, radius, isBackslash) => {
  let greenCount = 0;
  let totalCount = 0;
  const samples = 20;
  
  for (let t = 0; t < samples; t++) {
    const angle = isBackslash ? Math.PI / 4 : -Math.PI / 4;
    const distance = (t / samples) * radius * 2 - radius;
    
    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);
    
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const idx = Math.floor(y) * width + Math.floor(x);
      const pixelIdx = idx * 4;
      
      const r = imageData[pixelIdx];
      const g = imageData[pixelIdx + 1];
      const b = imageData[pixelIdx + 2];
      
      // Check for green dominance (typical in monochrome displays with green text)
      if (g > r * 1.2 && g > b * 1.2 && g > 100) {
        greenCount++;
      }
      totalCount++;
    }
  }
  
  return greenCount / totalCount > 0.3; // At least 30% green pixels along the line
};

// Helper functions
const detectEdges = (imageData, width, height) => {
  const grayscale = [];
  for (let i = 0; i < imageData.length; i += 4) {
    const gray = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
    grayscale.push(gray);
  }
  
  const edges = new Array(grayscale.length).fill(0);
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const weightX = sobelX[(ky + 1) * 3 + (kx + 1)];
          const weightY = sobelY[(ky + 1) * 3 + (kx + 1)];
          gx += grayscale[idx] * weightX;
          gy += grayscale[idx] * weightY;
        }
      }
      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  return edges;
};

const findPeaks = (signal, threshold = 0.3) => {
  const maxVal = Math.max(...signal);
  const minVal = Math.min(...signal);
  const range = maxVal - minVal;
  const actualThreshold = minVal + range * threshold;
  
  const peaks = [];
  for (let i = 1; i < signal.length - 1; i++) {
    if (signal[i] > actualThreshold && signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
      peaks.push(i);
    }
  }
  return peaks;
};

const findCorners = (imageData, width, height) => {
  const edges = detectEdges(imageData, width, height);
  const cornerThreshold = 50;
  const corners = [];
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (edges[y * width + x] > cornerThreshold) {
        // Simple corner detection - look for edge intersections
        let edgeCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (edges[(y + dy) * width + (x + dx)] > cornerThreshold / 2) {
              edgeCount++;
            }
          }
        }
        if (edgeCount >= 4) { // Corner-like pattern
          corners.push({ x, y });
        }
      }
    }
  }
  
  return corners;
};

const getAreaBrightness = (imageData, width, height, centerX, centerY, radius) => {
  let sum = 0;
  let count = 0;
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = Math.round(centerX + dx);
      const y = Math.round(centerY + dy);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4;
        const brightness = 0.299 * imageData[idx] + 0.587 * imageData[idx + 1] + 0.114 * imageData[idx + 2];
        sum += brightness;
        count++;
      }
    }
  }
  
  return count > 0 ? sum / count : 255;
};

// ----------------- React Component -----------------
const MongoTextGrid = () => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [oid, setOid] = useState(generateObjectId());
  const [gridData, setGridData] = useState(null);
  const [gridText, setGridText] = useState('');
  const [productData, setProductData] = useState(null);
  const [decodedId, setDecodedId] = useState(null);
  const [decodedProductData, setDecodedProductData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [detectionInfo, setDetectionInfo] = useState('');

  useEffect(() => {
    const { grid, length } = encodeObjectId(oid);
    setGridData({ grid, length });
    setGridText(gridToText(grid));
    setProductData(generateProductData(oid));
  }, [oid]);

  const generateNew = () => {
    setOid(generateObjectId());
    setDecodedId(null);
    setDecodedProductData(null);
    setDetectionInfo('');
  };

  const handleDecode = (decodedOid, info = '') => {
    setDecodedId(decodedOid);
    setDetectionInfo(info);
    if (decodedOid && decodedOid.length === 24) {
      setDecodedProductData(generateProductData(decodedOid));
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
      setDetectionInfo('Camera started - point at the grid pattern');
    } catch (error) {
      alert("Could not access camera: " + error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
    setDetectionInfo('');
  };

  const scanFromCamera = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const detectedGrid = detectGridFromImage(imageData.data, canvas.width, canvas.height);
    
    if (detectedGrid) {
      try {
        const gridSize = detectedGrid.length;
        const decoded = decodeGrid(detectedGrid, 24); // ObjectId is always 24 chars
        handleDecode(decoded, `Detected ${gridSize}×${gridSize} grid with green line analysis`);
      } catch (error) {
        console.error('Decode error:', error);
        alert("Could not decode the detected pattern");
      }
    } else {
      alert("Could not detect grid pattern in image");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detectedGrid = detectGridFromImage(imageData.data, canvas.width, canvas.height);

      if (detectedGrid) {
        try {
          const gridSize = detectedGrid.length;
          const decoded = decodeGrid(detectedGrid, 24);
          handleDecode(decoded, `Detected ${gridSize}×${gridSize} grid from uploaded image`);
        } catch (error) {
          console.error('Decode error:', error);
          alert("Could not decode the detected pattern");
        }
      } else {
        alert("Could not detect grid pattern in uploaded image");
      }
    };

    img.src = URL.createObjectURL(file);
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px', color: '#333' }}>
        MongoDB ObjectId Text Grid Decoder (Green Line Detection)
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* Generator Section */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '2px solid #dee2e6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center', color: '#495057' }}>
            Text Grid Pattern
          </h2>
          
          <div style={{ 
            backgroundColor: '#1a1a1a', 
            color: '#00ff00', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: '3px solid #333',
            fontFamily: 'Courier, monospace',
            fontSize: '12px',
            lineHeight: '1',
            textAlign: 'center',
            overflow: 'auto'
          }}>
            <pre style={{ margin: 0, whiteSpace: 'pre' }}>{gridText}</pre>
          </div>
          
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            <p style={{ margin: '4px 0' }}>Grid Size: {gridData?.grid.length}×{gridData?.grid.length}</p>
            <p style={{ margin: '4px 0' }}>ObjectId: <span style={{ fontFamily: 'Courier, monospace', fontSize: '12px' }}>{oid}</span></p>
          </div>
          
          <button 
            onClick={generateNew}
            style={{
              width: '100%',
              backgroundColor: '#007bff',
              color: 'white',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Generate New ObjectId
          </button>

          {productData && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1565c0' }}>
                Product Information
              </h3>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <p style={{ margin: '4px 0' }}><strong>Material:</strong> {productData.material}</p>
                <p style={{ margin: '4px 0' }}><strong>Manufacturer:</strong> {productData.manufacturer}</p>
                <p style={{ margin: '4px 0' }}><strong>Manufacture Date:</strong> {productData.manufactureDate}</p>
                <p style={{ margin: '4px 0' }}><strong>Batch Number:</strong> {productData.batchNumber}</p>
                <p style={{ margin: '4px 0' }}><strong>Quality:</strong> {productData.quality}</p>
                <p style={{ margin: '4px 0' }}><strong>Weight:</strong> {productData.weight}</p>
              </div>
            </div>
          )}
        </div>

        {/* Decoder Section */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '2px solid #dee2e6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center', color: '#495057' }}>
            Green Line Grid Decoder
          </h2>
          
          {detectionInfo && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#d1ecf1', 
              border: '1px solid #bee5eb',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#0c5460'
            }}>
              {detectionInfo}
            </div>
          )}
          
          {/* Camera Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
              Camera Scanner
            </h3>
            <div style={{ 
              backgroundColor: '#e9ecef', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '12px',
              border: '1px solid #ced4da'
            }}>
              {isScanning ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline
                  style={{ 
                    width: '100%', 
                    height: '200px', 
                    objectFit: 'cover', 
                    border: '1px solid #ccc', 
                    borderRadius: '4px' 
                  }}
                />
              ) : (
                <div style={{ 
                  width: '100%', 
                  height: '200px', 
                  backgroundColor: '#d1ecf1', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '1px solid #bee5eb', 
                  borderRadius: '4px',
                  color: '#0c5460'
                }}>
                  Camera not active
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!isScanning ? (
                <button 
                  onClick={startCamera}
                  style={{
                    flex: 1,
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '10px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button 
                    onClick={scanFromCamera}
                    style={{
                      flex: 1,
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Scan Green Lines
                  </button>
                  <button 
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      backgroundColor: '#dc3545',
                      color: 'white',
                      padding: '10px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>
          </div>

          {/* File Upload Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
              Upload Image
            </h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px dashed #6c757d',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Decode Results */}
          {decodedId && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: decodedId === oid ? '#d4edda' : '#f8d7da',
              border: decodedId === oid ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: decodedId === oid ? '#155724' : '#721c24'
              }}>
                Decoded Result
              </h3>
              <p style={{ 
                fontFamily: 'Courier, monospace', 
                fontSize: '12px', 
                backgroundColor: 'white', 
                padding: '8px', 
                borderRadius: '4px',
                margin: '8px 0',
                wordBreak: 'break-all'
              }}>
                {decodedId}
              </p>
              <p style={{ 
                fontSize: '14px', 
                margin: '8px 0',
                color: decodedId === oid ? '#155724' : '#721c24'
              }}>
                {decodedId === oid ? "✅ Perfect Match!" : "❌ Different ObjectId"}
              </p>
              
              {decodedProductData && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: 'rgba(255,255,255,0.8)', 
                  borderRadius: '4px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                    Product Details
                  </h4>
                  <div style={{ fontSize: '13px', color: '#333' }}>
                    <p style={{ margin: '2px 0' }}><strong>Material:</strong> {decodedProductData.material}</p>
                    <p style={{ margin: '2px 0' }}><strong>Manufacturer:</strong> {decodedProductData.manufacturer}</p>
                    <p style={{ margin: '2px 0' }}><strong>Manufacture Date:</strong> {decodedProductData.manufactureDate}</p>
                    <p style={{ margin: '2px 0' }}><strong>Batch:</strong> {decodedProductData.batchNumber}</p>
                    <p style={{ margin: '2px 0' }}><strong>Quality:</strong> {decodedProductData.quality}</p>
                    <p style={{ margin: '2px 0' }}><strong>Weight:</strong> {decodedProductData.weight}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#856404' }}>
          Green Line Detection Algorithm
        </h3>
        <div style={{ fontSize: '14px', color: '#856404' }}>
          <p><strong>How it works:</strong></p>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Detects grid boundaries using corner detection</li>
            <li>Samples pixels along \ and / directions looking for green dominance</li>
            <li>Uses edge detection to find pattern repetition</li>
            <li>Applies majority voting for error correction</li>
            <li>Works best with high-contrast green-on-black displays</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MongoTextGrid;