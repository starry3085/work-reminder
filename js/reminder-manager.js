/**
 * 提醒管理器 - 管理喝水和久坐提醒的核心类
 * 负责定时器管理、状态跟踪、提醒触发和持久化保存
 */
class ReminderManager {
    /**
     * 创建提醒管理器实例
     * @param {string} type - 提醒类型 ('water' | 'posture')
     * @param {Object} settings - 提醒设置
     * @param {NotificationService} notificationService - 通知服务实例
     * @param {ActivityDetector} activityDetector - 活动检测器实例（仅久坐提醒需要）
     */
    constructor(type, settings, notificationService, activityDetector = null) {
        this.type = type;
        this.settings = { ...settings };
        this.notificationService = notificationService;
        this.activityDetector = activityDetector;
        
        // 状态管理
        this.isActive = false;
        this.isPaused = false;
        this.timer = null;
        this.startTime = null;
        this.pauseTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
        
        // 回调函数
        this.statusChangeCallback = null;
        this.timeUpdateCallback = null;
        
        // 定时器更新间隔（1秒）
        this.updateInterval = 1000;
        this.updateTimer = null;
        
        // 如果是久坐提醒，设置活动检测器回调
        if (this.type === 'posture' && this.activityDetector) {
            this.setupActivityDetection();
        }
        
        console.log(`${this.type}提醒管理器已创建`);
    }

    /**
     * 设置活动检测（仅久坐提醒）
     * @private
     */
    setupActivityDetection() {
        if (!this.activityDetector) return;
        
        // 保存原始回调
        const originalCallback = this.activityDetector.callback;
        
        // 设置新的回调，包含原始回调和我们的处理
        this.activityDetector.callback = (event) => {
            // 调用原始回调
            if (originalCallback) {
                originalCallback(event);
            }
            
            // 处理活动检测事件
            this.handleActivityEvent(event);
        };
    }

    /**
     * 处理用户活动事件（仅久坐提醒）
     * @param {Object} event - 活动事件
     * @private
     */
    handleActivityEvent(event) {
        if (this.type !== 'posture') return;
        
        switch (event.type) {
            case 'user-away':
                // 用户离开，自动暂停久坐提醒
                if (this.isActive && !this.isPaused) {
                    this.pause(true); // true表示自动暂停
                }
                break;
                
            case 'user-return':
                // 用户返回，自动恢复久坐提醒
                if (this.isActive && this.isPaused) {
                    this.resume(true); // true表示自动恢复
                }
                break;
        }
    }

    /**
     * 启动提醒
     */
    start() {
        if (this.isActive) {
            console.warn(`${this.type}提醒已经在运行中`);
            return;
        }
        
        this.isActive = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.timeRemaining = this.settings.interval * 60 * 1000; // 转换为毫秒
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // 启动定时器
        this.startTimer();
        
        // 启动时间更新定时器
        this.startUpdateTimer();
        
        // 如果是久坐提醒，启动活动检测
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.startMonitoring();
        }
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'started',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type}提醒已启动，间隔: ${this.settings.interval}分钟`);
    }

    /**
     * 停止提醒
     */
    stop() {
        if (!this.isActive) {
            console.warn(`${this.type}提醒未在运行`);
            return;
        }
        
        this.isActive = false;
        this.isPaused = false;
        
        // 清除定时器
        this.clearTimer();
        this.clearUpdateTimer();
        
        // 如果是久坐提醒，停止活动检测
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.stopMonitoring();
        }
        
        // 重置状态
        this.resetState();
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'stopped',
            isActive: false,
            isPaused: false,
            timeRemaining: 0
        });
        
        console.log(`${this.type}提醒已停止`);
    }

    /**
     * 暂停提醒
     * @param {boolean} isAuto - 是否为自动暂停（由活动检测触发）
     */
    pause(isAuto = false) {
        if (!this.isActive || this.isPaused) {
            if (!isAuto) {
                console.warn(`${this.type}提醒未在运行或已暂停`);
            }
            return;
        }
        
        this.isPaused = true;
        this.pauseTime = Date.now();
        
        // 计算剩余时间
        const elapsed = this.pauseTime - this.startTime;
        this.timeRemaining = Math.max(0, this.timeRemaining - elapsed);
        
        // 清除定时器
        this.clearTimer();
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'paused',
            isActive: true,
            isPaused: true,
            timeRemaining: this.timeRemaining,
            isAuto: isAuto
        });
        
        console.log(`${this.type}提醒已${isAuto ? '自动' : '手动'}暂停`);
    }

    /**
     * 恢复提醒
     * @param {boolean} isAuto - 是否为自动恢复（由活动检测触发）
     */
    resume(isAuto = false) {
        if (!this.isActive || !this.isPaused) {
            if (!isAuto) {
                console.warn(`${this.type}提醒未暂停`);
            }
            return;
        }
        
        this.isPaused = false;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // 重新启动定时器
        this.startTimer();
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'resumed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            isAuto: isAuto
        });
        
        console.log(`${this.type}提醒已${isAuto ? '自动' : '手动'}恢复`);
    }

    /**
     * 重置提醒计时器
     */
    reset() {
        const wasActive = this.isActive;
        
        if (this.isActive) {
            // 清除定时器
            this.clearTimer();
            this.clearUpdateTimer();
        }
        
        // 重置状态
        this.resetState();
        
        if (wasActive) {
            // 如果之前是活跃状态，重新启动
            this.start();
        }
        
        console.log(`${this.type}提醒已重置`);
    }

    /**
     * 确认提醒（用户已执行相应动作）
     */
    acknowledge() {
        if (!this.isActive) {
            console.warn(`${this.type}提醒未在运行`);
            return;
        }
        
        // 更新最后提醒时间
        this.settings.lastReminder = Date.now();
        
        // 重置计时器
        this.reset();
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'acknowledged',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type}提醒已确认`);
    }

    /**
     * 更新设置
     * @param {Object} newSettings - 新的设置
     */
    updateSettings(newSettings) {
        const oldInterval = this.settings.interval;
        
        // 更新设置
        this.settings = { ...this.settings, ...newSettings };
        
        // 如果间隔时间改变且提醒正在运行，需要重新计算
        if (newSettings.interval && newSettings.interval !== oldInterval && this.isActive) {
            const newIntervalMs = newSettings.interval * 60 * 1000;
            
            if (!this.isPaused) {
                // 如果没有暂停，重新计算剩余时间
                const elapsed = Date.now() - this.startTime;
                const progress = elapsed / (oldInterval * 60 * 1000);
                this.timeRemaining = Math.max(0, newIntervalMs * (1 - progress));
                this.nextReminderTime = Date.now() + this.timeRemaining;
                
                // 重新启动定时器
                this.clearTimer();
                this.startTimer();
            } else {
                // 如果暂停中，按比例调整剩余时间
                const progress = 1 - (this.timeRemaining / (oldInterval * 60 * 1000));
                this.timeRemaining = Math.max(0, newIntervalMs * (1 - progress));
            }
        }
        
        console.log(`${this.type}提醒设置已更新:`, this.settings);
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态信息
     */
    getCurrentStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isPaused: this.isPaused,
            timeRemaining: this.timeRemaining,
            nextReminderTime: this.nextReminderTime,
            settings: { ...this.settings },
            lastUpdate: Date.now()
        };
    }

    /**
     * 设置状态变化回调
     * @param {Function} callback - 回调函数
     */
    setStatusChangeCallback(callback) {
        this.statusChangeCallback = callback;
    }

    /**
     * 设置时间更新回调
     * @param {Function} callback - 回调函数
     */
    setTimeUpdateCallback(callback) {
        this.timeUpdateCallback = callback;
    }

    /**
     * 启动定时器
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
     * 清除定时器
     * @private
     */
    clearTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    /**
     * 启动时间更新定时器
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
     * 清除时间更新定时器
     * @private
     */
    clearUpdateTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    /**
     * 更新剩余时间
     * @private
     */
    updateTimeRemaining() {
        if (!this.isActive || this.isPaused) {
            return;
        }
        
        const now = Date.now();
        this.timeRemaining = Math.max(0, this.nextReminderTime - now);
        
        // 触发时间更新回调
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
     * 触发提醒
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = this.type === 'water' ? '💧 喝水时间到了！' : '🧘 该起身活动了！';
        const message = this.type === 'water' 
            ? '长时间工作容易脱水，记得补充水分哦！' 
            : '久坐对身体不好，起来活动一下吧！';
        
        // 显示通知
        this.notificationService.showNotification(
            this.type,
            title,
            message,
            () => this.acknowledge(), // 确认回调
            () => this.snooze()       // 稍后提醒回调
        );
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'triggered',
            isActive: true,
            isPaused: false,
            timeRemaining: 0
        });
        
        // 自动重置计时器（如果用户没有手动确认）
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // 1分钟后自动重置
        
        console.log(`${this.type}提醒已触发`);
    }

    /**
     * 稍后提醒（延迟5分钟）
     */
    snooze() {
        if (!this.isActive) return;
        
        const snoozeTime = 5 * 60 * 1000; // 5分钟
        this.timeRemaining = snoozeTime;
        this.startTime = Date.now();
        this.nextReminderTime = this.startTime + this.timeRemaining;
        
        // 重新启动定时器
        this.clearTimer();
        this.startTimer();
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'snoozed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining
        });
        
        console.log(`${this.type}提醒已延迟5分钟`);
    }

    /**
     * 重置状态
     * @private
     */
    resetState() {
        this.startTime = null;
        this.pauseTime = null;
        this.nextReminderTime = null;
        this.timeRemaining = 0;
    }

    /**
     * 触发状态变化回调
     * @param {Object} status - 状态信息
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
     * 销毁提醒管理器
     */
    destroy() {
        this.stop();
        
        // 清除所有回调
        this.statusChangeCallback = null;
        this.timeUpdateCallback = null;
        
        // 如果是久坐提醒，清理活动检测器
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.stopMonitoring();
        }
        
        console.log(`${this.type}提醒管理器已销毁`);
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReminderManager;
}