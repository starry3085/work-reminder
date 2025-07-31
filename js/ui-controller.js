/**
 * UI Controller - Manages user interface state and interactions
 */
class UIController {
    constructor() {
        this.elements = {};
        this.isSettingsOpen = false;
        this.currentNotification = null;
        this.eventListeners = {};
        this.uiState = {
            water: {
                isActive: false,
                timeRemaining: 0,
                status: 'Inactive',
                completedToday: 0,
                targetToday: 8
            },
            standup: {
                isActive: false,
                timeRemaining: 0,
                status: 'Inactive',
                completedToday: 0,
                targetToday: 8
            },
            settings: {
                isOpen: false
            },
            help: {
                isOpen: false
            }
        };

        // Bind methods
        this.bindEvents = this.bindEvents.bind(this);

        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleNotificationKeydown = this.handleNotificationKeydown.bind(this);
    }

    /**
     * Initialize UI controller
     */
    initialize() {
        console.log('Initializing UI controller...');
        this.cacheElements();
        this.bindEvents();
        this.setupInitialState();
        return this;
    }

    /**
     * Cache DOM element references
     * @private
     */
    cacheElements() {
        // Main control elements
        this.elements = {
            // App container
            appContainer: document.getElementById('app'),

            // App status summary
            appStatusIndicator: document.getElementById('app-status-indicator'),
            appStatusText: document.getElementById('app-status-text'),

            // Water reminder related
            waterCard: document.getElementById('water-card'),
            waterStatusBadge: document.getElementById('water-status-badge'),
            waterTime: document.getElementById('water-time'),
            waterIntervalDisplay: document.getElementById('water-interval-display'),
            waterToggle: document.getElementById('water-toggle'),
            waterReset: document.getElementById('water-reset'),
            waterDrink: document.getElementById('waterDrink'),
            waterStats: document.getElementById('water-stats'),
            waterCountdown: document.getElementById('water-countdown'),
            // Standup reminder related
            standupCard: document.getElementById('standup-card'),
            standupStatusBadge: document.getElementById('standup-status-badge'),
            standupTime: document.getElementById('standup-time'),
            standupIntervalDisplay: document.getElementById('standup-interval-display'),
            standupToggle: document.getElementById('standup-toggle'),
            standupReset: document.getElementById('standup-reset'),
            standupActivity: document.getElementById('standupActivity'),
            standupStats: document.getElementById('standup-stats'),
            standupCountdown: document.getElementById('standup-countdown'),



            // Notification popup
            notificationOverlay: document.getElementById('notification-overlay'),
            notificationIcon: document.getElementById('notification-icon'),
            notificationTitle: document.getElementById('notification-title'),
            notificationMessage: document.getElementById('notification-message'),
            notificationConfirm: document.getElementById('notification-confirm'),
            notificationSnooze: document.getElementById('notification-snooze'),


        };

        // Check if required elements exist
        const requiredElements = ['waterCard', 'standupCard', 'settingsPanel'];
        const missingElements = requiredElements.filter(id => !this.elements[id]);

        if (missingElements.length > 0) {
            console.error('UI initialization error: Missing required DOM elements', missingElements);
        }
    }

    /**
     * Bind event listeners
     * @private
     */
    bindEvents() {


        // Notification popup events
        this.addEventHandler('notificationConfirm', 'click', () => {
            this.hideNotificationModal();
            if (this.currentNotification && this.currentNotification.onConfirm) {
                this.currentNotification.onConfirm();
            }
        });

        this.addEventHandler('notificationSnooze', 'click', () => {
            this.hideNotificationModal();
            if (this.currentNotification && this.currentNotification.onSnooze) {
                this.currentNotification.onSnooze();
            }
        });

        // Water reminder control buttons
        this.addEventHandler('waterToggle', 'click', () => {
            this.triggerEvent('waterToggle', { isActive: !this.uiState.water.isActive });
        });

        this.addEventHandler('waterReset', 'click', () => {
            console.log('Water Reset button clicked!');
            this.triggerEvent('waterReset');
        });

        this.addEventHandler('waterDrink', 'click', () => {
            this.triggerEvent('waterDrink');
        });

        // Standup reminder control buttons
        this.addEventHandler('standupToggle', 'click', () => {
            this.triggerEvent('standupToggle', { isActive: !this.uiState.standup.isActive });
        });

        this.addEventHandler('standupReset', 'click', () => {
            console.log('Standup Reset button clicked!');
            this.triggerEvent('standupReset');
        });

        this.addEventHandler('standupActivity', 'click', () => {
            this.triggerEvent('standupActivity');
        });



        // Main display interval input linkage (only these elements exist in HTML)

        // Main display interval input linkage
        if (this.elements.waterIntervalDisplay) {
            this.elements.waterIntervalDisplay.addEventListener('change', () => {
                const value = parseInt(this.elements.waterIntervalDisplay.value);
                if (value >= 1 && value <= 60) {
                    this.triggerEvent('waterIntervalChanged', { interval: value });
                } else {
                    // Reset to valid range
                    let validValue = 30; // default
                    if (value < 1) {
                        validValue = 1; // minimum
                    } else if (value > 60) {
                        validValue = 60; // maximum
                    }

                    this.elements.waterIntervalDisplay.value = validValue;
                    this.triggerEvent('waterIntervalChanged', { interval: validValue });
                }
            });
        }

        if (this.elements.standupIntervalDisplay) {
            this.elements.standupIntervalDisplay.addEventListener('change', () => {
                const value = parseInt(this.elements.standupIntervalDisplay.value);
                if (value >= 1 && value <= 60) {
                    this.triggerEvent('standupIntervalChanged', { interval: value });
                } else {
                    // Reset to valid range
                    let validValue = 30; // default
                    if (value < 1) {
                        validValue = 1; // minimum
                    } else if (value > 60) {
                        validValue = 60; // maximum
                    }

                    this.elements.standupIntervalDisplay.value = validValue;
                    this.triggerEvent('standupIntervalChanged', { interval: validValue });
                }
            });
        }

        // Theme selector
        if (this.elements.themeSelector) {
            const themeOptions = this.elements.themeSelector.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                option.addEventListener('click', () => {
                    // Remove all active classes
                    themeOptions.forEach(opt => opt.classList.remove('active'));
                    // Add active class to selected option
                    option.classList.add('active');
                    // Apply theme
                    const theme = option.getAttribute('data-theme');
                    this.applyTheme(theme);
                });
            });
        }
    }

    /**
     * Add event handler and track it
     * @param {string} elementId - Element ID
     * @param {string} eventType - Event type
     * @param {Function} handler - Handler function
     * @private
     */
    addEventHandler(elementId, eventType, handler) {
        const element = this.elements[elementId];
        if (!element) {
            console.warn(`Element not found: ${elementId}`);
            return;
        }

        // Store event handler reference for possible future removal
        if (!this.eventListeners[elementId]) {
            this.eventListeners[elementId] = {};
        }

        if (!this.eventListeners[elementId][eventType]) {
            this.eventListeners[elementId][eventType] = [];
        }

        this.eventListeners[elementId][eventType].push(handler);
        element.addEventListener(eventType, handler);
    }

    /**
     * Remove event handlers
     * @param {string} elementId - Element ID
     * @param {string} eventType - Event type
     * @private
     */
    removeEventHandlers(elementId, eventType) {
        const element = this.elements[elementId];
        if (!element || !this.eventListeners[elementId] || !this.eventListeners[elementId][eventType]) {
            return;
        }

        this.eventListeners[elementId][eventType].forEach(handler => {
            element.removeEventListener(eventType, handler);
        });

        this.eventListeners[elementId][eventType] = [];
    }

    /**
     * Register custom event callback
     * @param {string} eventName - Event name
     * @param {Function} callback - Callback function
     */
    on(eventName, callback) {
        if (!this.eventListeners._custom) {
            this.eventListeners._custom = {};
        }

        if (!this.eventListeners._custom[eventName]) {
            this.eventListeners._custom[eventName] = [];
        }

        this.eventListeners._custom[eventName].push(callback);
    }

    /**
     * Trigger custom event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    triggerEvent(eventName, data = null) {
        console.log(`Triggering event: ${eventName}`, data);
        
        if (!this.eventListeners._custom || !this.eventListeners._custom[eventName]) {
            console.warn(`No listeners found for event: ${eventName}`);
            return;
        }

        console.log(`Found ${this.eventListeners._custom[eventName].length} listeners for event: ${eventName}`);
        
        this.eventListeners._custom[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Event handling error (${eventName}):`, error);
            }
        });
    }

    /**
     * Set initial UI state
     * @private
     */
    setupInitialState() {
        console.log('Setting up initial UI state...');

        // Set initial status display
        this.updateReminderStatus('water', {
            isActive: false,
            timeRemaining: 0,
            status: 'Inactive'
        });

        this.updateReminderStatus('standup', {
            isActive: false,
            timeRemaining: 0,
            status: 'Inactive'
        });

        // Initialize countdown displays
        this.updateCountdown('water', 0);
        this.updateCountdown('standup', 0);

        // Set application status summary
        this.updateAppStatusSummary(false);

        // Next reminder time elements removed







        // Set theme
        this.applyTheme('light');

        // Check for mobile device
        this.checkMobileDevice();
    }

    /**
     * Check if device is mobile and apply appropriate styles
     * @private
     */
    checkMobileDevice() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            document.body.classList.add('mobile-device');
        } else {
            document.body.classList.remove('mobile-device');
        }

        // Listen for window resize events
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                document.body.classList.add('mobile-device');
            } else {
                document.body.classList.remove('mobile-device');
            }
        });
    }

    /**
     * Apply theme
     * @param {string} theme - Theme name ('light' | 'dark' | 'auto')
     */
    applyTheme(theme) {
        if (theme === 'auto') {
            // Automatically select theme based on system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }

            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (this.getSettingsFromUI().appearance.theme === 'auto') {
                    if (e.matches) {
                        document.body.classList.add('dark-theme');
                    } else {
                        document.body.classList.remove('dark-theme');
                    }
                }
            });
        } else if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    /**
     * Update reminder time display
     * @param {string} type - 'water' | 'standup'
     * @param {Object} timeInfo - Time information object
     */
    updateReminderTime(type, timeInfo) {
        // Update countdown display with current time remaining
        if (timeInfo && typeof timeInfo.timeRemaining !== 'undefined') {
            this.updateCountdown(type, timeInfo.timeRemaining);
            
            // Update UI state
            if (type === 'water') {
                this.uiState.water.timeRemaining = timeInfo.timeRemaining;
            } else if (type === 'standup') {
                this.uiState.standup.timeRemaining = timeInfo.timeRemaining;
            }
        }
        
        console.log(`${type} reminder time updated:`, timeInfo);
    }

    /**
     * Update reminder status display
     * @param {string} type - 'water' | 'standup'
     * @param {Object} status - Status object
     */
    updateReminderStatus(type, status) {
        const card = this.elements[`${type}Card`];
        const statusBadge = this.elements[`${type}StatusBadge`];
        const timeElement = this.elements[`${type}Time`];
        const toggleButton = this.elements[`${type}Toggle`];
        const resetButton = this.elements[`${type}Reset`];
        const actionButton = this.elements[`${type === 'water' ? 'waterDrink' : 'standupActivity'}`];

        if (!card || !timeElement || !toggleButton) {
            return;
        }

        // Update card status style
        if (status.isActive) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }

        // Update status text (removed left status display, only keep badge)

        // Update status badge
        if (statusBadge) {
            if (status.isActive && !status.isPaused) {
                statusBadge.textContent = 'Active';
                statusBadge.classList.add('active');
                statusBadge.classList.remove('inactive', 'paused');
            } else if (status.isActive && status.isPaused) {
                statusBadge.textContent = 'Paused';
                statusBadge.classList.add('paused');
                statusBadge.classList.remove('active', 'inactive');
            } else {
                statusBadge.textContent = 'Inactive';
                statusBadge.classList.add('inactive');
                statusBadge.classList.remove('active', 'paused');
            }
        }

        // Keep time display always visible since it now contains the interval input
        if (timeElement) {
            timeElement.style.display = 'block';
        }

        // Update button states based on isActive and isPaused
        if (status.isActive && !status.isPaused) {
            // Running state
            toggleButton.textContent = 'Pause';
            toggleButton.className = 'btn-secondary';
            if (resetButton) resetButton.style.display = 'inline-block';
            if (actionButton) actionButton.style.display = 'inline-block';
        } else if (status.isActive && status.isPaused) {
            // Paused state
            toggleButton.textContent = 'Resume';
            toggleButton.className = 'btn-primary';
            if (resetButton) resetButton.style.display = 'inline-block';
            if (actionButton) actionButton.style.display = 'inline-block';
        } else {
            // Stopped state
            toggleButton.textContent = 'Start';
            toggleButton.className = 'btn-primary';
            if (resetButton) resetButton.style.display = 'none';
            if (actionButton) actionButton.style.display = 'none';
        }

        // Update UI state first
        if (type === 'water') {
            this.uiState.water.isActive = status.isActive;
            this.uiState.water.status = status.status || (status.isActive ? 'Active' : 'Inactive');
            this.uiState.water.timeRemaining = status.timeRemaining || 0;
        } else if (type === 'standup') {
            this.uiState.standup.isActive = status.isActive;
            this.uiState.standup.status = status.status || (status.isActive ? 'Active' : 'Inactive');
            this.uiState.standup.timeRemaining = status.timeRemaining || 0;
        }

        // Update countdown display
        this.updateCountdown(type, status.timeRemaining || 0);

        // Update application status summary after updating UI state
        this.updateAppStatusSummary(
            this.uiState.water.isActive || this.uiState.standup.isActive
        );
    }

    /**
     * Show notification modal
     * @param {string} type - Notification type
     * @param {string} title - Title
     * @param {string} message - Message
     * @param {Function} onConfirm - Confirm callback
     * @param {Function} onSnooze - Snooze callback
     */
    showNotificationModal(type, title, message, onConfirm, onSnooze) {
        // Save current notification information
        this.currentNotification = {
            type,
            title,
            message,
            onConfirm,
            onSnooze
        };

        // Set notification content
        if (this.elements.notificationIcon) {
            this.elements.notificationIcon.textContent = type === 'water' ? '💧' : '🧘';
        }

        if (this.elements.notificationTitle) {
            this.elements.notificationTitle.textContent = title;
        }

        if (this.elements.notificationMessage) {
            this.elements.notificationMessage.textContent = message;
        }

        if (this.elements.notificationConfirm) {
            this.elements.notificationConfirm.textContent = type === 'water' ? 'Hydrated' : 'Moved';
        }

        // Show notification popup
        if (this.elements.notificationOverlay) {
            this.elements.notificationOverlay.classList.add('show');

            // Add keyboard event listener
            document.addEventListener('keydown', this.handleNotificationKeydown);
        }
    }

    /**
     * Hide notification modal
     */
    hideNotificationModal() {
        if (this.elements.notificationOverlay) {
            this.elements.notificationOverlay.classList.remove('show');

            // Remove keyboard event listener
            document.removeEventListener('keydown', this.handleNotificationKeydown);
        }

        // Clear current notification information
        this.currentNotification = null;
    }

    /**
     * Handle notification modal keyboard events
     * @param {KeyboardEvent} event - Keyboard event
     * @private
     */
    handleNotificationKeydown = (event) => {
        // Close notification when Escape key is pressed
        if (event.key === 'Escape') {
            this.hideNotificationModal();
        }

        // Confirm notification when Enter key is pressed
        if (event.key === 'Enter' && this.currentNotification && this.currentNotification.onConfirm) {
            this.hideNotificationModal();
            this.currentNotification.onConfirm();
        }
    }

    /**
     * Toggle settings panel display
     */
    toggleSettings() {
        if (this.isSettingsOpen) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

    /**
     * Show settings panel
     */
    showSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.add('open');
            this.isSettingsOpen = true;

            // Add keyboard event listener
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this.hideSettings();
                }
            });

            // Add click outside event to close
            document.addEventListener('click', this.handleOutsideClick);
        }
    }

    /**
     * Hide settings panel
     */
    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.remove('open');
            this.isSettingsOpen = false;

            // Remove click outside event listener
            document.removeEventListener('click', this.handleOutsideClick);
        }
    }

    /**
     * Toggle help panel display
     */
    toggleHelp() {
        if (this.elements.helpOverlay) {
            if (this.elements.helpOverlay.classList.contains('show')) {
                this.elements.helpOverlay.classList.remove('show');
            } else {
                this.elements.helpOverlay.classList.add('show');
            }
        }
    }

    /**
     * Handle click outside to close settings panel
     * @param {MouseEvent} event - Mouse event
     * @private
     */
    handleOutsideClick = (event) => {
        if (this.isSettingsOpen &&
            this.elements.settingsPanel &&
            !this.elements.settingsPanel.contains(event.target) &&
            event.target !== this.elements.settingsBtn) {
            this.hideSettings();
        }
    }

    /**
     * Get current settings from UI
     * @returns {Object} Settings object
     */
    getSettingsFromUI() {
        // Get currently selected theme
        let selectedTheme = 'light';
        if (this.elements.themeSelector) {
            const activeTheme = this.elements.themeSelector.querySelector('.theme-option.active');
            if (activeTheme) {
                selectedTheme = activeTheme.getAttribute('data-theme');
            }
        }

        return {
            water: {
                enabled: this.elements.waterEnabled ? this.elements.waterEnabled.checked : true,
                interval: this.elements.waterIntervalDisplay ? parseInt(this.elements.waterIntervalDisplay.value) : 30,
                target: this.elements.waterTarget ? parseInt(this.elements.waterTarget.value) : 8
            },
            standup: {
                enabled: this.elements.standupEnabled ? this.elements.standupEnabled.checked : true,
                interval: this.elements.standupIntervalDisplay ? parseInt(this.elements.standupIntervalDisplay.value) : 30,
                target: this.elements.standupTarget ? parseInt(this.elements.standupTarget.value) : 8,
                activityDetection: this.elements.activityDetection ? this.elements.activityDetection.checked : true
            },
            notifications: {
                browserNotifications: this.elements.browserNotifications ? this.elements.browserNotifications.checked : true,
                soundEnabled: this.elements.soundEnabled ? this.elements.soundEnabled.checked : true,
                style: this.elements.notificationStyle ? this.elements.notificationStyle.value : 'standard'
            },
            appearance: {
                theme: selectedTheme
            }
        };
    }

    /**
     * Apply settings to UI
     * @param {Object} settings - Settings object
     */
    applySettingsToUI(settings) {
        if (!settings) return;

        // Apply water reminder settings
        if (settings.water) {
            if (this.elements.waterEnabled) {
                this.elements.waterEnabled.checked = settings.water.enabled !== false;
            }

            if (this.elements.waterIntervalDisplay) {
                this.elements.waterIntervalDisplay.value = settings.water.interval || 30;
            }
            if (this.elements.waterTarget) {
                this.elements.waterTarget.value = settings.water.target || 8;
            }
        }

        // Apply standup reminder settings
        if (settings.standup) {
            if (this.elements.standupEnabled) {
                this.elements.standupEnabled.checked = settings.standup.enabled !== false;
            }

            if (this.elements.standupIntervalDisplay) {
                this.elements.standupIntervalDisplay.value = settings.standup.interval || 30;
            }
            if (this.elements.standupTarget) {
                this.elements.standupTarget.value = settings.standup.target || 8;
            }
            if (this.elements.activityDetection) {
                this.elements.activityDetection.checked = settings.standup.activityDetection !== false;
            }
        }

        // Apply notification settings
        if (settings.notifications) {
            if (this.elements.browserNotifications) {
                this.elements.browserNotifications.checked = settings.notifications.browserNotifications !== false;
            }
            if (this.elements.soundEnabled) {
                this.elements.soundEnabled.checked = settings.notifications.soundEnabled !== false;
            }
            if (this.elements.notificationStyle) {
                this.elements.notificationStyle.value = settings.notifications.style || 'standard';
            }
        }

        // Apply appearance settings
        if (settings.appearance && settings.appearance.theme) {
            this.applyTheme(settings.appearance.theme);

            // Update theme selector UI
            if (this.elements.themeSelector) {
                const themeOptions = this.elements.themeSelector.querySelectorAll('.theme-option');
                themeOptions.forEach(option => {
                    option.classList.remove('active');
                    if (option.getAttribute('data-theme') === settings.appearance.theme) {
                        option.classList.add('active');
                    }
                });
            }
        }
    }

    /**
     * Handle settings toggle
     * @private
     */
    handleSettingsToggle() {
        this.toggleSettings();
    }

    /**
     * Handle help toggle
     * @private
     */
    handleHelpToggle() {
        this.toggleHelp();
    }

    /**
     * Handle save settings
     * @private
     */
    handleSaveSettings() {
        this.triggerEvent('saveSettings');
    }

    /**
     * Handle reset settings
     * @private
     */
    handleResetSettings() {
        this.triggerEvent('resetSettings');
    }

    /**
     * Handle force reset settings (reset to defaults)
     * @private
     */
    handleForceResetSettings() {
        // Show confirmation dialog
        if (confirm('确定要强制重置所有设置为默认值吗？这将把所有提醒间隔重置为30分钟。')) {
            this.triggerEvent('forceResetSettings');
        }
    }

    /**
     * Format time display
     * @param {number} timeRemaining - Time remaining in milliseconds
     * @returns {string} Formatted time string
     * @private
     */
    formatTime(timeRemaining) {
        if (timeRemaining <= 0) return '';

        const seconds = Math.floor(timeRemaining / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours} hours ${minutes} mins`;
        } else {
            return `${minutes} mins`;
        }
    }

    /**
     * Update time display
     * @param {HTMLElement} element - Time display element
     * @param {number} timeRemaining - Time remaining in seconds
     * @param {string} type - Reminder type
     * @private
     */
    updateTimeDisplay(element, timeRemaining, type) {
        if (!element) return;

        // Since we now have input boxes in the time display, we don't need to update the text
        // The input boxes show the interval, not the remaining time
        // This method is kept for compatibility but doesn't need to do anything
    }

    /**
     * Format time display in HH:MM:SS format (for backward compatibility)
     * @param {number} seconds - Seconds
     * @returns {string} Formatted time string
     * @private
     */
    formatTimeHHMMSS(seconds) {
        if (seconds <= 0) return '';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }



    /**
     * Update countdown display
     * @param {string} type - 'water' | 'standup'
     * @param {number} timeRemaining - Time remaining in milliseconds
     */
    updateCountdown(type, timeRemaining) {
        const countdownElement = this.elements[`${type}Countdown`];
        
        if (countdownElement) {
            if (timeRemaining <= 0) {
                countdownElement.textContent = '--:--';
            } else {
                const minutes = Math.floor(timeRemaining / 60000);
                const seconds = Math.floor((timeRemaining % 60000) / 1000);
                countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }

    /**
     * Update daily progress display (kept for compatibility, but now updates countdown)
     * @param {string} type - 'water' | 'standup'
     * @param {number} current - Current completion count
     * @param {number} target - Target count
     */
    updateDailyProgress(type, current, target) {
        // This method is kept for compatibility but no longer updates progress bars
        // The countdown display is updated through updateCountdown method
        console.log(`Daily progress updated for ${type}: ${current}/${target}`);
    }

    /**
     * Show in-page notification
     * @param {string} type - Notification type
     * @param {string} title - Title
     * @param {string} message - Message
     * @param {Function} onConfirm - Confirm callback
     * @param {Function} onSnooze - Snooze callback
     */
    showInPageNotification(type, title, message, onConfirm, onSnooze) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification-alert notification-${type}`;

        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${type === 'water' ? '💧' : '🧘'}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="btn-close">✕</button>
            </div>
            <div class="notification-actions">
                <button class="btn btn-primary">${type === 'water' ? 'Hydrated' : 'Moved'}</button>
                <button class="btn btn-secondary">Remind Later</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Bind events
        const confirmBtn = notification.querySelector('.btn-primary');
        const snoozeBtn = notification.querySelector('.btn-secondary');
        const closeBtn = notification.querySelector('.btn-close');

        const removeNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                removeNotification();
                if (onConfirm) onConfirm();
            });
        }

        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => {
                removeNotification();
                if (onSnooze) onSnooze();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', removeNotification);
        }

        // Auto close
        setTimeout(removeNotification, 10000);
    }

    /**
     * Show permission request prompt
     * @param {Function} onAllow - Allow callback
     * @param {Function} onDeny - Deny callback
     */
    showPermissionPrompt(onAllow, onDeny) {
        // Create permission prompt element
        const prompt = document.createElement('div');
        prompt.className = 'permission-prompt';

        prompt.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-icon">🔔</div>
                <div class="prompt-text">
                    <h3>Enable Notification Permission</h3>
                    <p>Allow desktop notifications so you can receive reminders even in other tabs</p>
                </div>
                <div class="prompt-actions">
                    <button class="btn-primary">Allow Notifications</button>
                    <button class="btn-secondary">Not Now</button>
                </div>
            </div>
        `;

        // Add to page
        document.body.appendChild(prompt);

        // Show animation
        setTimeout(() => {
            prompt.classList.add('show');
        }, 100);

        // Bind events
        const allowBtn = prompt.querySelector('.btn-primary');
        const denyBtn = prompt.querySelector('.btn-secondary');

        const removePrompt = () => {
            prompt.classList.remove('show');
            setTimeout(() => {
                if (prompt.parentNode) {
                    prompt.parentNode.removeChild(prompt);
                }
            }, 400);
        };

        if (allowBtn) {
            allowBtn.addEventListener('click', () => {
                removePrompt();
                if (onAllow) onAllow();
            });
        }

        if (denyBtn) {
            denyBtn.addEventListener('click', () => {
                removePrompt();
                if (onDeny) onDeny();
            });
        }
    }

    /**
     * Get UI elements
     * @param {string} elementId - Element ID
     * @returns {HTMLElement|null} DOM element
     */
    getElement(elementId) {
        return this.elements[elementId] || document.getElementById(elementId);
    }

    /**
     * Set element visibility
     * @param {string} elementId - Element ID
     * @param {boolean} visible - Whether visible
     */
    setElementVisibility(elementId, visible) {
        const element = this.getElement(elementId);
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * Set element text content
     * @param {string} elementId - Element ID
     * @param {string} text - Text content
     */
    setElementText(elementId, text) {
        const element = this.getElement(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Add CSS class to element
     * @param {string} elementId - Element ID
     * @param {string} className - CSS class name
     */
    addElementClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from element
     * @param {string} elementId - Element ID
     * @param {string} className - CSS class name
     */
    removeElementClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Update application status summary
     * @param {boolean} isActive - Whether any reminder is active
     */
    updateAppStatusSummary(isActive) {
        if (!this.elements.appStatusIndicator || !this.elements.appStatusText) {
            return;
        }

        if (isActive) {
            this.elements.appStatusIndicator.classList.add('active');
            this.elements.appStatusText.textContent = 'Wellness Reminders Active';
        } else {
            this.elements.appStatusIndicator.classList.remove('active');
            // Remove the inactive status text - just hide the status
            this.elements.appStatusText.textContent = '';
        }
    }





    /**
     * Update health score
     * @param {number} waterCompletionRate - Water reminder completion rate (0-1)
     * @param {number} standupCompletionRate - Standup reminder completion rate (0-1)
     */
    updateHealthScore(waterCompletionRate, standupCompletionRate) {
        if (!this.elements.healthScore) {
            return;
        }

        // Simple health score calculation (max 100)
        const score = Math.round((waterCompletionRate * 0.5 + standupCompletionRate * 0.5) * 100);

        // Set different colors based on score
        let scoreClass = '';
        if (score >= 80) {
            scoreClass = 'score-excellent';
        } else if (score >= 60) {
            scoreClass = 'score-good';
        } else if (score >= 40) {
            scoreClass = 'score-average';
        } else {
            scoreClass = 'score-poor';
        }

        // Remove all possible score classes
        this.elements.healthScore.classList.remove(
            'score-excellent', 'score-good', 'score-average', 'score-poor'
        );

        // Add current score class
        this.elements.healthScore.classList.add(scoreClass);

        // Set score text
        this.elements.healthScore.textContent = score;
    }
}

// Export for browser use
window.UIController = UIController;