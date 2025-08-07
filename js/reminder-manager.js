/**
 * Reminder Manager - Base class for reminder functionality
 * Handles timer management and error recovery
 * 
 * Architecture:
 * - Unified time handling (milliseconds internally, minutes in UI)
 * - Comprehensive error handling and recovery
 */
class ReminderManager {
    /**
     * Create reminder manager instance
     * @param {string} type - Reminder type ('water' or 'standup')
     * @param {Object} settings - Initial settings
     * @param {NotificationService} notificationService - Notification service
     */
    constructor(type, settings, notificationService) {
        if (!type || !['water', 'standup'].includes(type)) {
            throw new Error('Invalid reminder type');
        }

        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        
        // Timer management
        this.timerId = null;
        this.updateTimerId = null;
        this.updateInterval = 1000; // 1 second update frequency
        
        // Time tracking (all in milliseconds)
        this.startTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
        this.isActive = false;
        
        // Initialize with default state
        this.initializeDefaults();
        
        console.log(`${type} reminder manager created`);
    }

    /**
     * Initialize with default state
     * @private
     */
    initializeDefaults() {
        this.isActive = false;
        this.timeRemaining = this.settings.interval * 60 * 1000;
        this.nextReminderTime = 0;
    }

    /**
     * Get remaining time in milliseconds
     * @returns {number} Time remaining in milliseconds
     */
    getTimeRemaining() {
        return Math.max(0, this.timeRemaining);
    }

    /**
     * Get interval in minutes
     * @returns {number} Interval in minutes
     */
    get interval() {
        return this.settings.interval || 30;
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
            this.clearAllTimers();
            
            this.isActive = false;
            this.resetState();
            
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
    }

    /**
     * Clear all timers (unified cleanup)
     * @private
     */
    clearAllTimers() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        
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
        
        this.clearAllTimers();
        this.startTimer();
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