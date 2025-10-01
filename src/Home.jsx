import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ user }) => {
  // Modern color palette
  const colors = {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    secondary: '#64748b',
    accent: '#f59e0b',
    light: '#f8fafc',
    dark: '#1e293b',
    success: '#10b981',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #5a6fd8 0%, #6a4196 100%)'
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  };

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '1rem 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  };

  const navStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const logoStyle = {
    fontSize: '1.8rem',
    fontWeight: '800',
    background: colors.gradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  };

  const heroStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '130px 2rem 80px',
    textAlign: 'center'
  };

  const titleStyle = {
    fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
    fontWeight: '800',
    background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1.5rem',
    lineHeight: '1.1',
    letterSpacing: '-0.02em'
  };

  const subtitleStyle = {
    fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
    color: colors.secondary,
    marginBottom: '3rem',
    fontWeight: '400',
    lineHeight: '1.6',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto'
  };

  const featuresGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    margin: '4rem 0',
    padding: '0 2rem'
  };

  const featureCardStyle = {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2.5rem 2rem',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    textAlign: 'center'
  };

  const iconStyle = {
    width: '70px',
    height: '70px',
    margin: '0 auto 1.5rem',
    background: colors.gradient,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    color: 'white'
  };

  const statsStyle = {
    background: colors.gradient,
    color: 'white',
    padding: '4rem 2rem',
    margin: '4rem 0'
  };

  const statsGridStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
    textAlign: 'center'
  };

  const statNumberStyle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    marginBottom: '0.5rem'
  };

  const statLabelStyle = {
    fontSize: '1rem',
    opacity: 0.9
  };

  const buttonBaseStyle = {
    padding: '1rem 2.5rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.5px'
  };

  const primaryButtonStyle = {
    ...buttonBaseStyle,
    background: colors.gradient,
    color: 'white',
    boxShadow: `0 4px 15px ${colors.primary}40`
  };

  const secondaryButtonStyle = {
    ...buttonBaseStyle,
    background: 'transparent',
    color: colors.primary,
    border: `2px solid ${colors.primary}`
  };

  const footerStyle = {
    background: colors.dark,
    color: 'white',
    padding: '3rem 2rem',
    textAlign: 'center'
  };

  const roleCards = [
    {
      role: 'Vendor',
      desc: 'Create material batches and generate unique QR codes for tracking',
      icon: '🏭',
      color: colors.primary
    },
    {
      role: 'Depot Staff',
      desc: 'Scan QR codes and manage inventory across multiple depots',
      icon: '📦',
      color: colors.success
    },
    {
      role: 'Installation Crew',
      desc: 'Scan and record installations with real-time updates',
      icon: '🔧',
      color: colors.accent
    },
    {
      role: 'Inspector',
      desc: 'Perform quality control and verification checks',
      icon: '✅',
      color: '#8b5cf6'
    }
  ];

  const features = [
    {
      title: 'Real-time Tracking',
      desc: 'Monitor material movement from vendor to installation in real-time',
      icon: '📱'
    },
    {
      title: 'QR Code Technology',
      desc: 'Custom QR codes with encrypted data for secure tracking',
      icon: '🔐'
    },
    {
      title: 'Automated Reports',
      desc: 'Generate comprehensive reports and analytics automatically',
      icon: '📊'
    },
    {
      title: 'Mobile Friendly',
      desc: 'Fully responsive design works on all devices and scanners',
      icon: '📲'
    }
  ];

  if (user) {
    return (
      <div style={containerStyle}>
        <header style={headerStyle}>
          <nav style={navStyle}>
            <div style={logoStyle}>QR TrackPro</div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: colors.secondary }}>Welcome, {user.name}</span>
              <Link 
                to={`/${user.role}`} 
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
                Go to Dashboard
              </Link>
            </div>
          </nav>
        </header>

        <div style={heroStyle}>
          <h1 style={titleStyle}>Welcome to Your Dashboard</h1>
          <p style={subtitleStyle}>
            You are logged in as: <strong style={{color: colors.primary}}>{user.role}</strong>
          </p>
          
          <div style={featuresGridStyle}>
            {roleCards.map((item, index) => (
              <div 
                key={index}
                style={{
                  ...featureCardStyle,
                  borderTop: `4px solid ${item.color}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                }}
              >
                <div style={{...iconStyle, background: item.color}}>
                  {item.icon}
                </div>
                <h3 style={{color: item.color, marginBottom: '1rem', fontSize: '1.4rem', fontWeight: '700'}}>
                  {item.role}
                </h3>
                <p style={{color: colors.secondary, lineHeight: '1.6'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Hero Section */}
      <section style={heroStyle}>
        <h1 style={titleStyle}>
          Streamline Your Material Tracking with QR Technology
        </h1>
        <p style={subtitleStyle}>
          Track materials seamlessly from vendor to installation with our advanced QR-based tracking system. 
          Improve efficiency, reduce errors, and gain real-time visibility across your supply chain.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
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
            Get Started Free
          </Link>
          <Link 
            to="/login" 
            style={secondaryButtonStyle}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.background = colors.primary;
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = 'transparent';
              e.target.style.color = colors.primary;
            }}
          >
            Schedule Demo
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          marginBottom: '1rem',
          color: colors.dark 
        }}>
          Why Choose QR TrackPro?
        </h2>
        <p style={{ 
          textAlign: 'center', 
          color: colors.secondary, 
          fontSize: '1.2rem',
          marginBottom: '4rem',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Powerful features designed to transform your material tracking process
        </p>
        
        <div style={featuresGridStyle}>
          {features.map((feature, index) => (
            <div 
              key={index}
              style={featureCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div style={iconStyle}>
                {feature.icon}
              </div>
              <h3 style={{ 
                color: colors.dark, 
                marginBottom: '1rem', 
                fontSize: '1.3rem',
                fontWeight: '600'
              }}>
                {feature.title}
              </h3>
              <p style={{ 
                color: colors.secondary, 
                lineHeight: '1.6',
                fontSize: '0.95rem'
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Role-based Section */}
      <section style={{ background: colors.light, padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '1rem',
            color: colors.dark 
          }}>
            Designed for Every Team
          </h2>
          <p style={{ 
            textAlign: 'center', 
            color: colors.secondary, 
            fontSize: '1.2rem',
            marginBottom: '4rem'
          }}>
            Tailored experiences for different roles in your organization
          </p>
          
          <div style={featuresGridStyle}>
            {roleCards.map((item, index) => (
              <div 
                key={index}
                style={{
                  ...featureCardStyle,
                  borderTop: `4px solid ${item.color}`,
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                }}
              >
                <div style={{...iconStyle, background: item.color}}>
                  {item.icon}
                </div>
                <h3 style={{ 
                  color: item.color, 
                  marginBottom: '1rem', 
                  fontSize: '1.4rem',
                  fontWeight: '700'
                }}>
                  {item.role}
                </h3>
                <p style={{ 
                  color: colors.secondary, 
                  lineHeight: '1.6'
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={statsStyle}>
        <div style={statsGridStyle}>
          <div>
            <div style={statNumberStyle}>99.9%</div>
            <div style={statLabelStyle}>Tracking Accuracy</div>
          </div>
          <div>
            <div style={statNumberStyle}>50%</div>
            <div style={statLabelStyle}>Faster Processing</div>
          </div>
          <div>
            <div style={statNumberStyle}>10K+</div>
            <div style={statLabelStyle}>Materials Tracked</div>
          </div>
          <div>
            <div style={statNumberStyle}>24/7</div>
            <div style={statLabelStyle}>Real-time Monitoring</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            marginBottom: '1.5rem',
            color: colors.dark 
          }}>
            Ready to Transform Your Tracking?
          </h2>
          <p style={{ 
            color: colors.secondary, 
            fontSize: '1.2rem',
            marginBottom: '2.5rem',
            lineHeight: '1.6'
          }}>
            Join thousands of companies that trust QR TrackPro for their material tracking needs.
          </p>
          <Link 
            to="/register" 
            style={{
              ...primaryButtonStyle,
              padding: '1.2rem 3rem',
              fontSize: '1.2rem'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = `0 12px 30px ${colors.primary}60`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${colors.primary}40`;
            }}
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={footerStyle}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={logoStyle}>QR TrackPro</div>
          <p style={{ marginTop: '1rem', opacity: 0.8 }}>
            Advanced QR-based Material Tracking System
          </p>
          <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.9rem' }}>
            © 2024 QR TrackPro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;