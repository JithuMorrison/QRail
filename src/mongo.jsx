import React, { useState, useRef, useEffect } from "react";

// ----------------- Utilities -----------------
const REDUNDANCY = 3;
const EXPECTED_GRID_SIZE = 18; // Fixed grid size

// Predefined MongoDB ObjectIds with their data
const PREDEFINED_PRODUCTS = {
  "507f1f77bcf86cd799439011": {
    productId: "507f1f77bcf86cd799439011",
    material: "Titanium Alloy",
    manufacturer: "AeroSpace Industries",
    manufactureDate: "2023-01-15",
    batchNumber: "AS2301",
    quality: "Grade A+",
    weight: "2.3kg",
    category: "Aircraft Components",
    location: "Facility A - Bay 12"
  },
  "507f191e810c19729de860ea": {
    productId: "507f191e810c19729de860ea",
    material: "Carbon Fiber",
    manufacturer: "TechCorp Advanced",
    manufactureDate: "2023-02-20",
    batchNumber: "TC2302",
    quality: "Grade A",
    weight: "1.8kg",
    category: "Automotive Parts",
    location: "Facility B - Section 5"
  },
  "65f3b4a1234567890abcdef0": {
    productId: "65f3b4a1234567890abcdef0",
    material: "Stainless Steel",
    manufacturer: "Industrial Works Ltd",
    manufactureDate: "2023-03-10",
    batchNumber: "IW2303",
    quality: "Grade B+",
    weight: "5.2kg",
    category: "Marine Equipment",
    location: "Facility C - Dock 3"
  },
  "65f3b4b2345678901bcdef01": {
    productId: "65f3b4b2345678901bcdef01",
    material: "Aluminum 6061",
    manufacturer: "Precision Manufacturing",
    manufactureDate: "2023-04-05",
    batchNumber: "PM2304",
    quality: "Grade A",
    weight: "3.1kg",
    category: "Electronics Housing",
    location: "Facility D - Clean Room 2"
  },
  "65f3b4c3456789012cdef012": {
    productId: "65f3b4c3456789012cdef012",
    material: "Copper Alloy",
    manufacturer: "Electrical Components Co",
    manufactureDate: "2023-05-12",
    batchNumber: "EC2305",
    quality: "Grade A-",
    weight: "4.7kg",
    category: "Power Systems",
    location: "Facility E - Assembly Line 1"
  }
};

// Generate random MongoDB ObjectId
const generateObjectId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

// Get a random predefined ObjectId
const getRandomPredefinedId = () => {
  const ids = Object.keys(PREDEFINED_PRODUCTS);
  return ids[Math.floor(Math.random() * ids.length)];
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
  
  // Fixed 18x18 grid
  const gridSize = EXPECTED_GRID_SIZE;
  const totalCells = gridSize * gridSize;
  const dataCells = totalCells - 4; // Minus 4 corner markers
  
  // Check if data fits in 18x18 grid
  if (expandedBits.length > dataCells) {
    console.warn(`Too many bits for ${gridSize}x${gridSize} grid. Truncating.`);
  }
  
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

// Convert grid to text
const gridToText = (grid) => {
  return grid.map(row => row.join('')).join('\n');
};

// Enhanced image processing for 18x18 grid detection
const detectGridFromImage = (imageData, width, height) => {
  const expectedSize = EXPECTED_GRID_SIZE;
  
  // Step 1: Preprocess image to enhance contrast
  const enhancedData = enhanceContrast(imageData, width, height);
  
  // Step 2: Find grid boundaries using corner detection
  const boundaries = findGridBoundaries(enhancedData, width, height, expectedSize);
  if (!boundaries) {
    console.log('Could not find grid boundaries');
    return null;
  }
  
  const { startX, startY, gridWidth, gridHeight } = boundaries;
  const cellSizeX = gridWidth / expectedSize;
  const cellSizeY = gridHeight / expectedSize;
  
  console.log(`Grid detected at (${startX}, ${startY}) size ${gridWidth}x${gridHeight}, cell size: ${cellSizeX.toFixed(1)}x${cellSizeY.toFixed(1)}`);
  
  // Step 3: Detect each cell pattern
  const detectedGrid = [];
  for (let i = 0; i < expectedSize; i++) {
    const row = [];
    for (let j = 0; j < expectedSize; j++) {
      const cellCenterX = startX + j * cellSizeX + cellSizeX / 2;
      const cellCenterY = startY + i * cellSizeY + cellSizeY / 2;
      
      // Skip corner markers (they should be \)
      if ((i === 0 && j === 0) || 
          (i === 0 && j === expectedSize - 1) || 
          (i === expectedSize - 1 && j === 0) || 
          (i === expectedSize - 1 && j === expectedSize - 1)) {
        row.push('\\');
        continue;
      }
      
      // Analyze cell content
      const pattern = analyzeCellPattern(enhancedData, width, height, cellCenterX, cellCenterY, cellSizeX, cellSizeY);
      row.push(pattern);
    }
    detectedGrid.push(row);
  }
  
  return detectedGrid;
};

// Enhance image contrast for better detection
const enhanceContrast = (imageData, width, height) => {
  const enhanced = new Uint8ClampedArray(imageData.length);
  
  // Find min and max values for contrast stretching
  let min = 255, max = 0;
  for (let i = 0; i < imageData.length; i += 4) {
    const gray = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
    if (gray < min) min = gray;
    if (gray > max) max = gray;
  }
  
  // Apply contrast stretching
  const range = max - min || 1;
  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    
    // Convert to grayscale with green emphasis
    const gray = (0.1 * r + 0.8 * g + 0.1 * b);
    const stretched = Math.min(255, Math.max(0, ((gray - min) * 255) / range));
    
    enhanced[i] = stretched;
    enhanced[i + 1] = stretched;
    enhanced[i + 2] = stretched;
    enhanced[i + 3] = 255;
  }
  
  return enhanced;
};

// Find grid boundaries for 18x18 grid
const findGridBoundaries = (imageData, width, height, expectedSize) => {
  // Convert to grayscale for processing
  const grayscale = [];
  for (let i = 0; i < imageData.length; i += 4) {
    grayscale.push(imageData[i]); // Use red channel (already grayscale from enhancement)
  }
  
  // Use Hough-like transform to find grid lines
  const horizontalLines = findLines(grayscale, width, height, 'horizontal');
  const verticalLines = findLines(grayscale, width, height, 'vertical');
  
  if (horizontalLines.length < expectedSize || verticalLines.length < expectedSize) {
    console.log(`Not enough lines found: ${horizontalLines.length} horizontal, ${verticalLines.length} vertical`);
    return findGridByCorners(grayscale, width, height, expectedSize);
  }
  
  // Take the strongest expectedSize lines
  const strongHorizontal = horizontalLines.slice(0, expectedSize).sort((a, b) => a - b);
  const strongVertical = verticalLines.slice(0, expectedSize).sort((a, b) => a - b);
  
  const startY = strongHorizontal[0];
  const endY = strongHorizontal[strongHorizontal.length - 1];
  const startX = strongVertical[0];
  const endX = strongVertical[strongVertical.length - 1];
  
  return {
    startX: startX,
    startY: startY,
    gridWidth: endX - startX,
    gridHeight: endY - startY
  };
};

// Find lines using projection method
const findLines = (grayscale, width, height, direction) => {
  const projection = direction === 'horizontal' ? 
    new Array(height).fill(0) : new Array(width).fill(0);
  
  // Create projection
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const value = 255 - grayscale[idx]; // Invert: dark lines have high values
      
      if (direction === 'horizontal') {
        projection[y] += value;
      } else {
        projection[x] += value;
      }
    }
  }
  
  // Find peaks in projection
  const peaks = findStrongPeaks(projection, direction === 'horizontal' ? height / EXPECTED_GRID_SIZE : width / EXPECTED_GRID_SIZE);
  return peaks;
};

// Find strong peaks with minimum distance
const findStrongPeaks = (signal, minDistance) => {
  const peaks = [];
  const smoothed = smoothSignal(signal, 3);
  
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
      // Check if this peak is far enough from previous peaks
      if (peaks.every(peak => Math.abs(peak - i) >= minDistance)) {
        peaks.push(i);
      }
    }
  }
  
  // Sort by strength and return top EXPECTED_GRID_SIZE peaks
  return peaks
    .map(idx => ({ idx, value: smoothed[idx] }))
    .sort((a, b) => b.value - a.value)
    .map(item => item.idx)
    .slice(0, EXPECTED_GRID_SIZE);
};

// Smooth signal using moving average
const smoothSignal = (signal, windowSize) => {
  const smoothed = new Array(signal.length);
  const halfWindow = Math.floor(windowSize / 2);
  
  for (let i = 0; i < signal.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - halfWindow); j <= Math.min(signal.length - 1, i + halfWindow); j++) {
      sum += signal[j];
      count++;
    }
    smoothed[i] = sum / count;
  }
  
  return smoothed;
};

// Fallback method: find grid by detecting corners
const findGridByCorners = (grayscale, width, height, expectedSize) => {
  // Simple center-based detection as fallback
  const gridSizePixels = Math.min(width, height) * 0.6;
  return {
    startX: (width - gridSizePixels) / 2,
    startY: (height - gridSizePixels) / 2,
    gridWidth: gridSizePixels,
    gridHeight: gridSizePixels
  };
};

// Analyze individual cell pattern
const analyzeCellPattern = (imageData, width, height, centerX, centerY, cellWidth, cellHeight) => {
  const radius = Math.min(cellWidth, cellHeight) * 0.3;
  
  // Sample points along backslash direction (\)
  let backslashScore = 0;
  let slashScore = 0;
  const samples = 16;
  
  for (let t = 0; t < samples; t++) {
    const progress = (t / (samples - 1)) * 2 - 1; // -1 to 1
    
    // Backslash direction points
    const bx = centerX + progress * radius;
    const by = centerY + progress * radius;
    
    // Slash direction points
    const sx = centerX + progress * radius;
    const sy = centerY - progress * radius;
    
    // Sample backslash line
    if (bx >= 0 && bx < width && by >= 0 && by < height) {
      const bidx = (Math.floor(by) * width + Math.floor(bx)) * 4;
      const brightness = imageData[bidx];
      backslashScore += (255 - brightness); // Darker pixels score higher
    }
    
    // Sample slash line
    if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
      const sidx = (Math.floor(sy) * width + Math.floor(sx)) * 4;
      const brightness = imageData[sidx];
      slashScore += (255 - brightness);
    }
  }
  
  // Determine which pattern is stronger
  const totalPossible = samples * 255;
  const backslashStrength = backslashScore / totalPossible;
  const slashStrength = slashScore / totalPossible;
  
  // Use threshold to decide
  if (backslashStrength > 0.3 && backslashStrength > slashStrength * 1.2) {
    return '\\';
  } else if (slashStrength > 0.3 && slashStrength > backslashStrength * 1.2) {
    return '/';
  } else {
    // Default to slash for ambiguous cases
    return '/';
  }
};

// ----------------- React Component -----------------
const MongoTextGrid = () => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [oid, setOid] = useState('');
  const [gridData, setGridData] = useState(null);
  const [gridText, setGridText] = useState('');
  const [decodedId, setDecodedId] = useState(null);
  const [decodedProductData, setDecodedProductData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [detectionInfo, setDetectionInfo] = useState('');

  // Generate a new ObjectId (either random or predefined)
  const generateNew = (usePredefined = false) => {
    const newId = usePredefined ? getRandomPredefinedId() : generateObjectId();
    setOid(newId);
    setDecodedId(null);
    setDecodedProductData(null);
    setDetectionInfo('');
    setGridData(null);
    setGridText('');
  };

  // Generate grid for the current ObjectId
  const generateGrid = () => {
    if (!oid || oid.length !== 24) {
      alert('Please enter or generate a valid 24-character MongoDB ObjectId');
      return;
    }
    
    const { grid, length } = encodeObjectId(oid);
    setGridData({ grid, length });
    setGridText(gridToText(grid));
  };

  // Get product data for an ObjectId
  const getProductData = (objectId) => {
    return PREDEFINED_PRODUCTS[objectId] || null;
  };

  const handleDecode = (decodedOid, info = '') => {
    setDecodedId(decodedOid);
    setDetectionInfo(info);
    if (decodedOid && decodedOid.length === 24) {
      const productData = getProductData(decodedOid);
      setDecodedProductData(productData);
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
      setDetectionInfo('Camera started - point at the 18x18 grid pattern');
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
        const decoded = decodeGrid(detectedGrid, 24);
        handleDecode(decoded, `Successfully detected and decoded 18x18 grid pattern`);
        
        // Log the detected grid for debugging
        console.log('Detected grid pattern:');
        detectedGrid.forEach(row => console.log(row.join('')));
      } catch (error) {
        console.error('Decode error:', error);
        alert("Could not decode the detected pattern");
      }
    } else {
      alert("Could not detect 18x18 grid pattern in image");
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
          const decoded = decodeGrid(detectedGrid, 24);
          handleDecode(decoded, `Successfully detected 18x18 grid from uploaded image`);
        } catch (error) {
          console.error('Decode error:', error);
          alert("Could not decode the detected pattern");
        }
      } else {
        alert("Could not detect 18x18 grid pattern in uploaded image");
      }
    };

    img.src = URL.createObjectURL(file);
  };

  // Get current product data
  const currentProductData = getProductData(oid);

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px', color: '#333' }}>
        MongoDB ObjectId 18×18 Grid Decoder
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* Generator Section */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '2px solid #dee2e6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center', color: '#495057' }}>
            18×18 Grid Generator
          </h2>
          
          {/* ObjectId Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
              MongoDB ObjectId:
            </label>
            <input
              type="text"
              value={oid}
              onChange={(e) => setOid(e.target.value)}
              placeholder="Enter 24-character ObjectId or generate one"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontFamily: 'Courier, monospace',
                fontSize: '12px'
              }}
            />
          </div>
          
          {/* Generate Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => generateNew(false)}
              style={{
                flex: 1,
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Random ID
            </button>
            <button 
              onClick={() => generateNew(true)}
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
              Sample ID
            </button>
            <button 
              onClick={generateGrid}
              style={{
                flex: 1,
                backgroundColor: '#007bff',
                color: 'white',
                padding: '10px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Generate Grid
            </button>
          </div>

          {/* Grid Display */}
          {gridText && (
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              color: '#00ff00', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '3px solid #333',
              fontFamily: 'Courier, monospace',
              fontSize: '10px', // Smaller font for 18x18 grid
              lineHeight: '1',
              textAlign: 'center',
              overflow: 'auto',
              maxHeight: '400px'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre' }}>{gridText}</pre>
            </div>
          )}
          
          {gridData && (
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              <p style={{ margin: '4px 0' }}>Grid Size: 18×18 (Fixed)</p>
              <p style={{ margin: '4px 0' }}>ObjectId: <span style={{ fontFamily: 'Courier, monospace', fontSize: '12px' }}>{oid}</span></p>
            </div>
          )}

          {/* Product Information */}
          {currentProductData && gridText && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#e3f2fd', 
              borderRadius: '8px',
              border: '1px solid #bbdefb'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1565c0' }}>
                📦 Product Information
              </h3>
              <div style={{ fontSize: '14px', color: '#333' }}>
                <p style={{ margin: '4px 0' }}><strong>Material:</strong> {currentProductData.material}</p>
                <p style={{ margin: '4px 0' }}><strong>Manufacturer:</strong> {currentProductData.manufacturer}</p>
                <p style={{ margin: '4px 0' }}><strong>Manufacture Date:</strong> {currentProductData.manufactureDate}</p>
                <p style={{ margin: '4px 0' }}><strong>Batch Number:</strong> {currentProductData.batchNumber}</p>
                <p style={{ margin: '4px 0' }}><strong>Quality:</strong> {currentProductData.quality}</p>
                <p style={{ margin: '4px 0' }}><strong>Weight:</strong> {currentProductData.weight}</p>
                <p style={{ margin: '4px 0' }}><strong>Category:</strong> {currentProductData.category}</p>
                <p style={{ margin: '4px 0' }}><strong>Location:</strong> {currentProductData.location}</p>
              </div>
            </div>
          )}

          {/* Show predefined IDs info */}
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#856404' }}>
              Available Sample IDs:
            </h4>
            <div style={{ fontSize: '12px', color: '#856404' }}>
              {Object.keys(PREDEFINED_PRODUCTS).map((id, index) => (
                <div key={id} style={{ marginBottom: '2px' }}>
                  <code style={{ backgroundColor: 'rgba(255,255,255,0.5)', padding: '1px 4px', borderRadius: '2px' }}>
                    {id}
                  </code>
                  <span style={{ marginLeft: '8px', fontSize: '11px' }}>
                    ({PREDEFINED_PRODUCTS[id].category})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decoder Section */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '2px solid #dee2e6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center', color: '#495057' }}>
            18×18 Grid Decoder
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
              📷 Camera Scanner
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
                    Scan 18×18 Grid
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
              📁 Upload Image
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
              backgroundColor: decodedProductData ? '#d4edda' : '#f8d7da',
              border: decodedProductData ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: decodedProductData ? '#155724' : '#721c24'
              }}>
                🔍 Decoded Result
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
                color: decodedProductData ? '#155724' : '#721c24'
              }}>
                {decodedProductData ? "✅ Found in Database!" : "❌ Unknown ObjectId"}
              </p>
              
              {decodedProductData && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: 'rgba(255,255,255,0.8)', 
                  borderRadius: '4px'
                }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                    📦 Product Details
                  </h4>
                  <div style={{ fontSize: '13px', color: '#333' }}>
                    <p style={{ margin: '2px 0' }}><strong>Material:</strong> {decodedProductData.material}</p>
                    <p style={{ margin: '2px 0' }}><strong>Manufacturer:</strong> {decodedProductData.manufacturer}</p>
                    <p style={{ margin: '2px 0' }}><strong>Manufacture Date:</strong> {decodedProductData.manufactureDate}</p>
                    <p style={{ margin: '2px 0' }}><strong>Batch:</strong> {decodedProductData.batchNumber}</p>
                    <p style={{ margin: '2px 0' }}><strong>Quality:</strong> {decodedProductData.quality}</p>
                    <p style={{ margin: '2px 0' }}><strong>Weight:</strong> {decodedProductData.weight}</p>
                    <p style={{ margin: '2px 0' }}><strong>Category:</strong> {decodedProductData.category}</p>
                    <p style={{ margin: '2px 0' }}><strong>Location:</strong> {decodedProductData.location}</p>
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
          🔧 How It Works
        </h3>
        <div style={{ fontSize: '14px', color: '#856404' }}>
          <p><strong>Grid Generation:</strong> Enter or generate a MongoDB ObjectId, then click "Generate Grid" to create the 18×18 pattern.</p>
          <p><strong>Predefined Database:</strong> Use "Sample ID" to get ObjectIds that exist in our sample database with full product information.</p>
          <p><strong>Detection Algorithm:</strong> The scanner is specially tuned for 18×18 grids with enhanced contrast stretching, line projection analysis, and individual cell pattern detection.</p>
          <p style={{ marginTop: '8px', fontStyle: 'italic' }}>
            Works best with clear, high-contrast images of the 18×18 grid pattern. Try scanning one of the sample IDs to see full product data retrieval!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MongoTextGrid;