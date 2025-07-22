/**
 * 部署验证脚本
 * 用于验证GitHub Pages部署后的功能完整性
 */
class DeploymentVerification {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * 添加测试用例
     * @param {string} name - 测试名称
     * @param {Function} testFn - 测试函数，应返回布尔值或Promise<boolean>
     */
    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    /**
     * 运行所有测试
     * @returns {Promise<Object>} 测试结果
     */
    async runTests() {
        console.log('开始部署验证测试...');
        this.results.total = this.tests.length;
        
        for (const test of this.tests) {
            try {
                console.log(`运行测试: ${test.name}`);
                const result = await test.testFn();
                
                if (result === true) {
                    console.log(`✅ 测试通过: ${test.name}`);
                    this.results.passed++;
                } else {
                    console.error(`❌ 测试失败: ${test.name}`);
                    this.results.failed++;
                }
            } catch (error) {
                console.error(`❌ 测试出错: ${test.name}`, error);
                this.results.failed++;
            }
        }
        
        console.log('测试完成:', this.results);
        return this.results;
    }

    /**
     * 显示测试结果
     */
    displayResults() {
        const resultElement = document.createElement('div');
        resultElement.className = 'verification-results';
        resultElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: Arial, sans-serif;
            max-width: 300px;
        `;
        
        resultElement.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">部署验证结果</h3>
            <div style="margin-bottom: 10px;">
                <div>总测试数: ${this.results.total}</div>
                <div style="color: green;">通过: ${this.results.passed}</div>
                <div style="color: red;">失败: ${this.results.failed}</div>
            </div>
            <div style="text-align: right;">
                <button id="close-verification" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                ">关闭</button>
            </div>
        `;
        
        document.body.appendChild(resultElement);
        
        document.getElementById('close-verification').addEventListener('click', () => {
            resultElement.remove();
        });
    }
}

/**
 * 创建部署验证测试套件
 * @returns {DeploymentVerification} 测试套件实例
 */
function createDeploymentTests() {
    const verification = new DeploymentVerification();
    
    // 测试1: 检查基本DOM元素是否存在
    verification.addTest('基本DOM元素检查', () => {
        const requiredElements = [
            'app',
            'water-card',
            'posture-card',
            'settings-panel',
            'notification-overlay',
            'help-overlay'
        ];
        
        for (const id of requiredElements) {
            if (!document.getElementById(id)) {
                console.error(`缺少必要DOM元素: ${id}`);
                return false;
            }
        }
        
        return true;
    });
    
    // 测试2: 检查JavaScript组件是否正确加载
    verification.addTest('JavaScript组件加载检查', () => {
        // 检查全局应用实例
        if (!window.app || !window.app.isInitialized) {
            console.error('应用未正确初始化');
            return false;
        }
        
        // 检查核心组件
        const requiredComponents = [
            'storageManager',
            'appSettings',
            'notificationService',
            'activityDetector',
            'waterReminder',
            'postureReminder',
            'uiController'
        ];
        
        for (const component of requiredComponents) {
            if (!window.app[component]) {
                console.error(`缺少核心组件: ${component}`);
                return false;
            }
        }
        
        return true;
    });
    
    // 测试3: 检查本地存储功能
    verification.addTest('本地存储功能检查', () => {
        try {
            // 测试存储可用性
            const testKey = '_test_deployment_' + Date.now();
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return testValue === 'test';
        } catch (error) {
            console.error('本地存储测试失败:', error);
            return false;
        }
    });
    
    // 测试4: 检查CSS样式是否正确加载
    verification.addTest('CSS样式加载检查', () => {
        // 检查一些关键样式是否应用
        const appElement = document.getElementById('app');
        if (!appElement) return false;
        
        const styles = window.getComputedStyle(appElement);
        return styles && styles.display !== 'none';
    });
    
    // 测试5: 检查资源文件是否可访问
    verification.addTest('资源文件访问检查', async () => {
        try {
            const resources = [
                'assets/water-icon.png',
                'assets/posture-icon.png',
                'assets/notification.mp3'
            ];
            
            for (const resource of resources) {
                const response = await fetch(resource, { method: 'HEAD' });
                if (!response.ok) {
                    console.error(`资源文件不可访问: ${resource}`);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('资源文件检查失败:', error);
            return false;
        }
    });
    
    // 测试6: 检查Service Worker是否注册
    verification.addTest('Service Worker检查', async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('浏览器不支持Service Worker');
            return true; // 不支持也算通过，因为这是增强功能
        }
        
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            return !!registration;
        } catch (error) {
            console.error('Service Worker检查失败:', error);
            return false;
        }
    });
    
    return verification;
}

// 在URL中添加?verify=true参数时运行验证
if (window.location.search.includes('verify=true')) {
    window.addEventListener('load', async () => {
        // 等待应用初始化完成
        let attempts = 0;
        const maxAttempts = 10;
        
        const waitForApp = async () => {
            if (window.app && window.app.isInitialized) {
                console.log('应用已初始化，开始验证');
                const verification = createDeploymentTests();
                await verification.runTests();
                verification.displayResults();
            } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`等待应用初始化... (${attempts}/${maxAttempts})`);
                setTimeout(waitForApp, 500);
            } else {
                console.error('应用初始化超时，无法完成验证');
                const verification = new DeploymentVerification();
                verification.results.total = 1;
                verification.results.failed = 1;
                verification.displayResults();
            }
        };
        
        waitForApp();
    });
}