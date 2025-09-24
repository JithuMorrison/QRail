import React, { useState, useEffect } from 'react';
import QRScanner from './qrscanner';

const DepotDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('scan');
  const [scannedProducts, setScannedProducts] = useState([]);
  const [stats, setStats] = useState({});
  const [recentScans, setRecentScans] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load stats
      const statsResponse = await fetch('http://localhost:8000/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent scans
      // This would be a custom endpoint - for now we'll simulate
      setRecentScans([
        { product_id: '507f1f77bcf86cd799439011', timestamp: new Date(), location: 'Area A' },
        { product_id: '507f191e810c19729de860ea', timestamp: new Date(), location: 'Area B' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleScanResult = (scanData) => {
    // Add to scanned products list
    const newScan = {
      ...scanData,
      scanTime: new Date().toLocaleString(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    setScannedProducts(prev => [newScan, ...prev]);
    
    // Show success message
    alert(`Product ${scanData.product_id} scanned successfully!`);
  };

  const ScanTab = () => (
    <div className="scan-tab">
      <div className="scan-header">
        <h3>Scan QR Codes</h3>
        <p>Scan product QR codes to update their location in the depot</p>
      </div>
      
      <QRScanner user={user} onScan={handleScanResult} />
      
      {scannedProducts.length > 0 && (
        <div className="recent-scans">
          <h4>Recently Scanned Products</h4>
          <div className="scans-list">
            {scannedProducts.slice(0, 5).map(scan => (
              <div key={scan.id} className="scan-item">
                <div className="scan-info">
                  <span className="product-id">{scan.product_id.slice(-8)}</span>
                  <span className="scan-time">{scan.scanTime}</span>
                </div>
                <div className="scan-details">
                  {scan.tracking?.current_location && (
                    <span>Location: {scan.tracking.current_location}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const InventoryTab = () => (
    <div className="inventory-tab">
      <h3>Inventory Management</h3>
      <div className="inventory-actions">
        <button className="btn-primary">Export Inventory Report</button>
        <button className="btn-secondary">Search Products</button>
      </div>
      
      <div className="inventory-stats">
        <div className="stat-card">
          <h4>Total Scanned Today</h4>
          <div className="stat-value">{stats.scans_today || 0}</div>
        </div>
        <div className="stat-card">
          <h4>Total Products</h4>
          <div className="stat-value">{stats.total_scans || 0}</div>
        </div>
      </div>
    </div>
  );

  const LocationsTab = () => (
    <div className="locations-tab">
      <h3>Depot Locations</h3>
      <div className="locations-grid">
        <div className="location-card">
          <h4>Area A - Main Storage</h4>
          <p>Capacity: 200 units</p>
          <p>Current: 45 units</p>
        </div>
        <div className="location-card">
          <h4>Area B - Processing</h4>
          <p>Capacity: 100 units</p>
          <p>Current: 23 units</p>
        </div>
        <div className="location-card">
          <h4>Area C - Shipping</h4>
          <p>Capacity: 150 units</p>
          <p>Current: 12 units</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard depot-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Depot Management Dashboard</h1>
          <span className="user-welcome">Welcome, {user.username} ({user.company})</span>
        </div>
        <div className="header-right">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-item">
          <span className="stat-label">Today's Scans</span>
          <span className="stat-value">{stats.scans_today || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{stats.total_scans || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active Locations</span>
          <span className="stat-value">3</span>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'scan' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('scan')}
        >
          📱 Scan QR Codes
        </button>
        <button 
          className={activeTab === 'inventory' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory Management
        </button>
        <button 
          className={activeTab === 'locations' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('locations')}
        >
          🏢 Depot Locations
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'scan' && <ScanTab />}
        {activeTab === 'inventory' && <InventoryTab />}
        {activeTab === 'locations' && <LocationsTab />}
      </div>
    </div>
  );
};

export default DepotDashboard;