/**
 * 错误处理器测试
 */
describe('ErrorHandler', () => {
    let errorHandler;
    
    beforeEach(() => {
        // 创建一个新的错误处理器实例
        errorHandler = new ErrorHandler();
        
        // 清除错误日志
        errorHandler.clearErrorLog();
        
        // 模拟控制台方法
        console.error = jest.fn();
        console.warn = jest.fn();
    });
    
    test('应该能够处理存储错误', () => {
        // 创建一个存储错误
        const storageError = new Error('localStorage is not available');
        
        // 处理错误
        const result = errorHandler.getUserFriendlyError(storageError);
        
        // 验证结果
        expect(result.type).toBe('warning');
        expect(result.title).toBe('存储功能受限');
        expect(result.message).toContain('本地存储不可用');
        expect(result.solution).toBeTruthy();
    });
    
    test('应该能够处理通知错误', () => {
        // 创建一个通知错误
        const notificationError = new Error('Notification permission denied');
        
        // 处理错误
        const result = errorHandler.getUserFriendlyError(notificationError);
        
        // 验证结果
        expect(result.type).toBe('info');
        expect(result.title).toBe('通知功能受限');
        expect(result.message).toContain('系统通知功能不可用');
        expect(result.solution).toBeTruthy();
    });
    
    test('应该能够处理音频错误', () => {
        // 创建一个音频错误
        const audioError = new Error('Failed to play audio');
        
        // 处理错误
        const result = errorHandler.getUserFriendlyError(audioError);
        
        // 验证结果
        expect(result.type).toBe('info');
        expect(result.title).toBe('音频功能受限');
        expect(result.message).toContain('提醒音效无法播放');
        expect(result.solution).toBeTruthy();
    });
    
    test('应该能够处理定时器错误', () => {
        // 创建一个定时器错误
        const timerError = new Error('Timer interval error');
        
        // 处理错误
        const result = errorHandler.getUserFriendlyError(timerError);
        
        // 验证结果
        expect(result.type).toBe('warning');
        expect(result.title).toBe('计时器错误');
        expect(result.message).toContain('提醒计时器出现问题');
        expect(result.solution).toBeTruthy();
    });
    
    test('应该能够处理通用错误', () => {
        // 创建一个通用错误
        const genericError = new Error('Unknown error');
        
        // 处理错误
        const result = errorHandler.getUserFriendlyError(genericError);
        
        // 验证结果
        expect(result.type).toBe('error');
        expect(result.title).toBe('应用错误');
        expect(result.message).toBeTruthy();
        expect(result.solution).toBeTruthy();
    });
    
    test('应该能够记录错误到日志', () => {
        // 创建一个错误
        const error = new Error('Test error');
        
        // 处理错误
        errorHandler.handleError({
            type: 'test',
            error: error,
            message: 'Test error message',
            timestamp: Date.now()
        });
        
        // 获取错误日志
        const errorLog = errorHandler.getErrorLog();
        
        // 验证日志
        expect(errorLog.length).toBe(1);
        expect(errorLog[0].type).toBe('test');
        expect(errorLog[0].message).toBe('Test error message');
    });
    
    test('应该能够限制错误日志大小', () => {
        // 设置较小的最大日志大小进行测试
        errorHandler.maxLogSize = 3;
        
        // 添加多个错误
        for (let i = 0; i < 5; i++) {
            errorHandler.handleError({
                type: 'test',
                message: `Error ${i}`,
                timestamp: Date.now()
            });
        }
        
        // 获取错误日志
        const errorLog = errorHandler.getErrorLog();
        
        // 验证日志大小
        expect(errorLog.length).toBe(3);
        
        // 验证最旧的错误已被移除
        expect(errorLog[0].message).toBe('Error 2');
        expect(errorLog[2].message).toBe('Error 4');
    });
    
    test('应该能够清除错误日志', () => {
        // 添加一些错误
        errorHandler.handleError({
            type: 'test',
            message: 'Test error',
            timestamp: Date.now()
        });
        
        // 清除日志
        errorHandler.clearErrorLog();
        
        // 获取错误日志
        const errorLog = errorHandler.getErrorLog();
        
        // 验证日志已清除
        expect(errorLog.length).toBe(0);
    });
});