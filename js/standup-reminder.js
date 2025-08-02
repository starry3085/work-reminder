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
        
        console.log('Standup reminder created');
    }

    /**
     * Trigger standup reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '🧘 Time to Stand Up!';
        const message = 'Sitting too long is bad for your health, get up and move around!';
        
        // Show simple notification without actions
        this.notificationService.showNotification(
            'standup',
            title,
            message
        );
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'triggered',
            isActive: true,
            isPaused: false,
            timeRemaining: 0
        });
        
        // Auto-reset timer after 5 seconds
        setTimeout(() => {
            if (this.isActive) {
                this.reset();
                console.log('Standup reminder auto-reset after 5 seconds');
            }
        }, 5000);
        
        console.log('Standup reminder triggered');
    }

    /**
     * Destroy standup reminder (override parent method)
     */
    destroy() {
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