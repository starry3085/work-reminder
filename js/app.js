/**
 * 主应用类 - 协调各个组件的工作
 */
class OfficeWellnessApp {
    constructor() {
        // 默认设置
        this.defaultSettings = {
            water: {
                enabled: true,
                interval: 30, // 分钟
                sound: true,
                lastReminder: null
            },
            posture: {
                enabled: true,
                interval: 60, // 分钟
                sound: true,
                lastReminder: null,
                activityThreshold: 5 // 分钟
            },
            notifications: {
                browserNotifications: true,
                soundEnabled: true
            },
            ui: {
                theme: 'light',
                language: 'zh-CN'
            }
        };

        this.currentSettings = { ...this.defaultSettings };
        this.isInitialized = false;
        
        // 组件实例
        this.storageManager = null;
        this.notificationService = null;
        this.activityDetector = null;
        this.waterReminder = null;
        this.postureReminder = null;
        this.uiController = null;
    }

    /**
     * 初始化应用
     */
    async initialize() {
        try {
            console.log('正在初始化办公族健康提醒应用...');
            
            // 初始化各个组件
            await this.initializeComponents();
            
            // 加载用户设置
            this.loadSettings();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 初始化UI
            this.initializeUI();
            
            // 请求通知权限
            await this.requestNotificationPermission();
            
            this.isInitialized = true;
            console.log('应用初始化完成');
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * 初始化各个组件
     * @private
     */
    async initializeComponents() {
        // 初始化存储管理器
        this.storageManager = new StorageManager();
        
        // 初始化通知服务
        this.notificationService = new NotificationService();
        
        // 初始化活动检测器（用于久坐提醒）
        this.activityDetector = new ActivityDetector((event) => {
            console.log('用户活动状态变化:', event);
            // 活动检测器的回调会在ReminderManager中处理
        });
        
        // 初始化提醒管理器
        this.waterReminder = new WaterReminder(
            this.currentSettings.water, 
            this.notificationService
        );
        
        this.postureReminder = new PostureReminder(
            this.currentSettings.posture, 
            this.notificationService,
            this.activityDetector // 将活动检测器传递给久坐提醒
        );
        
        // 初始化UI控制器
        this.uiController = new UIController();
    }

    /**
     * 加载用户设置
     * @private
     */
    loadSettings() {
        try {
            const savedSettings = this.storageManager.loadSettings('appSettings');
            if (savedSettings) {
                // 深度合并保存的设置和默认设置
                this.currentSettings = this.mergeSettings(this.defaultSettings, savedSettings);
                console.log('已加载用户设置:', this.currentSettings);
            } else {
                console.log('使用默认设置');
            }
        } catch (error) {
            console.warn('加载设置失败，使用默认设置:', error);
            this.currentSettings = { ...this.defaultSettings };
        }
    }

    /**
     * 保存用户设置
     * @private
     */
    saveSettings() {
        try {
            this.storageManager.saveSettings('appSettings', this.currentSettings);
            console.log('设置已保存');
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    /**
     * 设置事件监听器
     * @private
     */
    setupEventListeners() {
        // 设置水提醒状态变化回调
        if (this.waterReminder) {
            this.waterReminder.setStatusChangeCallback((status) => {
                console.log('水提醒状态变化:', status);
                if (this.uiController) {
                    this.uiController.updateReminderStatus('water', status);
                }
            });
            
            this.waterReminder.setTimeUpdateCallback((timeInfo) => {
                if (this.uiController) {
                    this.uiController.updateReminderTime('water', timeInfo);
                }
            });
        }
        
        // 设置久坐提醒状态变化回调
        if (this.postureReminder) {
            this.postureReminder.setStatusChangeCallback((status) => {
                console.log('久坐提醒状态变化:', status);
                if (this.uiController) {
                    this.uiController.updateReminderStatus('posture', status);
                }
                
                // 如果是自动暂停或恢复，显示提示
                if (status.isAuto) {
                    const message = status.status === 'paused' 
                        ? '检测到您已离开，久坐提醒已自动暂停' 
                        : '检测到您已返回，久坐提醒已自动恢复';
                    
                    this.notificationService.showInPageAlert('info', {
                        title: '活动检测',
                        message: message
                    });
                }
            });
            
            this.postureReminder.setTimeUpdateCallback((timeInfo) => {
                if (this.uiController) {
                    this.uiController.updateReminderTime('posture', timeInfo);
                }
            });
        }
    }

    /**
     * 初始化UI
     * @private
     */
    initializeUI() {
        if (!this.uiController) {
            console.error('UI控制器未初始化');
            return;
        }

        // 初始化UI控制器
        this.uiController.initialize();
        
        // 应用当前设置到UI
        this.uiController.applySettingsToUI(this.currentSettings);
        
        // 绑定UI事件到应用逻辑
        this.setupUIEventHandlers();
        
        console.log('UI初始化完成');
    }

    /**
     * 设置UI事件处理器
     * @private
     */
    setupUIEventHandlers() {
        if (!this.uiController) return;

        // 喝水提醒控制事件
        this.uiController.on('waterToggle', (data) => {
            if (data.isActive) {
                this.startReminder('water');
            } else {
                this.stopReminder('water');
            }
        });

        this.uiController.on('waterReset', () => {
            this.resetReminder('water');
        });

        this.uiController.on('waterDrink', () => {
            if (this.waterReminder) {
                this.waterReminder.acknowledge();
                // 更新每日统计
                this.updateDailyStats('water');
            }
        });

        // 久坐提醒控制事件
        this.uiController.on('postureToggle', (data) => {
            if (data.isActive) {
                this.startReminder('posture');
            } else {
                this.stopReminder('posture');
            }
        });

        this.uiController.on('postureReset', () => {
            this.resetReminder('posture');
        });

        this.uiController.on('postureActivity', () => {
            if (this.postureReminder) {
                this.postureReminder.acknowledge();
                // 更新每日统计
                this.updateDailyStats('posture');
            }
        });

        // 全局控制事件
        this.uiController.on('startAll', () => {
            this.startReminder('water');
            this.startReminder('posture');
        });

        this.uiController.on('pauseAll', () => {
            this.stopReminder('water');
            this.stopReminder('posture');
        });

        // 设置保存事件
        this.uiController.on('saveSettings', () => {
            this.handleSaveSettings();
        });

        this.uiController.on('resetSettings', () => {
            this.handleResetSettings();
        });
    }

    /**
     * 处理保存设置
     * @private
     */
    handleSaveSettings() {
        try {
            const newSettings = this.uiController.getSettingsFromUI();
            this.updateSettings(newSettings);
            
            // 显示保存成功提示
            this.notificationService.showInPageAlert('success', {
                title: '设置已保存',
                message: '您的设置已成功保存并应用'
            });
            
            // 关闭设置面板
            this.uiController.hideSettings();
            
        } catch (error) {
            console.error('保存设置失败:', error);
            this.notificationService.showInPageAlert('error', {
                title: '保存失败',
                message: '设置保存失败，请重试'
            });
        }
    }

    /**
     * 处理重置设置
     * @private
     */
    handleResetSettings() {
        try {
            // 重置为默认设置
            this.currentSettings = { ...this.defaultSettings };
            
            // 应用到UI
            this.uiController.applySettingsToUI(this.currentSettings);
            
            // 更新提醒管理器
            if (this.waterReminder) {
                this.waterReminder.updateSettings(this.currentSettings.water);
            }
            if (this.postureReminder) {
                this.postureReminder.updateSettings(this.currentSettings.posture);
            }
            
            // 保存设置
            this.saveSettings();
            
            // 显示重置成功提示
            this.notificationService.showInPageAlert('success', {
                title: '设置已重置',
                message: '所有设置已恢复为默认值'
            });
            
        } catch (error) {
            console.error('重置设置失败:', error);
            this.notificationService.showInPageAlert('error', {
                title: '重置失败',
                message: '设置重置失败，请重试'
            });
        }
    }

    /**
     * 更新每日统计
     * @param {string} type - 'water' | 'posture'
     * @private
     */
    updateDailyStats(type) {
        try {
            const today = new Date().toDateString();
            const statsKey = `dailyStats_${today}`;
            
            // 从存储中获取今日统计
            let dailyStats = this.storageManager.loadSettings(statsKey) || {
                water: { completed: 0, target: 8 },
                posture: { completed: 0, target: 8 }
            };
            
            // 更新统计
            if (dailyStats[type]) {
                dailyStats[type].completed += 1;
            }
            
            // 保存统计
            this.storageManager.saveSettings(statsKey, dailyStats);
            
            // 更新UI显示
            if (this.uiController) {
                this.uiController.updateDailyProgress(
                    type, 
                    dailyStats[type].completed, 
                    dailyStats[type].target
                );
            }
            
            console.log(`${type}统计已更新:`, dailyStats[type]);
            
        } catch (error) {
            console.error('更新每日统计失败:', error);
        }
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
     * 获取错误信息
     * @param {Error} error - 错误对象
     * @returns {string} 用户友好的错误信息
     * @private
     */
    getErrorMessage(error) {
        if (error.message.includes('localStorage')) {
            return '本地存储不可用，设置将无法保存';
        } else if (error.message.includes('notification')) {
            return '通知功能不可用，将使用页面内提醒';
        } else if (error.message.includes('audio')) {
            return '音频功能不可用，将使用静音提醒';
        } else {
            return '应用启动时遇到问题，部分功能可能不可用';
        }
    }

    /**
     * 显示备用错误信息
     * @param {string} message - 错误信息
     * @private
     */
    showFallbackError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // 5秒后自动隐藏
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * 请求通知权限
     * @private
     */
    async requestNotificationPermission() {
        if (!this.currentSettings.notifications.browserNotifications) {
            return;
        }

        try {
            const hasPermission = await this.notificationService.requestPermission();
            if (!hasPermission) {
                // 显示权限请求提示
                this.uiController.showPermissionPrompt(
                    async () => {
                        // 用户点击允许
                        const granted = await this.notificationService.requestPermission();
                        if (granted) {
                            console.log('通知权限已获得');
                        } else {
                            console.log('用户拒绝了通知权限');
                        }
                    },
                    () => {
                        // 用户点击拒绝
                        console.log('用户选择不开启通知权限');
                        this.currentSettings.notifications.browserNotifications = false;
                        this.saveSettings();
                    }
                );
            }
        } catch (error) {
            console.warn('请求通知权限失败:', error);
        }
    }

    /**
     * 处理初始化错误
     * @param {Error} error
     * @private
     */
    handleInitializationError(error) {
        console.error('应用初始化错误:', error);
        
        // 显示用户友好的错误信息
        const errorMessage = this.getErrorMessage(error);
        
        // 尝试显示错误信息
        try {
            if (this.uiController) {
                this.uiController.showInPageNotification('error', '初始化失败', errorMessage);
            } else {
                // 如果UI控制器不可用，直接在页面显示
                this.showFallbackError(errorMessage);
            }
        } catch (displayError) {
            console.error('显示错误信息失败:', displayError);
            this.showFallbackError('应用启动失败，请刷新页面重试');
        }
    }

    /**
     * 启动提醒
     * @param {string} type - 'water' | 'posture'
     */
    startReminder(type) {
        if (type === 'water' && this.waterReminder) {
            this.waterReminder.start();
            this.currentSettings.water.enabled = true;
            this.saveSettings();
        } else if (type === 'posture' && this.postureReminder) {
            this.postureReminder.start();
            this.currentSettings.posture.enabled = true;
            this.saveSettings();
        }
    }

    /**
     * 停止提醒
     * @param {string} type - 'water' | 'posture'
     */
    stopReminder(type) {
        if (type === 'water' && this.waterReminder) {
            this.waterReminder.stop();
            this.currentSettings.water.enabled = false;
            this.saveSettings();
        } else if (type === 'posture' && this.postureReminder) {
            this.postureReminder.stop();
            this.currentSettings.posture.enabled = false;
            this.saveSettings();
        }
    }

    /**
     * 重置提醒
     * @param {string} type - 'water' | 'posture'
     */
    resetReminder(type) {
        if (type === 'water' && this.waterReminder) {
            this.waterReminder.reset();
        } else if (type === 'posture' && this.postureReminder) {
            this.postureReminder.reset();
        }
    }

    /**
     * 更新设置
     * @param {Object} newSettings
     */
    updateSettings(newSettings) {
        // 深度合并设置
        const mergeSettings = (target, source) => {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (source[key] instanceof Object && key in target) {
                        mergeSettings(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
        
        this.currentSettings = mergeSettings(this.currentSettings, newSettings);
        
        // 更新提醒管理器设置
        if (newSettings.water && this.waterReminder) {
            this.waterReminder.updateSettings(newSettings.water);
        }
        
        if (newSettings.posture && this.postureReminder) {
            this.postureReminder.updateSettings(newSettings.posture);
        }
        
        // 保存设置到本地存储
        this.saveSettings();
        
        // 更新UI
        if (this.uiController) {
            this.uiController.updateSettings(this.currentSettings);
        }
        
        console.log('设置已更新:', this.currentSettings);
    }

    /**
     * 获取当前应用状态
     * @returns {Object}
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            settings: this.currentSettings,
            waterReminder: this.waterReminder?.getCurrentStatus(),
            postureReminder: this.postureReminder?.getCurrentStatus()
        };
    }
}

// 全局应用实例
let app = null;

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new OfficeWellnessApp();
        await app.initialize();
    } catch (error) {
        console.error('应用启动失败:', error);
        
        // 显示错误信息给用户
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = '应用启动失败，请刷新页面重试';
        document.body.appendChild(errorDiv);
        
        // 5秒后自动隐藏错误信息
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
});

// 页面卸载前保存状态
window.addEventListener('beforeunload', () => {
    if (app && app.isInitialized) {
        app.saveSettings();
    }
});

// 导出给其他脚本使用
window.OfficeWellnessApp = OfficeWellnessApp;