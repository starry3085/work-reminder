/**
 * Analytics Module - Minimal analytics tracking for core user actions
 * Tracks only essential user engagement events for product optimization
 */
class Analytics {
    constructor() {
        this.isEnabled = true;
        this.baiduAnalyticsReady = false;
        
        // Check if Baidu Analytics is loaded
        this.checkBaiduAnalytics();
    }

    /**
     * Check if Baidu Analytics is available
     * @private
     */
    checkBaiduAnalytics() {
        // Check if _hmt array exists (Baidu Analytics)
        if (typeof _hmt !== 'undefined' && Array.isArray(_hmt)) {
            this.baiduAnalyticsReady = true;
            console.log('✅ Baidu Analytics ready');
        } else {
            console.warn('⚠️ Baidu Analytics not loaded, events will be logged only');
        }
    }

    /**
     * Track water reminder completion
     * Core metric: User actually completed water reminder action
     */
    trackWaterCompleted() {
        if (!this.isEnabled) return;
        
        try {
            console.log('📊 Analytics: Water reminder completed');
            
            if (this.baiduAnalyticsReady) {
                _hmt.push(['_trackEvent', 'engagement', 'water_done', '', 1]);
            }
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
    }

    /**
     * Track standup reminder completion  
     * Core metric: User actually completed standup reminder action
     */
    trackStandupCompleted() {
        if (!this.isEnabled) return;
        
        try {
            console.log('📊 Analytics: Standup reminder completed');
            
            if (this.baiduAnalyticsReady) {
                _hmt.push(['_trackEvent', 'engagement', 'standup_done', '', 1]);
            }
        } catch (error) {
            console.warn('Analytics tracking failed:', error);
        }
    }

    /**
     * Enable/disable analytics tracking
     * @param {boolean} enabled - Whether to enable tracking
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`Analytics tracking ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if analytics is enabled
     * @returns {boolean} Whether analytics is enabled
     */
    isAnalyticsEnabled() {
        return this.isEnabled;
    }
}

// Create global analytics instance
window.Analytics = Analytics;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}