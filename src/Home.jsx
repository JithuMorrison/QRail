import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    padding: '40px 20px'
  };

  const heroStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center',
    padding: '80px 20px'
  };

  const titleStyle = {
    fontSize: '3.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '20px',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    fontSize: '1.3rem',
    color: '#6c757d',
    marginBottom: '40px',
    fontWeight: '300'
  };

  const roleCardsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    margin: '60px 0'
  };

  const roleCardStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)'
  };

  const authButtonsStyle = {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginTop: '40px'
  };

  const buttonStyle = {
    padding: '15px 40px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '1.1rem',
    border: 'none',
    cursor: 'pointer'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 5px 15px rgba(102, 126, 234, 0.4)'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#667eea',
    border: '2px solid #667eea'
  };

  if (user) {
    return (
      <div style={containerStyle}>
        <div style={heroStyle}>
          <h1 style={titleStyle}>Welcome to QR Tracking System</h1>
          <p style={subtitleStyle}>
            You are logged in as: <strong style={{color: '#667eea'}}>{user.role}</strong>
          </p>
          <Link 
            to={`/${user.role}`} 
            style={primaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={heroStyle}>
        <h1 style={titleStyle}>QR-Based Material Tracking System</h1>
        <p style={subtitleStyle}>
          Track materials from vendor to installation with custom QR technology
        </p>
        
        <div style={roleCardsStyle}>
          {[
            { role: 'Vendor', desc: 'Create batches and generate QR codes', color: '#667eea' },
            { role: 'Depot Staff', desc: 'Scan and track inventory', color: '#764ba2' },
            { role: 'Installation Crew', desc: 'Scan and record installations', color: '#f093fb' },
            { role: 'Inspector', desc: 'Quality control and verification', color: '#4facfe' }
          ].map((item, index) => (
            <div 
              key={index}
              style={{
                ...roleCardStyle,
                borderTop: `4px solid ${item.color}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
              }}
            >
              <h3 style={{color: item.color, marginBottom: '15px', fontSize: '1.5rem'}}>
                {item.role}
              </h3>
              <p style={{color: '#6c757d', lineHeight: '1.6'}}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={authButtonsStyle}>
          <Link 
            to="/login" 
            style={primaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            Login
          </Link>
          <Link 
            to="/register" 
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'rgba(255, 255, 255, 0.9)';
              e.target.style.color = '#667eea';
            }}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;