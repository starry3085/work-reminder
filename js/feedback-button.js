/**
 * Feedback Button Module
 * Provides GitHub Issues integration for user feedback
 */

class FeedbackButton {
    constructor() {
        this.button = null;
        this.tooltip = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the feedback button
     */
    init() {
        if (this.isInitialized) return;
        
        this.createButton();
        this.createTooltip();
        this.bindEvents();
        this.isInitialized = true;
    }

    /**
     * Create the feedback button element
     */
    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'feedback-button';
        this.button.setAttribute('aria-label', 'Provide feedback or report issues');
        this.button.setAttribute('title', 'Feedback requires GitHub account');
        this.button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
        `;
        
        document.body.appendChild(this.button);
    }

    /**
     * Create tooltip element
     */
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'feedback-tooltip';
        this.tooltip.textContent = 'Requires GitHub account to submit feedback';
        this.tooltip.setAttribute('role', 'tooltip');
        document.body.appendChild(this.tooltip);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Click handler
        this.button.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleFeedbackClick();
        });

        // Keyboard support
        this.button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleFeedbackClick();
            }
        });

        // Tooltip events
        this.button.addEventListener('mouseenter', () => {
            this.showTooltip();
        });

        this.button.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        this.button.addEventListener('focus', () => {
            this.showTooltip();
        });

        this.button.addEventListener('blur', () => {
            this.hideTooltip();
        });

        // Handle window resize for tooltip positioning
        window.addEventListener('resize', () => {
            this.updateTooltipPosition();
        });
    }

    /**
     * Handle feedback button click
     */
    handleFeedbackClick() {
        // Track analytics
        if (window.analytics && window.analytics.track) {
            window.analytics.track('feedback_button_clicked');
        }

        // Open GitHub Issues with pre-filled template
        const githubUrl = 'https://github.com/starry3085/hydrate-move/issues/new?template=user-feedback.yml';
        window.open(githubUrl, '_blank', 'noopener,noreferrer');
    }

    /**
     * Show tooltip
     */
    showTooltip() {
        if (!this.tooltip) return;
        
        this.updateTooltipPosition();
        this.tooltip.classList.add('visible');
    }

    /**
     * Hide tooltip
     */
    hideTooltip() {
        if (!this.tooltip) return;
        
        this.tooltip.classList.remove('visible');
    }

    /**
     * Update tooltip position
     */
    updateTooltipPosition() {
        if (!this.button || !this.tooltip) return;

        const buttonRect = this.button.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Position tooltip below the button
        let left = buttonRect.left + (buttonRect.width - tooltipRect.width) / 2;
        let top = buttonRect.bottom + 8;

        // Ensure tooltip stays within viewport
        if (left < 8) left = 8;
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
    }

    /**
     * Check if button is visible
     */
    isVisible() {
        return this.button && this.button.style.display !== 'none';
    }

    /**
     * Show feedback button
     */
    show() {
        if (this.button) {
            this.button.style.display = 'block';
        }
    }

    /**
     * Hide feedback button
     */
    hide() {
        if (this.button) {
            this.button.style.display = 'none';
        }
        this.hideTooltip();
    }

    /**
     * Destroy feedback button
     */
    destroy() {
        if (this.button) {
            this.button.remove();
            this.button = null;
        }
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeedbackButton;
} else {
    window.FeedbackButton = FeedbackButton;
}