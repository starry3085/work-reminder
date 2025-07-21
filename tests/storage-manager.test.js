/**
 * StorageManager 单元测试
 */

// 模拟localStorage
class MockLocalStorage {
    constructor() {
        this.store = {};
        this.length = 0;
    }

    getItem(key) {
        return this.store[key] || null;
    }

    setItem(key, value) {
        this.store[key] = String(value);
        this.length = Object.keys(this.store).length;
    }

    removeItem(key) {
        delete this.store[key];
        this.length = Object.keys(this.store).length;
    }

    clear() {
        this.store = {};
        this.length = 0;
    }

    key(index) {
        const keys = Object.keys(this.store);
        return keys[index] || null;
    }
}

// 测试套件
class StorageManagerTests {
    constructor() {
        this.testResults = [];
        this.originalLocalStorage = null;
    }

    // 设置测试环境
    setup() {
        // 保存原始localStorage
        this.originalLocalStorage = global.localStorage;
        // 使用模拟localStorage
        global.localStorage = new MockLocalStorage();
    }

    // 清理测试环境
    teardown() {
        if (this.originalLocalStorage) {
            global.localStorage = this.originalLocalStorage;
        }
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

    // 测试StorageManager基本功能
    testBasicFunctionality() {
        const storage = new StorageManager();
        
        // 测试存储可用性检测
        this.assert(typeof storage.isAvailable() === 'boolean', '应返回布尔值');
        
        // 测试保存和加载
        const testData = { test: 'value', number: 123 };
        const saveResult = storage.saveSettings('test', testData);
        this.assert(saveResult === true, '保存应该成功');
        
        const loadedData = storage.loadSettings('test');
        this.assertNotNull(loadedData, '加载的数据不应为null');
        this.assertEqual(loadedData.test, 'value', '字符串值应匹配');
        this.assertEqual(loadedData.number, 123, '数字值应匹配');
    }

    // 测试不存在的键
    testNonExistentKey() {
        const storage = new StorageManager();
        const result = storage.loadSettings('nonexistent');
        this.assertEqual(result, null, '不存在的键应返回null');
    }

    // 测试数据清除
    testClearData() {
        const storage = new StorageManager();
        
        // 保存一些测试数据
        storage.saveSettings('test1', { value: 1 });
        storage.saveSettings('test2', { value: 2 });
        
        // 验证数据存在
        this.assertNotNull(storage.loadSettings('test1'), '数据应存在');
        this.assertNotNull(storage.loadSettings('test2'), '数据应存在');
        
        // 清除数据
        const clearResult = storage.clearAllData();
        this.assert(clearResult === true, '清除应该成功');
        
        // 验证数据已清除
        this.assertEqual(storage.loadSettings('test1'), null, '数据应已清除');
        this.assertEqual(storage.loadSettings('test2'), null, '数据应已清除');
    }

    // 测试复杂数据结构
    testComplexData() {
        const storage = new StorageManager();
        
        const complexData = {
            settings: {
                water: {
                    enabled: true,
                    interval: 30,
                    lastReminder: new Date().getTime()
                },
                posture: {
                    enabled: false,
                    interval: 60
                }
            },
            state: {
                isActive: true,
                counters: [1, 2, 3, 4, 5]
            }
        };
        
        storage.saveSettings('complex', complexData);
        const loaded = storage.loadSettings('complex');
        
        this.assertNotNull(loaded, '复杂数据应能加载');
        this.assertEqual(loaded.settings.water.enabled, true, '嵌套布尔值应匹配');
        this.assertEqual(loaded.settings.water.interval, 30, '嵌套数字值应匹配');
        this.assertEqual(loaded.state.counters.length, 5, '数组长度应匹配');
        this.assertEqual(loaded.state.counters[0], 1, '数组元素应匹配');
    }

    // 测试备份和恢复
    testBackupRestore() {
        const storage = new StorageManager();
        
        // 保存测试数据
        const testData1 = { name: 'test1', value: 100 };
        const testData2 = { name: 'test2', value: 200 };
        
        storage.saveSettings('backup_test1', testData1);
        storage.saveSettings('backup_test2', testData2);
        
        // 创建备份
        const backup = storage.backupData();
        this.assertNotNull(backup, '备份应该成功');
        this.assertNotNull(backup.backup_test1, '备份应包含test1数据');
        this.assertNotNull(backup.backup_test2, '备份应包含test2数据');
        
        // 清除数据
        storage.clearAllData();
        this.assertEqual(storage.loadSettings('backup_test1'), null, '数据应已清除');
        
        // 恢复数据
        const restoreResult = storage.restoreData(backup);
        this.assert(restoreResult === true, '恢复应该成功');
        
        // 验证恢复的数据
        const restored1 = storage.loadSettings('backup_test1');
        const restored2 = storage.loadSettings('backup_test2');
        
        this.assertNotNull(restored1, '恢复的数据1不应为null');
        this.assertNotNull(restored2, '恢复的数据2不应为null');
        this.assertEqual(restored1.value, 100, '恢复的数据1值应匹配');
        this.assertEqual(restored2.value, 200, '恢复的数据2值应匹配');
    }

    // 测试存储信息获取
    testStorageInfo() {
        const storage = new StorageManager();
        const info = storage.getStorageInfo();
        
        this.assertNotNull(info, '存储信息不应为null');
        this.assert(typeof info.available === 'boolean', '可用性应为布尔值');
        this.assertNotNull(info.type, '类型不应为null');
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始StorageManager单元测试...\n');
        
        this.setup();
        
        this.runTest('基本功能测试', () => this.testBasicFunctionality());
        this.runTest('不存在键测试', () => this.testNonExistentKey());
        this.runTest('数据清除测试', () => this.testClearData());
        this.runTest('复杂数据测试', () => this.testComplexData());
        this.runTest('备份恢复测试', () => this.testBackupRestore());
        this.runTest('存储信息测试', () => this.testStorageInfo());
        
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

// 如果在Node.js环境中运行测试
if (typeof require !== 'undefined') {
    // 加载StorageManager类
    try {
        const StorageManager = require('../js/storage-manager.js');
        global.StorageManager = StorageManager;
        
        // 运行测试
        const tests = new StorageManagerTests();
        const success = tests.runAllTests();
        
        if (typeof process !== 'undefined') {
            process.exit(success ? 0 : 1);
        }
    } catch (error) {
        console.error('无法加载StorageManager或运行测试:', error);
        if (typeof process !== 'undefined') {
            process.exit(1);
        }
    }
}

// 导出测试类供浏览器使用
if (typeof window !== 'undefined') {
    window.StorageManagerTests = StorageManagerTests;
}