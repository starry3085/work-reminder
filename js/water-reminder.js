/**
 * Water Reminder Class - Handles water reminder logic
 * Extends ReminderManager, adds water-specific functionality
 */
class WaterReminder extends ReminderManager {
    /**
     * Create water reminder instance
     * @param {Object} settings - Water reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     */
    constructor(settings, notificationService) {
        super('water', settings, notificationService);
        
        // Water-specific state
        this.dailyWaterCount = 0;
        this.dailyGoal = 8; // Daily water goal (glasses)
        this.lastDrinkTime = null;
        this.drinkHistory = []; // Today's water intake records
        
        // Load today's data from local storage
        this.loadDailyData();
        
        console.log('Water reminder created');
    }

    /**
     * Load today's water intake data
     * @private
     */
    loadDailyData() {
        try {
            const today = new Date().toDateString();
            const savedData = localStorage.getItem('waterReminder_dailyData');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Check if data is from today
                if (data.date === today) {
                    this.dailyWaterCount = data.count || 0;
                    this.drinkHistory = data.history || [];
                    this.lastDrinkTime = data.lastDrinkTime || null;
                } else {
                    // New day, reset data
                    this.resetDailyData();
                }
            }
        } catch (error) {
            console.warn('Failed to load today\'s water data:', error);
            this.resetDailyData();
        }
    }

    /**
     * Save today's water intake data
     * @private
     */
    saveDailyData() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                count: this.dailyWaterCount,
                history: this.drinkHistory,
                lastDrinkTime: this.lastDrinkTime
            };
            
            localStorage.setItem('waterReminder_dailyData', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save today\'s water data:', error);
        }
    }

    /**
     * Reset today's data
     * @private
     */
    resetDailyData() {
        this.dailyWaterCount = 0;
        this.drinkHistory = [];
        this.lastDrinkTime = null;
        this.saveDailyData();
    }

    /**
     * User confirms water intake
     * @param {number} amount - Water amount (ml), optional
     */
    confirmDrink(amount = 250) {
        const now = Date.now();
        
        // Record water intake
        this.dailyWaterCount++;
        this.lastDrinkTime = now;
        this.drinkHistory.push({
            time: now,
            amount: amount
        });
        
        // Update last reminder time
        this.settings.lastReminder = now;
        
        // Save data
        this.saveDailyData();
        
        // Reset timer
        this.reset();
        
        // Show confirmation message
        this.showDrinkConfirmation();
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'drink-confirmed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            dailyCount: this.dailyWaterCount,
            dailyGoal: this.dailyGoal,
            lastDrinkTime: this.lastDrinkTime
        });
        
        console.log(`Water confirmed, ${this.dailyWaterCount} glasses today`);
    }

    /**
     * Show water confirmation message
     * @private
     */
    showDrinkConfirmation() {
        const progress = Math.min(this.dailyWaterCount / this.dailyGoal, 1);
        const progressPercent = Math.round(progress * 100);
        
        let message = `Great! You've had ${this.dailyWaterCount} glasses today`;
        
        if (this.dailyWaterCount >= this.dailyGoal) {
            message += `\n🎉 Congratulations! You've reached your daily water goal!`;
        } else {
            const remaining = this.dailyGoal - this.dailyWaterCount;
            message += `\nNeed ${remaining} more glasses to reach today's goal (${progressPercent}%)`;
        }
        
        // Show in-page notification
        this.notificationService.showInPageAlert('success', {
            title: '💧 Water Confirmed',
            message: message,
            duration: 3000
        });
        
        // If goal reached, show celebration notification
        if (this.dailyWaterCount === this.dailyGoal) {
            setTimeout(() => {
                this.notificationService.showInPageAlert('celebration', {
                    title: '🎉 Goal Reached!',
                    message: 'Congratulations on reaching your daily water goal! Keep up the good habits!',
                    duration: 5000
                });
            }, 1000);
        }
    }

    /**
     * Trigger water reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '💧 Time to Hydrate!';
        let message = 'Long work sessions can lead to dehydration, remember to drink water!';
        
        // Adjust message based on today's progress
        if (this.dailyWaterCount > 0) {
            const remaining = Math.max(0, this.dailyGoal - this.dailyWaterCount);
            if (remaining > 0) {
                message += `\nToday: ${this.dailyWaterCount} glasses, need ${remaining} more to reach goal`;
            } else {
                message = 'Keep up the great hydration habits!';
            }
        }
        
        // Show notification with confirm and snooze options
        this.notificationService.showNotification(
            'water',
            title,
            message,
            () => this.confirmDrink(), // Confirm drink callback
            () => this.snooze(),       // Snooze callback
            {
                actions: [
                    {
                        action: 'drink',
                        title: 'I Drank Water',
                        icon: '💧'
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
            dailyCount: this.dailyWaterCount,
            dailyGoal: this.dailyGoal
        });
        
        // Auto-reset timer (if user doesn't manually confirm)
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // Auto-reset after 1 minute
        
        console.log('Water reminder triggered');
    }

    /**
     * Get today's water intake statistics
     * @returns {Object} Today's water intake statistics
     */
    getDailyStats() {
        const totalAmount = this.drinkHistory.reduce((sum, record) => sum + record.amount, 0);
        const progress = Math.min(this.dailyWaterCount / this.dailyGoal, 1);
        
        return {
            count: this.dailyWaterCount,
            goal: this.dailyGoal,
            progress: progress,
            progressPercent: Math.round(progress * 100),
            totalAmount: totalAmount,
            lastDrinkTime: this.lastDrinkTime,
            history: [...this.drinkHistory],
            isGoalReached: this.dailyWaterCount >= this.dailyGoal
        };
    }

    /**
     * Set daily goal
     * @param {number} goal - Daily water goal (glasses)
     */
    setDailyGoal(goal) {
        if (goal > 0 && goal <= 20) { // Reasonable range
            this.dailyGoal = goal;
            this.saveDailyData();
            
            console.log(`Daily water goal set to ${goal} glasses`);
        } else {
            console.warn('Daily goal should be between 1-20 glasses');
        }
    }

    /**
     * Get drinking suggestion
     * @returns {string} Personalized drinking suggestion
     */
    getDrinkingSuggestion() {
        const now = new Date();
        const hour = now.getHours();
        const progress = this.dailyWaterCount / this.dailyGoal;
        
        // Give suggestions based on time and progress
        if (hour < 9) {
            return 'Drink a glass of warm water after waking up to help activate your body functions';
        } else if (hour < 12) {
            if (progress < 0.3) {
                return 'During morning work hours, remember to drink more water to stay energized';
            } else {
                return 'Your morning water intake is good, keep it up!';
            }
        } else if (hour < 14) {
            return 'Lunchtime - moderate water intake helps with digestion';
        } else if (hour < 18) {
            if (progress < 0.6) {
                return 'Afternoons can be tiring, drinking more water helps maintain focus';
            } else {
                return 'Your afternoon hydration is timely!';
            }
        } else if (hour < 20) {
            if (progress < 0.8) {
                return 'Moderate water intake before dinner, but not too much to affect appetite';
            } else {
                return 'Today\'s water intake is great, moderate amounts in the evening are fine';
            }
        } else {
            return 'Reduce water intake 1-2 hours before bed to avoid affecting sleep quality';
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
            suggestion: this.getDrinkingSuggestion()
        };
    }

    /**
     * Reset reminder timer (override parent method, add water-specific logic)
     */
    reset() {
        super.reset();
        
        // Check if daily data needs to be reset (new day)
        const today = new Date().toDateString();
        const savedData = localStorage.getItem('waterReminder_dailyData');
        
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
     * Destroy water reminder (override parent method)
     */
    destroy() {
        // Save data
        this.saveDailyData();
        
        // Call parent destroy method
        super.destroy();
        
        console.log('Water reminder destroyed');
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterReminder;
}