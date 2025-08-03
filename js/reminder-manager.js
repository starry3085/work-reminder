/**
 * Reminder Manager - Core class for managing water and standup reminders
 * Responsible for timer management, status tracking, reminder triggering and persistent storage
 */
class ReminderManager {
    /**
     * Create reminder manager instance
     * @param {string} type - Reminder type ('water' | 'standup')
     * @param {Object} settings - Reminder settings
     * @param {NotificationService} notificationService - Notification service instance
     */
    constructor(type, settings, notificationService) {
        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        
        // State management
        this.isActive = false;
        this.isPaused = false;
        this.timer = null;
        this.startTime = null;
        this.pauseTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
        
        // Callback functions
        this.statusChangeCallback = null;
        this.timeUpdateCallback = null;
        this.settingsUpdateCallback = null;
        
        // Timer update interval (1 second)
        this.updateInterval = 1000;
        this.updateTimer = null;
        
        console.log(`${this.type} reminder manager created`);
    }

    // Activity detection removed for MVP - using simpler time-based reminders

    /**
     * Start reminder
     */
    start() {
        if (this.isActive) {
            console.warn(`${this.type} reminder is already running`);
            return;
        }
        
        this.isActive = true;
        this.isPaused = false;
        this.startTime = Date.now();
        
        // Use precise millisecond calculation
        const intervalMs = Math.round(this.settings.interval * 60 * 1000);
        this.timeRemaining = intervalMs;
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Start timer
        this.startTimer();
        
        // Start time update timer
        this.startUpdateTimer();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'started',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder started, interval: ${this.settings.interval} minutes (${intervalMs}ms)`);
    }

    /**
     * Stop reminder
     */
    stop() {
        if (!this.isActive) {
            console.warn(`${this.type} reminder is not running`);
            return;
        }
        
        this.isActive = false;
        this.isPaused = false;
        
        // Clear timers
        this.clearTimer();
        this.clearUpdateTimer();
        
        // Reset state
        this.resetState();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: false,
            isPaused: false,
            timeRemaining: 0,
            nextReminderAt: 0
        };
        this.updateState(updates);
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'stopped',
            isActive: false,
            isPaused: false,
            timeRemaining: 0
        });
        
        console.log(`${this.type} reminder stopped`);
    }

    /**
     * Pause reminder - simplified
     * @param {boolean} isAuto - Whether it's auto-pause (triggered by activity detection)
     */
    pause(isAuto = false) {
        if (!this.isActive || this.isPaused) {
            return;
        }
        
        this.isPaused = true;
        this.pauseTime = Date.now();
        
        // Calculate remaining time
        this.timeRemaining = Math.max(0, this.nextReminderTime - this.pauseTime);
        
        // Clear timer
        this.clearTimer();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: true,
            isPaused: true,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: isAuto ? 'auto-paused' : 'paused',
            isActive: true,
            isPaused: true,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder ${isAuto ? 'auto' : 'manually'} paused`);
    }

    /**
     * Resume reminder - simplified
     * @param {boolean} isAuto - Whether it's auto-resume (triggered by activity detection)
     */
    resume(isAuto = false) {
        if (!this.isActive || !this.isPaused) {
            return;
        }
        
        this.isPaused = false;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timer
        this.startTimer();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: isAuto ? 'auto-resumed' : 'resumed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder ${isAuto ? 'auto' : 'manually'} resumed`);
    }

    /**
     * Reset reminder timer
     */
    reset() {
        const wasActive = this.isActive;
        
        // Ensure clean state before restart
        this.isActive = false;
        this.isPaused = false;
        
        // Clear all timers and state
        this.clearTimer();
        this.clearUpdateTimer();
        this.resetState();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: false,
            isPaused: false,
            timeRemaining: 0,
            nextReminderAt: 0
        };
        this.updateState(updates);
        
        if (wasActive) {
            // Restart with fresh interval
            this.start();
        } else {
            // Update UI via state change
            this.triggerStatusChange({
                status: 'reset',
                isActive: false,
                isPaused: false,
                timeRemaining: 0
            });
        }
        
        console.log(`${this.type} reminder reset`);
    }

    /**
     * Acknowledge reminder (user has performed the corresponding action)
     */
    acknowledge() {
        if (!this.isActive) {
            console.warn(`${this.type} reminder is not running`);
            return;
        }
        
        // Update last reminder time
        this.settings.lastReminder = Date.now();
        
        // 通过StateManager更新设置
        this.updateState({ settings: this.settings });
        
        // Reset and restart timer
        this.resetAndRestart();
        
        console.log(`${this.type} reminder acknowledged, timer restarted`);
    }

    /**
     * Reset and restart timer with current settings
     * @private
     */
    resetAndRestart() {
        if (!this.isActive) return;
        
        // Clear current timers
        this.clearTimer();
        this.clearUpdateTimer();
        
        // Reset state and restart
        this.startTime = Date.now();
        const intervalMs = Math.round(this.settings.interval * 60 * 1000);
        this.timeRemaining = intervalMs;
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timers
        this.startTimer();
        this.startUpdateTimer();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        
        // Trigger status change
        this.triggerStatusChange({
            status: 'restarted',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder reset and restarted with ${this.settings.interval}min interval`);
    }



    /**
     * Set status change callback
     * @param {Function} callback - Callback function
     */
    setStatusChangeCallback(callback) {
        this.statusChangeCallback = callback;
    }

    /**
     * Set time update callback
     * @param {Function} callback - Callback function
     */
    setTimeUpdateCallback(callback) {
        this.timeUpdateCallback = callback;
    }

    /**
     * Set settings update callback
     * @param {Function} callback - Callback function
     */
    setSettingsUpdateCallback(callback) {
        this.settingsUpdateCallback = callback;
    }

    /**
     * Update settings dynamically
     * @param {Object} newSettings - New settings object
     */
    updateSettings(newSettings) {
        const wasActive = this.isActive;
        const oldInterval = this.settings.interval;
        
        // Update settings
        this.settings = { ...this.settings, ...newSettings };
        
        // If interval changed and reminder is active, restart with new interval
        if (wasActive && oldInterval !== newSettings.interval) {
            this.stop();
            this.start();
        }
        
        console.log(`${this.type} settings updated:`, this.settings);
    }

    /**
     * Get current reminder status for state persistence
     * @returns {Object} Current status object with unified format
     */
    getCurrentStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isPaused: this.isPaused,
            timeRemaining: this.timeRemaining,
            nextReminderTime: this.nextReminderTime,
            lastAcknowledged: this.settings.lastReminder,
            interval: this.settings.interval,
            enabled: this.settings.enabled !== false,
            settings: { ...this.settings }
        };
    }

    /**
     * Notify status change - no longer save state directly, handled uniformly by application
     * @private
     */
    notifyStateChange() {
        if (this.statusChangeCallback) {
            const status = this.getCurrentStatus();
            status.type = this.type;
            this.statusChangeCallback(status);
        }
    }

    /**
     * Start timer
     * @private
     */
    startTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        
        this.timer = setTimeout(() => {
            this.triggerReminder();
        }, this.timeRemaining);
    }

    /**
     * Clear timer
     * @private
     */
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     * Start time update timer
     * @private
     */
    startUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            this.updateTimeRemaining();
        }, this.updateInterval);
    }

    /**
     * Clear time update timer
     * @private
     */
    clearUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * Update remaining time
     * @private
     */
    updateTimeRemaining() {
        if (!this.isActive || this.isPaused) {
            return;
        }
        
        const now = Date.now();
        this.timeRemaining = Math.max(0, this.nextReminderTime - now);
        
        // Trigger time update callback
        if (this.timeUpdateCallback) {
            this.timeUpdateCallback({
                type: this.type,
                timeRemaining: this.timeRemaining,
                nextReminderTime: this.nextReminderTime,
                progress: 1 - (this.timeRemaining / (this.settings.interval * 60 * 1000))
            });
        }
    }

    /**
     * Trigger reminder
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = this.type === 'water' ? '💧 Time to Hydrate!' : '🧘 Time to Stand Up!';
        const message = this.type === 'water' 
            ? 'Long work sessions can lead to dehydration, remember to drink water!' 
            : 'Sitting too long is bad for your health, get up and move around!';
        
        // Show notification
        this.notificationService.showNotification(
            this.type,
            title,
            message,
            () => this.acknowledge(), // Confirm callback
            () => this.snooze()       // Snooze callback
        );
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'triggered',
            isActive: true,
            isPaused: false,
            timeRemaining: 0
        });
        
        // Unified auto-reset mechanism - restart with original interval
        setTimeout(() => {
            if (this.isActive) {
                this.resetAndRestart();
            }
        }, 5000); // Auto-restart after 5 seconds
        
        console.log(`${this.type} reminder triggered - will auto-restart`);
    }

    /**
     * Snooze reminder (delay 5 minutes)
     */
    snooze() {
        if (!this.isActive) return;
        
        const snoozeTime = 5 * 60 * 1000; // 5 minutes
        this.timeRemaining = snoozeTime;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // Restart timer
        this.clearTimer();
        this.startTimer();
        
        // 通过StateManager统一更新状态
        const updates = {
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            nextReminderAt: this.nextReminderTime
        };
        this.updateState(updates);
        
        // Trigger status change callback
        this.triggerStatusChange({
            status: 'snoozed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type} reminder snoozed for 5 minutes`);
    }

    /**
     * Reset state
     * @private
     */
    resetState() {
        this.startTime = null;
        this.pauseTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
    }

    /**
     * Trigger status change callback
     * @param {Object} status - Status information
     * @private
     */
    triggerStatusChange(status) {
        if (this.statusChangeCallback) {
            this.statusChangeCallback({
                ...status,
                type: this.type,
                timestamp: Date.now()
            });
        }
    }

    /**
     * 设置状态管理器
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
        
        // 订阅状态变化
        this.unsubscribe = stateManager.subscribe(this.type, (state) => {
            this.syncWithState(state);
        });
        
        console.log(`${this.type} reminder connected to StateManager`);
    }

    /**
     * 同步状态 - 从StateManager同步状态
     * @private
     */
    syncWithState(state) {
        if (!state) return;
        
        try {
            // 更新内部状态
            this.isActive = state.isActive || false;
            this.isPaused = state.isPaused || false;
            this.timeRemaining = state.timeRemaining || 0;
            this.nextReminderTime = state.nextReminderAt || 0;
            
            // 更新设置
            this.settings = { ...this.settings, ...state.settings };
            
            // 同步定时器
            this.syncTimers();
            
            console.log(`${this.type} reminder synced with state:`, {
                isActive: this.isActive,
                isPaused: this.isPaused,
                timeRemaining: this.timeRemaining
            });
        } catch (error) {
            console.error(`Failed to sync ${this.type} reminder state:`, error);
        }
    }

    /**
     * 同步定时器状态
     * @private
     */
    syncTimers() {
        this.clearTimer();
        this.clearUpdateTimer();
        
        if (this.isActive && !this.isPaused) {
            this.startTime = Date.now();
            this.startTimer();
            this.startUpdateTimer();
            
            this.triggerStatusChange({
                status: 'synced',
                isActive: true,
                isPaused: false,
                timeRemaining: this.timeRemaining
            });
        } else if (this.isActive && this.isPaused) {
            this.pauseTime = Date.now();
            
            this.triggerStatusChange({
                status: 'synced',
                isActive: true,
                isPaused: true,
                timeRemaining: this.timeRemaining
            });
        }
    }

    /**
     * 更新状态 - 统一状态更新入口
     * @private
     */
    updateState(updates) {
        if (this.stateManager) {
            this.stateManager.updateState(this.type, updates);
        } else {
            // 兼容旧模式
            this.handleLegacyStateUpdate(updates);
        }
    }

    /**
     * 处理旧模式状态更新（兼容）
     * @private
     */
    handleLegacyStateUpdate(updates) {
        // 仅在无StateManager时执行
        console.warn('Using legacy state update for', this.type);
    }

    /**
     * 恢复状态（兼容旧接口）
     * @param {Object} state - 要恢复的状态
     */
    restoreState(state) {
        if (!state) return;
        
        // 如果已连接StateManager，通过StateManager恢复
        if (this.stateManager) {
            this.stateManager.updateState(this.type, state);
            return true;
        }
        
        // 旧模式兼容
        try {
            this.isActive = state.isActive || false;
            this.isPaused = state.isPaused || false;
            this.timeRemaining = state.timeRemaining || 0;
            this.nextReminderTime = state.nextReminderAt || 0;
            
            this.syncTimers();
            
            console.log(`${this.type} reminder state restored (legacy):`, {
                isActive: this.isActive,
                isPaused: this.isPaused,
                timeRemaining: this.timeRemaining
            });
            
            return true;
        } catch (error) {
            console.error(`Failed to restore ${this.type} reminder state:`, error);
            return false;
        }
    }

    /**
     * Destroy reminder manager
     */
    destroy() {
        this.stop();
        
        // Clear all callbacks
        this.statusChangeCallback = null;
        this.timeUpdateCallback = null;
        
        // Activity detection cleanup removed for MVP
        
        console.log(`${this.type} reminder manager destroyed`);
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderManager;
}

// Export for browser use
window.ReminderManager = ReminderManager;