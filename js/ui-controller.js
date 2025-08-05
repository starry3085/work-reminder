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
            waterCountdown: null,
            waterBtn: null,
            waterInterval: null,
            standupCountdown: null,
            standupBtn: null,
            standupInterval: null
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
        
        // Force immediate UI update
        setTimeout(() => {
            this.updateAllUI();
        }, 50);
    }

    /**
     * Bind DOM elements with null safety
     * @private
     */
    bindElements() {
        const selectors = {
            waterCountdown: '#water-countdown',
            waterBtn: '#water-toggle',
            waterInterval: '#water-interval-display',
            standupCountdown: '#standup-countdown',
            standupBtn: '#standup-toggle',
            standupInterval: '#standup-interval-display'
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
     * Setup event listeners - MVP version
     * @private
     */
    setupEventListeners() {
        // Core button event listeners
        this.addEventListener('waterBtn', 'click', () => this.toggleReminder('water'));
        this.addEventListener('standupBtn', 'click', () => this.toggleReminder('standup'));

        // Interval input change listeners
        this.addEventListener('waterInterval', 'change', () => this.updateInterval('water'));
        this.addEventListener('standupInterval', 'change', () => this.updateInterval('standup'));

        // Window resize for mobile detection
        this.addEventListener(window, 'resize', this.throttle(() => {
            this.checkMobile();
            this.updateLayout();
        }, 250));
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

    // Duplicate listener removal not needed for MVP



    /**
     * Update reminder UI based on reminder instance - MVP version
     * @param {string} type - Reminder type
     * @private
     */
    updateReminderUI(type) {
        try {
            const reminder = type === 'water' ? this.waterReminder : this.standupReminder;
            const countdownElement = this.elements[`${type}Countdown`];
            const btnElement = this.elements[`${type}Btn`];

            if (!countdownElement || !btnElement) {
                console.warn(`Missing UI elements for ${type}`);
                return;
            }

            if (!reminder) {
                this.setReminderInactive(type);
                return;
            }

            const isActive = reminder.isActive;

            if (isActive) {
                // Show countdown time when active
                const timeRemaining = Math.max(0, reminder.getTimeRemaining?.() || 0);
                const formattedTime = this.formatTime(timeRemaining);
                countdownElement.textContent = formattedTime;
                
                // Update button to Stop with warning style
                btnElement.textContent = 'Stop';
                btnElement.className = 'btn-warning';
            } else {
                // Show full interval time when inactive
                const intervalMinutes = reminder.settings?.interval || (type === 'water' ? 30 : 45);
                const intervalTime = intervalMinutes * 60 * 1000; // Convert to milliseconds
                const formattedTime = this.formatTime(intervalTime);
                countdownElement.textContent = formattedTime;
                
                // Update button to Start with primary style
                btnElement.textContent = 'Start';
                btnElement.className = 'btn-primary';
            }

        } catch (error) {
            console.error(`Error updating ${type} reminder UI:`, error);
        }
    }

    /**
     * Set reminder to inactive state - MVP version
     * @param {string} type - Reminder type
     * @private
     */
    setReminderInactive(type) {
        const countdownElement = this.elements[`${type}Countdown`];
        const btnElement = this.elements[`${type}Btn`];

        // Show full interval time instead of "Ready"
        const defaultInterval = type === 'water' ? 30 : 45; // Default intervals
        const intervalTime = defaultInterval * 60 * 1000; // Convert to milliseconds
        const formattedTime = this.formatTime(intervalTime);

        if (countdownElement) countdownElement.textContent = formattedTime;
        if (btnElement) {
            btnElement.textContent = 'Start';
            btnElement.className = 'btn-primary';
        }
    }

    // Settings UI methods removed for MVP - using inline inputs

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
     * Update reminder interval from input
     * @param {string} type - Reminder type
     * @private
     */
    updateInterval(type) {
        try {
            const intervalElement = this.elements[`${type}Interval`];
            const reminder = type === 'water' ? this.waterReminder : this.standupReminder;
            
            if (!intervalElement || !reminder) return;
            
            const newInterval = parseInt(intervalElement.value, 10);
            if (newInterval >= 1 && newInterval <= 120) {
                reminder.settings.interval = newInterval;
                
                // If reminder is not active, update the countdown display
                if (!reminder.isActive) {
                    this.updateReminderUI(type);
                }
                
                console.log(`${type} interval updated to ${newInterval} minutes`);
            } else {
                // Reset to previous valid value
                intervalElement.value = reminder.settings.interval;
            }
        } catch (error) {
            console.error(`Failed to update ${type} interval:`, error);
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