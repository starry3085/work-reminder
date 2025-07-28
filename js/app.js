// Service Worker removed for simplicity

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
        this.standupReminder = null;
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
            
            // Step 1: Initialize components
            console.log('Step 1: Initializing components...');
            await this.initializeComponents();
            console.log('✅ Components initialized successfully');
            
            // Step 2: Load user settings and state
            console.log('Step 2: Loading settings and state...');
            await this.loadSettingsAndState();
            console.log('✅ Settings and state loaded successfully');
            
            // Step 3: Initialize UI
            console.log('Step 3: Initializing UI...');
            this.initializeUI();
            console.log('✅ UI initialized successfully');
            
            // Step 4: Set up event listeners
            console.log('Step 4: Setting up event listeners...');
            this.setupEventListeners();
            console.log('✅ Event listeners set up successfully');
            
            // Step 5: Request notification permission (non-blocking)
            console.log('Step 5: Requesting notification permission...');
            try {
                await this.requestNotificationPermission();
                console.log('✅ Notification permission handled');
            } catch (permissionError) {
                console.warn('⚠️ Notification permission failed, continuing:', permissionError);
            }
            
            // Step 6: Restore previous session state (non-blocking)
            console.log('Step 6: Restoring previous state...');
            try {
                await this.restorePreviousState();
                console.log('✅ Previous state restored');
            } catch (stateError) {
                console.warn('⚠️ State restoration failed, continuing:', stateError);
            }
            
            // Step 7: Check if first use (non-blocking)
            console.log('Step 7: Checking first use...');
            try {
                if (this.appSettings && this.appSettings.isFirstUse()) {
                    this.showFirstUseGuide();
                }
                console.log('✅ First use check completed');
            } catch (firstUseError) {
                console.warn('⚠️ First use check failed, continuing:', firstUseError);
            }
            
            this.isInitialized = true;
            this.appState.isInitializing = false;
            console.log('🎉 Application initialization complete');
            
            // Record session start time
            this.appState.lastSessionTime = Date.now();
            
            // Update UI to show success
            if (this.uiController && typeof this.uiController.updateAppStatusSummary === 'function') {
                this.uiController.updateAppStatusSummary(true);
            }
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.appState.isInitializing = false;
            this.handleInitializationError(error);
            throw error; // Re-throw to be caught by the calling code
        }
    }

    /**
     * Initialize all components
     * @private
     */
    async initializeComponents() {
        try {
            console.log('Starting component initialization...');
            
            // Initialize error handler first
            try {
                if (typeof ErrorHandler !== 'undefined') {
                    this.errorHandler = new ErrorHandler();
                    console.log('Error handler initialized');
                } else {
                    console.warn('ErrorHandler class not found');
                    this.errorHandler = null;
                }
            } catch (error) {
                console.warn('Failed to initialize error handler:', error);
                this.errorHandler = null;
            }
            
            // Initialize storage manager
            try {
                if (typeof StorageManager !== 'undefined') {
                    this.storageManager = new StorageManager();
                    console.log('Storage manager initialized');
                } else {
                    throw new Error('StorageManager class not found');
                }
            } catch (error) {
                console.error('Failed to initialize storage manager:', error);
                throw error;
            }
            
            // Initialize app settings manager
            try {
                if (typeof AppSettings !== 'undefined') {
                    this.appSettings = new AppSettings(this.storageManager);
                    console.log('App settings initialized');
                } else {
                    throw new Error('AppSettings class not found');
                }
            } catch (error) {
                console.error('Failed to initialize app settings:', error);
                throw error;
            }
            
            // Initialize mobile adapter
            try {
                if (typeof MobileAdapter !== 'undefined') {
                    this.mobileAdapter = new MobileAdapter(this.errorHandler);
                    console.log('Mobile adapter initialized');
                } else {
                    console.warn('MobileAdapter class not found');
                    this.mobileAdapter = null;
                }
            } catch (error) {
                console.warn('Failed to initialize mobile adapter:', error);
                this.mobileAdapter = null;
            }
            
            // Check browser compatibility
            this.checkBrowserCompatibility();
            
            // Initialize notification service
            try {
                if (typeof NotificationService !== 'undefined') {
                    this.notificationService = new NotificationService();
                    console.log('Notification service initialized');
                } else {
                    throw new Error('NotificationService class not found');
                }
            } catch (error) {
                console.warn('Failed to initialize notification service:', error);
                // Create a fallback notification service
                this.notificationService = {
                    showNotification: (type, title, message) => {
                        console.log(`Notification: ${title} - ${message}`);
                        alert(`${title}\n${message}`);
                    },
                    showInPageAlert: (type, options) => {
                        console.log(`Alert: ${options.title} - ${options.message}`);
                    },
                    requestPermission: () => Promise.resolve(false),
                    setSoundEnabled: () => {},
                    isNotificationSupported: () => false
                };
            }
            
            // Initialize activity detector (for standup reminders)
            try {
                if (typeof ActivityDetector !== 'undefined') {
                    this.activityDetector = new ActivityDetector((event) => {
                        console.log('User activity status changed:', event);
                        // Activity detector callback will be handled in ReminderManager
                        
                        // Update user activity information in app state
                        if (this.appSettings) {
                            try {
                                const currentState = this.appSettings.getState();
                                currentState.userActivity = {
                                    isActive: event.isActive,
                                    lastActivityTime: event.lastActivityTime,
                                    awayStartTime: event.awayStartTime
                                };
                                this.appSettings.updateState(currentState);
                            } catch (stateError) {
                                console.warn('Failed to update activity state:', stateError);
                            }
                        }
                    });
                    console.log('Activity detector initialized');
                } else {
                    console.warn('ActivityDetector class not found');
                    this.activityDetector = null;
                }
            } catch (error) {
                console.warn('Failed to initialize activity detector:', error);
                this.activityDetector = null;
            }
            
            // Get current settings
            const currentSettings = this.appSettings.getSettings();
            console.log('Current settings loaded:', currentSettings);
            
            // Initialize reminder managers
            try {
                if (typeof WaterReminder !== 'undefined') {
                    this.waterReminder = new WaterReminder(
                        currentSettings.water, 
                        this.notificationService
                    );
                    console.log('Water reminder initialized');
                } else {
                    console.warn('WaterReminder class not found');
                    this.waterReminder = null;
                }
            } catch (error) {
                console.warn('Failed to initialize water reminder:', error);
                this.waterReminder = null;
            }
            
            try {
                if (typeof PostureReminder !== 'undefined') {
                    this.standupReminder = new PostureReminder(
                        currentSettings.standup, 
                        this.notificationService,
                        this.activityDetector // Pass activity detector to standup reminder
                    );
                    console.log('Standup reminder initialized');
                } else {
                    console.warn('PostureReminder class not found');
                    this.standupReminder = null;
                }
            } catch (error) {
                console.warn('Failed to initialize standup reminder:', error);
                this.standupReminder = null;
            }
            
            // Initialize UI controller
            try {
                if (typeof UIController !== 'undefined') {
                    this.uiController = new UIController();
                    console.log('UI controller initialized');
                } else {
                    throw new Error('UIController class not found');
                }
            } catch (error) {
                console.error('Failed to initialize UI controller:', error);
                throw error;
            }
            
            // Apply mobile adaptation
            if (this.mobileAdapter) {
                try {
                    this.mobileAdapter.applyMobileAdaptation();
                    console.log('Mobile adaptation applied');
                } catch (error) {
                    console.warn('Failed to apply mobile adaptation:', error);
                }
            }
            
            console.log('All components initialized successfully');
            
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
            const standupStatus = this.standupReminder ? this.standupReminder.getCurrentStatus() : null;
            
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
            
            if (standupStatus) {
                currentState.standupReminder = {
                    isActive: standupStatus.isActive,
                    timeRemaining: standupStatus.timeRemaining,
                    nextReminderAt: standupStatus.nextReminderAt,
                    lastAcknowledged: standupStatus.lastAcknowledged
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
        if (this.standupReminder && typeof this.standupReminder.setStatusChangeCallback === 'function') {
            this.standupReminder.setStatusChangeCallback((status) => {
                console.log('久坐提醒状态变化:', status);
                if (this.uiController) {
                    this.uiController.updateReminderStatus('standup', status);
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
            
            if (typeof this.standupReminder.setTimeUpdateCallback === 'function') {
                this.standupReminder.setTimeUpdateCallback((timeInfo) => {
                    if (this.uiController) {
                        this.uiController.updateReminderTime('standup', timeInfo);
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
        this.uiController.on('standupToggle', (data) => {
            if (data.isActive) {
                this.startReminder('standup');
            } else {
                this.stopReminder('standup');
            }
        });

        this.uiController.on('standupReset', () => {
            this.resetReminder('standup');
        });

        this.uiController.on('standupActivity', () => {
            if (this.standupReminder) {
                this.standupReminder.acknowledge();
                // 更新每日统计
                this.updateDailyStats('standup');
            }
        });



        // 间隔变更事件
        this.uiController.on('waterIntervalChanged', (data) => {
            this.handleIntervalChange('water', data.interval);
        });

        this.uiController.on('standupIntervalChanged', (data) => {
            this.handleIntervalChange('standup', data.interval);
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
     * @param {string} type - 提醒类型 ('water' | 'standup')
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
            } else if (type === 'standup') {
                currentSettings.standup.interval = interval;
                if (this.standupReminder) {
                    this.standupReminder.updateSettings(currentSettings.standup);
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
            if (this.standupReminder && newSettings.standup) {
                this.standupReminder.updateSettings(newSettings.standup);
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
            if (this.standupReminder) {
                this.standupReminder.updateSettings(defaultSettings.standup);
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
     * @param {string} type - 'water' | 'standup'
     * @private
     */
    updateDailyStats(type) {
        try {
            const today = new Date().toDateString();
            const statsKey = `dailyStats_${today}`;
            
            // 从存储中获取今日统计
            let dailyStats = this.storageManager.loadSettings(statsKey) || {
                water: { completed: 0, target: 8 },
                standup: { completed: 0, target: 8 }
            };
            
            // 获取当前设置中的目标值
            const currentSettings = this.appSettings.getSettings();
            if (type === 'water' && currentSettings.water) {
                dailyStats.water.target = currentSettings.water.target;
            } else if (type === 'standup' && currentSettings.standup) {
                dailyStats.standup.target = currentSettings.standup.target;
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
            if (currentState.standupReminder && this.standupReminder) {
                // 检查是否应该恢复活动状态
                if (currentState.standupReminder.isActive && currentSettings.standup.enabled) {
                    console.log('恢复久坐提醒状态');
                    
                    // 计算剩余时间
                    let timeRemaining = 0;
                    if (currentState.standupReminder.nextReminderAt) {
                        const now = Date.now();
                        const nextReminder = currentState.standupReminder.nextReminderAt;
                        timeRemaining = Math.max(0, nextReminder - now);
                    }
                    
                    // 如果剩余时间有效，则恢复计时器
                    if (timeRemaining > 0 && timeRemaining < currentSettings.standup.interval * 60 * 1000) {
                        if (typeof this.standupReminder.restoreState === 'function') {
                            this.standupReminder.restoreState({
                                isActive: true,
                                timeRemaining: timeRemaining,
                                nextReminderAt: currentState.standupReminder.nextReminderAt,
                                lastAcknowledged: currentState.standupReminder.lastAcknowledged
                            });
                        } else {
                            // 如果没有restoreState方法，则重新开始
                            this.standupReminder.start();
                        }
                    } else {
                        // 如果时间无效，则重新开始
                        this.standupReminder.start();
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
                        this.startReminder('standup');
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
            if (!this.uiController && typeof UIController !== 'undefined') {
                try {
                    this.uiController = new UIController();
                    this.uiController.initialize();
                    console.log('UI controller recovered successfully');
                } catch (uiError) {
                    console.warn('Failed to recover UI controller:', uiError);
                }
            }
            
            // 显示错误状态
            if (this.uiController && typeof this.uiController.updateAppStatusSummary === 'function') {
                this.uiController.updateAppStatusSummary(false);
            }
            
        } catch (recoveryError) {
            console.error('Failed to recover from initialization error:', recoveryError);
            this.showFallbackError('Application failed to start. Please refresh the page.');
        }
    }
    
    /**
     * 获取用户友好的错误信息
     * @param {Error} error - 错误对象
     * @returns {string} 用户友好的错误信息
     */
    getErrorMessage(error) {
        if (!error) return 'Unknown error occurred';
        
        const message = error.message || error.toString();
        
        // 根据错误类型返回友好信息
        if (message.includes('Missing required classes')) {
            return '应用组件加载失败，请刷新页面重试';
        } else if (message.includes('localStorage')) {
            return '浏览器存储功能不可用，某些功能可能受限';
        } else if (message.includes('Notification')) {
            return '通知功能初始化失败，将使用页面内提醒';
        } else if (message.includes('UIController')) {
            return '用户界面初始化失败，请刷新页面';
        } else {
            return `应用启动时遇到问题: ${message}`;
        }
    }
    
    /**
     * 显示回退错误信息
     * @param {string} message - 错误信息
     */
    showFallbackError(message) {
        // 尝试在页面上显示错误
        try {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #e74c3c;
                color: white;
                padding: 15px 25px;
                border-radius: 8px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                max-width: 500px;
                text-align: center;
            `;
            
            errorDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 8px;">应用启动失败</div>
                <div style="font-size: 14px; margin-bottom: 12px;">${message}</div>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #e74c3c;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">刷新页面</button>
            `;
            
            document.body.appendChild(errorDiv);
            
            // 10秒后自动隐藏
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 10000);
            
        } catch (displayError) {
            console.error('Failed to display error message:', displayError);
            // 最后的回退方案
            alert(message + '\n\n请刷新页面重试。');
        }
    }

    /**
     * 启动提醒
     * @param {string} type - 'water' | 'standup'
     */
    startReminder(type) {
        try {
            if (!this.appSettings) {
                console.warn('App settings not initialized, cannot start reminder');
                return;
            }
            
            const currentSettings = this.appSettings.getSettings();
            
            if (type === 'water' && this.waterReminder) {
                console.log('Starting water reminder...');
                this.waterReminder.start();
                currentSettings.water.enabled = true;
                this.appSettings.updateSettings(currentSettings);
                
                // 保存应用状态
                this.saveAppState();
                console.log('Water reminder started successfully');
                
                // 手动触发状态更新以确保UI同步
                if (this.uiController) {
                    const status = this.waterReminder.getCurrentStatus();
                    console.log('Manual status update for water:', status);
                    this.uiController.updateReminderStatus('water', status);
                }
            } else if (type === 'standup' && this.standupReminder) {
                console.log('Starting standup reminder...');
                this.standupReminder.start();
                currentSettings.standup.enabled = true;
                this.appSettings.updateSettings(currentSettings);
                
                // 保存应用状态
                this.saveAppState();
                console.log('Standup reminder started successfully');
                
                // 手动触发状态更新以确保UI同步
                if (this.uiController) {
                    const status = this.standupReminder.getCurrentStatus();
                    console.log('Manual status update for standup:', status);
                    this.uiController.updateReminderStatus('standup', status);
                }
            } else {
                console.warn(`Cannot start ${type} reminder: reminder not initialized`);
            }
        } catch (error) {
            console.error(`Failed to start ${type} reminder:`, error);
        }
    }

    /**
     * 停止提醒
     * @param {string} type - 'water' | 'standup'
     */
    stopReminder(type) {
        try {
            if (!this.appSettings) {
                console.warn('App settings not initialized, cannot stop reminder');
                return;
            }
            
            const currentSettings = this.appSettings.getSettings();
            
            if (type === 'water' && this.waterReminder) {
                console.log('Stopping water reminder...');
                this.waterReminder.stop();
                currentSettings.water.enabled = false;
                this.appSettings.updateSettings(currentSettings);
                
                // 保存应用状态
                this.saveAppState();
                console.log('Water reminder stopped successfully');
                
                // 手动触发状态更新以确保UI同步
                if (this.uiController) {
                    const status = this.waterReminder.getCurrentStatus();
                    console.log('Manual status update for water:', status);
                    this.uiController.updateReminderStatus('water', status);
                }
            } else if (type === 'standup' && this.standupReminder) {
                console.log('Stopping standup reminder...');
                this.standupReminder.stop();
                currentSettings.standup.enabled = false;
                this.appSettings.updateSettings(currentSettings);
                
                // 保存应用状态
                this.saveAppState();
                console.log('Standup reminder stopped successfully');
                
                // 手动触发状态更新以确保UI同步
                if (this.uiController) {
                    const status = this.standupReminder.getCurrentStatus();
                    console.log('Manual status update for standup:', status);
                    this.uiController.updateReminderStatus('standup', status);
                }
            } else {
                console.warn(`Cannot stop ${type} reminder: reminder not initialized`);
            }
        } catch (error) {
            console.error(`Failed to stop ${type} reminder:`, error);
        }
    }
            } else {
                console.warn(`Cannot stop ${type} reminder: reminder not initialized`);
            }
        } catch (error) {
            console.error(`Failed to stop ${type} reminder:`, error);
        }
    }

    /**
     * 重置提醒
     * @param {string} type - 'water' | 'standup'
     */
    resetReminder(type) {
        if (type === 'water' && this.waterReminder) {
            console.log('Resetting water reminder...');
            this.waterReminder.reset();
            
            // 保存应用状态
            this.saveAppState();
            console.log('Water reminder reset successfully');
            
            // 手动触发状态更新以确保UI同步
            if (this.uiController) {
                const status = this.waterReminder.getCurrentStatus();
                console.log('Manual status update for water:', status);
                this.uiController.updateReminderStatus('water', status);
            }
        } else if (type === 'standup' && this.standupReminder) {
            console.log('Resetting standup reminder...');
            this.standupReminder.reset();
            
            // 保存应用状态
            this.saveAppState();
            console.log('Standup reminder reset successfully');
            
            // 手动触发状态更新以确保UI同步
            if (this.uiController) {
                const status = this.standupReminder.getCurrentStatus();
                console.log('Manual status update for standup:', status);
                this.uiController.updateReminderStatus('standup', status);
            }
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
            
            if (newSettings.standup && this.standupReminder) {
                this.standupReminder.updateSettings(newSettings.standup);
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
            standupReminder: this.standupReminder?.getCurrentStatus()
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
    let standupActive = false;
    
    // 更新应用状态指示器的函数
    function updateAppStatus() {
        const indicator = document.getElementById('app-status-indicator');
        const text = document.getElementById('app-status-text');
        
        console.log('Updating app status - water:', waterActive, 'standup:', standupActive);
        
        if (indicator && text) {
            const isActive = waterActive || standupActive;
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
    const standupToggle = document.getElementById('standup-toggle');
    if (standupToggle) {
        standupToggle.addEventListener('click', () => {
            console.log('Standup toggle clicked (fallback)');
            const isStart = standupToggle.textContent.trim() === 'Start';
            
            if (isStart) {
                standupToggle.textContent = 'Pause';
                standupToggle.className = 'btn-secondary';
                standupActive = true;
                showSimpleNotification('🧘 Standup reminder started!');
            } else {
                standupToggle.textContent = 'Start';
                standupToggle.className = 'btn-primary';
                standupActive = false;
                showSimpleNotification('🧘 Standup reminder paused!');
            }
            
            updateAppStatus();
        });
        console.log('Standup toggle fallback handler added');
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
        padding: 12px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        white-space: nowrap;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        max-width: 300px;
        word-wrap: break-word;
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
            const standupToggle = document.getElementById('standup-toggle');
            
            if (waterToggle) waterToggle.removeAttribute('data-fallback-bound');
            if (standupToggle) standupToggle.removeAttribute('data-fallback-bound');
            
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
    const standupToggle = document.getElementById('standup-toggle');
    
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

}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfficeWellnessApp;
}