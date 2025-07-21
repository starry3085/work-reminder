/**
 * ReminderManager 单元测试
 */

// 模拟依赖
class MockNotificationService {
    constructor() {
        this.notifications = [];
        this.permissionStatus = 'granted';
    }

    showNotification(type, title, message, onConfirm, onSnooze) {
        this.notifications.push({
            type,
            title,
            message,
            timestamp: Date.now()
        });
        
        // 记录回调函数
        this.lastConfirmCallback = onConfirm;
        this.lastSnoozeCallback = onSnooze;
        
        return true;
    }

    requestPermission() {
        return Promise.resolve(this.permissionStatus);
    }

    setPermissionStatus(status) {
        this.permissionStatus = status;
    }

    clearNotifications() {
        this.notifications = [];
    }
}

class MockActivityDetector {
    constructor() {
        this.isMonitoring = false;
        this.callback = null;
        this.events = [];
    }

    startMonitoring() {
        this.isMonitoring = true;
    }

    stopMonitoring() {
        this.isMonitoring = false;
    }

    triggerEvent(eventType) {
        const event = { type: eventType, timestamp: Date.now() };
        this.events.push(event);
        
        if (this.callback) {
            this.callback(event);
        }
    }
}

// 测试套件
class ReminderManagerTests {
    constructor() {
        this.testResults = [];
        
        // 创建模拟依赖
        this.notificationService = new MockNotificationService();
        this.activityDetector = new MockActivityDetector();
        
        // 保存原始定时器函数
        this.originalSetTimeout = window.setTimeout;
        this.originalClearTimeout = window.clearTimeout;
        this.originalSetInterval = window.setInterval;
        this.originalClearInterval = window.clearInterval;
        this.originalDateNow = Date.now;
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
    }

    // 清理测试环境
    teardown() {
        // 恢复原始函数
        window.setTimeout = this.originalSetTimeout;
        window.clearTimeout = this.originalClearTimeout;
        window.setInterval = this.originalSetInterval;
        window.clearInterval = this.originalClearInterval;
        Date.now = this.originalDateNow;
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

    // 测试创建提醒管理器
    testCreateReminderManager() {
        // 测试喝水提醒
        const waterSettings = { interval: 30, enabled: true };
        const waterReminder = new ReminderManager(
            'water', 
            waterSettings, 
            this.notificationService
        );
        
        this.assert(waterReminder !== null, '应成功创建喝水提醒管理器');
        this.assertEqual(waterReminder.type, 'water', '类型应为water');
        this.assertEqual(waterReminder.settings.interval, 30, '间隔应为30分钟');
        this.assertEqual(waterReminder.isActive, false, '初始状态应为非活动');
        
        // 测试久坐提醒
        const postureSettings = { interval: 60, enabled: true };
        const postureReminder = new ReminderManager(
            'posture', 
            postureSettings, 
            this.notificationService,
            this.activityDetector
        );
        
        this.assert(postureReminder !== null, '应成功创建久坐提醒管理器');
        this.assertEqual(postureReminder.type, 'posture', '类型应为posture');
        this.assertEqual(postureReminder.settings.interval, 60, '间隔应为60分钟');
        this.assertEqual(postureReminder.isActive, false, '初始状态应为非活动');
        this.assertNotNull(postureReminder.activityDetector, '应包含活动检测器');
    }

    // 测试启动提醒
    testStartReminder() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 启动提醒
        reminder.start();
        
        this.assertEqual(reminder.isActive, true, '启动后应为活动状态');
        this.assertEqual(reminder.isPaused, false, '启动后不应为暂停状态');
        this.assertNotNull(reminder.startTime, '启动时间应设置');
        this.assertNotNull(reminder.nextReminderTime, '下次提醒时间应设置');
        this.assertEqual(reminder.timeRemaining, 30 * 60 * 1000, '剩余时间应为30分钟');
        
        // 验证定时器已创建
        this.assert(this.timeouts.length > 0, '应创建定时器');
        this.assert(this.intervals.length > 0, '应创建更新间隔定时器');
    }

    // 测试暂停和恢复提醒
    testPauseResumeReminder() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 启动提醒
        reminder.start();
        this.assertEqual(reminder.isActive, true, '启动后应为活动状态');
        
        // 推进时间10分钟
        this.advanceTime(10 * 60 * 1000);
        
        // 暂停提醒
        reminder.pause();
        this.assertEqual(reminder.isPaused, true, '暂停后应为暂停状态');
        this.assertEqual(reminder.isActive, true, '暂停后仍应为活动状态');
        
        // 记录暂停时的剩余时间
        const remainingAtPause = reminder.timeRemaining;
        this.assert(remainingAtPause < 30 * 60 * 1000, '剩余时间应减少');
        this.assert(remainingAtPause > 0, '剩余时间应大于0');
        
        // 推进时间5分钟
        this.advanceTime(5 * 60 * 1000);
        
        // 验证暂停期间剩余时间不变
        this.assertEqual(reminder.timeRemaining, remainingAtPause, '暂停期间剩余时间不应变化');
        
        // 恢复提醒
        reminder.resume();
        this.assertEqual(reminder.isPaused, false, '恢复后不应为暂停状态');
        this.assertEqual(reminder.isActive, true, '恢复后应为活动状态');
        
        // 验证定时器已重新创建
        this.assert(this.timeouts.length > 0, '恢复后应重新创建定时器');
    }

    // 测试提醒触发
    testReminderTrigger() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 启动提醒
        reminder.start();
        
        // 推进时间到提醒触发
        this.advanceTime(30 * 60 * 1000);
        
        // 验证通知已发送
        this.assert(this.notificationService.notifications.length > 0, '应发送通知');
        this.assertEqual(this.notificationService.notifications[0].type, 'water', '通知类型应为water');
    }

    // 测试确认提醒
    testAcknowledgeReminder() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 启动提醒
        reminder.start();
        
        // 推进时间到提醒触发
        this.advanceTime(30 * 60 * 1000);
        
        // 验证通知已发送
        this.assert(this.notificationService.notifications.length > 0, '应发送通知');
        
        // 确认提醒
        reminder.acknowledge();
        
        // 验证提醒已重置
        this.assertEqual(reminder.isActive, true, '确认后应仍为活动状态');
        this.assertEqual(reminder.timeRemaining, 30 * 60 * 1000, '确认后应重置剩余时间');
        this.assertNotNull(reminder.settings.lastReminder, '应更新最后提醒时间');
    }

    // 测试稍后提醒
    testSnoozeReminder() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 启动提醒
        reminder.start();
        
        // 推进时间到提醒触发
        this.advanceTime(30 * 60 * 1000);
        
        // 验证通知已发送
        this.assert(this.notificationService.notifications.length > 0, '应发送通知');
        
        // 稍后提醒
        reminder.snooze();
        
        // 验证提醒已延迟
        this.assertEqual(reminder.isActive, true, '稍后提醒后应仍为活动状态');
        this.assertEqual(reminder.timeRemaining, 5 * 60 * 1000, '稍后提醒后应设置为5分钟');
    }

    // 测试更新设置
    testUpdateSettings() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 启动提醒
        reminder.start();
        
        // 推进时间10分钟
        this.advanceTime(10 * 60 * 1000);
        
        // 更新设置
        reminder.updateSettings({ interval: 45 });
        
        // 验证设置已更新
        this.assertEqual(reminder.settings.interval, 45, '间隔应更新为45分钟');
        
        // 验证剩余时间已按比例调整
        const expectedRemaining = Math.round(45 * 60 * 1000 * (2/3)); // 剩余2/3的时间
        const actualRemaining = Math.round(reminder.timeRemaining);
        
        // 允许1秒的误差
        this.assert(
            Math.abs(actualRemaining - expectedRemaining) < 1000,
            `剩余时间应按比例调整，期望约${expectedRemaining}，实际${actualRemaining}`
        );
    }

    // 测试活动检测集成（久坐提醒）
    testActivityDetection() {
        const settings = { interval: 60, enabled: true };
        const reminder = new ReminderManager(
            'posture', 
            settings, 
            this.notificationService,
            this.activityDetector
        );
        
        // 启动提醒
        reminder.start();
        this.assertEqual(reminder.isActive, true, '启动后应为活动状态');
        this.assert(this.activityDetector.isMonitoring, '活动检测器应启动');
        
        // 模拟用户离开
        this.activityDetector.triggerEvent('user-away');
        
        // 验证提醒已自动暂停
        this.assertEqual(reminder.isPaused, true, '用户离开后应自动暂停');
        
        // 模拟用户返回
        this.activityDetector.triggerEvent('user-return');
        
        // 验证提醒已自动恢复
        this.assertEqual(reminder.isPaused, false, '用户返回后应自动恢复');
    }

    // 测试状态恢复
    testRestoreState() {
        const settings = { interval: 30, enabled: true };
        const reminder = new ReminderManager(
            'water', 
            settings, 
            this.notificationService
        );
        
        // 创建保存的状态
        const savedState = {
            isActive: true,
            isPaused: false,
            timeRemaining: 15 * 60 * 1000, // 15分钟
            nextReminderAt: Date.now() + 15 * 60 * 1000
        };
        
        // 恢复状态
        reminder.restoreState(savedState);
        
        // 验证状态已恢复
        this.assertEqual(reminder.isActive, true, '活动状态应恢复');
        this.assertEqual(reminder.isPaused, false, '暂停状态应恢复');
        this.assertEqual(reminder.timeRemaining, 15 * 60 * 1000, '剩余时间应恢复');
        this.assertNotNull(reminder.nextReminderTime, '下次提醒时间应设置');
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始ReminderManager单元测试...\n');
        
        this.setup();
        
        this.runTest('创建提醒管理器测试', () => this.testCreateReminderManager());
        this.runTest('启动提醒测试', () => this.testStartReminder());
        this.runTest('暂停和恢复提醒测试', () => this.testPauseResumeReminder());
        this.runTest('提醒触发测试', () => this.testReminderTrigger());
        this.runTest('确认提醒测试', () => this.testAcknowledgeReminder());
        this.runTest('稍后提醒测试', () => this.testSnoozeReminder());
        this.runTest('更新设置测试', () => this.testUpdateSettings());
        this.runTest('活动检测集成测试', () => this.testActivityDetection());
        this.runTest('状态恢复测试', () => this.testRestoreState());
        
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

// 如果在Node.js环境中运行测试
if (typeof require !== 'undefined') {
    try {
        const ReminderManager = require('../js/reminder-manager.js');
        global.ReminderManager = ReminderManager;
        
        // 运行测试
        const tests = new ReminderManagerTests();
        const success = tests.runAllTests();
        
        if (typeof process !== 'undefined') {
            process.exit(success ? 0 : 1);
        }
    } catch (error) {
        console.error('无法加载ReminderManager或运行测试:', error);
        if (typeof process !== 'undefined') {
            process.exit(1);
        }
    }
}

// 导出测试类供浏览器使用
if (typeof window !== 'undefined') {
    window.ReminderManagerTests = ReminderManagerTests;
}