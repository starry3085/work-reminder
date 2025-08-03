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
        this.stateManager = null;
        this.appSettings = null;
        this.notificationService = null;
        this.waterReminder = null;
        this.standupReminder = null;
        this.uiController = null;
        
        // Application state (now managed by StateManager)
        this.appState = {
            isInitializing: false,
            isFirstUse: false,
            lastSessionTime: null,
            compatibilityChecked: false
        };
    }

    /**
     * Initialize application with unified StateManager
     */
    async initialize() {
        try {
            console.log('Initializing Office Wellness Reminder application...');
            this.appState.isInitializing = true;
            
            // Initialize components
            await this.initializeComponents();
            
            // Load settings and state via StateManager
            await this.loadSettingsAndState();
            
            // Initialize UI
            this.initializeUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Request notification permission (non-blocking)
            try {
                await this.requestNotificationPermission();
            } catch (permissionError) {
                console.warn('Notification permission failed, continuing:', permissionError);
            }
            
            // Restore previous session state (non-blocking)
            try {
                await this.restorePreviousState();
            } catch (stateError) {
                console.warn('State restoration failed, continuing:', stateError);
            }
            
            // Check if first use (non-blocking)
            try {
                if (this.appSettings && this.appSettings.isFirstUse()) {
                    this.showFirstUseGuide();
                }
            } catch (firstUseError) {
                console.warn('First use check failed, continuing:', firstUseError);
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
            throw error;
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
            
            // Initialize state manager
            try {
                if (typeof StateManager !== 'undefined') {
                    this.stateManager = new StateManager(this.storageManager);
                    console.log('State manager initialized');
                } else {
                    throw new Error('StateManager class not found');
                }
            } catch (error) {
                console.error('Failed to initialize state manager:', error);
                throw error;
            }
            
            // Initialize app settings manager with state manager
            try {
                if (typeof AppSettings !== 'undefined') {
                    this.appSettings = new AppSettings(this.stateManager);
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
            
            // Activity detector removed for MVP - using simpler time-based reminders
            
            // Get current settings
            const currentSettings = this.appSettings.getSettings();
            console.log('Current settings loaded:', currentSettings);
            
            // Initialize reminder managers
            try {
                if (typeof WaterReminder !== 'undefined') {
                    this.waterReminder = new WaterReminder(
                        currentSettings.water, 
                        this.notificationService,
                        this.stateManager
                    );
                    this.waterReminder.setStateManager(this.stateManager);
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
                if (typeof StandupReminder !== 'undefined') {
                    this.standupReminder = new StandupReminder(
                        currentSettings.standup, 
                        this.notificationService,
                        this.stateManager
                    );
                    this.standupReminder.setStateManager(this.stateManager);
                    console.log('Standup reminder initialized');
                } else {
                    console.warn('StandupReminder class not found');
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
                    this.uiController.setStateManager(this.stateManager);
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
     * Check browser compatibility
     * @private
     */
    checkBrowserCompatibility() {
        if (!this.mobileAdapter || this.appState.compatibilityChecked) {
            return;
        }
        
        try {
            // Check feature support and fallbacks
            const compatibilityResult = this.mobileAdapter.checkFeaturesAndFallbacks();
            
            // Mark compatibility as checked
            this.appState.compatibilityChecked = true;
            
            // If there are unsupported features, show notification after UI initialization
            if (Object.values(compatibilityResult.supported).includes(false)) {
                // Show compatibility notification after DOM is loaded
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => {
                        if (this.uiController && this.uiController.isInitialized) {
                            this.mobileAdapter.showCompatibilityNotice(document.body);
                        }
                    }, 1000); // Delay 1 second to ensure UI is initialized
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
     * Load user settings and application state
     * @private
     */
    async loadSettingsAndState() {
        try {
            // Initialize state manager
            await this.stateManager.initialize();
            
            // Check if force refresh
            const isForceRefresh = this.appSettings.detectForceRefresh();
            
            // Load settings (use default settings if force refresh)
            const settings = this.appSettings.loadSettings(isForceRefresh);
            console.log('User settings loaded:', settings);
            
            if (isForceRefresh) {
                console.log('Force refresh detected, default settings restored');
                // Clear application state via state manager
                this.stateManager.resetState();
            }
            
            // Load application state
            const state = this.stateManager.getState();
            console.log('Application state loaded:', state);
            
            // Check if first time use
            this.appState.isFirstUse = this.appSettings.isFirstUse();
            
            return { settings, state };
        } catch (error) {
            console.warn('Failed to load settings and state:', error);
            throw error;
        }
    }

    /**
     * Save user settings - unified through StateManager
     * @private
     */
    saveSettings() {
        try {
            const currentSettings = this.appSettings.getSettings();
            this.stateManager.updateState({ settings: currentSettings });
            console.log('Settings saved via state manager');
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    /**
     * Save application state - unified through StateManager
     * @private
     */
    saveAppState() {
        try {
            // State managed by StateManager - no duplicate saves
            this.stateManager.saveState();
            console.log('Application state saved via state manager');
            return true;
        } catch (error) {
            console.error('Failed to save application state:', error);
            return false;
        }
    }

    /**
     * Set up event listeners - StateManager handles state synchronization
     * @private
     */
    setupEventListeners() {
        // StateManager now handles state synchronization and saves automatically
        // No need for manual callbacks that trigger duplicate saves
        
        // UI updates are handled by StateManager subscriptions
        console.log('Event listeners set up - StateManager handles state synchronization');
    }

    /**
     * Initialize UI
     * @private
     */
    initializeUI() {
        if (!this.uiController) {
            console.error('UI controller not initialized');
            return;
        }

        // Initialize UI controller
        this.uiController.initialize();
        
        // Apply settings to UI
        const currentSettings = this.appSettings.getSettings();
        this.uiController.applySettingsToUI(currentSettings);
        
        // Set up event handlers
        this.setupUIEventHandlers();
        
        console.log('UI initialization complete');
    }



    /**
     * Set up UI event handlers
     * @private
     */
    setupUIEventHandlers() {
        console.log('Setting up UI event handlers...');
        if (!this.uiController) {
            console.error('UI controller not available for event setup');
            return;
        }

        // Simplified event handlers - let app determine the action
        this.uiController.on('waterToggle', () => {
            this.toggleReminder('water');
        });

        this.uiController.on('waterReset', () => {
            this.resetReminder('water');
        });



        this.uiController.on('standupToggle', () => {
            this.toggleReminder('standup');
        });

        this.uiController.on('standupReset', () => {
            this.resetReminder('standup');
        });





        // Interval change event
        this.uiController.on('waterIntervalChanged', (data) => {
            this.handleIntervalChange('water', data.interval);
        });

        this.uiController.on('standupIntervalChanged', (data) => {
            this.handleIntervalChange('standup', data.interval);
        });

        // Set up save event
        this.uiController.on('saveSettings', () => {
            this.handleSaveSettings();
        });

        this.uiController.on('resetSettings', () => {
            this.handleResetSettings();
        });

        this.uiController.on('forceResetSettings', () => {
            this.handleForceResetSettings();
        });
    }

    /**
     * Toggle reminder state - simplified logic
     * @param {string} type - reminder type ('water' | 'standup')
     */
    toggleReminder(type) {
        const reminder = type === 'water' ? this.waterReminder : this.standupReminder;
        if (!reminder) return;

        const status = reminder.getCurrentStatus();
        
        if (!status.isActive) {
            this.startReminder(type);
        } else if (status.isPaused) {
            this.resumeReminder(type);
        } else {
            this.pauseReminder(type);
        }
    }

    /**
     * Handle interval change
     * @param {string} type - reminder type ('water' | 'standup')
     * @param {number} interval - new interval (minutes)
     * @private
     */
    handleIntervalChange(type, interval) {
        try {
            // Update settings
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
            
            // Save settings
            this.appSettings.saveSettings(currentSettings);
            
            console.log(`${type} reminder interval updated to ${interval} minutes`);
            
        } catch (error) {
            console.error(`Failed to update ${type} interval:`, error);
        }
    }

    /**
     * Handle save settings
     * @private
     */
    handleSaveSettings() {
        try {
            const newSettings = this.uiController.getSettingsFromUI();
            
            // Validate settings
            if (!this.appSettings.validateSettings(newSettings)) {
                throw new Error('Settings validation failed');
            }
            
            // Update settings
            this.appSettings.updateSettings(newSettings);
            
            // Update reminder manager
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
            
            // Close settings panel
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
     * Handle reset settings
     * @private
     */
    handleResetSettings() {
        try {
            // Reset to default settings
            const defaultSettings = this.appSettings.resetSettings();
            
            // Apply to UI
            this.uiController.applySettingsToUI(defaultSettings);
            
            // Update reminder manager
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
     * Handle force reset settings (force restore to defaults)
     * @private
     */
    handleForceResetSettings() {
        try {
            console.log('Executing force reset settings');
            
            // Force reset to default settings
            const defaultSettings = this.appSettings.forceResetToDefaults();
            
            // Apply to UI
            this.uiController.applySettingsToUI(defaultSettings);
            
            // Stop all reminders
            if (this.waterReminder && this.waterReminder.isActive) {
                this.waterReminder.stop();
            }
            if (this.standupReminder && this.standupReminder.isActive) {
                this.standupReminder.stop();
            }
            
            // Update reminder manager settings
            if (this.waterReminder) {
                this.waterReminder.updateSettings(defaultSettings.water);
            }
            if (this.standupReminder) {
                this.standupReminder.updateSettings(defaultSettings.standup);
            }
            
            // Clear all state
            this.appSettings.resetState();
            
            // Show force reset success notification
            this.notificationService.showInPageAlert('success', {
                title: 'Force Reset Complete',
                message: 'All settings have been force reset to default values (30-minute intervals), all reminders stopped'
            });
            
            // Close settings panel
            this.uiController.hideSettings();
            
        } catch (error) {
            console.error('Force reset settings failed:', error);
            this.notificationService.showInPageAlert('error', {
                title: 'Force Reset Failed',
                message: 'Force reset settings failed, please refresh the page and try again'
            });
        }
    }



    /**
     * Restore previous session state via StateManager
     * @private
     */
    async restorePreviousState() {
        try {
            console.log('Restoring previous session state via StateManager...');
            
            const currentSettings = this.appSettings.getSettings();
            
            // Restore water reminder state via StateManager
            if (this.waterReminder && currentSettings.water.enabled) {
                const waterState = this.stateManager.getState('water');
                if (waterState?.isActive) {
                    console.log('Restoring water reminder via StateManager');
                    // StateManager handles the restoration logic
                }
            }
            
            // Restore standup reminder state via StateManager
            if (this.standupReminder && currentSettings.standup.enabled) {
                const standupState = this.stateManager.getState('standup');
                if (standupState?.isActive) {
                    console.log('Restoring standup reminder via StateManager');
                    // StateManager handles the restoration logic
                }
            }
            
            console.log('Session state restoration complete via StateManager');
            return true;
        } catch (error) {
            console.error('Session state restoration failed:', error);
            return false;
        }
    }
    
    /**
     * Show first use guide - HACKATHON version: simplified or removed guide
     * @private
     */
    showFirstUseGuide() {
        try {
            console.log('HACKATHON mode: skipping first use guide');
            
            // HACKATHON suggestion: mark as used directly, no guide shown
            this.appSettings.markFirstUseComplete();
            
            // Optional: show a simple welcome banner instead of popup
            this.showWelcomeToast();
            
        } catch (error) {
            console.error('Failed to show first use guide:', error);
        }
    }

    /**
     * Show simple welcome toast
     * @private
     */
    showWelcomeToast() {
        try {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2c3e50;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 14px;
                max-width: 300px;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
            `;
            
            toast.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>💡</span>
                    <span>Set intervals and click Start to begin</span>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Animate display
            setTimeout(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            }, 100);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(-20px)';
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
            
        } catch (error) {
            console.warn('Failed to display welcome banner:', error);
        }
    }
    


    /**
     * Get error message
     * @param {Error} error - error object
     * @returns {string} user-friendly error message
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
     * Show fallback error message
     * @param {string} message - error message
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
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * Request notification permission
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
                // Show permission request prompt
                if (this.uiController && typeof this.uiController.showPermissionPrompt === 'function') {
                    this.uiController.showPermissionPrompt(
                        async () => {
                            // User clicked allow
                            const granted = await this.notificationService.requestPermission();
                            if (granted) {
                                console.log('Notification permission granted');
                            } else {
                                console.log('User denied notification permission');
                            }
                        },
                        () => {
                            // User clicked deny
                            console.log('User chose not to enable notifications');
                            const settings = this.appSettings.getSettings();
                            settings.notifications.browserNotifications = false;
                            this.appSettings.saveSettings(settings);
                        }
                    );
                }
            }
        } catch (error) {
            console.warn('Failed to request notification permission:', error);
        }
    }

    /**
     * Handle initialization errors
     * @param {Error} error
     * @private
     */
    handleInitializationError(error) {
        console.error('Application initialization error:', error);
        
        // Display user-friendly error message
        const errorMessage = this.getErrorMessage(error);
        this.showFallbackError(errorMessage);
        
        // Attempt basic functionality recovery
        try {
            // Ensure UI can at least display
            if (!this.uiController && typeof UIController !== 'undefined') {
                try {
                    this.uiController = new UIController();
                    this.uiController.initialize();
                    console.log('UI controller recovered successfully');
                } catch (uiError) {
                    console.warn('Failed to recover UI controller:', uiError);
                }
            }
            
            // Display error state
            if (this.uiController && typeof this.uiController.updateAppStatusSummary === 'function') {
                this.uiController.updateAppStatusSummary(false);
            }
            
        } catch (recoveryError) {
            console.error('Failed to recover from initialization error:', recoveryError);
            this.showFallbackError('Application failed to start. Please refresh the page.');
        }
    }
    
    /**
     * Get user-friendly error message
     * @param {Error} error - error object
     * @returns {string} user-friendly error message
     */
    getErrorMessage(error) {
        if (!error) return 'Unknown error occurred';
        
        const message = error.message || error.toString();
        
        // Return friendly message based on error type
        if (message.includes('Missing required classes')) {
            return 'Application component loading failed, please refresh the page to retry';
        } else if (message.includes('localStorage')) {
            return 'Browser storage unavailable, some features may be limited';
        } else if (message.includes('Notification')) {
            return 'Notification initialization failed, will use in-page alerts';
        } else if (message.includes('UIController')) {
            return 'User interface initialization failed, please refresh the page';
        } else {
            return `Application startup encountered an issue: ${message}`;
        }
    }
    
    /**
     * Display fallback error message
     * @param {string} message - error message
     */
    showFallbackError(message) {
        // Attempt to display error on page
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
                <div style="font-weight: bold; margin-bottom: 8px;">Application startup failed</div>
                <div style="font-size: 14px; margin-bottom: 12px;">${message}</div>
                <button onclick="location.reload()" style="
                    background: white;
                    color: #e74c3c;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">Refresh page</button>
            `;
            
            document.body.appendChild(errorDiv);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 10000);
            
        } catch (displayError) {
            console.error('Failed to display error message:', displayError);
            // Final fallback solution
            alert(message + '\n\nPlease refresh the page to retry.');
        }
    }

    /**
     * Start reminder
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
                
                // Save application state
                this.saveAppState();
                console.log('Water reminder started successfully');
                
                // Manually trigger state update to ensure UI synchronization
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
                
                // Save application state
                this.saveAppState();
                console.log('Standup reminder started successfully');
                
                // Manually trigger state update to ensure UI synchronization
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
     * Stop reminder
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
                
                // Save application state
                this.saveAppState();
                console.log('Water reminder stopped successfully');
                
                // Manually trigger state update to ensure UI synchronization
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
                
                // Save application state
                this.saveAppState();
                console.log('Standup reminder stopped successfully');
                
                // Manually trigger state update to ensure UI synchronization
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

    /**
     * Pause reminder
     * @param {string} type - 'water' | 'standup'
     */
    pauseReminder(type) {
        try {
            console.log(`GitHub Pages Debug - pauseReminder called for ${type}`);
            if (type === 'water' && this.waterReminder) {
                console.log('Pausing water reminder...');
                console.log('Water reminder status before pause:', this.waterReminder.getCurrentStatus());
                this.waterReminder.pause();
                console.log('Water reminder status after pause:', this.waterReminder.getCurrentStatus());
                
                // Save application state
                this.saveAppState();
                console.log('Water reminder paused successfully');
                
            } else if (type === 'standup' && this.standupReminder) {
                console.log('GitHub Pages Debug - Pausing standup reminder...');
                console.log('Standup reminder status before pause:', this.standupReminder.getCurrentStatus());
                this.standupReminder.pause();
                console.log('Standup reminder status after pause:', this.standupReminder.getCurrentStatus());
                
                // Save application state
                this.saveAppState();
                console.log('GitHub Pages Debug - Standup reminder paused successfully');
            } else {
                console.warn(`Cannot pause ${type} reminder: reminder not initialized`);
                console.warn(`GitHub Pages Debug - Reminder availability: water=${!!this.waterReminder}, standup=${!!this.standupReminder}`);
            }
        } catch (error) {
            console.error(`Failed to pause ${type} reminder:`, error);
        }
    }

    /**
     * Resume reminder
     * @param {string} type - 'water' | 'standup'
     */
    resumeReminder(type) {
        try {
            console.log(`GitHub Pages Debug - resumeReminder called for ${type}`);
            if (type === 'water' && this.waterReminder) {
                console.log('Resuming water reminder...');
                this.waterReminder.resume();
                
                // Save application state
                this.saveAppState();
                console.log('Water reminder resumed successfully');
                
            } else if (type === 'standup' && this.standupReminder) {
                console.log('GitHub Pages Debug - Resuming standup reminder...');
                this.standupReminder.resume();
                
                // Save application state
                this.saveAppState();
                console.log('GitHub Pages Debug - Standup reminder resumed successfully');
            } else {
                console.warn(`Cannot resume ${type} reminder: reminder not initialized`);
                console.warn(`GitHub Pages Debug - Reminder availability: water=${!!this.waterReminder}, standup=${!!this.standupReminder}`);
            }
        } catch (error) {
            console.error(`Failed to resume ${type} reminder:`, error);
        }
    }

    /**
     * Reset reminder
     * @param {string} type - 'water' | 'standup'
     */
    resetReminder(type) {
        if (type === 'water' && this.waterReminder) {
            console.log('Resetting water reminder...');
            this.waterReminder.reset();
            
            // Save application state
            this.saveAppState();
            console.log('Water reminder reset successfully');
            
            // Manually trigger state update to ensure UI synchronization
            if (this.uiController) {
                const status = this.waterReminder.getCurrentStatus();
                console.log('Manual status update for water:', status);
                this.uiController.updateReminderStatus('water', status);
            }
        } else if (type === 'standup' && this.standupReminder) {
            console.log('Resetting standup reminder...');
            this.standupReminder.reset();
            
            // Save application state
            this.saveAppState();
            console.log('Standup reminder reset successfully');
            
            // Manually trigger state update to ensure UI synchronization
            if (this.uiController) {
                const status = this.standupReminder.getCurrentStatus();
                console.log('Manual status update for standup:', status);
                this.uiController.updateReminderStatus('standup', status);
            }
        }
    }

    /**
     * Update settings
     * @param {Object} newSettings
     */
    updateSettings(newSettings) {
        try {
            // Update settings
            const updatedSettings = this.appSettings.updateSettings(newSettings);
            
            // Update reminder manager settings
            if (newSettings.water && this.waterReminder) {
                this.waterReminder.updateSettings(newSettings.water);
            }
            
            if (newSettings.standup && this.standupReminder) {
                this.standupReminder.updateSettings(newSettings.standup);
            }
            
            // Update UI
            if (this.uiController) {
                this.uiController.updateSettings(updatedSettings);
            }
            
            // Save application state
            this.saveAppState();
            
            console.log('Settings updated:', updatedSettings);
            return updatedSettings;
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    }

    /**
     * Get current application state
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

// Global application instance


// Initialize application after DOM loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = new OfficeWellnessApp();
        window.app = app; // Ensure global accessibility
        await app.initialize();
    } catch (error) {
        console.error('Application startup failed:', error);
        
        // If app initialization fails, set up basic button functionality
        setupFallbackButtons();
        
        // Display error message to user
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
        
        // Auto-hide error message after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
});

// Listen for force refresh shortcuts
document.addEventListener('keydown', (event) => {
    // Detect Ctrl+F5 or Ctrl+Shift+R (force refresh)
    if ((event.ctrlKey && event.key === 'F5') || 
        (event.ctrlKey && event.shiftKey && event.key === 'R')) {
        console.log('Detected force refresh shortcut');
        // Set force refresh flag
        if (app && app.appSettings) {
            app.appSettings.setForceRefreshFlag();
        } else {
            // If app not yet initialized, set sessionStorage directly
            try {
                sessionStorage.setItem('forceRefreshFlag', 'true');
            } catch (error) {
                console.warn('Failed to set force refresh flag:', error);
            }
        }
    }
});

// Save state before page unload
window.addEventListener('beforeunload', () => {
    if (app && app.isInitialized) {
        // Save settings and application state
        app.saveSettings();
        app.saveAppState();
    }
});

// Save state on page visibility change
document.addEventListener('visibilitychange', () => {
    if (app && app.isInitialized) {
        if (document.visibilityState === 'hidden') {
            // Save state when page hidden
            app.saveAppState();
        } else if (document.visibilityState === 'visible') {
            // Check state when page visible
            // Additional recovery logic can be added here if needed
        }
    }
});

// Export for other scripts to use
window.OfficeWellnessApp = OfficeWellnessApp;

// Fallback button functionality - used when main app initialization fails
function setupFallbackButtons() {
    console.log('Setting up fallback button handlers...');
    
    // State tracking
    let waterActive = false;
    let standupActive = false;
    
    // Function to update application status indicator
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
    
    // Water reminder button
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
    
    // Posture reminder button
    const standupToggle = document.getElementById('standup-toggle');
    if (standupToggle) {
        standupToggle.addEventListener('click', () => {
            console.log('Standup toggle clicked (fallback)');
            const isStart = standupToggle.textContent.trim() === 'Start';
            
            // Try to call main app methods
            if (window.app && window.app.startReminder && window.app.pauseReminder) {
                if (isStart) {
                    window.app.startReminder('standup');
                } else {
                    window.app.pauseReminder('standup');
                }
            } else {
                // Fallback logic: manually update UI
                if (isStart) {
                    standupToggle.textContent = 'Pause';
                    standupToggle.className = 'btn-secondary';
                    standupActive = true;
                    // Update status label
                    const statusBadge = document.getElementById('standup-status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = 'Active';
                        statusBadge.classList.add('active');
                        statusBadge.classList.remove('inactive');
                    }
                    showSimpleNotification('🧘 Standup reminder started!');
                } else {
                    standupToggle.textContent = 'Start';
                    standupToggle.className = 'btn-primary';
                    standupActive = false;
                    // Update status label
                    const statusBadge = document.getElementById('standup-status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = 'Inactive';
                        statusBadge.classList.remove('active');
                        statusBadge.classList.add('inactive');
                    }
                    showSimpleNotification('🧘 Standup reminder paused!');
                }
                
                updateAppStatus();
            }
        });
        console.log('Standup toggle fallback handler added');
    }
    

}

// Application initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Starting application initialization...');
        
        // Create app instance
        const app = new OfficeWellnessApp();
        
        // Initialize application
        await app.initialize();
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
});

// Export class for other modules to use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OfficeWellnessApp;
}