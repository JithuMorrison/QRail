// RulesManagement.js
import React, { useState } from 'react';
import { rulesService } from './rulesserv';

const RulesManagement = ({ user }) => {
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

  const [saving, setSaving] = useState(false);

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
    if (newRule.field && newRule.condition && newRule.value && newRule.action) {
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

  const saveRules = async () => {
    setSaving(true);
    try {
      await rulesService.saveRules(rules);
      alert('Rules saved successfully!');
    } catch (error) {
      alert('Failed to save rules: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addPriorityMaterial = (material) => {
    if (material && !rules.priorityRules.materialType.includes(material)) {
      setRules(prev => ({
        ...prev,
        priorityRules: {
          ...prev.priorityRules,
          materialType: [...prev.priorityRules.materialType, material]
        }
      }));
    }
  };

  const removePriorityMaterial = (material) => {
    setRules(prev => ({
      ...prev,
      priorityRules: {
        ...prev.priorityRules,
        materialType: prev.priorityRules.materialType.filter(m => m !== material)
      }
    }));
  };

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

  return (
    <div style={styles.section}>
      <h2 style={{ margin: '0 0 1.5rem 0', color: '#1f2937', fontSize: '1.8rem' }}>
        ⚙️ Rules Management
      </h2>

      {/* Retrieval Method */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Material Retrieval Method</h3>
        <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
          Define how materials should be retrieved from storage
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { 
              value: 'fifo', 
              label: 'FIFO (First In, First Out)', 
              description: 'Use oldest materials first',
              icon: '📦'
            },
            { 
              value: 'lifo', 
              label: 'LIFO (Last In, First Out)', 
              description: 'Use newest materials first',
              icon: '🆕'
            },
            { 
              value: 'fefo', 
              label: 'FEFO (First Expired, First Out)', 
              description: 'Based on expiration dates',
              icon: '📅'
            },
            { 
              value: 'manual', 
              label: 'Manual Selection', 
              description: 'Custom selection process',
              icon: '👤'
            }
          ].map(method => (
            <div 
              key={method.value}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '1.5rem',
                border: `2px solid ${rules.retrievalMethod === method.value ? '#3b82f6' : '#e5e7eb'}`,
                borderRadius: '12px',
                background: rules.retrievalMethod === method.value ? '#eff6ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => handleRuleChange('retrievalMethod', '', method.value)}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{method.icon}</div>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {method.label}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>{method.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expiration Rules */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Expiration & Shelf Life Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rules.expirationRules.enabled}
                onChange={(e) => handleRuleChange('expirationRules', 'enabled', e.target.checked)}
                style={{ marginRight: '0.5rem', width: '18px', height: '18px' }}
              />
              Enable Expiration Tracking
            </label>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              ⏰ Warning Days Before Expiry
            </label>
            <input 
              type="number" 
              value={rules.expirationRules.warningDays}
              onChange={(e) => handleRuleChange('expirationRules', 'warningDays', parseInt(e.target.value))}
              disabled={!rules.expirationRules.enabled}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px',
                background: !rules.expirationRules.enabled ? '#f3f4f6' : 'white'
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: '600', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rules.expirationRules.autoFlag}
                onChange={(e) => handleRuleChange('expirationRules', 'autoFlag', e.target.checked)}
                disabled={!rules.expirationRules.enabled}
                style={{ marginRight: '0.5rem', width: '18px', height: '18px' }}
              />
              🚩 Auto-Flag Near-Expiry Materials
            </label>
          </div>
        </div>
      </div>

      {/* Priority Materials */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Material Priority Rules</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              Add Priority Material Type
            </label>
            <select 
              onChange={(e) => addPriorityMaterial(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px' 
              }}
            >
              <option value="">Select Material Type</option>
              <option value="Titanium Alloy">Titanium Alloy</option>
              <option value="Carbon Fiber">Carbon Fiber</option>
              <option value="Stainless Steel">Stainless Steel</option>
              <option value="Aluminum 6061">Aluminum 6061</option>
              <option value="Copper Alloy">Copper Alloy</option>
            </select>
          </div>
        </div>
        
        {rules.priorityRules.materialType.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>
              Priority Materials (in order):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rules.priorityRules.materialType.map((material, index) => (
                <div 
                  key={material}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                >
                  <div>
                    <span style={{ 
                      background: '#3b82f6', 
                      color: 'white', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      marginRight: '0.5rem'
                    }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontWeight: '600' }}>{material}</span>
                  </div>
                  <button 
                    onClick={() => removePriorityMaterial(material)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Rules */}
      <div style={styles.chartContainer}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Custom Business Rules</h3>
        <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
          Create custom rules for automated decision making
        </p>
        
        {/* Add New Rule Form */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          background: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '8px'
        }}>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              📋 Field
            </label>
            <select 
              value={newRule.field}
              onChange={(e) => setNewRule(prev => ({ ...prev, field: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              ⚡ Condition
            </label>
            <select 
              value={newRule.condition}
              onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              🔢 Value
            </label>
            <input 
              type="text" 
              value={newRule.value}
              onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
              placeholder="Enter value"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              🎯 Action
            </label>
            <select 
              value={newRule.action}
              onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
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
              disabled={!newRule.field || !newRule.condition || !newRule.value || !newRule.action}
              style={{
                background: !newRule.field || !newRule.condition || !newRule.value || !newRule.action ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: !newRule.field || !newRule.condition || !newRule.value || !newRule.action ? 'not-allowed' : 'pointer',
                width: '100%',
                fontWeight: '600'
              }}
            >
              ➕ Add Rule
            </button>
          </div>
        </div>

        {/* Existing Rules List */}
        {rules.customRules.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>Active Custom Rules:</h4>
            {rules.customRules.map(rule => (
              <div 
                key={rule.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'white',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: '#3b82f6',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    IF
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1f2937' }}>
                      {rule.field} {rule.condition} "{rule.value}"
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      Then {rule.action}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeCustomRule(rule.id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.8rem'
                  }}
                >
                  🗑️ Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#f8fafc',
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            No custom rules defined. Add your first rule above.
          </div>
        )}
      </div>

      {/* Save Rules */}
      <div style={{ 
        textAlign: 'right', 
        marginTop: '2rem',
        paddingTop: '1.5rem',
        borderTop: '2px solid #e5e7eb'
      }}>
        <button 
          onClick={saveRules}
          disabled={saving}
          style={{
            background: saving ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            padding: '1rem 2.5rem',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {saving ? '💾 Saving...' : '💾 Save Rules Configuration'}
        </button>
      </div>
    </div>
  );
};

export default RulesManagement;