import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    return `/${user.role}`;
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      vendor: 'Vendor',
      depot: 'Depot Staff',
      installation: 'Installation Crew',
      inspector: 'Inspector'
    };
    return roleNames[role] || role;
  };

  const navbarStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px'
  };

  const brandStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease'
  };

  const toggleStyle = {
    display: 'none',
    flexDirection: 'column',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    gap: '4px'
  };

  const toggleSpanStyle = {
    width: '25px',
    height: '3px',
    background: 'white',
    transition: 'all 0.3s ease',
    borderRadius: '2px'
  };

  const menuStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '30px'
  };

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '25px'
  };

  const linkStyle = {
    color: 'rgba(255, 255, 255, 0.9)',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    position: 'relative',
    overflow: 'hidden'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: 'white',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  };

  const logoutBtnStyle = {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    padding: '6px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '500'
  };

  // Mobile styles
  const mobileMenuStyle = {
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
  };

  return (
    <nav style={navbarStyle}>
      <div style={containerStyle}>
        <Link 
          to="/" 
          style={brandStyle}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          onClick={() => setIsMenuOpen(false)}
        >
          <span style={{fontSize: '1.8rem'}}>🔍</span>
          QR Tracking System
        </Link>
        
        <button 
          style={toggleStyle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span style={{...toggleSpanStyle, transform: isMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'}}></span>
          <span style={{...toggleSpanStyle, opacity: isMenuOpen ? 0 : 1}}></span>
          <span style={{...toggleSpanStyle, transform: isMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'}}></span>
        </button>

        <div style={isMenuOpen ? {...menuStyle, ...mobileMenuStyle} : menuStyle}>
          <div style={navStyle}>
            <Link 
              to="/" 
              style={linkStyle}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'rgba(255, 255, 255, 0.9)';
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  style={linkStyle}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'rgba(255, 255, 255, 0.9)';
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                <div style={userInfoStyle}>
                  <span style={{fontSize: '0.9rem'}}>
                    Welcome, <strong>{user.name}</strong> ({getRoleDisplayName(user.role)})
                  </span>
                  <button 
                    onClick={handleLogout} 
                    style={logoutBtnStyle}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  style={linkStyle}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'rgba(255, 255, 255, 0.9)';
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  style={{
                    ...linkStyle,
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;