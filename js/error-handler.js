/**
 * Simple Error Handler - Basic error logging and user notifications
 */
class ErrorHandler {
    constructor(options = {}) {
        this.options = {
            onError: null,
            maxLogSize: 50,
            ...options
        };
        
        this.errorLog = [];
        this.setupGlobalErrorHandling();
    }

    /**
     * Set up basic global error handling
     * @private
     */
    setupGlobalErrorHandling() {
        // Handle uncaught Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            this.handleError({
                type: 'promise',
                error: event.reason,
                message: event.reason?.message || 'Unhandled Promise rejection'
            });
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            event.preventDefault();
            this.handleError({
                type: 'runtime',
                error: event.error,
                message: event.message
            });
        });
    }

    /**
     * Main error handling entry point
     * @param {Object} errorInfo - Error information
     */
    handleError(errorInfo) {
        const logEntry = {
            ...errorInfo,
            timestamp: Date.now()
        };

        this.errorLog.push(logEntry);

        // Maintain log size limit
        if (this.errorLog.length > this.options.maxLogSize) {
            this.errorLog.shift();
        }

        // Console logging
        console.error(`[${errorInfo.type}] ${errorInfo.message}`, errorInfo);
        
        // Notify callback if provided
        if (this.options.onError && typeof this.options.onError === 'function') {
            try {
                this.options.onError(errorInfo);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        }
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            last24Hours: 0,
            lastHour: 0
        };

        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            if (error.timestamp > oneHourAgo) stats.lastHour++;
            if (error.timestamp > oneDayAgo) stats.last24Hours++;
        });

        return stats;
    }

    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * Get recent errors
     * @param {number} count - Number of recent errors to return
     * @returns {Array} Recent errors
     */
    getRecentErrors(count = 10) {
        return this.errorLog.slice(-count);
    }

    /**
     * Cleanup resources
     */
    destroy() {
        try {
            // Remove event listeners
            window.removeEventListener('unhandledrejection', this.handleGlobalError);
            window.removeEventListener('error', this.handleGlobalError);
            
            // Persist final error log
            this.persistErrorLog();
            
            console.log('ErrorHandler cleaned up');
        } catch (error) {
            console.warn('Error during ErrorHandler cleanup:', error);
        }
    }
}

// Export for global use
window.ErrorHandler = ErrorHandler;

// Auto-initialize if not explicitly created
if (typeof window !== 'undefined' && !window.errorHandlerInstance) {
    window.errorHandlerInstance = new ErrorHandler();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}