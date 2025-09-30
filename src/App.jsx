import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './login';
import Register from './register';
import VendorDashboard from './vendordash';
import DepotDashboard from './depotdash';
import InstallationDashboard from './insdash';
import InspectorDashboard from './inspdash';
import Navbar from './navbar';
import { authService } from './services';
import './App.css';
import AnalyticsDashboard from './analyticsdash';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={!user ? <Login onLogin={login} /> : <Navigate to={`/${user.role}`} />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/login" />} />
          <Route path="/analytics/:currentPage" element={<AnalyticsDashboard user={user} />} />
          <Route 
            path="/vendor" 
            element={user?.role === 'vendor' ? <VendorDashboard user={user} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/depot" 
            element={user?.role === 'depot' ? <DepotDashboard user={user} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/installation" 
            element={user?.role === 'installation' ? <InstallationDashboard user={user} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/inspector" 
            element={user?.role === 'inspector' ? <InspectorDashboard user={user} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;