import React, { useState, useEffect } from 'react';
import { analyticsService } from './analyticsserv';
import { useParams } from 'react-router-dom';

const AnalyticsDashboard = ({ user }) => {
  const {currentPage} = useParams();
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

  // Inline CSS Styles
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
            ...(activeSection === 'rules' && styles.navTabActive)
          }}
          onClick={() => setActiveSection('rules')}
        >
          ⚙️ Rules Management
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

        {/* Rules Management Section */}
        {activeSection === 'rules' && (
          <RulesManagementSection 
            styles={styles}
            user={user}
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
            <MockChart type="line" data={data?.activityTrend} />
          </div>
        </div>

        {/* Distribution Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Distribution</h3>
          <div style={styles.chartContainer}>
            <MockChart type="pie" data={data?.distribution} />
          </div>
        </div>

        {/* Performance Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Performance Metrics</h3>
          <div style={styles.chartContainer}>
            <MockChart type="bar" data={data?.performance} />
          </div>
        </div>

        {/* Timeline Chart */}
        <div style={styles.section}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Timeline Analysis</h3>
          <div style={styles.chartContainer}>
            <MockChart type="area" data={data?.timeline} />
          </div>
        </div>
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
            Based on current trends, consider implementing automated quality checks during the {currentPage === 'vendor' ? 'batch creation' : currentPage === 'depot' ? 'storage process' : currentPage === 'installation' ? 'installation phase' : 'inspection stage'} to further improve efficiency by approximately 15-20%.
          </p>
        </div>
      </div>
    </div>
  );
};

// Rules Management Section Component
const RulesManagementSection = ({ styles, user }) => {
  const [rules, setRules] = useState({
    retrievalMethod: 'fifo',
    customRules: [],
    expirationRules: {
      enabled: true,
      warningDays: 30,
      autoFlag: true
    },
    priorityRules: {
      materialType: [],
      vendorPriority: []
    }
  });

  const [newRule, setNewRule] = useState({
    field: '',
    condition: '',
    value: '',
    action: ''
  });

  const handleRuleChange = (section, field, value) => {
    setRules(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addCustomRule = () => {
    if (newRule.field && newRule.condition && newRule.value) {
      setRules(prev => ({
        ...prev,
        customRules: [...prev.customRules, { ...newRule, id: Date.now() }]
      }));
      setNewRule({ field: '', condition: '', value: '', action: '' });
    }
  };

  const removeCustomRule = (id) => {
    setRules(prev => ({
      ...prev,
      customRules: prev.customRules.filter(rule => rule.id !== id)
    }));
  };

  return (
    <div style={styles.section}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
        ⚙️ Rules Management
      </h2>

      {/* Retrieval Method */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Material Retrieval Method</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { value: 'fifo', label: 'FIFO (First In, First Out)', description: 'Use oldest materials first' },
            { value: 'lifo', label: 'LIFO (Last In, First Out)', description: 'Use newest materials first' },
            { value: 'fefo', label: 'FEFO (First Expired, First Out)', description: 'Based on expiration dates' },
            { value: 'manual', label: 'Manual Selection', description: 'Custom selection process' }
          ].map(method => (
            <div 
              key={method.value}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '1rem',
                border: `2px solid ${rules.retrievalMethod === method.value ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '8px',
                background: rules.retrievalMethod === method.value ? '#eff6ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleRuleChange('retrievalMethod', '', method.value)}
            >
              <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{method.label}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{method.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expiration Rules */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Expiration & Shelf Life Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={rules.expirationRules.enabled}
                onChange={(e) => handleRuleChange('expirationRules', 'enabled', e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Enable Expiration Tracking
            </label>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              Warning Days Before Expiry
            </label>
            <input 
              type="number" 
              value={rules.expirationRules.warningDays}
              onChange={(e) => handleRuleChange('expirationRules', 'warningDays', parseInt(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={rules.expirationRules.autoFlag}
                onChange={(e) => handleRuleChange('expirationRules', 'autoFlag', e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Auto-Flag Near-Expiry Materials
            </label>
          </div>
        </div>
      </div>

      {/* Custom Rules */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Custom Business Rules</h3>
        
        {/* Add New Rule Form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Field</label>
            <select 
              value={newRule.field}
              onChange={(e) => setNewRule(prev => ({ ...prev, field: e.target.value }))}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="">Select Field</option>
              <option value="materialType">Material Type</option>
              <option value="vendor">Vendor</option>
              <option value="warranty">Warranty Period</option>
              <option value="location">Storage Location</option>
              <option value="date">Date Created</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Condition</label>
            <select 
              value={newRule.condition}
              onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="">Select Condition</option>
              <option value="equals">Equals</option>
              <option value="contains">Contains</option>
              <option value="greater">Greater Than</option>
              <option value="less">Less Than</option>
              <option value="between">Between</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Value</label>
            <input 
              type="text" 
              value={newRule.value}
              onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Enter value"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>Action</label>
            <select 
              value={newRule.action}
              onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
            >
              <option value="">Select Action</option>
              <option value="prioritize">Prioritize Usage</option>
              <option value="delay">Delay Usage</option>
              <option value="flag">Flag for Review</option>
              <option value="notify">Send Notification</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button 
              onClick={addCustomRule}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Add Rule
            </button>
          </div>
        </div>

        {/* Existing Rules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rules.customRules.map(rule => (
            <div 
              key={rule.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div>
                <span style={{ fontWeight: '600' }}>{rule.field}</span>
                <span style={{ margin: '0 0.5rem' }}>{rule.condition}</span>
                <span style={{ background: '#eff6ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                  {rule.value}
                </span>
                <span style={{ marginLeft: '1rem', color: '#059669', fontWeight: '600' }}>
                  → {rule.action}
                </span>
              </div>
              <button 
                onClick={() => removeCustomRule(rule.id)}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Rules */}
      <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
        <button 
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          💾 Save Rules Configuration
        </button>
      </div>
    </div>
  );
};

// Reports Section Component
const ReportsSection = ({ data, styles }) => {
  return (
    <div style={styles.section}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
        📋 Detailed Reports
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Performance Report */}
        <div style={styles.chartContainer}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Performance Report</h3>
          <MockChart type="bar" data={data?.performanceReport} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📥 Download PDF
            </button>
          </div>
        </div>

        {/* Activity Report */}
        <div style={styles.chartContainer}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Activity Report</h3>
          <MockChart type="line" data={data?.activityReport} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📥 Download CSV
            </button>
          </div>
        </div>

        {/* Quality Report */}
        <div style={styles.chartContainer}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Quality Metrics</h3>
          <MockChart type="pie" data={data?.qualityReport} />
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              📥 Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock Chart Component (for demonstration)
const MockChart = ({ type, data }) => {
  const chartStyle = {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'center',
    height: '200px',
    gap: '8px',
    padding: '1rem'
  };

  const barStyle = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    width: '30px',
    borderRadius: '4px 4px 0 0'
  };

  if (type === 'bar') {
    return (
      <div style={chartStyle}>
        {[60, 80, 45, 90, 75, 85].map((height, index) => (
          <div 
            key={index}
            style={{ ...barStyle, height: `${height}%` }}
          ></div>
        ))}
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div style={{ ...chartStyle, alignItems: 'center' }}>
        <div style={{
          width: '100%',
          height: '150px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}>
          📈 Line Chart Visualization
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <div style={{ ...chartStyle, alignItems: 'center' }}>
        <div style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'conic-gradient(#667eea 0% 30%, #764ba2 30% 60%, #10b981 60% 85%, #f59e0b 85% 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'white',
            borderRadius: '50%'
          }}></div>
        </div>
      </div>
    );
  }

  if (type === 'area') {
    return (
      <div style={{ ...chartStyle, alignItems: 'center' }}>
        <div style={{
          width: '100%',
          height: '150px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280'
        }}>
          📊 Area Chart Visualization
        </div>
      </div>
    );
  }

  return null;
};

// Helper function to get display name for current page
const getPageDisplayName = (page) => {
  const names = {
    vendor: 'Vendor Dashboard',
    depot: 'Depot Dashboard', 
    installation: 'Installation Dashboard',
    inspector: 'Inspector Dashboard'
  };
  return names[page] || 'Analytics';
};

export default AnalyticsDashboard;