// analyticsService.js
export const analyticsService = {
  async getAnalytics({ timeRange, userRole, currentPage }) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock data based on current page and time range
    const baseData = {
      totalActivities: 1247,
      successRate: 96.3,
      activeUsers: 42,
      avgProcessingTime: 23,
      activityTrend: [65, 78, 90, 81, 56, 55, 40],
      distribution: [30, 25, 20, 15, 10],
      performance: [85, 92, 78, 88, 95],
      timeline: [45, 52, 48, 61, 55, 68, 72]
    };

    // Page-specific data
    const pageData = {
      vendor: {
        batchesCreated: 156,
        qrCodesGenerated: 892,
        materialsProcessed: 1247,
        batchSuccessRate: 98.7
      },
      depot: {
        scansProcessed: 2845,
        materialsStored: 892,
        storageUtilization: 78,
        scanAccuracy: 99.2
      },
      installation: {
        installationsCompleted: 567,
        activeProjects: 23,
        installationSuccess: 94,
        avgInstallationTime: 45
      },
      inspector: {
        inspectionsDone: 892,
        defectRate: 3.7,
        approvalRate: 96.3,
        avgInspectionTime: 18
      }
    };

    return {
      ...baseData,
      ...pageData[currentPage],
      performanceReport: [88, 92, 85, 90, 87],
      activityReport: [45, 52, 48, 61, 55, 68, 72],
      qualityReport: [70, 15, 10, 5]
    };
  },

  async saveRules(rules) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Rules saved:', rules);
    return { success: true };
  },

  async generateReport(type, filters) {
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { 
      success: true, 
      reportUrl: `/reports/${type}-${Date.now()}.pdf`,
      generatedAt: new Date().toISOString()
    };
  }
};