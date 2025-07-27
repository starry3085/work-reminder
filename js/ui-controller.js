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
            posture: {
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
        this.handleSettingsToggle = this.handleSettingsToggle.bind(this);
        this.handleHelpToggle = this.handleHelpToggle.bind(this);
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
            waterProgress: document.getElementById('water-progress'),
            waterCount: document.getElementById('water-count'),

            // Standup reminder related
            postureCard: document.getElementById('posture-card'),
            postureStatusBadge: document.getElementById('posture-status-badge'),
            postureTime: document.getElementById('posture-time'),
            postureIntervalDisplay: document.getElementById('posture-interval-display'),
            postureToggle: document.getElementById('posture-toggle'),
            postureReset: document.getElementById('posture-reset'),
            postureActivity: document.getElementById('postureActivity'),
            postureStats: document.getElementById('posture-stats'),
            postureProgress: document.getElementById('posture-progress'),
            postureCount: document.getElementById('posture-count'),


            // Quick action buttons
            startAllBtn: document.getElementById('start-all-btn'),
            pauseAllBtn: document.getElementById('pause-all-btn'),

            // Health score
            healthScore: document.getElementById('health-score'),

            // Settings panel
            settingsBtn: document.getElementById('settings-btn'),
            settingsPanel: document.getElementById('settings-panel'),
            settingsClose: document.getElementById('settings-close'),
            saveSettings: document.getElementById('save-settings'),
            resetSettings: document.getElementById('reset-settings'),

            // Settings - Water reminder
            waterEnabled: document.getElementById('water-enabled'),
            waterInterval: document.getElementById('water-interval'),
            waterIntervalSlider: document.getElementById('water-interval-slider'),
            waterTarget: document.getElementById('water-target'),

            // Settings - Standup reminder
            postureEnabled: document.getElementById('posture-enabled'),
            postureInterval: document.getElementById('posture-interval'),
            postureIntervalSlider: document.getElementById('posture-interval-slider'),
            postureTarget: document.getElementById('posture-target'),
            activityDetection: document.getElementById('activity-detection'),

            // Settings - Notifications
            browserNotifications: document.getElementById('browser-notifications'),
            soundEnabled: document.getElementById('sound-enabled'),
            notificationStyle: document.getElementById('notification-style'),

            // Settings - Appearance
            themeSelector: document.getElementById('theme-selector'),

            // Notification popup
            notificationOverlay: document.getElementById('notification-overlay'),
            notificationIcon: document.getElementById('notification-icon'),
            notificationTitle: document.getElementById('notification-title'),
            notificationMessage: document.getElementById('notification-message'),
            notificationConfirm: document.getElementById('notification-confirm'),
            notificationSnooze: document.getElementById('notification-snooze'),

            // Help panel
            helpBtn: document.getElementById('help-btn'),
            helpOverlay: document.getElementById('help-overlay'),
            helpClose: document.getElementById('help-close')
        };

        // Check if required elements exist
        const requiredElements = ['waterCard', 'postureCard', 'settingsPanel'];
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
        // Settings panel events
        this.addEventHandler('settingsBtn', 'click', this.handleSettingsToggle);
        this.addEventHandler('settingsClose', 'click', this.handleSettingsToggle);
        this.addEventHandler('saveSettings', 'click', this.handleSaveSettings.bind(this));
        this.addEventHandler('resetSettings', 'click', this.handleResetSettings.bind(this));

        // Help panel events
        this.addEventHandler('helpBtn', 'click', this.handleHelpToggle);
        this.addEventHandler('helpClose', 'click', this.handleHelpToggle);

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
            this.triggerEvent('waterReset');
        });

        this.addEventHandler('waterDrink', 'click', () => {
            this.triggerEvent('waterDrink');
        });

        // Standup reminder control buttons
        this.addEventHandler('postureToggle', 'click', () => {
            this.triggerEvent('postureToggle', { isActive: !this.uiState.posture.isActive });
        });

        this.addEventHandler('postureReset', 'click', () => {
            this.triggerEvent('postureReset');
        });

        this.addEventHandler('postureActivity', 'click', () => {
            this.triggerEvent('postureActivity');
        });

        // Global control buttons
        this.addEventHandler('startAllBtn', 'click', () => {
            this.triggerEvent('startAll');
        });

        this.addEventHandler('pauseAllBtn', 'click', () => {
            this.triggerEvent('pauseAll');
        });

        // Settings panel slider linkage
        if (this.elements.waterIntervalSlider && this.elements.waterInterval) {
            this.elements.waterIntervalSlider.addEventListener('input', () => {
                this.elements.waterInterval.value = this.elements.waterIntervalSlider.value;
                if (this.elements.waterIntervalDisplay) {
                    this.elements.waterIntervalDisplay.value = this.elements.waterIntervalSlider.value;
                }
                // Trigger interval change event for real-time updates
                const value = parseInt(this.elements.waterIntervalSlider.value);
                this.triggerEvent('waterIntervalChanged', { interval: value });
            });

            this.elements.waterInterval.addEventListener('change', () => {
                this.elements.waterIntervalSlider.value = this.elements.waterInterval.value;
                if (this.elements.waterIntervalDisplay) {
                    this.elements.waterIntervalDisplay.value = this.elements.waterInterval.value;
                }
                // Trigger interval change event
                const value = parseInt(this.elements.waterInterval.value);
                this.triggerEvent('waterIntervalChanged', { interval: value });
            });
        }

        if (this.elements.postureIntervalSlider && this.elements.postureInterval) {
            this.elements.postureIntervalSlider.addEventListener('input', () => {
                this.elements.postureInterval.value = this.elements.postureIntervalSlider.value;
                if (this.elements.postureIntervalDisplay) {
                    this.elements.postureIntervalDisplay.value = this.elements.postureIntervalSlider.value;
                }
                // Trigger interval change event for real-time updates
                const value = parseInt(this.elements.postureIntervalSlider.value);
                this.triggerEvent('postureIntervalChanged', { interval: value });
            });

            this.elements.postureInterval.addEventListener('change', () => {
                this.elements.postureIntervalSlider.value = this.elements.postureInterval.value;
                if (this.elements.postureIntervalDisplay) {
                    this.elements.postureIntervalDisplay.value = this.elements.postureInterval.value;
                }
                // Trigger interval change event
                const value = parseInt(this.elements.postureInterval.value);
                this.triggerEvent('postureIntervalChanged', { interval: value });
            });
        }

        // Main display interval input linkage
        if (this.elements.waterIntervalDisplay) {
            this.elements.waterIntervalDisplay.addEventListener('change', () => {
                const value = parseInt(this.elements.waterIntervalDisplay.value);
                if (value >= 1 && value <= 60) {
                    if (this.elements.waterInterval) {
                        this.elements.waterInterval.value = value;
                    }
                    if (this.elements.waterIntervalSlider) {
                        this.elements.waterIntervalSlider.value = value;
                    }
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
                    if (this.elements.waterInterval) {
                        this.elements.waterInterval.value = validValue;
                    }
                    if (this.elements.waterIntervalSlider) {
                        this.elements.waterIntervalSlider.value = validValue;
                    }
                    this.triggerEvent('waterIntervalChanged', { interval: validValue });
                }
            });
        }

        if (this.elements.postureIntervalDisplay) {
            this.elements.postureIntervalDisplay.addEventListener('change', () => {
                const value = parseInt(this.elements.postureIntervalDisplay.value);
                if (value >= 1 && value <= 60) {
                    if (this.elements.postureInterval) {
                        this.elements.postureInterval.value = value;
                    }
                    if (this.elements.postureIntervalSlider) {
                        this.elements.postureIntervalSlider.value = value;
                    }
                    this.triggerEvent('postureIntervalChanged', { interval: value });
                } else {
                    // Reset to valid range
                    let validValue = 30; // default
                    if (value < 1) {
                        validValue = 1; // minimum
                    } else if (value > 60) {
                        validValue = 60; // maximum
                    }

                    this.elements.postureIntervalDisplay.value = validValue;
                    if (this.elements.postureInterval) {
                        this.elements.postureInterval.value = validValue;
                    }
                    if (this.elements.postureIntervalSlider) {
                        this.elements.postureIntervalSlider.value = validValue;
                    }
                    this.triggerEvent('postureIntervalChanged', { interval: validValue });
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
        if (!this.eventListeners._custom || !this.eventListeners._custom[eventName]) {
            return;
        }

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

        this.updateReminderStatus('posture', {
            isActive: false,
            timeRemaining: 0,
            status: 'Inactive'
        });

        // Initialize progress bars
        this.updateDailyProgress('water', 0, 8);
        this.updateDailyProgress('posture', 0, 8);

        // Set application status summary
        this.updateAppStatusSummary(false);

        // Next reminder time elements removed



        // Set health score
        this.updateHealthScore(0, 0);

        // Hide settings panel
        this.hideSettings();

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
     * @param {string} type - 'water' | 'posture'
     * @param {Object} timeInfo - Time information object
     */
    updateReminderTime(type, timeInfo) {
        // This method is called by reminder managers to update time display
        // For now, we don't need to do anything special as time is handled in updateReminderStatus
        console.log(`${type} reminder time updated:`, timeInfo);
    }

    /**
     * Update reminder status display
     * @param {string} type - 'water' | 'posture'
     * @param {Object} status - Status object
     */
    updateReminderStatus(type, status) {
        const card = this.elements[`${type}Card`];
        const statusBadge = this.elements[`${type}StatusBadge`];
        const timeElement = this.elements[`${type}Time`];
        const toggleButton = this.elements[`${type}Toggle`];
        const resetButton = this.elements[`${type}Reset`];
        const actionButton = this.elements[`${type === 'water' ? 'waterDrink' : 'postureActivity'}`];

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
            statusBadge.textContent = status.isActive ? 'Active' : 'Inactive';
            if (status.isActive) {
                statusBadge.classList.add('active');
            } else {
                statusBadge.classList.remove('active');
            }
        }

        // Keep time display always visible since it now contains the interval input
        if (timeElement) {
            timeElement.style.display = 'block';
        }

        // Update button states
        if (status.isActive) {
            toggleButton.textContent = 'Pause';
            toggleButton.className = 'btn-secondary';
            if (resetButton) resetButton.style.display = 'inline-block';
            if (actionButton) actionButton.style.display = 'inline-block';
        } else {
            toggleButton.textContent = 'Start';
            toggleButton.className = 'btn-primary';
            if (resetButton) resetButton.style.display = 'none';
            if (actionButton) actionButton.style.display = 'none';
        }

        // Update application status summary
        this.updateAppStatusSummary(
            this.uiState.water.isActive || this.uiState.posture.isActive
        );

        // Update UI state
        if (type === 'water') {
            this.uiState.water.isActive = status.isActive;
            this.uiState.water.status = status.status || (status.isActive ? 'Active' : 'Inactive');
            this.uiState.water.timeRemaining = status.timeRemaining || 0;
        } else if (type === 'posture') {
            this.uiState.posture.isActive = status.isActive;
            this.uiState.posture.status = status.status || (status.isActive ? 'Active' : 'Inactive');
            this.uiState.posture.timeRemaining = status.timeRemaining || 0;
        }
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
                interval: this.elements.waterInterval ? parseInt(this.elements.waterInterval.value) : 30,
                target: this.elements.waterTarget ? parseInt(this.elements.waterTarget.value) : 8
            },
            posture: {
                enabled: this.elements.postureEnabled ? this.elements.postureEnabled.checked : true,
                interval: this.elements.postureInterval ? parseInt(this.elements.postureInterval.value) : 30,
                target: this.elements.postureTarget ? parseInt(this.elements.postureTarget.value) : 8,
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
            if (this.elements.waterInterval) {
                this.elements.waterInterval.value = settings.water.interval || 30;
            }
            if (this.elements.waterIntervalSlider) {
                this.elements.waterIntervalSlider.value = settings.water.interval || 30;
            }
            if (this.elements.waterIntervalDisplay) {
                this.elements.waterIntervalDisplay.value = settings.water.interval || 30;
            }
            if (this.elements.waterTarget) {
                this.elements.waterTarget.value = settings.water.target || 8;
            }
        }

        // Apply standup reminder settings
        if (settings.posture) {
            if (this.elements.postureEnabled) {
                this.elements.postureEnabled.checked = settings.posture.enabled !== false;
            }
            if (this.elements.postureInterval) {
                this.elements.postureInterval.value = settings.posture.interval || 30;
            }
            if (this.elements.postureIntervalSlider) {
                this.elements.postureIntervalSlider.value = settings.posture.interval || 30;
            }
            if (this.elements.postureIntervalDisplay) {
                this.elements.postureIntervalDisplay.value = settings.posture.interval || 30;
            }
            if (this.elements.postureTarget) {
                this.elements.postureTarget.value = settings.posture.target || 8;
            }
            if (this.elements.activityDetection) {
                this.elements.activityDetection.checked = settings.posture.activityDetection !== false;
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
     * Update daily progress display
     * @param {string} type - 'water' | 'posture'
     * @param {number} current - Current completion count
     * @param {number} target - Target count
     */
    updateDailyProgress(type, current, target) {
        const statsElement = this.elements[`${type}Stats`];
        const progressElement = this.elements[`${type}Progress`];

        if (statsElement) {
            const statsText = statsElement.querySelector('.stats-text');
            if (statsText) {
                const unit = type === 'water' ? 'glasses' : 'activities';
                statsText.textContent = `Today: ${current}/${target} ${unit}`;
            }
        }

        if (progressElement) {
            const percentage = Math.min((current / target) * 100, 100);
            progressElement.style.width = `${percentage}%`;
        }
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
            this.elements.appStatusText.textContent = 'Wellness Reminders Inactive';
        }
    }





    /**
     * Update health score
     * @param {number} waterCompletionRate - Water reminder completion rate (0-1)
     * @param {number} postureCompletionRate - Standup reminder completion rate (0-1)
     */
    updateHealthScore(waterCompletionRate, postureCompletionRate) {
        if (!this.elements.healthScore) {
            return;
        }

        // Simple health score calculation (max 100)
        const score = Math.round((waterCompletionRate * 0.5 + postureCompletionRate * 0.5) * 100);

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