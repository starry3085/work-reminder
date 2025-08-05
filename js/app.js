/**
 * Office Wellness App - Main application orchestrator
 * Coordinates all components with unified StateManager dependency injection
 * 
 * Architecture:
 * - Centralized state management with StateManager
 * - Consistent dependency injection pattern
 * - Graceful error handling and recovery
 * - Automatic cleanup and resource management
 */
class OfficeWellnessApp {
    /**
     * Create application instance
     * @param {Object} config - Application configuration
     */
    constructor(config = {}) {
        this.config = {
            enableLogging: true,
            autoSaveInterval: 5000,
            maxRetries: 3,
            ...config
        };

        // Core components
        this.uiController = null;
        this.waterReminder = null;
        this.standupReminder = null;
        this.errorHandler = null;

        // Application state
        this.isInitialized = false;
        this.isShuttingDown = false;
        this.retryCount = 0;

        // Cleanup tracking
        this.cleanupCallbacks = [];
        this.autoSaveInterval = null;

        // Bind methods for event handling
        this.handleAppError = this.handleAppError.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);

        this.init();
    }

    /**
     * Public initialize method for external calls
     * @public
     */
    async initialize() {
        return this.init();
    }

    /**
     * Initialize application with proper error handling
     * @private
     */
    async init() {
        try {
            console.log('🚀 Initializing Office Wellness App...');
            
            // Initialize error handler first
            this.initializeErrorHandler();
            
            // Initialize storage (simple persistence)
            await this.initializeStorage();
            
            // Initialize UI and reminders
            await this.initializeUI();
            await this.initializeReminders();
            
            // Connect UI with reminders
            this.uiController.setReminders(this.waterReminder, this.standupReminder);
            
            // Setup application lifecycle
            this.setupLifecycleManagement();
            
            this.isInitialized = true;
            console.log('✅ Office Wellness App initialized successfully');
            
            // Update UI with initial state
            this.updateAppStatus();
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize error handler with global error capture
     * @private
     */
    initializeErrorHandler() {
        try {
            this.errorHandler = new ErrorHandler({
                onError: this.handleAppError,
                enableRecovery: true,
                logLevel: this.config.enableLogging ? 'debug' : 'error'
            });
            
            // Register global error handlers
            window.addEventListener('error', this.errorHandler.handleGlobalError);
            window.addEventListener('unhandledrejection', this.errorHandler.handleUnhandledRejection);
            
            console.log('🔧 Error handler initialized');
        } catch (error) {
            console.warn('⚠️ Failed to initialize error handler:', error);
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
            const savedSettings = this.storage?.loadSettings() || {};
            
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
     * Setup application lifecycle management
     * @private
     */
    setupLifecycleManagement() {
        try {
            // Before unload handler
            window.addEventListener('beforeunload', this.handleBeforeUnload);
            
            // Visibility change handler for tab switching
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.handleAppBackground();
                } else {
                    this.handleAppForeground();
                }
            });
            
            // Page show/hide handlers for mobile
            window.addEventListener('pageshow', this.handleAppForeground);
            window.addEventListener('pagehide', this.handleAppBackground);
            
            // Setup auto-save
            this.setupAutoSave();
            
            console.log('🔄 Lifecycle management setup complete');
        } catch (error) {
            console.warn('⚠️ Lifecycle setup warning:', error);
        }
    }

    /**
     * Setup automatic settings saving
     * @private
     */
    setupAutoSave() {
        if (this.config.autoSaveInterval > 0 && this.storage) {
            this.autoSaveInterval = setInterval(() => {
                if (!this.isShuttingDown) {
                    this.saveSettings();
                }
            }, this.config.autoSaveInterval);
            
            this.cleanupCallbacks.push(() => {
                if (this.autoSaveInterval) {
                    clearInterval(this.autoSaveInterval);
                    this.autoSaveInterval = null;
                }
            });
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
                water: {
                    interval: this.waterReminder?.settings?.interval || 30,
                    enabled: this.waterReminder?.settings?.enabled !== false,
                    sound: this.waterReminder?.settings?.sound !== false
                },
                standup: {
                    interval: this.standupReminder?.settings?.interval || 45,
                    enabled: this.standupReminder?.settings?.enabled !== false,
                    sound: this.standupReminder?.settings?.sound !== false
                }
            };
            
            this.storage.saveSettings(settings);
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
            
            // Save current state before recovery
            if (this.stateManager) {
                await this.stateManager.saveState();
            }
            
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

    /**
     * Handle initialization errors
     * @param {Error} error - Initialization error
     * @private
     */
    handleInitializationError(error) {
        console.error('🚨 Application initialization failed:', error);
        
        // Show user-friendly error
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                <h2>Office Wellness App</h2>
                <p style="color: #e74c3c;">Failed to start the application</p>
                <p>${error.message}</p>
                <button onclick="location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }

    /**
     * Handle before unload event
     * @param {Event} event - Before unload event
     * @private
     */
    handleBeforeUnload(event) {
        if (this.isShuttingDown) return;
        
        try {
            this.isShuttingDown = true;
            
            // Save final settings
            this.saveSettings();
            
            // Perform cleanup
            this.cleanup();
            
            console.log('🛑 Application shutdown complete');
        } catch (error) {
            console.error('Error during shutdown:', error);
        }
    }

    /**
     * Handle app background state
     * @private
     */
    handleAppBackground() {
        try {
            console.log('📱 App entering background');
            
            // Pause timers when app is in background
            if (this.waterReminder) this.waterReminder.pause();
            if (this.standupReminder) this.standupReminder.pause();
            
            // Save settings before backgrounding
            this.saveSettings();
            
        } catch (error) {
            console.error('Error handling app background:', error);
        }
    }

    /**
     * Handle app foreground state
     * @private
     */
    handleAppForeground() {
        try {
            console.log('📱 App entering foreground');
            
            // Refresh UI state
            this.updateAppStatus();
            
        } catch (error) {
            console.error('Error handling app foreground:', error);
        }
    }

    /**
     * Update application status display
     * @private
     */
    updateAppStatus() {
        try {
            const waterActive = this.waterReminder?.isActive || false;
            const standupActive = this.standupReminder?.isActive || false;
            
            console.log(`📊 App Status - Water: ${waterActive}, Standup: ${standupActive}`);
            
        } catch (error) {
            console.error('Error updating app status:', error);
        }
    }

    /**
     * Get application state
     * @returns {Object} Current application state
     * @public
     */
    getAppState() {
        try {
            return {
                water: {
                    isActive: this.waterReminder?.isActive || false,
                    settings: this.waterReminder?.settings || {}
                },
                standup: {
                    isActive: this.standupReminder?.isActive || false,
                    settings: this.standupReminder?.settings || {}
                },
                storage: {
                    available: this.storage?.isAvailable?.() || false,
                    type: this.storage?.getStorageType?.() || 'none'
                },
                isInitialized: this.isInitialized,
                isShuttingDown: this.isShuttingDown
            };
        } catch (error) {
            console.error('Error getting app state:', error);
            return null;
        }
    }

    /**
     * Clean up all resources
     * @public
     */
    async cleanup() {
        try {
            console.log('🧹 Starting application cleanup...');
            
            // Stop auto-save
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            
            // Cleanup components in reverse order
            const components = [
                this.waterReminder,
                this.standupReminder,
                this.uiController
            ];
            
            for (const component of components) {
                if (component && typeof component.destroy === 'function') {
                    try {
                        await component.destroy();
                    } catch (error) {
                        console.warn('Error during component cleanup:', error);
                    }
                }
            }
            
            // Execute custom cleanup callbacks
            for (const callback of this.cleanupCallbacks) {
                try {
                    await callback();
                } catch (error) {
                    console.warn('Error during custom cleanup:', error);
                }
            }
            
            // Remove global event listeners
            window.removeEventListener('beforeunload', this.handleBeforeUnload);
            document.removeEventListener('visibilitychange', this.handleAppBackground);
            
            // Reset state
            this.isInitialized = false;
            this.isShuttingDown = false;
            
            console.log('✅ Application cleanup complete');
            
        } catch (error) {
            console.error('Error during application cleanup:', error);
        }
    }

    /**
     * Restart application
     * @public
     */
    async restart() {
        console.log('🔄 Restarting application...');
        
        try {
            await this.cleanup();
            await this.init();
            console.log('✅ Application restarted successfully');
        } catch (error) {
            console.error('Error restarting application:', error);
            this.handleInitializationError(error);
        }
    }
}

// Global app instance for debugging
window.OfficeWellnessApp = OfficeWellnessApp;