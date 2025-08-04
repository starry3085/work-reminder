/**
 * Application Settings Manager - Provides validation and default values only
 * StateManager is the single source of truth for all state management
 */
class AppSettings {
    constructor() {
        // Default settings structure - read-only reference, aligned with StateManager
        this.defaultSettings = {
            water: {
                isActive: false,
                interval: 30, // minutes
                settings: {
                    enabled: true,
                    interval: 30,
                    sound: true,
                    lastReminderAt: null
                }
            },
            standup: {
                isActive: false,
                interval: 30, // minutes
                settings: {
                    enabled: true,
                    interval: 30,
                    sound: true,
                    lastReminderAt: null
                }
            },
            notifications: {
                browserNotifications: true,
                soundEnabled: true,
                style: 'standard' // notification style: standard, minimal, detailed
            },
            appearance: {
                language: 'en-US'
            },
            isFirstUse: true // aligned with StateManager
        };
        
        // StateManager reference for read-only access
        this.stateManager = null;
    }

    /**
     * Set StateManager reference for read-only access
     * @param {StateManager} stateManager - State manager instance
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
        console.log('AppSettings connected to StateManager (read-only)');
    }

    /**
     * Get current settings from StateManager (read-only)
     * @returns {Object} Current settings
     */
    getSettings() {
        if (!this.stateManager) {
            console.warn('StateManager not available, returning default settings');
            return { ...this.defaultSettings };
        }

        const waterState = this.stateManager.getState('water');
        const standupState = this.stateManager.getState('standup');
        const appState = this.stateManager.getState('app');
        
        return {
            water: waterState && waterState.settings ? waterState.settings : this.defaultSettings.water.settings,
            standup: standupState && standupState.settings ? standupState.settings : this.defaultSettings.standup.settings,
            notifications: this.defaultSettings.notifications,
            appearance: this.defaultSettings.appearance,
            firstUse: appState && appState.isFirstUse !== undefined ? appState.isFirstUse : this.defaultSettings.isFirstUse
        };
    }

    /**
     * Get default settings structure
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return { ...this.defaultSettings };
    }

    // REMOVED: AppSettings no longer saves settings directly
    // All state changes must go through StateManager only



    /**
     * Deep merge settings or state objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object to merge
     * @returns {Object} Merged object
     * @private
     */
    mergeSettings(target, source) {
        if (!source || typeof source !== 'object') {
            return target;
        }
        
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    result[key] = this.mergeSettings(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    // REMOVED: AppSettings no longer updates settings directly
    // All settings updates must go through StateManager only



    // REMOVED: AppSettings no longer resets settings directly
    // All settings resets must go through StateManager only





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

            if (!Number.isInteger(reminder.interval) || reminder.interval < 1 || reminder.interval > 120) {
                errors.push(`${type}: interval must be between 1-120 minutes`);
            }

            if (typeof reminder.enabled !== 'boolean') {
                errors.push(`${type}: enabled must be a boolean`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // REMOVED: AppSettings no longer manages state directly
    // All state access must go through StateManager only

    /**
     * Check if first time using application (read-only from StateManager)
     * @returns {boolean} Whether first time use
     */
    isFirstUse() {
        if (!this.stateManager) {
            return this.defaultSettings.firstUse;
        }
        
        const appState = this.stateManager.getState('app');
        return appState && appState.isFirstUse !== undefined ? appState.isFirstUse : this.defaultSettings.firstUse;
    }

    /**
     * Detect if force refresh
     * @returns {boolean} Whether force refresh
     * @private
     */
    detectForceRefresh() {
        try {
            // Check if force refresh flag exists
            const forceRefreshFlag = sessionStorage.getItem('forceRefreshFlag');
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
            sessionStorage.setItem('forceRefreshFlag', 'true');
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
            sessionStorage.removeItem('forceRefreshFlag');
        } catch (error) {
            console.warn('Failed to clear force refresh flag:', error);
        }
    }

    // REMOVED: AppSettings no longer resets settings directly
    // All settings resets must go through StateManager only
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppSettings;
}

// Export for browser use
window.AppSettings = AppSettings;