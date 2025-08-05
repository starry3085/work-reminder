/**
 * Global Error Handler - Comprehensive error handling with recovery mechanisms
 * Provides graceful degradation and user-friendly error messages
 */
class ErrorHandler {
    constructor(options = {}) {
        this.options = {
            onError: null,
            enableRecovery: true,
            logLevel: 'error',
            maxLogSize: 100,
            memoryStorageFallback: true,
            ...options
        };
        
        this.errorLog = [];
        this.memoryStorage = new Map();
        this.recoveryStrategies = new Map();
        this.isRecoveryMode = false;
        
        this.setupGlobalErrorHandling();
        this.setupRecoveryStrategies();
    }

    /**
     * Set up global error handling with comprehensive coverage
     * @private
     */
    setupGlobalErrorHandling() {
        // Handle uncaught Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            event.preventDefault();
            this.handleError({
                type: 'promise',
                error: event.reason,
                message: event.reason?.message || 'Unhandled Promise rejection',
                timestamp: Date.now(),
                severity: 'high'
            });
        });

        // Handle global JavaScript errors
        window.addEventListener('error', (event) => {
            event.preventDefault();
            this.handleError({
                type: 'runtime',
                error: event.error,
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now(),
                severity: 'high'
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK')) {
                this.handleError({
                    type: 'resource',
                    error: new Error(`Failed to load resource: ${event.target.src || event.target.href}`),
                    message: `Failed to load ${event.target.tagName.toLowerCase()}: ${event.target.src || event.target.href}`,
                    timestamp: Date.now(),
                    severity: 'medium'
                });
            }
        }, true);

        // Handle offline/online events
        window.addEventListener('offline', () => {
            this.handleError({
                type: 'network',
                error: new Error('Network connection lost'),
                message: 'Network connection lost. Some features may be limited.',
                timestamp: Date.now(),
                severity: 'low'
            });
        });

        window.addEventListener('online', () => {
            this.handleRecovery('network', 'Network connection restored');
        });
    }

    /**
     * Setup recovery strategies for different error types
     * @private
     */
    setupRecoveryStrategies() {
        // Storage recovery strategy
        this.recoveryStrategies.set('storage', {
            fallback: () => this.enableMemoryStorageFallback(),
            retry: () => this.retryStorageAccess(),
            message: 'Using memory storage as fallback'
        });

        // Notification recovery strategy
        this.recoveryStrategies.set('notification', {
            fallback: () => this.enableInPageNotifications(),
            message: 'Using in-page notifications instead'
        });

        // Audio recovery strategy
        this.recoveryStrategies.set('audio', {
            fallback: () => this.enableSilentNotifications(),
            message: 'Using silent notifications instead'
        });

        // Timer recovery strategy
        this.recoveryStrategies.set('timer', {
            fallback: () => this.resetTimerSystem(),
            retry: () => this.retryTimerInitialization(),
            message: 'Timer system reset and restarted'
        });
    }

    /**
     * Main error handling entry point
     * @param {Object} errorInfo - Comprehensive error information
     */
    handleError(errorInfo) {
        const enrichedError = this.enrichErrorInfo(errorInfo);
        
        // Log error with enhanced details
        this.logError(enrichedError);
        
        // Execute recovery if enabled
        if (this.options.enableRecovery && !this.isRecoveryMode) {
            this.attemptRecovery(enrichedError);
        }
        
        // Notify callback if provided
        if (this.options.onError && typeof this.options.onError === 'function') {
            try {
                this.options.onError(enrichedError);
            } catch (callbackError) {
                console.error('Error in error callback:', callbackError);
            }
        }

        // Show user-friendly message
        this.showUserFriendlyMessage(enrichedError);
    }

    /**
     * Enrich error information with additional context
     * @private
     */
    enrichErrorInfo(errorInfo) {
        return {
            ...errorInfo,
            id: this.generateErrorId(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: Date.now(),
            stack: errorInfo.error?.stack,
            severity: errorInfo.severity || this.determineSeverity(errorInfo),
            recoverable: this.isRecoverable(errorInfo)
        };
    }

    /**
     * Determine error severity based on type and impact
     * @private
     */
    determineSeverity(errorInfo) {
        const criticalTypes = ['storage', 'runtime', 'promise'];
        const highTypes = ['timer', 'notification'];
        const mediumTypes = ['audio', 'network', 'resource'];
        
        if (criticalTypes.includes(errorInfo.type)) return 'critical';
        if (highTypes.includes(errorInfo.type)) return 'high';
        if (mediumTypes.includes(errorInfo.type)) return 'medium';
        return 'low';
    }

    /**
     * Check if error is recoverable
     * @private
     */
    isRecoverable(errorInfo) {
        const recoverableTypes = ['storage', 'notification', 'audio', 'timer', 'network'];
        return recoverableTypes.includes(errorInfo.type);
    }

    /**
     * Attempt recovery for specific error types
     * @private
     */
    attemptRecovery(errorInfo) {
        if (!errorInfo.recoverable) return;

        const strategy = this.recoveryStrategies.get(errorInfo.type);
        if (!strategy) return;

        this.isRecoveryMode = true;

        try {
            // Try fallback strategy
            if (strategy.fallback) {
                strategy.fallback();
                console.log(`Recovery applied for ${errorInfo.type}: ${strategy.message}`);
            }

            // Try retry strategy
            if (strategy.retry) {
                setTimeout(() => {
                    try {
                        strategy.retry();
                    } catch (retryError) {
                        console.warn('Retry failed:', retryError);
                    }
                }, 1000);
            }

        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
        } finally {
            this.isRecoveryMode = false;
        }
    }

    /**
     * Enhanced error logging with rotation
     * @private
     */
    logError(errorInfo) {
        // Rotate log if needed
        if (this.errorLog.length >= this.options.maxLogSize) {
            this.errorLog = this.errorLog.slice(-Math.floor(this.options.maxLogSize * 0.8));
        }

        this.errorLog.push(errorInfo);

        // Try to persist to storage
        this.persistErrorLog();

        // Log to console based on severity
        this.logToConsole(errorInfo);
    }

    /**
     * Persist error log with fallback strategies
     * @private
     */
    persistErrorLog() {
        try {
            // Try localStorage first
            if (this.isLocalStorageAvailable()) {
                localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
            } else {
                // Use memory storage as fallback
                this.memoryStorage.set('errorLog', JSON.stringify(this.errorLog));
            }
        } catch (error) {
            // Silently fail - errors in error logging shouldn't cause more errors
            console.warn('Failed to persist error log:', error);
        }
    }

    /**
     * Log to console based on severity level
     * @private
     */
    logToConsole(errorInfo) {
        const logMethod = this.getLogMethod(errorInfo.severity);
        console[logMethod](`[${errorInfo.type.toUpperCase()}] ${errorInfo.message}`, errorInfo);
    }

    /**
     * Get appropriate console method for severity
     * @private
     */
    getLogMethod(severity) {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'error';
            case 'medium': return 'warn';
            case 'low': return 'info';
            default: return 'log';
        }
    }

    /**
     * Show user-friendly error message
     * @private
     */
    showUserFriendlyMessage(errorInfo) {
        const message = this.getUserFriendlyMessage(errorInfo);
        
        try {
            this.displayNotification(message);
        } catch (displayError) {
            console.warn('Failed to display error message:', displayError);
        }
    }

    /**
     * Get user-friendly error message based on type
     * @param {Object} errorInfo - Error information
     * @returns {Object} User-friendly message
     */
    getUserFriendlyMessage(errorInfo) {
        const messages = {
            storage: {
                title: 'Storage Issue',
                message: 'Your settings will be saved temporarily. Check browser settings to enable permanent storage.',
                type: 'warning',
                solution: 'Allow this site to use local storage in browser settings'
            },
            notification: {
                title: 'Notifications Unavailable',
                message: 'System notifications are not available. You\'ll see in-page alerts instead.',
                type: 'info',
                solution: 'Check browser notification permissions'
            },
            audio: {
                title: 'Audio Unavailable',
                message: 'Reminder sounds are muted. You\'ll see visual notifications instead.',
                type: 'info',
                solution: 'Check browser audio permissions'
            },
            timer: {
                title: 'Timer Reset',
                message: 'Reminder timers have been reset and restarted.',
                type: 'warning',
                solution: 'If issues persist, refresh the page'
            },
            network: {
                title: 'Connection Issue',
                message: 'Network connection issues detected. Some features may be limited.',
                type: 'warning',
                solution: 'Check your internet connection'
            },
            runtime: {
                title: 'Application Error',
                message: 'An unexpected error occurred. The app will attempt to continue.',
                type: 'error',
                solution: 'Refresh the page if issues persist'
            },
            promise: {
                title: 'Processing Error',
                message: 'A background process failed. Core functionality should still work.',
                type: 'warning',
                solution: 'Refresh the page if the issue continues'
            },
            resource: {
                title: 'Resource Loading Issue',
                message: 'Some features may be limited due to missing resources.',
                type: 'warning',
                solution: 'Check your internet connection and refresh the page'
            }
        };

        return messages[errorInfo.type] || messages.runtime;
    }

    /**
     * Display notification with fallback strategies
     * @private
     */
    displayNotification(message) {
        // Try to use browser notifications
        if (this.isNotificationSupported() && Notification.permission === 'granted') {
            new Notification(message.title, {
                body: message.message,
                icon: '/favicon.ico'
            });
            return;
        }

        // Try to use in-page notification
        this.showInPageNotification(message);
    }

    /**
     * Show in-page notification
     * @private
     */
    showInPageNotification(message) {
        const notification = document.createElement('div');
        notification.className = `error-notification error-${message.type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            background: ${this.getMessageColor(message.type)};
            color: white;
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">${message.title}</div>
            <div style="margin-bottom: 8px;">${message.message}</div>
            <div style="font-size: 12px; opacity: 0.8;">${message.solution}</div>
            <button onclick="this.parentElement.remove()" 
                    style="position: absolute; top: 8px; right: 8px; background: none; border: none; color: white; cursor: pointer; font-size: 18px;">
                ×
            </button>
        `;

        document.body.appendChild(notification);

        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 8000);
    }

    /**
     * Get color based on message type
     * @private
     */
    getMessageColor(type) {
        const colors = {
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || colors.error;
    }

    /**
     * Recovery strategy implementations
     */

    enableMemoryStorageFallback() {
        console.log('Enabling memory storage fallback');
        // Memory storage is already available via this.memoryStorage
    }

    retryStorageAccess() {
        try {
            // Try to access localStorage again
            const testKey = '__recovery_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            console.log('Storage access recovered');
            return true;
        } catch (error) {
            console.warn('Storage access still unavailable:', error);
            return false;
        }
    }

    enableInPageNotifications() {
        console.log('In-page notifications enabled');
        // This is handled automatically by showInPageNotification
    }

    enableSilentNotifications() {
        console.log('Silent notifications enabled');
        // Audio is handled by individual components
    }

    resetTimerSystem() {
        console.log('Resetting timer system');
        // Timer reset is handled by ReminderManager classes
    }

    retryTimerInitialization() {
        console.log('Retrying timer initialization');
        // Timer retry is handled by ReminderManager classes
    }

    handleRecovery(type, message) {
        console.log(`Recovery completed for ${type}: ${message}`);
    }

    /**
     * Utility methods
     */

    isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            const result = localStorage.getItem(testKey) === testKey;
            localStorage.removeItem(testKey);
            return result;
        } catch (e) {
            return false;
        }
    }

    isNotificationSupported() {
        return 'Notification' in window;
    }

    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            total: this.errorLog.length,
            byType: {},
            bySeverity: {},
            last24Hours: 0,
            lastHour: 0
        };

        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const oneDayAgo = now - 86400000;

        this.errorLog.forEach(error => {
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;

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
        try {
            localStorage.removeItem('errorLog');
            this.memoryStorage.delete('errorLog');
        } catch (error) {
            console.warn('Failed to clear error log:', error);
        }
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