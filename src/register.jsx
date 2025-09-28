import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from './services';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'vendor',
    organization: '',
    location: ''
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      navigate('/login');
    } catch (error) {
      setError(error.message);
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
    maxWidth: '500px',
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
    marginBottom: '20px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    color: '#555',
    fontWeight: '600',
    fontSize: '0.9rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.8)',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
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

  const focusStyle = (e) => {
    e.target.style.borderColor = '#667eea';
    e.target.style.background = 'rgba(102, 126, 234, 0.05)';
    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
  };

  const blurStyle = (e) => {
    e.target.style.borderColor = '#e0e0e0';
    e.target.style.background = 'rgba(255, 255, 255, 0.8)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <h2 style={titleStyle}>Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Role</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              style={selectStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            >
              <option value="vendor">Vendor</option>
              <option value="depot">Depot Staff</option>
              <option value="installation">Installation Crew</option>
              <option value="inspector">Inspector</option>
            </select>
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Organization</label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
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
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
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
            {loading ? '⏳ Creating Account...' : '🎯 Create Account'}
          </button>
        </form>
        <p style={{textAlign: 'center', marginTop: '25px', color: '#666'}}>
          Already have an account?{' '}
          <Link 
            to="/login" 
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
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;