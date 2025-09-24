import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Server error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Login to Inventory System</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <Link to="/register">Register here</Link></p>
        <div className="role-info">
          <h4>Available Roles:</h4>
          <ul>
            <li><strong>Vendor:</strong> Create batches and generate QR codes</li>
            <li><strong>Depot:</strong> Scan and track inventory in depot</li>
            <li><strong>Installation:</strong> Scan during installation</li>
            <li><strong>Inspector:</strong> Final inspection scans</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;