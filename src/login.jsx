import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from './services';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      onLogin(response.user, response.token);
      navigate(`/${response.user.role}`);
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  const formContainerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '50px',
    borderRadius: '25px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '450px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333',
    fontSize: '2.2rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const formGroupStyle = {
    marginBottom: '25px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontWeight: '600',
    fontSize: '0.95rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 20px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.8)',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    padding: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px'
  };

  const errorStyle = {
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center',
    fontWeight: '500'
  };

  const linkStyle = {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h2 style={titleStyle}>Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
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
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
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
          {error && <div style={errorStyle}>{error}</div>}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? '🔐 Logging in...' : '🚀 Login to Dashboard'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '25px', color: '#666'}}>
          Don't have an account?{' '}
          <Link 
            to="/register" 
            style={linkStyle}
            onMouseEnter={(e) => {
              e.target.style.color = '#764ba2';
              e.target.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#667eea';
              e.target.style.textDecoration = 'none';
            }}
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;