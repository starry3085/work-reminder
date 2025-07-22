/**
 * 完整功能集成测试
 * 测试所有功能模块的协同工作、用户体验流程的完整性和跨浏览器兼容性
 */

class CompleteIntegrationTests {
    constructor() {
        this.testResults = [];
        
        // 保存原始函数和属性
        this.originalFunctions = {
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            setInterval: window.setInterval,
            clearInterval: window.clearInterval,
            dateNow: Date.now,
            addEventListener: window.addEventListener,
            removeEventListener: window.removeEventListener,
            querySelector: document.querySelector,
            querySelectorAll: document.querySelectorAll,
            getElementById: document.getElementById,
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            userAgent: navigator.userAgent,
            localStorage: window.localStorage
        };
        
        // 测试环境配置
        this.mockTime = Date.now();
        this.timeoutIds = 0;
        this.timeouts = [];
        this.intervalIds = 0;
        this.intervals = [];
        this.eventListeners = {};
        this.mockDOMElements = {};
        this.mockDOMElementsById = {};
        this.mockLocalStorage = {};
        
        // 测试组件
        this.components = {};
    }

    // 设置测试环境
    setup() {
        // 模拟时间函数
        Date.now = () => this.mockTime;
        
        // 模拟定时器
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
        
        // 模拟localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key) => this.mockLocalStorage[key] || null,
                setItem: (key, value) => { this.mockLocalStorage[key] = value; },
                removeItem: (key) => { delete this.mockLocalStorage[key]; },
                clear: () => { this.mockLocalStorage = {}; },
                key: (index) => Object.keys(this.mockLocalStorage)[index],
                get length() { return Object.keys(this.mockLocalStorage).length; }
            },
            writable: true
        });
        
        // 创建基本DOM结构
        this.setupMockDOM();
        
        // 创建核心组件
        this.setupCoreComponents();
    }

    // 清理测试环境
    teardown() {
        // 恢复原始函数和属性
        window.setTimeout = this.originalFunctions.setTimeout;
        window.clearTimeout = this.originalFunctions.clearTimeout;
        window.setInterval = this.originalFunctions.setInterval;
        window.clearInterval = this.originalFunctions.clearInterval;
        Date.now = this.originalFunctions.dateNow;
        window.addEventListener = this.originalFunctions.addEventListener;
        window.removeEventListener = this.originalFunctions.removeEventListener;
        document.querySelector = this.originalFunctions.querySelector;
        document.querySelectorAll = this.originalFunctions.querySelectorAll;
        document.getElementById = this.originalFunctions.getElementById;
        window.innerWidth = this.originalFunctions.innerWidth;
        window.innerHeight = this.originalFunctions.innerHeight;
        
        Object.defineProperty(navigator, 'userAgent', {
            value: this.originalFunctions.userAgent,
            configurable: true
        });
        
        Object.defineProperty(window, 'localStorage', {
            value: this.originalFunctions.localStorage,
            writable: true
        });
        
        // 清理组件
        this.components = {};
    }

    // 设置模拟DOM
    setupMockDOM() {
        // 创建主容器
        this.createMockElement('#app-container', { id: 'app-container' });
        
        // 创建水提醒相关元素
        this.createMockElement('#water-toggle', { 
            id: 'water-toggle', 
            tagName: 'INPUT',
            type: 'checkbox',
            checked: true
        });
        
        this.createMockElement('#water-interval', { 
            id: 'water-interval', 
            tagName: 'INPUT',
            type: 'range',
            value: '30',
            min: '10',
            max: '120'
        });
        
        this.createMockElement('#water-interval-display', { 
            id: 'water-interval-display', 
            textContent: '30分钟'
        });
        
        this.createMockElement('#water-status', { 
            id: 'water-status', 
            textContent: '等待开始'
        });
        
        // 创建久坐提醒相关元素
        this.createMockElement('#posture-toggle', { 
            id: 'posture-toggle', 
            tagName: 'INPUT',
            type: 'checkbox',
            checked: true
        });
        
        this.createMockElement('#posture-interval', { 
            id: 'posture-interval', 
            tagName: 'INPUT',
            type: 'range',
            value: '60',
            min: '20',
            max: '180'
        });
        
        this.createMockElement('#posture-interval-display', { 
            id: 'posture-interval-display', 
            textContent: '60分钟'
        });
        
        this.createMockElement('#posture-status', { 
            id: 'posture-status', 
            textContent: '等待开始'
        });
        
        // 创建设置相关元素
        this.createMockElement('#settings-button', { 
            id: 'settings-button', 
            tagName: 'BUTTON',
            textContent: '设置'
        });
        
        this.createMockElement('#settings-panel', { 
            id: 'settings-panel', 
            style: { display: 'none' }
        });
        
        this.createMockElement('#notification-sound-toggle', { 
            id: 'notification-sound-toggle', 
            tagName: 'INPUT',
            type: 'checkbox',
            checked: true
        });
        
        this.createMockElement('#reset-settings', { 
            id: 'reset-settings', 
            tagName: 'BUTTON',
            textContent: '重置设置'
        });
        
        // 创建通知区域
        this.createMockElement('#notification-area', { 
            id: 'notification-area'
        });
    }

    // 设置核心组件
    setupCoreComponents() {
        // 创建错误处理器
        this.components.errorHandler = new ErrorHandler();
        
        // 创建存储管理器
        this.components.storageManager = new StorageManager();
        
        // 创建应用设置
        this.components.appSettings = new AppSettings(this.components.storageManager);
        
        // 创建通知服务
        this.components.notificationService = {
            notifications: [],
            showNotification: (type, title, message, onConfirm, onSnooze) => {
                this.components.notificationService.notifications.push({
                    type, title, message, timestamp: this.mockTime
                });
                this.components.notificationService.lastConfirmCallback = onConfirm;
                this.components.notificationService.lastSnoozeCallback = onSnooze;
                return true;
            },
            clearNotifications: () => {
                this.components.notificationService.notifications = [];
            },
            requestPermission: () => Promise.resolve('granted'),
            isSupported: () => true,
            showInPageAlert: (type, message, duration) => {
                this.components.notificationService.notifications.push({
                    type, message, inPage: true, timestamp: this.mockTime
                });
                return true;
            }
        };
        
        // 创建活动检测器
        this.components.activityDetector = new ActivityDetector();
        
        // 创建提醒管理器
        this.components.waterReminder = new ReminderManager(
            'water', 
            this.components.appSettings.getSettings().water, 
            this.components.notificationService
        );
        
        this.components.postureReminder = new ReminderManager(
            'posture', 
            this.components.appSettings.getSettings().posture, 
            this.components.notificationService,
            this.components.activityDetector
        );
        
        // 创建移动适配器
        this.components.mobileAdapter = new MobileAdapter();
        
        // 创建UI控制器
        this.components.uiController = {
            updateReminderStatus: (type, status, timeRemaining) => {
                const statusElement = document.getElementById(`${type}-status`);
                if (statusElement) {
                    statusElement.textContent = status;
                }
            },
            updateSettings: (settings) => {
                const waterIntervalElement = document.getElementById('water-interval');
                const postureIntervalElement = document.getElementById('posture-interval');
                
                if (waterIntervalElement && settings.water) {
                    waterIntervalElement.value = settings.water.interval;
                }
                
                if (postureIntervalElement && settings.posture) {
                    postureIntervalElement.value = settings.posture.interval;
                }
            },
            showNotification: (type, message) => {
                this.components.notificationService.showInPageAlert(type, message);
            }
        };
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
                userAgent = this.originalFunctions.userAgent;
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

    assertNotEqual(actual, expected, message) {
        if (actual === expected) {
            throw new Error(message || `不应该等于 ${expected}`);
        }
    }

    assertNotNull(value, message) {
        if (value === null || value === undefined) {
            throw new Error(message || '值不应为null或undefined');
        }
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始完整功能集成测试...\n');
        
        this.setup();
        
        // 测试应用初始化
        this.runTest('应用初始化测试', () => {
            // 验证组件创建
            this.assertNotNull(this.components.storageManager, '存储管理器应已创建');
            this.assertNotNull(this.components.appSettings, '应用设置应已创建');
            this.assertNotNull(this.components.notificationService, '通知服务应已创建');
            this.assertNotNull(this.components.activityDetector, '活动检测器应已创建');
            this.assertNotNull(this.components.waterReminder, '喝水提醒应已创建');
            this.assertNotNull(this.components.postureReminder, '久坐提醒应已创建');
            
            // 验证默认设置
            const settings = this.components.appSettings.getSettings();
            this.assertEqual(settings.water.interval, 30, '默认喝水提醒间隔应为30分钟');
            this.assertEqual(settings.posture.interval, 60, '默认久坐提醒间隔应为60分钟');
        });
        
        // 测试提醒功能
        this.runTest('提醒功能测试', () => {
            // 启动提醒
            this.components.waterReminder.start();
            this.components.postureReminder.start();
            
            // 验证提醒已启动
            this.assertEqual(this.components.waterReminder.isActive, true, '喝水提醒应已启动');
            this.assertEqual(this.components.postureReminder.isActive, true, '久坐提醒应已启动');
            
            // 推进时间，触发喝水提醒
            this.advanceTime(30 * 60 * 1000);
            
            // 验证喝水提醒通知
            const waterNotification = this.components.notificationService.notifications.find(n => n.type === 'water');
            this.assertNotNull(waterNotification, '应发送喝水提醒通知');
        });
        
        // 测试设置更新
        this.runTest('设置更新测试', () => {
            // 更新设置
            this.components.appSettings.updateSettings('water', { interval: 45 });
            this.components.appSettings.updateSettings('posture', { interval: 90 });
            
            // 验证设置已更新
            const updatedSettings = this.components.appSettings.getSettings();
            this.assertEqual(updatedSettings.water.interval, 45, '喝水提醒间隔应更新为45分钟');
            this.assertEqual(updatedSettings.posture.interval, 90, '久坐提醒间隔应更新为90分钟');
        });
        
        // 测试用户活动检测
        this.runTest('用户活动检测测试', () => {
            // 启动活动检测器
            this.components.activityDetector.startMonitoring();
            
            // 验证活动检测器已启动
            this.assert(this.components.activityDetector.isMonitoring, '活动检测器应已启动');
            
            // 记录初始活动时间
            const initialActivityTime = this.components.activityDetector.lastActivityTime;
            
            // 推进时间
            this.advanceTime(1000);
            
            // 模拟用户活动
            this.triggerEvent('mousemove', { clientX: 100, clientY: 100 });
            
            // 验证活动时间已更新
            this.assertNotEqual(this.components.activityDetector.lastActivityTime, initialActivityTime, '最后活动时间应更新');
        });
        
        // 测试活动检测与提醒集成
        this.runTest('活动检测与提醒集成测试', () => {
            // 启动活动检测器
            this.components.activityDetector.startMonitoring();
            
            // 启动久坐提醒
            this.components.postureReminder.start();
            
            // 验证提醒已启动
            this.assertEqual(this.components.postureReminder.isActive, true, '久坐提醒应已启动');
            this.assertEqual(this.components.postureReminder.isPaused, false, '久坐提醒不应为暂停状态');
            
            // 模拟用户离开
            document.hidden = true;
            this.triggerEvent('visibilitychange');
            
            // 推进时间超过非活动阈值
            this.advanceTime(this.components.activityDetector.inactivityThreshold + 1000);
            
            // 验证久坐提醒自动暂停
            this.assertEqual(this.components.postureReminder.isPaused, true, '用户离开后久坐提醒应自动暂停');
        });
        
        // 测试数据持久化
        this.runTest('数据持久化测试', () => {
            // 更新设置
            this.components.appSettings.updateSettings('water', { interval: 45 });
            this.components.appSettings.updateSettings('posture', { interval: 90 });
            
            // 验证设置已保存到localStorage
            const storedSettings = JSON.parse(window.localStorage.getItem('app_settings'));
            this.assertNotNull(storedSettings, '设置应保存到localStorage');
            this.assertEqual(storedSettings.water.interval, 45, 'localStorage中的喝水提醒间隔应为45分钟');
        });
        
        // 测试跨浏览器兼容性
        this.runTest('跨浏览器兼容性测试', () => {
            // 测试不同浏览器环境
            const browsers = ['chrome', 'firefox', 'safari', 'edge'];
            
            browsers.forEach(browser => {
                // 设置浏览器环境
                this.mockBrowserEnvironment(browser, false);
                
                // 创建存储管理器
                const storageManager = new StorageManager();
                
                // 验证基本功能可用
                this.assert(storageManager.isAvailable(), `${browser}浏览器应支持localStorage`);
            });
        });
        
        // 测试完整用户流程
        this.runTest('完整用户流程测试', () => {
            // 1. 初始化应用
            this.assertNotNull(this.components.storageManager, '存储管理器应已创建');
            
            // 2. 启动提醒
            this.components.waterReminder.start();
            this.components.postureReminder.start();
            
            // 3. 验证提醒状态
            this.assertEqual(this.components.waterReminder.isActive, true, '喝水提醒应已启动');
            this.assertEqual(this.components.postureReminder.isActive, true, '久坐提醒应已启动');
            
            // 4. 模拟用户活动
            this.triggerEvent('mousemove', { clientX: 100, clientY: 100 });
            
            // 5. 推进时间，触发喝水提醒
            this.advanceTime(30 * 60 * 1000);
            
            // 6. 验证喝水提醒通知
            const waterNotification = this.components.notificationService.notifications.find(n => n.type === 'water');
            this.assertNotNull(waterNotification, '应发送喝水提醒通知');
        });
        
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
    window.CompleteIntegrationTests = CompleteIntegrationTests;
}