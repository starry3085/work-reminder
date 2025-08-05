/**
 * Reminder Manager - Base class for reminder functionality
 * Handles timer management, state synchronization, and error recovery
 * 
 * Architecture:
 * - Unified time handling (milliseconds internally, minutes in UI)
 * - Atomic state updates with anti-circulation protection
 * - Timer synchronization with StateManager
 * - Comprehensive error handling and recovery
 */
class ReminderManager {
    /**
     * Create reminder manager instance
     * @param {string} type - Reminder type ('water' or 'standup')
     * @param {Object} settings - Initial settings
     * @param {NotificationService} notificationService - Notification service
     * @param {StateManager} stateManager - State manager
     */
    constructor(type, settings, notificationService, stateManager) {
        if (!type || !['water', 'standup'].includes(type)) {
            throw new Error('Invalid reminder type');
        }

        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        this.stateManager = stateManager;
        
        // Timer management
        this.timerId = null;
        this.updateTimerId = null;
        this.updateInterval = 1000; // 1 second update frequency
        
        // State synchronization
        this.isUpdatingFromState = false; // Atomic flag for state sync
        this.unsubscribe = null; // State subscription cleanup
        
        // Time tracking (all in milliseconds)
        this.startTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
        this.isActive = false;
        
        // Error recovery
        this.lastSyncTime = 0;
        this.syncRetryCount = 0;
        this.maxSyncRetries = 3;
        
        // Initialize from StateManager
        this.initializeFromState();
        
        console.log(`${type} reminder manager created with StateManager integration`);
    }

    /**
     * Initialize from StateManager state
     * @private
     */
    initializeFromState() {
        if (!this.stateManager) return;
        
        try {
            const state = this.stateManager.getState(this.type);
            if (state) {
                this.syncWithState(state, true); // Silent sync during init
                this.subscribeToStateManager();
            }
        } catch (error) {
            console.error(`Failed to initialize ${this.type} from state:`, error);
        }
    }

    /**
     * Subscribe to StateManager changes
     * @private
     */
    subscribeToStateManager() {
        if (!this.stateManager) return;
        
        try {
            this.unsubscribe = this.stateManager.subscribe(this.type, (state) => {
                // Prevent self-triggered updates
                if (this.isUpdatingFromState) {
                    return;
                }
                
                // Throttle updates to prevent rapid state changes
                const now = Date.now();
                if (now - this.lastSyncTime < 100) {
                    return;
                }
                
                this.syncWithState(state);
            });
            
            console.log(`${this.type} reminder subscribed to StateManager with throttling`);
        } catch (error) {
            console.error(`Failed to subscribe ${this.type} to StateManager:`, error);
        }
    }

    /**
     * Sync state from StateManager (single source of truth)
     * @param {Object} state - State from StateManager
     * @param {boolean} silent - Don't update StateManager
     */
    syncWithState(state, silent = false) {
        if (!state) return;
        
        try {
            // Atomic operation flag
            this.isUpdatingFromState = true;
            this.lastSyncTime = Date.now();
            
            // Store previous state for comparison
            const wasActive = this.isActive;
            const prevInterval = this.settings.interval;
            
            // Update from authoritative state
            this.isActive = Boolean(state.isActive);
            this.settings = { ...this.settings, ...state.settings };
            
            // Handle time units - StateManager uses milliseconds for timeRemaining
            this.timeRemaining = Math.max(0, state.timeRemaining || 0);
            this.nextReminderTime = state.nextReminderAt || 0;
            
            // Validate interval units
            if (typeof this.settings.interval === 'string') {
                this.settings.interval = parseInt(this.settings.interval, 10);
            }
            
            // Sync timer state
            this.syncTimers(wasActive, prevInterval);
            
            console.log(`${this.type} reminder synced with StateManager:`, {
                isActive: this.isActive,
                timeRemaining: this.timeRemaining,
                interval: this.settings.interval,
                nextReminderTime: this.nextReminderTime
            });
            
            // Reset retry count on successful sync
            this.syncRetryCount = 0;
            
        } catch (error) {
            console.error(`Failed to sync ${this.type} reminder state:`, error);
            
            // Error recovery
            this.handleSyncError(error);
            
        } finally {
            this.isUpdatingFromState = false;
        }
    }

    /**
     * Handle sync errors with retry mechanism
     * @private
     */
    handleSyncError(error) {
        if (this.syncRetryCount < this.maxSyncRetries) {
            this.syncRetryCount++;
            console.warn(`Retrying state sync for ${this.type} (attempt ${this.syncRetryCount})`);
            
            setTimeout(() => {
                try {
                    const state = this.stateManager.getState(this.type);
                    this.syncWithState(state);
                } catch (retryError) {
                    console.error(`Retry failed for ${this.type} state sync:`, retryError);
                }
            }, 100 * this.syncRetryCount);
        }
    }

    /**
     * Sync timer state based on authoritative state
     * @param {boolean} wasActive - Previous active state
     * @param {number} prevInterval - Previous interval setting
     * @private
     */
    syncTimers(wasActive, prevInterval) {
        try {
            this.clearTimer();
            this.clearUpdateTimer();
            
            if (this.isActive) {
                // Handle interval changes
                if (prevInterval !== this.settings.interval) {
                    const intervalMs = this.settings.interval * 60 * 1000;
                    this.timeRemaining = intervalMs;
                    this.nextReminderTime = Date.now() + intervalMs;
                    
                    // Update StateManager with new calculation
                    this.updateState({
                        timeRemaining: this.timeRemaining,
                        nextReminderAt: this.nextReminderTime
                    });
                }
                
                // Validate time remaining
                if (this.timeRemaining <= 0) {
                    const intervalMs = this.settings.interval * 60 * 1000;
                    this.timeRemaining = intervalMs;
                    this.nextReminderTime = Date.now() + intervalMs;
                }
                
                this.startTime = Date.now();
                this.startTimer();
                this.startUpdateTimer();
                
                console.log(`${this.type} reminder timers synced:`, {
                    interval: this.settings.interval,
                    timeRemaining: this.timeRemaining,
                    nextReminderTime: this.nextReminderTime
                });
            } else if (wasActive && !this.isActive) {
                // Clean shutdown
                this.resetState();
                this.updateState({
                    timeRemaining: 0,
                    nextReminderAt: 0
                });
            }
            
        } catch (error) {
            console.error(`Error syncing ${this.type} timers:`, error);
        }
    }

    /**
     * Start reminder timer
     */
    start() {
        if (!this.settings.enabled) {
            console.warn(`${this.type} reminder not started - disabled in settings`);
            return false;
        }
        
        try {
            const intervalMs = this.settings.interval * 60 * 1000;
            this.startTime = Date.now();
            this.nextReminderTime = this.startTime + intervalMs;
            this.timeRemaining = intervalMs;
            this.isActive = true;
            
            this.startTimer();
            this.startUpdateTimer();
            
            // Update StateManager atomically
            this.updateState({
                isActive: true,
                timeRemaining: this.timeRemaining,
                nextReminderAt: this.nextReminderTime
            });
            
            console.log(`${this.type} reminder started:`, {
                interval: this.settings.interval,
                timeRemaining: this.timeRemaining,
                nextReminderTime: this.nextReminderTime
            });
            
            return true;
            
        } catch (error) {
            console.error(`Failed to start ${this.type} reminder:`, error);
            return false;
        }
    }

    /**
     * Stop reminder timer
     */
    stop() {
        try {
            this.clearTimer();
            this.clearUpdateTimer();
            
            this.isActive = false;
            this.resetState();
            
            // Update StateManager atomically
            this.updateState({
                isActive: false,
                timeRemaining: 0,
                nextReminderAt: 0
            });
            
            console.log(`${this.type} reminder stopped`);
            return true;
            
        } catch (error) {
            console.error(`Failed to stop ${this.type} reminder:`, error);
            return false;
        }
    }

    /**
     * Start main timer
     * @private
     */
    startTimer() {
        if (!this.isActive || this.timerId) return;
        
        this.timerId = setTimeout(() => {
            this.timerId = null;
            if (this.isActive) {
                this.triggerReminder();
            }
        }, this.timeRemaining);
    }

    /**
     * Start update timer for UI refresh
     * @private
     */
    startUpdateTimer() {
        if (!this.isActive || this.updateTimerId) return;
        
        this.updateTimerId = setInterval(() => {
            if (!this.isActive) {
                this.clearUpdateTimer();
                return;
            }
            
            this.updateTimeRemaining();
        }, this.updateInterval);
    }

    /**
     * Update time remaining
     * @private
     */
    updateTimeRemaining() {
        if (!this.isActive || !this.startTime) {
            this.timeRemaining = 0;
            return;
        }
        
        const now = Date.now();
        this.timeRemaining = Math.max(0, this.nextReminderTime - now);
        
        // Update state with throttling
        if (now - this.lastSyncTime > 1000) {
            this.updateState({
                timeRemaining: this.timeRemaining,
                nextReminderAt: this.nextReminderTime
            });
        }
    }

    /**
     * Clear main timer
     * @private
     */
    clearTimer() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    /**
     * Clear update timer
     * @private
     */
    clearUpdateTimer() {
        if (this.updateTimerId) {
            clearInterval(this.updateTimerId);
            this.updateTimerId = null;
        }
    }

    /**
     * Trigger reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = this.type === 'water' ? '💧 Time to Hydrate!' : '🧘 Time to Stand Up!';
        const message = this.type === 'water' 
            ? 'Long work sessions can lead to dehydration, remember to drink water!' 
            : 'Sitting too long is bad for your health, get up and move around!';
        
        // Show notification
        this.notificationService.showNotification(
            this.type,
            title,
            message,
            () => this.acknowledge(),
            () => this.snooze()
        );
        
        // Auto-restart mechanism
        setTimeout(() => {
            if (this.isActive) {
                this.resetAndRestart();
            }
        }, 5000);
        
        console.log(`${this.type} reminder triggered - will auto-restart`);
    }

    /**
     * Acknowledge reminder
     */
    acknowledge() {
        if (!this.isActive) return;
        
        this.resetAndRestart();
        console.log(`${this.type} reminder acknowledged`);
    }

    /**
     * Snooze reminder (delay 5 minutes)
     */
    snooze() {
        if (!this.isActive) return;
        
        const snoozeTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.timeRemaining = snoozeTime;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + snoozeTime;
        
        this.clearTimer();
        this.startTimer();
        
        this.updateState({
            isActive: true,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        });
        
        console.log(`${this.type} reminder snoozed for 5 minutes`);
    }

    /**
     * Reset and restart timer
     * @private
     */
    resetAndRestart() {
        if (!this.isActive) return;
        
        const intervalMs = this.settings.interval * 60 * 1000;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + intervalMs;
        this.timeRemaining = intervalMs;
        
        this.clearTimer();
        this.startTimer();
        
        this.updateState({
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        });
    }

    /**
     * Reset internal state
     * @private
     */
    resetState() {
        this.startTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
    }

    /**
     * Update state through StateManager (atomic operation)
     * @private
     */
    updateState(updates) {
        if (!this.stateManager || this.isUpdatingFromState) {
            return;
        }
        
        try {
            this.stateManager.updateState(this.type, updates);
        } catch (error) {
            console.error(`Failed to update ${this.type} state:`, error);
        }
    }

    /**
     * Get current status
     * @returns {Object} Current reminder status
     */
    getStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime,
            interval: this.settings.interval,
            enabled: this.settings.enabled
        };
    }

    /**
     * Destroy reminder manager with cleanup
     */
    destroy() {
        try {
            this.stop();
            
            // Cleanup state subscription
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }
            
            // Cleanup timers
            this.clearTimer();
            this.clearUpdateTimer();
            
            console.log(`${this.type} reminder manager destroyed with cleanup`);
            
        } catch (error) {
            console.error(`Error during ${this.type} reminder cleanup:`, error);
        }
    }
}

// Export for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderManager;
}

// Export for browser use
window.ReminderManager = ReminderManager;