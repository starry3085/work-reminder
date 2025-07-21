/**
 * MobileAdapter 单元测试
 */

// 模拟依赖
class MockErrorHandler {
    constructor() {
        this.errors = [];
    }

    handleError(error) {
        this.errors.push(error);
        return true;
    }

    getErrors() {
        return this.errors;
    }

    clearErrors() {
        this.errors = [];
    }
}

// 测试套件
class MobileAdapterTests {
    constructor() {
        this.testResults = [];
        
        // 保存原始对象
        this.originalNavigator = window.navigator;
        this.originalLocalStorage = window.localStorage;
        this.originalDocument = window.document;
        this.originalWindow = { ...window };
    }

    // 设置测试环境
    setup() {
        // 创建模拟错误处理器
        this.errorHandler = new MockErrorHandler();
        
        // 创建模拟localStorage
        this.mockLocalStorage = {
            data: {},
            setItem: (key, value) => { this.mockLocalStorage.data[key] = value; },
            getItem: (key) => this.mockLocalStorage.data[key] || null,
            removeItem: (key) => { delete this.mockLocalStorage.data[key]; },
            clear: () => { this.mockLocalStorage.data = {}; }
        };
        
        // 创建模拟navigator
        this.mockNavigator = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            maxTouchPoints: 0
        };
        
        // 创建模拟document
        this.mockDocument = {
            hidden: true,
            body: {
                classList: {
                    add: (className) => {
                        if (!this.mockDocument.body.classNames) {
                            this.mockDocument.body.classNames = [];
                        }
                        this.mockDocument.body.classNames.push(className);
                    },
                    contains: (className) => {
                        return this.mockDocument.body.classNames && 
                               this.mockDocument.body.classNames.includes(className);
                    }
                },
                classNames: []
            },
            addEventListener: (event, callback) => {
                if (!this.mockDocument.eventListeners) {
                    this.mockDocument.eventListeners = {};
                }
                if (!this.mockDocument.eventListeners[event]) {
                    this.mockDocument.eventListeners[event] = [];
                }
                this.mockDocument.eventListeners[event].push(callback);
            },
            removeEventListener: (event, callback) => {
                if (this.mockDocument.eventListeners && this.mockDocument.eventListeners[event]) {
                    this.mockDocument.eventListeners[event] = 
                        this.mockDocument.eventListeners[event].filter(cb => cb !== callback);
                }
            },
            createElement: (tagName) => {
                return {
                    tagName,
                    className: '',
                    innerHTML: '',
                    style: {},
                    appendChild: () => {}
                };
            }
        };
        
        // 模拟window对象
        this.mockWindow = {
            innerWidth: 1024,
            innerHeight: 768,
            AudioContext: function() {
                return {
                    createBuffer: () => ({}),
                    createBufferSource: () => ({
                        buffer: null,
                        connect: () => {},
                        start: () => {},
                        stop: () => {}
                    }),
                    destination: {}
                };
            },
            webkitAudioContext: null,
            Notification: {
                permission: 'granted',
                requestPermission: () => Promise.resolve('granted')
            },
            Audio: function() {
                return {
                    play: () => Promise.resolve(),
                    pause: () => {}
                };
            },
            MSStream: undefined
        };
        
        // 应用模拟对象
        window.navigator = this.mockNavigator;
        window.localStorage = this.mockLocalStorage;
        window.document = this.mockDocument;
        
        // 应用模拟window属性
        Object.keys(this.mockWindow).forEach(key => {
            if (window[key] !== undefined) {
                this.originalWindow[key] = window[key];
            }
            window[key] = this.mockWindow[key];
        });
    }

    // 清理测试环境
    teardown() {
        // 恢复原始对象
        window.navigator = this.originalNavigator;
        window.localStorage = this.originalLocalStorage;
        window.document = this.originalDocument;
        
        // 恢复原始window属性
        Object.keys(this.mockWindow).forEach(key => {
            if (this.originalWindow[key] !== undefined) {
                window[key] = this.originalWindow[key];
            } else {
                delete window[key];
            }
        });
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

    // 测试创建移动端适配器
    testCreateMobileAdapter() {
        const adapter = new MobileAdapter(this.errorHandler);
        
        this.assertNotNull(adapter, '应成功创建移动端适配器');
        this.assertNotNull(adapter.features, '应包含功能支持信息');
        this.assert(typeof adapter.features.localStorage === 'boolean', 'localStorage支持应为布尔值');
        this.assert(typeof adapter.features.notifications === 'boolean', '通知支持应为布尔值');
        this.assert(typeof adapter.features.audio === 'boolean', '音频支持应为布尔值');
    }

    // 测试本地存储检测
    testLocalStorageDetection() {
        // 正常情况
        const adapter1 = new MobileAdapter(this.errorHandler);
        this.assert(adapter1.features.localStorage === true, '本地存储应可用');
        
        // 模拟localStorage不可用
        window.localStorage.setItem = () => { throw new Error('Storage disabled'); };
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        this.assert(adapter2.features.localStorage === false, '本地存储应不可用');
    }

    // 测试设备类型检测
    testDeviceTypeDetection() {
        // 桌面设备
        const adapter1 = new MobileAdapter(this.errorHandler);
        this.assert(adapter1.isMobileDevice() === false, '应检测为桌面设备');
        
        // 模拟移动设备 - 通过用户代理
        window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        this.assert(adapter2.isMobileDevice() === true, '应检测为移动设备(通过用户代理)');
        
        // 恢复用户代理，模拟小屏幕
        window.navigator.userAgent = this.mockNavigator.userAgent;
        window.innerWidth = 375;
        
        const adapter3 = new MobileAdapter(this.errorHandler);
        this.assert(adapter3.isMobileDevice() === true, '应检测为移动设备(通过屏幕宽度)');
    }

    // 测试iOS设备检测
    testIOSDeviceDetection() {
        // 非iOS设备
        const adapter1 = new MobileAdapter(this.errorHandler);
        this.assert(adapter1.isIOSDevice() === false, '应检测为非iOS设备');
        
        // 模拟iOS设备
        window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        this.assert(adapter2.isIOSDevice() === true, '应检测为iOS设备');
    }

    // 测试Android设备检测
    testAndroidDeviceDetection() {
        // 非Android设备
        const adapter1 = new MobileAdapter(this.errorHandler);
        this.assert(adapter1.isAndroidDevice() === false, '应检测为非Android设备');
        
        // 模拟Android设备
        window.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        this.assert(adapter2.isAndroidDevice() === true, '应检测为Android设备');
    }

    // 测试浏览器信息获取
    testGetBrowserInfo() {
        // 模拟Chrome浏览器
        window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        
        const adapter1 = new MobileAdapter(this.errorHandler);
        const info1 = adapter1.getBrowserInfo();
        
        this.assertEqual(info1.name, 'Chrome', '应检测为Chrome浏览器');
        this.assertEqual(info1.version, '91.0.4472.124', '版本应正确');
        this.assert(info1.isMobile === false, '应检测为非移动设备');
        
        // 模拟Firefox浏览器
        window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        const info2 = adapter2.getBrowserInfo();
        
        this.assertEqual(info2.name, 'Firefox', '应检测为Firefox浏览器');
        this.assertEqual(info2.version, '89.0', '版本应正确');
    }

    // 测试移动端适配应用
    testApplyMobileAdaptation() {
        // 桌面设备
        window.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        window.innerWidth = 1024;
        
        const adapter1 = new MobileAdapter(this.errorHandler);
        adapter1.applyMobileAdaptation();
        
        this.assert(!window.document.body.classList.contains('mobile-device'), '桌面设备不应添加mobile-device类');
        
        // 模拟iOS设备
        window.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
        window.innerWidth = 375;
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        adapter2.applyMobileAdaptation();
        
        this.assert(window.document.body.classNames.includes('mobile-device'), '移动设备应添加mobile-device类');
        this.assert(window.document.body.classNames.includes('ios-device'), 'iOS设备应添加ios-device类');
    }

    // 测试功能支持检查和替代方案
    testCheckFeaturesAndFallbacks() {
        // 所有功能可用
        const adapter1 = new MobileAdapter(this.errorHandler);
        const result1 = adapter1.checkFeaturesAndFallbacks();
        
        this.assertNotNull(result1, '应返回结果对象');
        this.assertNotNull(result1.supported, '应包含支持信息');
        this.assertNotNull(result1.fallbacks, '应包含替代方案信息');
        
        // 模拟localStorage不可用
        window.localStorage.setItem = () => { throw new Error('Storage disabled'); };
        window.Notification = undefined;
        window.Audio = undefined;
        
        const adapter2 = new MobileAdapter(this.errorHandler);
        const result2 = adapter2.checkFeaturesAndFallbacks();
        
        this.assert(result2.supported.localStorage === false, 'localStorage应不可用');
        this.assert(result2.supported.notifications === false, '通知应不可用');
        this.assert(result2.supported.audio === false, '音频应不可用');
        
        this.assertNotNull(result2.fallbacks.localStorage, '应提供localStorage替代方案');
        this.assertNotNull(result2.fallbacks.notifications, '应提供通知替代方案');
        this.assertNotNull(result2.fallbacks.audio, '应提供音频替代方案');
        
        // 验证错误处理
        this.assert(this.errorHandler.errors.length > 0, '应报告兼容性错误');
    }

    // 测试兼容性提示显示
    testShowCompatibilityNotice() {
        // 模拟功能不可用
        window.localStorage.setItem = () => { throw new Error('Storage disabled'); };
        window.Notification = undefined;
        
        const adapter = new MobileAdapter(this.errorHandler);
        
        // 创建容器元素
        const container = window.document.createElement('div');
        
        // 显示兼容性提示
        adapter.showCompatibilityNotice(container);
        
        // 由于模拟DOM的限制，我们只能验证方法不抛出错误
        this.assert(true, '兼容性提示应显示而不抛出错误');
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始MobileAdapter单元测试...\n');
        
        this.setup();
        
        this.runTest('创建移动端适配器测试', () => this.testCreateMobileAdapter());
        this.runTest('本地存储检测测试', () => this.testLocalStorageDetection());
        this.runTest('设备类型检测测试', () => this.testDeviceTypeDetection());
        this.runTest('iOS设备检测测试', () => this.testIOSDeviceDetection());
        this.runTest('Android设备检测测试', () => this.testAndroidDeviceDetection());
        this.runTest('浏览器信息获取测试', () => this.testGetBrowserInfo());
        this.runTest('移动端适配应用测试', () => this.testApplyMobileAdaptation());
        this.runTest('功能支持检查和替代方案测试', () => this.testCheckFeaturesAndFallbacks());
        this.runTest('兼容性提示显示测试', () => this.testShowCompatibilityNotice());
        
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
    window.MobileAdapterTests = MobileAdapterTests;
}