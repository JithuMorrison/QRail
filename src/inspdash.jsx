import React, { useState, useEffect } from 'react';
import QRScanner from './qrscanner';

const InspectorDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('inspect');
  const [inspections, setInspections] = useState([]);
  const [qualityStats, setQualityStats] = useState({});

  useEffect(() => {
    loadInspectionHistory();
    loadQualityStats();
  }, []);

  const loadInspectionHistory = async () => {
    // Simulate loading inspection history
    setInspections([
      {
        id: 1,
        product_id: '507f1f77bcf86cd799439011',
        status: 'passed',
        notes: 'Product meets all quality standards',
        timestamp: new Date().toISOString(),
        inspector: user.username
      }
    ]);
  };

  const loadQualityStats = () => {
    setQualityStats({
      total_inspected: 156,
      passed: 142,
      failed: 8,
      needs_review: 6,
      pass_rate: '91.0%'
    });
  };

  const handleScanResult = async (scanData) => {
    // For inspectors, we'll show a form to record inspection details
    const inspectionStatus = prompt('Enter inspection status (passed/failed/needs_review):');
    const inspectionNotes = prompt('Enter inspection notes:');

    if (inspectionStatus && inspectionNotes) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Bearer ${token}`
          },
          body: new URLSearchParams({
            product_id: scanData.product_id,
            inspection_status: inspectionStatus,
            inspection_notes: inspectionNotes
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          // Add to inspections list
          const newInspection = {
            id: inspections.length + 1,
            product_id: scanData.product_id,
            status: inspectionStatus,
            notes: inspectionNotes,
            timestamp: new Date().toISOString(),
            inspector: user.username,
            details: result
          };
          
          setInspections(prev => [newInspection, ...prev]);
          alert('Inspection recorded successfully!');
        }
      } catch (error) {
        alert('Error recording inspection');
      }
    }
  };

  const InspectTab = () => (
    <div className="inspect-tab">
      <div className="inspection-guidelines">
        <h4>Inspection Guidelines</h4>
        <ul>
          <li>Check product for physical damage</li>
          <li>Verify manufacturing specifications</li>
          <li>Confirm installation quality</li>
          <li>Document any issues with photos/notes</li>
        </ul>
      </div>

      <QRScanner user={user} onScan={handleScanResult} />

      <div className="inspection-form" style={{marginTop: '20px'}}>
        <h4>Quick Inspection Form</h4>
        <div className="form-grid">
          <select className="form-input">
            <option value="">Select Status</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="needs_review">Needs Review</option>
          </select>
          <textarea 
            className="form-input" 
            placeholder="Inspection notes..."
            rows="3"
          />
          <button className="btn-primary">Save Inspection</button>
        </div>
      </div>
    </div>
  );

  const HistoryTab = () => (
    <div className="history-tab">
      <h3>Inspection History</h3>
      <div className="inspections-list">
        {inspections.length > 0 ? (
          inspections.map(inspection => (
            <div key={inspection.id} className="inspection-item">
              <div className="inspection-header">
                <span className="product-id">Product: {inspection.product_id.slice(-8)}</span>
                <span className={`status-badge status-${inspection.status}`}>
                  {inspection.status.toUpperCase()}
                </span>
              </div>
              <div className="inspection-details">
                <p><strong>Notes:</strong> {inspection.notes}</p>
                <p><strong>Inspector:</strong> {inspection.inspector}</p>
                <p><strong>Date:</strong> {new Date(inspection.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No inspections recorded yet.</p>
        )}
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="analytics-tab">
      <h3>Quality Analytics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Inspected</h4>
          <div className="stat-value large">{qualityStats.total_inspected || 0}</div>
        </div>
        <div className="stat-card">
          <h4>Pass Rate</h4>
          <div className="stat-value large" style={{color: '#28a745'}}>
            {qualityStats.pass_rate || '0%'}
          </div>
        </div>
        <div className="stat-card">
          <h4>Passed</h4>
          <div className="stat-value" style={{color: '#28a745'}}>{qualityStats.passed || 0}</div>
        </div>
        <div className="stat-card">
          <h4>Failed</h4>
          <div className="stat-value" style={{color: '#dc3545'}}>{qualityStats.failed || 0}</div>
        </div>
      </div>

      <div className="quality-chart">
        <h4>Quality Trends</h4>
        <div className="chart-placeholder">
          <p>Quality performance chart would be displayed here</p>
          <div className="mock-chart">
            <div className="chart-bar" style={{height: '80%', backgroundColor: '#28a745'}}>
              <span>Passed: {qualityStats.passed || 0}</span>
            </div>
            <div className="chart-bar" style={{height: '15%', backgroundColor: '#ffc107'}}>
              <span>Review: {qualityStats.needs_review || 0}</span>
            </div>
            <div className="chart-bar" style={{height: '5%', backgroundColor: '#dc3545'}}>
              <span>Failed: {qualityStats.failed || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard inspector-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Quality Inspector Dashboard</h1>
          <span className="user-welcome">Welcome, {user.username}</span>
        </div>
        <div className="header-right">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-item">
          <span className="stat-label">Today's Inspections</span>
          <span className="stat-value">
            {inspections.filter(i => 
              new Date(i.timestamp).toDateString() === new Date().toDateString()
            ).length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pass Rate</span>
          <span className="stat-value">{qualityStats.pass_rate || '0%'}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Quality Score</span>
          <span className="stat-value">94.5%</span>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'inspect' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('inspect')}
        >
          🔍 Inspect Products
        </button>
        <button 
          className={activeTab === 'history' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('history')}
        >
          📊 Inspection History
        </button>
        <button 
          className={activeTab === 'analytics' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Quality Analytics
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'inspect' && <InspectTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
};

export default InspectorDashboard;