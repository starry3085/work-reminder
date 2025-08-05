/**
 * Office Wellness App - Simple reminder application
 * Basic water and standup reminders for office workers
 */
class OfficeWellnessApp {
    constructor() {
        this.uiController = null;
        this.waterReminder = null;
        this.standupReminder = null;
        this.errorHandler = null;
        this.storage = null;
        
        this.init();
    }

    /**
     * Public initialize method for external calls
     * @public
     */
    async initialize() {
        return this.init();
    }

    async init() {
        try {
            this.initializeErrorHandler();
            await this.initializeStorage();
            await this.initializeUI();
            await this.initializeReminders();
            this.uiController.setReminders(this.waterReminder, this.standupReminder);
            console.log('Office Wellness App initialized');
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    initializeErrorHandler() {
        try {
            this.errorHandler = new ErrorHandler();
        } catch (error) {
            console.warn('Failed to initialize error handler:', error);
        }
    }

    /**
     * Initialize storage manager for simple persistence
     * @private
     */
    async initializeStorage() {
        try {
            this.storage = new StorageManager();
            console.log('💾 Storage manager initialized');
        } catch (error) {
            console.warn('⚠️ Storage initialization failed, using defaults:', error);
            this.storage = null;
        }
    }

    /**
     * Initialize UI Controller without StateManager dependency
     * @private
     */
    async initializeUI() {
        try {
            this.uiController = new UIController({
                updateInterval: 1000,
                mobileBreakpoint: 768
            });
            
            console.log('🎨 UI Controller initialized');
        } catch (error) {
            throw new Error(`UI Controller initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize reminder managers with simplified initialization
     * @private
     */
    async initializeReminders() {
        try {
            // Initialize notification service first
            const notificationService = new NotificationService();
            
            // Load saved settings from storage
            const savedSettings = this.storage?.getItem('appSettings') || {};
            
            // Water Reminder
            this.waterReminder = new WaterReminder('water', {
                interval: 30,
                enabled: true,
                sound: true,
                ...savedSettings.water
            }, notificationService);

            // Standup Reminder
            this.standupReminder = new StandupReminder('standup', {
                interval: 45,
                enabled: true,
                sound: true,
                ...savedSettings.standup
            }, notificationService);

            console.log('⏰ Reminder managers initialized');
        } catch (error) {
            throw new Error(`Reminder initialization failed: ${error.message}`);
        }
    }



    /**
     * Save current settings to storage
     * @private
     */
    saveSettings() {
        if (!this.storage) return;
        
        try {
            const settings = {
                water: this.waterReminder?.settings || {},
                standup: this.standupReminder?.settings || {}
            };
            
            this.storage.setItem('appSettings', settings);
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    /**
     * Handle application errors with recovery
     * @param {Error} error - Error object
     * @param {string} context - Error context
     * @private
     */
    handleAppError(error, context = 'Application') {
        console.error(`❌ ${context} Error:`, error);
        
        if (this.retryCount < this.config.maxRetries) {
            this.retryCount++;
            console.log(`🔄 Attempting recovery (attempt ${this.retryCount}/${this.config.maxRetries})`);
            
            setTimeout(() => {
                this.attemptRecovery();
            }, 1000 * this.retryCount);
        } else {
            console.error('❌ Max retries exceeded, showing error to user');
            this.showErrorToUser(error);
        }
    }

    /**
     * Attempt application recovery
     * @private
     */
    async attemptRecovery() {
        try {
            console.log('🔄 Starting recovery process...');
            
            // Reinitialize components
            await this.cleanup();
            await this.init();
            
            this.retryCount = 0;
            console.log('✅ Recovery successful');
            
        } catch (recoveryError) {
            console.error('❌ Recovery failed:', recoveryError);
            this.showErrorToUser(recoveryError);
        }
    }

    /**
     * Show error to user in a user-friendly way
     * @param {Error} error - Error object
     * @private
     */
    showErrorToUser(error) {
        try {
            const errorMessage = error.message || 'An unexpected error occurred';
            
            if (this.uiController) {
                // Use UI to show error (simplified notification)
                console.error('Application Error:', errorMessage);
                alert(`Office Wellness App Error:\n${errorMessage}\n\nPlease refresh the page to continue.`);
            } else {
                // Fallback to basic alert
                alert(`Office Wellness App Error:\n${errorMessage}`);
            }
        } catch (uiError) {
            console.error('Failed to show error to user:', uiError);
        }
    }


}

// Global app instance for debugging
window.OfficeWellnessApp = OfficeWellnessApp;