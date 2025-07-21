/**
 * 喝水提醒功能测试
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

// 测试用例
function runWaterReminderTests() {
    console.log('开始喝水提醒功能测试...\n');
    
    // 测试1: 基本功能测试
    testBasicFunctionality();
    
    // 测试2: 喝水确认测试
    testDrinkConfirmation();
    
    // 测试3: 每日统计测试
    testDailyStats();
    
    // 测试4: 数据持久化测试
    testDataPersistence();
    
    console.log('\n所有测试完成！');
}

function testBasicFunctionality() {
    console.log('测试1: 基本功能测试');
    
    const mockNotification = new MockNotificationService();
    const settings = {
        enabled: true,
        interval: 1, // 1分钟用于测试
        sound: true,
        lastReminder: null
    };
    
    const waterReminder = new WaterReminder(settings, mockNotification);
    
    // 测试初始状态
    const initialStatus = waterReminder.getCurrentStatus();
    console.log('✓ 初始状态正确:', !initialStatus.isActive);
    
    // 测试启动
    waterReminder.start();
    const activeStatus = waterReminder.getCurrentStatus();
    console.log('✓ 启动状态正确:', activeStatus.isActive);
    
    // 测试停止
    waterReminder.stop();
    const stoppedStatus = waterReminder.getCurrentStatus();
    console.log('✓ 停止状态正确:', !stoppedStatus.isActive);
    
    waterReminder.destroy();
    console.log('测试1完成\n');
}

function testDrinkConfirmation() {
    console.log('测试2: 喝水确认测试');
    
    const mockNotification = new MockNotificationService();
    const settings = {
        enabled: true,
        interval: 30,
        sound: true,
        lastReminder: null
    };
    
    const waterReminder = new WaterReminder(settings, mockNotification);
    
    // 测试初始喝水统计
    let stats = waterReminder.getDailyStats();
    console.log('✓ 初始统计正确:', stats.count === 0);
    
    // 测试喝水确认
    waterReminder.confirmDrink(250);
    stats = waterReminder.getDailyStats();
    console.log('✓ 喝水确认后统计更新:', stats.count === 1);
    console.log('✓ 喝水量记录正确:', stats.totalAmount === 250);
    
    // 测试多次喝水
    waterReminder.confirmDrink(300);
    waterReminder.confirmDrink(200);
    stats = waterReminder.getDailyStats();
    console.log('✓ 多次喝水统计正确:', stats.count === 3);
    console.log('✓ 总喝水量正确:', stats.totalAmount === 750);
    
    waterReminder.destroy();
    console.log('测试2完成\n');
}

function testDailyStats() {
    console.log('测试3: 每日统计测试');
    
    const mockNotification = new MockNotificationService();
    const settings = {
        enabled: true,
        interval: 30,
        sound: true,
        lastReminder: null
    };
    
    const waterReminder = new WaterReminder(settings, mockNotification);
    
    // 测试目标设置
    waterReminder.setDailyGoal(6);
    let stats = waterReminder.getDailyStats();
    console.log('✓ 目标设置正确:', stats.goal === 6);
    
    // 测试进度计算
    for (let i = 0; i < 3; i++) {
        waterReminder.confirmDrink();
    }
    stats = waterReminder.getDailyStats();
    console.log('✓ 进度计算正确:', stats.progress === 0.5);
    console.log('✓ 百分比正确:', stats.progressPercent === 50);
    
    // 测试目标达成
    for (let i = 0; i < 3; i++) {
        waterReminder.confirmDrink();
    }
    stats = waterReminder.getDailyStats();
    console.log('✓ 目标达成检测:', stats.isGoalReached === true);
    
    // 测试建议功能
    const suggestion = waterReminder.getDrinkingSuggestion();
    console.log('✓ 建议功能正常:', typeof suggestion === 'string');
    
    waterReminder.destroy();
    console.log('测试3完成\n');
}

function testDataPersistence() {
    console.log('测试4: 数据持久化测试');
    
    const mockNotification = new MockNotificationService();
    const settings = {
        enabled: true,
        interval: 30,
        sound: true,
        lastReminder: null
    };
    
    // 创建第一个实例并添加数据
    const waterReminder1 = new WaterReminder(settings, mockNotification);
    waterReminder1.confirmDrink(250);
    waterReminder1.confirmDrink(300);
    
    let stats1 = waterReminder1.getDailyStats();
    console.log('✓ 第一个实例数据正确:', stats1.count === 2);
    
    waterReminder1.destroy();
    
    // 创建第二个实例，应该加载之前的数据
    const waterReminder2 = new WaterReminder(settings, mockNotification);
    let stats2 = waterReminder2.getDailyStats();
    console.log('✓ 数据持久化正确:', stats2.count === 2);
    console.log('✓ 总量持久化正确:', stats2.totalAmount === 550);
    
    waterReminder2.destroy();
    console.log('测试4完成\n');
}

// 如果在浏览器环境中运行测试
if (typeof window !== 'undefined') {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runWaterReminderTests);
    } else {
        runWaterReminderTests();
    }
}

// 如果在Node.js环境中
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runWaterReminderTests,
        testBasicFunctionality,
        testDrinkConfirmation,
        testDailyStats,
        testDataPersistence
    };
}