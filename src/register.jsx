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

  // Modern color palette
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    light: '#f8fafc',
    dark: '#1e293b',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #5a6fd8 0%, #6a4196 100%)',
    error: '#dc2626',
    success: '#10b981'
  };

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
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Role descriptions for better UX
  const roleDescriptions = {
    vendor: 'Create material batches and generate QR codes',
    depot: 'Manage inventory and track material movements',
    installation: 'Scan and record material installations',
    inspector: 'Perform quality control and verification'
  };

  // Styles
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

  const formContainerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '60px 50px',
    borderRadius: '24px',
    boxShadow: `
      0 25px 50px -12px rgba(0, 0, 0, 0.15),
      0 0 0 1px rgba(0, 0, 0, 0.05)
    `,
    width: '100%',
    maxWidth: '520px',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    position: 'relative',
    overflow: 'hidden'
  };

  const decorationStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: colors.gradient,
    borderRadius: '24px 24px 0 0'
  };

  const titleStyle = {
    textAlign: 'center',
    marginBottom: '10px',
    fontSize: '2.5rem',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: '1.2',
    letterSpacing: '-0.02em'
  };

  const subtitleStyle = {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: '1.1rem',
    marginBottom: '40px',
    fontWeight: '400'
  };

  const formGroupStyle = {
    marginBottom: '24px',
    position: 'relative'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    color: colors.dark,
    fontWeight: '600',
    fontSize: '0.95rem',
    letterSpacing: '0.5px'
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 20px',
    border: `2px solid #e2e8f0`,
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'rgba(255, 255, 255, 0.8)',
    boxSizing: 'border-box',
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
    width: '100%',
    padding: '18px',
    background: colors.gradient,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1.1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginTop: '10px',
    letterSpacing: '0.5px',
    position: 'relative',
    overflow: 'hidden'
  };

  const errorStyle = {
    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    color: colors.error,
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '25px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '0.95rem',
    border: `1px solid ${colors.error}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const linkStyle = {
    color: colors.primary,
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '1rem'
  };

  const footerStyle = {
    textAlign: 'center',
    marginTop: '35px',
    paddingTop: '25px',
    borderTop: `1px solid rgba(0, 0, 0, 0.1)`,
    color: colors.secondary,
    fontSize: '0.95rem'
  };

  const roleDescriptionStyle = {
    fontSize: '0.85rem',
    color: colors.secondary,
    marginTop: '6px',
    fontStyle: 'italic',
    padding: '8px 12px',
    background: 'rgba(37, 99, 235, 0.05)',
    borderRadius: '8px',
    borderLeft: `3px solid ${colors.primary}`
  };

  const focusStyle = (e) => {
    e.target.style.borderColor = colors.primary;
    e.target.style.background = 'rgba(37, 99, 235, 0.03)';
    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}15`;
  };

  const blurStyle = (e) => {
    e.target.style.borderColor = '#e2e8f0';
    e.target.style.background = 'rgba(255, 255, 255, 0.8)';
    e.target.style.boxShadow = 'none';
  };

  const getRoleIcon = (role) => {
    const icons = {
      vendor: '🏭',
      depot: '📦',
      installation: '🔧',
      inspector: '✅'
    };
    return icons[role] || '👤';
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <div style={decorationStyle}></div>
        
        <div>
          <h2 style={titleStyle}>Join QR TrackPro</h2>
          <p style={subtitleStyle}>
            Create your account and start tracking materials efficiently
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              👤 Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              📧 Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your work email"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Role Selection */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              💼 Your Role
            </label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              style={selectStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            >
              <option value="vendor">🏭 Vendor</option>
              <option value="depot">📦 Depot Staff</option>
              <option value="installation">🔧 Installation Crew</option>
              <option value="inspector">✅ Inspector</option>
            </select>
            <div style={roleDescriptionStyle}>
              {getRoleIcon(formData.role)} {roleDescriptions[formData.role]}
            </div>
          </div>

          {/* Organization Information */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              🏢 Organization
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              required
              placeholder="Enter your organization name"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              📍 Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="Enter your location/city"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Password Fields */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              🔒 Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a strong password"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              🔑 Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {error && (
            <div style={errorStyle}>
              <span style={{fontSize: '1.2rem'}}>⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...buttonStyle,
              opacity: loading ? 0.8 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = `0 12px 30px ${colors.primary}40`;
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  animation: 'spin 1s linear infinite',
                  marginRight: '10px'
                }}>🔄</span>
                Creating your account...
              </>
            ) : (
              <>
                🎯 Create Account & Get Started
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={{margin: 0}}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={linkStyle}
              onMouseEnter={(e) => {
                e.target.style.color = colors.primaryDark;
                e.target.style.textDecoration = 'underline';
                e.target.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = colors.primary;
                e.target.style.textDecoration = 'none';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              Sign in to your account
            </Link>
          </p>
        </div>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            input::placeholder, select::placeholder {
              color: #94a3b8;
              font-weight: 400;
            }
            
            input:focus, select:focus {
              outline: none;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Register;