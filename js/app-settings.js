/**
 * Application Settings Manager - Manages application settings and state
 * Includes loading, saving, validation and state recovery functionality
 */
class AppSettings {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.stateManager = null; // Initialize state manager reference
        
        // Use storage manager's prefix mechanism for consistency
        this.settingsKey = 'settings_v1';
        this.stateKey = 'state_v1';
        
        // Default settings
        this.defaultSettings = {
            water: {
                enabled: true,
                interval: 30, // minutes
                sound: true,
                lastReminder: null
            },
            standup: {
                enabled: true,
                interval: 30, // minutes
                sound: true,
                lastReminder: null
            },
            notifications: {
                browserNotifications: true,
                soundEnabled: true,
                style: 'standard' // notification style: standard, minimal, detailed
            },
            appearance: {
                language: 'en-US'
            },
            firstUse: true // whether first time use
        };
        
        // Default application state
        this.defaultState = {
            waterReminder: {
                isActive: false,
                timeRemaining: 0,
                nextReminderAt: null,
                lastAcknowledged: null
            },
            standupReminder: {
                isActive: false,
                timeRemaining: 0,
                nextReminderAt: null,
                lastAcknowledged: null
            },
            userActivity: {
                isActive: true
            },
            lastSaved: Date.now()
        };
        
        this.currentSettings = { ...this.defaultSettings };
        this.currentState = { ...this.defaultState };
    }

    /**
     * Initialize with StateManager
     * @param {StateManager} stateManager - State manager instance
     */
    async initialize(stateManager) {
        this.stateManager = stateManager;
        console.log('AppSettings initialized with StateManager');
    }

    /**
     * Set StateManager reference (backward compatibility)
     * @param {StateManager} stateManager - State manager instance
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Get current settings from StateManager if available, otherwise use internal state
     * @returns {Object} Current settings
     */
    getSettings() {
        // If StateManager is available, get settings from there
        if (this.stateManager) {
            const waterState = this.stateManager.getState('water');
            const standupState = this.stateManager.getState('standup');
            const appState = this.stateManager.getState('app');
            
            return {
                water: waterState && waterState.settings ? waterState.settings : this.defaultSettings.water,
                standup: standupState && standupState.settings ? standupState.settings : this.defaultSettings.standup,
                notifications: this.defaultSettings.notifications,
    
                firstUse: appState && appState.isFirstUse !== undefined ? appState.isFirstUse : this.defaultSettings.firstUse
            };
        }
        
        // Otherwise, return internal settings
        return this.currentSettings;
    }

    /**
     * Load application settings and state via StateManager
     * @param {boolean} forceDefault - Whether to force use default settings (on force refresh)
     * @returns {Object} Loaded settings
     */
    loadSettings(forceDefault = false) {
        try {
            // Check if force refresh
            const isForceRefresh = this.detectForceRefresh();
            
            if (forceDefault || isForceRefresh) {
                console.log('Force refresh detected or forced default settings, restoring default settings and state');
                this.currentSettings = { ...this.defaultSettings };
                this.currentState = { ...this.defaultState };
                // Clear force refresh flag
                this.clearForceRefreshFlag();
                this.saveSettings();
                this.saveState();
                return this.currentSettings;
            }
            
            // Get settings from StateManager
            return this.getSettings();
        } catch (error) {
            console.warn('Failed to load settings, using default settings and state:', error);
            this.currentSettings = { ...this.defaultSettings };
            this.currentState = { ...this.defaultState };
            this.saveSettings();
            this.saveState();
            return this.currentSettings;
        }
    }

    /**
     * Save application settings via StateManager
     * @param {Object} settings - Settings to save
     * @returns {boolean} Whether save was successful
     */
    saveSettings(settings = null) {
        try {
            const settingsToSave = settings || this.currentSettings;
            
            // Update water settings if provided
            if (settingsToSave.water) {
                this.stateManager.updateState('water', { settings: settingsToSave.water });
            }
            
            // Update standup settings if provided
            if (settingsToSave.standup) {
                this.stateManager.updateState('standup', { settings: settingsToSave.standup });
            }
            
            // Update app settings if provided
            const appSettings = {};
            if (settingsToSave.notifications) {
                appSettings.notifications = settingsToSave.notifications;
            }
            if (settingsToSave.appearance) {
                appSettings.appearance = settingsToSave.appearance;
            }
            if (Object.keys(appSettings).length > 0) {
                this.stateManager.updateState('app', appSettings);
            }
            
            console.log('Settings saved via StateManager');
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Load application state via StateManager
     * @returns {Object} Loaded state
     */
    loadState() {
        try {
            const appState = this.stateManager.getState('app');
            return appState || { ...this.defaultState };
        } catch (error) {
            console.warn('Failed to load state, using default state:', error);
            this.currentState = { ...this.defaultState };
            return this.currentState;
        }
    }

    /**
     * Save application state via StateManager
     * @param {Object} state - State to save
     * @returns {boolean} Whether save was successful
     */
    saveState(state = null) {
        try {
            const stateToSave = state || this.currentState;
            
            // Update app state
            this.stateManager.updateState('app', stateToSave);
            console.log('State saved via StateManager');
            return true;
        } catch (error) {
            console.error('Failed to save application state:', error);
            return false;
        }
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     * @returns {Object} Updated settings
     */
    updateSettings(newSettings) {
        this.currentSettings = this.mergeSettings(this.currentSettings, newSettings);
        this.saveSettings();
        return this.currentSettings;
    }

    /**
     * Update application state - now delegates to StateManager if available
     * @param {Object} newState - New state
     * @returns {Object} Updated state
     */
    updateState(newState) {
        // If we have StateManager, it handles state updates automatically
        if (this.stateManager) {
            // For app-specific state updates
            this.stateManager.updateState('app', newState);
            return this.stateManager.getState('app');
        }
        
        // Legacy approach
        this.currentState = this.mergeSettings(this.currentState, newState);
        this.saveState();
        return this.currentState;
    }

    /**
     * Reset settings to defaults
     * @returns {Object} Reset settings
     */
    resetSettings() {
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        return this.currentSettings;
    }

    /**
     * Reset application state to defaults - now delegates to StateManager if available
     * @returns {Object} Reset state
     */
    resetState() {
        if (this.stateManager) {
            this.stateManager.resetToDefaults();
            return this.stateManager.getState('app');
        }
        
        this.currentState = { ...this.defaultState };
        this.saveState();
        return this.currentState;
    }

    /**
     * Check if state is valid
     * @param {Object} state - State to check
     * @returns {boolean} Whether state is valid
     * @private
     */
    isStateValid(state) {
        // Check if state is expired (over 24 hours)
        if (!state.lastSaved) return false;
        
        const now = Date.now();
        const lastSaved = state.lastSaved;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (now - lastSaved > maxAge) {
            console.warn('Application state expired');
            return false;
        }
        
        // Check if reminder times are valid
        if (state.waterReminder && state.waterReminder.nextReminderAt) {
            if (now - state.waterReminder.nextReminderAt > maxAge) {
                console.warn('Water reminder time expired');
                return false;
            }
        }
        
        if (state.standupReminder && state.standupReminder.nextReminderAt) {
            if (now - state.standupReminder.nextReminderAt > maxAge) {
                console.warn('Standup reminder time expired');
                return false;
            }
        }
        
        return true;
    }

    /**
     * 统一设置管理 - 通过StateManager管理
     */
    getSettings() {
        // 从StateManager获取当前设置
        const waterState = this.stateManager ? this.stateManager.getState('water') : null;
        const standupState = this.stateManager ? this.stateManager.getState('standup') : null;
        
        return {
            water: waterState ? waterState.settings : this.defaultSettings.water,
            standup: standupState ? standupState.settings : this.defaultSettings.standup,
            notifications: this.defaultSettings.notifications,

            firstUse: this.defaultSettings.firstUse
        };
    }

    /**
     * 更新设置 - 通过StateManager统一更新
     */
    updateSettings(type, settings) {
        if (this.stateManager) {
            this.stateManager.updateState(type, { settings });
        }
    }

    /**
     * 初始化状态管理器
     */
    async initialize(stateManager) {
        this.stateManager = stateManager;
        
        // 从StateManager加载状态
        const appState = this.stateManager.getState('app');
        this.currentState = { ...this.currentState, ...appState };
        
        console.log('AppSettings initialized with StateManager');
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

    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return this.currentSettings;
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        if (this.stateManager) {
            return this.stateManager.getState('app');
        }
        return this.currentState;
    }

    /**
     * Mark application first use as complete
     */
    markFirstUseComplete() {
        this.currentSettings.firstUse = false;
        this.saveSettings();
    }

    /**
     * Check if first time using application
     * @returns {boolean} Whether first time use
     */
    isFirstUse() {
        return this.currentSettings.firstUse === true;
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

    /**
     * Force reset to default settings (for force refresh)
     * @returns {Object} Reset settings
     */
    forceResetToDefaults() {
        console.log('Force reset to default settings');
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        return this.currentSettings;
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppSettings;
}

// Export for browser use
window.AppSettings = AppSettings;