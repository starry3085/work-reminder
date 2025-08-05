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
        this.stateManager = null;
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
            
            // Initialize state manager
            await this.initializeStateManager();
            
            // Initialize UI and reminders
            await this.initializeUI();
            await this.initializeReminders();
            
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
     * Initialize StateManager with proper configuration
     * @private
     */
    async initializeStateManager() {
        try {
            // Initialize storage manager first
            const storageManager = new StorageManager();
            
            // Initialize state manager with storage dependency
            this.stateManager = new StateManager(storageManager);
            
            // Wait for StateManager to be ready
            await this.stateManager.initialize();
            
            console.log('📊 StateManager initialized');
        } catch (error) {
            throw new Error(`StateManager initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize UI Controller with StateManager dependency
     * @private
     */
    async initializeUI() {
        try {
            this.uiController = new UIController(this.stateManager, {
                updateInterval: 1000,
                mobileBreakpoint: 768
            });
            
            console.log('🎨 UI Controller initialized');
        } catch (error) {
            throw new Error(`UI Controller initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize reminder managers with consistent dependency injection
     * @private
     */
    async initializeReminders() {
        try {
            // Initialize notification service first
            const notificationService = new NotificationService();
            
            // Water Reminder
            this.waterReminder = new WaterReminder('water', {
                interval: 30,
                enabled: true,
                sound: true
            }, notificationService, this.stateManager);

            // Standup Reminder
            this.standupReminder = new StandupReminder('standup', {
                interval: 45,
                enabled: true,
                sound: true
            }, notificationService, this.stateManager);

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
     * Setup automatic state saving
     * @private
     */
    setupAutoSave() {
        if (this.config.autoSaveInterval > 0) {
            this.autoSaveInterval = setInterval(() => {
                if (this.stateManager && !this.isShuttingDown) {
                    this.stateManager.saveState();
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
            
            // Save final state
            if (this.stateManager) {
                this.stateManager.saveState();
            }
            
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
            
            // Save state before backgrounding
            if (this.stateManager) {
                this.stateManager.saveState();
            }
            
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
            
            // Resume timers when app returns to foreground
            if (this.waterReminder) this.waterReminder.resume();
            if (this.standupReminder) this.standupReminder.resume();
            
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
            const waterState = this.stateManager?.getState('water');
            const standupState = this.stateManager?.getState('standup');
            
            const waterActive = waterState?.isActive || false;
            const standupActive = standupState?.isActive || false;
            
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
                water: this.stateManager?.getState('water'),
                standup: this.stateManager?.getState('standup'),
                settings: this.stateManager?.getState('app')?.settings,
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
                this.uiController,
                this.stateManager
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