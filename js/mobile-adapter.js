/**
 * Mobile Adapter - Simplified browser compatibility and mobile device adaptation
 */
class MobileAdapter {
    constructor(errorHandler) {
        this.errorHandler = errorHandler || (window.ErrorHandler ? new window.ErrorHandler() : null);
        this.features = {
            localStorage: this.isLocalStorageAvailable(),
            notifications: 'Notification' in window,
            audio: 'Audio' in window
        };
        
        console.log('Browser feature support:', this.features);
    }

    /**
     * Check if local storage is available
     * @returns {boolean} Whether local storage is available
     * @private
     */
    isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            const result = localStorage.getItem(testKey) === testKey;
            localStorage.removeItem(testKey);
            return result;
        } catch (e) {
            return false;
        }
    }

    /**
     * Detect if current device is mobile
     * @returns {boolean} Whether is mobile device
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }

    /**
     * Apply mobile device adaptation
     */
    applyMobileAdaptation() {
        if (this.isMobileDevice()) {
            document.body.classList.add('mobile-device');
            console.log('Mobile adaptation applied');
        }
    }

    /**
     * Check feature support
     * @returns {Object} Feature support status
     */
    checkFeatures() {
        return { ...this.features };
    }
}

// Export for use by other scripts
window.MobileAdapter = MobileAdapter;