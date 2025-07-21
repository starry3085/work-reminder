/**
 * 活动检测器与久坐提醒集成测试
 */

describe('ActivityDetector与ReminderManager集成', () => {
    let activityDetector;
    let reminderManager;
    let notificationService;
    let mockStatusCallback;
    let mockTimeCallback;
    
    // 模拟设置
    const settings = {
        interval: 60, // 60分钟
        activityThreshold: 5, // 5分钟
        sound: true
    };
    
    // 在每个测试前设置
    beforeEach(() => {
        // 创建模拟通知服务
        notificationService = {
            showNotification: jest.fn()
        };
        
        // 创建活动检测器
        activityDetector = new ActivityDetector(() => {});
        
        // 创建回调函数
        mockStatusCallback = jest.fn();
        mockTimeCallback = jest.fn();
        
        // 创建久坐提醒管理器
        reminderManager = new ReminderManager('posture', settings, notificationService, activityDetector);
        reminderManager.setStatusChangeCallback(mockStatusCallback);
        reminderManager.setTimeUpdateCallback(mockTimeCallback);
        
        // 模拟Date.now
        jest.spyOn(Date, 'now').mockImplementation(() => 1000);
        
        // 模拟setInterval和clearInterval
        jest.useFakeTimers();
    });
    
    // 在每个测试后清理
    afterEach(() => {
        if (reminderManager.isActive) {
            reminderManager.stop();
        }
        
        jest.restoreAllMocks();
        jest.clearAllTimers();
    });
    
    test('启动久坐提醒应该同时启动活动检测', () => {
        // 模拟活动检测器的startMonitoring方法
        const startMonitoringSpy = jest.spyOn(activityDetector, 'startMonitoring');
        
        // 启动久坐提醒
        reminderManager.start();
        
        // 验证活动检测器被启动
        expect(startMonitoringSpy).toHaveBeenCalled();
        expect(reminderManager.isActive).toBe(true);
    });
    
    test('停止久坐提醒应该同时停止活动检测', () => {
        // 先启动久坐提醒
        reminderManager.start();
        
        // 模拟活动检测器的stopMonitoring方法
        const stopMonitoringSpy = jest.spyOn(activityDetector, 'stopMonitoring');
        
        // 停止久坐提醒
        reminderManager.stop();
        
        // 验证活动检测器被停止
        expect(stopMonitoringSpy).toHaveBeenCalled();
        expect(reminderManager.isActive).toBe(false);
    });
    
    test('用户离开应该自动暂停久坐提醒', () => {
        // 启动久坐提醒
        reminderManager.start();
        
        // 模拟用户离开事件
        activityDetector.callback({
            type: 'user-away',
            timestamp: 2000,
            lastActivity: 1000
        });
        
        // 验证久坐提醒被暂停
        expect(reminderManager.isPaused).toBe(true);
        expect(mockStatusCallback).toHaveBeenCalledWith({
            type: 'posture',
            status: 'paused',
            isActive: true,
            isPaused: true,
            isAuto: true
        });
    });
    
    test('用户返回应该自动恢复久坐提醒', () => {
        // 启动久坐提醒并暂停
        reminderManager.start();
        reminderManager.pause(true);
        
        // 清除之前的回调记录
        mockStatusCallback.mockClear();
        
        // 模拟用户返回事件
        activityDetector.callback({
            type: 'user-return',
            timestamp: 3000,
            awayDuration: 2000
        });
        
        // 验证久坐提醒被恢复
        expect(reminderManager.isPaused).toBe(false);
        expect(mockStatusCallback).toHaveBeenCalledWith({
            type: 'posture',
            status: 'resumed',
            isActive: true,
            isPaused: false,
            isAuto: true
        });
    });
    
    test('用户长时间离开后返回应该重置久坐提醒计时器', () => {
        // 启动久坐提醒
        reminderManager.start();
        
        // 设置一个较短的剩余时间
        reminderManager.remainingTime = 10 * 60 * 1000; // 10分钟
        
        // 模拟用户长时间离开后返回
        activityDetector.callback({
            type: 'user-return',
            timestamp: 10000,
            awayDuration: 6 * 60 * 1000 // 6分钟
        });
        
        // 验证计时器被重置
        expect(reminderManager.remainingTime).toBe(reminderManager.interval);
        expect(mockTimeCallback).toHaveBeenCalled();
    });
    
    test('更新设置应该更新活动检测阈值', () => {
        // 模拟活动检测器的setAwayThreshold方法
        const setAwayThresholdSpy = jest.spyOn(activityDetector, 'setAwayThreshold');
        
        // 更新设置
        reminderManager.updateSettings({
            activityThreshold: 10 // 10分钟
        });
        
        // 验证活动检测阈值被更新
        expect(setAwayThresholdSpy).toHaveBeenCalledWith(10);
    });
    
    test('久坐提醒计时器应该考虑用户活动状态', () => {
        // 启动久坐提醒
        reminderManager.start();
        
        // 设置初始剩余时间
        reminderManager.remainingTime = 60000; // 1分钟
        reminderManager.lastCheckTime = 1000;
        
        // 模拟时间流逝
        Date.now.mockReturnValue(2000); // 1秒后
        
        // 模拟用户活跃
        jest.spyOn(activityDetector, 'isUserActive').mockReturnValue(true);
        
        // 触发定时器更新
        reminderManager.updateTimer();
        
        // 验证剩余时间减少了
        expect(reminderManager.remainingTime).toBe(59000); // 60000 - 1000
        
        // 模拟用户不活跃
        jest.spyOn(activityDetector, 'isUserActive').mockReturnValue(false);
        
        // 再次模拟时间流逝
        Date.now.mockReturnValue(3000); // 再过1秒
        
        // 触发定时器更新
        reminderManager.updateTimer();
        
        // 验证剩余时间没有减少
        expect(reminderManager.remainingTime).toBe(59000); // 保持不变
    });
});