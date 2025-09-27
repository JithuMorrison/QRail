import React, { useRef, useState } from 'react';

// ----------------- QR Scanner Component -----------------
const QRScanner = ({ scanning, onScanResult, onStartScan, onStopScan, processTextFile, decodeGrid }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      onStartScan();
    } catch (error) {
      alert("Could not access camera: " + error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    onStopScan();
  };

  // Process image to extract grid pattern
  const processImage = (image) => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      try {
        const gridSize = 20;
        const cellWidth = canvas.width / gridSize;
        const cellHeight = canvas.height / gridSize;

        const grid = [];

        // Loop 20x20 grid
        for (let row = 0; row < gridSize; row++) {
          const rowData = [];
          for (let col = 0; col < gridSize; col++) {
            // Skip first/last row and col
            if (row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1) {
              continue;
            }

            const x = col * cellWidth;
            const y = row * cellHeight;

            const cellData = ctx.getImageData(x, y, cellWidth, cellHeight);
            const pixels = cellData.data;

            let diag1 = 0; // "\"
            let diag2 = 0; // "/"

            for (let i = 0; i < pixels.length; i += 4) {
              const r = pixels[i];
              const g = pixels[i + 1];
              const b = pixels[i + 2];
              const brightness = (r + g + b) / 3;

              const pixelIndex = i / 4;
              const px = pixelIndex % cellWidth;
              const py = Math.floor(pixelIndex / cellWidth);

              if (px === py) diag1 += brightness;
              if (px === cellWidth - py - 1) diag2 += brightness;
            }

            rowData.push(diag1 > diag2 ? "/" : "\\");
          }
          if (rowData.length > 0) grid.push(rowData);
        }

        // Log grid (18x18)
        console.log("Extracted Grid:");
        grid.forEach(r => console.log(r.join(" ")));

        // Decode into ObjectId
        const decodedOid = decodeGrid(grid, 24);
        resolve(decodedOid);

      } catch (error) {
        reject(new Error("Failed to process image: " + error.message));
      }
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        try {
          const objectId = await processImage(img);
          onScanResult(objectId);
        } catch (error) {
          alert('Error processing image: ' + error.message);
        } finally {
          setProcessing(false);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleTextFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const grid = processTextFile(fileContent);
        const decodedOid = decodeGrid(grid, 24);
        
        if (decodedOid && decodedOid.length === 24) {
          onScanResult(decodedOid);
        } else {
          throw new Error('Failed to decode valid ObjectId from grid pattern');
        }
      } catch (error) {
        alert('Error processing text file: ' + error.message);
      } finally {
        setProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleScan = async () => {
    if (!videoRef.current) return;

    setProcessing(true);
    try {
      const objectId = await processImage(videoRef.current);
      onScanResult(objectId);
    } catch (error) {
      alert('Scan failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="qr-scanner">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="scanner-controls">
        {!scanning ? (
          <button onClick={startCamera} className="btn-primary" disabled={processing}>
            {processing ? 'Processing...' : 'Start Camera'}
          </button>
        ) : (
          <button onClick={stopCamera} className="btn-secondary">
            Stop Camera
          </button>
        )}
        
        <div className="upload-buttons">
          <input
            type="file"
            accept=".txt,.text"
            onChange={handleTextFileUpload}
            style={{ display: 'none' }}
            id="text-file-upload"
            disabled={processing}
          />
          <label htmlFor="text-file-upload" className="btn-secondary" style={{marginRight: '10px'}}>
            📁 Upload Grid Text File
          </label>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-file-upload"
            disabled={processing}
          />
          <label htmlFor="image-file-upload" className="btn-secondary">
            🖼️ Upload QR Image
          </label>
        </div>
      </div>

      {scanning && (
        <div className="camera-preview">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              border: '2px solid #ccc',
              borderRadius: '8px'
            }}
          />
          <button 
            onClick={handleScan} 
            className="btn-primary" 
            style={{ marginTop: '10px' }}
            disabled={processing}
          >
            {processing ? 'Scanning...' : '📷 Scan QR Code'}
          </button>
        </div>
      )}

      {uploadedFile && (
        <div className="upload-preview">
          <p>📄 Uploaded file: {uploadedFile.name}</p>
          {processing && <p>⏳ Processing file...</p>}
        </div>
      )}
    </div>
  );
};

export default QRScanner;