import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Modern color palette matching the home page
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    light: '#f8fafc',
    dark: '#1e293b',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #5a6fd8 0%, #6a4196 100%)'
  };

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

  // Styles
  const navbarStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '80px'
  };

  const brandStyle = {
    color: colors.dark,
    textDecoration: 'none',
    fontSize: '1.8rem',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    background: colors.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const toggleStyle = {
    display: 'none',
    flexDirection: 'column',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    gap: '4px',
    borderRadius: '8px',
    transition: 'all 0.3s ease'
  };

  const toggleSpanStyle = {
    width: '25px',
    height: '3px',
    background: colors.dark,
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
    gap: '20px'
  };

  const linkStyle = {
    color: colors.secondary,
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    fontWeight: '500',
    fontSize: '0.95rem',
    position: 'relative'
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    color: colors.dark,
    padding: '10px 20px',
    background: 'rgba(37, 99, 235, 0.05)',
    borderRadius: '12px',
    border: `1px solid rgba(37, 99, 235, 0.1)`,
    fontSize: '0.9rem'
  };

  const logoutBtnStyle = {
    background: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`,
    padding: '8px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    fontSize: '0.9rem'
  };

  const primaryButtonStyle = {
    background: colors.gradient,
    color: 'white',
    textDecoration: 'none',
    padding: '10px 24px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: `0 4px 15px ${colors.primary}40`
  };

  // Mobile styles
  const mobileMenuStyle = {
    display: 'none',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    padding: '30px 20px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    borderTop: '1px solid rgba(0, 0, 0, 0.05)'
  };

  const mobileNavStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'stretch'
  };

  const mobileLinkStyle = {
    ...linkStyle,
    display: 'block',
    padding: '15px 20px',
    textAlign: 'center',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    background: 'rgba(255, 255, 255, 0.5)'
  };

  // Media queries for responsive design
  const mediaQueries = `
    @media (max-width: 768px) {
      .desktop-menu { display: none !important; }
      .mobile-toggle { display: flex !important; }
      .mobile-menu { display: block !important; }
    }
  `;

  return (
    <>
      <style>{mediaQueries}</style>
      <nav style={navbarStyle}>
        <div style={containerStyle}>
          <Link 
            to="/" 
            style={brandStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
            }}
            onClick={() => setIsMenuOpen(false)}
          >
            <span style={{fontSize: '2rem', WebkitTextFillColor: 'initial'}}>🔍</span>
            QR TrackPro
          </Link>
          
          {/* Mobile Toggle Button */}
          <button 
            className="mobile-toggle"
            style={toggleStyle}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <span style={{
              ...toggleSpanStyle, 
              transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
            }}></span>
            <span style={{
              ...toggleSpanStyle, 
              opacity: isMenuOpen ? 0 : 1
            }}></span>
            <span style={{
              ...toggleSpanStyle, 
              transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'
            }}></span>
          </button>

          {/* Desktop Menu */}
          <div className="desktop-menu" style={menuStyle}>
            <div style={navStyle}>
              <Link 
                to="/" 
                style={linkStyle}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(37, 99, 235, 0.05)';
                  e.target.style.color = colors.primary;
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = colors.secondary;
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Home
              </Link>
              
              {user ? (
                <>
                  <Link 
                    to={getDashboardLink()} 
                    style={linkStyle}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(37, 99, 235, 0.05)';
                      e.target.style.color = colors.primary;
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = colors.secondary;
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Dashboard
                  </Link>
                  
                  <div style={userInfoStyle}>
                    <span>
                      Welcome, <strong style={{color: colors.primary}}>{user.name}</strong>
                      <br />
                      <small style={{color: colors.secondary, fontSize: '0.8rem'}}>
                        {getRoleDisplayName(user.role)}
                      </small>
                    </span>
                    <button 
                      onClick={handleLogout} 
                      style={logoutBtnStyle}
                      onMouseEnter={(e) => {
                        e.target.style.background = colors.primary;
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = colors.primary;
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <Link 
                    to="/login" 
                    style={linkStyle}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(37, 99, 235, 0.05)';
                      e.target.style.color = colors.primary;
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = colors.secondary;
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    style={primaryButtonStyle}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = `0 8px 25px ${colors.primary}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="mobile-menu" style={mobileMenuStyle}>
              <div style={mobileNavStyle}>
                <Link 
                  to="/" 
                  style={mobileLinkStyle}
                  onClick={() => setIsMenuOpen(false)}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(37, 99, 235, 0.1)';
                    e.target.style.color = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                    e.target.style.color = colors.secondary;
                  }}
                >
                  Home
                </Link>
                
                {user ? (
                  <>
                    <Link 
                      to={getDashboardLink()} 
                      style={mobileLinkStyle}
                      onClick={() => setIsMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(37, 99, 235, 0.1)';
                        e.target.style.color = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                        e.target.style.color = colors.secondary;
                      }}
                    >
                      Dashboard
                    </Link>
                    
                    <div style={{
                      ...userInfoStyle, 
                      flexDirection: 'column',
                      textAlign: 'center',
                      gap: '10px'
                    }}>
                      <span>
                        Welcome, <strong style={{color: colors.primary}}>{user.name}</strong>
                        <br />
                        <small style={{color: colors.secondary, fontSize: '0.8rem'}}>
                          {getRoleDisplayName(user.role)}
                        </small>
                      </span>
                      <button 
                        onClick={handleLogout} 
                        style={logoutBtnStyle}
                        onMouseEnter={(e) => {
                          e.target.style.background = colors.primary;
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = colors.primary;
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
                      style={mobileLinkStyle}
                      onClick={() => setIsMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(37, 99, 235, 0.1)';
                        e.target.style.color = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.5)';
                        e.target.style.color = colors.secondary;
                      }}
                    >
                      Login
                    </Link>
                    <Link 
                      to="/register" 
                      style={{
                        ...primaryButtonStyle,
                        textAlign: 'center',
                        display: 'block'
                      }}
                      onClick={() => setIsMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 8px 25px ${colors.primary}60`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
                      }}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;