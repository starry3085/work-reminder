/**
 * 应用设置管理类 - 负责应用设置和状态的管理
 * 包括设置的加载、保存、验证和状态恢复功能
 */
class AppSettings {
    constructor(storageManager) {
        this.storageManager = storageManager;
        
        // 统一存储键名规范
        this.settingsKey = 'work_reminder_settings_v1';
        this.stateKey = 'work_reminder_state_v1';
        
        // 默认设置
        this.defaultSettings = {
            water: {
                enabled: true,
                interval: 30, // 分钟
                sound: true,
                lastReminder: null
            },
            standup: {
                enabled: true,
                interval: 30, // 分钟
                sound: true,
                lastReminder: null
            },
            notifications: {
                browserNotifications: true,
                soundEnabled: true,
                style: 'standard' // 通知样式: standard, minimal, detailed
            },
            appearance: {
                theme: 'light', // 主题: light, dark, auto
                language: 'zh-CN'
            },
            firstUse: true // 是否首次使用
        };
        
        // 默认应用状态
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
     * 加载应用设置和状态（原子操作，确保一致性）
     * @param {boolean} forceDefault - 是否强制使用默认设置（强制刷新时）
     * @returns {Object} 加载的设置
     */
    loadSettings(forceDefault = false) {
        try {
            // 检查是否为强制刷新
            const isForceRefresh = this.detectForceRefresh();
            
            if (forceDefault || isForceRefresh) {
                console.log('检测到强制刷新或强制使用默认设置，恢复默认设置和状态');
                this.currentSettings = { ...this.defaultSettings };
                this.currentState = { ...this.defaultState };
                // 清除强制刷新标记
                this.clearForceRefreshFlag();
                this.saveSettings();
                this.saveState();
                return this.currentSettings;
            }
            
            const savedSettings = this.storageManager.loadSettings(this.settingsKey);
            const savedState = this.storageManager.loadSettings(this.stateKey);
            
            // 确保设置和状态的一致性
            let settingsValid = false;
            let stateValid = false;
            
            if (savedSettings && this.validateSettings(savedSettings)) {
                this.currentSettings = this.mergeSettings(this.defaultSettings, savedSettings);
                settingsValid = true;
                console.log('已加载用户设置:', this.currentSettings);
            } else {
                console.log('使用默认设置');
                this.currentSettings = { ...this.defaultSettings };
            }
            
            if (savedState && this.isStateValid(savedState)) {
                this.currentState = this.mergeSettings(this.defaultState, savedState);
                stateValid = true;
                console.log('已加载应用状态:', this.currentState);
            } else {
                console.log('使用默认状态');
                this.currentState = { ...this.defaultState };
            }
            
            // 如果设置或状态无效，确保两者都重置为默认值
            if (!settingsValid || !stateValid) {
                console.log('设置或状态无效，重置为默认值');
                this.currentSettings = { ...this.defaultSettings };
                this.currentState = { ...this.defaultState };
                this.saveSettings();
                this.saveState();
            }
            
            return this.currentSettings;
        } catch (error) {
            console.warn('加载设置失败，使用默认设置和状态:', error);
            this.currentSettings = { ...this.defaultSettings };
            this.currentState = { ...this.defaultState };
            this.saveSettings();
            this.saveState();
            return this.currentSettings;
        }
    }

    /**
     * 保存应用设置
     * @param {Object} settings - 要保存的设置
     * @returns {boolean} 保存是否成功
     */
    saveSettings(settings = null) {
        try {
            const settingsToSave = settings || this.currentSettings;
            const result = this.storageManager.saveSettings(this.settingsKey, settingsToSave);
            if (result) {
                this.currentSettings = settingsToSave;
                console.log('设置已保存');
            }
            return result;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }

    /**
     * 加载应用状态
     * @returns {Object} 加载的状态
     */
    loadState() {
        try {
            const savedState = this.storageManager.loadSettings(this.stateKey);
            if (savedState) {
                // 验证状态的有效性
                if (this.isStateValid(savedState)) {
                    this.currentState = this.mergeSettings(this.defaultState, savedState);
                    console.log('已加载应用状态:', this.currentState);
                } else {
                    console.warn('保存的状态已过期或无效，使用默认状态');
                    this.currentState = { ...this.defaultState };
                }
            } else {
                console.log('没有找到保存的状态，使用默认状态');
                this.currentState = { ...this.defaultState };
            }
            return this.currentState;
        } catch (error) {
            console.warn('加载状态失败，使用默认状态:', error);
            this.currentState = { ...this.defaultState };
            return this.currentState;
        }
    }

    /**
     * 保存应用状态
     * @param {Object} state - 要保存的状态
     * @returns {boolean} 保存是否成功
     */
    saveState(state = null) {
        try {
            const stateToSave = state || this.currentState;
            // 更新最后保存时间
            stateToSave.lastSaved = Date.now();
            
            const result = this.storageManager.saveSettings(this.stateKey, stateToSave);
            if (result) {
                this.currentState = stateToSave;
                console.log('应用状态已保存');
            }
            return result;
        } catch (error) {
            console.error('保存应用状态失败:', error);
            return false;
        }
    }

    /**
     * 更新设置
     * @param {Object} newSettings - 新设置
     * @returns {Object} 更新后的设置
     */
    updateSettings(newSettings) {
        this.currentSettings = this.mergeSettings(this.currentSettings, newSettings);
        this.saveSettings();
        return this.currentSettings;
    }

    /**
     * 更新应用状态
     * @param {Object} newState - 新状态
     * @returns {Object} 更新后的状态
     */
    updateState(newState) {
        this.currentState = this.mergeSettings(this.currentState, newState);
        this.saveState();
        return this.currentState;
    }

    /**
     * 重置设置为默认值
     * @returns {Object} 重置后的设置
     */
    resetSettings() {
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        return this.currentSettings;
    }

    /**
     * 重置应用状态为默认值
     * @returns {Object} 重置后的状态
     */
    resetState() {
        this.currentState = { ...this.defaultState };
        this.saveState();
        return this.currentState;
    }

    /**
     * 检查状态是否有效
     * @param {Object} state - 要检查的状态
     * @returns {boolean} 状态是否有效
     * @private
     */
    isStateValid(state) {
        // 检查状态是否过期（超过24小时）
        if (!state.lastSaved) return false;
        
        const now = Date.now();
        const lastSaved = state.lastSaved;
        const maxAge = 24 * 60 * 60 * 1000; // 24小时
        
        if (now - lastSaved > maxAge) {
            console.warn('应用状态已过期');
            return false;
        }
        
        // 检查提醒时间是否有效
        if (state.waterReminder && state.waterReminder.nextReminderAt) {
            if (now - state.waterReminder.nextReminderAt > maxAge) {
                console.warn('水提醒时间已过期');
                return false;
            }
        }
        
        if (state.standupReminder && state.standupReminder.nextReminderAt) {
            if (now - state.standupReminder.nextReminderAt > maxAge) {
                console.warn('久坐提醒时间已过期');
                return false;
            }
        }
        
        return true;
    }

    /**
     * 深度合并设置对象
     * @param {Object} target - 目标对象
     * @param {Object} source - 源对象
     * @returns {Object} 合并后的对象
     * @private
     */
    mergeSettings(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] instanceof Object && !Array.isArray(source[key]) && key in result) {
                    result[key] = this.mergeSettings(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        
        return result;
    }

    /**
     * 验证设置是否有效
     * @param {Object} settings - 要验证的设置
     * @returns {Object} 验证结果 {isValid: boolean, errors: Array}
     */
    validateSettings(settings) {
        const errors = [];

        if (!settings || typeof settings !== 'object') {
            errors.push('Settings must be an object');
            return { isValid: false, errors };
        }

        // 验证提醒设置
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
     * 获取当前设置
     * @returns {Object} 当前设置
     */
    getSettings() {
        return this.currentSettings;
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态
     */
    getState() {
        return this.currentState;
    }

    /**
     * 标记应用已完成首次使用
     */
    markFirstUseComplete() {
        this.currentSettings.firstUse = false;
        this.saveSettings();
    }

    /**
     * 检查是否首次使用应用
     * @returns {boolean} 是否首次使用
     */
    isFirstUse() {
        return this.currentSettings.firstUse === true;
    }

    /**
     * 检测是否为强制刷新
     * @returns {boolean} 是否为强制刷新
     * @private
     */
    detectForceRefresh() {
        try {
            // 检查是否有强制刷新标记
            const forceRefreshFlag = sessionStorage.getItem('forceRefreshFlag');
            if (forceRefreshFlag === 'true') {
                return true;
            }
            
            // 检查 performance.navigation API（已废弃但仍可用）
            if (window.performance && window.performance.navigation) {
                // TYPE_RELOAD = 1 表示刷新
                // 但无法区分普通刷新和强制刷新
                return false;
            }
            
            // 检查 performance.getEntriesByType API
            if (window.performance && window.performance.getEntriesByType) {
                const navEntries = window.performance.getEntriesByType('navigation');
                if (navEntries.length > 0) {
                    const navEntry = navEntries[0];
                    // 如果是 reload 类型，可能是刷新
                    return navEntry.type === 'reload';
                }
            }
            
            return false;
        } catch (error) {
            console.warn('检测强制刷新失败:', error);
            return false;
        }
    }

    /**
     * 设置强制刷新标记
     */
    setForceRefreshFlag() {
        try {
            sessionStorage.setItem('forceRefreshFlag', 'true');
        } catch (error) {
            console.warn('设置强制刷新标记失败:', error);
        }
    }

    /**
     * 清除强制刷新标记
     * @private
     */
    clearForceRefreshFlag() {
        try {
            sessionStorage.removeItem('forceRefreshFlag');
        } catch (error) {
            console.warn('清除强制刷新标记失败:', error);
        }
    }

    /**
     * 强制重置为默认设置（用于强制刷新）
     * @returns {Object} 重置后的设置
     */
    forceResetToDefaults() {
        console.log('强制重置为默认设置');
        this.currentSettings = { ...this.defaultSettings };
        this.saveSettings();
        return this.currentSettings;
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppSettings;
}

// Export for browser use
window.AppSettings = AppSettings;