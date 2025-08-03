/**
 * Standup Reminder Class - Handles standup reminder logic
 * Extends ReminderManager, adds standup-specific functionality with time-based reminders
 */
class StandupReminder extends ReminderManager {
    /**
     * Create standup reminder instance
     * @param {Object} settings - Standup reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     * @param {StateManager} stateManager - State manager instance (optional)
     */
    constructor(settings, notificationService, stateManager = null) {
        super('standup', settings, notificationService, stateManager);
        
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
        
        // Use parent auto-reset mechanism
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

// Export for browser use
window.StandupReminder = StandupReminder;