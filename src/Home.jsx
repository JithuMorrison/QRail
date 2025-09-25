import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  if (user) {
    return (
      <div className="home-container">
        <div className="hero-section">
          <h1>Welcome to QR Tracking System</h1>
          <p>You are logged in as: <strong>{user.role}</strong></p>
          <Link to={`/${user.role}`} className="btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>QR-Based Material Tracking System</h1>
        <p>Track materials from vendor to installation with custom QR technology</p>
        
        <div className="role-cards">
          <div className="role-card">
            <h3>Vendor</h3>
            <p>Create batches and generate QR codes</p>
          </div>
          <div className="role-card">
            <h3>Depot Staff</h3>
            <p>Scan and track inventory</p>
          </div>
          <div className="role-card">
            <h3>Installation Crew</h3>
            <p>Scan and record installations</p>
          </div>
          <div className="role-card">
            <h3>Inspector</h3>
            <p>Quality control and verification</p>
          </div>
        </div>

        <div className="auth-buttons">
          <Link to="/login" className="btn-primary">Login</Link>
          <Link to="/register" className="btn-secondary">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;