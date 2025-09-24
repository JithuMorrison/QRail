import React, { useState, useEffect } from 'react';
import QRScanner from './qrscanner';

const InstallationDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('install');
  const [installations, setInstallations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    // Get current GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    loadInstallationHistory();
  }, []);

  const loadInstallationHistory = async () => {
    // Simulate loading installation history
    setInstallations([
      {
        id: 1,
        product_id: '507f1f77bcf86cd799439011',
        location: 'Building A, Floor 3',
        timestamp: new Date().toISOString(),
        status: 'completed'
      }
    ]);
  };

  const handleScanResult = async (scanData) => {
    if (!currentLocation) {
      alert('Please enable GPS location to record installation');
      return;
    }

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
          gps_latitude: currentLocation.latitude.toString(),
          gps_longitude: currentLocation.longitude.toString(),
          installation_notes: `Installed by ${user.username}`
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to installations list
        const newInstallation = {
          id: installations.length + 1,
          product_id: scanData.product_id,
          location: `Lat: ${currentLocation.latitude.toFixed(4)}, Lng: ${currentLocation.longitude.toFixed(4)}`,
          timestamp: new Date().toISOString(),
          status: 'completed',
          details: result
        };
        
        setInstallations(prev => [newInstallation, ...prev]);
        alert('Installation recorded successfully!');
      }
    } catch (error) {
      alert('Error recording installation');
    }
  };

  const InstallTab = () => (
    <div className="install-tab">
      <div className="location-info">
        <h4>Current Location</h4>
        {currentLocation ? (
          <div className="gps-coordinates">
            <span>Latitude: {currentLocation.latitude.toFixed(6)}</span>
            <span>Longitude: {currentLocation.longitude.toFixed(6)}</span>
          </div>
        ) : (
          <p>Getting location... Please enable GPS permissions.</p>
        )}
      </div>

      <QRScanner user={user} onScan={handleScanResult} />
    </div>
  );

  const HistoryTab = () => (
    <div className="history-tab">
      <h3>Installation History</h3>
      <div className="installations-list">
        {installations.length > 0 ? (
          installations.map(install => (
            <div key={install.id} className="installation-item">
              <div className="install-header">
                <span className="product-id">Product: {install.product_id.slice(-8)}</span>
                <span className="install-date">
                  {new Date(install.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="install-details">
                <p><strong>Location:</strong> {install.location}</p>
                <p><strong>Status:</strong> <span className="status-completed">Completed</span></p>
                <p><strong>Installed by:</strong> {user.username}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No installations recorded yet.</p>
        )}
      </div>
    </div>
  );

  const MapTab = () => (
    <div className="map-tab">
      <h3>Installation Map</h3>
      <div className="map-placeholder">
        <p>Map visualization would be displayed here</p>
        <div className="mock-map">
          <div className="map-points">
            {installations.slice(0, 5).map((install, index) => (
              <div key={index} className="map-point" style={{
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`
              }}>
                <div className="point-tooltip">
                  Product: {install.product_id.slice(-8)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard installation-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Installation Crew Dashboard</h1>
          <span className="user-welcome">Welcome, {user.username}</span>
        </div>
        <div className="header-right">
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-item">
          <span className="stat-label">Today's Installations</span>
          <span className="stat-value">{installations.filter(i => 
            new Date(i.timestamp).toDateString() === new Date().toDateString()
          ).length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Installations</span>
          <span className="stat-value">{installations.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">GPS Status</span>
          <span className="stat-value">{currentLocation ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'install' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('install')}
        >
          🔧 Install Products
        </button>
        <button 
          className={activeTab === 'history' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('history')}
        >
          📋 Installation History
        </button>
        <button 
          className={activeTab === 'map' ? 'nav-btn active' : 'nav-btn'}
          onClick={() => setActiveTab('map')}
        >
          🗺️ Installation Map
        </button>
      </nav>

      <div className="dashboard-content">
        {activeTab === 'install' && <InstallTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'map' && <MapTab />}
      </div>
    </div>
  );
};

export default InstallationDashboard;