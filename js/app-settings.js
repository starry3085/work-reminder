/**
 * Application Settings Manager - Provides validation and default values
 * Simplified settings management without StateManager dependency
 */
class AppSettings {
    constructor() {
        // Default settings structure
        this.defaultSettings = {
            water: {
                enabled: true,
                interval: REMINDER_CONSTANTS.DEFAULT_INTERVAL_MINUTES, // Fixed 30 minutes
                sound: true,
                lastReminderAt: null
            },
            standup: {
                enabled: true,
                interval: REMINDER_CONSTANTS.DEFAULT_INTERVAL_MINUTES, // Fixed 30 minutes
                sound: true,
                lastReminderAt: null
            },
            notifications: {
                browserNotifications: true,
                soundEnabled: true,
                style: 'standard' // notification style: standard, minimal, detailed
            },
            appearance: {
                language: 'en-US'
            },
            isFirstUse: true
        };
    }

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.defaultSettings };
    }

    /**
     * Get default settings structure
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return { ...this.defaultSettings };
    }

    /**
     * Validate if settings are valid
     * @param {Object} settings - Settings to validate
     * @returns {Object} Validation result {isValid: boolean, errors: Array}
     */
    validateSettings(settings) {
        const errors = [];

        if (!settings || typeof settings !== 'object') {
            errors.push('Settings must be an object');
            return { isValid: false, errors };
        }

        // Validate reminder settings
        ['water', 'standup'].forEach(type => {
            const reminder = settings[type];
            if (!reminder || typeof reminder !== 'object') {
                errors.push(`${type}: settings must be an object`);
                return;
            }

            // Interval is now fixed at 30 minutes, no validation needed
            if (typeof reminder.enabled !== 'boolean') {
                errors.push(`${type}: enabled must be a boolean`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check if first time using application
     * @returns {boolean} Whether first time use
     */
    isFirstUse() {
        return this.defaultSettings.isFirstUse;
    }

    /**
     * Detect if force refresh
     * @returns {boolean} Whether force refresh
     * @private
     */
    detectForceRefresh() {
        try {
            // Check if force refresh flag exists
            const forceRefreshFlag = sessionStorage.getItem(STORAGE_CONSTANTS.FORCE_REFRESH_FLAG);
            if (forceRefreshFlag === 'true') {
                return true;
            }
            
            // Check performance.navigation API (deprecated but still usable)
            if (window.performance && window.performance.navigation) {
                // TYPE_RELOAD = 1 indicates refresh
                // But cannot distinguish between normal refresh and force refresh
                return false;
            }
            
            // Check performance.getEntriesByType API
            if (window.performance && window.performance.getEntriesByType) {
                const navEntries = window.performance.getEntriesByType('navigation');
                if (navEntries.length > 0) {
                    const navEntry = navEntries[0];
                    // If reload type, might be refresh
                    return navEntry.type === 'reload';
                }
            }
            
            return false;
        } catch (error) {
            console.warn('Failed to detect force refresh:', error);
            return false;
        }
    }

    /**
     * Set force refresh flag
     */
    setForceRefreshFlag() {
        try {
            sessionStorage.setItem(STORAGE_CONSTANTS.FORCE_REFRESH_FLAG, 'true');
        } catch (error) {
            console.warn('Failed to set force refresh flag:', error);
        }
    }

    /**
     * Clear force refresh flag
     * @private
     */
    clearForceRefreshFlag() {
        try {
            sessionStorage.removeItem(STORAGE_CONSTANTS.FORCE_REFRESH_FLAG);
        } catch (error) {
            console.warn('Failed to clear force refresh flag:', error);
        }
    }

    // AppSettings provides default settings and validation only
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppSettings;
}

// Export for browser use
window.AppSettings = AppSettings;