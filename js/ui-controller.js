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
            updateInterval: UI_CONSTANTS.UPDATE_LOOP_INTERVAL_MS,
            mobileBreakpoint: UI_CONSTANTS.MOBILE_BREAKPOINT,
            ...config
        };

        // DOM references with null safety
        this.elements = {
            waterCountdown: null,
            waterBtn: null,
            standupCountdown: null,
            standupBtn: null
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
            console.log('🎨 Initializing UI Controller...');
            
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.performInit());
            } else {
                this.performInit();
            }
        } catch (error) {
            console.error('Failed to initialize UI Controller:', error);
            throw error;
        }
    }

    /**
     * Perform actual initialization after DOM is ready
     * @private
     */
    performInit() {
        try {
            this.bindElements();
            this.validateElements();
            this.setupEventListeners();
            this.checkMobile();
            this.startUpdateLoop();
            
            console.log('✅ UI Controller initialized successfully');
        } catch (error) {
            console.error('❌ UI Controller initialization failed:', error);
            throw error;
        }
    }

    /**
     * Set reminder instances for direct interaction
     * @param {WaterReminder} waterReminder - Water reminder instance
     * @param {StandupReminder} standupReminder - Standup reminder instance
     */
    setReminders(waterReminder, standupReminder) {
        if (!waterReminder || !standupReminder) {
            console.error('Invalid reminder instances provided');
            return;
        }
        
        this.waterReminder = waterReminder;
        this.standupReminder = standupReminder;
        
        console.log('✅ Reminders successfully linked to UI controller');
        
        // Update UI immediately with proper initialization state
        this.updateAllUI();
    }

    /**
     * Bind DOM elements with null safety
     * @private
     */
    bindElements() {
        const selectors = {
            waterCountdown: '#water-countdown',
            waterBtn: '#water-toggle',
            standupCountdown: '#standup-countdown',
            standupBtn: '#standup-toggle'
        };

        Object.keys(selectors).forEach(key => {
            try {
                this.elements[key] = document.querySelector(selectors[key]);
                if (!this.elements[key]) {
                    console.warn(`⚠️ Element not found: ${selectors[key]}`);
                }
            } catch (error) {
                console.error(`❌ Error finding element ${selectors[key]}:`, error);
                this.elements[key] = null;
            }
        });
    }

    /**
     * Validate critical elements are found
     * @private
     */
    validateElements() {
        const criticalElements = ['waterBtn', 'standupBtn', 'waterCountdown', 'standupCountdown'];
        const missing = criticalElements.filter(key => !this.elements[key]);
        
        if (missing.length > 0) {
            throw new Error(`Critical UI elements missing: ${missing.join(', ')}`);
        }
        
        console.log('✅ All critical UI elements found');
    }

    /**
     * Setup event listeners - MVP version
     * @private
     */
    setupEventListeners() {
        // Core button event listeners
        this.addEventListener('waterBtn', 'click', () => this.toggleReminder('water'));
        this.addEventListener('standupBtn', 'click', () => this.toggleReminder('standup'));

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
                // Show initializing state
                countdownElement.textContent = '...';
                btnElement.textContent = 'Loading...';
                btnElement.className = 'btn-secondary';
                btnElement.disabled = true;
                return;
            }

            // Enable button once reminder is ready
            btnElement.disabled = false;

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
                // Show time remaining (which should match interval when inactive)
                const timeRemaining = Math.max(0, reminder.timeRemaining || 0);
                const formattedTime = this.formatTime(timeRemaining);
                countdownElement.textContent = formattedTime;
                
                // Update button to Start with primary style
                btnElement.textContent = 'Start';
                btnElement.className = 'btn-primary';
            }

        } catch (error) {
            console.error(`Error updating ${type} reminder UI:`, error);
            this.showUserError(`Could not update ${type} display`, error.message);
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

        if (!countdownElement || !btnElement) {
            console.warn(`Missing elements for ${type} reminder`);
            return;
        }

        // Get actual interval from reminder settings
        const reminder = type === 'water' ? this.waterReminder : this.standupReminder;
        const interval = reminder?.settings?.interval || REMINDER_CONSTANTS.DEFAULT_INTERVAL_MINUTES;
        const intervalTime = interval * 60 * 1000; // Convert to milliseconds
        const formattedTime = this.formatTime(intervalTime);

        countdownElement.textContent = formattedTime;
        btnElement.textContent = 'Start';
        btnElement.className = 'btn-primary';
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
                console.error(`${type} reminder not available - still initializing`);
                // Show user-friendly message
                const btn = this.elements[`${type}Btn`];
                if (btn) {
                    btn.textContent = 'Loading...';
                    btn.disabled = true;
                    setTimeout(() => {
                        btn.textContent = 'Start';
                        btn.disabled = false;
                    }, 2000);
                }
                return;
            }

            if (reminder.isActive) {
                reminder.stop();
                console.log(`${type} reminder stopped`);
            } else {
                reminder.start();
                console.log(`${type} reminder started`);
            }
            
            this.updateReminderUI(type);
            
        } catch (error) {
            console.error(`Failed to toggle ${type} reminder:`, error);
            this.showUserError(`Could not ${type} reminder`, error.message);
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
     * Show user-friendly error message
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @private
     */
    showUserError(title, message) {
        console.error(`${title}: ${message}`);
        // In MVP, we'll use alert for simplicity
        alert(`${title}\n\n${message}`);
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