/**
 * Application Constants
 * Centralized configuration values for the Office Wellness Reminder app
 */

/**
 * Reminder Configuration Constants
 */
const REMINDER_CONSTANTS = {
    // Fixed reminder interval in minutes (MVP requirement)
    DEFAULT_INTERVAL_MINUTES: 30,
    
    // Demo mode interval in seconds (for quick demonstration)
    DEMO_INTERVAL_SECONDS: 30,
    
    // Timer update frequency in milliseconds
    UPDATE_INTERVAL_MS: 1000,
    
    // Snooze duration in minutes
    SNOOZE_DURATION_MINUTES: 5,
    
    // Auto-restart delay after reminder trigger (milliseconds)
    AUTO_RESTART_DELAY_MS: 5000
};

/**
 * UI Configuration Constants
 */
const UI_CONSTANTS = {
    // Mobile breakpoint in pixels
    MOBILE_BREAKPOINT: 768,
    
    // Update loop interval in milliseconds
    UPDATE_LOOP_INTERVAL_MS: 1000
};

/**
 * Storage Configuration Constants
 */
const STORAGE_CONSTANTS = {
    // Storage keys
    SETTINGS_KEY: 'officeWellnessSettings',
    
    // Session storage keys
    FORCE_REFRESH_FLAG: 'forceRefreshFlag'
};

/**
 * Demo Configuration Constants
 */
const DEMO_CONSTANTS = {
    // Demo timing configuration
    WATER_START_DELAY_MS: 0,        // Start water reminder immediately
    STANDUP_START_DELAY_MS: 10000,  // Start standup reminder after 10 seconds
    
    // Demo status messages
    STATUS_MESSAGES: {
        READY: 'Click Demo to see how reminders work',
        STARTING: 'Demo starting...',
        WATER_STARTING: 'Starting water reminder (FOR DEMO PURPOSE - 30s interval)',
        STANDUP_STARTING: 'Starting standup reminder (FOR DEMO PURPOSE - 30s interval)',
        RUNNING: 'Demo running - watch for notifications!',
        COMPLETED: 'Demo completed - reminders reset to normal'
    }
};

/**
 * Notification Configuration Constants
 */
const NOTIFICATION_CONSTANTS = {
    // Notification types
    TYPES: {
        WATER: 'water',
        STANDUP: 'standup'
    },
    
    // Notification messages
    MESSAGES: {
        WATER: {
            TITLE: '💧 Time to Hydrate!',
            BODY: 'Long work sessions can lead to dehydration, remember to drink water!'
        },
        STANDUP: {
            TITLE: '🧘 Time to Stand Up!',
            BODY: 'Sitting too long is bad for your health, get up and move around!'
        }
    }
};

// Export constants for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        REMINDER_CONSTANTS,
        UI_CONSTANTS,
        STORAGE_CONSTANTS,
        DEMO_CONSTANTS,
        NOTIFICATION_CONSTANTS
    };
}

// Export for browser use
window.REMINDER_CONSTANTS = REMINDER_CONSTANTS;
window.UI_CONSTANTS = UI_CONSTANTS;
window.STORAGE_CONSTANTS = STORAGE_CONSTANTS;
window.DEMO_CONSTANTS = DEMO_CONSTANTS;
window.NOTIFICATION_CONSTANTS = NOTIFICATION_CONSTANTS;