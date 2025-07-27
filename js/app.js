/**
 * Register Service Worker
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/service-worker.js')
            .then(registration => {
                console.log('Service Worker registration successful:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

/**
 * Main Application Class - Coordinates the work of various components
 */
class OfficeWellnessApp {
    constructor() {
        this.isInitialized = false;
        
        // Component instances
        this.errorHandler = null;
        this.mobileAdapter = null;
        this.storageManager = null;
        this.appSettings = null;
        this.notificationService = null;
        this.activityDetector = null;
        this.waterReminder = null;
        this.postureReminder = null;
        this.uiController = null;
        
        // Application state
        this.appState = {
            isInitializing: false,
            isFirstUse: false,
            lastSessionTime: null,
            compatibilityChecked: false
        };
    }

    /**
     * Initialize application
     */
    async initialize() {
        try {
            console.log('Initializing Office Wellness Reminder application...');
            this.appState.isInitializing = true;
            
            // Initialize components
            await this.initializeComponents();
            
            // Load user settings and state
            await this.loadSettingsAndState();
            
            // Initialize UI
            this.initializeUI();
            
            // Set up event listeners (for reminder callbacks)
            this.setupEventListeners();
            
            // Request notification permission
            await this.requestNotificationPermission();
            
            // Restore previous session state
            await this.restorePreviousState();
            
            // Check if first use
            if (this.appSettings.isFirstUse()) {
                this.showFirstUseGuide();
            }
            
            this.isInitialized = true;
            this.appState.isInitializing = false;
            console.log('Application initialization complete');
            
            // Record session start time
            this.appState.lastSessionTime = Date.now();
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.appState.isInitializing = false;
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize all components
     * @private
     */
    async initializeComponents() {
        try {
            // Initialize error handler
            try {
                this.errorHandler = new ErrorHandler();
            } catch (error) {
                console.warn('Failed to initialize error handler:', error);
                this.errorHandler = null;
            }
            
            // Initialize mobile adapter
            try {
                this.mobileAdapter = new MobileAdapter(this.errorHandler);
            } catch (error) {
                console.warn('Failed to initialize mobile adapter:', error);
                this.mobileAdapter = null;
            }
            
            // Check browser compatibility
            this.checkBrowserCompatibility();
            
            // Initialize storage manager
            this.storageManager = new StorageManager();
            
            // Initialize app settings manager
            this.appSettings = new AppSettings(this.storageManager);
            
            // Initialize notification service
            try {
                this.notificationService = new NotificationService();
            } catch (error) {
                console.warn('Failed to initialize notification service:', error);
                // Create a fallback notification service
                this.notificationService = {
                    showNotification: () => console.log('Notification service unavailable'),
                    showInPageAlert: () => console.log('In-page alert unavailable'),
                    requestPermission: () => Promise.resolve(false)
                };
            }
            
            // Initialize activity detector (for posture reminders)
            try {
                this.activityDetector = new ActivityDetector((event) => {
                    console.log('User activity status changed:', event);
                    // Activity detector callback will be handled in ReminderManager
                    
                    // Update user activity information in app state
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
            } catch (error) {
                console.warn('Failed to initialize activity detector:', error);
                this.activityDetector = null;
            }
            
            // Get current settings
            const currentSettings = this.appSettings.getSettings();
            
            // Initialize reminder managers
            try {
                this.waterReminder = new WaterReminder(
                    currentSettings.water, 
                    this.notificationService
                );
            } catch (error) {
                console.warn('Failed to initialize water reminder:', error);
                this.waterReminder = null;
            }
            
            try {
                this.postureReminder = new PostureReminder(
                    currentSettings.posture, 
                    this.notificationService,
                    this.activityDetector // Pass activity detector to posture reminder
                );
            } catch (error) {
                console.warn('Failed to initialize posture reminder:', error);
                this.postureReminder = null;
            }
            
            // Initialize UI controller
            this.uiController = new UIController();
            
            // Apply mobile adaptation
            if (this.mobileAdapter) {
                try {
                    this.mobileAdapter.applyMobileAdaptation();
                } catch (error) {
                    console.warn('Failed to apply mobile adaptation:', error);
                }
            }
        } catch (error) {
            console.error('Failed to initialize components:', error);
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'initialization',
                    error: error,
                    message: 'Failed to initialize components: ' + (error.message || 'Unknown error'),
                    timestamp: Date.now()
                });
            }
            throw error;
        }
    }
    
    /**
     * 检查浏览器兼容性
     * @private
     */
    checkBrowserCompatibility() {
        if (!this.mobileAdapter || this.appState.compatibilityChecked) {
            return;
        }
        
        try {
            // 检查功能支持和替代方案
            const compatibilityResult = this.mobileAdapter.checkFeaturesAndFallbacks();
            
            // 标记已检查兼容性
            this.appState.compatibilityChecked = true;
            
            // 如果有不支持的功能，在UI初始化后显示提示
            if (Object.values(compatibilityResult.supported).includes(false)) {
                // 在DOM加载完成后显示兼容性提示
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        if (this.uiController && this.uiController.isInitialized) {
                            this.mobileAdapter.showCompatibilityNotice(document.body);
                        }
                    }, 1000); // 延迟1秒显示，确保UI已初始化
                });
            }
            
            return compatibilityResult;
        } catch (error) {
            console.error('Failed to check browser compatibility:', error);
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    error: error,
                    message: 'Failed to check browser compatibility: ' + (error.message || 'Unknown error'),
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * 加载用户设置和应用状态
     * @private
     */
    async loadSettingsAndState() {
        try {
            // 加载设置
            const settings = this.appSettings.loadSettings();
            console.log('User settings loaded:', settings);
            
            // Load application state
            const state = this.appSettings.loadState();
            console.log('Application state loaded:', state);
            
            // 检查是否首次使用
            this.appState.isFirstUse = this.appSettings.isFirstUse();
            
            return { settings, state };
        } catch (error) {
            console.warn('Failed to load settings and state:', error);
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
            console.log('Settings saved');
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
        if (this.waterReminder && typeof this.waterReminder.setStatusChangeCallback === 'function') {
            this.waterReminder.setStatusChangeCallback((status) => {
                console.log('水提醒状态变化:', status);
                if (this.uiController) {
                    this.uiController.updateReminderStatus('water', status);
                }
            });
            
            if (typeof this.waterReminder.setTimeUpdateCallback === 'function') {
                this.waterReminder.setTimeUpdateCallback((timeInfo) => {
                    if (this.uiController) {
                        this.uiController.updateReminderTime('water', timeInfo);
                    }
                });
            }
        }
        
        // 设置久坐提醒状态变化回调
        if (this.postureReminder && typeof this.postureReminder.setStatusChangeCallback === 'function') {
            this.postureReminder.setStatusChangeCallback((status) => {
                console.log('久坐提醒状态变化:', status);
                if (this.uiController) {
                    this.uiController.updateReminderStatus('posture', status);
                }
                
                // If auto-pause or resume, show notification
                if (status.isAuto && this.notificationService) {
                    const message = status.status === 'paused' 
                        ? 'Detected you are away, standup reminder auto-paused' 
                        : 'Detected you have returned, standup reminder auto-resumed';
                    
                    if (typeof this.notificationService.showInPageAlert === 'function') {
                        this.notificationService.showInPageAlert('info', {
                            title: 'Activity Detection',
                            message: message
                        });
                    }
                }
            });
            
            if (typeof this.postureReminder.setTimeUpdateCallback === 'function') {
                this.postureReminder.setTimeUpdateCallback((timeInfo) => {
                    if (this.uiController) {
                        this.uiController.updateReminderTime('posture', timeInfo);
                    }
                });
            }
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
        
        // 获取当前设置并应用到UI
        const currentSettings = this.appSettings.getSettings();
        this.uiController.applySettingsToUI(currentSettings);
        
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

        // 间隔变更事件
        this.uiController.on('waterIntervalChanged', (data) => {
            this.handleIntervalChange('water', data.interval);
        });

        this.uiController.on('postureIntervalChanged', (data) => {
            this.handleIntervalChange('posture', data.interval);
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
     * 处理间隔变更
     * @param {string} type - 提醒类型 ('water' | 'posture')
     * @param {number} interval - 新的间隔（分钟）
     * @private
     */
    handleIntervalChange(type, interval) {
        try {
            // 更新设置
            const currentSettings = this.appSettings.getSettings();
            if (type === 'water') {
                currentSettings.water.interval = interval;
                if (this.waterReminder) {
                    this.waterReminder.updateSettings(currentSettings.water);
                }
            } else if (type === 'posture') {
                currentSettings.posture.interval = interval;
                if (this.postureReminder) {
                    this.postureReminder.updateSettings(currentSettings.posture);
                }
            }
            
            // 保存设置
            this.appSettings.saveSettings(currentSettings);
            
            console.log(`${type} reminder interval updated to ${interval} minutes`);
            
        } catch (error) {
            console.error(`Failed to update ${type} interval:`, error);
        }
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
            
            // Show save success notification
            this.notificationService.showInPageAlert('success', {
                title: 'Settings Saved',
                message: 'Your settings have been successfully saved and applied'
            });
            
            // 关闭设置面板
            this.uiController.hideSettings();
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.notificationService.showInPageAlert('error', {
                title: 'Save Failed',
                message: 'Failed to save settings, please try again'
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
            
            // Show reset success notification
            this.notificationService.showInPageAlert('success', {
                title: 'Settings Reset',
                message: 'All settings have been restored to default values'
            });
            
        } catch (error) {
            console.error('Failed to reset settings:', error);
            this.notificationService.showInPageAlert('error', {
                title: 'Reset Failed',
                message: 'Failed to reset settings, please try again'
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
                        if (typeof this.postureReminder.restoreState === 'function') {
                            this.postureReminder.restoreState({
                                isActive: true,
                                timeRemaining: timeRemaining,
                                nextReminderAt: currentState.postureReminder.nextReminderAt,
                                lastAcknowledged: currentState.postureReminder.lastAcknowledged
                            });
                        } else {
                            // 如果没有restoreState方法，则重新开始
                            this.postureReminder.start();
                        }
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
                        <h2>Welcome to Office Wellness Reminder</h2>
                        <button class="btn-close" id="guide-close">X</button>
                    </div>
                    <div class="guide-content">
                        <div class="guide-step">
                            <div class="guide-step-number">1</div>
                            <div class="guide-step-content">
                                <h3>Set Reminder Intervals</h3>
                                <p>Set water and standup reminder intervals according to your needs</p>
                            </div>
                        </div>
                        <div class="guide-step">
                            <div class="guide-step-number">2</div>
                            <div class="guide-step-content">
                                <h3>Enable Reminders</h3>
                                <p>Click the "Start" button to activate reminders</p>
                            </div>
                        </div>
                        <div class="guide-step">
                            <div class="guide-step-number">3</div>
                            <div class="guide-step-content">
                                <h3>Confirm Completion</h3>
                                <p>After receiving a reminder, click the "Done" button to confirm and reset the timer</p>
                            </div>
                        </div>
                    </div>
                    <div class="guide-footer">
                        <button class="btn-primary" id="guide-settings">Configure Settings</button>
                        <button class="btn-secondary" id="guide-start">Start Now</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(guideOverlay);
            
            // 使用setTimeout确保DOM元素已经完全添加
            setTimeout(() => {
                // 添加事件监听
                const closeBtn = document.getElementById('guide-close');
                const settingsBtn = document.getElementById('guide-settings');
                const startBtn = document.getElementById('guide-start');
                
                console.log('Guide buttons found:', {
                    closeBtn: !!closeBtn,
                    settingsBtn: !!settingsBtn,
                    startBtn: !!startBtn
                });
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        console.log('Guide close button clicked');
                        this.closeFirstUseGuide(guideOverlay);
                        // 标记首次使用完成
                        this.appSettings.markFirstUseComplete();
                    });
                }
                
                if (settingsBtn) {
                    settingsBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        console.log('Guide settings button clicked');
                        this.closeFirstUseGuide(guideOverlay);
                        // 标记首次使用完成
                        this.appSettings.markFirstUseComplete();
                        // 打开设置面板
                        if (this.uiController) {
                            this.uiController.showSettings();
                        }
                    });
                }
                
                if (startBtn) {
                    startBtn.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        console.log('Guide start button clicked');
                        this.closeFirstUseGuide(guideOverlay);
                        // 标记首次使用完成
                        this.appSettings.markFirstUseComplete();
                        // 直接开始提醒
                        this.startReminder('water');
                        this.startReminder('posture');
                    });
                }
            }, 100);
            
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
        console.log('Closing first use guide');
        if (guideOverlay && guideOverlay.parentNode) {
            guideOverlay.parentNode.removeChild(guideOverlay);
            console.log('Guide overlay removed');
        } else {
            console.warn('Guide overlay not found or already removed');
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
            return 'Local storage unavailable, settings cannot be saved';
        } else if (error.message.includes('notification')) {
            return 'Notification functionality unavailable, will use in-page alerts';
        } else if (error.message.includes('audio')) {
            return 'Audio functionality unavailable, will use silent alerts';
        } else {
            return 'The application encountered issues during startup, some features may be unavailable';
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
        const currentSettings = this.appSettings.getSettings();
        if (!currentSettings.notifications.browserNotifications) {
            return;
        }

        try {
            const hasPermission = await this.notificationService.requestPermission();
            if (!hasPermission) {
                // 显示权限请求提示
                if (this.uiController && typeof this.uiController.showPermissionPrompt === 'function') {
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
                            const settings = this.appSettings.getSettings();
                            settings.notifications.browserNotifications = false;
                            this.appSettings.saveSettings(settings);
                        }
                    );
                }
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
        console.error('Application initialization error:', error);
        
        // 显示用户友好的错误信息
        const errorMessage = this.getErrorMessage(error);
        this.showFallbackError(errorMessage);
        
        // 尝试基本功能恢复
        try {
            // 至少确保UI可以显示
            if (!this.uiController) {
                this.uiController = new UIController();
                this.uiController.initialize();
            }
            
            // 显示错误状态
            if (this.uiController) {
                this.uiController.updateAppStatusSummary(false);
            }
            
        } catch (recoveryError) {
            console.error('Failed to recover from initialization error:', recoveryError);
            this.showFallbackError('Application failed to start. Please refresh the page.');
        }
    }

    /**
     * 启动提醒
     * @param {string} type - 'water' | 'posture'
     */
    startReminder(type) {
        try {
            if (!this.appSettings) {
                console.warn('App settings not initialized, cannot start reminder');
                return;
            }
            
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
            } else {
                console.warn(`Cannot start ${type} reminder: reminder not initialized`);
            }
        } catch (error) {
            console.error(`Failed to start ${type} reminder:`, error);
        }
    }

    /**
     * 停止提醒
     * @param {string} type - 'water' | 'posture'
     */
    stopReminder(type) {
        try {
            if (!this.appSettings) {
                console.warn('App settings not initialized, cannot stop reminder');
                return;
            }
            
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
            } else {
                console.warn(`Cannot stop ${type} reminder: reminder not initialized`);
            }
        } catch (error) {
            console.error(`Failed to stop ${type} reminder:`, error);
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
        console.error('Application startup failed:', error);
        
        // 如果应用初始化失败，设置基本的按钮功能
        setupFallbackButtons();
        
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
            max-width: 400px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <strong>Application Error</strong><br>
            The application failed to start properly.<br>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px; background: white; color: #f44336; border: none; border-radius: 4px; cursor: pointer;">
                Refresh Page
            </button>
        `;
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

// 备用按钮功能 - 当主应用初始化失败时使用
function setupFallbackButtons() {
    console.log('Setting up fallback button handlers...');
    
    // 状态跟踪
    let waterActive = false;
    let postureActive = false;
    
    // 更新应用状态指示器的函数
    function updateAppStatus() {
        const indicator = document.getElementById('app-status-indicator');
        const text = document.getElementById('app-status-text');
        
        console.log('Updating app status - water:', waterActive, 'posture:', postureActive);
        
        if (indicator && text) {
            const isActive = waterActive || postureActive;
            console.log('Combined active status:', isActive);
            
            if (isActive) {
                indicator.classList.add('active');
                text.textContent = 'Wellness Reminders Active';
                console.log('Set status to active');
            } else {
                indicator.classList.remove('active');
                text.textContent = 'Wellness Reminders Inactive';
                console.log('Set status to inactive');
            }
            
            console.log('Final indicator classes:', indicator.className);
            console.log('Final text content:', text.textContent);
        } else {
            console.warn('Status elements not found - indicator:', !!indicator, 'text:', !!text);
        }
    }
    
    // 水提醒按钮
    const waterToggle = document.getElementById('water-toggle');
    if (waterToggle) {
        waterToggle.addEventListener('click', () => {
            console.log('Water toggle clicked (fallback)');
            const isStart = waterToggle.textContent.trim() === 'Start';
            
            if (isStart) {
                waterToggle.textContent = 'Pause';
                waterToggle.className = 'btn-secondary';
                waterActive = true;
                showSimpleNotification('💧 Water reminder started!');
            } else {
                waterToggle.textContent = 'Start';
                waterToggle.className = 'btn-primary';
                waterActive = false;
                showSimpleNotification('💧 Water reminder paused!');
            }
            
            updateAppStatus();
        });
        console.log('Water toggle fallback handler added');
    }
    
    // 姿势提醒按钮
    const postureToggle = document.getElementById('posture-toggle');
    if (postureToggle) {
        postureToggle.addEventListener('click', () => {
            console.log('Posture toggle clicked (fallback)');
            const isStart = postureToggle.textContent.trim() === 'Start';
            
            if (isStart) {
                postureToggle.textContent = 'Pause';
                postureToggle.className = 'btn-secondary';
                postureActive = true;
                showSimpleNotification('🧘 Standup reminder started!');
            } else {
                postureToggle.textContent = 'Start';
                postureToggle.className = 'btn-primary';
                postureActive = false;
                showSimpleNotification('🧘 Standup reminder paused!');
            }
            
            updateAppStatus();
        });
        console.log('Posture toggle fallback handler added');
    }
    
    // Start All 按钮
    const startAllBtn = document.getElementById('start-all-btn');
    if (startAllBtn) {
        startAllBtn.addEventListener('click', () => {
            console.log('Start All clicked (fallback)');
            if (waterToggle && waterToggle.textContent === 'Start') {
                waterToggle.click();
            }
            if (postureToggle && postureToggle.textContent === 'Start') {
                postureToggle.click();
            }
        });
    }
    
    // Pause All 按钮
    const pauseAllBtn = document.getElementById('pause-all-btn');
    if (pauseAllBtn) {
        pauseAllBtn.addEventListener('click', () => {
            console.log('Pause All clicked (fallback)');
            if (waterToggle && waterToggle.textContent === 'Pause') {
                waterToggle.click();
            }
            if (postureToggle && postureToggle.textContent === 'Pause') {
                postureToggle.click();
            }
        });
    }
}

// 简单通知函数
function showSimpleNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #3498db;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 应用初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 立即初始化备用按钮处理，确保按钮总是能工作
    initializeFallbackButtons();
    
    try {
        console.log('Starting application initialization...');
        
        // 创建应用实例
        app = new OfficeWellnessApp();
        
        // 初始化应用
        await app.initialize();
        
        console.log('Application initialized successfully');
        
        // 如果主应用初始化成功，移除备用处理器的标记，让主应用接管
        setTimeout(() => {
            const waterToggle = document.getElementById('water-toggle');
            const postureToggle = document.getElementById('posture-toggle');
            const startAllBtn = document.getElementById('start-all-btn');
            
            if (waterToggle) waterToggle.removeAttribute('data-fallback-bound');
            if (postureToggle) postureToggle.removeAttribute('data-fallback-bound');
            if (startAllBtn) startAllBtn.removeAttribute('data-fallback-bound');
            
            console.log('Main app took over button handling');
        }, 1000);
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        console.log('Using fallback button handlers');
    }
});

// 备用按钮初始化 - 确保按钮总是能工作
function initializeFallbackButtons() {
    console.log('Initializing fallback button handlers...');
    
    // 立即尝试绑定，然后再延迟尝试
    bindFallbackHandlers();
    setTimeout(bindFallbackHandlers, 100);
    setTimeout(bindFallbackHandlers, 500);
}

function bindFallbackHandlers() {
    const waterToggle = document.getElementById('water-toggle');
    const postureToggle = document.getElementById('posture-toggle');
    const startAllBtn = document.getElementById('start-all-btn');
    
    if (waterToggle && !waterToggle.hasAttribute('data-fallback-bound')) {
        console.log('Binding fallback water toggle handler');
        waterToggle.setAttribute('data-fallback-bound', 'true');
        
        const waterHandler = function(e) {
            console.log('Fallback water toggle click');
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = this.textContent.trim() === 'Start';
            if (isActive) {
                this.textContent = 'Pause';
                this.className = 'btn-secondary';
                showSimpleNotification('Water reminder started!');
            } else {
                this.textContent = 'Start';
                this.className = 'btn-primary';
                showSimpleNotification('Water reminder paused!');
            }
        };
        
        waterToggle.addEventListener('click', waterHandler, true);
        waterToggle.addEventListener('click', waterHandler, false); // 双重绑定确保触发
    }
    
    if (postureToggle && !postureToggle.hasAttribute('data-fallback-bound')) {
        console.log('Binding fallback posture toggle handler');
        postureToggle.setAttribute('data-fallback-bound', 'true');
        
        const postureHandler = function(e) {
            console.log('Fallback posture toggle click');
            e.preventDefault();
            e.stopPropagation();
            
            const isActive = this.textContent.trim() === 'Start';
            if (isActive) {
                this.textContent = 'Pause';
                this.className = 'btn-secondary';
                showSimpleNotification('Standup reminder started!');
            } else {
                this.textContent = 'Start';
                this.className = 'btn-primary';
                showSimpleNotification('Standup reminder paused!');
            }
        };
        
        postureToggle.addEventListener('click', postureHandler, true);
        postureToggle.addEventListener('click', postureHandler, false); // 双重绑定确保触发
    }
    
    if (startAllBtn && !startAllBtn.hasAttribute('data-fallback-bound')) {
        console.log('Binding fallback start all handler');
        startAllBtn.setAttribute('data-fallback-bound', 'true');
        
        const startAllHandler = function(e) {
            console.log('Fallback start all click');
            e.preventDefault();
            e.stopPropagation();
            
            // 启动所有提醒
            if (waterToggle && waterToggle.textContent.trim() === 'Start') {
                waterToggle.click();
            }
            if (postureToggle && postureToggle.textContent.trim() === 'Start') {
                postureToggle.click();
            }
            
            showSimpleNotification('All reminders started!');
        };
        
        startAllBtn.addEventListener('click', startAllHandler, true);
        startAllBtn.addEventListener('click', startAllHandler, false); // 双重绑定确保触发
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfficeWellnessApp;
}