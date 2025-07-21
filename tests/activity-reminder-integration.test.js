/**
 * 活动检测器和提醒管理器集成测试
 */

// 测试套件
class ActivityReminderIntegrationTests {
    constructor() {
        this.testResults = [];
        
        // 保存原始定时器函数
        this.originalSetTimeout = window.setTimeout;
        this.originalClearTimeout = window.clearTimeout;
        this.originalSetInterval = window.setInterval;
        this.originalClearInterval = window.clearInterval;
        this.originalDateNow = Date.now;
        
        // 保存原始事件监听器
        this.originalAddEventListener = window.addEventListener;
        this.originalRemoveEventListener = window.removeEventListener;
    }

    // 设置测试环境
    setup() {
        // 模拟时间函数
        this.mockTime = Date.now();
        Date.now = () => this.mockTime;
        
        // 模拟定时器
        this.timeoutIds = 0;
        this.timeouts = [];
        
        window.setTimeout = (callback, delay) => {
            const id = ++this.timeoutIds;
            this.timeouts.push({
                id,
                callback,
                delay,
                createdAt: this.mockTime
            });
            return id;
        };
        
        window.clearTimeout = (id) => {
            this.timeouts = this.timeouts.filter(t => t.id !== id);
        };
        
        // 模拟间隔定时器
        this.intervalIds = 0;
        this.intervals = [];
        
        window.setInterval = (callback, delay) => {
            const id = ++this.intervalIds;
            this.intervals.push({
                id,
                callback,
                delay,
                createdAt: this.mockTime
            });
            return id;
        };
        
        window.clearInterval = (id) => {
            this.intervals = this.intervals.filter(i => i.id !== id);
        };
        
        // 模拟事件监听器
        this.eventListeners = {};
        
        window.addEventListener = (event, callback, options) => {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push({ callback, options });
        };
        
        window.removeEventListener = (event, callback) => {
            if (this.eventListeners[event]) {
                this.eventListeners[event] = this.eventListeners[event].filter(
                    listener => listener.callback !== callback
                );
            }
        };
        
        // 创建模拟通知服务
        this.notificationService = {
            notifications: [],
            showNotification: (type, title, message, onConfirm, onSnooze) => {
                this.notificationService.notifications.push({
                    type, title, message, timestamp: this.mockTime
                });
                this.notificationService.lastConfirmCallback = onConfirm;
                this.notificationService.lastSnoozeCallback = onSnooze;
                return true;
            },
            clearNotifications: () => {
                this.notificationService.notifications = [];
            }
        };
    }

    // 清理测试环境
    teardown() {
        // 恢复原始函数
        window.setTimeout = this.originalSetTimeout;
        window.clearTimeout = this.originalClearTimeout;
        window.setInterval = this.originalSetInterval;
        window.clearInterval = this.originalClearInterval;
        Date.now = this.originalDateNow;
        window.addEventListener = this.originalAddEventListener;
        window.removeEventListener = this.originalRemoveEventListener;
    }

    // 推进模拟时间
    advanceTime(milliseconds) {
        this.mockTime += milliseconds;
        
        // 检查并执行到期的定时器
        const triggeredTimeouts = this.timeouts.filter(
            t => (t.createdAt + t.delay) <= this.mockTime
        );
        
        // 移除已触发的定时器
        this.timeouts = this.timeouts.filter(
            t => (t.createdAt + t.delay) > this.mockTime
        );
        
        // 执行回调
        triggeredTimeouts.forEach(t => t.callback());
        
        // 执行间隔定时器
        this.intervals.forEach(interval => {
            const elapsedTime = this.mockTime - interval.createdAt;
            const cycles = Math.floor(elapsedTime / interval.delay);
            
            if (cycles > 0) {
                // 更新创建时间
                interval.createdAt += cycles * interval.delay;
                
                // 执行回调
                for (let i = 0; i < cycles; i++) {
                    interval.callback();
                }
            }
        });
    }

    // 触发事件
    triggerEvent(eventType, eventData = {}) {
        if (this.eventListeners[eventType]) {
            const event = { 
                ...eventData, 
                type: eventType, 
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            
            this.eventListeners[eventType].forEach(listener => {
                listener.callback(event);
            });
        }
    }

    // 运行单个测试
    runTest(testName, testFunction) {
        try {
            console.log(`运行测试: ${testName}`);
            testFunction();
            this.testResults.push({ name: testName, status: 'PASS' });
            console.log(`✓ ${testName} - 通过`);
        } catch (error) {
            this.testResults.push({ 
                name: testName, 
                status: 'FAIL', 
                error: error.message 
            });
            console.error(`✗ ${testName} - 失败: ${error.message}`);
        }
    }

    // 断言函数
    assert(condition, message) {
        if (!condition) {
            throw new Error(message || '断言失败');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `期望 ${expected}，实际 ${actual}`);
        }
    }

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || '值不应为null或undefined');
        }
    }

    // 测试活动检测器和久坐提醒集成
    testActivityDetectorAndPostureReminder() {
        // 创建活动检测器
        const activityDetector = new ActivityDetector();
        
        // 创建久坐提醒
        const postureSettings = { interval: 60, enabled: true };
        const postureReminder = new ReminderManager(
            'posture', 
            postureSettings, 
            this.notificationService,
            activityDetector
        );
        
        // 启动久坐提醒
        postureReminder.start();
        
        this.assertEqual(postureReminder.isActive, true, '启动后应为活动状态');
        this.assertEqual(postureReminder.isPaused, false, '启动后不应为暂停状态');
        
        // 验证活动检测器已启动
        this.assert(activityDetector.isMonitoring, '活动检测器应启动');
        
        // 模拟用户离开（触发visibilitychange事件）
        document.hidden = true;
        this.triggerEvent('visibilitychange');
        
        // 推进时间超过非活动阈值
        this.advanceTime(activityDetector.inactivityThreshold + 1000);
        
        // 验证提醒已自动暂停
        this.assertEqual(postureReminder.isPaused, true, '用户离开后应自动暂停');
        
        // 模拟用户返回
        document.hidden = false;
        this.triggerEvent('visibilitychange');
        
        // 模拟用户活动（触发mousemove事件）
        this.triggerEvent('mousemove', { clientX: 100, clientY: 100 });
        
        // 验证提醒已自动恢复
        this.assertEqual(postureReminder.isPaused, false, '用户返回后应自动恢复');
        
        // 推进时间到提醒触发
        this.advanceTime(60 * 60 * 1000);
        
        // 验证通知已发送
        this.assert(this.notificationService.notifications.length > 0, '应发送通知');
        this.assertEqual(this.notificationService.notifications[0].type, 'posture', '通知类型应为posture');
        
        // 模拟用户确认提醒
        if (this.notificationService.lastConfirmCallback) {
            this.notificationService.lastConfirmCallback();
        }
        
        // 验证提醒已重置
        this.assertEqual(postureReminder.isActive, true, '确认后应仍为活动状态');
        this.assertEqual(postureReminder.timeRemaining, 60 * 60 * 1000, '确认后应重置剩余时间');
    }

    // 测试用户活动检测
    testUserActivityDetection() {
        // 创建活动检测器
        const activityDetector = new ActivityDetector();
        
        // 设置回调
        let lastEvent = null;
        activityDetector.callback = (event) => {
            lastEvent = event;
        };
        
        // 启动监控
        activityDetector.startMonitoring();
        
        // 验证事件监听器已注册
        this.assert(this.eventListeners['mousemove'], '应注册mousemove事件监听器');
        this.assert(this.eventListeners['keydown'], '应注册keydown事件监听器');
        this.assert(this.eventListeners['visibilitychange'], '应注册visibilitychange事件监听器');
        
        // 模拟用户活动
        this.triggerEvent('mousemove', { clientX: 100, clientY: 100 });
        
        // 验证最后活动时间已更新
        this.assertEqual(activityDetector.lastActivityTime, this.mockTime, '最后活动时间应更新');
        
        // 推进时间但不超过非活动阈值
        this.advanceTime(activityDetector.inactivityThreshold - 1000);
        
        // 验证用户状态仍为活动
        this.assertEqual(activityDetector.isUserActive, true, '用户应仍为活动状态');
        
        // 推进时间超过非活动阈值
        this.advanceTime(2000);
        
        // 验证用户状态变为非活动
        this.assertEqual(activityDetector.isUserActive, false, '用户应变为非活动状态');
        this.assertEqual(lastEvent.type, 'user-away', '应触发user-away事件');
        
        // 模拟用户返回活动
        this.triggerEvent('keydown', { key: 'a' });
        
        // 验证用户状态恢复为活动
        this.assertEqual(activityDetector.isUserActive, true, '用户应恢复为活动状态');
        this.assertEqual(lastEvent.type, 'user-return', '应触发user-return事件');
    }

    // 测试页面可见性变化
    testPageVisibilityChange() {
        // 创建活动检测器
        const activityDetector = new ActivityDetector();
        
        // 设置回调
        let lastEvent = null;
        activityDetector.callback = (event) => {
            lastEvent = event;
        };
        
        // 启动监控
        activityDetector.startMonitoring();
        
        // 模拟页面隐藏
        document.hidden = true;
        this.triggerEvent('visibilitychange');
        
        // 验证用户状态变为非活动
        this.assertEqual(activityDetector.isUserActive, false, '页面隐藏时用户应为非活动状态');
        this.assertEqual(lastEvent.type, 'user-away', '应触发user-away事件');
        
        // 模拟页面显示
        document.hidden = false;
        this.triggerEvent('visibilitychange');
        
        // 验证用户状态恢复为活动
        this.assertEqual(activityDetector.isUserActive, true, '页面显示时用户应为活动状态');
        this.assertEqual(lastEvent.type, 'user-return', '应触发user-return事件');
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始活动检测器和提醒管理器集成测试...\n');
        
        this.setup();
        
        this.runTest('活动检测器和久坐提醒集成测试', () => this.testActivityDetectorAndPostureReminder());
        this.runTest('用户活动检测测试', () => this.testUserActivityDetection());
        this.runTest('页面可见性变化测试', () => this.testPageVisibilityChange());
        
        this.teardown();
        
        // 输出测试结果
        console.log('\n测试结果汇总:');
        const passCount = this.testResults.filter(r => r.status === 'PASS').length;
        const failCount = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`总计: ${this.testResults.length} 个测试`);
        console.log(`通过: ${passCount} 个`);
        console.log(`失败: ${failCount} 个`);
        
        if (failCount > 0) {
            console.log('\n失败的测试:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`- ${r.name}: ${r.error}`));
        }
        
        return failCount === 0;
    }
}

// 导出测试类供浏览器使用
if (typeof window !== 'undefined') {
    window.ActivityReminderIntegrationTests = ActivityReminderIntegrationTests;
}