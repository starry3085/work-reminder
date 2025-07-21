/**
 * 用户活动检测器 - 监测用户的鼠标和键盘活动
 * 负责检测用户是否在电脑前活动，用于智能暂停和恢复提醒功能
 */
class ActivityDetector {
    /**
     * 创建活动检测器实例
     * @param {Function} callback - 当用户活动状态变化时的回调函数
     */
    constructor(callback) {
        this.callback = callback;
        this.lastActivityTime = Date.now();
        this.isMonitoring = false;
        this.awayThreshold = 5 * 60 * 1000; // 5分钟无活动视为离开
        this.checkInterval = null;
        this.checkIntervalTime = 30000; // 每30秒检查一次状态
        this.isAway = false; // 用户是否离开
        
        // 绑定事件处理函数，确保this指向正确
        this.handleActivity = this.handleActivity.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.checkUserActivity = this.checkUserActivity.bind(this);
    }

    /**
     * 开始监控用户活动
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        // 添加鼠标和键盘事件监听
        document.addEventListener('mousemove', this.handleActivity);
        document.addEventListener('mousedown', this.handleActivity);
        document.addEventListener('keydown', this.handleActivity);
        document.addEventListener('scroll', this.handleActivity);
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // 设置定期检查用户活动状态的定时器
        this.checkInterval = setInterval(this.checkUserActivity, this.checkIntervalTime);
        
        this.isMonitoring = true;
        this.lastActivityTime = Date.now();
        console.log('活动检测器已启动');
    }

    /**
     * 停止监控用户活动
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        // 移除所有事件监听
        document.removeEventListener('mousemove', this.handleActivity);
        document.removeEventListener('mousedown', this.handleActivity);
        document.removeEventListener('keydown', this.handleActivity);
        document.removeEventListener('scroll', this.handleActivity);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // 清除定时器
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        this.isMonitoring = false;
        console.log('活动检测器已停止');
    }

    /**
     * 处理用户活动事件
     * @param {Event} event - 触发的事件对象
     */
    handleActivity(event) {
        const now = Date.now();
        this.lastActivityTime = now;
        
        // 如果用户之前被标记为离开，现在回来了
        if (this.isAway) {
            this.isAway = false;
            if (this.callback) {
                this.callback({
                    type: 'user-return',
                    timestamp: now,
                    awayDuration: this.getAwayDuration()
                });
            }
            console.log('用户已返回');
        }
    }

    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // 页面变为可见，用户可能刚刚回来
            this.handleActivity({ type: 'visibility-change' });
        } else {
            // 页面不可见，记录时间但不触发离开事件
            // 因为用户可能只是切换了标签页，而不是真的离开
            console.log('页面不可见');
        }
    }

    /**
     * 定期检查用户活动状态
     */
    checkUserActivity() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivityTime;
        
        // 如果超过阈值时间无活动，且之前未标记为离开
        if (timeSinceLastActivity > this.awayThreshold && !this.isAway) {
            this.isAway = true;
            if (this.callback) {
                this.callback({
                    type: 'user-away',
                    timestamp: now,
                    lastActivity: this.lastActivityTime
                });
            }
            console.log('用户已离开');
        }
    }

    /**
     * 检查用户是否处于活跃状态
     * @returns {boolean} 如果用户活跃返回true，否则返回false
     */
    isUserActive() {
        return !this.isAway;
    }

    /**
     * 获取最后活动时间
     * @returns {number} 时间戳
     */
    getLastActivityTime() {
        return this.lastActivityTime;
    }

    /**
     * 获取用户离开时长（毫秒）
     * @returns {number} 离开的毫秒数
     */
    getAwayDuration() {
        return Date.now() - this.lastActivityTime;
    }
    
    /**
     * 设置离开阈值（多长时间无活动视为离开）
     * @param {number} minutes - 分钟数
     */
    setAwayThreshold(minutes) {
        if (typeof minutes === 'number' && minutes > 0) {
            this.awayThreshold = minutes * 60 * 1000;
            return true;
        }
        return false;
    }
    
    /**
     * 设置最后活动时间（用于状态恢复）
     * @param {number} timestamp - 时间戳
     */
    setLastActivityTime(timestamp) {
        if (typeof timestamp === 'number' && timestamp > 0) {
            this.lastActivityTime = timestamp;
            
            // 检查是否应该更新离开状态
            const now = Date.now();
            const timeSinceLastActivity = now - this.lastActivityTime;
            
            if (timeSinceLastActivity > this.awayThreshold) {
                this.isAway = true;
            } else {
                this.isAway = false;
            }
            
            return true;
        }
        return false;
    }
}