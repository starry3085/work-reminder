/**
 * Water Reminder Class - Handles water reminder logic
 * Extends ReminderManager, simplified for MVP
 */
class WaterReminder extends ReminderManager {
    /**
     * Create water reminder instance
     * @param {string} type - Reminder type ('water')
     * @param {Object} settings - Water reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(type, settings, notificationService, stateManager) {
        super(type, settings, notificationService, stateManager);
        
        console.log('Water reminder created');
    }



    /**
     * Trigger water reminder - use parent implementation
     * @private
     */
    triggerReminder() {
        // Use parent class implementation for consistency
        super.triggerReminder();
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