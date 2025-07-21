/**
 * 喝水提醒类 - 专门处理喝水提醒的逻辑
 * 继承自ReminderManager，添加喝水特定的功能
 */
class WaterReminder extends ReminderManager {
    /**
     * 创建喝水提醒实例
     * @param {Object} settings - 喝水提醒设置
     * @param {NotificationService} notificationService - 通知服务实例
     */
    constructor(settings, notificationService) {
        super('water', settings, notificationService);
        
        // 喝水特定的状态
        this.dailyWaterCount = 0;
        this.dailyGoal = 8; // 每日喝水目标（杯）
        this.lastDrinkTime = null;
        this.drinkHistory = []; // 今日喝水记录
        
        // 从本地存储加载今日数据
        this.loadDailyData();
        
        console.log('喝水提醒器已创建');
    }

    /**
     * 加载今日喝水数据
     * @private
     */
    loadDailyData() {
        try {
            const today = new Date().toDateString();
            const savedData = localStorage.getItem('waterReminder_dailyData');
            
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // 检查是否是今天的数据
                if (data.date === today) {
                    this.dailyWaterCount = data.count || 0;
                    this.drinkHistory = data.history || [];
                    this.lastDrinkTime = data.lastDrinkTime || null;
                } else {
                    // 新的一天，重置数据
                    this.resetDailyData();
                }
            }
        } catch (error) {
            console.warn('加载今日喝水数据失败:', error);
            this.resetDailyData();
        }
    }

    /**
     * 保存今日喝水数据
     * @private
     */
    saveDailyData() {
        try {
            const today = new Date().toDateString();
            const data = {
                date: today,
                count: this.dailyWaterCount,
                history: this.drinkHistory,
                lastDrinkTime: this.lastDrinkTime
            };
            
            localStorage.setItem('waterReminder_dailyData', JSON.stringify(data));
        } catch (error) {
            console.warn('保存今日喝水数据失败:', error);
        }
    }

    /**
     * 重置今日数据
     * @private
     */
    resetDailyData() {
        this.dailyWaterCount = 0;
        this.drinkHistory = [];
        this.lastDrinkTime = null;
        this.saveDailyData();
    }

    /**
     * 用户已喝水确认
     * @param {number} amount - 喝水量（毫升），可选
     */
    confirmDrink(amount = 250) {
        const now = Date.now();
        
        // 记录喝水
        this.dailyWaterCount++;
        this.lastDrinkTime = now;
        this.drinkHistory.push({
            time: now,
            amount: amount
        });
        
        // 更新最后提醒时间
        this.settings.lastReminder = now;
        
        // 保存数据
        this.saveDailyData();
        
        // 重置计时器
        this.reset();
        
        // 显示确认消息
        this.showDrinkConfirmation();
        
        // 触发状态变化回调
        this.triggerStatusChange({
            status: 'drink-confirmed',
            isActive: true,
            isPaused: false,
            timeRemaining: this.timeRemaining,
            dailyCount: this.dailyWaterCount,
            dailyGoal: this.dailyGoal,
            lastDrinkTime: this.lastDrinkTime
        });
        
        console.log(`已确认喝水，今日第${this.dailyWaterCount}杯`);
    }

    /**
     * 显示喝水确认消息
     * @private
     */
    showDrinkConfirmation() {
        const progress = Math.min(this.dailyWaterCount / this.dailyGoal, 1);
        const progressPercent = Math.round(progress * 100);
        
        let message = `很好！今日已喝水 ${this.dailyWaterCount} 杯`;
        
        if (this.dailyWaterCount >= this.dailyGoal) {
            message += `\n🎉 恭喜！您已完成今日喝水目标！`;
        } else {
            const remaining = this.dailyGoal - this.dailyWaterCount;
            message += `\n还需 ${remaining} 杯即可完成今日目标 (${progressPercent}%)`;
        }
        
        // 显示页面内通知
        this.notificationService.showInPageAlert('success', {
            title: '💧 喝水确认',
            message: message,
            duration: 3000
        });
        
        // 如果完成目标，显示庆祝通知
        if (this.dailyWaterCount === this.dailyGoal) {
            setTimeout(() => {
                this.notificationService.showInPageAlert('celebration', {
                    title: '🎉 目标达成！',
                    message: '恭喜您完成今日喝水目标！保持良好的习惯！',
                    duration: 5000
                });
            }, 1000);
        }
    }

    /**
     * 触发喝水提醒
     * @private
     */
    triggerReminder() {
        if (!this.isActive) return;
        
        const title = '💧 喝水时间到了！';
        let message = '长时间工作容易脱水，记得补充水分哦！';
        
        // 根据今日进度调整消息
        if (this.dailyWaterCount > 0) {
            const remaining = Math.max(0, this.dailyGoal - this.dailyWaterCount);
            if (remaining > 0) {
                message += `\n今日已喝 ${this.dailyWaterCount} 杯，还需 ${remaining} 杯完成目标`;
            } else {
                message = '继续保持良好的喝水习惯！';
            }
        }
        
        // 显示通知，提供确认和稍后提醒选项
        this.notificationService.showNotification(
            'water',
            title,
            message,
            () => this.confirmDrink(), // 确认喝水回调
            () => this.snooze(),       // 稍后提醒回调
            {
                actions: [
                    {
                        action: 'drink',
                        title: '已喝水',
                        icon: '💧'
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
            dailyCount: this.dailyWaterCount,
            dailyGoal: this.dailyGoal
        });
        
        // 自动重置计时器（如果用户没有手动确认）
        setTimeout(() => {
            if (this.isActive && this.timeRemaining === 0) {
                this.reset();
            }
        }, 60000); // 1分钟后自动重置
        
        console.log('喝水提醒已触发');
    }

    /**
     * 获取今日喝水统计
     * @returns {Object} 今日喝水统计信息
     */
    getDailyStats() {
        const totalAmount = this.drinkHistory.reduce((sum, record) => sum + record.amount, 0);
        const progress = Math.min(this.dailyWaterCount / this.dailyGoal, 1);
        
        return {
            count: this.dailyWaterCount,
            goal: this.dailyGoal,
            progress: progress,
            progressPercent: Math.round(progress * 100),
            totalAmount: totalAmount,
            lastDrinkTime: this.lastDrinkTime,
            history: [...this.drinkHistory],
            isGoalReached: this.dailyWaterCount >= this.dailyGoal
        };
    }

    /**
     * 设置每日目标
     * @param {number} goal - 每日喝水目标（杯数）
     */
    setDailyGoal(goal) {
        if (goal > 0 && goal <= 20) { // 合理范围
            this.dailyGoal = goal;
            this.saveDailyData();
            
            console.log(`每日喝水目标已设置为 ${goal} 杯`);
        } else {
            console.warn('每日目标应在1-20杯之间');
        }
    }

    /**
     * 获取喝水建议
     * @returns {string} 个性化的喝水建议
     */
    getDrinkingSuggestion() {
        const now = new Date();
        const hour = now.getHours();
        const progress = this.dailyWaterCount / this.dailyGoal;
        
        // 根据时间和进度给出建议
        if (hour < 9) {
            return '早晨起床后喝一杯温水，有助于唤醒身体机能';
        } else if (hour < 12) {
            if (progress < 0.3) {
                return '上午工作时间，记得多补充水分保持精力充沛';
            } else {
                return '上午的喝水量不错，继续保持！';
            }
        } else if (hour < 14) {
            return '午餐时间，适量饮水有助于消化';
        } else if (hour < 18) {
            if (progress < 0.6) {
                return '下午容易疲劳，多喝水有助于保持注意力';
            } else {
                return '下午的水分补充很及时！';
            }
        } else if (hour < 20) {
            if (progress < 0.8) {
                return '晚餐前适量补水，但不要过量影响食欲';
            } else {
                return '今日喝水量很棒，晚上适量即可';
            }
        } else {
            return '睡前1-2小时减少饮水，避免影响睡眠质量';
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
            suggestion: this.getDrinkingSuggestion()
        };
    }

    /**
     * 重置提醒计时器（重写父类方法，添加喝水特定逻辑）
     */
    reset() {
        super.reset();
        
        // 检查是否需要重置每日数据（新的一天）
        const today = new Date().toDateString();
        const savedData = localStorage.getItem('waterReminder_dailyData');
        
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
     * 销毁喝水提醒器（重写父类方法）
     */
    destroy() {
        // 保存数据
        this.saveDailyData();
        
        // 调用父类销毁方法
        super.destroy();
        
        console.log('喝水提醒器已销毁');
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterReminder;
}