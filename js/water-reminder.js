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
            dailyCount: this.dailyWaterCount
            lastDrinkTime: this.lastDrinkTime
        });
        
        console.log(`Water confirmed, ${this.dailyWaterCount} glasses today`);
    }

    /**
     * Show water confirmation message
     * @private
     */
    showDrinkConfirmation() {
        let message = `Great! You've had ${this.dailyWaterCount} glasses today`;
        
        // Show in-page notification
        this.notificationService.showInPageAlert(
            'water',
            '💧 Water Confirmed',
            message
        );
        

    }

    /**
     * Trigger water reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '💧 Time to Hydrate!';
        let message = 'Long work sessions can lead to dehydration, remember to drink water!';
        
        // Show today's water intake
        if (this.dailyWaterCount > 0) {
            message += `\nToday: ${this.dailyWaterCount} glasses so far`;
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
        
        return {
            count: this.dailyWaterCount,
            totalAmount: totalAmount,
            lastDrinkTime: this.lastDrinkTime,
            history: [...this.drinkHistory]
        };
    }



    /**
     * Get drinking suggestion
     * @returns {string} Personalized drinking suggestion
     */
    getDrinkingSuggestion() {
        const now = new Date();
        const hour = now.getHours();
        
        // Give suggestions based on time
        if (hour < 9) {
            return 'Drink a glass of warm water after waking up to help activate your body functions';
        } else if (hour < 12) {
            return 'During morning work hours, remember to drink water to stay energized';
        } else if (hour < 14) {
            return 'Lunchtime - moderate water intake helps with digestion';
        } else if (hour < 18) {
            return 'Afternoons can be tiring, drinking water helps maintain focus';
        } else if (hour < 20) {
            return 'Moderate water intake before dinner, but not too much to affect appetite';
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

// Export for browser use
window.WaterReminder = WaterReminder;