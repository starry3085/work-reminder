/**
 * 久坐提醒功能测试
 */

// 模拟依赖
class MockNotificationService {
    constructor() {
        this.notifications = [];
        this.alerts = [];
    }
    
    showNotification(type, title, message, confirmCallback, snoozeCallback, options) {
        this.notifications.push({
            type, title, message, confirmCallback, snoozeCallback, options
        });
        console.log(`通知: ${title} - ${message}`);
    }
    
    showInPageAlert(type, options) {
        this.alerts.push({ type, options });
        console.log(`页面提醒: ${options.title} - ${options.message}`);
    }
}

class MockActivityDetector {
    constructor(callback) {
        this.callback = callback;
        this.isMonitoring = false;
        this.lastActivityTime = Date.now();
    }
    
    startMonitoring() {
        this.isMonitoring = true;
        console.log('活动检测器已启动');
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
        console.log('活动检测器已停止');
    }
    
    getLastActivityTime() {
        return this.lastActivityTime;
    }
    
    isUserActive() {
        return Date.now() - this.lastActivityTime < 300000; // 5分钟内有活动
    }
    
    // 模拟用户活动
    simulateActivity() {
        this.lastActivityTime = Date.now();
        if (this.callback) {
            this.callback({ type: 'user-activity', timestamp: this.lastActivityTime });
        }
    }
    
    // 模拟用户离开
    simulateUserAway() {
        if (this.callback) {
            this.callback({ type: 'user-away', timestamp: Date.now() });
        }
    }
    
    // 模拟用户返回
    simulateUserReturn() {
        this.lastActivityTime = Date.now();
        if (this.callback) {
            this.callback({ type: 'user-return', timestamp: this.lastActivityTime });
        }
    }
}

// 测试用例
function runPostureReminderTests() {
    console.log('开始久坐提醒功能测试...\n');
    
    // 测试1: 基本功能测试
    testBasicFunctionality();
    
    // 测试2: 活动确认测试
    testActivityConfirmation();
    
    // 测试3: 智能活动检测测试
    testSmartActivityDetection();
    
    // 测试4: 每日统计测试
    testDailyStats();
    
    // 测试5: 数据持久化测试
    testDataPersistence();
    
    console.log('\n所有测试完成！');
}

function testBasicFunctionality() {
    console.log('测试1: 基本功能测试');
    
    const mockNotification = new MockNotificationService();
    const mockActivity = new MockActivityDetector();
    const settings = {
        enabled: true,
        interval: 1, // 1分钟用于测试
        sound: true,
        lastReminder: null,
        activityThreshold: 5
    };
    
    const postureReminder = new PostureReminder(settings, mockNotification, mockActivity);
    
    // 测试初始状态
    const initialStatus = postureReminder.getCurrentStatus();
    console.log('✓ 初始状态正确:', !initialStatus.isActive);
    console.log('✓ 活动检测器集成正确:', mockActivity.isMonitoring === false);
    
    // 测试启动
    postureReminder.start();
    const activeStatus = postureReminder.getCurrentStatus();
    console.log('✓ 启动状态正确:', activeStatus.isActive);
    console.log('✓ 活动检测器已启动:', mockActivity.isMonitoring === true);
    
    // 测试停止
    postureReminder.stop();
    const stoppedStatus = postureReminder.getCurrentStatus();
    console.log('✓ 停止状态正确:', !stoppedStatus.isActive);
    
    postureReminder.destroy();
    console.log('测试1完成\n');
}

function testActivityConfirmation() {
    console.log('测试2: 活动确认测试');
    
    const mockNotification = new MockNotificationService();
    const mockActivity = new MockActivityDetector();
    const settings = {
        enabled: true,
        interval: 60,
        sound: true,
        lastReminder: null,
        activityThreshold: 5
    };
    
    const postureReminder = new PostureReminder(settings, mockNotification, mockActivity);
    
    // 测试初始活动统计
    let stats = postureReminder.getDailyStats();
    console.log('✓ 初始统计正确:', stats.count === 0);
    
    // 测试活动确认
    postureReminder.confirmActivity(5, 'manual');
    stats = postureReminder.getDailyStats();
    console.log('✓ 活动确认后统计更新:', stats.count === 1);
    console.log('✓ 活动时长记录正确:', stats.totalActivityTime === 5 * 60 * 1000);
    
    // 测试多次活动
    postureReminder.confirmActivity(3, 'walk');
    postureReminder.confirmActivity(10, 'exercise');
    stats = postureReminder.getDailyStats();
    console.log('✓ 多次活动统计正确:', stats.count === 3);
    console.log('✓ 平均活动时长正确:', stats.averageActivityDuration === 6); // (5+3+10)/3 = 6
    
    postureReminder.destroy();
    console.log('测试2完成\n');
}

function testSmartActivityDetection() {
    console.log('测试3: 智能活动检测测试');
    
    const mockNotification = new MockNotificationService();
    const mockActivity = new MockActivityDetector();
    const settings = {
        enabled: true,
        interval: 60,
        sound: true,
        lastReminder: null,
        activityThreshold: 5
    };
    
    const postureReminder = new PostureReminder(settings, mockNotification, mockActivity);
    postureReminder.start();
    
    // 测试用户离开检测
    let status = postureReminder.getCurrentStatus();
    console.log('✓ 初始用户状态:', !status.isUserAway);
    
    // 模拟用户离开
    mockActivity.simulateUserAway();
    status = postureReminder.getCurrentStatus();
    console.log('✓ 用户离开检测正确:', status.isUserAway);
    console.log('✓ 自动暂停功能正确:', status.isPaused);
    
    // 模拟用户返回
    mockActivity.simulateUserReturn();
    status = postureReminder.getCurrentStatus();
    console.log('✓ 用户返回检测正确:', !status.isUserAway);
    console.log('✓ 自动恢复功能正确:', !status.isPaused);
    
    // 测试活动阈值设置
    postureReminder.setActivityThreshold(10);
    console.log('✓ 活动阈值设置正确:', status.activityThreshold === 10 * 60 * 1000);
    
    postureReminder.destroy();
    console.log('测试3完成\n');
}

function testDailyStats() {
    console.log('测试4: 每日统计测试');
    
    const mockNotification = new MockNotificationService();
    const mockActivity = new MockActivityDetector();
    const settings = {
        enabled: true,
        interval: 60,
        sound: true,
        lastReminder: null,
        activityThreshold: 5
    };
    
    const postureReminder = new PostureReminder(settings, mockNotification, mockActivity);
    
    // 测试目标设置
    postureReminder.setDailyGoal(6);
    let stats = postureReminder.getDailyStats();
    console.log('✓ 目标设置正确:', stats.goal === 6);
    
    // 测试进度计算
    for (let i = 0; i < 3; i++) {
        postureReminder.confirmActivity(5);
    }
    stats = postureReminder.getDailyStats();
    console.log('✓ 进度计算正确:', stats.progress === 0.5);
    console.log('✓ 百分比正确:', stats.progressPercent === 50);
    
    // 测试目标达成
    for (let i = 0; i < 3; i++) {
        postureReminder.confirmActivity(5);
    }
    stats = postureReminder.getDailyStats();
    console.log('✓ 目标达成检测:', stats.isGoalReached === true);
    
    // 测试健康建议功能
    const suggestion = postureReminder.getHealthSuggestion();
    console.log('✓ 建议功能正常:', typeof suggestion === 'string');
    
    // 测试坐着时间统计
    console.log('✓ 坐着时间统计:', typeof stats.sittingHours === 'number');
    
    postureReminder.destroy();
    console.log('测试4完成\n');
}

function testDataPersistence() {
    console.log('测试5: 数据持久化测试');
    
    const mockNotification = new MockNotificationService();
    const mockActivity = new MockActivityDetector();
    const settings = {
        enabled: true,
        interval: 60,
        sound: true,
        lastReminder: null,
        activityThreshold: 5
    };
    
    // 创建第一个实例并添加数据
    const postureReminder1 = new PostureReminder(settings, mockNotification, mockActivity);
    postureReminder1.confirmActivity(5, 'walk');
    postureReminder1.confirmActivity(3, 'stretch');
    
    let stats1 = postureReminder1.getDailyStats();
    console.log('✓ 第一个实例数据正确:', stats1.count === 2);
    
    postureReminder1.destroy();
    
    // 创建第二个实例，应该加载之前的数据
    const postureReminder2 = new PostureReminder(settings, mockNotification, mockActivity);
    let stats2 = postureReminder2.getDailyStats();
    console.log('✓ 数据持久化正确:', stats2.count === 2);
    console.log('✓ 活动时长持久化正确:', stats2.totalActivityTime === 8 * 60 * 1000);
    
    postureReminder2.destroy();
    console.log('测试5完成\n');
}

// 如果在浏览器环境中运行测试
if (typeof window !== 'undefined') {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runPostureReminderTests);
    } else {
        runPostureReminderTests();
    }
}

// 如果在Node.js环境中
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runPostureReminderTests,
        testBasicFunctionality,
        testActivityConfirmation,
        testSmartActivityDetection,
        testDailyStats,
        testDataPersistence
    };
}