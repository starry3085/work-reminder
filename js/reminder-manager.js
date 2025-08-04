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
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(type, settings, notificationService, stateManager) {
        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        this.stateManager = stateManager;
        
        // State management - these are now synced from StateManager
        this.isActive = false;
        this.timer = null;
        this.startTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
        

        
        // Timer update interval (1 second)
        this.updateInterval = 1000;
        this.updateTimer = null;
        
        // Subscribe to state changes immediately
        this.subscribeToStateManager();
        
        console.log(`${this.type} reminder manager created with StateManager integration`);
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
        this.startTime = Date.now();
        
        // Use precise millisecond calculation
        const intervalMs = Math.round(this.settings.interval * 60 * 1000);
        this.timeRemaining = intervalMs;
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Start timer
        this.startTimer();
        
        // Start time update timer
        this.startUpdateTimer();
        
        // Update state uniformly through StateManager
        const updates = {
            isActive: true,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        

        
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
        
        // Clear timers
        this.clearTimer();
        this.clearUpdateTimer();
        
        // Reset state
        this.resetState();
        
        // Update state uniformly through StateManager
        const updates = {
            isActive: false,
            timeRemaining: 0,
            nextReminderAt: 0
        };
        this.updateState(updates);
        

        
        console.log(`${this.type} reminder stopped`);
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
        
        // Update settings through StateManager
        this.updateState({ settings: this.settings });
        
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
        
        // Update state uniformly through StateManager
        const updates = {
            isActive: true,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        

        
        console.log(`${this.type} reminder reset and restarted with ${this.settings.interval}min interval`);
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
            timeRemaining: this.timeRemaining,
            nextReminderTime: this.nextReminderTime,
            lastAcknowledged: this.settings.lastReminder,
            interval: this.settings.interval,
            enabled: this.settings.enabled !== false,
            settings: { ...this.settings }
        };
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
        if (!this.isActive) {
            return;
        }
        
        const now = Date.now();
        this.timeRemaining = Math.max(0, this.nextReminderTime - now);
        
        // Update state to ensure UI gets fresh data
        const updates = {
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        

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
        
        // Update state uniformly through StateManager
        const updates = {
            isActive: true,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        

        
        console.log(`${this.type} reminder snoozed for 5 minutes`);
    }

    /**
     * Reset state
     * @private
     */
    resetState() {
        this.startTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
    }



    /**
     * Subscribe to state manager changes
     * @private
     */
    subscribeToStateManager() {
        if (!this.stateManager) return;
        
        this.unsubscribe = this.stateManager.subscribe(this.type, (state) => {
            // Prevent self-triggered updates
            if (this.isUpdatingFromState) return;
            
            this.syncWithState(state);
        });
        
        console.log(`${this.type} reminder subscribed to StateManager`);
    }

    /**
     * Sync state from StateManager (single source of truth)
     * @private
     */
    syncWithState(state) {
        if (!state) return;
        
        try {
            // Prevent update loops - atomic operation
            if (this.isUpdatingFromState) return;
            this.isUpdatingFromState = true;
            
            // Update internal state from single source
            const wasActive = this.isActive;
            this.isActive = Boolean(state.isActive);
            this.timeRemaining = Math.max(0, state.timeRemaining || 0);
            this.nextReminderTime = state.nextReminderAt || 0;
            
            // Update settings from state
            this.settings = { ...this.settings, ...state.settings };
            
            // Sync timers based on authoritative state
            this.syncTimers();
            
            console.log(`${this.type} reminder synced with StateManager state:`, {
                isActive: this.isActive,
                timeRemaining: this.timeRemaining
            });
            
        } catch (error) {
            console.error(`Failed to sync ${this.type} reminder state:`, error);
        } finally {
            // Always reset flag, even on error
            this.isUpdatingFromState = false;
        }
    }

    /**
     * Sync timer state based on authoritative state
     * @private
     */
    syncTimers() {
        this.clearTimer();
        this.clearUpdateTimer();
        
        if (this.isActive) {
            this.startTime = Date.now();
            this.startTimer();
            this.startUpdateTimer();
            
            this.triggerStatusChange({
                status: 'synced',
                isActive: true,
                timeRemaining: this.timeRemaining
            });
        }
    }

    /**
     * Update state through StateManager (single source of truth)
     * @private
     */
    updateState(updates) {
        if (this.stateManager && !this.isUpdatingFromState) {
            this.stateManager.updateState(this.type, updates);
        }
    }

    /**
     * Restore state from StateManager
     * @param {Object} state - State to restore
     */
    restoreState(state) {
        if (!state || !this.stateManager) return;
        
        // State restoration is handled by StateManager subscription
        this.stateManager.updateState(this.type, state);
        return true;
    }

    /**
     * Destroy reminder manager
     */
    destroy() {
        this.stop();
        

        
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