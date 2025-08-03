/**
 * Global Error Handler - Handles various errors and exceptions in the application
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.setupGlobalErrorHandling();
    }

    /**
     * Set up global error handling
     * @private
     */
    setupGlobalErrorHandling() {
        // Handle uncaught Promise errors
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                error: event.reason,
                message: event.reason?.message || 'Unhandled Promise error',
                timestamp: Date.now()
            });
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'runtime',
                error: event.error,
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
            
            // Prevent error from showing in console
            event.preventDefault();
        });
    }

    /**
     * Handle error
     * @param {Object} errorInfo - Error information object
     */
    handleError(errorInfo) {
        console.error('Application error:', errorInfo);
        
        // Add to error log
        this.logError(errorInfo);
        
        // Execute different handling based on error type
        switch (errorInfo.type) {
            case 'storage':
                return this.handleStorageError(errorInfo);
            case 'notification':
                return this.handleNotificationError(errorInfo);
            case 'audio':
                return this.handleAudioError(errorInfo);
            case 'timer':
                return this.handleTimerError(errorInfo);
            case 'compatibility':
                return this.handleCompatibilityError(errorInfo);
            case 'promise':
            case 'runtime':
            default:
                return this.handleGenericError(errorInfo);
        }
    }

    /**
     * Log error to log
     * @param {Object} errorInfo - Error information
     * @private
     */
    logError(errorInfo) {
        // Limit log size
        if (this.errorLog.length >= this.maxLogSize) {
            this.errorLog.shift(); // Remove oldest error
        }
        
        this.errorLog.push(errorInfo);
        
        // Try to save error log to local storage
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
        } catch (e) {
            // If local storage is unavailable, ignore error
            console.warn('Unable to save error log to local storage');
        }
    }

    /**
     * Handle storage-related errors
     * @param {Object} errorInfo - Error information
     * @private
     */
    handleStorageError(errorInfo) {
        // Implement storage fallback strategy
        console.warn('Storage functionality unavailable, will use memory storage');
        
        // Return user-friendly error message
        return {
            title: 'Storage Functionality Limited',
            message: 'Local storage unavailable, your settings cannot be saved after the session ends',
            type: 'warning',
            solution: 'Please check browser settings to ensure websites are allowed to use local storage'
        };
    }

    /**
     * Handle notification-related errors
     * @param {Object} errorInfo - Error information
     * @private
     */
    handleNotificationError(errorInfo) {
        console.warn('Notification functionality unavailable, will use in-page notifications');
        
        return {
            title: 'Notification Functionality Limited',
            message: 'System notification functionality unavailable, will use in-page notifications instead',
            type: 'info',
            solution: 'Please check browser notification permission settings'
        };
    }

    /**
     * Handle audio-related errors
     * @param {Object} errorInfo - Error information
     * @private
     */
    handleAudioError(errorInfo) {
        console.warn('Audio functionality unavailable, will use silent notifications');
        
        return {
            title: 'Audio Functionality Limited',
            message: 'Reminder sounds cannot be played, will use silent notifications',
            type: 'info',
            solution: 'Please check browser audio permission settings'
        };
    }

    /**
     * Handle timer-related errors
     * @param {Object} errorInfo - Error information
     * @private
     */
    handleTimerError(errorInfo) {
        console.warn('Timer error, will reinitialize timer');
        
        return {
            title: 'Timer Error',
            message: 'Reminder timer encountered an issue and has been automatically reset',
            type: 'warning',
            solution: 'If the problem persists, please refresh the page'
        };
    }

    /**
     * Handle compatibility-related errors
     * @param {Object} errorInfo - Error information
     * @private
     */
    handleCompatibilityError(errorInfo) {
        console.warn('Browser compatibility issue:', errorInfo.message);
        
        return {
            title: 'Browser Compatibility Issue',
            message: errorInfo.message || 'Your browser may not support some features',
            type: 'warning',
            solution: 'Please try using the latest version of Chrome, Firefox, Safari, or Edge'
        };
    }

    /**
     * Handle generic errors
     * @param {Object} errorInfo - Error information
     * @private
     */
    handleGenericError(errorInfo) {
        console.error('Uncategorized error:', errorInfo);
        
        return {
            title: 'Application Error',
            message: 'The application encountered a problem',
            type: 'error',
            solution: 'Please refresh the page and try again. If the problem persists, clear your browser cache'
        };
    }

    /**
     * Get user-friendly error information
     * @param {Error} error - Error object
     * @returns {Object} User-friendly error information
     */
    getUserFriendlyError(error) {
        // Return friendly information based on error type
        if (error.message && typeof error.message === 'string') {
            if (error.message.includes('localStorage') || error.message.includes('storage')) {
                return this.handleStorageError({ type: 'storage', error });
            } else if (error.message.includes('notification') || error.message.includes('permission')) {
                return this.handleNotificationError({ type: 'notification', error });
            } else if (error.message.includes('audio') || error.message.includes('play')) {
                return this.handleAudioError({ type: 'audio', error });
            } else if (error.message.includes('timer') || error.message.includes('interval')) {
                return this.handleTimerError({ type: 'timer', error });
            }
        }
        
        // Default error message
        return this.handleGenericError({ type: 'generic', error });
    }

    /**
     * Get error log
     * @returns {Array} Error log array
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('errorLog');
        } catch (e) {
            // Ignore errors
        }
    }
}

// Export for use by other scripts
window.ErrorHandler = ErrorHandler;