/**
 * Reminder Manager - Core class for managing water and standup reminders
 * Responsible for timer management, status tracking, reminder triggering and persistent storage
 */
class ReminderManager {
    /**
     * Create reminder manager instance
     * @param {string} type - Reminder type ('water' | 'standup')
     * @param {Object} settings - Reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     */
    constructor(type, settings, notificationService) {
        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        
        // State management
        this.isActive = false;
        this.isPaused = false;
        this.timer = null;
        this.startTime = null;
        this.pauseTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
        
        // Callback functions
        this.statusChangeCallback = null;
        this.timeUpdateCallback = null;
        this.settingsUpdateCallback = null;
        
        // Timer update interval (1 second)
        this.updateInterval = 1000;
        this.updateTimer = null;
        
        console.log(`${this.type} reminder manager created`);
    }

    // Activity detection removed for MVP - using simpler time-based reminders

    /**
     * Start reminder
     */
    start() {
        if (this.isActive) {
            console.warn(`${this.type} reminder is already running`);
            return;
        }
        
        this.isActive = true;
        this.isPaused = false;
        this.startTime = Date.now();
        
        // Use precise millisecond calculation
        const intervalMs = Math.round(this.settings.interval * 60 * 1000);
        this.timeRemaining = intervalMs;
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Start timer
        this.startTimer();
        
        // Start time update timer
        this.startUpdateTimer();
        
        // Notify state change
        this.notifyStateChange();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'started',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder started, interval: ${this.settings.interval} minutes (${intervalMs}ms)`);
    }

    /**
     * Stop reminder
     */
    stop() {
        if (!this.isActive) {
            console.warn(`${this.type} reminder is not running`);
            return;
        }
        
        this.isActive = false;
        this.isPaused = false;
        
        // Clear timers
        this.clearTimer();
        this.clearUpdateTimer();
        
        // Reset state
        this.resetState();
        
        // Save state immediately
        this.saveState();
        
        // Notify state change
        this.notifyStateChange();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'stopped',
            isActive: false,
            isPaused: false,
            timeRemaining: 0
        });
        
        console.log(`${this.type} reminder stopped`);
    }

    /**
     * Pause reminder - simplified
     * @param {boolean} isAuto - Whether it's auto-pause (triggered by activity detection)
     */
    pause(isAuto = false) {
        if (!this.isActive || this.isPaused) {
            return;
        }
        
        this.isPaused = true;
        this.pauseTime = Date.now();
        
        // Calculate remaining time
        this.timeRemaining = Math.max(0, this.nextReminderTime - this.pauseTime);
        
        // Clear timer
        this.clearTimer();
        
        // Save state immediately
        this.saveState();
        
        // Notify state change
        this.notifyStateChange();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: isAuto ? 'auto-paused' : 'paused',
            isActive: true,
            isPaused: true,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder ${isAuto ? 'auto' : 'manually'} paused`);
    }

    /**
     * Resume reminder - simplified
     * @param {boolean} isAuto - Whether it's auto-resume (triggered by activity detection)
     */
    resume(isAuto = false) {
        if (!this.isActive || !this.isPaused) {
            return;
        }
        
        this.isPaused = false;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timer
        this.startTimer();
        
        // Save state immediately
        this.saveState();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: isAuto ? 'auto-resumed' : 'resumed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder ${isAuto ? 'auto' : 'manually'} resumed`);
    }

    /**
     * Reset reminder timer
     */
    reset() {
        const wasActive = this.isActive;
        
        if (this.isActive) {
            // Clear timers
            this.clearTimer();
            this.clearUpdateTimer();
            // Set to inactive so start() can work properly
            this.isActive = false;
            this.isPaused = false;
        }
        
        // Reset state
        this.resetState();
        
        if (wasActive) {
            // If previously active, restart
            this.start();
        } else {
            // If not active, still trigger status change to update UI
            this.triggerStatusChange({
                status: 'reset',
                isActive: false,
                isPaused: false,
                timeRemaining: 0
            });
        }
        
        console.log(`${this.type} reminder reset`);
    }

    /**
     * Acknowledge reminder (user has performed the corresponding action)
     */
    acknowledge() {
        if (!this.isActive) {
            console.warn(`${this.type} reminder is not running`);
            return;
        }
        
        // Update last reminder time
        this.settings.lastReminder = Date.now();
        
        // Notify state change
        this.notifyStateChange();
        
        // Reset and restart timer
        this.resetAndRestart();
        
        console.log(`${this.type} reminder acknowledged, timer restarted`);
    }

    /**
     * Reset and restart timer with current settings
     * @private
     */
    resetAndRestart() {
        if (!this.isActive) return;
        
        // Clear current timers
        this.clearTimer();
        this.clearUpdateTimer();
        
        // Reset state and restart
        this.startTime = Date.now();
        const intervalMs = Math.round(this.settings.interval * 60 * 1000);
        this.timeRemaining = intervalMs;
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timers
        this.startTimer();
        this.startUpdateTimer();
        
        // Notify state change
        this.notifyStateChange();
        
        // Trigger status change
        this.triggerStatusChange({
            status: 'restarted',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder reset and restarted with ${this.settings.interval}min interval`);
    }



    /**
     * Set status change callback
     * @param {Function} callback - Callback function
     */
    setStatusChangeCallback(callback) {
        this.statusChangeCallback = callback;
    }

    /**
     * Set time update callback
     * @param {Function} callback - Callback function
     */
    setTimeUpdateCallback(callback) {
        this.timeUpdateCallback = callback;
    }

    /**
     * Set settings update callback
     * @param {Function} callback - Callback function
     */
    setSettingsUpdateCallback(callback) {
        this.settingsUpdateCallback = callback;
    }

    /**
     * Update settings dynamically
     * @param {Object} newSettings - New settings object
     */
    updateSettings(newSettings) {
        const wasActive = this.isActive;
        const oldInterval = this.settings.interval;
        
        // Update settings
        this.settings = { ...this.settings, ...newSettings };
        
        // If interval changed and reminder is active, restart with new interval
        if (wasActive && oldInterval !== newSettings.interval) {
            this.stop();
            this.start();
        }
        
        console.log(`${this.type} settings updated:`, this.settings);
    }

    /**
     * Get current reminder status for state persistence
     * @returns {Object} Current status object with unified format
     */
    getCurrentStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isPaused: this.isPaused,
            timeRemaining: this.timeRemaining,
            nextReminderTime: this.nextReminderTime,
            lastAcknowledged: this.settings.lastReminder,
            interval: this.settings.interval,
            enabled: this.settings.enabled !== false,
            settings: { ...this.settings }
        };
    }

    /**
     * Notify status change - no longer save state directly, handled uniformly by application
     * @private
     */
    notifyStateChange() {
        if (this.statusChangeCallback) {
            const status = this.getCurrentStatus();
            status.type = this.type;
            this.statusChangeCallback(status);
        }
    }

    /**
     * Start timer
     * @private
     */
    startTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        this.timer = setTimeout(() => {
            this.triggerReminder();
        }, this.timeRemaining);
    }

    /**
     * Clear timer
     * @private
     */
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     * Start time update timer
     * @private
     */
    startUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.updateTimeRemaining();
        }, this.updateInterval);
    }

    /**
     * Clear time update timer
     * @private
     */
    clearUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Update remaining time
     * @private
     */
    updateTimeRemaining() {
        if (!this.isActive || this.isPaused) {
            return;
        }
        
        const now = Date.now();
        this.timeRemaining = Math.max(0, this.nextReminderTime - now);
        
        // Trigger time update callback
        if (this.timeUpdateCallback) {
            this.timeUpdateCallback({
                type: this.type,
                timeRemaining: this.timeRemaining,
                nextReminderTime: this.nextReminderTime,
                progress: 1 - (this.timeRemaining / (this.settings.interval * 60 * 1000))
            });
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
            () => this.acknowledge(), // Confirm callback
            () => this.snooze()       // Snooze callback
        );
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'triggered',
            isActive: true,
            isPaused: false,
            timeRemaining: 0
        });
        
        // Unified auto-reset mechanism - restart with original interval
        setTimeout(() => {
            if (this.isActive) {
                this.resetAndRestart();
            }
        }, 5000); // Auto-restart after 5 seconds
        
        console.log(`${this.type} reminder triggered - will auto-restart`);
    }

    /**
     * Snooze reminder (delay 5 minutes)
     */
    snooze() {
        if (!this.isActive) return;
        
        const snoozeTime = 5 * 60 * 1000; // 5 minutes
        this.timeRemaining = snoozeTime;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timer
        this.clearTimer();
        this.startTimer();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'snoozed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder snoozed for 5 minutes`);
    }

    /**
     * Reset state
     * @private
     */
    resetState() {
        this.startTime = null;
        this.pauseTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
    }

    /**
     * Trigger status change callback
     * @param {Object} status - Status information
     * @private
     */
    triggerStatusChange(status) {
        if (this.statusChangeCallback) {
            this.statusChangeCallback({
                ...status,
                type: this.type,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Restore saved state
     * @param {Object} state - State to restore
     */
    restoreState(state) {
        if (!state) return;
        
        try {
            // Restore activity status
            this.isActive = state.isActive || false;
            this.isPaused = state.isPaused || false;
            
            // Restore time information
            if (state.timeRemaining) {
                this.timeRemaining = state.timeRemaining;
            }
            
            if (state.nextReminderAt) {
                this.nextReminderTime = state.nextReminderAt;
            } else if (this.timeRemaining > 0) {
                this.nextReminderTime = Date.now() + this.timeRemaining;
            }
            
            // If active, start timers
            if (this.isActive && !this.isPaused) {
                this.startTime = Date.now();
                this.startTimer();
                this.startUpdateTimer();
                
                // Activity detection removed for MVP - using simpler time-based reminders
                
                // Trigger status change callback
                this.triggerStatusChange({
                    status: 'restored',
                    isActive: true,
                    isPaused: false,
                    timeRemaining: this.timeRemaining
                });
            } else if (this.isActive && this.isPaused) {
                // If paused, only trigger status change callback
                this.pauseTime = Date.now();
                
                this.triggerStatusChange({
                    status: 'restored',
                    isActive: true,
                    isPaused: true,
                    timeRemaining: this.timeRemaining
                });
            }
            
            console.log(`${this.type} reminder state restored:`, {
                isActive: this.isActive,
                isPaused: this.isPaused,
                timeRemaining: this.timeRemaining
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to restore ${this.type} reminder state:`, error);
            return false;
        }
    }

    /**
     * Destroy reminder manager
     */
    destroy() {
        this.stop();
        
        // Clear all callbacks
        this.statusChangeCallback = null;
        this.timeUpdateCallback = null;
        
        // Activity detection cleanup removed for MVP
        
        console.log(`${this.type} reminder manager destroyed`);
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderManager;
}

// Export for browser use
window.ReminderManager = ReminderManager;