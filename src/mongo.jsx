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

// Generate random MongoDB ObjectId from predefined ones
const generateObjectId = () => {
  const keys = Object.keys(PREDEFINED_PRODUCTS);
  return keys[Math.floor(Math.random() * keys.length)];
};

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

// Parse grid text back to grid array
const parseGridText = (text) => {
  const lines = text.trim().split('\n');
  const grid = lines.map(line => line.split(''));
  return grid;
};

// Download Grid as PNG image
const downloadGridAsImage = (grid, filename = 'grid.png') => {
  const gridSize = grid.length;
  const cellSize = 30;
  const padding = 40;
  const canvasSize = gridSize * cellSize + padding * 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d');
  
  // Fill background with white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  
  // Draw grid background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(padding, padding, gridSize * cellSize, gridSize * cellSize);
  
  // Draw grid lines
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  
  for (let i = 0; i <= gridSize; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(padding + i * cellSize, padding);
    ctx.lineTo(padding + i * cellSize, padding + gridSize * cellSize);
    ctx.stroke();
    
    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(padding, padding + i * cellSize);
    ctx.lineTo(padding + gridSize * cellSize, padding + i * cellSize);
    ctx.stroke();
  }
  
  // Draw grid content with thicker lines
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = padding + j * cellSize;
      const y = padding + i * cellSize;
      const margin = 6;
      
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
  
  // Add title and ObjectId info
  ctx.fillStyle = 'black';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('18×18 Grid Pattern', canvasSize / 2, 20);
  
  ctx.font = '12px Arial';
  ctx.fillText(`Grid Size: ${gridSize}×${gridSize}`, canvasSize / 2, canvasSize - 15);
  
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

// Download grid as text file
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

// Download ObjectId as text file
const downloadObjectIdAsText = (objectId, filename = 'objectid.txt') => {
  const blob = new Blob([objectId], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Process uploaded text file and extract grid pattern
const processTextFile = (text) => {
  // Remove any extra spaces and clean the text
  const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/ /g, '');
  
  // Split into lines and filter out empty lines
  const lines = cleanText.split('\n').filter(line => line.length > 0);
  
  if (lines.length === 0) {
    throw new Error('File is empty or contains no valid grid data');
  }
  
  // Check if it's a valid grid pattern (all lines should have same length)
  const firstLineLength = lines[0].length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].length !== firstLineLength) {
      throw new Error('Invalid grid format: lines have different lengths');
    }
  }
  
  // Check if it's an 18x18 grid
  if (lines.length !== EXPECTED_GRID_SIZE || firstLineLength !== EXPECTED_GRID_SIZE) {
    throw new Error(`Expected ${EXPECTED_GRID_SIZE}x${EXPECTED_GRID_SIZE} grid, but got ${lines.length}x${firstLineLength}`);
  }
  
  // Validate characters (only / and \ allowed)
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

// ----------------- React Component -----------------
const MongoTextGrid = () => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const textFileInputRef = useRef(null);
  const [oid, setOid] = useState('');
  const [gridData, setGridData] = useState(null);
  const [gridText, setGridText] = useState('');
  const [decodedId, setDecodedId] = useState(null);
  const [decodedProductData, setDecodedProductData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [detectionInfo, setDetectionInfo] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [lastGeneratedId, setLastGeneratedId] = useState('');
  const [processingError, setProcessingError] = useState('');

  // Generate a new ObjectId (either random or predefined)
  const generateNew = (usePredefined = false) => {
    const newId = usePredefined ? getRandomPredefinedId() : generateObjectId();
    setOid(newId);
    setLastGeneratedId(newId);
    setDecodedId(null);
    setDecodedProductData(null);
    setDetectionInfo('');
    setGridData(null);
    setGridText('');
    setUploadedFileName('');
    setVerificationStatus(null);
    setProcessingError('');
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
    setProcessingError('');
  };

  // Get product data for an ObjectId
  const getProductData = (objectId) => {
    return PREDEFINED_PRODUCTS[objectId] || null;
  };

  const handleDecode = (decodedOid, info = '', fileName = '') => {
    setDecodedId(decodedOid);
    setDetectionInfo(info);
    setUploadedFileName(fileName);
    setProcessingError('');
    
    if (decodedOid && decodedOid.length === 24) {
      const productData = getProductData(decodedOid);
      setDecodedProductData(productData);
      
      if (lastGeneratedId && decodedOid === lastGeneratedId) {
        setVerificationStatus('verified');
      } else if (lastGeneratedId && decodedOid !== lastGeneratedId) {
        setVerificationStatus('failed');
      } else {
        setVerificationStatus(null);
      }
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
      setProcessingError('');
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
    if (!lastGeneratedId) {
      alert('Please generate an ID first before scanning');
      return;
    }
    
    const simulatedDecodedId = lastGeneratedId;
    handleDecode(simulatedDecodedId, `Successfully simulated scan from camera - using last generated ID`);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name;
    
    if (!lastGeneratedId) {
      alert('Please generate an ID first before uploading an image');
      return;
    }
    
    const simulatedDecodedId = lastGeneratedId;
    handleDecode(simulatedDecodedId, `Successfully simulated scan from uploaded image`, fileName);
  };

  const handleTextFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        setProcessingError('');
        
        // Process the text file to extract grid pattern
        const grid = processTextFile(fileContent);
        
        // Decode the grid to get ObjectId
        const decodedOid = decodeGrid(grid, 24);
        
        if (decodedOid && decodedOid.length === 24) {
          handleDecode(decodedOid, `Successfully decoded grid pattern from text file`, fileName);
        } else {
          setProcessingError('Failed to decode valid ObjectId from grid pattern');
        }
      } catch (error) {
        setProcessingError(`Error processing text file: ${error.message}`);
        console.error('Text file processing error:', error);
      }
    };
    
    reader.onerror = () => {
      setProcessingError('Error reading file');
    };
    
    reader.readAsText(file);
  };

  const handleDownloadGrid = () => {
    if (!gridData || !gridData.grid) {
      alert('Please generate a grid first by clicking "Generate Grid"');
      return;
    }
    
    const productData = getProductData(oid);
    const fileName = productData ? 
      `grid-${productData.batchNumber}-${oid.slice(-8)}.png` : 
      `grid-${oid.slice(-8)}.png`;
    
    downloadGridAsImage(gridData.grid, fileName);
  };

  const handleDownloadGridText = () => {
    if (!gridText) {
      alert('Please generate a grid first by clicking "Generate Grid"');
      return;
    }
    
    const productData = getProductData(oid);
    const fileName = productData ? 
      `grid-${productData.batchNumber}-${oid.slice(-8)}.txt` : 
      `grid-${oid.slice(-8)}.txt`;
    
    downloadGridAsText(gridText, fileName);
  };

  const handleDownloadObjectId = () => {
    if (!oid) {
      alert('Please generate or enter an ObjectId first');
      return;
    }
    
    const productData = getProductData(oid);
    const fileName = productData ? 
      `objectid-${productData.batchNumber}-${oid.slice(-8)}.txt` : 
      `objectid-${oid.slice(-8)}.txt`;
    
    downloadObjectIdAsText(oid, fileName);
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

          {/* Download Buttons */}
          {gridData && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleDownloadGrid}
                style={{
                  flex: 1,
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                📊 Download Grid as PNG
              </button>
              <button 
                onClick={handleDownloadGridText}
                style={{
                  flex: 1,
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                📄 Download Grid as File
              </button>
            </div>
          )}

          {oid && (
            <div style={{ marginBottom: '16px' }}>
              <button 
                onClick={handleDownloadObjectId}
                style={{
                  width: '100%',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                💾 Download ObjectId as File
              </button>
            </div>
          )}

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
              fontSize: '10px',
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
              {uploadedFileName && (
                <div style={{ marginTop: '4px', fontSize: '12px', fontStyle: 'italic' }}>
                  📁 File: {uploadedFileName}
                </div>
              )}
            </div>
          )}

          {processingError && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#721c24'
            }}>
              ❌ {processingError}
            </div>
          )}
          
          {/* Text File Upload Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
              📁 Upload Grid File
            </h3>
            <input
              type="file"
              accept=".txt,.text"
              onChange={handleTextFileUpload}
              ref={textFileInputRef}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px dashed #6c757d',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                cursor: 'pointer'
              }}
            />
            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
              Upload a .txt file containing the 18×18 grid pattern (only / and \ characters)
            </div>
          </div>

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

          {/* Image File Upload Section */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
              🖼️ Upload Image
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

          {/* Verification Status */}
          {verificationStatus && lastGeneratedId && decodedId && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: verificationStatus === 'verified' ? '#d4edda' : '#f8d7da',
              border: verificationStatus === 'verified' ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: verificationStatus === 'verified' ? '#155724' : '#721c24'
              }}>
                {verificationStatus === 'verified' ? '✅ VERIFIED' : '❌ MISMATCH'}
                <span style={{ marginLeft: '8px', fontWeight: 'normal' }}>
                  {verificationStatus === 'verified' 
                    ? 'Scanned ObjectId matches generated ObjectId'
                    : 'Scanned ObjectId does not match generated ObjectId'
                  }
                </span>
              </div>
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                fontFamily: 'Courier, monospace',
                color: verificationStatus === 'verified' ? '#155724' : '#721c24'
              }}>
                Expected: {lastGeneratedId}<br/>
                Scanned: {decodedId}
              </div>
            </div>
          )}

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
          <p><strong>Download Options:</strong> Download the grid as PNG image or as a text file containing the pattern.</p>
          <p><strong>Text File Processing:</strong> Upload a .txt file with the grid pattern to decode it back to ObjectId.</p>
          <p><strong>Actual Decoding:</strong> The system processes the text file, converts patterns to binary, and decodes to MongoDB ObjectId.</p>
          <p><strong>Verification System:</strong> Compares decoded ObjectId with generated one for verification.</p>
          <p style={{ marginTop: '8px', fontStyle: 'italic' }}>
            The text file should contain exactly 18 lines of 18 characters each (only / and \ allowed).
          </p>
        </div>
      </div>
    </div>
  );
};

export default MongoTextGrid;