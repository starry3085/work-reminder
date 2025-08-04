/**
 * Standup Reminder Class - Handles standup reminder logic
 * Extends ReminderManager, adds standup-specific functionality with time-based reminders
 */
class StandupReminder extends ReminderManager {
    /**
     * Create standup reminder instance
     * @param {string} type - Reminder type ('standup')
     * @param {Object} settings - Standup reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     * @param {StateManager} stateManager - State manager instance
     */
    constructor(type, settings, notificationService, stateManager) {
        super(type, settings, notificationService, stateManager);
        
        console.log('Standup reminder created');
    }

    /**
     * Trigger standup reminder - use parent implementation
     * @private
     */
    triggerReminder() {
        // Use parent class implementation for consistency
        super.triggerReminder();
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