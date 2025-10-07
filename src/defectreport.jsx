// DefectReport.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectorService } from './inspserv';

const DefectReport = ({ user }) => {
  const [formData, setFormData] = useState({
    chainage: '',
    defectType: '',
    severity: 'warning',
    parameters: {
      gauge: '',
      twist: '',
      wear: '',
      alignment: ''
    },
    description: '',
    urgency: 'medium',
    recommendedActions: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inspectorService.reportDefect({
        ...formData,
        reportedBy: user.name,
        timestamp: new Date().toISOString()
      });
      alert('Defect reported successfully!');
      navigate('/inspector');
    } catch (error) {
      console.error('Failed to report defect:', error);
      alert('Failed to report defect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.parameters) {
      setFormData(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '2rem'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '1.5rem 2rem',
      borderRadius: '20px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginBottom: '2rem'
    },
    form: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#1f2937'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'border-color 0.3s ease'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      resize: 'vertical',
      minHeight: '100px'
    },
    parametersGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '1rem',
      marginBottom: '1rem'
    },
    button: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      width: '100%'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button 
              onClick={() => navigate('/inspector')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem'
              }}
            >
              ← Back to Inspector Dashboard
            </button>
            <h1 style={{ margin: '0', color: '#1f2937', fontSize: '2rem', fontWeight: '700' }}>
              🚨 Report New Defect
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
              Report track defects and maintenance requirements
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Chainage (km)</label>
            <input
              type="number"
              step="0.1"
              name="chainage"
              value={formData.chainage}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="Enter chainage in kilometers"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Defect Type</label>
            <select
              name="defectType"
              value={formData.defectType}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Select Defect Type</option>
              <option value="gauge-widening">Gauge Widening</option>
              <option value="rail-wear">Rail Wear</option>
              <option value="track-settlement">Track Settlement</option>
              <option value="alignment-issue">Alignment Issue</option>
              <option value="surface-defect">Surface Defect</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Severity</label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Urgency</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="low">Low (Routine)</option>
              <option value="medium">Medium (Schedule)</option>
              <option value="high">High (Urgent)</option>
              <option value="emergency">Emergency (Immediate)</option>
            </select>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Track Parameters</label>
          <div style={styles.parametersGrid}>
            <div>
              <label style={{ ...styles.label, fontSize: '0.8rem' }}>Gauge (mm)</label>
              <input
                type="number"
                step="0.1"
                name="gauge"
                value={formData.parameters.gauge}
                onChange={handleChange}
                style={styles.input}
                placeholder="1435"
              />
            </div>
            <div>
              <label style={{ ...styles.label, fontSize: '0.8rem' }}>Twist (mm/m)</label>
              <input
                type="number"
                step="0.1"
                name="twist"
                value={formData.parameters.twist}
                onChange={handleChange}
                style={styles.input}
                placeholder="2.1"
              />
            </div>
            <div>
              <label style={{ ...styles.label, fontSize: '0.8rem' }}>Wear (mm)</label>
              <input
                type="number"
                step="0.1"
                name="wear"
                value={formData.parameters.wear}
                onChange={handleChange}
                style={styles.input}
                placeholder="1.8"
              />
            </div>
            <div>
              <label style={{ ...styles.label, fontSize: '0.8rem' }}>Alignment (mm)</label>
              <input
                type="number"
                step="0.1"
                name="alignment"
                value={formData.parameters.alignment}
                onChange={handleChange}
                style={styles.input}
                placeholder="0.8"
              />
            </div>
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Defect Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            style={styles.textarea}
            placeholder="Describe the defect in detail, including location, visible damage, and any immediate safety concerns..."
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Recommended Actions</label>
          <textarea
            name="recommendedActions"
            value={formData.recommendedActions}
            onChange={handleChange}
            style={styles.textarea}
            placeholder="Recommend maintenance actions, safety measures, and timeline for repair..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading && { opacity: 0.7, cursor: 'not-allowed' })
          }}
        >
          {loading ? '🚨 Reporting Defect...' : '🚨 Report Defect'}
        </button>
      </form>
    </div>
  );
};

export default DefectReport;