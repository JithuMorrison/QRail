import React, { useRef, useState } from 'react';

// ----------------- QR Scanner Component -----------------
const QRScanner = ({ scanning, onScanResult, onStartScan, onStopScan, processTextFile, decodeGrid }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCameraOn(true);
      setCapturedImage(null); // Clear any previous capture
      onStartScan();
    } catch (error) {
      alert("Could not access camera: " + error.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStream(null);
    }
    setIsCameraOn(false);
    onStopScan();
  };

  // Capture image from video stream
  const captureImage = () => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL for preview
    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);

    return canvas;
  };

  // Process image to extract grid pattern
  const processImage = (imageSource) => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width, height;

      if (imageSource instanceof HTMLCanvasElement) {
        // Already a canvas
        width = imageSource.width;
        height = imageSource.height;
        ctx.drawImage(imageSource, 0, 0);
      } else {
        // HTMLImageElement or HTMLVideoElement
        width = imageSource.videoWidth || imageSource.width;
        height = imageSource.videoHeight || imageSource.height;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(imageSource, 0, 0, width, height);
      }

      try {
        const gridSize = 20;
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;

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
    setCapturedImage(null);

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
    setCapturedImage(null);

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
      // First capture the image
      const capturedCanvas = captureImage();
      
      // Then process it
      const objectId = await processImage(capturedCanvas);
      onScanResult(objectId);
    } catch (error) {
      alert('Scan failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="qr-scanner" style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Camera Preview */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        background: '#f8f9fa',
        borderRadius: '16px',
        padding: '20px',
        border: '2px solid #e9ecef'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            border: "3px solid #007bff",
            borderRadius: "16px",
            display: isCameraOn ? "block" : "none",
            marginBottom: "15px",
            boxShadow: '0 4px 12px rgba(0,123,255,0.3)'
          }}
        />
        
        {!isCameraOn && !capturedImage && (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            height: '300px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px auto',
            color: 'white',
            fontSize: '48px'
          }}>
            📷
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ color: '#28a745', marginBottom: '10px' }}>📸 Captured Image</h3>
            <img 
              src={capturedImage} 
              alt="Captured" 
              style={{
                width: "100%",
                maxWidth: "600px",
                height: "auto",
                border: "3px solid #28a745",
                borderRadius: "16px",
                boxShadow: '0 4px 12px rgba(40,167,69,0.3)'
              }}
            />
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        {!scanning ? (
          <button 
            onClick={startCamera} 
            disabled={processing}
            style={{
              background: processing ? '#6c757d' : 'linear-gradient(135deg, #007bff, #0056b3)',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '18px',
              borderRadius: '50px',
              cursor: processing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(0,123,255,0.4)',
              transition: 'all 0.3s ease',
              fontWeight: '600',
              minWidth: '200px'
            }}
          >
            {processing ? '⏳ Processing...' : '📹 Start Camera'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={handleScan} 
              disabled={processing}
              style={{
                background: processing ? '#6c757d' : 'linear-gradient(135deg, #28a745, #1e7e34)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                fontSize: '18px',
                borderRadius: '50px',
                cursor: processing ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(40,167,69,0.4)',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                minWidth: '180px'
              }}
            >
              {processing ? '⏳ Scanning...' : '📸 Capture & Scan'}
            </button>
            
            <button 
              onClick={stopCamera}
              style={{
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                fontSize: '18px',
                borderRadius: '50px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(220,53,69,0.4)',
                transition: 'all 0.3s ease',
                fontWeight: '600',
                minWidth: '160px'
              }}
            >
              🛑 Stop Camera
            </button>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div style={{
        background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
        borderRadius: '16px',
        padding: '25px',
        border: '2px dashed #6c757d',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '20px', 
          color: '#495057',
          fontSize: '20px' 
        }}>
          📁 Or Upload Files
        </h3>
        
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          justifyContent: 'center', 
          flexWrap: 'wrap' 
        }}>
          <input
            type="file"
            accept=".txt,.text"
            onChange={handleTextFileUpload}
            style={{ display: 'none' }}
            id="text-file-upload"
            disabled={processing}
          />
          <label 
            htmlFor="text-file-upload" 
            style={{
              background: 'linear-gradient(135deg, #6f42c1, #5a32a3)',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              fontSize: '16px',
              borderRadius: '25px',
              cursor: processing ? 'not-allowed' : 'pointer',
              boxShadow: '0 3px 10px rgba(111,66,193,0.4)',
              transition: 'all 0.3s ease',
              fontWeight: '500',
              display: 'inline-block',
              textDecoration: 'none',
              opacity: processing ? 0.6 : 1
            }}
          >
            📄 Upload Grid Text File
          </label>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            id="image-file-upload"
            disabled={processing}
          />
          <label 
            htmlFor="image-file-upload" 
            style={{
              background: 'linear-gradient(135deg, #fd7e14, #e8590c)',
              color: 'white',
              border: 'none',
              padding: '12px 25px',
              fontSize: '16px',
              borderRadius: '25px',
              cursor: processing ? 'not-allowed' : 'pointer',
              boxShadow: '0 3px 10px rgba(253,126,20,0.4)',
              transition: 'all 0.3s ease',
              fontWeight: '500',
              display: 'inline-block',
              textDecoration: 'none',
              opacity: processing ? 0.6 : 1
            }}
          >
            🖼️ Upload QR Image
          </label>
        </div>
      </div>

      {/* Upload Status */}
      {uploadedFile && (
        <div style={{
          background: '#e8f5e8',
          border: '2px solid #28a745',
          borderRadius: '12px',
          padding: '15px',
          textAlign: 'center',
          marginBottom: '15px'
        }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '600' }}>
            📄 Uploaded: {uploadedFile.name}
          </p>
          {processing && (
            <p style={{ margin: 0, color: '#007bff', fontSize: '14px' }}>
              ⏳ Processing file...
            </p>
          )}
        </div>
      )}

      {/* Processing Indicator */}
      {processing && (
        <div style={{
          background: 'rgba(0, 123, 255, 0.1)',
          border: '2px solid #007bff',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <p style={{ margin: 0, color: '#007bff', fontSize: '16px', fontWeight: '600' }}>
            Processing... Please wait
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .qr-scanner button:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        .qr-scanner label:hover:not([style*="opacity: 0.6"]) {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default QRScanner;