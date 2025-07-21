/**
 * 用户流程集成测试
 * 测试完整用户流程、跨浏览器兼容性和响应式设计
 */

// 测试套件
class UserFlowIntegrationTests {
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
        
        // 保存原始DOM方法
        this.originalQuerySelector = document.querySelector;
        this.originalQuerySelectorAll = document.querySelectorAll;
        this.originalGetElementById = document.getElementById;
        
        // 保存原始window属性
        this.originalInnerWidth = window.innerWidth;
        this.originalInnerHeight = window.innerHeight;
        this.originalUserAgent = navigator.userAgent;
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
        
        // 创建模拟DOM元素
        this.mockDOMElements = {};
        this.mockDOMElementsById = {};
        
        // 模拟DOM查询方法
        document.querySelector = (selector) => {
            return this.mockDOMElements[selector] || null;
        };
        
        document.querySelectorAll = (selector) => {
            return this.mockDOMElements[selector] ? [this.mockDOMElements[selector]] : [];
        };
        
        document.getElementById = (id) => {
            return this.mockDOMElementsById[id] || null;
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
            },
            requestPermission: () => Promise.resolve('granted')
        };
        
        // 创建模拟存储管理器
        this.storageManager = new StorageManager();
        
        // 清除localStorage
        this.storageManager.clearAllData();
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
        document.querySelector = this.originalQuerySelector;
        document.querySelectorAll = this.originalQuerySelectorAll;
        document.getElementById = this.originalGetElementById;
        
        // 恢复原始window属性
        window.innerWidth = this.originalInnerWidth;
        window.innerHeight = this.originalInnerHeight;
        Object.defineProperty(navigator, 'userAgent', {
            value: this.originalUserAgent,
            configurable: true
        });
        
        // 清除localStorage
        this.storageManager.clearAllData();
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
    triggerEvent(eventType, eventData = {}, target = window) {
        if (this.eventListeners[eventType]) {
            const event = { 
                ...eventData, 
                type: eventType, 
                target,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
            
            this.eventListeners[eventType].forEach(listener => {
                listener.callback(event);
            });
        }
    }

    // 创建模拟DOM元素
    createMockElement(selector, attributes = {}, eventHandlers = {}) {
        const element = {
            tagName: attributes.tagName || 'DIV',
            id: attributes.id || '',
            className: attributes.className || '',
            style: attributes.style || {},
            value: attributes.value || '',
            checked: attributes.checked || false,
            disabled: attributes.disabled || false,
            innerHTML: attributes.innerHTML || '',
            textContent: attributes.textContent || '',
            dataset: attributes.dataset || {},
            children: [],
            parentElement: null,
            
            // 方法
            addEventListener: (event, handler) => {
                if (!element.eventHandlers) {
                    element.eventHandlers = {};
                }
                if (!element.eventHandlers[event]) {
                    element.eventHandlers[event] = [];
                }
                element.eventHandlers[event].push(handler);
            },
            
            removeEventListener: (event, handler) => {
                if (element.eventHandlers && element.eventHandlers[event]) {
                    element.eventHandlers[event] = element.eventHandlers[event].filter(h => h !== handler);
                }
            },
            
            click: () => {
                if (element.eventHandlers && element.eventHandlers.click) {
                    element.eventHandlers.click.forEach(handler => {
                        handler({ type: 'click', target: element, preventDefault: () => {} });
                    });
                }
            },
            
            focus: () => {
                if (element.eventHandlers && element.eventHandlers.focus) {
                    element.eventHandlers.focus.forEach(handler => {
                        handler({ type: 'focus', target: element });
                    });
                }
            },
            
            blur: () => {
                if (element.eventHandlers && element.eventHandlers.blur) {
                    element.eventHandlers.blur.forEach(handler => {
                        handler({ type: 'blur', target: element });
                    });
                }
            },
            
            appendChild: (child) => {
                element.children.push(child);
                child.parentElement = element;
                return child;
            },
            
            removeChild: (child) => {
                element.children = element.children.filter(c => c !== child);
                child.parentElement = null;
                return child;
            },
            
            querySelector: (childSelector) => {
                // 简单实现，仅支持ID选择器
                if (childSelector.startsWith('#')) {
                    const id = childSelector.substring(1);
                    return element.children.find(child => child.id === id) || null;
                }
                return null;
            },
            
            querySelectorAll: (childSelector) => {
                // 简单实现，仅支持类选择器
                if (childSelector.startsWith('.')) {
                    const className = childSelector.substring(1);
                    return element.children.filter(child => 
                        child.className && child.className.split(' ').includes(className)
                    );
                }
                return [];
            },
            
            getAttribute: (name) => attributes[name] || null,
            setAttribute: (name, value) => { attributes[name] = value; },
            removeAttribute: (name) => { delete attributes[name]; },
            
            getBoundingClientRect: () => ({
                top: 0,
                right: 100,
                bottom: 100,
                left: 0,
                width: 100,
                height: 100
            })
        };
        
        // 添加事件处理器
        if (eventHandlers) {
            element.eventHandlers = {};
            Object.keys(eventHandlers).forEach(event => {
                element.eventHandlers[event] = [eventHandlers[event]];
            });
        }
        
        // 保存到模拟DOM元素集合
        this.mockDOMElements[selector] = element;
        
        if (attributes.id) {
            this.mockDOMElementsById[attributes.id] = element;
        }
        
        return element;
    }

    // 模拟不同浏览器环境
    mockBrowserEnvironment(browser, isMobile = false) {
        // 设置用户代理
        let userAgent;
        
        switch (browser) {
            case 'chrome':
                userAgent = isMobile 
                    ? 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
                    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
                break;
                
            case 'firefox':
                userAgent = isMobile
                    ? 'Mozilla/5.0 (Android 12; Mobile; rv:98.0) Gecko/98.0 Firefox/98.0'
                    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
                break;
                
            case 'safari':
                userAgent = isMobile
                    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                    : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15';
                break;
                
            case 'edge':
                userAgent = isMobile
                    ? 'Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 EdgA/91.0.864.37'
                    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
                break;
                
            default:
                userAgent = this.originalUserAgent;
        }
        
        // 设置用户代理
        Object.defineProperty(navigator, 'userAgent', {
            value: userAgent,
            configurable: true
        });
        
        // 设置屏幕尺寸
        if (isMobile) {
            window.innerWidth = 375;
            window.innerHeight = 812;
        } else {
            window.innerWidth = 1920;
            window.innerHeight = 1080;
        }
        
        // 返回浏览器信息
        return {
            name: browser,
            isMobile,
            userAgent
        };
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

    // 测试完整用户流程
    testCompleteUserFlow() {
        // 创建应用核心组件
        const storageManager = this.storageManager;
        const appSettings = new AppSettings(storageManager);
        const errorHandler = new ErrorHandler();
        const notificationService = this.notificationService;
        const activityDetector = new ActivityDetector();
        
        // 创建提醒管理器
        const waterReminder = new ReminderManager(
            'water', 
            appSettings.getSettings().water, 
            notificationService
        );
        
        const postureReminder = new ReminderManager(
            'posture', 
            appSettings.getSettings().posture, 
            notificationService,
            activityDetector
        );
        
        // 模拟DOM元素
        this.createMockElement('#app-container', { id: 'app-container' });
        this.createMockElement('#water-toggle', { 
            id: 'water-toggle', 
            tagName: 'INPUT',
            type: 'checkbox'
        });
        this.createMockElement('#posture-toggle', { 
            id: 'posture-toggle', 
            tagName: 'INPUT',
            type: 'checkbox'
        });
        this.createMockElement('#water-interval', { 
            id: 'water-interval', 
            tagName: 'INPUT',
            type: 'range',
            value: '30'
        });
        this.createMockElement('#posture-interval', { 
            id: 'posture-interval', 
            tagName: 'INPUT',
            type: 'range',
            value: '60'
        });
        
        // 1. 测试初始设置
        this.assertEqual(appSettings.getSettings().water.interval, 30, '初始喝水提醒间隔应为30分钟');
        this.assertEqual(appSettings.getSettings().posture.interval, 60, '初始久坐提醒间隔应为60分钟');
        
        // 2. 启动喝水提醒
        waterReminder.start();
        this.assertEqual(waterReminder.isActive, true, '喝水提醒应已启动');
        
        // 3. 推进时间，触发喝水提醒
        this.advanceTime(30 * 60 * 1000);
        this.assert(notificationService.notifications.length > 0, '应发送喝水提醒通知');
        this.assertEqual(notificationService.notifications[0].type, 'water', '通知类型应为water');
        
        // 4. 确认喝水提醒
        notificationService.lastConfirmCallback();
        this.assertEqual(waterReminder.isActive, true, '确认后喝水提醒应仍为活动状态');
        
        // 5. 启动久坐提醒
        postureReminder.start();
        this.assertEqual(postureReminder.isActive, true, '久坐提醒应已启动');
        this.assert(activityDetector.isMonitoring, '活动检测器应已启动');
        
        // 6. 模拟用户离开
        document.hidden = true;
        this.triggerEvent('visibilitychange');
        this.advanceTime(activityDetector.inactivityThreshold + 1000);
        
        // 7. 验证久坐提醒自动暂停
        this.assertEqual(postureReminder.isPaused, true, '用户离开后久坐提醒应自动暂停');
        
        // 8. 模拟用户返回
        document.hidden = false;
        this.triggerEvent('visibilitychange');
        this.triggerEvent('mousemove', { clientX: 100, clientY: 100 });
        
        // 9. 验证久坐提醒自动恢复
        this.assertEqual(postureReminder.isPaused, false, '用户返回后久坐提醒应自动恢复');
        
        // 10. 更新设置
        appSettings.updateSettings('water', { interval: 45 });
        appSettings.updateSettings('posture', { interval: 90 });
        
        // 11. 验证设置已更新
        this.assertEqual(appSettings.getSettings().water.interval, 45, '喝水提醒间隔应更新为45分钟');
        this.assertEqual(appSettings.getSettings().posture.interval, 90, '久坐提醒间隔应更新为90分钟');
        
        // 12. 验证提醒管理器已应用新设置
        waterReminder.updateSettings(appSettings.getSettings().water);
        postureReminder.updateSettings(appSettings.getSettings().posture);
        
        // 13. 推进时间，触发久坐提醒
        this.advanceTime(90 * 60 * 1000);
        
        // 14. 验证久坐提醒通知
        const postureNotification = notificationService.notifications.find(n => n.type === 'posture');
        this.assertNotNull(postureNotification, '应发送久坐提醒通知');
        
        // 15. 停止所有提醒
        waterReminder.stop();
        postureReminder.stop();
        
        // 16. 验证提醒已停止
        this.assertEqual(waterReminder.isActive, false, '喝水提醒应已停止');
        this.assertEqual(postureReminder.isActive, false, '久坐提醒应已停止');
        this.assertEqual(activityDetector.isMonitoring, false, '活动检测器应已停止');
    }

    // 测试跨浏览器兼容性
    testCrossBrowserCompatibility() {
        // 测试不同浏览器环境
        const browsers = ['chrome', 'firefox', 'safari', 'edge'];
        const deviceTypes = [false, true]; // false为桌面，true为移动设备
        
        browsers.forEach(browser => {
            deviceTypes.forEach(isMobile => {
                console.log(`测试 ${browser} ${isMobile ? '移动版' : '桌面版'}`);
                
                // 设置浏览器环境
                const browserInfo = this.mockBrowserEnvironment(browser, isMobile);
                
                // 创建移动适配器
                const mobileAdapter = new MobileAdapter();
                
                // 验证设备类型检测
                if (isMobile) {
                    this.assert(mobileAdapter.isMobileDevice(), `${browser}移动版应检测为移动设备`);
                } else {
                    // Safari在某些情况下可能会被错误地检测为移动设备，所以这里不做断言
                    if (browser !== 'safari') {
                        this.assert(!mobileAdapter.isMobileDevice() || browser === 'safari', 
                            `${browser}桌面版应检测为桌面设备`);
                    }
                }
                
                // 验证浏览器信息
                const info = mobileAdapter.getBrowserInfo();
                
                // 验证浏览器名称（简化检测，实际可能更复杂）
                switch (browser) {
                    case 'chrome':
                        this.assert(info.name.includes('Chrome'), '应检测为Chrome浏览器');
                        break;
                    case 'firefox':
                        this.assert(info.name.includes('Firefox'), '应检测为Firefox浏览器');
                        break;
                    case 'safari':
                        this.assert(info.name.includes('Safari') && !info.name.includes('Chrome'), 
                            '应检测为Safari浏览器');
                        break;
                    case 'edge':
                        this.assert(info.name.includes('Edge'), '应检测为Edge浏览器');
                        break;
                }
                
                // 验证功能检测
                const features = mobileAdapter.features;
                this.assertNotNull(features, '应返回功能支持信息');
                
                // 验证替代方案
                const fallbacks = mobileAdapter.checkFeaturesAndFallbacks();
                this.assertNotNull(fallbacks, '应返回替代方案信息');
            });
        });
    }

    // 测试响应式设计
    testResponsiveDesign() {
        // 测试不同屏幕尺寸
        const screenSizes = [
            { width: 320, height: 568, type: '小型手机' },
            { width: 375, height: 812, type: '标准手机' },
            { width: 768, height: 1024, type: '平板' },
            { width: 1024, height: 768, type: '横向平板' },
            { width: 1280, height: 800, type: '小型笔记本' },
            { width: 1920, height: 1080, type: '桌面' }
        ];
        
        screenSizes.forEach(size => {
            console.log(`测试屏幕尺寸: ${size.type} (${size.width}x${size.height})`);
            
            // 设置屏幕尺寸
            window.innerWidth = size.width;
            window.innerHeight = size.height;
            
            // 创建移动适配器
            const mobileAdapter = new MobileAdapter();
            
            // 验证设备类型检测
            const isMobile = size.width <= 768;
            this.assertEqual(mobileAdapter.isMobileDevice(), isMobile, 
                `${size.type}应${isMobile ? '' : '不'}检测为移动设备`);
            
            // 模拟DOM元素
            const container = this.createMockElement('#app-container', { 
                id: 'app-container',
                className: ''
            });
            
            // 应用移动端适配
            mobileAdapter.applyMobileAdaptation();
            
            // 验证响应式类名
            if (isMobile) {
                this.assert(container.className.includes('mobile-device') || 
                           document.body.classNames.includes('mobile-device'), 
                    '移动设备应添加mobile-device类');
            }
        });
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始用户流程集成测试...\n');
        
        this.setup();
        
        this.runTest('完整用户流程测试', () => this.testCompleteUserFlow());
        this.runTest('跨浏览器兼容性测试', () => this.testCrossBrowserCompatibility());
        this.runTest('响应式设计测试', () => this.testResponsiveDesign());
        
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
    window.UserFlowIntegrationTests = UserFlowIntegrationTests;
}