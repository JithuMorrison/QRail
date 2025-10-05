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

  // Modern color palette matching the design system
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

    try {
      const response = await authService.login(formData);
      onLogin(response.user, response.token);
      navigate(`/${response.user.role}`);
    } catch (error) {
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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
    maxWidth: '480px',
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
    marginBottom: '40px',
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
    marginTop: '-30px',
    marginBottom: '40px',
    fontWeight: '400'
  };

  const formGroupStyle = {
    marginBottom: '28px',
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
    marginTop: '20px',
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

  const iconStyle = {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.2rem',
    opacity: 0.6,
    transition: 'all 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={formContainerStyle}>
        <div style={decorationStyle}></div>
        
        <div>
          <h2 style={titleStyle}>Welcome Back</h2>
          <p style={subtitleStyle}>
            Sign in to access your QR TrackPro dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>
              📧 Email Address
            </label>
            <div style={{position: 'relative'}}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email address"
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

          <div style={formGroupStyle}>
            <label style={labelStyle}>
              🔒 Password
            </label>
            <div style={{position: 'relative'}}>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
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
                Signing you in...
              </>
            ) : (
              <>
                🚀 Sign In to Dashboard
              </>
            )}
          </button>
        </form>

        <div style={footerStyle}>
          <p style={{margin: 0}}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
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
              Create your account
            </Link>
          </p>
        </div>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            
            input::placeholder {
              color: #94a3b8;
              font-weight: 400;
            }
            
            input:focus {
              outline: none;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Login;