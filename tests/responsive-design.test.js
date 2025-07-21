/**
 * 响应式设计测试
 * 测试应用在不同屏幕尺寸下的响应式布局
 */

// 测试套件
class ResponsiveDesignTests {
    constructor() {
        this.testResults = [];
        
        // 保存原始window属性
        this.originalInnerWidth = window.innerWidth;
        this.originalInnerHeight = window.innerHeight;
        this.originalMatchMedia = window.matchMedia;
        
        // 保存原始DOM方法
        this.originalGetComputedStyle = window.getComputedStyle;
    }

    // 设置测试环境
    setup() {
        // 模拟matchMedia
        window.matchMedia = (query) => {
            return {
                matches: this.evaluateMediaQuery(query),
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => true
            };
        };
        
        // 模拟getComputedStyle
        window.getComputedStyle = (element) => {
            return {
                getPropertyValue: (prop) => {
                    if (element && element.style && element.style[prop]) {
                        return element.style[prop];
                    }
                    return '';
                },
                display: element && element.style ? element.style.display || 'block' : 'block',
                visibility: element && element.style ? element.style.visibility || 'visible' : 'visible',
                fontSize: element && element.style ? element.style.fontSize || '16px' : '16px',
                width: element && element.style ? element.style.width || 'auto' : 'auto',
                height: element && element.style ? element.style.height || 'auto' : 'auto'
            };
        };
        
        // 创建模拟DOM元素
        this.mockElements = {};
    }

    // 清理测试环境
    teardown() {
        // 恢复原始window属性
        window.innerWidth = this.originalInnerWidth;
        window.innerHeight = this.originalInnerHeight;
        window.matchMedia = this.originalMatchMedia;
        window.getComputedStyle = this.originalGetComputedStyle;
        
        // 清除模拟DOM元素
        this.mockElements = {};
    }

    // 评估媒体查询
    evaluateMediaQuery(query) {
        // 简单的媒体查询解析器
        if (query.includes('max-width')) {
            const match = query.match(/max-width:\s*(\d+)px/);
            if (match && match[1]) {
                return window.innerWidth <= parseInt(match[1]);
            }
        }
        
        if (query.includes('min-width')) {
            const match = query.match(/min-width:\s*(\d+)px/);
            if (match && match[1]) {
                return window.innerWidth >= parseInt(match[1]);
            }
        }
        
        return false;
    }

    // 设置屏幕尺寸
    setScreenSize(width, height) {
        window.innerWidth = width;
        window.innerHeight = height;
    }

    // 创建模拟DOM元素
    createMockElement(id, styles = {}) {
        const element = {
            id,
            style: { ...styles },
            classList: {
                add: (className) => {
                    if (!element.className) {
                        element.className = '';
                    }
                    if (!element.className.includes(className)) {
                        element.className += ' ' + className;
                    }
                    element.className = element.className.trim();
                },
                remove: (className) => {
                    if (element.className) {
                        element.className = element.className
                            .split(' ')
                            .filter(c => c !== className)
                            .join(' ');
                    }
                },
                contains: (className) => {
                    return element.className && element.className.split(' ').includes(className);
                }
            },
            className: '',
            children: [],
            appendChild: (child) => {
                element.children.push(child);
                return child;
            },
            getBoundingClientRect: () => ({
                width: parseInt(element.style.width) || 100,
                height: parseInt(element.style.height) || 100,
                top: 0,
                left: 0,
                right: parseInt(element.style.width) || 100,
                bottom: parseInt(element.style.height) || 100
            })
        };
        
        this.mockElements[id] = element;
        return element;
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

    // 测试移动设备检测
    testMobileDeviceDetection() {
        // 创建移动适配器
        const mobileAdapter = new MobileAdapter();
        
        // 测试不同屏幕尺寸
        const screenSizes = [
            { width: 320, height: 568, expected: true, description: '小型手机' },
            { width: 375, height: 812, expected: true, description: '标准手机' },
            { width: 768, height: 1024, expected: true, description: '平板' },
            { width: 1024, height: 768, expected: false, description: '小型笔记本' },
            { width: 1280, height: 800, expected: false, description: '笔记本' },
            { width: 1920, height: 1080, expected: false, description: '桌面' }
        ];
        
        screenSizes.forEach(size => {
            // 设置屏幕尺寸
            this.setScreenSize(size.width, size.height);
            
            // 检测是否为移动设备
            const isMobile = mobileAdapter.isMobileDevice();
            
            this.assertEqual(isMobile, size.expected, 
                `${size.description} (${size.width}x${size.height}) 应${size.expected ? '' : '不'}检测为移动设备`);
        });
    }

    // 测试响应式类应用
    testResponsiveClassApplication() {
        // 创建移动适配器
        const mobileAdapter = new MobileAdapter();
        
        // 创建模拟DOM元素
        document.body = this.createMockElement('body');
        
        // 测试不同屏幕尺寸
        const screenSizes = [
            { width: 375, height: 812, isMobile: true, description: '手机' },
            { width: 1920, height: 1080, isMobile: false, description: '桌面' }
        ];
        
        screenSizes.forEach(size => {
            // 设置屏幕尺寸
            this.setScreenSize(size.width, size.height);
            
            // 重置body类名
            document.body.className = '';
            
            // 应用移动端适配
            mobileAdapter.applyMobileAdaptation();
            
            // 验证类名应用
            if (size.isMobile) {
                this.assert(document.body.classList.contains('mobile-device'), 
                    `${size.description}应用移动端适配后应添加mobile-device类`);
            } else {
                this.assert(!document.body.classList.contains('mobile-device'), 
                    `${size.description}应用移动端适配后不应添加mobile-device类`);
            }
        });
    }

    // 测试iOS设备特殊处理
    testIOSSpecificHandling() {
        // 保存原始navigator.userAgent
        const originalUserAgent = navigator.userAgent;
        
        try {
            // 模拟iOS设备
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                configurable: true
            });
            
            // 设置屏幕尺寸
            this.setScreenSize(375, 812);
            
            // 创建移动适配器
            const mobileAdapter = new MobileAdapter();
            
            // 验证iOS设备检测
            this.assert(mobileAdapter.isIOSDevice(), '应检测为iOS设备');
            this.assert(mobileAdapter.isMobileDevice(), '应检测为移动设备');
            
            // 创建模拟DOM元素
            document.body = this.createMockElement('body');
            
            // 应用移动端适配
            mobileAdapter.applyMobileAdaptation();
            
            // 验证iOS特定类名
            this.assert(document.body.classList.contains('ios-device'), 
                'iOS设备应用移动端适配后应添加ios-device类');
        } finally {
            // 恢复原始navigator.userAgent
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        }
    }

    // 测试Android设备特殊处理
    testAndroidSpecificHandling() {
        // 保存原始navigator.userAgent
        const originalUserAgent = navigator.userAgent;
        
        try {
            // 模拟Android设备
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
                configurable: true
            });
            
            // 设置屏幕尺寸
            this.setScreenSize(375, 812);
            
            // 创建移动适配器
            const mobileAdapter = new MobileAdapter();
            
            // 验证Android设备检测
            this.assert(mobileAdapter.isAndroidDevice(), '应检测为Android设备');
            this.assert(mobileAdapter.isMobileDevice(), '应检测为移动设备');
            
            // 创建模拟DOM元素
            document.body = this.createMockElement('body');
            
            // 应用移动端适配
            mobileAdapter.applyMobileAdaptation();
            
            // 验证Android特定类名
            this.assert(document.body.classList.contains('android-device'), 
                'Android设备应用移动端适配后应添加android-device类');
        } finally {
            // 恢复原始navigator.userAgent
            Object.defineProperty(navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        }
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始响应式设计测试...\n');
        
        this.setup();
        
        this.runTest('移动设备检测测试', () => this.testMobileDeviceDetection());
        this.runTest('响应式类应用测试', () => this.testResponsiveClassApplication());
        this.runTest('iOS设备特殊处理测试', () => this.testIOSSpecificHandling());
        this.runTest('Android设备特殊处理测试', () => this.testAndroidSpecificHandling());
        
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
    window.ResponsiveDesignTests = ResponsiveDesignTests;
}