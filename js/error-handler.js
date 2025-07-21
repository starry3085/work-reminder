/**
 * 全局错误处理器 - 处理应用中的各种错误和异常情况
 */
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 50;
        this.setupGlobalErrorHandling();
    }

    /**
     * 设置全局错误处理
     * @private
     */
    setupGlobalErrorHandling() {
        // 处理未捕获的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                error: event.reason,
                message: event.reason?.message || '未处理的Promise错误',
                timestamp: Date.now()
            });
        });

        // 处理全局JavaScript错误
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'runtime',
                error: event.error,
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: Date.now()
            });
            
            // 防止错误显示在控制台
            event.preventDefault();
        });
    }

    /**
     * 处理错误
     * @param {Object} errorInfo - 错误信息对象
     */
    handleError(errorInfo) {
        console.error('应用错误:', errorInfo);
        
        // 添加到错误日志
        this.logError(errorInfo);
        
        // 根据错误类型执行不同的处理
        switch (errorInfo.type) {
            case 'storage':
                return this.handleStorageError(errorInfo);
            case 'notification':
                return this.handleNotificationError(errorInfo);
            case 'audio':
                return this.handleAudioError(errorInfo);
            case 'timer':
                return this.handleTimerError(errorInfo);
            case 'compatibility':
                return this.handleCompatibilityError(errorInfo);
            case 'promise':
            case 'runtime':
            default:
                return this.handleGenericError(errorInfo);
        }
    }

    /**
     * 记录错误到日志
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    logError(errorInfo) {
        // 限制日志大小
        if (this.errorLog.length >= this.maxLogSize) {
            this.errorLog.shift(); // 移除最旧的错误
        }
        
        this.errorLog.push(errorInfo);
        
        // 尝试保存错误日志到本地存储
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
        } catch (e) {
            // 如果本地存储不可用，忽略错误
            console.warn('无法保存错误日志到本地存储');
        }
    }

    /**
     * 处理存储相关错误
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    handleStorageError(errorInfo) {
        // 实现存储降级策略
        console.warn('存储功能不可用，将使用内存存储');
        
        // 返回用户友好的错误信息
        return {
            title: '存储功能受限',
            message: '本地存储不可用，您的设置将无法在会话结束后保存',
            type: 'warning',
            solution: '请检查浏览器设置，确保允许网站使用本地存储'
        };
    }

    /**
     * 处理通知相关错误
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    handleNotificationError(errorInfo) {
        console.warn('通知功能不可用，将使用页面内通知');
        
        return {
            title: '通知功能受限',
            message: '系统通知功能不可用，将使用页面内通知代替',
            type: 'info',
            solution: '请检查浏览器通知权限设置'
        };
    }

    /**
     * 处理音频相关错误
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    handleAudioError(errorInfo) {
        console.warn('音频功能不可用，将使用静音通知');
        
        return {
            title: '音频功能受限',
            message: '提醒音效无法播放，将使用静音通知',
            type: 'info',
            solution: '请检查浏览器音频权限设置'
        };
    }

    /**
     * 处理定时器相关错误
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    handleTimerError(errorInfo) {
        console.warn('定时器错误，将重新初始化计时器');
        
        return {
            title: '计时器错误',
            message: '提醒计时器出现问题，已自动重置',
            type: 'warning',
            solution: '如果问题持续出现，请刷新页面'
        };
    }

    /**
     * 处理兼容性相关错误
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    handleCompatibilityError(errorInfo) {
        console.warn('浏览器兼容性问题:', errorInfo.message);
        
        return {
            title: '浏览器兼容性问题',
            message: errorInfo.message || '您的浏览器可能不支持某些功能',
            type: 'warning',
            solution: '请尝试使用最新版本的Chrome、Firefox、Safari或Edge浏览器'
        };
    }

    /**
     * 处理通用错误
     * @param {Object} errorInfo - 错误信息
     * @private
     */
    handleGenericError(errorInfo) {
        console.error('未分类错误:', errorInfo);
        
        return {
            title: '应用错误',
            message: '应用遇到了一个问题',
            type: 'error',
            solution: '请刷新页面重试，如果问题持续出现，请清除浏览器缓存'
        };
    }

    /**
     * 获取用户友好的错误信息
     * @param {Error} error - 错误对象
     * @returns {Object} 用户友好的错误信息
     */
    getUserFriendlyError(error) {
        // 根据错误类型返回友好信息
        if (error.message && typeof error.message === 'string') {
            if (error.message.includes('localStorage') || error.message.includes('storage')) {
                return this.handleStorageError({ type: 'storage', error });
            } else if (error.message.includes('notification') || error.message.includes('permission')) {
                return this.handleNotificationError({ type: 'notification', error });
            } else if (error.message.includes('audio') || error.message.includes('play')) {
                return this.handleAudioError({ type: 'audio', error });
            } else if (error.message.includes('timer') || error.message.includes('interval')) {
                return this.handleTimerError({ type: 'timer', error });
            }
        }
        
        // 默认错误信息
        return this.handleGenericError({ type: 'generic', error });
    }

    /**
     * 获取错误日志
     * @returns {Array} 错误日志数组
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * 清除错误日志
     */
    clearErrorLog() {
        this.errorLog = [];
        try {
            localStorage.removeItem('errorLog');
        } catch (e) {
            // 忽略错误
        }
    }
}

// 导出给其他脚本使用
window.ErrorHandler = ErrorHandler;