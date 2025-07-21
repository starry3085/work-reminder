/**
 * 浏览器兼容性测试
 * 测试应用在不同浏览器环境下的功能兼容性
 */

// 测试套件
class BrowserCompatibilityTests {
    constructor() {
        this.testResults = [];
        
        // 保存原始navigator和window属性
        this.originalUserAgent = navigator.userAgent;
        this.originalAppVersion = navigator.appVersion;
        this.originalPlatform = navigator.platform;
        this.originalVendor = navigator.vendor;
        this.originalInnerWidth = window.innerWidth;
        this.originalInnerHeight = window.innerHeight;
    }

    // 设置测试环境
    setup() {
        // 创建错误处理器
        this.errorHandler = new ErrorHandler();
    }

    // 清理测试环境
    teardown() {
        // 恢复原始navigator属性
        this.mockNavigator('default');
        
        // 恢复原始window尺寸
        window.innerWidth = this.originalInnerWidth;
        window.innerHeight = this.originalInnerHeight;
    }

    // 模拟不同浏览器环境
    mockNavigator(browser, version, isMobile = false) {
        let userAgent, appVersion, platform, vendor;
        
        switch (browser) {
            case 'chrome':
                if (isMobile) {
                    userAgent = `Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.4472.120 Mobile Safari/537.36`;
                    appVersion = `5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.4472.120 Mobile Safari/537.36`;
                    platform = 'Linux armv8l';
                } else {
                    userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.4472.124 Safari/537.36`;
                    appVersion = `5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.4472.124 Safari/537.36`;
                    platform = 'Win32';
                }
                vendor = 'Google Inc.';
                break;
                
            case 'firefox':
                if (isMobile) {
                    userAgent = `Mozilla/5.0 (Android 12; Mobile; rv:${version}.0) Gecko/68.0 Firefox/${version}.0`;
                    appVersion = `5.0 (Android 12; Mobile)`;
                    platform = 'Linux armv8l';
                } else {
                    userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`;
                    appVersion = `5.0 (Windows)`;
                    platform = 'Win32';
                }
                vendor = '';
                break;
                
            case 'safari':
                if (isMobile) {
                    userAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Mobile/15E148 Safari/604.1`;
                    appVersion = `5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Mobile/15E148 Safari/604.1`;
                    platform = 'iPhone';
                } else {
                    userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`;
                    appVersion = `5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.15`;
                    platform = 'MacIntel';
                }
                vendor = 'Apple Computer, Inc.';
                break;
                
            case 'edge':
                if (isMobile) {
                    userAgent = `Mozilla/5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 EdgA/${version}.0.864.37`;
                    appVersion = `5.0 (Linux; Android 10; HD1913) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36 EdgA/${version}.0.864.37`;
                    platform = 'Linux armv8l';
                } else {
                    userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/${version}.0.864.59`;
                    appVersion = `5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/${version}.0.864.59`;
                    platform = 'Win32';
                }
                vendor = 'Google Inc.';
                break;
                
            case 'ie':
                userAgent = `Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:${version}.0) like Gecko`;
                appVersion = `5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:${version}.0) like Gecko`;
                platform = 'Win32';
                vendor = '';
                break;
                
            case 'default':
            default:
                userAgent = this.originalUserAgent;
                appVersion = this.originalAppVersion;
                platform = this.originalPlatform;
                vendor = this.originalVendor;
        }
        
        // 设置navigator属性
        Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
        Object.defineProperty(navigator, 'appVersion', { value: appVersion, configurable: true });
        Object.defineProperty(navigator, 'platform', { value: platform, configurable: true });
        Object.defineProperty(navigator, 'vendor', { value: vendor, configurable: true });
        
        // 设置屏幕尺寸
        if (isMobile) {
            window.innerWidth = 375;
            window.innerHeight = 812;
        } else {
            window.innerWidth = 1920;
            window.innerHeight = 1080;
        }
        
        return { userAgent, appVersion, platform, vendor };
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

    // 测试浏览器检测功能
    testBrowserDetection() {
        // 测试不同浏览器
        const browsers = [
            { name: 'chrome', version: '91', displayName: 'Chrome' },
            { name: 'firefox', version: '89', displayName: 'Firefox' },
            { name: 'safari', version: '15', displayName: 'Safari' },
            { name: 'edge', version: '91', displayName: 'Edge' }
        ];
        
        browsers.forEach(browser => {
            // 桌面版
            this.mockNavigator(browser.name, browser.version, false);
            const mobileAdapter = new MobileAdapter(this.errorHandler);
            const info = mobileAdapter.getBrowserInfo();
            
            this.assert(info.name.includes(browser.displayName), 
                `应检测为${browser.displayName}浏览器，实际为${info.name}`);
            this.assert(!info.isMobile, `${browser.displayName}桌面版应检测为非移动设备`);
            
            // 移动版
            this.mockNavigator(browser.name, browser.version, true);
            const mobileAdapterMobile = new MobileAdapter(this.errorHandler);
            const infoMobile = mobileAdapterMobile.getBrowserInfo();
            
            this.assert(infoMobile.isMobile, `${browser.displayName}移动版应检测为移动设备`);
        });
    }

    // 测试功能检测和降级
    testFeatureDetectionAndFallbacks() {
        // 测试不同浏览器
        const browsers = [
            { name: 'chrome', version: '91', displayName: 'Chrome' },
            { name: 'firefox', version: '89', displayName: 'Firefox' },
            { name: 'safari', version: '15', displayName: 'Safari' },
            { name: 'edge', version: '91', displayName: 'Edge' },
            { name: 'ie', version: '11', displayName: 'Internet Explorer' }
        ];
        
        browsers.forEach(browser => {
            this.mockNavigator(browser.name, browser.version);
            const mobileAdapter = new MobileAdapter(this.errorHandler);
            
            // 检测功能支持
            const features = mobileAdapter.features;
            this.assertNotNull(features, `${browser.displayName}应返回功能支持信息`);
            
            // 检测替代方案
            const fallbacks = mobileAdapter.checkFeaturesAndFallbacks();
            this.assertNotNull(fallbacks, `${browser.displayName}应返回替代方案信息`);
            
            // 特殊情况：IE不支持某些现代功能
            if (browser.name === 'ie') {
                // IE不支持Notification API
                this.assert(features.notifications === false, 'IE应不支持通知API');
                this.assertNotNull(fallbacks.fallbacks.notifications, 'IE应提供通知替代方案');
            }
        });
    }

    // 测试移动设备适配
    testMobileAdaptation() {
        // 测试不同设备类型
        const devices = [
            { browser: 'chrome', version: '91', isMobile: false, displayName: 'Chrome桌面版' },
            { browser: 'chrome', version: '91', isMobile: true, displayName: 'Chrome移动版' },
            { browser: 'safari', version: '15', isMobile: false, displayName: 'Safari桌面版' },
            { browser: 'safari', version: '15', isMobile: true, displayName: 'Safari移动版' }
        ];
        
        devices.forEach(device => {
            this.mockNavigator(device.browser, device.version, device.isMobile);
            const mobileAdapter = new MobileAdapter(this.errorHandler);
            
            // 检测设备类型
            const isMobileDevice = mobileAdapter.isMobileDevice();
            this.assertEqual(isMobileDevice, device.isMobile, 
                `${device.displayName}应${device.isMobile ? '' : '不'}检测为移动设备`);
            
            // 检测iOS设备
            const isIOS = mobileAdapter.isIOSDevice();
            const shouldBeIOS = device.browser === 'safari' && device.isMobile;
            this.assertEqual(isIOS, shouldBeIOS, 
                `${device.displayName}应${shouldBeIOS ? '' : '不'}检测为iOS设备`);
            
            // 检测Android设备
            const isAndroid = mobileAdapter.isAndroidDevice();
            const shouldBeAndroid = device.browser === 'chrome' && device.isMobile;
            this.assertEqual(isAndroid, shouldBeAndroid, 
                `${device.displayName}应${shouldBeAndroid ? '' : '不'}检测为Android设备`);
        });
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始浏览器兼容性测试...\n');
        
        this.setup();
        
        this.runTest('浏览器检测测试', () => this.testBrowserDetection());
        this.runTest('功能检测和降级测试', () => this.testFeatureDetectionAndFallbacks());
        this.runTest('移动设备适配测试', () => this.testMobileAdaptation());
        
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
    window.BrowserCompatibilityTests = BrowserCompatibilityTests;
}