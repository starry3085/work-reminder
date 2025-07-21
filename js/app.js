/**
 * 主应用类 - 协调各个组件的工作
 */
class OfficeWellnessApp {
    constructor() {
        this.isInitialized = false;
        
        // 组件实例
        this.storageManager = null;
        this.appSettings = null;
        this.notificationService = null;
        this.activityDetector = null;
        this.waterReminder = null;
        this.postureReminder = null;
        this.uiController = null;
        
        // 应用状态
        this.appState = {
            isInitializing: false,
            isFirstUse: false,
            lastSessionTime: null
        };
    }

    /**
     * 初始化应用
     */
    async initialize() {
        try {
            console.log('正在初始化办公族健康提醒应用...');
            this.appState.isInitializing = true;
            
            // 初始化各个组件
            await this.initializeComponents();
            
            // 加载用户设置和状态
            await this.loadSettingsAndState();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 初始化UI
            this.initializeUI();
            
            // 请求通知权限
            await this.requestNotificationPermission();
            
            // 恢复上次会话状态
            await this.restorePreviousState();
            
            // 检查是否首次使用
            if (this.appSettings.isFirstUse()) {
                this.showFirstUseGuide();
            }
            
            this.isInitialized = true;
            this.appState.isInitializing = false;
            console.log('应用初始化完成');
            
            // 记录会话开始时间
            this.appState.lastSessionTime = Date.now();
            
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.appState.isInitializing = false;
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
        
        // 初始化应用设置管理器
        this.appSettings = new AppSettings(this.storageManager);
        
        // 初始化通知服务
        this.notificationService = new NotificationService();
        
        // 初始化活动检测器（用于久坐提醒）
        this.activityDetector = new ActivityDetector((event) => {
            console.log('用户活动状态变化:', event);
            // 活动检测器的回调会在ReminderManager中处理
            
            // 更新应用状态中的用户活动信息
            if (this.appSettings) {
                const currentState = this.appSettings.getState();
                currentState.userActivity = {
                    isActive: event.isActive,
                    lastActivityTime: event.lastActivityTime,
                    awayStartTime: event.awayStartTime
                };
                this.appSettings.updateState(currentState);
            }
        });
        
        // 获取当前设置
        const currentSettings = this.appSettings.getSettings();
        
        // 初始化提醒管理器
        this.waterReminder = new WaterReminder(
            currentSettings.water, 
            this.notificationService
        );
        
        this.postureReminder = new PostureReminder(
            currentSettings.posture, 
            this.notificationService,
            this.activityDetector // 将活动检测器传递给久坐提醒
        );
        
        // 初始化UI控制器
        this.uiController = new UIController();
    }

    /**
     * 加载用户设置和应用状态
     * @private
     */
    async loadSettingsAndState() {
        try {
            // 加载设置
            const settings = this.appSettings.loadSettings();
            console.log('已加载用户设置:', settings);
            
            // 加载应用状态
            const state = this.appSettings.loadState();
            console.log('已加载应用状态:', state);
            
            // 检查是否首次使用
            this.appState.isFirstUse = this.appSettings.isFirstUse();
            
            return { settings, state };
        } catch (error) {
            console.warn('加载设置和状态失败:', error);
            throw error;
        }
    }

    /**
     * 保存用户设置
     * @private
     */
    saveSettings() {
        try {
            const currentSettings = this.appSettings.getSettings();
            this.appSettings.saveSettings(currentSettings);
            console.log('设置已保存');
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }
    
    /**
     * 保存应用状态
     * @private
     */
    saveAppState() {
        try {
            // 获取当前提醒状态
            const waterStatus = this.waterReminder ? this.waterReminder.getCurrentStatus() : null;
            const postureStatus = this.postureReminder ? this.postureReminder.getCurrentStatus() : null;
            
            // 更新应用状态
            const currentState = this.appSettings.getState();
            
            if (waterStatus) {
                currentState.waterReminder = {
                    isActive: waterStatus.isActive,
                    timeRemaining: waterStatus.timeRemaining,
                    nextReminderAt: waterStatus.nextReminderAt,
                    lastAcknowledged: waterStatus.lastAcknowledged
                };
            }
            
            if (postureStatus) {
                currentState.postureReminder = {
                    isActive: postureStatus.isActive,
                    timeRemaining: postureStatus.timeRemaining,
                    nextReminderAt: postureStatus.nextReminderAt,
                    lastAcknowledged: postureStatus.lastAcknowledged
                };
            }
            
            // 保存状态
            this.appSettings.saveState(currentState);
            console.log('应用状态已保存');
            return true;
        } catch (error) {
            console.error('保存应用状态失败:', error);
            return false;
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
            
            // 验证设置
            if (!this.appSettings.validateSettings(newSettings)) {
                throw new Error('设置验证失败');
            }
            
            // 更新设置
            this.appSettings.updateSettings(newSettings);
            
            // 更新提醒管理器
            if (this.waterReminder && newSettings.water) {
                this.waterReminder.updateSettings(newSettings.water);
            }
            if (this.postureReminder && newSettings.posture) {
                this.postureReminder.updateSettings(newSettings.posture);
            }
            
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
            const defaultSettings = this.appSettings.resetSettings();
            
            // 应用到UI
            this.uiController.applySettingsToUI(defaultSettings);
            
            // 更新提醒管理器
            if (this.waterReminder) {
                this.waterReminder.updateSettings(defaultSettings.water);
            }
            if (this.postureReminder) {
                this.postureReminder.updateSettings(defaultSettings.posture);
            }
            
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
            
            // 获取当前设置中的目标值
            const currentSettings = this.appSettings.getSettings();
            if (type === 'water' && currentSettings.water) {
                dailyStats.water.target = currentSettings.water.target;
            } else if (type === 'posture' && currentSettings.posture) {
                dailyStats.posture.target = currentSettings.posture.target;
            }
            
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
     * 恢复上次会话状态
     * @private
     */
    async restorePreviousState() {
        try {
            console.log('正在恢复上次会话状态...');
            const currentState = this.appSettings.getState();
            const currentSettings = this.appSettings.getSettings();
            
            // 恢复水提醒状态
            if (currentState.waterReminder && this.waterReminder) {
                // 检查是否应该恢复活动状态
                if (currentState.waterReminder.isActive && currentSettings.water.enabled) {
                    console.log('恢复水提醒状态');
                    
                    // 计算剩余时间
                    let timeRemaining = 0;
                    if (currentState.waterReminder.nextReminderAt) {
                        const now = Date.now();
                        const nextReminder = currentState.waterReminder.nextReminderAt;
                        timeRemaining = Math.max(0, nextReminder - now);
                    }
                    
                    // 如果剩余时间有效，则恢复计时器
                    if (timeRemaining > 0 && timeRemaining < currentSettings.water.interval * 60 * 1000) {
                        this.waterReminder.restoreState({
                            isActive: true,
                            timeRemaining: timeRemaining,
                            nextReminderAt: currentState.waterReminder.nextReminderAt,
                            lastAcknowledged: currentState.waterReminder.lastAcknowledged
                        });
                    } else {
                        // 如果时间无效，则重新开始
                        this.waterReminder.start();
                    }
                }
            }
            
            // 恢复久坐提醒状态
            if (currentState.postureReminder && this.postureReminder) {
                // 检查是否应该恢复活动状态
                if (currentState.postureReminder.isActive && currentSettings.posture.enabled) {
                    console.log('恢复久坐提醒状态');
                    
                    // 计算剩余时间
                    let timeRemaining = 0;
                    if (currentState.postureReminder.nextReminderAt) {
                        const now = Date.now();
                        const nextReminder = currentState.postureReminder.nextReminderAt;
                        timeRemaining = Math.max(0, nextReminder - now);
                    }
                    
                    // 如果剩余时间有效，则恢复计时器
                    if (timeRemaining > 0 && timeRemaining < currentSettings.posture.interval * 60 * 1000) {
                        this.postureReminder.restoreState({
                            isActive: true,
                            timeRemaining: timeRemaining,
                            nextReminderAt: currentState.postureReminder.nextReminderAt,
                            lastAcknowledged: currentState.postureReminder.lastAcknowledged
                        });
                    } else {
                        // 如果时间无效，则重新开始
                        this.postureReminder.start();
                    }
                }
            }
            
            // 恢复用户活动状态
            if (currentState.userActivity && this.activityDetector) {
                this.activityDetector.setLastActivityTime(currentState.userActivity.lastActivityTime || Date.now());
            }
            
            console.log('会话状态恢复完成');
            return true;
        } catch (error) {
            console.error('恢复会话状态失败:', error);
            return false;
        }
    }
    
    /**
     * 显示首次使用引导
     * @private
     */
    showFirstUseGuide() {
        try {
            console.log('显示首次使用引导...');
            
            // 创建引导弹窗
            const guideOverlay = document.createElement('div');
            guideOverlay.className = 'guide-overlay';
            guideOverlay.innerHTML = `
                <div class="guide-modal">
                    <div class="guide-header">
                        <h2>欢迎使用办公族健康提醒</h2>
                        <button class="btn-close" id="guide-close">✕</button>
                    </div>
                    <div class="guide-content">
                        <div class="guide-step">
                            <div class="guide-step-number">1</div>
                            <div class="guide-step-content">
                                <h3>设置提醒间隔</h3>
                                <p>根据您的需要设置喝水和久坐提醒的时间间隔</p>
                            </div>
                        </div>
                        <div class="guide-step">
                            <div class="guide-step-number">2</div>
                            <div class="guide-step-content">
                                <h3>开启提醒</h3>
                                <p>点击"开始"按钮启动提醒功能</p>
                            </div>
                        </div>
                        <div class="guide-step">
                            <div class="guide-step-number">3</div>
                            <div class="guide-step-content">
                                <h3>确认完成</h3>
                                <p>收到提醒后，点击"已完成"按钮确认并重置计时器</p>
                            </div>
                        </div>
                    </div>
                    <div class="guide-footer">
                        <button class="btn-primary" id="guide-settings">设置提醒</button>
                        <button class="btn-secondary" id="guide-start">直接开始</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(guideOverlay);
            
            // 添加事件监听
            document.getElementById('guide-close').addEventListener('click', () => {
                this.closeFirstUseGuide(guideOverlay);
            });
            
            document.getElementById('guide-settings').addEventListener('click', () => {
                this.closeFirstUseGuide(guideOverlay);
                // 打开设置面板
                if (this.uiController) {
                    this.uiController.showSettings();
                }
            });
            
            document.getElementById('guide-start').addEventListener('click', () => {
                this.closeFirstUseGuide(guideOverlay);
                // 直接开始提醒
                this.startReminder('water');
                this.startReminder('posture');
            });
            
            // 标记首次使用完成
            this.appSettings.markFirstUseComplete();
            
        } catch (error) {
            console.error('显示首次使用引导失败:', error);
        }
    }
    
    /**
     * 关闭首次使用引导
     * @param {HTMLElement} guideOverlay - 引导弹窗元素
     * @private
     */
    closeFirstUseGuide(guideOverlay) {
        if (guideOverlay && guideOverlay.parentNode) {
            guideOverlay.parentNode.removeChild(guideOverlay);
        }
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
        const currentSettings = this.appSettings.getSettings();
        
        if (type === 'water' && this.waterReminder) {
            this.waterReminder.start();
            currentSettings.water.enabled = true;
            this.appSettings.updateSettings(currentSettings);
            
            // 保存应用状态
            this.saveAppState();
        } else if (type === 'posture' && this.postureReminder) {
            this.postureReminder.start();
            currentSettings.posture.enabled = true;
            this.appSettings.updateSettings(currentSettings);
            
            // 保存应用状态
            this.saveAppState();
        }
    }

    /**
     * 停止提醒
     * @param {string} type - 'water' | 'posture'
     */
    stopReminder(type) {
        const currentSettings = this.appSettings.getSettings();
        
        if (type === 'water' && this.waterReminder) {
            this.waterReminder.stop();
            currentSettings.water.enabled = false;
            this.appSettings.updateSettings(currentSettings);
            
            // 保存应用状态
            this.saveAppState();
        } else if (type === 'posture' && this.postureReminder) {
            this.postureReminder.stop();
            currentSettings.posture.enabled = false;
            this.appSettings.updateSettings(currentSettings);
            
            // 保存应用状态
            this.saveAppState();
        }
    }

    /**
     * 重置提醒
     * @param {string} type - 'water' | 'posture'
     */
    resetReminder(type) {
        if (type === 'water' && this.waterReminder) {
            this.waterReminder.reset();
            
            // 保存应用状态
            this.saveAppState();
        } else if (type === 'posture' && this.postureReminder) {
            this.postureReminder.reset();
            
            // 保存应用状态
            this.saveAppState();
        }
    }

    /**
     * 更新设置
     * @param {Object} newSettings
     */
    updateSettings(newSettings) {
        try {
            // 更新设置
            const updatedSettings = this.appSettings.updateSettings(newSettings);
            
            // 更新提醒管理器设置
            if (newSettings.water && this.waterReminder) {
                this.waterReminder.updateSettings(newSettings.water);
            }
            
            if (newSettings.posture && this.postureReminder) {
                this.postureReminder.updateSettings(newSettings.posture);
            }
            
            // 更新UI
            if (this.uiController) {
                this.uiController.updateSettings(updatedSettings);
            }
            
            // 保存应用状态
            this.saveAppState();
            
            console.log('设置已更新:', updatedSettings);
            return updatedSettings;
        } catch (error) {
            console.error('更新设置失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前应用状态
     * @returns {Object}
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            settings: this.appSettings?.getSettings(),
            state: this.appSettings?.getState(),
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
        // 保存设置和应用状态
        app.saveSettings();
        app.saveAppState();
    }
});

// 页面可见性变化时保存状态
document.addEventListener('visibilitychange', () => {
    if (app && app.isInitialized) {
        if (document.visibilityState === 'hidden') {
            // 页面隐藏时保存状态
            app.saveAppState();
        } else if (document.visibilityState === 'visible') {
            // 页面可见时检查状态
            // 这里可以添加额外的恢复逻辑，如果需要的话
        }
    }
});

// 导出给其他脚本使用
window.OfficeWellnessApp = OfficeWellnessApp;