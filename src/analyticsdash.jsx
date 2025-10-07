// AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import { analyticsService } from './analyticsserv';
import { useParams } from 'react-router-dom';

const AnalyticsDashboard = ({ user }) => {
  const { currentPage } = useParams();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, currentPage]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await analyticsService.getAnalytics({
        timeRange,
        userRole: user.role,
        currentPage
      });
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    headerContent: {
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    nav: {
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      padding: '0 2rem',
      display: 'flex',
      gap: '0',
      borderBottom: '1px solid #e5e7eb',
      overflowX: 'auto'
    },
    navTab: {
      padding: '1rem 2rem',
      background: 'none',
      border: 'none',
      borderBottom: '3px solid transparent',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: '#6b7280',
      whiteSpace: 'nowrap'
    },
    navTabActive: {
      borderBottomColor: '#3b82f6',
      color: '#3b82f6',
      background: 'rgba(59, 130, 246, 0.05)'
    },
    main: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem'
    },
    controls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    timeFilter: {
      display: 'flex',
      gap: '0.5rem',
      background: 'rgba(255, 255, 255, 0.9)',
      padding: '0.5rem',
      borderRadius: '8px',
      backdropFilter: 'blur(10px)'
    },
    timeButton: {
      padding: '0.5rem 1rem',
      border: 'none',
      borderRadius: '6px',
      background: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    timeButtonActive: {
      background: '#3b82f6',
      color: 'white'
    },
    section: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    statCard: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '15px',
      padding: '1.5rem',
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.3s ease'
    },
    chartContainer: {
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
    },
    summaryCard: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    },
    loading: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '3rem',
      color: '#6b7280'
    },
    spinner: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3b82f6',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2.5rem', fontWeight: '700' }}>
              📊 Analytics Dashboard
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '1.1rem' }}>
              Comprehensive insights and performance metrics
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            padding: '1rem 2rem',
            borderRadius: '15px',
            color: 'white',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '0.9rem', opacity: 0.9 }}>Current View</span>
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {getPageDisplayName(currentPage)}
            </span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <button 
          style={{
            ...styles.navTab,
            ...(activeSection === 'overview' && styles.navTabActive)
          }}
          onClick={() => setActiveSection('overview')}
        >
          📈 Overview
        </button>
        <button 
          style={{
            ...styles.navTab,
            ...(activeSection === 'ai-summary' && styles.navTabActive)
          }}
          onClick={() => setActiveSection('ai-summary')}
        >
          🤖 AI Summarization
        </button>
        <button 
          style={{
            ...styles.navTab,
            ...(activeSection === 'maintenance' && styles.navTabActive)
          }}
          onClick={() => setActiveSection('maintenance')}
        >
          🔧 Maintenance Analytics
        </button>
        <button 
          style={{
            ...styles.navTab,
            ...(activeSection === 'reports' && styles.navTabActive)
          }}
          onClick={() => setActiveSection('reports')}
        >
          📋 Detailed Reports
        </button>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Time Filter */}
        <div style={styles.controls}>
          <div style={styles.timeFilter}>
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                style={{
                  ...styles.timeButton,
                  ...(timeRange === range && styles.timeButtonActive)
                }}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <div style={{ color: 'white', fontWeight: '600' }}>
            Last Updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <OverviewSection 
            data={analyticsData} 
            currentPage={currentPage}
            styles={styles}
          />
        )}

        {/* AI Summarization Section */}
        {activeSection === 'ai-summary' && (
          <AISummarySection 
            data={analyticsData}
            currentPage={currentPage}
            styles={styles}
          />
        )}

        {/* Maintenance Analytics Section */}
        {activeSection === 'maintenance' && (
          <MaintenanceAnalyticsSection 
            data={analyticsData}
            currentPage={currentPage}
            styles={styles}
          />
        )}

        {/* Reports Section */}
        {activeSection === 'reports' && (
          <ReportsSection 
            data={analyticsData}
            styles={styles}
          />
        )}
      </main>

      {/* Add CSS animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Overview Section Component
const OverviewSection = ({ data, currentPage, styles }) => {
  const getPageSpecificStats = () => {
    const baseStats = [
      { title: 'Total Activities', value: data?.totalActivities || 0, icon: '📊', change: '+12%' },
      { title: 'Success Rate', value: `${data?.successRate || 0}%`, icon: '✅', change: '+5%' },
      { title: 'Active Users', value: data?.activeUsers || 0, icon: '👥', change: '+8%' },
      { title: 'Avg Processing Time', value: `${data?.avgProcessingTime || 0}m`, icon: '⏱️', change: '-15%' }
    ];

    switch (currentPage) {
      case 'vendor':
        return [
          { title: 'Batches Created', value: data?.batchesCreated || 0, icon: '🏭', change: '+18%' },
          { title: 'QR Codes Generated', value: data?.qrCodesGenerated || 0, icon: '🔳', change: '+22%' },
          { title: 'Materials Processed', value: data?.materialsProcessed || 0, icon: '📦', change: '+15%' },
          { title: 'Batch Success Rate', value: `${data?.batchSuccessRate || 0}%`, icon: '🎯', change: '+3%' }
        ];
      case 'depot':
        return [
          { title: 'Scans Processed', value: data?.scansProcessed || 0, icon: '📱', change: '+25%' },
          { title: 'Materials Stored', value: data?.materialsStored || 0, icon: '🏪', change: '+20%' },
          { title: 'Storage Utilization', value: `${data?.storageUtilization || 0}%`, icon: '📊', change: '+8%' },
          { title: 'Scan Accuracy', value: `${data?.scanAccuracy || 0}%`, icon: '🎯', change: '+2%' }
        ];
      case 'installation':
        return [
          { title: 'Installations Completed', value: data?.installationsCompleted || 0, icon: '🔧', change: '+30%' },
          { title: 'Active Projects', value: data?.activeProjects || 0, icon: '🏗️', change: '+12%' },
          { title: 'Installation Success', value: `${data?.installationSuccess || 0}%`, icon: '✅', change: '+7%' },
          { title: 'Avg Installation Time', value: `${data?.avgInstallationTime || 0}m`, icon: '⏱️', change: '-20%' }
        ];
      case 'inspector':
        return [
          { title: 'Inspections Done', value: data?.inspectionsDone || 0, icon: '🔍', change: '+28%' },
          { title: 'Defect Rate', value: `${data?.defectRate || 0}%`, icon: '⚠️', change: '-5%' },
          { title: 'Approval Rate', value: `${data?.approvalRate || 0}%`, icon: '✅', change: '+4%' },
          { title: 'Avg Inspection Time', value: `${data?.avgInspectionTime || 0}m`, icon: '⏱️', change: '-12%' }
        ];
      case 'maintenance':
        return [
          { title: 'Work Orders Completed', value: data?.workOrdersCompleted || 0, icon: '🔧', change: '+18%' },
          { title: 'Active Work Orders', value: data?.activeWorkOrders || 0, icon: '📋', change: '+8%' },
          { title: 'On-Time Completion', value: `${data?.onTimeCompletion || 0}%`, icon: '✅', change: '+5%' },
          { title: 'Avg Repair Time', value: `${data?.avgRepairTime || 0}h`, icon: '⏱️', change: '-12%' }
        ];
      default:
        return baseStats;
    }
  };

  return (
    <div>
      {/* Key Metrics */}
      <div style={styles.section}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
          Key Performance Indicators
        </h2>
        <div style={styles.statsGrid}>
          {getPageSpecificStats().map((stat, index) => (
            <div 
              key={index}
              style={styles.statCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    {stat.title}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.5rem' }}>
                    {stat.change} from last period
                  </div>
                </div>
                <div style={{ fontSize: '3rem' }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Activity Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Activity Trend</h3>
          <div style={styles.chartContainer}>
            <LineChart data={data?.activityTrend || [65, 78, 90, 81, 56, 55, 40]} />
          </div>
        </div>

        {/* Distribution Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Distribution</h3>
          <div style={styles.chartContainer}>
            <PieChart data={data?.distribution || [30, 25, 20, 15, 10]} />
          </div>
        </div>

        {/* Performance Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Performance Metrics</h3>
          <div style={styles.chartContainer}>
            <BarChart data={data?.performance || [85, 92, 78, 88, 95]} />
          </div>
        </div>

        {/* Timeline Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Timeline Analysis</h3>
          <div style={styles.chartContainer}>
            <AreaChart data={data?.timeline || [45, 52, 48, 61, 55, 68, 72]} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Maintenance Analytics Section Component
const MaintenanceAnalyticsSection = ({ data, currentPage, styles }) => {
  const maintenanceStats = [
    { title: 'Critical Repairs', value: data?.criticalRepairs || 12, icon: '🚨', change: '+2' },
    { title: 'Preventive Maintenance', value: data?.preventiveMaintenance || 45, icon: '🛡️', change: '+8' },
    { title: 'Backlog Tasks', value: data?.backlogTasks || 23, icon: '📋', change: '-5' },
    { title: 'Resource Utilization', value: `${data?.resourceUtilization || 78}%`, icon: '👥', change: '+12%' }
  ];

  const workOrderBreakdown = [
    { type: 'Emergency Repairs', count: 8, color: '#ef4444' },
    { type: 'Scheduled Maintenance', count: 25, color: '#3b82f6' },
    { type: 'Preventive Checks', count: 32, color: '#10b981' },
    { type: 'Inspections', count: 18, color: '#f59e0b' }
  ];

  return (
    <div>
      {/* Maintenance Overview */}
      <div style={styles.section}>
        <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
          🔧 Maintenance Operations
        </h2>
        <div style={styles.statsGrid}>
          {maintenanceStats.map((stat, index) => (
            <div 
              key={index}
              style={styles.statCard}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                    {stat.title}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.9, marginTop: '0.5rem' }}>
                    {stat.change} from last period
                  </div>
                </div>
                <div style={{ fontSize: '3rem' }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Work Order Analysis */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Work Order Breakdown</h3>
          <div style={styles.chartContainer}>
            <div style={{ height: '300px', display: 'flex', alignItems: 'end', justifyContent: 'space-around', padding: '1rem' }}>
              {workOrderBreakdown.map((item, index) => (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      background: item.color,
                      width: '40px',
                      height: `${(item.count / 50) * 200}px`,
                      borderRadius: '6px 6px 0 0',
                      marginBottom: '0.5rem'
                    }}
                  ></div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>{item.count}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{item.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Priority Distribution</h3>
          <div style={styles.chartContainer}>
            <PieChart data={[15, 25, 40, 20]} />
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { label: 'Critical', color: '#ef4444', count: 15 },
                  { label: 'High', color: '#f59e0b', count: 25 },
                  { label: 'Medium', color: '#3b82f6', count: 40 },
                  { label: 'Low', color: '#10b981', count: 20 }
                ].map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', background: item.color, borderRadius: '2px' }}></div>
                    <span style={{ fontSize: '0.8rem' }}>{item.label}: {item.count}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Efficiency */}
      <div style={styles.section}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Maintenance Efficiency</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { metric: 'First-Time Fix Rate', value: '92%', trend: '+3%' },
            { metric: 'Mean Time to Repair', value: '4.2h', trend: '-0.8h' },
            { metric: 'Schedule Compliance', value: '88%', trend: '+5%' },
            { metric: 'Cost per Repair', value: '$245', trend: '-12%' }
          ].map((item, index) => (
            <div key={index} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                {item.metric}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: item.trend.includes('+') || item.trend.includes('-') ? 
                      (item.trend.includes('-') ? '#10b981' : '#f59e0b') : '#6b7280'
              }}>
                {item.trend}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fixed Line Chart Component
const LineChart = ({ data }) => {
  const maxValue = Math.max(...data);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#lineGradient)"
          fillOpacity="0.3"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((value, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - (value / maxValue) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#667eea"
              stroke="#fff"
              strokeWidth="1"
            />
          );
        })}
        
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px',
        fontSize: '0.7rem',
        color: '#6b7280'
      }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(0, data.length).map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
};

// Fixed Area Chart Component
const AreaChart = ({ data }) => {
  const maxValue = Math.max(...data);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ height: '200px', position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <polygon
          points={`0,100 ${points} 100,100`}
          fill="url(#areaGradient)"
          fillOpacity="0.6"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* X-axis labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '10px',
        fontSize: '0.7rem',
        color: '#6b7280'
      }}>
        {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'].slice(0, data.length).map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
};

// Bar Chart Component
const BarChart = ({ data }) => {
  const maxValue = Math.max(...data);
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'end', 
      justifyContent: 'space-around', 
      height: '200px',
      padding: '1rem 0'
    }}>
      {data.map((value, index) => (
        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              width: '30px',
              height: `${(value / maxValue) * 150}px`,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.3s ease'
            }}
          ></div>
          <div style={{ 
            marginTop: '8px', 
            fontSize: '0.7rem', 
            color: '#6b7280',
            fontWeight: '600'
          }}>
            {value}%
          </div>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component
const PieChart = ({ data }) => {
  const colors = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'];
  const total = data.reduce((sum, value) => sum + value, 0);
  
  let currentAngle = 0;
  const segments = data.map((value, index) => {
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const segment = {
      percentage,
      angle,
      startAngle: currentAngle,
      color: colors[index % colors.length]
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '200px',
      flexDirection: 'column'
    }}>
      <div style={{ 
        width: '150px', 
        height: '150px', 
        borderRadius: '50%',
        position: 'relative',
        background: 'conic-gradient(' +
          segments.map(segment => 
            `${segment.color} ${segment.startAngle}deg ${segment.startAngle + segment.angle}deg`
          ).join(', ') +
        ')'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80px',
          height: '80px',
          background: 'white',
          borderRadius: '50%'
        }}></div>
      </div>
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px', 
        marginTop: '1rem',
        justifyContent: 'center'
      }}>
        {segments.map((segment, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', fontSize: '0.7rem' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: segment.color,
              borderRadius: '2px',
              marginRight: '4px'
            }}></div>
            <span>{segment.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// AI Summary Section Component
const AISummarySection = ({ data, currentPage, styles }) => {
  const getAISummary = () => {
    const summaries = {
      vendor: {
        title: "Vendor Performance Summary",
        points: [
          "Batch creation has increased by 18% compared to last month",
          "QR code generation success rate remains stable at 98.7%",
          "Titanium Alloy materials show highest demand (45% of total batches)",
          "Average processing time improved by 15% through optimized workflows",
          "Recommendation: Consider expanding Carbon Fiber inventory due to rising demand"
        ]
      },
      depot: {
        title: "Depot Operations Summary", 
        points: [
          "Scanning accuracy improved to 99.2% with new validation protocols",
          "Storage utilization at 78% - consider optimizing rack space allocation",
          "Peak scanning hours: 10:00 AM - 12:00 PM (25% of daily scans)",
          "Material retrieval efficiency increased by 22% with FIFO implementation",
          "Alert: Section B-12 showing 95% capacity - recommend redistribution"
        ]
      },
      installation: {
        title: "Installation Crew Performance",
        points: [
          "Installation completion rate reached 94% - exceeding target by 4%",
          "GPS location accuracy improved to 98.5% with new tracking system",
          "Average installation time reduced by 20% through better planning",
          "Track ID 7B shows highest installation density (128 installations)",
          "Recommendation: Additional training needed for complex fitting types"
        ]
      },
      inspector: {
        title: "Quality Inspection Insights",
        points: [
          "Overall approval rate maintained at 96.3% - excellent quality control",
          "Defect rate reduced by 5% through improved vendor screening",
          "Most common issue: Surface imperfections (38% of rejections)",
          "Inspection throughput increased by 28% with digital workflow",
          "Alert: Vendor 'SteelWorks' showing 12% higher defect rate than average"
        ]
      },
      maintenance: {
        title: "Maintenance Operations Insights",
        points: [
          "Emergency repair response time improved by 25% with new dispatch system",
          "Preventive maintenance compliance reached 92% - exceeding target by 7%",
          "Most frequent repair: Track alignment adjustments (28% of total work orders)",
          "Crew utilization optimized to 85% through better scheduling",
          "Alert: Section C-15 showing recurring gauge issues - recommend detailed inspection"
        ]
      }
    };

    return summaries[currentPage] || summaries.vendor;
  };

  const summary = getAISummary();

  return (
    <div style={styles.section}>
      <div style={styles.summaryCard}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🤖 AI Summarization
        </h2>
        <p style={{ margin: '0 0 1.5rem 0', opacity: 0.9 }}>
          Intelligent insights and recommendations powered by AI analysis
        </p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.5rem' }}>
          {summary.title}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            📅 Generated: {new Date().toLocaleDateString()}
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            🎯 Confidence Score: 94%
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {summary.points.map((point, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #3b82f6'
              }}
            >
              <div style={{ 
                background: '#3b82f6', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {index + 1}
              </div>
              <div style={{ color: '#374151', lineHeight: '1.6' }}>
                {point}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1.5rem', 
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: '8px',
          border: '1px solid #fcd34d'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💡 Strategic Recommendation
          </h4>
          <p style={{ margin: 0, color: '#92400e' }}>
            Based on current trends, consider implementing automated quality checks during the {currentPage === 'vendor' ? 'batch creation' : currentPage === 'depot' ? 'storage process' : currentPage === 'installation' ? 'installation phase' : currentPage === 'maintenance' ? 'maintenance scheduling' : 'inspection stage'} to further improve efficiency by approximately 15-20%.
          </p>
        </div>
      </div>
    </div>
  );
};

// Reports Section Component
const ReportsSection = ({ data, styles }) => {
  const downloadReport = (type) => {
    alert(`Downloading ${type} report...`);
    // In real implementation, this would generate and download the report
  };

  return (
    <div style={styles.section}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
        📋 Detailed Reports
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Performance Report */}
        <div style={styles.chartContainer}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Performance Report</h3>
          <BarChart data={data?.performanceReport || [88, 92, 85, 90, 87]} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              onClick={() => downloadReport('performance')}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📥 Download PDF
            </button>
          </div>
        </div>

        {/* Activity Report */}
        <div style={styles.chartContainer}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Activity Report</h3>
          <LineChart data={data?.activityReport || [45, 52, 48, 61, 55, 68, 72]} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              onClick={() => downloadReport('activity')}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📥 Download CSV
            </button>
          </div>
        </div>

        {/* Quality Report */}
        <div style={styles.chartContainer}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Quality Metrics</h3>
          <PieChart data={data?.qualityReport || [70, 15, 10, 5]} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button 
              onClick={() => downloadReport('quality')}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📥 Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Additional Reports */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
        {[
          { title: 'Inventory Report', icon: '📦', type: 'inventory' },
          { title: 'Vendor Analysis', icon: '🏭', type: 'vendor' },
          { title: 'Defect Analysis', icon: '⚠️', type: 'defect' },
          { title: 'Timeline Report', icon: '📅', type: 'timeline' },
          { title: 'Maintenance Log', icon: '🔧', type: 'maintenance' },
          { title: 'Resource Report', icon: '👥', type: 'resources' }
        ].map((report, index) => (
          <div 
            key={index}
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            }}
            onClick={() => downloadReport(report.type)}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{report.icon}</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{report.title}</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              Detailed analysis and insights
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get display name for current page
const getPageDisplayName = (page) => {
  const names = {
    vendor: 'Vendor Dashboard',
    depot: 'Depot Dashboard', 
    installation: 'Installation Dashboard',
    inspector: 'Inspector Dashboard',
    maintenance: 'Maintenance Dashboard'
  };
  return names[page] || 'Analytics';
};

export default AnalyticsDashboard;