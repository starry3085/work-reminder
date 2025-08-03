/**
 * Application Settings Manager - Manages application settings and state
 * Includes loading, saving, validation and state recovery functionality
 */
class AppSettings {
    constructor(storageManager) {
        this.storageManager = storageManager;
        
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
                theme: 'light', // theme: light, dark, auto
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
     * Load application settings and state (atomic operation to ensure consistency)
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
            
            const savedSettings = this.storageManager.loadSettings(this.settingsKey);
            const savedState = this.storageManager.loadSettings(this.stateKey);
            
            // Ensure consistency between settings and state
            let settingsValid = false;
            let stateValid = false;
            
            if (savedSettings && this.validateSettings(savedSettings)) {
                this.currentSettings = this.mergeSettings(this.defaultSettings, savedSettings);
                settingsValid = true;
                console.log('User settings loaded:', this.currentSettings);
            } else {
                console.log('Using default settings');
                this.currentSettings = { ...this.defaultSettings };
            }
            
            if (savedState && this.isStateValid(savedState)) {
                this.currentState = this.mergeSettings(this.defaultState, savedState);
                stateValid = true;
                console.log('Application state loaded:', this.currentState);
            } else {
                console.log('Using default state');
                this.currentState = { ...this.defaultState };
            }
            
            // If settings or state invalid, ensure both are reset to defaults
            if (!settingsValid || !stateValid) {
                console.log('Settings or state invalid, resetting to defaults');
                this.currentSettings = { ...this.defaultSettings };
                this.currentState = { ...this.defaultState };
                this.saveSettings();
                this.saveState();
            }
            
            return this.currentSettings;
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
     * Save application settings
     * @param {Object} settings - Settings to save
     * @returns {boolean} Whether save was successful
     */
    saveSettings(settings = null) {
        try {
            const settingsToSave = settings || this.currentSettings;
            const result = this.storageManager.saveSettings(this.settingsKey, settingsToSave);
            if (result) {
                this.currentSettings = settingsToSave;
                console.log('Settings saved');
            }
            return result;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    /**
     * Load application state
     * @returns {Object} Loaded state
     */
    loadState() {
        try {
            const savedState = this.storageManager.loadSettings(this.stateKey);
            if (savedState) {
                // Validate state validity
                if (this.isStateValid(savedState)) {
                    this.currentState = this.mergeSettings(this.defaultState, savedState);
                    console.log('Application state loaded:', this.currentState);
                } else {
                    console.warn('Saved state expired or invalid, using default state');
                    this.currentState = { ...this.defaultState };
                }
            } else {
                console.log('No saved state found, using default state');
                this.currentState = { ...this.defaultState };
            }
            return this.currentState;
        } catch (error) {
            console.warn('Failed to load state, using default state:', error);
            this.currentState = { ...this.defaultState };
            return this.currentState;
        }
    }

    /**
     * Save application state
     * @param {Object} state - State to save
     * @returns {boolean} Whether save was successful
     */
    saveState(state = null) {
        try {
            const stateToSave = state || this.currentState;
            // Update last saved time
            stateToSave.lastSaved = Date.now();
            
            const result = this.storageManager.saveSettings(this.stateKey, stateToSave);
            if (result) {
                this.currentState = stateToSave;
                console.log('Application state saved');
            }
            return result;
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
     * Update application state
     * @param {Object} newState - New state
     * @returns {Object} Updated state
     */
    updateState(newState) {
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
     * Reset application state to defaults
     * @returns {Object} Reset state
     */
    resetState() {
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
            appearance: this.defaultSettings.appearance,
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
     * 兼容旧接口 - 设置状态管理器
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
    }

    /**
     * 检查是否首次使用
     */
    isFirstUse() {
        const appState = this.stateManager ? this.stateManager.getState('app') : this.currentState;
        return appState ? appState.isFirstUse : true;
    }

    /**
     * 标记为已使用
     */
    markAsUsed() {
        if (this.stateManager) {
            this.stateManager.updateState('app', { isFirstUse: false });
        }
    }

    /**
     * 检测强制刷新
     */
    detectForceRefresh() {
        return false; // MVP版本不实现版本检测
    }

    /**
     * 保存设置（兼容旧接口）
     */
    saveSettings(settings) {
        // 通过StateManager更新设置
        if (settings.water && this.stateManager) {
            this.stateManager.updateState('water', { settings: settings.water });
        }
        if (settings.standup && this.stateManager) {
            this.stateManager.updateState('standup', { settings: settings.standup });
        }
        if (settings.notifications && this.stateManager) {
            this.stateManager.updateState('app', { notifications: settings.notifications });
        }
    }

    /**
     * 加载设置（兼容旧接口）
     */
    loadSettings(useDefaults = false) {
        if (useDefaults || !this.stateManager) {
            return {
                water: { ...this.defaultSettings.water },
                standup: { ...this.defaultSettings.standup },
                notifications: { ...this.defaultSettings.notifications },
                appearance: { ...this.defaultSettings.appearance },
                firstUse: this.defaultSettings.firstUse
            };
        }
        
        return this.getSettings();
    }

    /**
     * 加载状态（兼容旧接口）
     */
    loadState() {
        return this.stateManager ? this.stateManager.getState('app') : this.currentState;
    }

    /**
     * 保存状态（兼容旧接口）
     */
    saveState() {
        // 状态保存由StateManager统一处理，无需额外操作
    }

    /**
     * 重置状态（兼容旧接口）
     */
    resetState() {
        if (this.stateManager) {
            this.stateManager.resetToDefaults();
        }
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