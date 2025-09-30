// rulesService.js
export const rulesService = {
  async saveRules(rules) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real application, this would save to your backend
    console.log('Saving rules:', rules);
    
    // Store in localStorage for demo purposes
    localStorage.setItem('depot-rules', JSON.stringify(rules));
    
    return { success: true, message: 'Rules saved successfully' };
  },

  async loadRules() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Load from localStorage for demo purposes
    const savedRules = localStorage.getItem('depot-rules');
    
    if (savedRules) {
      return JSON.parse(savedRules);
    }
    
    // Return default rules
    return {
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
    };
  }
};