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
        this.waterReminder = new ReminderManager(
            'water', 
            this.currentSettings.water, 
            this.notificationService
        );
        
        this.postureReminder = new ReminderManager(
            'posture', 
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
        // 待实现
    }

    /**
     * 保存用户设置
     * @private
     */
    saveSettings() {
        // 待实现
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
        // 待实现
    }

    /**
     * 请求通知权限
     * @private
     */
    async requestNotificationPermission() {
        // 待实现
    }

    /**
     * 处理初始化错误
     * @param {Error} error
     * @private
     */
    handleInitializationError(error) {
        // 待实现
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