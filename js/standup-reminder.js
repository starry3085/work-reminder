/**
 * 久坐提醒类 - 专门处理久坐提醒的逻辑
 * 继承自ReminderManager，添加久坐特定的功能和智能活动检测
 */
class PostureReminder extends ReminderManager {
    /**
     * 创建久坐提醒实例
     * @param {Object} settings - 久坐提醒设置
     * @param {NotificationService} notificationService - 通知服务实例
     * @param {ActivityDetector} activityDetector - 活动检测器实例
     */
    constructor(settings, notificationService, activityDetector) {
        super('posture', settings, notificationService, activityDetector);
        
        // 久坐特定的状态
        this.dailyActivityCount = 0;
        this.dailyGoal = 8; // 每日活动目标（次）
        this.lastActivityTime = null;
        this.activityHistory = []; // 今日活动记录
        this.totalSittingTime = 0; // 今日总坐着时间（毫秒）
        this.currentSittingStart = null; // 当前坐着开始时间
        
        // 活动检测相关
        this.isUserAway = false;
        this.awayStartTime = null;
        this.lastUserActivity = Date.now();
        this.activityThreshold = (settings.activityThreshold || 5) * 60 * 1000; // 转换为毫秒
        
        // 从本地存储加载今日数据
        this.loadDailyData();
        
        // 设置增强的活动检测
        this.setupEnhancedActivityDetection();
        
        console.log('久坐提醒器已创建');
    }

    /**
     * 加载今日久坐数据
     * @private
     */
    loadDailyData() {
        try {
            const today = new Date().toDateString();
            const savedData = localStorage.getItem('postureReminder_dailyData');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // 检查是否是今天的数据
                if (data.date === today) {
                    this.dailyActivityCount = data.count || 0;
                    this.activityHistory = data.history || [];
                    this.lastActivityTime = data.lastActivityTime || null;
                    this.totalSittingTime = data.totalSittingTime || 0;
                } else {
                    // 新的一天，重置数据
                    this.resetDailyData();
                }
            }
        } catch (error) {
            console.warn('加载今日久坐数据失败:', error);
            this.resetDailyData();
        }
    }

    /**
     * 保存今日久坐数据
     * @private
     */
    saveDailyData() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                count: this.dailyActivityCount,
                history: this.activityHistory,
                lastActivityTime: this.lastActivityTime,
                totalSittingTime: this.totalSittingTime
            };
            
            localStorage.setItem('postureReminder_dailyData', JSON.stringify(data));
        } catch (error) {
            console.warn('保存今日久坐数据失败:', error);
        }
    }

    /**
     * 重置今日数据
     * @private
     */
    resetDailyData() {
        this.dailyActivityCount = 0;
        this.activityHistory = [];
        this.lastActivityTime = null;
        this.totalSittingTime = 0;
        this.currentSittingStart = Date.now();
        this.saveDailyData();
    }

    /**
     * 设置增强的活动检测
     * @private
     */
    setupEnhancedActivityDetection() {
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
            this.handleEnhancedActivityEvent(event);
        };
        
        // 启动持续的活动监控
        this.startContinuousMonitoring();
    }

    /**
     * 处理增强的用户活动事件
     * @param {Object} event - 活动事件
     * @private
     */
    handleEnhancedActivityEvent(event) {
        const now = Date.now();
        this.lastUserActivity = now;
        
        switch (event.type) {
            case 'user-activity':
                // 用户有活动，重置离开状态
                if (this.isUserAway) {
                    this.handleUserReturn();
                }
                
                // 检查是否应该自动延长久坐计时
                if (this.isActive && !this.isPaused) {
                    this.handleActivityDuringReminder();
                }
                break;
                
            case 'user-away':
                // 用户离开，暂停久坐提醒
                this.handleUserAway();
                break;
                
            case 'user-return':
                // 用户返回，恢复久坐提醒
                this.handleUserReturn();
                break;
        }
    }

    /**
     * 处理用户离开事件
     * @private
     */
    handleUserAway() {
        if (this.isUserAway) return;
        
        this.isUserAway = true;
        this.awayStartTime = Date.now();
        
        // 记录坐着时间
        if (this.currentSittingStart) {
            this.totalSittingTime += this.awayStartTime - this.currentSittingStart;
            this.currentSittingStart = null;
        }
        
        // 自动暂停久坐提醒
        if (this.isActive && !this.isPaused) {
            this.pause(true); // true表示自动暂停
        }
        
        console.log('用户离开，久坐提醒已自动暂停');
    }

    /**
     * 处理用户返回事件
     * @private
     */
    handleUserReturn() {
        if (!this.isUserAway) return;
        
        const returnTime = Date.now();
        const awayDuration = returnTime - this.awayStartTime;
        
        this.isUserAway = false;
        this.currentSittingStart = returnTime;
        
        // 如果离开时间超过5分钟，认为是有效的活动
        if (awayDuration > this.activityThreshold) {
            this.recordActivity('away-break', awayDuration);
        }
        
        // 自动恢复久坐提醒
        if (this.isActive && this.isPaused) {
            this.resume(true); // true表示自动恢复
        }
        
        console.log(`用户返回，离开时长: ${Math.round(awayDuration / 60000)}分钟`);
    }

    /**
     * 处理提醒期间的用户活动
     * @private
     */
    handleActivityDuringReminder() {
        // 如果用户在提醒期间有持续活动，可以适当延长计时
        const activityWindow = 30000; // 30秒内的活动窗口
        const now = Date.now();
        
        if (now - this.lastUserActivity < activityWindow) {
            // 延长5分钟
            const extensionTime = 5 * 60 * 1000;
            this.timeRemaining = Math.min(this.timeRemaining + extensionTime, this.settings.interval * 60 * 1000);
            this.nextReminderTime = now + this.timeRemaining;
            
            // 重新启动定时器
            this.clearTimer();
            this.startTimer();
            
            console.log('检测到用户活动，久坐提醒已延长5分钟');
        }
    }

    /**
     * 启动持续监控
     * @private
     */
    startContinuousMonitoring() {
        // 每分钟检查一次用户状态
        this.monitoringInterval = setInterval(() => {
            this.checkUserStatus();
        }, 60000);
    }

    /**
     * 检查用户状态
     * @private
     */
    checkUserStatus() {
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastUserActivity;
        
        // 如果超过活动阈值且用户还没有被标记为离开
        if (timeSinceLastActivity > this.activityThreshold && !this.isUserAway) {
            this.handleUserAway();
        }
        
        // 更新坐着时间
        if (this.currentSittingStart && !this.isUserAway) {
            this.totalSittingTime += 60000; // 增加1分钟
        }
    }

    /**
     * 用户已起身活动确认
     * @param {number} duration - 活动时长（分钟），可选
     * @param {string} activityType - 活动类型，可选
     */
    confirmActivity(duration = 5, activityType = 'manual') {
        const now = Date.now();
        
        // 记录活动
        this.recordActivity(activityType, duration * 60 * 1000);
        
        // 更新最后提醒时间
        this.settings.lastReminder = now;
        
        // 重置计时器
        this.reset();
        
        // 显示确认消息
        this.showActivityConfirmation(duration, activityType);
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'activity-confirmed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            dailyCount: this.dailyActivityCount,
            dailyGoal: this.dailyGoal,
            lastActivityTime: this.lastActivityTime
        });
        
        console.log(`已确认起身活动，今日第${this.dailyActivityCount}次`);
    }

    /**
     * 记录活动
     * @param {string} type - 活动类型
     * @param {number} duration - 活动时长（毫秒）
     * @private
     */
    recordActivity(type, duration) {
        const now = Date.now();
        
        this.dailyActivityCount++;
        this.lastActivityTime = now;
        this.activityHistory.push({
            time: now,
            type: type,
            duration: duration
        });
        
        // 重置坐着时间计算
        this.currentSittingStart = now;
        
        // 保存数据
        this.saveDailyData();
    }

    /**
     * 显示活动确认消息
     * @param {number} duration - 活动时长（分钟）
     * @param {string} activityType - 活动类型
     * @private
     */
    showActivityConfirmation(duration, activityType) {
        const progress = Math.min(this.dailyActivityCount / this.dailyGoal, 1);
        const progressPercent = Math.round(progress * 100);
        
        let message = `很好！今日已活动 ${this.dailyActivityCount} 次`;
        
        if (this.dailyActivityCount >= this.dailyGoal) {
            message += `\n🎉 恭喜！您已完成今日活动目标！`;
        } else {
            const remaining = this.dailyGoal - this.dailyActivityCount;
            message += `\n还需 ${remaining} 次即可完成今日目标 (${progressPercent}%)`;
        }
        
        // 根据活动类型添加额外信息
        if (activityType === 'away-break') {
            message += `\n检测到您离开了 ${Math.round(duration / 60000)} 分钟，很好的休息！`;
        }
        
        // 显示页面内通知
        this.notificationService.showInPageAlert('success', {
            title: '🧘 活动确认',
            message: message,
            duration: 3000
        });
        
        // 如果完成目标，显示庆祝通知
        if (this.dailyActivityCount === this.dailyGoal) {
            setTimeout(() => {
                this.notificationService.showInPageAlert('celebration', {
                    title: '🎉 目标达成！',
                    message: '恭喜您完成今日活动目标！继续保持健康的工作习惯！',
                    duration: 5000
                });
            }, 1000);
        }
    }

    /**
     * 触发久坐提醒
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '🧘 该起身活动了！';
        let message = '久坐对身体不好，起来活动一下吧！';
        
        // 根据今日进度和坐着时间调整消息
        const sittingHours = Math.round(this.totalSittingTime / (1000 * 60 * 60) * 10) / 10;
        
        if (this.dailyActivityCount > 0) {
            const remaining = Math.max(0, this.dailyGoal - this.dailyActivityCount);
            if (remaining > 0) {
                message += `\n今日已活动 ${this.dailyActivityCount} 次，还需 ${remaining} 次完成目标`;
            } else {
                message = '继续保持良好的活动习惯！';
            }
        }
        
        if (sittingHours > 0) {
            message += `\n今日已坐着 ${sittingHours} 小时`;
        }
        
        // 显示通知，提供确认和稍后提醒选项
        this.notificationService.showNotification(
            'posture',
            title,
            message,
            () => this.confirmActivity(), // 确认活动回调
            () => this.snooze(),         // 稍后提醒回调
            {
                actions: [
                    {
                        action: 'activity',
                        title: '已起身活动',
                        icon: '🧘'
                    },
                    {
                        action: 'snooze',
                        title: '5分钟后提醒',
                        icon: '⏰'
                    }
                ]
            }
        );
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'triggered',
            isActive: true,
            isPaused: false,
            timeRemaining: 0,
            dailyCount: this.dailyActivityCount,
            dailyGoal: this.dailyGoal
        });
        
        // 自动重置计时器（如果用户没有手动确认）
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // 1分钟后自动重置
        
        console.log('久坐提醒已触发');
    }

    /**
     * 获取今日活动统计
     * @returns {Object} 今日活动统计信息
     */
    getDailyStats() {
        const totalActivityTime = this.activityHistory.reduce((sum, record) => sum + record.duration, 0);
        const progress = Math.min(this.dailyActivityCount / this.dailyGoal, 1);
        const sittingHours = Math.round(this.totalSittingTime / (1000 * 60 * 60) * 10) / 10;
        
        return {
            count: this.dailyActivityCount,
            goal: this.dailyGoal,
            progress: progress,
            progressPercent: Math.round(progress * 100),
            totalActivityTime: totalActivityTime,
            totalSittingTime: this.totalSittingTime,
            sittingHours: sittingHours,
            lastActivityTime: this.lastActivityTime,
            history: [...this.activityHistory],
            isGoalReached: this.dailyActivityCount >= this.dailyGoal,
            averageActivityDuration: this.activityHistory.length > 0 
                ? Math.round(totalActivityTime / this.activityHistory.length / 60000) 
                : 0
        };
    }

    /**
     * 设置每日目标
     * @param {number} goal - 每日活动目标（次数）
     */
    setDailyGoal(goal) {
        if (goal > 0 && goal <= 20) { // 合理范围
            this.dailyGoal = goal;
            this.saveDailyData();
            
            console.log(`每日活动目标已设置为 ${goal} 次`);
        } else {
            console.warn('每日目标应在1-20次之间');
        }
    }

    /**
     * 设置活动阈值
     * @param {number} threshold - 活动阈值（分钟）
     */
    setActivityThreshold(threshold) {
        if (threshold > 0 && threshold <= 30) { // 合理范围
            this.activityThreshold = threshold * 60 * 1000; // 转换为毫秒
            this.settings.activityThreshold = threshold;
            
            console.log(`活动阈值已设置为 ${threshold} 分钟`);
        } else {
            console.warn('活动阈值应在1-30分钟之间');
        }
    }

    /**
     * 获取健康建议
     * @returns {string} 个性化的健康建议
     */
    getHealthSuggestion() {
        const stats = this.getDailyStats();
        const now = new Date();
        const hour = now.getHours();
        
        // 根据时间、活动次数和坐着时间给出建议
        if (stats.sittingHours > 6) {
            return '今日坐着时间较长，建议增加活动频率，每30分钟起身一次';
        } else if (stats.count < stats.goal * 0.5 && hour > 14) {
            return '下午了，活动次数还不够，记得多起身走动';
        } else if (stats.count >= stats.goal) {
            return '今日活动目标已达成！继续保持良好习惯';
        } else if (hour < 12) {
            return '上午工作时间，记得每小时起身活动一下';
        } else if (hour < 18) {
            return '下午容易疲劳，适当活动有助于提高工作效率';
        } else {
            return '工作日即将结束，做些轻松的伸展运动吧';
        }
    }

    /**
     * 获取当前状态（重写父类方法）
     * @returns {Object} 当前状态信息
     */
    getCurrentStatus() {
        const baseStatus = super.getCurrentStatus();
        
        return {
            ...baseStatus,
            dailyStats: this.getDailyStats(),
            suggestion: this.getHealthSuggestion(),
            isUserAway: this.isUserAway,
            lastUserActivity: this.lastUserActivity,
            activityThreshold: this.activityThreshold
        };
    }

    /**
     * 启动提醒（重写父类方法，添加久坐特定逻辑）
     */
    start() {
        // 记录开始坐着的时间
        if (!this.currentSittingStart) {
            this.currentSittingStart = Date.now();
        }
        
        // 调用父类启动方法
        super.start();
    }

    /**
     * 停止提醒（重写父类方法，添加久坐特定逻辑）
     */
    stop() {
        // 记录坐着时间
        if (this.currentSittingStart) {
            this.totalSittingTime += Date.now() - this.currentSittingStart;
            this.currentSittingStart = null;
            this.saveDailyData();
        }
        
        // 停止持续监控
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // 调用父类停止方法
        super.stop();
    }

    /**
     * 重置提醒计时器（重写父类方法，添加久坐特定逻辑）
     */
    reset() {
        super.reset();
        
        // 检查是否需要重置每日数据（新的一天）
        const today = new Date().toDateString();
        const savedData = localStorage.getItem('postureReminder_dailyData');
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.date !== today) {
                    this.resetDailyData();
                }
            } catch (error) {
                console.warn('检查日期数据失败:', error);
            }
        }
    }

    /**
     * 销毁久坐提醒器（重写父类方法）
     */
    destroy() {
        // 记录最终坐着时间
        if (this.currentSittingStart) {
            this.totalSittingTime += Date.now() - this.currentSittingStart;
        }
        
        // 保存数据
        this.saveDailyData();
        
        // 停止持续监控
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        // 调用父类销毁方法
        super.destroy();
        
        console.log('久坐提醒器已销毁');
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PostureReminder;
}