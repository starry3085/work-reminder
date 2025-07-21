/**
 * 应用设置数据模型
 * 管理应用的所有设置，包括默认值、验证和更新逻辑
 */
class AppSettings {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.settingsKey = 'app_settings';
        this.currentSettings = null;
        
        // 初始化设置
        this.initializeSettings();
    }

    /**
     * 获取默认设置
     * @returns {object} 默认设置对象
     */
    getDefaultSettings() {
        return {
            water: {
                enabled: true,
                interval: 30,        // 分钟
                sound: true,
                lastReminder: null   // 时间戳
            },
            posture: {
                enabled: true,
                interval: 60,        // 分钟
                sound: true,
                lastReminder: null,
                activityThreshold: 5 // 分钟
            },
            notifications: {
                browserNotifications: true,
                soundEnabled: true
            },
            ui: {
                theme: 'light',      // 'light' | 'dark'
                language: 'zh-CN'    // 'zh-CN' | 'en-US'
            },
            // 元数据
            version: '1.0.0',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }

    /**
     * 初始化设置
     */
    initializeSettings() {
        try {
            // 尝试从存储加载设置
            const savedSettings = this.storageManager.loadSettings(this.settingsKey);
            
            if (savedSettings && this.validateSettings(savedSettings)) {
                // 合并保存的设置和默认设置（处理新增字段）
                this.currentSettings = this.mergeSettings(this.getDefaultSettings(), savedSettings);
            } else {
                // 使用默认设置
                this.currentSettings = this.getDefaultSettings();
            }
            
            // 更新时间戳
            this.currentSettings.updatedAt = Date.now();
            
            // 保存到存储
            this.saveCurrentSettings();
            
        } catch (error) {
            console.error('初始化设置失败:', error);
            this.currentSettings = this.getDefaultSettings();
        }
    }

    /**
     * 验证设置对象的有效性
     * @param {object} settings - 要验证的设置对象
     * @returns {boolean} 设置是否有效
     */
    validateSettings(settings) {
        try {
            if (!settings || typeof settings !== 'object') {
                return false;
            }

            // 验证必需的顶级属性
            const requiredKeys = ['water', 'posture', 'notifications', 'ui'];
            for (const key of requiredKeys) {
                if (!settings[key] || typeof settings[key] !== 'object') {
                    console.warn(`设置验证失败: 缺少或无效的 ${key} 配置`);
                    return false;
                }
            }

            // 验证喝水设置
            if (!this.validateWaterSettings(settings.water)) {
                return false;
            }

            // 验证久坐设置
            if (!this.validatePostureSettings(settings.posture)) {
                return false;
            }

            // 验证通知设置
            if (!this.validateNotificationSettings(settings.notifications)) {
                return false;
            }

            // 验证UI设置
            if (!this.validateUISettings(settings.ui)) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('设置验证出错:', error);
            return false;
        }
    }

    /**
     * 验证喝水设置
     */
    validateWaterSettings(water) {
        return (
            typeof water.enabled === 'boolean' &&
            typeof water.interval === 'number' &&
            water.interval >= 1 && water.interval <= 480 && // 1分钟到8小时
            typeof water.sound === 'boolean' &&
            (water.lastReminder === null || typeof water.lastReminder === 'number')
        );
    }

    /**
     * 验证久坐设置
     */
    validatePostureSettings(posture) {
        return (
            typeof posture.enabled === 'boolean' &&
            typeof posture.interval === 'number' &&
            posture.interval >= 5 && posture.interval <= 480 && // 5分钟到8小时
            typeof posture.sound === 'boolean' &&
            typeof posture.activityThreshold === 'number' &&
            posture.activityThreshold >= 1 && posture.activityThreshold <= 30 && // 1-30分钟
            (posture.lastReminder === null || typeof posture.lastReminder === 'number')
        );
    }

    /**
     * 验证通知设置
     */
    validateNotificationSettings(notifications) {
        return (
            typeof notifications.browserNotifications === 'boolean' &&
            typeof notifications.soundEnabled === 'boolean'
        );
    }

    /**
     * 验证UI设置
     */
    validateUISettings(ui) {
        const validThemes = ['light', 'dark'];
        const validLanguages = ['zh-CN', 'en-US'];
        
        return (
            validThemes.includes(ui.theme) &&
            validLanguages.includes(ui.language)
        );
    }

    /**
     * 合并设置对象（深度合并）
     * @param {object} defaultSettings - 默认设置
     * @param {object} userSettings - 用户设置
     * @returns {object} 合并后的设置
     */
    mergeSettings(defaultSettings, userSettings) {
        const merged = JSON.parse(JSON.stringify(defaultSettings)); // 深拷贝
        
        for (const key in userSettings) {
            if (userSettings.hasOwnProperty(key)) {
                if (typeof userSettings[key] === 'object' && userSettings[key] !== null && !Array.isArray(userSettings[key])) {
                    // 递归合并对象
                    merged[key] = this.mergeSettings(merged[key] || {}, userSettings[key]);
                } else {
                    // 直接赋值
                    merged[key] = userSettings[key];
                }
            }
        }
        
        return merged;
    }

    /**
     * 获取当前设置
     * @returns {object} 当前设置的副本
     */
    getSettings() {
        return JSON.parse(JSON.stringify(this.currentSettings));
    }

    /**
     * 获取特定类型的设置
     * @param {string} type - 设置类型 ('water', 'posture', 'notifications', 'ui')
     * @returns {object|null} 指定类型的设置
     */
    getSettingsByType(type) {
        if (this.currentSettings && this.currentSettings[type]) {
            return JSON.parse(JSON.stringify(this.currentSettings[type]));
        }
        return null;
    }

    /**
     * 更新设置
     * @param {string} type - 设置类型
     * @param {object} newSettings - 新的设置值
     * @returns {boolean} 更新是否成功
     */
    updateSettings(type, newSettings) {
        try {
            if (!this.currentSettings[type]) {
                throw new Error(`无效的设置类型: ${type}`);
            }

            // 创建临时设置对象进行验证
            const tempSettings = JSON.parse(JSON.stringify(this.currentSettings));
            tempSettings[type] = { ...tempSettings[type], ...newSettings };
            tempSettings.updatedAt = Date.now();

            // 验证更新后的设置
            if (!this.validateSettings(tempSettings)) {
                throw new Error('设置验证失败');
            }

            // 应用更新
            this.currentSettings = tempSettings;
            
            // 保存到存储
            return this.saveCurrentSettings();
            
        } catch (error) {
            console.error('更新设置失败:', error);
            return false;
        }
    }

    /**
     * 更新单个设置项
     * @param {string} type - 设置类型
     * @param {string} key - 设置键
     * @param {any} value - 设置值
     * @returns {boolean} 更新是否成功
     */
    updateSingleSetting(type, key, value) {
        const updates = {};
        updates[key] = value;
        return this.updateSettings(type, updates);
    }

    /**
     * 重置所有设置到默认值
     * @returns {boolean} 重置是否成功
     */
    resetToDefaults() {
        try {
            this.currentSettings = this.getDefaultSettings();
            return this.saveCurrentSettings();
        } catch (error) {
            console.error('重置设置失败:', error);
            return false;
        }
    }

    /**
     * 重置特定类型的设置
     * @param {string} type - 要重置的设置类型
     * @returns {boolean} 重置是否成功
     */
    resetTypeToDefault(type) {
        try {
            const defaultSettings = this.getDefaultSettings();
            if (!defaultSettings[type]) {
                throw new Error(`无效的设置类型: ${type}`);
            }

            this.currentSettings[type] = JSON.parse(JSON.stringify(defaultSettings[type]));
            this.currentSettings.updatedAt = Date.now();
            
            return this.saveCurrentSettings();
        } catch (error) {
            console.error(`重置${type}设置失败:`, error);
            return false;
        }
    }

    /**
     * 保存当前设置到存储
     * @returns {boolean} 保存是否成功
     */
    saveCurrentSettings() {
        try {
            return this.storageManager.saveSettings(this.settingsKey, this.currentSettings);
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }

    /**
     * 导出设置（用于备份）
     * @returns {object} 设置的副本
     */
    exportSettings() {
        return this.getSettings();
    }

    /**
     * 导入设置（用于恢复）
     * @param {object} settings - 要导入的设置
     * @returns {boolean} 导入是否成功
     */
    importSettings(settings) {
        try {
            if (!this.validateSettings(settings)) {
                throw new Error('导入的设置无效');
            }

            this.currentSettings = this.mergeSettings(this.getDefaultSettings(), settings);
            this.currentSettings.updatedAt = Date.now();
            
            return this.saveCurrentSettings();
        } catch (error) {
            console.error('导入设置失败:', error);
            return false;
        }
    }

    /**
     * 获取设置摘要信息
     * @returns {object} 设置摘要
     */
    getSettingsSummary() {
        if (!this.currentSettings) {
            return null;
        }

        return {
            version: this.currentSettings.version,
            createdAt: new Date(this.currentSettings.createdAt).toLocaleString(),
            updatedAt: new Date(this.currentSettings.updatedAt).toLocaleString(),
            waterEnabled: this.currentSettings.water.enabled,
            waterInterval: this.currentSettings.water.interval,
            postureEnabled: this.currentSettings.posture.enabled,
            postureInterval: this.currentSettings.posture.interval,
            theme: this.currentSettings.ui.theme,
            language: this.currentSettings.ui.language,
            browserNotifications: this.currentSettings.notifications.browserNotifications
        };
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppSettings;
}