/**
 * Reminder Manager - Core class for managing water and posture reminders
 * Responsible for timer management, status tracking, reminder triggering and persistent storage
 */
class ReminderManager {
    /**
     * Create reminder manager instance
     * @param {string} type - Reminder type ('water' | 'posture')
     * @param {Object} settings - Reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     * @param {ActivityDetector} activityDetector - Activity detector instance (only needed for posture reminders)
     */
    constructor(type, settings, notificationService, activityDetector = null) {
        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        this.activityDetector = activityDetector;
        
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
        
        // Timer update interval (1 second)
        this.updateInterval = 1000;
        this.updateTimer = null;
        
        // If posture reminder, set up activity detector callback
        if (this.type === 'posture' && this.activityDetector) {
            this.setupActivityDetection();
        }
        
        console.log(`${this.type} reminder manager created`);
    }

    /**
     * Set up activity detection (posture reminders only)
     * @private
     */
    setupActivityDetection() {
        if (!this.activityDetector) return;
        
        // Save original callback
        const originalCallback = this.activityDetector.callback;
        
        // Set new callback, including original callback and our handling
        this.activityDetector.callback = (event) => {
            // Call original callback
            if (originalCallback) {
                originalCallback(event);
            }
            
            // Handle activity detection event
            this.handleActivityEvent(event);
        };
    }

    /**
     * Handle user activity events (posture reminders only)
     * @param {Object} event - Activity event
     * @private
     */
    handleActivityEvent(event) {
        if (this.type !== 'posture') return;
        
        switch (event.type) {
            case 'user-away':
                // User away, auto-pause posture reminder
                if (this.isActive && !this.isPaused) {
                    this.pause(true); // true means auto-pause
                }
                break;
                
            case 'user-return':
                // User returned, auto-resume posture reminder
                if (this.isActive && this.isPaused) {
                    this.resume(true); // true means auto-resume
                }
                break;
        }
    }

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
        this.timeRemaining = this.settings.interval * 60 * 1000; // Convert to milliseconds
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Start timer
        this.startTimer();
        
        // Start time update timer
        this.startUpdateTimer();
        
        // If posture reminder, start activity detection
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.startMonitoring();
        }
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'started',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder started, interval: ${this.settings.interval} minutes`);
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
        
        // If posture reminder, stop activity detection
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.stopMonitoring();
        }
        
        // Reset state
        this.resetState();
        
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
     * Pause reminder
     * @param {boolean} isAuto - Whether it's auto-pause (triggered by activity detection)
     */
    pause(isAuto = false) {
        if (!this.isActive || this.isPaused) {
            if (!isAuto) {
                console.warn(`${this.type} reminder is not running or already paused`);
            }
            return;
        }
        
        this.isPaused = true;
        this.pauseTime = Date.now();
        
        // Calculate remaining time
        const elapsed = this.pauseTime - this.startTime;
        this.timeRemaining = Math.max(0, this.timeRemaining - elapsed);
        
        // Clear timer
        this.clearTimer();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'paused',
            isActive: true,
            isPaused: true,
            timeRemaining: this.timeRemaining,
            isAuto: isAuto
        });
        
        console.log(`${this.type} reminder ${isAuto ? 'auto' : 'manually'} paused`);
    }

    /**
     * Resume reminder
     * @param {boolean} isAuto - Whether it's auto-resume (triggered by activity detection)
     */
    resume(isAuto = false) {
        if (!this.isActive || !this.isPaused) {
            if (!isAuto) {
                console.warn(`${this.type} reminder is not paused`);
            }
            return;
        }
        
        this.isPaused = false;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timer
        this.startTimer();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'resumed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            isAuto: isAuto
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
        }
        
        // Reset state
        this.resetState();
        
        if (wasActive) {
            // If previously active, restart
            this.start();
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
        
        // Reset timer
        this.reset();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'acknowledged',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder acknowledged`);
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     */
    updateSettings(newSettings) {
        const oldInterval = this.settings.interval;
        
        // Update settings
        this.settings = { ...this.settings, ...newSettings };
        
        // If interval changed and reminder is running, need to recalculate
        if (newSettings.interval && newSettings.interval !== oldInterval && this.isActive) {
            const newIntervalMs = newSettings.interval * 60 * 1000;
            
            if (!this.isPaused) {
                // If not paused, recalculate remaining time
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / (oldInterval * 60 * 1000);
                this.timeRemaining = Math.max(0, newIntervalMs * (1 - progress));
                this.nextReminderTime = Date.now() + this.timeRemaining;
                
                // Restart timer
                this.clearTimer();
                this.startTimer();
            } else {
                // If paused, adjust remaining time proportionally
                const progress = 1 - (this.timeRemaining / (oldInterval * 60 * 1000));
                this.timeRemaining = Math.max(0, newIntervalMs * (1 - progress));
            }
        }
        
        console.log(`${this.type} reminder settings updated:`, this.settings);
    }

    /**
     * Get current status
     * @returns {Object} Current status information
     */
    getCurrentStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isPaused: this.isPaused,
            timeRemaining: this.timeRemaining,
            nextReminderTime: this.nextReminderTime,
            settings: { ...this.settings },
            lastUpdate: Date.now()
        };
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
        
        // Auto-reset timer (if user doesn't manually confirm)
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // Auto-reset after 1 minute
        
        console.log(`${this.type} reminder triggered`);
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
                
                // If posture reminder, start activity detection
                if (this.type === 'posture' && this.activityDetector) {
                    this.activityDetector.startMonitoring();
                }
                
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
        
        // If posture reminder, clean up activity detector
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.stopMonitoring();
        }
        
        console.log(`${this.type} reminder manager destroyed`);
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderManager;
}