import React, { useState, useEffect, useRef } from 'react';
import { vendorService } from './vendserv';
import { useNavigate } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState('create');
  const navigate = useNavigate();

  // Modern color palette
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    light: '#f8fafc',
    dark: '#1e293b',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #5a6fd8 0%, #6a4196 100%)',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#dc2626'
  };

  useEffect(() => { 
    loadVendorBatches(); 
  }, [user]);

  const loadVendorBatches = async () => {
    try {
      const mockBatches = [
        {
          _id: '1',
          batchNumber: 'BATCH-001',
          materialType: 'Titanium Alloy',
          warranty: '24 months',
          fittingType: 'Type A Coupling',
          generatedQrs: Array(5).fill({ objectId: '507f1f77bcf86cd799439011' }),
          createdDate: new Date().toISOString(),
          status: 'active'
        },
        {
          _id: '2',
          batchNumber: 'BATCH-002', 
          materialType: 'Carbon Fiber',
          warranty: '36 months',
          fittingType: 'Bushing Connector',
          generatedQrs: Array(3).fill({ objectId: '507f1f77bcf86cd799439012' }),
          createdDate: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
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
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    padding: '30px 20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

  const headerStyle = {
    maxWidth: '1200px',
    margin: '0 auto 40px',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
    letterSpacing: '-0.02em'
  };

  const subtitleStyle = {
    fontSize: '1.2rem',
    color: colors.secondary,
    marginBottom: '30px',
    fontWeight: '400'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const tabContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '40px',
    background: 'rgba(0, 0, 0, 0.02)',
    padding: '8px',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.05)'
  };

  const tabStyle = (isActive) => ({
    padding: '14px 28px',
    borderRadius: '12px',
    border: 'none',
    background: isActive ? colors.gradient : 'transparent',
    color: isActive ? 'white' : colors.secondary,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '0.95rem',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  });

  const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '28px',
    marginBottom: '35px'
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    marginBottom: '10px',
    color: colors.dark,
    fontWeight: '600',
    fontSize: '0.95rem',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const inputStyle = {
    padding: '16px 20px',
    border: `2px solid #e2e8f0`,
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    color: colors.dark
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: 'right 16px center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '20px'
  };

  const buttonStyle = {
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    letterSpacing: '0.5px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: colors.gradient,
    color: 'white',
    boxShadow: `0 4px 15px ${colors.primary}40`
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`
  };

  const successCardStyle = {
    background: colors.gradient,
    color: 'white',
    padding: '40px',
    borderRadius: '20px',
    textAlign: 'center',
    marginBottom: '35px',
    boxShadow: `0 10px 30px ${colors.primary}30`
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '35px'
  };

  const statCardStyle = {
    background: 'rgba(255, 255, 255, 0.6)',
    padding: '25px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    textAlign: 'center'
  };

  const batchGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
    marginTop: '30px'
  };

  const batchCardStyle = {
    background: 'white',
    padding: '28px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  };

  const statusBadgeStyle = (status) => ({
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '600',
    background: status === 'active' ? colors.success : colors.secondary,
    color: 'white'
  });

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Vendor Dashboard</h1>
        <p style={subtitleStyle}>
          Welcome back, <strong style={{color: colors.primary}}>{user.name}</strong> from {user.organization}
        </p>
        <button 
          onClick={() => navigate('/analytics/vendor')}
          style={{
            ...primaryButtonStyle,
            margin: '0 auto',
            background: `linear-gradient(135deg, ${colors.success} 0%, #34d399 100%)`
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 8px 25px ${colors.success}40`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 4px 15px ${colors.success}40`;
          }}
        >
          📊 View Analytics
        </button>
      </div>

      <div style={cardStyle}>
        {/* Tab Navigation */}
        <div style={tabContainerStyle}>
          <button 
            style={tabStyle(activeTab === 'create')}
            onClick={() => setActiveTab('create')}
          >
            <span>🆕</span>
            Create Batch
          </button>
          <button 
            style={tabStyle(activeTab === 'history')}
            onClick={() => setActiveTab('history')}
          >
            <span>📚</span>
            Batch History
          </button>
          {batch && (
            <button 
              style={tabStyle(activeTab === 'results')}
              onClick={() => setActiveTab('results')}
            >
              <span>🎉</span>
              Current Batch
            </button>
          )}
        </div>

        {/* Create Batch Tab */}
        {activeTab === 'create' && (
          <div>
            <div style={{textAlign: 'center', marginBottom: '45px'}}>
              <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
                Create New Batch
              </h2>
              <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
                Generate QR codes for your material batches with detailed specifications
              </p>
            </div>

            <form onSubmit={handleCreateBatch}>
              <div style={formGridStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    <span>🏗️</span>
                    Material Type
                  </label>
                  <select 
                    name="materialType" 
                    value={batchForm.materialType} 
                    onChange={handleBatchChange} 
                    required
                    style={selectStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
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
                  <label style={labelStyle}>
                    <span>🛡️</span>
                    Warranty Period
                  </label>
                  <input 
                    type="number" 
                    name="warranty" 
                    min="1" 
                    max="120"
                    placeholder="Enter warranty in months"
                    value={batchForm.warranty} 
                    onChange={handleBatchChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    <span>🔧</span>
                    Fitting Type
                  </label>
                  <input 
                    type="text" 
                    name="fittingType" 
                    placeholder="e.g., Type A, Bushing, Coupling"
                    value={batchForm.fittingType} 
                    onChange={handleBatchChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={labelStyle}>
                    <span>📦</span>
                    QR Codes Quantity
                  </label>
                  <input 
                    type="number" 
                    name="qrCount" 
                    min="1" 
                    max="100"
                    placeholder="Number of QR codes to generate"
                    value={batchForm.qrCount} 
                    onChange={handleBatchChange} 
                    required
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.primary;
                      e.target.style.background = 'rgba(37, 99, 235, 0.03)';
                      e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.background = 'rgba(255, 255, 255, 0.8)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  color: colors.error,
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '25px',
                  textAlign: 'center',
                  fontWeight: '600',
                  border: `1px solid ${colors.error}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <span>⚠️</span>
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
                  minWidth: '240px',
                  padding: '18px 40px',
                  fontSize: '1.1rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-3px)';
                    e.target.style.boxShadow = `0 12px 30px ${colors.primary}60`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
                  }
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      animation: 'spin 1s linear infinite'
                    }}>🔄</span>
                    Creating Batch...
                  </>
                ) : (
                  '🚀 Generate QR Batch'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Batch History Tab */}
        {activeTab === 'history' && (
          <div>
            <div style={{textAlign: 'center', marginBottom: '45px'}}>
              <h2 style={{fontSize: '2.2rem', color: colors.dark, marginBottom: '12px', fontWeight: '700'}}>
                Batch History
              </h2>
              <p style={{color: colors.secondary, fontSize: '1.1rem'}}>
                Track and manage all your previously created batches
              </p>
            </div>

            {vendorBatches.length > 0 ? (
              <div style={batchGridStyle}>
                {vendorBatches.map((batch) => (
                  <div 
                    key={batch._id} 
                    style={batchCardStyle}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <div style={statusBadgeStyle(batch.status)}>
                      {batch.status}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '20px'
                    }}>
                      <h3 style={{color: colors.dark, margin: 0, fontSize: '1.3rem', fontWeight: '700'}}>
                        {batch.batchNumber}
                      </h3>
                      <span style={{
                        background: colors.gradient,
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {batch.generatedQrs.length} QR{batch.generatedQrs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div style={{marginBottom: '20px'}}>
                      <p style={{color: colors.secondary, margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>🏗️</span>
                        <strong>Material:</strong> {batch.materialType}
                      </p>
                      <p style={{color: colors.secondary, margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>🛡️</span>
                        <strong>Warranty:</strong> {batch.warranty}
                      </p>
                      <p style={{color: colors.secondary, margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span>🔧</span>
                        <strong>Fitting:</strong> {batch.fittingType}
                      </p>
                    </div>
                    
                    <p style={{color: colors.secondary, margin: '8px 0', fontSize: '0.9rem'}}>
                      📅 Created: {new Date(batch.createdDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    <button 
                      onClick={() => {
                        setBatch(batch);
                        setActiveTab('results');
                      }}
                      style={{
                        ...secondaryButtonStyle,
                        width: '100%',
                        marginTop: '20px',
                        padding: '12px 20px'
                      }}
                    >
                      View QR Codes
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: colors.secondary
              }}>
                <div style={{fontSize: '5rem', marginBottom: '25px', opacity: 0.5}}>📦</div>
                <h3 style={{color: colors.dark, marginBottom: '12px', fontSize: '1.5rem'}}>
                  No batches created yet
                </h3>
                <p style={{fontSize: '1.1rem', marginBottom: '30px'}}>
                  Create your first batch to start generating QR codes
                </p>
                <button 
                  onClick={() => setActiveTab('create')}
                  style={primaryButtonStyle}
                >
                  🆕 Create First Batch
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && batch && (
          <BatchResults 
            batch={batch}
            downloadedQrs={downloadedQrs}
            onDownloadAll={downloadAllQrCodes}
            onNewBatch={createNewBatch}
            onQrDownload={handleQrDownload}
            onDownloadTxt={downloadQrAsText}
            colors={colors}
          />
        )}
      </div>

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

/* ------------ Batch Results Component ------------ */
const BatchResults = ({ batch, downloadedQrs, onDownloadAll, onNewBatch, onQrDownload, onDownloadTxt, colors }) => {
  const [showAllQrs, setShowAllQrs] = useState(false);
  
  const displayedQrs = showAllQrs ? batch.generatedQrs : batch.generatedQrs.slice(0, 8);

  return (
    <div>
      <div style={{
        background: colors.gradient,
        color: 'white',
        padding: '40px',
        borderRadius: '20px',
        textAlign: 'center',
        marginBottom: '35px',
        boxShadow: `0 10px 30px ${colors.primary}30`
      }}>
        <div style={{fontSize: '4rem', marginBottom: '20px'}}>🎉</div>
        <h2 style={{margin: '0 0 12px 0', fontSize: '2.2rem', fontWeight: '700'}}>
          Batch Created Successfully!
        </h2>
        <p style={{margin: '0 0 25px 0', opacity: 0.9, fontSize: '1.1rem'}}>
          Your QR codes are ready for download and distribution
        </p>
      </div>

      {/* Batch Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '35px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          padding: '25px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Batch Number</h4>
          <p style={{margin: 0, fontSize: '1.3rem', fontWeight: '700', color: colors.primary}}>
            {batch.batchNumber}
          </p>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          padding: '25px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>Material Type</h4>
          <p style={{margin: 0, fontSize: '1.3rem', fontWeight: '700', color: colors.primary}}>
            {batch.materialType}
          </p>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.6)',
          padding: '25px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <h4 style={{margin: '0 0 10px 0', color: colors.dark, fontSize: '0.9rem', fontWeight: '600'}}>QR Codes</h4>
          <p style={{margin: 0, fontSize: '1.3rem', fontWeight: '700', color: colors.primary}}>
            {batch.generatedQrs.length}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        marginBottom: '40px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={onDownloadAll}
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '0.5px',
            background: `linear-gradient(135deg, ${colors.success} 0%, #34d399 100%)`,
            color: 'white',
            boxShadow: `0 4px 15px ${colors.success}40`
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = `0 12px 30px ${colors.success}60`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 4px 15px ${colors.success}40`;
          }}
        >
          🖼️ Download All QR Codes
        </button>
        <button 
          onClick={onNewBatch}
          style={{
            padding: '16px 32px',
            borderRadius: '12px',
            border: `2px solid ${colors.primary}`,
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '0.5px',
            background: 'transparent',
            color: colors.primary
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.background = colors.primary;
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.background = 'transparent';
            e.target.style.color = colors.primary;
          }}
        >
          🆕 Create New Batch
        </button>
      </div>

      {/* QR Codes Grid */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h3 style={{color: colors.dark, margin: 0, fontSize: '1.5rem', fontWeight: '700'}}>
            Generated QR Codes ({batch.generatedQrs.length})
          </h3>
          
          {batch.generatedQrs.length > 8 && (
            <button 
              onClick={() => setShowAllQrs(!showAllQrs)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: `1px solid ${colors.primary}`,
                background: 'transparent',
                color: colors.primary,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {showAllQrs ? '👆 Show Less' : '👇 Show All'}
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '25px',
          marginTop: '20px'
        }}>
          {displayedQrs.map((qr, i) => (
            <QRPreview 
              key={qr.objectId} 
              objectId={qr.objectId}
              batchNumber={batch.batchNumber} 
              index={i}
              onDownload={onQrDownload}
              onDownloadTxt={() => onDownloadTxt(qr)}
              colors={colors}
            />
          ))}
        </div>

        {downloadedQrs.length === batch.generatedQrs.length && batch.generatedQrs.length > 0 && (
          <div style={{
            background: `linear-gradient(135deg, ${colors.success} 0%, #34d399 100%)`,
            color: 'white',
            padding: '25px',
            borderRadius: '16px',
            textAlign: 'center',
            marginTop: '35px',
            fontWeight: '600',
            fontSize: '1.1rem',
            boxShadow: `0 5px 20px ${colors.success}30`
          }}>
            ✅ All {batch.generatedQrs.length} QR codes downloaded successfully!
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------ QR Preview Component ------------ */
const QRPreview = ({ objectId, batchNumber, index, onDownload, onDownloadTxt, colors }) => {
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
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    textAlign: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(0, 0, 0, 0.05)'
  };

  return (
    <div 
      style={qrCardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)';
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
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
          borderRadius: '12px',
          background: 'white'
        }}
      />
      <p style={{ 
        margin: '15px 0 5px 0', 
        fontSize: '0.85rem', 
        color: colors.dark,
        fontWeight: '600'
      }}>
        QR #{index + 1}
      </p>
      <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
        <button 
          onClick={download}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            flex: 1,
            background: colors.gradient,
            color: 'white'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
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
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${colors.primary}`,
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            flex: 1,
            background: 'transparent',
            color: colors.primary
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.background = colors.primary;
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.background = 'transparent';
            e.target.style.color = colors.primary;
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