import React, { useRef, useState } from 'react';

const QRScanner = ({ scanning, onScanResult, onStartScan, onStopScan }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      // Simulate scan from uploaded file
      setTimeout(() => {
        onScanResult('507f1f77bcf86cd799439011'); // Mock ObjectId
      }, 1000);
    }
  };

  const handleScan = () => {
    // Simulate scan from camera
    onScanResult('507f1f77bcf86cd799439011'); // Mock ObjectId
  };

  return (
    <div className="qr-scanner">
      <div className="scanner-controls">
        {!scanning ? (
          <button onClick={startCamera} className="btn-primary">
            Start Camera
          </button>
        ) : (
          <button onClick={stopCamera} className="btn-secondary">
            Stop Camera
          </button>
        )}
        
        <input
          type="file"
          accept="image/*,.txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="btn-secondary">
          Upload QR Image/Text
        </label>
      </div>

      {scanning && (
        <div className="camera-preview">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline
            style={{ width: '100%', maxWidth: '500px', border: '2px solid #ccc' }}
          />
          <button onClick={handleScan} className="btn-primary" style={{ marginTop: '10px' }}>
            Scan QR Code
          </button>
        </div>
      )}

      {uploadedFile && (
        <div className="upload-preview">
          <p>Uploaded file: {uploadedFile.name}</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;