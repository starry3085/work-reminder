/**
 * Mobile Adapter - Enhanced browser compatibility and mobile device adaptation
 * Provides feature detection, mobile optimization, and prevents duplicate event registration
 */
class MobileAdapter {
    constructor(errorHandler) {
        this.errorHandler = errorHandler || (window.ErrorHandler ? new window.ErrorHandler() : null);
        this.features = {
            localStorage: this.isLocalStorageAvailable(),
            notifications: 'Notification' in window,
            audio: 'Audio' in window,
            serviceWorker: 'serviceWorker' in navigator,
            touchEvents: 'ontouchstart' in window
        };
        
        this.isInitialized = false;
        this.resizeObserver = null;
        this.breakpoint = 768;
        
        this.setupEventListeners();
        this.applyInitialAdaptation();
        
        console.log('Mobile Adapter initialized:', {
            features: this.features,
            isMobile: this.isMobileDevice(),
            viewport: { width: window.innerWidth, height: window.innerHeight }
        });
    }

    /**
     * Check if local storage is available
     * @returns {boolean} Whether local storage is available
     * @private
     */
    isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            const result = localStorage.getItem(testKey) === testKey;
            localStorage.removeItem(testKey);
            return result;
        } catch (e) {
            this.errorHandler?.handleError({
                type: 'storage',
                error: e,
                message: 'Local storage unavailable',
                timestamp: Date.now()
            });
            return false;
        }
    }

    /**
     * Detect if current device is mobile
     * @returns {boolean} Whether is mobile device
     */
    isMobileDevice() {
        const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const viewportCheck = window.innerWidth <= this.breakpoint;
        
        return userAgentCheck || viewportCheck;
    }

    /**
     * Setup event listeners with deduplication and cleanup
     * @private
     */
    setupEventListeners() {
        if (this.isInitialized) return;

        // Use ResizeObserver for responsive handling (more efficient than resize events)
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.handleViewportChange();
            });
            this.resizeObserver.observe(document.body);
        } else {
            // Fallback to resize event with debouncing
            this.debouncedResize = this.debounce(() => {
                this.handleViewportChange();
            }, 250);
            window.addEventListener('resize', this.debouncedResize);
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleViewportChange(), 100);
        });

        this.isInitialized = true;
    }

    /**
     * Apply initial mobile adaptation
     * @private
     */
    applyInitialAdaptation() {
        this.handleViewportChange();
        this.applyTouchOptimizations();
    }

    /**
     * Handle viewport changes with mobile detection
     * @private
     */
    handleViewportChange() {
        const isMobile = this.isMobileDevice();
        const wasMobile = document.body.classList.contains('mobile-device');

        if (isMobile !== wasMobile) {
            if (isMobile) {
                document.body.classList.add('mobile-device');
                document.body.classList.remove('desktop-device');
                this.applyMobileOptimizations();
            } else {
                document.body.classList.remove('mobile-device');
                document.body.classList.add('desktop-device');
                this.applyDesktopOptimizations();
            }

            console.log(`Device type changed to: ${isMobile ? 'mobile' : 'desktop'}`);
            
            // Emit custom event for other components
            window.dispatchEvent(new CustomEvent('deviceTypeChanged', {
                detail: { isMobile, viewport: { width: window.innerWidth, height: window.innerHeight } }
            }));
        }

        // Always update viewport info
        document.documentElement.style.setProperty('--viewport-width', `${window.innerWidth}px`);
        document.documentElement.style.setProperty('--viewport-height', `${window.innerHeight}px`);
    }

    /**
     * Apply mobile-specific optimizations
     * @private
     */
    applyMobileOptimizations() {
        // Add mobile-specific CSS classes
        document.documentElement.classList.add('mobile-optimized');
        
        // Optimize for touch interactions
        if (this.features.touchEvents) {
            document.body.classList.add('touch-enabled');
        }

        // Set appropriate meta viewport
        this.updateViewportMeta();
    }

    /**
     * Apply desktop-specific optimizations
     * @private
     */
    applyDesktopOptimizations() {
        document.documentElement.classList.remove('mobile-optimized');
        document.body.classList.remove('touch-enabled');
    }

    /**
     * Apply touch optimizations
     * @private
     */
    applyTouchOptimizations() {
        if (this.features.touchEvents) {
            // Increase touch target sizes
            document.documentElement.style.setProperty('--touch-target-size', '44px');
            
            // Prevent zoom on double tap
            let lastTouchEnd = 0;
            document.addEventListener('touchend', (event) => {
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }
    }

    /**
     * Update viewport meta tag for mobile optimization
     * @private
     */
    updateViewportMeta() {
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }

        if (this.isMobileDevice()) {
            viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        } else {
            viewportMeta.content = 'width=device-width, initial-scale=1.0';
        }
    }

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     * @private
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get device information
     * @returns {Object} Comprehensive device information
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobileDevice(),
            isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
            isDesktop: window.innerWidth > 1024,
            features: { ...this.features },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
                orientation: screen.orientation?.angle || 0
            },
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
        };
    }

    /**
     * Check feature support with detailed info
     * @returns {Object} Detailed feature support status
     */
    checkFeatures() {
        return {
            storage: {
                available: this.features.localStorage,
                type: this.features.localStorage ? 'localStorage' : 'memory'
            },
            notifications: {
                available: this.features.notifications,
                permission: this.features.notifications ? Notification.permission : 'unsupported'
            },
            audio: {
                available: this.features.audio,
                context: !!(window.AudioContext || window.webkitAudioContext)
            },
            serviceWorker: {
                available: this.features.serviceWorker,
                active: navigator.serviceWorker?.controller?.state === 'activated'
            },
            touch: {
                available: this.features.touchEvents,
                points: navigator.maxTouchPoints || 0
            }
        };
    }

    /**
     * Request notification permission
     * @returns {Promise<string>} Permission result
     */
    async requestNotificationPermission() {
        if (!this.features.notifications) {
            return 'unsupported';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        try {
            const permission = await Notification.requestPermission();
            return permission;
        } catch (error) {
            this.errorHandler?.handleError({
                type: 'notification',
                error,
                message: 'Failed to request notification permission',
                timestamp: Date.now()
            });
            return 'denied';
        }
    }

    /**
     * Get optimal breakpoint for responsive design
     * @returns {Object} Breakpoint information
     */
    getBreakpoints() {
        return {
            mobile: 768,
            tablet: 1024,
            desktop: 1200,
            current: window.innerWidth,
            isMobile: window.innerWidth <= 768,
            isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
            isDesktop: window.innerWidth > 1024
        };
    }

    /**
     * Cleanup resources and remove event listeners
     */
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        if (this.debouncedResize) {
            window.removeEventListener('resize', this.debouncedResize);
            this.debouncedResize = null;
        }

        window.removeEventListener('orientationchange', this.handleViewportChange);

        // Remove CSS classes
        document.body.classList.remove('mobile-device', 'desktop-device', 'touch-enabled');
        document.documentElement.classList.remove('mobile-optimized');

        this.isInitialized = false;
        console.log('Mobile Adapter cleaned up');
    }
}

// Export for global use
window.MobileAdapter = MobileAdapter;

// Auto-initialize if not explicitly created
if (typeof window !== 'undefined' && !window.mobileAdapterInstance) {
    window.mobileAdapterInstance = new MobileAdapter();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileAdapter;
}