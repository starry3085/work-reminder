/**
 * Standup Reminder Class - Handles standup reminder logic
 * Extends ReminderManager, adds standup-specific functionality with time-based reminders
 */
class StandupReminder extends ReminderManager {
    /**
     * Create standup reminder instance
     * @param {Object} settings - Standup reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     */
    constructor(settings, notificationService) {
        super('standup', settings, notificationService);
        
        // Standup-specific state
        this.dailyActivityCount = 0;

        // Activity tracking removed for MVP
        this.activityHistory = []; // Today's activity records
        this.totalSittingTime = 0; // Total sitting time today (milliseconds)
        this.currentSittingStart = null; // Current sitting start time
        
        // Load today's data from local storage
        this.loadDailyData();
        
        console.log('Standup reminder created');
    }

    /**
     * Load today's standup data
     * @private
     */
    loadDailyData() {
        try {
            const today = new Date().toDateString();
            const savedData = localStorage.getItem('standupReminder_dailyData');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Check if data is from today
                if (data.date === today) {
                    this.dailyActivityCount = data.count || 0;
                    this.activityHistory = data.history || [];
        
                    this.totalSittingTime = data.totalSittingTime || 0;
                } else {
                    // New day, reset data
                    this.resetDailyData();
                }
            }
        } catch (error) {
            console.warn('Failed to load today\'s standup data:', error);
            this.resetDailyData();
        }
    }

    /**
     * Save today's standup data
     * @private
     */
    saveDailyData() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                count: this.dailyActivityCount,
                history: this.activityHistory,
                // Activity tracking removed for MVP
                totalSittingTime: this.totalSittingTime
            };
            
            localStorage.setItem('standupReminder_dailyData', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save today\'s standup data:', error);
        }
    }

    /**
     * Reset today's data
     * @private
     */
    resetDailyData() {
        this.dailyActivityCount = 0;
        this.activityHistory = [];
        // Activity tracking removed for MVP
        this.totalSittingTime = 0;
        this.currentSittingStart = Date.now();
        this.saveDailyData();
    }

    // Activity detection methods removed for MVP - using simpler time-based reminders

    /**
     * Confirm user standup activity
     * @param {number} duration - Activity duration (minutes), optional
     * @param {string} activityType - Activity type, optional
     */
    confirmActivity(duration = 5, activityType = 'manual') {
        const now = Date.now();
        
        // Record activity
        this.recordActivity(activityType, duration * 60 * 1000);
        
        // Update last reminder time
        this.settings.lastReminder = now;
        
        // Reset timer
        this.reset();
        
        // Show confirmation message
        this.showActivityConfirmation(duration, activityType);
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'activity-confirmed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            dailyCount: this.dailyActivityCount
            // Activity tracking removed for MVP
        });
        
        console.log(`Activity confirmed, ${this.dailyActivityCount} times today`);
    }

    /**
     * Record activity
     * @param {string} type - Activity type
     * @param {number} duration - Activity duration (milliseconds)
     * @private
     */
    recordActivity(type, duration) {
        const now = Date.now();
        
        this.dailyActivityCount++;
        // Activity tracking removed for MVP
        this.activityHistory.push({
            time: now,
            type: type,
            duration: duration
        });
        
        // Reset sitting time calculation
        this.currentSittingStart = now;
        
        // Save data
        this.saveDailyData();
    }

    /**
     * Show activity confirmation message
     * @param {number} duration - Activity duration (minutes)
     * @param {string} activityType - Activity type
     * @private
     */
    showActivityConfirmation(duration, activityType) {
        let message = `Great! You've been active ${this.dailyActivityCount} times today`;
        
        // Add extra information based on activity type
        if (activityType === 'away-break') {
            message += `\nDetected you were away for ${Math.round(duration / 60000)} minutes, great break!`;
        }
        
        // Show in-page notification
        this.notificationService.showInPageAlert(
            'standup',
            '🧘 Activity Confirmed',
            message
        );
        

    }

    /**
     * Trigger standup reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '🧘 Time to Stand Up!';
        let message = 'Sitting too long is bad for your health, get up and move around!';
        
        // Adjust message based on today's progress and sitting time
        const sittingHours = Math.round(this.totalSittingTime / (1000 * 60 * 60) * 10) / 10;
        
        if (this.dailyActivityCount > 0) {
            message += `\nYou've been active ${this.dailyActivityCount} times today`;
        }
        
        if (sittingHours > 0) {
            message += `\nYou've been sitting for ${sittingHours} hours today`;
        }
        
        // Show notification with confirm and snooze options
        this.notificationService.showNotification(
            'standup',
            title,
            message,
            () => this.confirmActivity(), // Confirm activity callback
            () => this.snooze(),         // Snooze reminder callback
            {
                actions: [
                    {
                        action: 'activity',
                        title: 'I Stood Up',
                        icon: '🧘'
                    },
                    {
                        action: 'snooze',
                        title: 'Remind in 5 min',
                        icon: '⏰'
                    }
                ]
            }
        );
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'triggered',
            isActive: true,
            isPaused: false,
            timeRemaining: 0,
            dailyCount: this.dailyActivityCount,

        });
        
        // Auto-reset timer (if user doesn't manually confirm)
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // Auto-reset after 1 minute
        
        console.log('Standup reminder triggered');
    }

    /**
     * Get today's activity statistics
     * @returns {Object} Today's activity statistics
     */
    getDailyStats() {
        const totalActivityTime = this.activityHistory.reduce((sum, record) => sum + record.duration, 0);
        const sittingHours = Math.round(this.totalSittingTime / (1000 * 60 * 60) * 10) / 10;
        
        return {
            count: this.dailyActivityCount,
            totalActivityTime: totalActivityTime,
            totalSittingTime: this.totalSittingTime,
            sittingHours: sittingHours,
            // Activity tracking removed for MVP
            history: [...this.activityHistory],
            averageActivityDuration: this.activityHistory.length > 0 
                ? Math.round(totalActivityTime / this.activityHistory.length / 60000) 
                : 0
        };
    }



    // Activity threshold setting removed for MVP - using simpler time-based reminders

    /**
     * Get health suggestion
     * @returns {string} Personalized health suggestion
     */
    getHealthSuggestion() {
        const stats = this.getDailyStats();
        const now = new Date();
        const hour = now.getHours();
        
        // Give suggestions based on time and sitting time
        if (stats.sittingHours > 6) {
            return 'You\'ve been sitting for a long time today, suggest increasing activity frequency, stand up every 30 minutes';
        } else if (hour < 12) {
            return 'Morning work time, remember to stand up and move every hour';
        } else if (hour < 18) {
            return 'Afternoon fatigue is common, proper activity helps improve work efficiency';
        } else {
            return 'Work day is almost over, do some light stretching exercises';
        }
    }

    /**
     * Get current status (override parent method)
     * @returns {Object} Current status information
     */
    getCurrentStatus() {
        const baseStatus = super.getCurrentStatus();
        
        return {
            ...baseStatus,
            dailyStats: this.getDailyStats(),
            suggestion: this.getHealthSuggestion()
        };
    }

    /**
     * Start reminder (override parent method, add standup-specific logic)
     */
    start() {
        // Record start sitting time
        if (!this.currentSittingStart) {
            this.currentSittingStart = Date.now();
        }
        
        // Call parent start method
        super.start();
    }

    /**
     * Stop reminder (override parent method, add standup-specific logic)
     */
    stop() {
        // Record sitting time
        if (this.currentSittingStart) {
            this.totalSittingTime += Date.now() - this.currentSittingStart;
            this.currentSittingStart = null;
            this.saveDailyData();
        }
        
        // Activity detection cleanup removed for MVP
        
        // Call parent stop method
        super.stop();
    }

    /**
     * Reset reminder timer (override parent method, add standup-specific logic)
     */
    reset() {
        super.reset();
        
        // Check if need to reset daily data (new day)
        const today = new Date().toDateString();
        const savedData = localStorage.getItem('standupReminder_dailyData');
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.date !== today) {
                    this.resetDailyData();
                }
            } catch (error) {
                console.warn('Failed to check date data:', error);
            }
        }
    }

    /**
     * Destroy standup reminder (override parent method)
     */
    destroy() {
        // Record final sitting time
        if (this.currentSittingStart) {
            this.totalSittingTime += Date.now() - this.currentSittingStart;
        }
        
        // Save data
        this.saveDailyData();
        
        // Activity detection cleanup removed for MVP
        
        // Call parent destroy method
        super.destroy();
        
        console.log('Standup reminder destroyed');
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StandupReminder;
}

// Export for browser use
window.StandupReminder = StandupReminder;