import React, { useRef, useState } from 'react';
import { Camera, Square, Upload, FileText, Image as ImageIcon, Loader2, CheckCircle2, X } from 'lucide-react';

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
          facingMode: 'environment'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setIsCameraOn(true);
      setCapturedImage(null);
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

  const captureImage = () => {
    if (!videoRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);

    return canvas;
  };

  const processImage = (imageSource) => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width, height;

      if (imageSource instanceof HTMLCanvasElement) {
        width = imageSource.width;
        height = imageSource.height;
        ctx.drawImage(imageSource, 0, 0);
      } else {
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

        for (let row = 0; row < gridSize; row++) {
          const rowData = [];
          for (let col = 0; col < gridSize; col++) {
            if (row === 0 || row === gridSize - 1 || col === 0 || col === gridSize - 1) {
              continue;
            }

            const x = col * cellWidth;
            const y = row * cellHeight;

            const cellData = ctx.getImageData(x, y, cellWidth, cellHeight);
            const pixels = cellData.data;

            let diag1 = 0;
            let diag2 = 0;

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

        console.log("Extracted Grid:");
        grid.forEach(r => console.log(r.join(" ")));

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
      const capturedCanvas = captureImage();
      const objectId = await processImage(capturedCanvas);
      onScanResult(objectId);
    } catch (error) {
      alert('Scan failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2d8b1] via-[#fce8d0] to-[#f2d8b1] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#b35100] rounded-2xl mb-4 shadow-lg">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#b35100] mb-2">QR Code Scanner</h1>
          <p className="text-[#8a3f00] text-lg">Scan or upload your QR code to decode</p>
        </div>

        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera Preview Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6 border-2 border-[#b35100]/20">
          <div className="relative">
            {/* Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full rounded-2xl border-4 border-[#b35100] shadow-xl ${isCameraOn ? 'block' : 'hidden'}`}
            />
            
            {/* Camera Off Placeholder */}
            {!isCameraOn && !capturedImage && (
              <div className="w-full aspect-video bg-gradient-to-br from-[#b35100] to-[#8a3f00] rounded-2xl flex flex-col items-center justify-center text-white">
                <Camera className="w-24 h-24 mb-4 opacity-80" strokeWidth={1.5} />
                <p className="text-xl font-medium">Camera Ready</p>
                <p className="text-sm opacity-80 mt-1">Click start to begin scanning</p>
              </div>
            )}

            {/* Captured Image Preview */}
            {capturedImage && (
              <div className="relative">
                <div className="absolute -top-3 left-4 bg-green-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Captured</span>
                </div>
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full rounded-2xl border-4 border-green-500 shadow-xl"
                />
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="mt-6">
            {!scanning ? (
              <button 
                onClick={startCamera} 
                disabled={processing}
                className={`w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                  processing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#b35100] hover:bg-[#8a3f00] active:scale-95 shadow-lg hover:shadow-xl'
                } text-white`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    Start Camera
                  </>
                )}
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={handleScan} 
                  disabled={processing}
                  className={`flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                    processing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#b35100] hover:bg-[#8a3f00] active:scale-95 shadow-lg hover:shadow-xl'
                  } text-white`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5" />
                      Capture & Scan
                    </>
                  )}
                </button>
                
                <button 
                  onClick={stopCamera}
                  className="flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold rounded-xl transition-all duration-300 bg-red-500 hover:bg-red-600 active:scale-95 shadow-lg hover:shadow-xl text-white"
                >
                  <X className="w-5 h-5" />
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6 border-2 border-[#b35100]/20">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-[#b35100]" />
            <h2 className="text-2xl font-bold text-[#b35100]">Upload Files</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Text File Upload */}
            <div>
              <input
                type="file"
                accept=".txt,.text"
                onChange={handleTextFileUpload}
                className="hidden"
                id="text-file-upload"
                disabled={processing}
              />
              <label 
                htmlFor="text-file-upload" 
                className={`flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                  processing 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60' 
                    : 'border-[#b35100] bg-[#f2d8b1]/30 hover:bg-[#f2d8b1]/50 hover:border-[#8a3f00] hover:shadow-lg'
                }`}
              >
                <FileText className="w-12 h-12 text-[#b35100]" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="font-semibold text-[#b35100] mb-1">Grid Text File</p>
                  <p className="text-sm text-[#8a3f00]">Click to upload .txt</p>
                </div>
              </label>
            </div>

            {/* Image Upload */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-file-upload"
                disabled={processing}
              />
              <label 
                htmlFor="image-file-upload" 
                className={`flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                  processing 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60' 
                    : 'border-[#b35100] bg-[#f2d8b1]/30 hover:bg-[#f2d8b1]/50 hover:border-[#8a3f00] hover:shadow-lg'
                }`}
              >
                <ImageIcon className="w-12 h-12 text-[#b35100]" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="font-semibold text-[#b35100] mb-1">QR Image</p>
                  <p className="text-sm text-[#8a3f00]">Click to upload image</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Upload Status */}
        {uploadedFile && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800 truncate">{uploadedFile.name}</p>
                {processing && (
                  <p className="text-sm text-green-700 flex items-center gap-2 mt-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing file...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {processing && (
          <div className="bg-[#b35100]/10 border-2 border-[#b35100] rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-[#b35100] animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-[#b35100]">Processing</p>
                <p className="text-sm text-[#8a3f00] mt-1">Please wait while we decode your QR code...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;