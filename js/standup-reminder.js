/**
 * Posture Reminder Class - Handles posture/standup reminder logic
 * Extends ReminderManager, adds posture-specific functionality and intelligent activity detection
 */
class PostureReminder extends ReminderManager {
    /**
     * Create posture reminder instance
     * @param {Object} settings - Posture reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     * @param {ActivityDetector} activityDetector - Activity detector instance
     */
    constructor(settings, notificationService, activityDetector) {
        super('standup', settings, notificationService, activityDetector);
        
        // Posture-specific state
        this.dailyActivityCount = 0;
        this.dailyGoal = 8; // Daily activity goal (times)
        this.lastActivityTime = null;
        this.activityHistory = []; // Today's activity records
        this.totalSittingTime = 0; // Total sitting time today (milliseconds)
        this.currentSittingStart = null; // Current sitting start time
        
        // Activity detection related
        this.isUserAway = false;
        this.awayStartTime = null;
        this.lastUserActivity = Date.now();
        this.activityThreshold = (settings.activityThreshold || 5) * 60 * 1000; // Convert to milliseconds
        
        // Load today's data from local storage
        this.loadDailyData();
        
        // Set up enhanced activity detection
        this.setupEnhancedActivityDetection();
        
        console.log('Posture reminder created');
    }

    /**
     * Load today's posture data
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
                    this.lastActivityTime = data.lastActivityTime || null;
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
     * Save today's posture data
     * @private
     */
    saveDailyData() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                count: this.dailyActivityCount,
                history: this.activityHistory,
                lastActivityTime: this.lastActivityTime,
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
        this.lastActivityTime = null;
        this.totalSittingTime = 0;
        this.currentSittingStart = Date.now();
        this.saveDailyData();
    }

    /**
     * Set up enhanced activity detection
     * @private
     */
    setupEnhancedActivityDetection() {
        if (!this.activityDetector) return;
        
        // Save original callback
        const originalCallback = this.activityDetector.callback;
        
        // Set new callback, including original callback and our handling
        this.activityDetector.callback = (event) => {
            // Call original callback
            if (originalCallback) {
                originalCallback(event);
            }
            
            // Handle activity detection events
            this.handleEnhancedActivityEvent(event);
        };
        
        // Start continuous activity monitoring
        this.startContinuousMonitoring();
    }

    /**
     * Handle enhanced user activity events
     * @param {Object} event - Activity event
     * @private
     */
    handleEnhancedActivityEvent(event) {
        const now = Date.now();
        this.lastUserActivity = now;
        
        switch (event.type) {
            case 'user-activity':
                // User has activity, reset away state
                if (this.isUserAway) {
                    this.handleUserReturn();
                }
                
                // Check if should auto-extend posture timer
                if (this.isActive && !this.isPaused) {
                    this.handleActivityDuringReminder();
                }
                break;
                
            case 'user-away':
                // User away, pause posture reminder
                this.handleUserAway();
                break;
                
            case 'user-return':
                // User returned, resume posture reminder
                this.handleUserReturn();
                break;
        }
    }

    /**
     * Handle user away event
     * @private
     */
    handleUserAway() {
        if (this.isUserAway) return;
        
        this.isUserAway = true;
        this.awayStartTime = Date.now();
        
        // Record sitting time
        if (this.currentSittingStart) {
            this.totalSittingTime += this.awayStartTime - this.currentSittingStart;
            this.currentSittingStart = null;
        }
        
        // Auto-pause posture reminder
        if (this.isActive && !this.isPaused) {
            this.pause(true); // true means auto-pause
        }
        
        console.log('User away, posture reminder auto-paused');
    }

    /**
     * Handle user return event
     * @private
     */
    handleUserReturn() {
        if (!this.isUserAway) return;
        
        const returnTime = Date.now();
        const awayDuration = returnTime - this.awayStartTime;
        
        this.isUserAway = false;
        this.currentSittingStart = returnTime;
        
        // If away time exceeds 5 minutes, consider it valid activity
        if (awayDuration > this.activityThreshold) {
            this.recordActivity('away-break', awayDuration);
        }
        
        // Auto-resume posture reminder
        if (this.isActive && this.isPaused) {
            this.resume(true); // true means auto-resume
        }
        
        console.log(`User returned, away duration: ${Math.round(awayDuration / 60000)} minutes`);
    }

    /**
     * Handle user activity during reminder
     * @private
     */
    handleActivityDuringReminder() {
        // If user has continuous activity during reminder, extend timer appropriately
        const activityWindow = 30000; // 30-second activity window
        const now = Date.now();
        
        if (now - this.lastUserActivity < activityWindow) {
            // Extend by 5 minutes
            const extensionTime = 5 * 60 * 1000;
            this.timeRemaining = Math.min(this.timeRemaining + extensionTime, this.settings.interval * 60 * 1000);
            this.nextReminderTime = now + this.timeRemaining;
            
            // Restart timer
            this.clearTimer();
            this.startTimer();
            
            console.log('User activity detected, posture reminder extended by 5 minutes');
        }
    }

    /**
     * Start continuous monitoring
     * @private
     */
    startContinuousMonitoring() {
        // Check user status every minute
        this.monitoringInterval = setInterval(() => {
            this.checkUserStatus();
        }, 60000);
    }

    /**
     * Check user status
     * @private
     */
    checkUserStatus() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastUserActivity;
        
        // If exceeds activity threshold and user hasn't been marked as away
        if (timeSinceLastActivity > this.activityThreshold && !this.isUserAway) {
            this.handleUserAway();
        }
        
        // Update sitting time
        if (this.currentSittingStart && !this.isUserAway) {
            this.totalSittingTime += 60000; // Add 1 minute
        }
    }

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
            dailyCount: this.dailyActivityCount,
            dailyGoal: this.dailyGoal,
            lastActivityTime: this.lastActivityTime
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
        this.lastActivityTime = now;
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
        const progress = Math.min(this.dailyActivityCount / this.dailyGoal, 1);
        const progressPercent = Math.round(progress * 100);
        
        let message = `Great! You've been active ${this.dailyActivityCount} times today`;
        
        if (this.dailyActivityCount >= this.dailyGoal) {
            message += `\n🎉 Congratulations! You've completed your daily activity goal!`;
        } else {
            const remaining = this.dailyGoal - this.dailyActivityCount;
            message += `\n${remaining} more activities needed to complete today's goal (${progressPercent}%)`;
        }
        
        // Add extra information based on activity type
        if (activityType === 'away-break') {
            message += `\nDetected you were away for ${Math.round(duration / 60000)} minutes, great break!`;
        }
        
        // Show in-page notification
        this.notificationService.showInPageAlert('success', {
            title: '🧘 Activity Confirmed',
            message: message,
            duration: 3000
        });
        
        // If goal completed, show celebration notification
        if (this.dailyActivityCount === this.dailyGoal) {
            setTimeout(() => {
                this.notificationService.showInPageAlert('celebration', {
                    title: '🎉 Goal Reached!',
                    message: 'Congratulations! You\'ve completed your daily activity goal! Keep up the healthy work habits!',
                    duration: 5000
                });
            }, 1000);
        }
    }

    /**
     * Trigger posture reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '🧘 Time to Stand Up!';
        let message = 'Sitting too long is bad for your health, get up and move around!';
        
        // Adjust message based on today's progress and sitting time
        const sittingHours = Math.round(this.totalSittingTime / (1000 * 60 * 60) * 10) / 10;
        
        if (this.dailyActivityCount > 0) {
            const remaining = Math.max(0, this.dailyGoal - this.dailyActivityCount);
            if (remaining > 0) {
                message += `\nYou've been active ${this.dailyActivityCount} times today, ${remaining} more needed to reach your goal`;
            } else {
                message = 'Keep up the good activity habits!';
            }
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
            dailyGoal: this.dailyGoal
        });
        
        // Auto-reset timer (if user doesn't manually confirm)
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // Auto-reset after 1 minute
        
        console.log('Posture reminder triggered');
    }

    /**
     * Get today's activity statistics
     * @returns {Object} Today's activity statistics
     */
    getDailyStats() {
        const totalActivityTime = this.activityHistory.reduce((sum, record) => sum + record.duration, 0);
        const progress = Math.min(this.dailyActivityCount / this.dailyGoal, 1);
        const sittingHours = Math.round(this.totalSittingTime / (1000 * 60 * 60) * 10) / 10;
        
        return {
            count: this.dailyActivityCount,
            goal: this.dailyGoal,
            progress: progress,
            progressPercent: Math.round(progress * 100),
            totalActivityTime: totalActivityTime,
            totalSittingTime: this.totalSittingTime,
            sittingHours: sittingHours,
            lastActivityTime: this.lastActivityTime,
            history: [...this.activityHistory],
            isGoalReached: this.dailyActivityCount >= this.dailyGoal,
            averageActivityDuration: this.activityHistory.length > 0 
                ? Math.round(totalActivityTime / this.activityHistory.length / 60000) 
                : 0
        };
    }

    /**
     * Set daily goal
     * @param {number} goal - Daily activity goal (times)
     */
    setDailyGoal(goal) {
        if (goal > 0 && goal <= 20) { // Reasonable range
            this.dailyGoal = goal;
            this.saveDailyData();
            
            console.log(`Daily activity goal set to ${goal} times`);
        } else {
            console.warn('Daily goal should be between 1-20 times');
        }
    }

    /**
     * Set activity threshold
     * @param {number} threshold - Activity threshold (minutes)
     */
    setActivityThreshold(threshold) {
        if (threshold > 0 && threshold <= 30) { // Reasonable range
            this.activityThreshold = threshold * 60 * 1000; // Convert to milliseconds
            this.settings.activityThreshold = threshold;
            
            console.log(`Activity threshold set to ${threshold} minutes`);
        } else {
            console.warn('Activity threshold should be between 1-30 minutes');
        }
    }

    /**
     * Get health suggestion
     * @returns {string} Personalized health suggestion
     */
    getHealthSuggestion() {
        const stats = this.getDailyStats();
        const now = new Date();
        const hour = now.getHours();
        
        // Give suggestions based on time, activity count and sitting time
        if (stats.sittingHours > 6) {
            return 'You\'ve been sitting for a long time today, suggest increasing activity frequency, stand up every 30 minutes';
        } else if (stats.count < stats.goal * 0.5 && hour > 14) {
            return 'It\'s afternoon and activity count is still low, remember to stand up and move around more';
        } else if (stats.count >= stats.goal) {
            return 'Daily activity goal achieved! Keep up the good habits';
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
            suggestion: this.getHealthSuggestion(),
            isUserAway: this.isUserAway,
            lastUserActivity: this.lastUserActivity,
            activityThreshold: this.activityThreshold
        };
    }

    /**
     * Start reminder (override parent method, add posture-specific logic)
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
     * Stop reminder (override parent method, add posture-specific logic)
     */
    stop() {
        // Record sitting time
        if (this.currentSittingStart) {
            this.totalSittingTime += Date.now() - this.currentSittingStart;
            this.currentSittingStart = null;
            this.saveDailyData();
        }
        
        // Stop continuous monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // Call parent stop method
        super.stop();
    }

    /**
     * Reset reminder timer (override parent method, add posture-specific logic)
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
     * Destroy posture reminder (override parent method)
     */
    destroy() {
        // Record final sitting time
        if (this.currentSittingStart) {
            this.totalSittingTime += Date.now() - this.currentSittingStart;
        }
        
        // Save data
        this.saveDailyData();
        
        // Stop continuous monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // Call parent destroy method
        super.destroy();
        
        console.log('Posture reminder destroyed');
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostureReminder;
}

// Export for browser use
window.PostureReminder = PostureReminder;