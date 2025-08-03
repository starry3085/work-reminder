/**
 * Water Reminder Class - Handles water reminder logic
 * Extends ReminderManager, simplified for MVP
 */
class WaterReminder extends ReminderManager {
    /**
     * Create water reminder instance
     * @param {Object} settings - Water reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     * @param {StateManager} stateManager - State manager instance (optional)
     */
    constructor(settings, notificationService, stateManager = null) {
        super('water', settings, notificationService, stateManager);
        
        console.log('Water reminder created');
    }



    /**
     * Trigger water reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '💧 Time to Hydrate!';
        const message = 'Long work sessions can lead to dehydration, remember to drink water!';
        
        // Show simple notification without actions
        this.notificationService.showNotification(
            'water',
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
        console.log('Water reminder triggered');
    }

    /**
     * Destroy water reminder (override parent method)
     */
    destroy() {
        // Call parent destroy method
        super.destroy();
        
        console.log('Water reminder destroyed');
    }
}

// Export for browser use
window.WaterReminder = WaterReminder;