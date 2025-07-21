/**
 * 提醒管理器 - 管理喝水和久坐提醒的核心逻辑
 */
class ReminderManager {
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
        
        // 事件回调
        this.onStatusChange = null;
        this.onTimeUpdate = null;
    }

    /**
     * 启动提醒
     */
    start() {
        // 待实现
    }

    /**
     * 暂停提醒
     */
    pause() {
        // 待实现
    }

    /**
     * 恢复提醒
     */
    resume() {
        // 待实现
    }

    /**
     * 停止提醒
     */
    stop() {
        // 待实现
    }

    /**
     * 重置提醒计时器
     */
    reset() {
        // 待实现
    }

    /**
     * 更新设置
     * @param {Object} newSettings
     */
    updateSettings(newSettings) {
        // 待实现
    }

    /**
     * 获取当前状态
     * @returns {Object}
     */
    getCurrentStatus() {
        return {
            type: this.type,
            isActive: this.isActive,
            isPaused: this.isPaused,
            remainingTime: this.remainingTime,
            interval: this.interval
        };
    }

    /**
     * 触发提醒
     * @private
     */
    triggerReminder() {
        // 待实现
    }

    /**
     * 格式化剩余时间显示
     * @param {number} milliseconds
     * @returns {string}
     */
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 设置状态变化回调
     * @param {Function} callback
     */
    setStatusChangeCallback(callback) {
        this.onStatusChange = callback;
    }

    /**
     * 设置时间更新回调
     * @param {Function} callback
     */
    setTimeUpdateCallback(callback) {
        this.onTimeUpdate = callback;
    }
}