/**
 * 活动提醒集成测试
 */
describe('ActivityReminder Integration', () => {
    let activityDetector;
    let postureReminder;
    let notificationService;
    
    beforeEach(() => {
        // 创建模拟通知服务
        notificationService = {
            showNotification: jest.fn(),
            showInPageAlert: jest.fn()
        };
        
        // 创建活动检测器
        activityDetector = new ActivityDetector((event) => {
            // 活动检测回调
            if (postureReminder) {
                postureReminder.handleActivityChange(event);
            }
        });
        
        // 创建久坐提醒
        postureReminder = new PostureReminder(
            { interval: 60, enabled: true },
            notificationService,
            activityDetector
        );
        
        // 模拟计时器
        jest.useFakeTimers();
    });
    
    afterEach(() => {
        // 恢复真实计时器
        jest.useRealTimers();
    });
    
    test('应该在用户离开时自动暂停久坐提醒', () => {
        // 启动久坐提醒
        postureReminder.start();
        
        // 确认提醒已启动
        expect(postureReminder.isActive()).toBe(true);
        
        // 模拟用户离开事件
        activityDetector.handleUserAway();
        
        // 确认提醒已暂停
        expect(postureReminder.isActive()).toBe(false);
    });
    
    test('应该在用户返回时自动恢复久坐提醒', () => {
        // 启动久坐提醒
        postureReminder.start();
        
        // 模拟用户离开事件
        activityDetector.handleUserAway();
        
        // 确认提醒已暂停
        expect(postureReminder.isActive()).toBe(false);
        
        // 模拟用户返回事件
        activityDetector.handleUserActivity();
        
        // 确认提醒已恢复
        expect(postureReminder.isActive()).toBe(true);
    });
    
    test('应该在检测到用户活动时重置久坐计时器', () => {
        // 启动久坐提醒
        postureReminder.start();
        
        // 前进30分钟
        jest.advanceTimersByTime(30 * 60 * 1000);
        
        // 模拟用户活动
        activityDetector.handleUserActivity();
        
        // 获取当前状态
        const status = postureReminder.getCurrentStatus();
        
        // 确认计时器已重置（剩余时间应接近60分钟）
        const expectedTimeRemaining = 60 * 60 * 1000;
        const tolerance = 1000; // 允许1秒的误差
        
        expect(Math.abs(status.timeRemaining - expectedTimeRemaining)).toBeLessThan(tolerance);
    });
    
    test('应该在提醒触发时显示通知', () => {
        // 启动久坐提醒
        postureReminder.start();
        
        // 前进60分钟触发提醒
        jest.advanceTimersByTime(60 * 60 * 1000);
        
        // 确认通知已显示
        expect(notificationService.showNotification).toHaveBeenCalled();
    });
    
    test('应该在确认提醒后重置计时器', () => {
        // 启动久坐提醒
        postureReminder.start();
        
        // 前进60分钟触发提醒
        jest.advanceTimersByTime(60 * 60 * 1000);
        
        // 确认提醒
        postureReminder.acknowledge();
        
        // 获取当前状态
        const status = postureReminder.getCurrentStatus();
        
        // 确认计时器已重置
        const expectedTimeRemaining = 60 * 60 * 1000;
        const tolerance = 1000; // 允许1秒的误差
        
        expect(Math.abs(status.timeRemaining - expectedTimeRemaining)).toBeLessThan(tolerance);
    });
});