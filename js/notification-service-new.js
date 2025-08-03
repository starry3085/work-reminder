/**
 * Notification Service - Manages browser notifications and in-page alerts
 */
class NotificationService {
    constructor() {
        this.hasPermission = false;
        this.isSupported = 'Notification' in window;
        this.soundEnabled = true;
    }

    /**
     * Request notification permission
     * @returns {Promise<boolean>} Whether permission granted
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.warn('Browser does not support notifications');
            return false;
        }

        try {
            let permission = Notification.permission;
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            
            const granted = permission === 'granted';
            this.hasPermission = granted;
            
            if (granted) {
                console.log('Notification permission granted');
            } else {
                console.log('Notification permission denied');
            }
            
            return granted;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    }

    /**
     * Show notification
     * @param {string} type - Notification type ('water' | 'standup')
     * @param {string} title - Notification title
     * @param {string} message - Notification content
     * @returns {boolean} Whether successfully displayed
     */
    showNotification(type, title, message) {
        console.log(`Showing notification: ${title} - ${message}`);
        
        // Try browser notification first if supported
        if (this.hasPermission) {
            this.showBrowserNotification(type, title, message);
        }
        
        // Always show in-page notification as fallback
        this.showInPageAlert(type, title, message);
        
        return true;
    }

    /**
     * Show browser notification
     */
    showBrowserNotification(type, title, message) {
        if (!this.isSupported || !this.hasPermission) {
            return false;
        }

        try {
            const notification = new Notification(title, {
                body: message,
                icon: 'assets/default-icon.png',
                tag: `wellness-reminder-${type}`
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            setTimeout(() => {
                notification.close();
            }, 5000);

            return true;
        } catch (error) {
            console.error('Error displaying browser notification:', error);
            return false;
        }
    }

    /**
     * Show in-page alert
     */
    showInPageAlert(type, title, message) {
        // Remove existing notification
        const existing = document.getElementById('wellness-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification container
        const alertContainer = document.createElement('div');
        alertContainer.id = 'wellness-notification';
        alertContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        alertContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 24px;">${type === 'water' ? '💧' : '🧘'}</div>
                <div>
                    <h3 style="margin: 0; font-size: 16px;">${title}</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: auto;
                ">×</button>
            </div>
        `;

        document.body.appendChild(alertContainer);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alertContainer.parentNode) {
                alertContainer.remove();
            }
        }, 5000);
    }

    /**
     * Check if browser supports notifications
     * @returns {boolean}
     */
    isNotificationSupported() {
        return this.isSupported;
    }

    /**
     * Set sound enabled/disabled
     * @param {boolean} enabled
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
}

// Export for browser use
window.NotificationService = NotificationService;