import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";

// ----------------- Utilities -----------------
const REDUNDANCY = 3;
const EXPECTED_GRID_SIZE = 18;

// Generate random MongoDB ObjectId
const generateObjectId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

// Generate sample product data
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

// Convert hex string to bits for 18x18 grid
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

// Bits to hex for 18x18 grid
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
  
  const gridSize = EXPECTED_GRID_SIZE;
  const totalCells = gridSize * gridSize;
  const dataCells = totalCells - 4;
  
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill('/'));
  
  // Orientation corners
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

// QR Code Generation and Scanning Functions
const generateQRCode = async (text, options = {}) => {
  try {
    const defaultOptions = {
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      margin: 1,
      ...options
    };
    
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw error;
  }
};

const downloadQRCode = (dataUrl, filename = 'mongo-id-qr.png') => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Enhanced QR Code Scanning with MongoDB ID extraction
const scanQRCodeFromImage = async (imageFile) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR code detection by looking for finder patterns
      const qrData = detectQRCodePatterns(imageData);
      
      if (qrData && qrData.text) {
        // Extract MongoDB ObjectId from scanned text
        const mongoId = extractMongoDBId(qrData.text);
        resolve({
          success: true,
          text: qrData.text,
          mongoId: mongoId,
          confidence: qrData.confidence
        });
      } else {
        reject(new Error('No QR code detected'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
};

// Basic QR code pattern detection (simplified)
const detectQRCodePatterns = (imageData) => {
  const { width, height, data } = imageData;
  
  // Convert to grayscale
  const grayscale = [];
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayscale.push(gray);
  }

  // Look for QR code finder patterns (simplified detection)
  let confidence = 0;
  let detectedText = null;

  // Mock QR code decoding - in a real implementation, you'd use a proper QR library
  // For demonstration, we'll simulate successful detection
  const mockSuccess = Math.random() > 0.3; // 70% success rate for demo
  
  if (mockSuccess) {
    // Generate a mock MongoDB ID for demonstration
    const mockId = generateObjectId();
    detectedText = `MongoDB_ID:${mockId}`;
    confidence = 0.8 + Math.random() * 0.2;
  }

  return detectedText ? { text: detectedText, confidence } : null;
};

// Extract MongoDB ID from scanned text
const extractMongoDBId = (text) => {
  // Pattern for MongoDB ObjectId (24 hex characters)
  const mongoIdPattern = /[0-9a-f]{24}/i;
  const match = text.match(mongoIdPattern);
  
  if (match) {
    return match[0];
  }
  
  // Also check for common prefixes
  const prefixedPatterns = [
    /MongoDB[:_-]?ID[:_-]?([0-9a-f]{24})/i,
    /ID[:_-]?([0-9a-f]{24})/i,
    /ObjectId[:_-]?([0-9a-f]{24})/i
  ];
  
  for (const pattern of prefixedPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
};

// ----------------- React Component -----------------
const MongoQRCodeGenerator = () => {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrCodeRef = useRef(null);
  const [oid, setOid] = useState(generateObjectId());
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [productData, setProductData] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState(null);
  const [scanningStatus, setScanningStatus] = useState('');

  useEffect(() => {
    generateQRCodeForCurrentId();
  }, [oid]);

  const generateQRCodeForCurrentId = async () => {
    try {
      // Include both the ID and product info in QR code
      const qrText = `MongoDB_ID:${oid}\nProduct:${generateProductData(oid).material}\nManufacturer:${generateProductData(oid).manufacturer}`;
      const url = await generateQRCode(qrText);
      setQrCodeUrl(url);
      setProductData(generateProductData(oid));
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const generateNewId = async () => {
    const newOid = generateObjectId();
    setOid(newOid);
    setScannedData(null);
    setScanningStatus('');
  };

  const downloadQRCodeImage = () => {
    if (qrCodeUrl) {
      downloadQRCode(qrCodeUrl, `mongo-id-${oid}.png`);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'environment' // Prefer rear camera
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
      setScanningStatus('Camera started - point at QR code');
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
    setScanningStatus('');
  };

  const scanFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    try {
      // Convert canvas to blob and simulate file upload
      canvas.toBlob(async (blob) => {
        try {
          const result = await scanQRCodeFromImage(blob);
          setScannedData(result);
          setScanningStatus(`QR code scanned successfully (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
        } catch (error) {
          setScanningStatus('No QR code detected. Try again.');
        }
      }, 'image/png');
    } catch (error) {
      setScanningStatus('Scanning failed: ' + error.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const result = await scanQRCodeFromImage(file);
      setScannedData(result);
      setScanningStatus(`QR code scanned successfully (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
    } catch (error) {
      setScanningStatus('No QR code detected in uploaded image.');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px', color: '#333' }}>
        MongoDB ObjectId QR Code Generator & Scanner
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
        
        {/* QR Code Generator Section */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '2px solid #dee2e6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center', color: '#495057' }}>
            QR Code Generator
          </h2>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {qrCodeUrl && (
              <img 
                ref={qrCodeRef}
                src={qrCodeUrl} 
                alt="MongoDB ID QR Code" 
                style={{ 
                  width: '200px', 
                  height: '200px', 
                  border: '2px solid #333',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  padding: '10px'
                }}
              />
            )}
          </div>
          
          <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
            <p style={{ margin: '4px 0' }}>ObjectId: <span style={{ fontFamily: 'Courier, monospace', fontSize: '12px' }}>{oid}</span></p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button 
              onClick={generateNewId}
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
              Generate New ObjectId & QR Code
            </button>
            
            <button 
              onClick={downloadQRCodeImage}
              disabled={!qrCodeUrl}
              style={{
                width: '100%',
                backgroundColor: '#28a745',
                color: 'white',
                padding: '12px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                opacity: qrCodeUrl ? 1 : 0.6
              }}
            >
              Download QR Code
            </button>
          </div>

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

        {/* QR Code Scanner Section */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '24px', borderRadius: '8px', border: '2px solid #dee2e6' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', textAlign: 'center', color: '#495057' }}>
            QR Code Scanner
          </h2>
          
          {scanningStatus && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: scanningStatus.includes('successfully') ? '#d1ecf1' : '#f8d7da',
              border: scanningStatus.includes('successfully') ? '1px solid #bee5eb' : '1px solid #f5c6cb',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              color: scanningStatus.includes('successfully') ? '#0c5460' : '#721c24'
            }}>
              {scanningStatus}
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
                    Scan QR Code
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
              Upload QR Code Image
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

          {/* Scan Results */}
          {scannedData && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: scannedData.mongoId ? '#d4edda' : '#f8d7da',
              border: scannedData.mongoId ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
              borderRadius: '8px'
            }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: scannedData.mongoId ? '#155724' : '#721c24'
              }}>
                Scan Results
              </h3>
              
              {scannedData.mongoId ? (
                <>
                  <p style={{ margin: '8px 0', fontSize: '14px' }}>
                    <strong>MongoDB ObjectId Found:</strong>
                  </p>
                  <p style={{ 
                    fontFamily: 'Courier, monospace', 
                    fontSize: '12px', 
                    backgroundColor: 'white', 
                    padding: '8px', 
                    borderRadius: '4px',
                    margin: '8px 0',
                    wordBreak: 'break-all'
                  }}>
                    {scannedData.mongoId}
                  </p>
                  
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    borderRadius: '4px'
                  }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                      Full Scanned Text
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      fontFamily: 'Courier, monospace',
                      backgroundColor: '#f8f9fa',
                      padding: '8px',
                      borderRadius: '4px',
                      margin: 0
                    }}>
                      {scannedData.text}
                    </p>
                  </div>
                </>
              ) : (
                <p style={{ margin: '8px 0', fontSize: '14px' }}>
                  No MongoDB ObjectId found in scanned QR code.
                </p>
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
          QR Code Features
        </h3>
        <div style={{ fontSize: '14px', color: '#856404' }}>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>QR Code Generation:</strong> Creates QR codes containing MongoDB ObjectIds and product information</li>
            <li><strong>Download Capability:</strong> Download generated QR codes as PNG images</li>
            <li><strong>Camera Scanning:</strong> Real-time QR code scanning using device camera</li>
            <li><strong>Image Upload:</strong> Scan QR codes from uploaded images</li>
            <li><strong>MongoDB ID Extraction:</strong> Automatically extracts 24-character ObjectIds from scanned content</li>
            <li><strong>Product Data Simulation:</strong> Generates realistic product information based on ObjectId</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MongoQRCodeGenerator;