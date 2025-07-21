/**
 * Mobile Adapter Module
 * Handles mobile-specific interactions and optimizations
 */
class MobileAdapter {
    constructor() {
        this.isMobile = this.checkIfMobile();
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
        this.settingsPanel = document.getElementById('settings-panel');
        this.initialized = false;
        
        // Initialize if mobile device
        if (this.isMobile) {
            this.init();
        }
    }
    
    /**
     * Check if the current device is mobile
     * @returns {boolean} True if mobile device
     */
    checkIfMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               window.innerWidth <= 768;
    }
    
    /**
     * Initialize mobile adaptations
     */
    init() {
        if (this.initialized) return;
        
        this.addTouchFeedback();
        this.setupSwipeGestures();
        this.addSwipeIndicator();
        this.optimizeNotifications();
        this.adjustSettingsForMobile();
        
        // Add mobile class to body for CSS targeting
        document.body.classList.add('mobile-device');
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => this.handleOrientationChange());
        
        this.initialized = true;
        console.log('Mobile adaptations initialized');
    }
    
    /**
     * Add touch feedback to interactive elements
     */
    addTouchFeedback() {
        const touchElements = document.querySelectorAll('button, .reminder-card, .setting-item');
        touchElements.forEach(element => {
            element.classList.add('mobile-touch-feedback');
        });
    }
    
    /**
     * Setup swipe gestures for opening/closing panels
     */
    setupSwipeGestures() {
        // Create swipe area for opening settings
        const swipeArea = document.createElement('div');
        swipeArea.className = 'swipe-area';
        document.body.appendChild(swipeArea);
        
        // Touch event listeners for the whole document
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);
        
        // Specific listener for the swipe area to open settings
        swipeArea.addEventListener('touchend', () => {
            if (this.touchEndX - this.touchStartX < -this.minSwipeDistance) {
                // Open settings panel on left swipe from right edge
                this.settingsPanel.classList.add('show');
            }
        });
    }
    
    /**
     * Add visual swipe indicator
     */
    addSwipeIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'swipe-indicator';
        document.body.appendChild(indicator);
        
        // Hide indicator after 5 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
            }, 300);
        }, 5000);
    }
    
    /**
     * Handle touch start event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }
    
    /**
     * Handle touch end event
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
    }
    
    /**
     * Process swipe gestures
     */
    handleSwipe() {
        // Right to left swipe (open settings)
        if (this.touchEndX - this.touchStartX < -this.minSwipeDistance && 
            !this.settingsPanel.classList.contains('show')) {
            this.settingsPanel.classList.add('show');
        }
        
        // Left to right swipe (close settings)
        else if (this.touchEndX - this.touchStartX > this.minSwipeDistance && 
                this.settingsPanel.classList.contains('show')) {
            this.settingsPanel.classList.remove('show');
        }
    }
    
    /**
     * Optimize notifications for mobile display
     */
    optimizeNotifications() {
        // Adjust notification position based on orientation
        this.handleOrientationChange();
        
        // Make notification alerts dismissible with tap
        const notificationAlert = document.querySelector('.notification-alert');
        if (notificationAlert) {
            notificationAlert.addEventListener('click', (e) => {
                // Only dismiss if clicking the background, not buttons
                if (e.target === notificationAlert) {
                    notificationAlert.classList.remove('show');
                }
            });
        }
    }
    
    /**
     * Adjust settings panel for mobile use
     */
    adjustSettingsForMobile() {
        // Make range inputs update in real-time on mobile
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        rangeInputs.forEach(input => {
            const targetInput = document.getElementById(input.id.replace('-slider', ''));
            if (targetInput) {
                input.addEventListener('input', () => {
                    targetInput.value = input.value;
                });
            }
        });
        
        // Improve scrolling in settings panel
        this.settingsPanel.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: true });
    }
    
    /**
     * Handle orientation changes
     */
    handleOrientationChange() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // Adjust notification position based on orientation
        const notificationAlert = document.querySelector('.notification-alert');
        if (notificationAlert) {
            if (isLandscape) {
                notificationAlert.style.bottom = 'auto';
                notificationAlert.style.top = '20px';
            } else {
                notificationAlert.style.top = 'auto';
                notificationAlert.style.bottom = '20px';
            }
        }
        
        // Add appropriate orientation class to body
        document.body.classList.remove('landscape', 'portrait');
        document.body.classList.add(isLandscape ? 'landscape' : 'portrait');
    }
}

// Initialize mobile adapter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileAdapter = new MobileAdapter();
});