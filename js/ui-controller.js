/**
 * UI Controller - Centralized UI management with proper cleanup
 * Handles DOM updates, event management, and mobile responsiveness
 * 
 * Architecture:
 * - Unified DOM event handling with automatic cleanup
 * - Mobile/desktop responsive behavior
 * - State-driven UI updates
 * - Memory leak prevention through proper event listener management
 */
class UIController {
    /**
     * Create UI controller instance
     * @param {Object} config - UI configuration
     */
    constructor(config = {}) {
        this.config = {
            updateInterval: 1000,
            mobileBreakpoint: 768,
            ...config
        };

        // DOM references with null safety
        this.elements = {
            waterTimer: null,
            waterProgress: null,
            waterBtn: null,
            standupTimer: null,
            standupProgress: null,
            standupBtn: null,
            settingsModal: null,
            settingsBtn: null,
            closeSettings: null,
            saveSettings: null,
            mobileToggle: null,
            desktopToggle: null,
            mobileMenu: null,
            overlay: null
        };

        // Event listeners registry for cleanup
        this.eventListeners = new Map();
        this.resizeObserver = null;
        this.updateInterval = null;
        
        // Direct reminder references (will be set by app)
        this.waterReminder = null;
        this.standupReminder = null;
        
        // Mobile state tracking
        this.isMobile = false;
        this.lastWindowWidth = 0;

        this.init();
    }

    /**
     * Initialize UI controller with proper setup
     * @private
     */
    init() {
        try {
            this.bindElements();
            this.setupEventListeners();
            this.checkMobile();
            this.startUpdateLoop();
            
            console.log('UI Controller initialized with cleanup support');
        } catch (error) {
            console.error('Failed to initialize UI Controller:', error);
        }
    }

    /**
     * Set reminder instances for direct interaction
     * @param {WaterReminder} waterReminder - Water reminder instance
     * @param {StandupReminder} standupReminder - Standup reminder instance
     */
    setReminders(waterReminder, standupReminder) {
        this.waterReminder = waterReminder;
        this.standupReminder = standupReminder;
        this.updateAllUI();
    }

    /**
     * Bind DOM elements with null safety
     * @private
     */
    bindElements() {
        const selectors = {
            waterTimer: '#water-timer',
            waterProgress: '#water-progress',
            waterBtn: '#water-toggle',
            standupTimer: '#standup-timer',
            standupProgress: '#standup-progress',
            standupBtn: '#standup-toggle',
            settingsModal: '#settings-modal',
            settingsBtn: '#settings-btn',
            closeSettings: '#close-settings',
            saveSettings: '#save-settings',
            mobileToggle: '#mobile-toggle',
            desktopToggle: '#desktop-toggle',
            mobileMenu: '#mobile-menu',
            overlay: '#overlay'
        };

        Object.keys(selectors).forEach(key => {
            try {
                this.elements[key] = document.querySelector(selectors[key]);
            } catch (error) {
                console.warn(`Element not found: ${selectors[key]}`);
                this.elements[key] = null;
            }
        });
    }

    /**
     * Setup event listeners with automatic cleanup
     * @private
     */
    setupEventListeners() {
        // Button event listeners
        this.addEventListener('waterBtn', 'click', () => this.toggleReminder('water'));
        this.addEventListener('standupBtn', 'click', () => this.toggleReminder('standup'));
        this.addEventListener('settingsBtn', 'click', () => this.showSettings());
        this.addEventListener('closeSettings', 'click', () => this.hideSettings());
        this.addEventListener('saveSettings', 'click', () => this.saveSettings());
        this.addEventListener('mobileToggle', 'click', () => this.toggleMobileMenu());
        this.addEventListener('desktopToggle', 'click', () => this.toggleMobileMenu());
        this.addEventListener('overlay', 'click', () => this.hideSettings());

        // Window resize with throttling
        this.addEventListener(window, 'resize', this.throttle(() => {
            this.checkMobile();
            this.updateLayout();
        }, 250));

        // Keyboard shortcuts
        this.addEventListener(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideSettings();
                this.hideMobileMenu();
            }
        });

        // Prevent duplicate listeners on mobile/desktop toggle
        this.removeDuplicateListeners();
    }

    /**
     * Add event listener with cleanup tracking
     * @param {Element|string} target - Target element or selector
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @private
     */
    addEventListener(target, event, handler) {
        const element = typeof target === 'string' ? this.elements[target] : target;
        if (!element) return;

        // Remove existing listener for this combination
        this.removeEventListener(target, event);

        // Store reference for cleanup
        const key = `${target}-${event}`;
        const boundHandler = handler.bind(this);
        
        this.eventListeners.set(key, { element, event, handler: boundHandler });
        element.addEventListener(event, boundHandler);
    }

    /**
     * Remove specific event listener
     * @param {Element|string} target - Target element or selector
     * @param {string} event - Event type
     * @private
     */
    removeEventListener(target, event) {
        const key = `${target}-${event}`;
        const listener = this.eventListeners.get(key);
        
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            this.eventListeners.delete(key);
        }
    }

    /**
     * Remove duplicate listeners for mobile/desktop toggle
     * @private
     */
    removeDuplicateListeners() {
        // Ensure we don't have multiple resize listeners
        const resizeKey = 'window-resize';
        if (this.eventListeners.has(resizeKey)) {
            const listener = this.eventListeners.get(resizeKey);
            window.removeEventListener('resize', listener.handler);
            this.eventListeners.delete(resizeKey);
        }
    }



    /**
     * Update reminder UI based on reminder instance
     * @param {string} type - Reminder type
     * @private
     */
    updateReminderUI(type) {
        try {
            const reminder = type === 'water' ? this.waterReminder : this.standupReminder;
            const timerElement = this.elements[`${type}Timer`];
            const progressElement = this.elements[`${type}Progress`];
            const btnElement = this.elements[`${type}Btn`];

            if (!timerElement || !progressElement || !btnElement) {
                console.warn(`Missing UI elements for ${type}`);
                return;
            }

            if (!reminder) {
                this.setReminderInactive(type);
                return;
            }

            const isActive = reminder.isActive;
            const timeRemaining = Math.max(0, reminder.getTimeRemaining?.() || 0);
            const interval = reminder.interval || 30;
            const totalTime = interval * 60 * 1000;

            if (isActive) {
                const progress = Math.max(0, Math.min(100, ((totalTime - timeRemaining) / totalTime) * 100));
                const formattedTime = this.formatTime(timeRemaining);

                timerElement.textContent = formattedTime;
                progressElement.style.width = `${progress}%`;
                progressElement.className = `progress-fill ${type}-progress`;
                btnElement.textContent = 'Stop';
                btnElement.className = `btn btn-${type} btn-stop`;
            } else {
                this.setReminderInactive(type);
            }

        } catch (error) {
            console.error(`Error updating ${type} reminder UI:`, error);
        }
    }

    /**
     * Set reminder to inactive state
     * @param {string} type - Reminder type
     * @private
     */
    setReminderInactive(type) {
        const timerElement = this.elements[`${type}Timer`];
        const progressElement = this.elements[`${type}Progress`];
        const btnElement = this.elements[`${type}Btn`];

        if (timerElement) timerElement.textContent = 'Ready';
        if (progressElement) {
            progressElement.style.width = '0%';
            progressElement.className = `progress-fill ${type}-progress`;
        }
        if (btnElement) {
            btnElement.textContent = 'Start';
            btnElement.className = `btn btn-${type}`;
        }
    }

    /**
     * Update settings UI
     * @param {Object} settings - App settings
     * @private
     */
    updateSettingsUI(settings) {
        if (!settings) return;

        const inputs = {
            'water-interval': settings.waterInterval,
            'standup-interval': settings.standupInterval,
            'water-enabled': settings.waterEnabled,
            'standup-enabled': settings.standupEnabled
        };

        Object.keys(inputs).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = Boolean(inputs[id]);
                } else {
                    element.value = inputs[id] || '';
                }
            }
        });
    }

    /**
     * Toggle reminder state
     * @param {string} type - Reminder type
     * @private
     */
    toggleReminder(type) {
        try {
            const reminder = type === 'water' ? this.waterReminder : this.standupReminder;
            if (!reminder) {
                console.error(`${type} reminder not available`);
                return;
            }

            if (reminder.isActive) {
                reminder.stop();
            } else {
                reminder.start();
            }
            
            console.log(`${type} reminder toggled: ${reminder.isActive ? 'ON' : 'OFF'}`);
        } catch (error) {
            console.error(`Failed to toggle ${type} reminder:`, error);
        }
    }

    /**
     * Show settings modal
     * @private
     */
    showSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.add('active');
            if (this.elements.overlay) {
                this.elements.overlay.classList.add('active');
            }
        }
    }

    /**
     * Hide settings modal
     * @private
     */
    hideSettings() {
        if (this.elements.settingsModal) {
            this.elements.settingsModal.classList.remove('active');
            if (this.elements.overlay) {
                this.elements.overlay.classList.remove('active');
            }
        }
    }

    /**
     * Toggle mobile menu
     * @private
     */
    toggleMobileMenu() {
        if (this.elements.mobileMenu) {
            this.elements.mobileMenu.classList.toggle('active');
            if (this.elements.overlay) {
                this.elements.overlay.classList.toggle('active');
            }
        }
    }

    /**
     * Hide mobile menu
     * @private
     */
    hideMobileMenu() {
        if (this.elements.mobileMenu) {
            this.elements.mobileMenu.classList.remove('active');
            if (this.elements.overlay) {
                this.elements.overlay.classList.remove('active');
            }
        }
    }

    /**
     * Save settings from modal
     * @private
     */
    saveSettings() {
        try {
            const settings = {
                waterInterval: parseInt(document.getElementById('water-interval')?.value || '30', 10),
                standupInterval: parseInt(document.getElementById('standup-interval')?.value || '45', 10),
                waterEnabled: document.getElementById('water-enabled')?.checked || false,
                standupEnabled: document.getElementById('standup-enabled')?.checked || false
            };

            this.stateManager.updateState('app', { settings });
            this.hideSettings();
            
            console.log('Settings saved:', settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Check if device is mobile
     * @private
     */
    checkMobile() {
        const currentWidth = window.innerWidth;
        const wasMobile = this.isMobile;
        
        this.isMobile = currentWidth <= this.config.mobileBreakpoint;
        this.lastWindowWidth = currentWidth;

        if (wasMobile !== this.isMobile) {
            this.updateLayout();
            console.log(`Device type changed: ${this.isMobile ? 'Mobile' : 'Desktop'}`);
        }
    }

    /**
     * Update layout based on device type
     * @private
     */
    updateLayout() {
        // Handle responsive behavior
        if (this.isMobile) {
            document.body.classList.add('mobile');
            document.body.classList.remove('desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile');
            this.hideMobileMenu(); // Close mobile menu on desktop
        }
    }

    /**
     * Start UI update loop
     * @private
     */
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.updateAllUI();
        }, this.config.updateInterval);
    }

    /**
     * Update all UI elements
     * @private
     */
    updateAllUI() {
        ['water', 'standup'].forEach(type => {
            this.updateReminderUI(type);
        });
    }

    /**
     * Format time remaining for display
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time string
     * @private
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Throttle function to limit event frequency
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     * @private
     */
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    /**
     * Clean up all resources
     * @public
     */
    destroy() {
        try {
            // Clear update interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            // Remove all event listeners
            this.eventListeners.forEach(({ element, event, handler }) => {
                if (element && element.removeEventListener) {
                    element.removeEventListener(event, handler);
                }
            });
            this.eventListeners.clear();

            // Clear any remaining intervals/timeouts
            const highestTimeoutId = setTimeout(() => {});
            for (let i = 0; i < highestTimeoutId; i++) {
                clearTimeout(i);
                clearInterval(i);
            }

            console.log('UI Controller destroyed with complete cleanup');
        } catch (error) {
            console.error('Error during UI Controller cleanup:', error);
        }
    }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}

// Export for browser use
window.UIController = UIController;