/**
 * Debug Helper - 帮助诊断应用启动问题
 */
class DebugHelper {
    constructor() {
        this.checks = [];
        this.results = {};
    }

    /**
     * 运行所有诊断检查
     */
    async runDiagnostics() {
        console.log('🔍 Running application diagnostics...');
        
        // 检查必要的类
        this.checkRequiredClasses();
        
        // 检查浏览器功能
        this.checkBrowserFeatures();
        
        // 检查存储功能
        this.checkStorageFeatures();
        
        // 检查通知功能
        await this.checkNotificationFeatures();
        
        // 检查音频功能
        this.checkAudioFeatures();
        
        // 生成诊断报告
        this.generateReport();
        
        return this.results;
    }

    /**
     * 检查必要的类是否存在
     */
    checkRequiredClasses() {
        const requiredClasses = [
            'ErrorHandler',
            'StorageManager', 
            'AppSettings',
            'NotificationService',
            'ActivityDetector',
            'ReminderManager',
            'WaterReminder',
            'PostureReminder',
            'UIController',
            'MobileAdapter'
        ];

        const missingClasses = [];
        const availableClasses = [];

        requiredClasses.forEach(className => {
            if (typeof window[className] !== 'undefined') {
                availableClasses.push(className);
            } else {
                missingClasses.push(className);
            }
        });

        this.results.classes = {
            status: missingClasses.length === 0 ? 'success' : 'error',
            available: availableClasses,
            missing: missingClasses,
            message: missingClasses.length === 0 
                ? 'All required classes are available' 
                : `Missing classes: ${missingClasses.join(', ')}`
        };

        console.log('✅ Class check:', this.results.classes);
    }

    /**
     * 检查浏览器功能
     */
    checkBrowserFeatures() {
        const features = {
            localStorage: typeof Storage !== 'undefined',
            notifications: 'Notification' in window,
            audioContext: !!(window.AudioContext || window.webkitAudioContext),
            visibilityAPI: typeof document.visibilityState !== 'undefined',
            requestAnimationFrame: typeof requestAnimationFrame !== 'undefined',
            promises: typeof Promise !== 'undefined',
            fetch: typeof fetch !== 'undefined'
        };

        const unsupportedFeatures = Object.keys(features).filter(key => !features[key]);

        this.results.browser = {
            status: unsupportedFeatures.length === 0 ? 'success' : 'warning',
            features: features,
            unsupported: unsupportedFeatures,
            message: unsupportedFeatures.length === 0 
                ? 'All browser features are supported' 
                : `Unsupported features: ${unsupportedFeatures.join(', ')}`
        };

        console.log('🌐 Browser check:', this.results.browser);
    }

    /**
     * 检查存储功能
     */
    checkStorageFeatures() {
        let storageWorking = false;
        let storageError = null;

        try {
            const testKey = 'debug_test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            storageWorking = retrieved === 'test';
        } catch (error) {
            storageError = error.message;
        }

        this.results.storage = {
            status: storageWorking ? 'success' : 'error',
            working: storageWorking,
            error: storageError,
            message: storageWorking 
                ? 'Local storage is working correctly' 
                : `Local storage error: ${storageError}`
        };

        console.log('💾 Storage check:', this.results.storage);
    }

    /**
     * 检查通知功能
     */
    async checkNotificationFeatures() {
        let notificationSupported = 'Notification' in window;
        let permission = null;
        let permissionError = null;

        if (notificationSupported) {
            permission = Notification.permission;
            
            if (permission === 'default') {
                try {
                    // 不实际请求权限，只检查API是否可用
                    permission = 'available';
                } catch (error) {
                    permissionError = error.message;
                }
            }
        }

        this.results.notifications = {
            status: notificationSupported ? 'success' : 'warning',
            supported: notificationSupported,
            permission: permission,
            error: permissionError,
            message: notificationSupported 
                ? `Notifications supported, permission: ${permission}` 
                : 'Notifications not supported'
        };

        console.log('🔔 Notification check:', this.results.notifications);
    }

    /**
     * 检查音频功能
     */
    checkAudioFeatures() {
        let audioSupported = false;
        let audioError = null;

        try {
            const audio = new Audio();
            audioSupported = typeof audio.play === 'function';
        } catch (error) {
            audioError = error.message;
        }

        let webAudioSupported = !!(window.AudioContext || window.webkitAudioContext);

        this.results.audio = {
            status: audioSupported ? 'success' : 'warning',
            htmlAudio: audioSupported,
            webAudio: webAudioSupported,
            error: audioError,
            message: audioSupported 
                ? 'Audio features are supported' 
                : `Audio error: ${audioError}`
        };

        console.log('🔊 Audio check:', this.results.audio);
    }

    /**
     * 生成诊断报告
     */
    generateReport() {
        const overallStatus = Object.values(this.results).every(result => result.status === 'success') 
            ? 'success' 
            : Object.values(this.results).some(result => result.status === 'error') 
                ? 'error' 
                : 'warning';

        this.results.overall = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.log('📊 Overall status:', overallStatus);
        console.log('📋 Full diagnostic report:', this.results);

        // 在页面上显示诊断结果
        this.displayReport();
    }

    /**
     * 在页面上显示诊断报告
     */
    displayReport() {
        // 创建诊断面板
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            overflow-y: auto;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        let html = '<h3>🔍 Diagnostic Report</h3>';
        
        Object.keys(this.results).forEach(key => {
            if (key === 'overall') return;
            
            const result = this.results[key];
            const statusIcon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
            
            html += `
                <div style="margin: 10px 0; padding: 8px; background: ${result.status === 'success' ? '#e8f5e8' : result.status === 'error' ? '#ffeaea' : '#fff3cd'}; border-radius: 4px;">
                    <strong>${statusIcon} ${key.toUpperCase()}</strong><br>
                    <small>${result.message}</small>
                </div>
            `;
        });

        html += `
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="document.getElementById('debug-panel').remove()" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;

        panel.innerHTML = html;
        document.body.appendChild(panel);

        // 5分钟后自动移除
        setTimeout(() => {
            if (panel.parentNode) {
                panel.remove();
            }
        }, 300000);
    }

    /**
     * 获取简化的诊断结果
     */
    getSimpleReport() {
        return {
            status: this.results.overall?.status || 'unknown',
            issues: Object.keys(this.results)
                .filter(key => key !== 'overall' && this.results[key].status !== 'success')
                .map(key => ({
                    component: key,
                    status: this.results[key].status,
                    message: this.results[key].message
                }))
        };
    }
}

// 导出调试助手
window.DebugHelper = DebugHelper;

// 添加快捷调试函数
window.runDiagnostics = async function() {
    const debugHelper = new DebugHelper();
    return await debugHelper.runDiagnostics();
};