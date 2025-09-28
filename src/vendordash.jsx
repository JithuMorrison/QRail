import React, { useState, useEffect, useRef } from 'react';
import { vendorService } from './vendserv';

const VendorDashboard = ({ user }) => {
  const [batchForm, setBatchForm] = useState({
    materialType: '',
    warranty: '',
    fittingType: '',
    qrCount: 1
  });
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadedQrs, setDownloadedQrs] = useState([]);
  const [vendorBatches, setVendorBatches] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => { 
    loadVendorBatches(); 
  }, [user]);

  const loadVendorBatches = async () => {
    try {
      // Mock data for demonstration
      const mockBatches = [
        {
          _id: '1',
          batchNumber: 'BATCH-001',
          materialType: 'Titanium Alloy',
          generatedQrs: Array(5).fill({ objectId: '507f1f77bcf86cd799439011' }),
          createdDate: new Date().toISOString()
        },
        {
          _id: '2',
          batchNumber: 'BATCH-002', 
          materialType: 'Carbon Fiber',
          generatedQrs: Array(3).fill({ objectId: '507f1f77bcf86cd799439012' }),
          createdDate: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setVendorBatches(mockBatches);
    } catch (error) {
      console.error('Failed to load vendor batches:', error);
    }
  };

  const handleBatchChange = (e) =>
    setBatchForm({ ...batchForm, [e.target.name]: e.target.value });

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setLoading(true); 
    setError('');
    try {
      let newBatch;
      try { 
        newBatch = await vendorService.createBatch(batchForm); 
      } catch (apiError) {
        console.log('API not available, using simulation:', apiError.message);
        newBatch = await vendorService.simulateBatchCreation(batchForm);
      }
      setBatch(newBatch.batch);
      setVendorBatches(prev => [newBatch.batch, ...prev]);
      setActiveTab('results');
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleQrDownload = (index) =>
    setDownloadedQrs(prev => [...prev, index]);

  const downloadQrAsText = (qr) => {
    if (!qr) return;
    const { grid } = encodeObjectId(qr.objectId);
    const gridText = grid.map(row => row.join('')).join('\n');
    const blob = new Blob([gridText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qr-${qr.objectId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  const downloadAllQrCodes = async () => {
    if (!batch) return;
    try {
      for (let i = 0; i < batch.generatedQrs.length; i++) {
        const { grid } = encodeObjectId(batch.generatedQrs[i].objectId);
        downloadGridAsImage(grid, `qr-${batch.batchNumber}-${i + 1}.png`);
        downloadQrAsText(batch.generatedQrs[i]);
        await new Promise(r => setTimeout(r, 100));
      }
      setDownloadedQrs(Array.from({ length: batch.generatedQrs.length }, (_, i) => i));
    } catch (err) { 
      setError('Error downloading QR codes: ' + err.message); 
    }
  };

  const createNewBatch = () => {
    setBatch(null);
    setBatchForm({ materialType: '', warranty: '', fittingType: '', qrCount: 1 });
    setDownloadedQrs([]); 
    setError('');
    setActiveTab('create');
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '30px 20px'
  };

  const headerStyle = {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px'
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    color: '#6c757d',
    marginBottom: '30px'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px'
  };

  const tabStyle = (isActive) => ({
    padding: '12px 30px',
    borderRadius: '50px',
    border: 'none',
    background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
    color: isActive ? 'white' : '#6c757d',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  });

  const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '25px',
    marginBottom: '30px'
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    marginBottom: '8px',
    color: '#333',
    fontWeight: '600',
    fontSize: '0.95rem'
  };

  const inputStyle = {
    padding: '15px 20px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.8)'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
  };

  const buttonStyle = {
    padding: '15px 40px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 5px 20px rgba(102, 126, 234, 0.4)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#667eea',
    border: '2px solid #667eea'
  };

  const successCardStyle = {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: 'white',
    padding: '30px',
    borderRadius: '20px',
    textAlign: 'center',
    marginBottom: '30px'
  };

  const qrGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '25px',
    marginTop: '30px'
  };

  const qrCardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    border: '1px solid #f0f0f0'
  };

  const batchGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  };

  const batchCardStyle = {
    background: 'white',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 5px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid #f0f0f0',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Vendor Dashboard</h1>
        <p style={subtitleStyle}>
          Welcome back, <strong>{user.name}</strong> from {user.organization}
        </p>
      </div>

      <div style={cardStyle}>
        {/* Tab Navigation */}
        <div style={tabContainerStyle}>
          <button 
            style={tabStyle(activeTab === 'create')}
            onClick={() => setActiveTab('create')}
          >
            🆕 Create Batch
          </button>
          <button 
            style={tabStyle(activeTab === 'history')}
            onClick={() => setActiveTab('history')}
          >
            📚 Batch History
          </button>
          {batch && (
            <button 
              style={tabStyle(activeTab === 'results')}
              onClick={() => setActiveTab('results')}
            >
              🎉 Current Batch
            </button>
          )}
        </div>

        {/* Create Batch Tab */}
        {activeTab === 'create' && (
          <div>
            <div style={{textAlign: 'center', marginBottom: '40px'}}>
              <h2 style={{fontSize: '2rem', color: '#333', marginBottom: '10px'}}>
                Create New Batch
              </h2>
              <p style={{color: '#6c757d', fontSize: '1.1rem'}}>
                Generate QR codes for your material batches
              </p>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Material Type</label>
                  <select 
                    name="materialType" 
                    value={batchForm.materialType} 
                    onChange={handleBatchChange} 
                    required
                    style={selectStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }}
                  >
                    <option value="">Select Material Type</option>
                    <option value="Titanium Alloy">Titanium Alloy</option>
                    <option value="Carbon Fiber">Carbon Fiber</option>
                    <option value="Stainless Steel">Stainless Steel</option>
                    <option value="Aluminum 6061">Aluminum 6061</option>
                    <option value="Copper Alloy">Copper Alloy</option>
                  </select>
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Warranty Period</label>
                  <input 
                    type="number" 
                    name="warranty" 
                    min="1" 
                    max="120"
                    placeholder="Enter months"
                    value={batchForm.warranty} 
                    onChange={handleBatchChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>Fitting Type</label>
                  <input 
                    type="text" 
                    name="fittingType" 
                    placeholder="e.g., Type A, Bushing, Coupling"
                    value={batchForm.fittingType} 
                    onChange={handleBatchChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>QR Codes Quantity</label>
                  <input 
                    type="number" 
                    name="qrCount" 
                    min="1" 
                    max="100"
                    placeholder="Number of QR codes"
                    value={batchForm.qrCount} 
                    onChange={handleBatchChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                  color: 'white',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  fontWeight: '500'
                }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  ...primaryButtonStyle,
                  opacity: loading ? 0.7 : 1,
                  margin: '0 auto',
                  display: 'block',
                  minWidth: '200px'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Creating Batch...
                  </>
                ) : (
                  '🚀 Generate Batch'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Batch History Tab */}
        {activeTab === 'history' && (
          <div>
            <div style={{textAlign: 'center', marginBottom: '40px'}}>
              <h2 style={{fontSize: '2rem', color: '#333', marginBottom: '10px'}}>
                Batch History
              </h2>
              <p style={{color: '#6c757d', fontSize: '1.1rem'}}>
                View all your previously created batches
              </p>
            </div>

            {vendorBatches.length > 0 ? (
              <div style={batchGridStyle}>
                {vendorBatches.map((b) => (
                  <div 
                    key={b._id} 
                    style={batchCardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{color: '#333', margin: 0}}>{b.batchNumber}</h3>
                      <span style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {b.generatedQrs.length} QR{b.generatedQrs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p style={{color: '#666', margin: '8px 0'}}>
                      <strong>Material:</strong> {b.materialType}
                    </p>
                    <p style={{color: '#666', margin: '8px 0', fontSize: '0.9rem'}}>
                      Created: {new Date(b.createdDate).toLocaleDateString()}
                    </p>
                    <button 
                      onClick={() => {
                        setBatch(b);
                        setActiveTab('results');
                      }}
                      style={{
                        ...secondaryButtonStyle,
                        width: '100%',
                        marginTop: '15px',
                        padding: '10px 20px',
                        fontSize: '0.9rem'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#6c757d'
              }}>
                <div style={{fontSize: '4rem', marginBottom: '20px'}}>📦</div>
                <h3 style={{color: '#333', marginBottom: '10px'}}>No batches yet</h3>
                <p>Create your first batch to get started with QR code generation</p>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && batch && (
          <div>
            <div style={successCardStyle}>
              <div style={{fontSize: '4rem', marginBottom: '20px'}}>🎉</div>
              <h2 style={{margin: '0 0 10px 0', fontSize: '2.2rem'}}>
                Batch Created Successfully!
              </h2>
              <p style={{margin: '0 0 20px 0', opacity: 0.9}}>
                Your QR codes are ready for download
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.5)',
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}>
                <h4 style={{margin: '0 0 10px 0', color: '#333'}}>Batch Number</h4>
                <p style={{margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#667eea'}}>
                  {batch.batchNumber}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.5)',
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}>
                <h4 style={{margin: '0 0 10px 0', color: '#333'}}>Material Type</h4>
                <p style={{margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#667eea'}}>
                  {batch.materialType}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.5)',
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}>
                <h4 style={{margin: '0 0 10px 0', color: '#333'}}>QR Codes</h4>
                <p style={{margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#667eea'}}>
                  {batch.generatedQrs.length}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '15px',
              justifyContent: 'center',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <button 
                onClick={downloadAllQrCodes}
                style={{
                  ...primaryButtonStyle,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 5px 20px rgba(79, 172, 254, 0.4)';
                }}
              >
                🖼️ Download All QR Images & TXT
              </button>
              <button 
                onClick={createNewBatch}
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.background = '#667eea';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.target.style.color = '#667eea';
                }}
              >
                🆕 Create New Batch
              </button>
            </div>

            <div>
              <h3 style={{textAlign: 'center', marginBottom: '30px', color: '#333'}}>
                Generated QR Codes ({batch.generatedQrs.length})
              </h3>
              <div style={qrGridStyle}>
                {batch.generatedQrs.map((qr, i) => (
                  <QRPreview 
                    key={qr.objectId} 
                    objectId={qr.objectId}
                    batchNumber={batch.batchNumber} 
                    index={i}
                    onDownload={handleQrDownload}
                    onDownloadTxt={() => downloadQrAsText(qr)}
                  />
                ))}
              </div>

              {downloadedQrs.length === batch.generatedQrs.length && batch.generatedQrs.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
                  color: 'white',
                  padding: '20px',
                  borderRadius: '15px',
                  textAlign: 'center',
                  marginTop: '30px',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  ✅ All {batch.generatedQrs.length} QR codes downloaded successfully!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

/* ------------ QR Preview Component ------------ */
const QRPreview = ({ objectId, batchNumber, index, onDownload, onDownloadTxt }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const { grid } = encodeObjectId(objectId);
    drawGridToCanvas(canvasRef.current, grid);
  }, [objectId]);

  const download = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; 
    a.download = `qr-${batchNumber}-${index + 1}.png`; 
    a.click();
    onDownload(index);
  };

  const qrCardStyle = {
    background: 'white',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    border: '1px solid #f0f0f0'
  };

  const buttonStyle = {
    padding: '8px 15px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    margin: '5px',
    flex: 1
  };

  return (
    <div 
      style={qrCardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.08)';
      }}
    >
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400}
        style={{ 
          width: '140px', 
          height: '140px', 
          border: '1px solid #f0f0f0',
          borderRadius: '10px',
          background: 'white'
        }}
      />
      <p style={{ 
        margin: '10px 0 5px 0', 
        fontSize: '0.8rem', 
        color: '#666',
        fontWeight: '600'
      }}>
        QR #{index + 1}
      </p>
      <div style={{ display: 'flex', gap: '5px', marginTop: '10px' }}>
        <button 
          onClick={download}
          style={{
            ...buttonStyle,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
        >
          PNG
        </button>
        <button 
          onClick={onDownloadTxt}
          style={{
            ...buttonStyle,
            background: 'rgba(255, 255, 255, 0.9)',
            color: '#667eea',
            border: '1px solid #667eea'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.background = '#667eea';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.background = 'rgba(255, 255, 255, 0.9)';
            e.target.style.color = '#667eea';
          }}
        >
          TXT
        </button>
      </div>
    </div>
  );
};

/* ------------ GRID ENCODING + DRAW ------------ */
const encodeObjectId = (oid) => {
  const REDUNDANCY = 3, SIZE = 18;
  const bits = [...oid.match(/.{1,2}/g).map(b => parseInt(b,16))]
    .flatMap(byte => byte.toString(2).padStart(8,'0').split('').map(Number))
    .flatMap(bit => Array(REDUNDANCY).fill(bit));
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill('/'));
  grid[0][0]=grid[0][SIZE-1]=grid[SIZE-1][0]=grid[SIZE-1][SIZE-1]='\\';
  let idx=0;
  for(let i=0;i<SIZE;i++)for(let j=0;j<SIZE;j++){
    if((i===0||i===SIZE-1)&&(j===0||j===SIZE-1))continue;
    if(idx<bits.length)grid[i][j]=bits[idx++]?'\\':'/';
  }
  return {grid};
};

const drawGridToCanvas = (canvas, grid) => {
  if(!canvas) return;
  const ctx=canvas.getContext('2d'), cell=20, pad=20, N=grid.length;
  canvas.width=N*cell+pad*2; canvas.height=N*cell+pad*2;
  ctx.fillStyle='white'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#000'; ctx.lineWidth=2;
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){
    const x=pad+j*cell, y=pad+i*cell, m=2;
    ctx.beginPath();
    if(grid[i][j]==='\\'){ctx.moveTo(x+m,y+m);ctx.lineTo(x+cell-m,y+cell-m);}
    else {ctx.moveTo(x+cell-m,y+m);ctx.lineTo(x+m,y+cell-m);}
    ctx.stroke();
  }
};

const downloadGridAsImage = (grid, filename='grid.png') => {
  const canvas=document.createElement('canvas');
  drawGridToCanvas(canvas,grid);
  canvas.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();
    document.body.removeChild(a);URL.revokeObjectURL(url);
  });
};

export default VendorDashboard;