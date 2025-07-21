/**
 * 提醒管理器 - 管理喝水和久坐提醒的核心逻辑
 */
class ReminderManager {
    /**
     * 创建提醒管理器实例
     * @param {string} type - 提醒类型 'water' | 'posture'
     * @param {Object} settings - 提醒设置
     * @param {NotificationService} notificationService - 通知服务实例
     * @param {ActivityDetector} activityDetector - 活动检测器实例（可选，用于久坐提醒）
     */
    constructor(type, settings, notificationService, activityDetector) {
        this.type = type; // 'water' | 'posture'
        this.settings = settings;
        this.notificationService = notificationService;
        this.activityDetector = activityDetector;
        
        this.isActive = false;
        this.isPaused = false;
        this.timer = null;
        this.startTime = null;
        this.remainingTime = 0;
        this.interval = settings.interval * 60 * 1000; // 转换为毫秒
        this.lastCheckTime = Date.now();
        this.updateInterval = 1000; // 每秒更新一次
        
        // 事件回调
        this.onStatusChange = null;
        this.onTimeUpdate = null;
        
        // 绑定方法
        this.handleActivityChange = this.handleActivityChange.bind(this);
        this.updateTimer = this.updateTimer.bind(this);
        
        // 如果是久坐提醒且有活动检测器，设置活动检测回调
        if (this.type === 'posture' && this.activityDetector) {
            this.setupActivityDetection();
        }
    }

    /**
     * 设置活动检测
     * @private
     */
    setupActivityDetection() {
        // 设置活动检测器的回调函数
        if (this.activityDetector) {
            this.activityDetector.callback = this.handleActivityChange;
            
            // 设置离开阈值（如果设置中有定义）
            if (this.settings.activityThreshold) {
                this.activityDetector.setAwayThreshold(this.settings.activityThreshold);
            }
        }
    }

    /**
     * 处理用户活动状态变化
     * @param {Object} event - 活动事件对象
     * @private
     */
    handleActivityChange(event) {
        // 只有久坐提醒需要处理活动变化
        if (this.type !== 'posture' || !this.isActive) return;
        
        if (event.type === 'user-away') {
            // 用户离开，自动暂停久坐提醒
            console.log('用户离开，自动暂停久坐提醒');
            this.pause(true); // true表示是自动暂停
        } else if (event.type === 'user-return') {
            // 用户返回，如果之前是自动暂停的，则自动恢复
            if (this.isPaused) {
                console.log('用户返回，自动恢复久坐提醒');
                this.resume(true); // true表示是自动恢复
            }
            
            // 如果用户离开时间超过一定阈值，重置计时器
            // 因为用户可能已经活动过了
            if (event.awayDuration > 5 * 60 * 1000) { // 如果离开超过5分钟
                console.log('用户离开时间较长，重置久坐计时器');
                this.reset();
            }
        }
    }

    /**
     * 启动提醒
     */
    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.remainingTime = this.interval;
        
        // 启动定时器
        this.timer = setInterval(this.updateTimer, this.updateInterval);
        
        // 如果是久坐提醒，启动活动检测
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.startMonitoring();
        }
        
        // 触发状态变化回调
        if (this.onStatusChange) {
            this.onStatusChange({
                type: this.type,
                status: 'started',
                isActive: this.isActive,
                isPaused: this.isPaused
            });
        }
        
        console.log(`${this.type}提醒已启动，间隔：${this.settings.interval}分钟`);
    }

    /**
     * 暂停提醒
     * @param {boolean} isAuto - 是否是自动暂停
     */
    pause(isAuto = false) {
        if (!this.isActive || this.isPaused) return;
        
        this.isPaused = true;
        
        // 清除定时器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 触发状态变化回调
        if (this.onStatusChange) {
            this.onStatusChange({
                type: this.type,
                status: 'paused',
                isActive: this.isActive,
                isPaused: this.isPaused,
                isAuto: isAuto
            });
        }
        
        console.log(`${this.type}提醒已暂停${isAuto ? '（自动）' : ''}`);
    }

    /**
     * 恢复提醒
     * @param {boolean} isAuto - 是否是自动恢复
     */
    resume(isAuto = false) {
        if (!this.isActive || !this.isPaused) return;
        
        this.isPaused = false;
        this.lastCheckTime = Date.now();
        
        // 重新启动定时器
        this.timer = setInterval(this.updateTimer, this.updateInterval);
        
        // 触发状态变化回调
        if (this.onStatusChange) {
            this.onStatusChange({
                type: this.type,
                status: 'resumed',
                isActive: this.isActive,
                isPaused: this.isPaused,
                isAuto: isAuto
            });
        }
        
        console.log(`${this.type}提醒已恢复${isAuto ? '（自动）' : ''}`);
    }

    /**
     * 停止提醒
     */
    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        this.isPaused = false;
        
        // 清除定时器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 如果是久坐提醒，停止活动检测
        if (this.type === 'posture' && this.activityDetector) {
            this.activityDetector.stopMonitoring();
        }
        
        // 触发状态变化回调
        if (this.onStatusChange) {
            this.onStatusChange({
                type: this.type,
                status: 'stopped',
                isActive: this.isActive,
                isPaused: this.isPaused
            });
        }
        
        console.log(`${this.type}提醒已停止`);
    }

    /**
     * 重置提醒计时器
     */
    reset() {
        this.remainingTime = this.interval;
        this.lastCheckTime = Date.now();
        
        // 如果当前是活动状态，更新开始时间
        if (this.isActive && !this.isPaused) {
            this.startTime = Date.now();
        }
        
        // 触发时间更新回调
        if (this.onTimeUpdate) {
            this.onTimeUpdate({
                type: this.type,
                remainingTime: this.remainingTime,
                formattedTime: this.formatTime(this.remainingTime)
            });
        }
        
        console.log(`${this.type}提醒已重置`);
    }

    /**
     * 更新定时器
     * @private
     */
    updateTimer() {
        const now = Date.now();
        const elapsed = now - this.lastCheckTime;
        this.lastCheckTime = now;
        
        // 如果是久坐提醒，检查用户活动状态
        if (this.type === 'posture' && this.activityDetector) {
            // 如果用户活跃，减少剩余时间
            if (this.activityDetector.isUserActive()) {
                this.remainingTime -= elapsed;
            } else {
                // 用户不活跃，不减少时间
                console.log('用户不活跃，暂停计时');
            }
        } else {
            // 喝水提醒不考虑活动状态，直接减少时间
            this.remainingTime -= elapsed;
        }
        
        // 确保剩余时间不为负
        if (this.remainingTime < 0) {
            this.remainingTime = 0;
        }
        
        // 触发时间更新回调
        if (this.onTimeUpdate) {
            this.onTimeUpdate({
                type: this.type,
                remainingTime: this.remainingTime,
                formattedTime: this.formatTime(this.remainingTime)
            });
        }
        
        // 如果时间到了，触发提醒
        if (this.remainingTime <= 0) {
            this.triggerReminder();
        }
    }

    /**
     * 更新设置
     * @param {Object} newSettings - 新的设置对象
     */
    updateSettings(newSettings) {
        const oldInterval = this.interval;
        
        // 更新设置
        this.settings = {...this.settings, ...newSettings};
        
        // 更新间隔时间
        if (newSettings.interval) {
            this.interval = newSettings.interval * 60 * 1000;
            
            // 如果间隔变化且当前正在计时，调整剩余时间
            if (this.isActive && oldInterval !== this.interval) {
                // 按比例调整剩余时间
                const ratio = this.remainingTime / oldInterval;
                this.remainingTime = Math.round(this.interval * ratio);
            }
        }
        
        // 如果是久坐提醒，更新活动检测阈值
        if (this.type === 'posture' && this.activityDetector && newSettings.activityThreshold) {
            this.activityDetector.setAwayThreshold(newSettings.activityThreshold);
        }
        
        console.log(`${this.type}提醒设置已更新`);
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态对象
     */
    getCurrentStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isPaused: this.isPaused,
            remainingTime: this.remainingTime,
            interval: this.interval,
            formattedTime: this.formatTime(this.remainingTime)
        };
    }

    /**
     * 触发提醒
     * @private
     */
    triggerReminder() {
        // 清除当前定时器
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // 发送通知
        let title, message, icon;
        
        if (this.type === 'water') {
            title = '喝水提醒';
            message = '该喝水了！保持水分摄入有助于健康。';
            icon = 'assets/water-icon.png';
        } else if (this.type === 'posture') {
            title = '久坐提醒';
            message = '该起来活动一下了！久坐对健康不利。';
            icon = 'assets/posture-icon.png';
        }
        
        // 使用通知服务发送通知
        this.notificationService.showNotification(this.type, {
            title: title,
            message: message,
            icon: icon,
            sound: this.settings.sound
        });
        
        // 重置计时器
        this.reset();
        
        // 重新启动定时器
        if (this.isActive && !this.isPaused) {
            this.timer = setInterval(this.updateTimer, this.updateInterval);
        }
        
        console.log(`${this.type}提醒已触发`);
    }

    /**
     * 格式化剩余时间显示
     * @param {number} milliseconds - 毫秒数
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 设置状态变化回调
     * @param {Function} callback - 回调函数
     */
    setStatusChangeCallback(callback) {
        this.onStatusChange = callback;
    }

    /**
     * 设置时间更新回调
     * @param {Function} callback - 回调函数
     */
    setTimeUpdateCallback(callback) {
        this.onTimeUpdate = callback;
    }
}