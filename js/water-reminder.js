/**
 * Water Reminder Class - Handles water reminder logic
 * Extends ReminderManager, simplified for MVP
 */
class WaterReminder extends ReminderManager {
    /**
     * Create water reminder instance
     * @param {Object} settings - Water reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     */
    constructor(settings, notificationService) {
        super('water', settings, notificationService);
        
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
        
        // Auto-reset timer after 5 seconds
        setTimeout(() => {
            if (this.isActive) {
                this.reset();
                console.log('Water reminder auto-reset after 5 seconds');
            }
        }, 5000);
        
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

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterReminder;
}

// Export for browser use
window.WaterReminder = WaterReminder;