/**
 * Notification Service - Manages browser notifications and in-page alerts
 */
class NotificationService {
    constructor() {
        this.hasPermission = false;
        this.isSupported = 'Notification' in window;
        this.soundEnabled = true;
        this.audioContext = null;
        this.audioFiles = {
            water: null,
            standup: null,
            default: null
        };
        this.currentCallbacks = null;

        // Check if permission already granted
        if (this.isSupported && Notification.permission === 'granted') {
            this.hasPermission = true;
        }

        // Initialize audio context (if supported)
        this.initAudioContext();
    }

    /**
     * Initialize audio context
     * @private
     */
    initAudioContext() {
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContextClass();
                console.log('Audio context initialized successfully');
            } else {
                console.warn('Browser does not support Web Audio API, will use HTML5 Audio');
            }
        } catch (error) {
            console.warn('Failed to initialize audio context:', error);
            this.audioContext = null;
        }
    }

    /**
     * Request notification permission - unified permission management
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

            // Update permission status uniformly
            this.updatePermissionStatus(granted);

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
     * Update permission status
     * @private
     * @param {boolean} granted - Whether permission granted
     */
    updatePermissionStatus(granted) {
        this.hasPermission = granted;

        // Notify application of permission status change
        if (this.permissionChangeCallback) {
            this.permissionChangeCallback(granted);
        }
    }

    /**
     * Set permission change callback
     * @param {Function} callback - Permission change callback function
     */
    setPermissionChangeCallback(callback) {
        this.permissionChangeCallback = callback;
    }

    /**
     * Show notification - unified for MVP
     * @param {string} type - Notification type ('water' | 'standup')
     * @param {string} title - Notification title
     * @param {string} message - Notification content
     * @param {Function} onDone - Callback when user clicks Done
     * @param {Function} onSnooze - Callback when user clicks Snooze
     * @returns {boolean} Whether successfully displayed
     */
    showNotification(type, title, message, onDone, onSnooze) {
        // Store callbacks for modal handling
        this.currentCallbacks = { onDone, onSnooze, type };
        
        // Unified notification strategy
        const notificationShown = this.showUnifiedNotification(type, title, message);

        // Show modal notification with action buttons
        this.showModalNotification(type, title, message);

        // Play sound (synchronous)
        if (this.soundEnabled) {
            this.playSound(type);
        }

        return notificationShown;
    }

    /**
     * Unified notification display
     * @private
     */
    showUnifiedNotification(type, title, message) {
        let shown = false;

        // Try browser notification first if supported
        if (this.hasPermission) {
            shown = this.showBrowserNotification(type, title, message);
        }

        // Always show in-page notification as fallback
        this.showInPageAlert(type, title, message);

        return shown || true; // At least in-page notification will show
    }

    /**
     * Show browser notification
     * @param {string} type - Notification type ('water' | 'standup')
     * @param {string} title - Notification title
     * @param {string} message - Notification content
     * @returns {boolean} Whether successfully displayed
     */
    showBrowserNotification(type, title, message) {
        if (!this.isSupported) {
            console.warn('Browser does not support notifications, using in-page alerts');
            return false;
        }

        if (!this.hasPermission) {
            console.warn('No notification permission, using in-page alerts');
            return false;
        }

        try {
            const options = {
                body: message,
                icon: this.getNotificationIcon(type),
                badge: this.getNotificationIcon(type),
                tag: `wellness-reminder-${type}`,
                requireInteraction: false, // No user interaction required
                silent: !this.soundEnabled,
                vibrate: [200, 100, 200] // Vibration pattern (mobile devices)
            };

            const notification = new Notification(title, options);

            // Set click event - simple window focus
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto-close notification (after 5 seconds)
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
     * Show in-page alert - simplified for MVP
     * @param {string} type - Reminder type ('water' | 'standup')
     * @param {string} title - Reminder title
     * @param {string} message - Reminder content
     */
    showInPageAlert(type, title, message) {
        // Remove existing notification
        this.hideInPageAlert();

        // Create notification container
        const alertContainer = document.createElement('div');
        alertContainer.className = `notification-alert notification-${type}`;
        alertContainer.id = 'wellness-notification';

        // Simplified layout without buttons
        alertContainer.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationEmoji(type)}
                </div>
                <div class="notification-text">
                    <h3 class="notification-title">${title}</h3>
                    <p class="notification-message">${message}</p>
                </div>
                <button class="btn btn-close" id="close-btn">×</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(alertContainer);

        // Bind close event only
        const closeBtn = alertContainer.querySelector('#close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideInPageAlert();
            });
        }

        // Show with animation
        setTimeout(() => alertContainer.classList.add('show'), 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (document.getElementById('wellness-notification')) {
                this.hideInPageAlert();
            }
        }, 5000);
    }

    /**
     * Play reminder sound
     * @param {string} type - Sound type
     */
    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            // Create audio context (if supported)
            if (this.audioContext) {
                this.playBeepSound(type);
            } else {
                // Fallback: use HTML5 Audio
                this.playAudioFile(type);
            }
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
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

    /**
     * Get notification icon URL
     * @param {string} type - Notification type ('water' | 'standup')
     * @returns {string} Icon URL
     */
    getNotificationIcon(type) {
        // Return different icon URLs based on type
        if (type === 'water') {
            return 'assets/water-icon.png';
        } else if (type === 'standup') {
            return 'assets/standup-icon.png';
        }
        return 'assets/default-icon.png';
    }

    /**
     * Get notification emoji
     * @param {string} type - Notification type ('water' | 'standup')
     * @returns {string} Emoji HTML
     */
    getNotificationEmoji(type) {
        if (type === 'water') {
            return '💧';
        } else if (type === 'standup') {
            return '🧘';
        }
        return '⏰';
    }

    /**
     * Show modal notification using HTML overlay
     * @param {string} type - Notification type
     * @param {string} title - Notification title  
     * @param {string} message - Notification message
     */
    showModalNotification(type, title, message) {
        const overlay = document.getElementById('notification-overlay');
        const titleElement = document.getElementById('notification-title');
        const messageElement = document.getElementById('notification-message');
        const iconElement = document.getElementById('notification-icon');
        const confirmBtn = document.getElementById('notification-confirm');
        const snoozeBtn = document.getElementById('notification-snooze');

        if (!overlay || !titleElement || !messageElement || !iconElement || !confirmBtn || !snoozeBtn) {
            console.warn('Modal notification elements not found');
            return;
        }

        // Update content
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Update icon class
        iconElement.className = `notification-icon ${type}-icon`;
        
        // Show overlay
        overlay.style.display = 'flex';
        setTimeout(() => overlay.classList.add('show'), 10);

        // Remove existing event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newSnoozeBtn = snoozeBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        snoozeBtn.parentNode.replaceChild(newSnoozeBtn, snoozeBtn);

        // Add event listeners
        newConfirmBtn.addEventListener('click', () => {
            this.handleDoneClick();
        });

        newSnoozeBtn.addEventListener('click', () => {
            this.handleSnoozeClick();
        });

        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (overlay.classList.contains('show')) {
                this.hideModalNotification();
            }
        }, 30000);
    }

    /**
     * Handle Done button click with analytics tracking
     */
    handleDoneClick() {
        if (this.currentCallbacks && this.currentCallbacks.onDone) {
            // Track analytics event
            this.trackReminderCompletion(this.currentCallbacks.type);
            
            // Execute callback
            this.currentCallbacks.onDone();
        }
        
        this.hideModalNotification();
    }

    /**
     * Handle Snooze button click
     */
    handleSnoozeClick() {
        if (this.currentCallbacks && this.currentCallbacks.onSnooze) {
            this.currentCallbacks.onSnooze();
        }
        
        this.hideModalNotification();
    }

    /**
     * Track reminder completion for analytics
     * @param {string} type - Reminder type
     */
    trackReminderCompletion(type) {
        try {
            // Get global analytics instance
            if (window.app && window.app.analytics) {
                if (type === 'water') {
                    window.app.analytics.trackWaterCompleted();
                } else if (type === 'standup') {
                    window.app.analytics.trackStandupCompleted();
                }
            } else {
                console.warn('Analytics not available for tracking');
            }
        } catch (error) {
            console.warn('Failed to track reminder completion:', error);
        }
    }

    /**
     * Hide modal notification
     */
    hideModalNotification() {
        const overlay = document.getElementById('notification-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
        
        // Clear callbacks
        this.currentCallbacks = null;
    }

    /**
     * Hide in-page notification
     */
    hideInPageAlert() {
        const existingAlert = document.getElementById('wellness-notification');
        if (existingAlert) {
            existingAlert.classList.remove('show');
            setTimeout(() => {
                if (existingAlert.parentNode) {
                    existingAlert.parentNode.removeChild(existingAlert);
                }
            }, 300); // Wait for fade out animation to complete
        }
    }

    /**
     * Play beep sound using Web Audio API
     * @param {string} type - Sound type
     */
    playBeepSound(type) {
        try {
            if (!this.audioContext) {
                this.initAudioContext();
                if (!this.audioContext) {
                    throw new Error('Audio context not available');
                }
            }

            // If audio context suspended (browser policy), try to resume
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // Create audio nodes
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Set different tones based on reminder type
            if (type === 'water') {
                oscillator.type = 'sine';
                oscillator.frequency.value = 800; // Higher tone
                gainNode.gain.value = 0.1;

                // Create water drop sound effect
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

                // Stop after 0.3 seconds
                setTimeout(() => {
                    oscillator.stop();
                }, 300);
            } else if (type === 'standup') {
                oscillator.type = 'triangle';
                oscillator.frequency.value = 600; // Lower tone
                gainNode.gain.value = 0.1;

                // Create double-tone reminder sound
                oscillator.start();

                // First tone
                setTimeout(() => {
                    oscillator.frequency.value = 700;
                }, 200);

                // Stop after 0.4 seconds
                setTimeout(() => {
                    oscillator.stop();
                }, 400);
            } else {
                // Default reminder sound
                oscillator.type = 'sine';
                oscillator.frequency.value = 700;
                gainNode.gain.value = 0.1;

                oscillator.start();

                // Stop after 0.2 seconds
                setTimeout(() => {
                    oscillator.stop();
                }, 200);
            }
        } catch (error) {
            console.warn('Web Audio API not available:', error);
            // Fallback to HTML5 Audio
            this.playAudioFile(type);
        }
    }

    /**
     * Play audio file
     * @param {string} type - Sound type
     */
    playAudioFile(type) {
        try {
            // Check if cached audio object exists
            if (!this.audioFiles[type]) {
                const audio = new Audio();
                audio.volume = 0.5;

                // Set different sound effects based on type
                if (type === 'water') {
                    audio.src = 'assets/water-reminder.mp3';
                } else if (type === 'standup') {
                    audio.src = 'assets/standup-reminder.mp3';
                } else {
                    audio.src = 'assets/notification.mp3';
                }

                // Cache audio object
                this.audioFiles[type] = audio;
            }

            // Reset audio and play
            const audio = this.audioFiles[type];
            audio.currentTime = 0;

            audio.play().catch(error => {
                console.warn('Failed to play audio:', error);

                // If autoplay policy issue, try creating new audio object
                if (error.name === 'NotAllowedError') {
                    // Create new audio object, might bypass some browser autoplay restrictions
                    const newAudio = new Audio();
                    newAudio.volume = 0.5;

                    if (type === 'water') {
                        newAudio.src = 'assets/water-reminder.mp3';
                    } else if (type === 'standup') {
                        newAudio.src = 'assets/standup-reminder.mp3';
                    } else {
                        newAudio.src = 'assets/notification.mp3';
                    }

                    // Try playing newly created audio
                    newAudio.play().catch(e => {
                        console.warn('Second attempt to play audio failed:', e);
                    });
                }
            });
        } catch (error) {
            console.warn('HTML5 Audio not available:', error);
        }
    }

    /**
     * Check current notification permission status
     * @returns {string} Permission status ('granted', 'denied', 'default', 'unsupported')
     */
    checkPermissionStatus() {
        if (!this.isSupported) {
            return 'unsupported';
        }
        return Notification.permission;
    }

    /**
     * Show notification permission request prompt
     * @param {Function} onRequestClick - Callback for request permission button click
     */
    showPermissionPrompt(onRequestClick) {
        // Create permission request prompt container
        const promptContainer = document.createElement('div');
        promptContainer.className = 'permission-prompt';
        promptContainer.id = 'notification-permission-prompt';

        // Create prompt content
        promptContainer.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-icon">🔔</div>
                <div class="prompt-text">
                    <h3>Enable Notifications</h3>
                    <p>To better remind you to drink water and take breaks, please allow browser notifications.</p>
                </div>
                <div class="prompt-actions">
                    <button class="btn btn-primary" id="request-permission-btn">Allow Notifications</button>
                    <button class="btn btn-secondary" id="dismiss-prompt-btn">Maybe Later</button>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(promptContainer);

        // Bind events
        const requestBtn = promptContainer.querySelector('#request-permission-btn');
        const dismissBtn = promptContainer.querySelector('#dismiss-prompt-btn');

        requestBtn.addEventListener('click', () => {
            this.hidePermissionPrompt();
            if (onRequestClick) onRequestClick();
        });

        dismissBtn.addEventListener('click', () => {
            this.hidePermissionPrompt();
        });

        // Add show animation
        setTimeout(() => {
            promptContainer.classList.add('show');
        }, 100);
    }

    /**
     * Hide notification permission request prompt
     */
    hidePermissionPrompt() {
        const promptContainer = document.getElementById('notification-permission-prompt');
        if (promptContainer) {
            promptContainer.classList.remove('show');
            setTimeout(() => {
                if (promptContainer.parentNode) {
                    promptContainer.parentNode.removeChild(promptContainer);
                }
            }, 300);
        }
    }
}

// Export for browser use
window.NotificationService = NotificationService;