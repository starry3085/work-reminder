/**
 * ActivityDetector 类的单元测试
 */

describe('ActivityDetector', () => {
    let activityDetector;
    let mockCallback;
    
    // 在每个测试前设置
    beforeEach(() => {
        // 创建一个模拟回调函数
        mockCallback = jest.fn();
        
        // 创建ActivityDetector实例
        activityDetector = new ActivityDetector(mockCallback);
        
        // 模拟Date.now以便测试时间相关功能
        jest.spyOn(Date, 'now').mockImplementation(() => 1000);
        
        // 模拟setInterval和clearInterval
        jest.useFakeTimers();
    });
    
    // 在每个测试后清理
    afterEach(() => {
        // 停止监控以清理事件监听
        if (activityDetector.isMonitoring) {
            activityDetector.stopMonitoring();
        }
        
        // 恢复所有模拟
        jest.restoreAllMocks();
        jest.clearAllTimers();
    });
    
    test('应该正确初始化', () => {
        expect(activityDetector.isMonitoring).toBe(false);
        expect(activityDetector.lastActivityTime).toBe(1000);
        expect(activityDetector.isAway).toBe(false);
        expect(activityDetector.awayThreshold).toBe(5 * 60 * 1000); // 5分钟
    });
    
    test('startMonitoring应该添加事件监听器并设置定时器', () => {
        // 模拟document.addEventListener
        const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
        
        activityDetector.startMonitoring();
        
        // 验证事件监听器被添加
        expect(addEventListenerSpy).toHaveBeenCalledTimes(5); // 4个活动事件 + 1个可见性事件
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', activityDetector.handleActivity);
        expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', activityDetector.handleActivity);
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', activityDetector.handleActivity);
        expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', activityDetector.handleActivity);
        expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', activityDetector.handleVisibilityChange);
        
        // 验证定时器被设置
        expect(setInterval).toHaveBeenCalledWith(activityDetector.checkUserActivity, activityDetector.checkIntervalTime);
        
        // 验证状态更新
        expect(activityDetector.isMonitoring).toBe(true);
    });
    
    test('stopMonitoring应该移除事件监听器并清除定时器', () => {
        // 先启动监控
        activityDetector.startMonitoring();
        
        // 模拟document.removeEventListener
        const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
        
        activityDetector.stopMonitoring();
        
        // 验证事件监听器被移除
        expect(removeEventListenerSpy).toHaveBeenCalledTimes(5);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', activityDetector.handleActivity);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', activityDetector.handleActivity);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', activityDetector.handleActivity);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', activityDetector.handleActivity);
        expect(removeEventListenerSpy).toHaveBeenCalledWith('visibilitychange', activityDetector.handleVisibilityChange);
        
        // 验证定时器被清除
        expect(clearInterval).toHaveBeenCalled();
        
        // 验证状态更新
        expect(activityDetector.isMonitoring).toBe(false);
    });
    
    test('handleActivity应该更新最后活动时间', () => {
        // 设置模拟时间
        Date.now.mockReturnValue(2000);
        
        activityDetector.handleActivity({});
        
        expect(activityDetector.lastActivityTime).toBe(2000);
    });
    
    test('当用户从离开状态返回时，handleActivity应该触发回调', () => {
        // 设置用户为离开状态
        activityDetector.isAway = true;
        
        // 设置模拟时间
        Date.now.mockReturnValue(3000);
        
        activityDetector.handleActivity({});
        
        // 验证回调被调用
        expect(mockCallback).toHaveBeenCalledWith({
            type: 'user-return',
            timestamp: 3000,
            awayDuration: 2000 // 3000 - 1000
        });
        
        // 验证状态更新
        expect(activityDetector.isAway).toBe(false);
    });
    
    test('checkUserActivity应该在用户超过阈值无活动时触发离开事件', () => {
        // 设置最后活动时间为很久以前
        activityDetector.lastActivityTime = 0;
        
        // 设置模拟时间为超过阈值
        Date.now.mockReturnValue(activityDetector.awayThreshold + 1);
        
        activityDetector.checkUserActivity();
        
        // 验证回调被调用
        expect(mockCallback).toHaveBeenCalledWith({
            type: 'user-away',
            timestamp: activityDetector.awayThreshold + 1,
            lastActivity: 0
        });
        
        // 验证状态更新
        expect(activityDetector.isAway).toBe(true);
    });
    
    test('isUserActive应该返回正确的活动状态', () => {
        // 默认状态
        expect(activityDetector.isUserActive()).toBe(true);
        
        // 离开状态
        activityDetector.isAway = true;
        expect(activityDetector.isUserActive()).toBe(false);
    });
    
    test('getAwayDuration应该返回正确的离开时长', () => {
        // 设置最后活动时间
        activityDetector.lastActivityTime = 500;
        
        // 设置当前时间
        Date.now.mockReturnValue(1500);
        
        expect(activityDetector.getAwayDuration()).toBe(1000); // 1500 - 500
    });
    
    test('setAwayThreshold应该正确设置离开阈值', () => {
        // 设置为10分钟
        const result = activityDetector.setAwayThreshold(10);
        
        expect(result).toBe(true);
        expect(activityDetector.awayThreshold).toBe(10 * 60 * 1000);
        
        // 测试无效输入
        const invalidResult = activityDetector.setAwayThreshold(-5);
        expect(invalidResult).toBe(false);
        expect(activityDetector.awayThreshold).toBe(10 * 60 * 1000); // 保持不变
    });
    
    test('handleVisibilityChange应该在页面变为可见时触发活动事件', () => {
        // 模拟document.visibilityState
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: jest.fn().mockReturnValue('visible')
        });
        
        // 模拟handleActivity方法
        const handleActivitySpy = jest.spyOn(activityDetector, 'handleActivity');
        
        activityDetector.handleVisibilityChange();
        
        // 验证handleActivity被调用
        expect(handleActivitySpy).toHaveBeenCalledWith({ type: 'visibility-change' });
    });
});