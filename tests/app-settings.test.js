/**
 * AppSettings 单元测试
 */

// 模拟StorageManager
class MockStorageManager {
    constructor() {
        this.storage = new Map();
    }

    saveSettings(key, data) {
        this.storage.set(key, JSON.stringify(data));
        return true;
    }

    loadSettings(key) {
        const data = this.storage.get(key);
        return data ? JSON.parse(data) : null;
    }

    clearAllData() {
        this.storage.clear();
        return true;
    }

    isAvailable() {
        return true;
    }
}

// 测试套件
class AppSettingsTests {
    constructor() {
        this.testResults = [];
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

    // 测试默认设置
    testDefaultSettings() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        const settings = appSettings.getSettings();
        this.assertNotNull(settings, '设置不应为null');
        
        // 验证默认值
        this.assertEqual(settings.water.enabled, true, '喝水提醒应默认启用');
        this.assertEqual(settings.water.interval, 30, '喝水间隔应为30分钟');
        this.assertEqual(settings.posture.enabled, true, '久坐提醒应默认启用');
        this.assertEqual(settings.posture.interval, 60, '久坐间隔应为60分钟');
        this.assertEqual(settings.ui.theme, 'light', '主题应为light');
        this.assertEqual(settings.ui.language, 'zh-CN', '语言应为zh-CN');
        this.assertEqual(settings.notifications.browserNotifications, true, '浏览器通知应默认启用');
    }

    // 测试设置验证
    testSettingsValidation() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        // 测试有效设置
        const validSettings = appSettings.getDefaultSettings();
        this.assert(appSettings.validateSettings(validSettings), '默认设置应该有效');
        
        // 测试无效设置
        const invalidSettings1 = { ...validSettings };
        delete invalidSettings1.water;
        this.assert(!appSettings.validateSettings(invalidSettings1), '缺少water配置应无效');
        
        const invalidSettings2 = { ...validSettings };
        invalidSettings2.water.interval = -1;
        this.assert(!appSettings.validateSettings(invalidSettings2), '负数间隔应无效');
        
        const invalidSettings3 = { ...validSettings };
        invalidSettings3.ui.theme = 'invalid';
        this.assert(!appSettings.validateSettings(invalidSettings3), '无效主题应无效');
    }

    // 测试设置更新
    testSettingsUpdate() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        // 更新喝水设置
        const updateResult = appSettings.updateSettings('water', {
            interval: 45,
            sound: false
        });
        this.assert(updateResult, '更新应该成功');
        
        const updatedSettings = appSettings.getSettings();
        this.assertEqual(updatedSettings.water.interval, 45, '间隔应更新为45');
        this.assertEqual(updatedSettings.water.sound, false, '声音应更新为false');
        this.assertEqual(updatedSettings.water.enabled, true, '启用状态应保持不变');
    }

    // 测试单个设置更新
    testSingleSettingUpdate() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        const result = appSettings.updateSingleSetting('posture', 'interval', 90);
        this.assert(result, '单个设置更新应该成功');
        
        const settings = appSettings.getSettings();
        this.assertEqual(settings.posture.interval, 90, '久坐间隔应更新为90');
    }

    // 测试获取特定类型设置
    testGetSettingsByType() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        const waterSettings = appSettings.getSettingsByType('water');
        this.assertNotNull(waterSettings, '喝水设置不应为null');
        this.assertEqual(waterSettings.enabled, true, '喝水提醒应启用');
        
        const invalidSettings = appSettings.getSettingsByType('invalid');
        this.assertEqual(invalidSettings, null, '无效类型应返回null');
    }

    // 测试设置重置
    testSettingsReset() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        // 修改一些设置
        appSettings.updateSettings('water', { interval: 15 });
        appSettings.updateSettings('ui', { theme: 'dark' });
        
        // 验证修改生效
        let settings = appSettings.getSettings();
        this.assertEqual(settings.water.interval, 15, '间隔应已修改');
        this.assertEqual(settings.ui.theme, 'dark', '主题应已修改');
        
        // 重置所有设置
        const resetResult = appSettings.resetToDefaults();
        this.assert(resetResult, '重置应该成功');
        
        // 验证重置效果
        settings = appSettings.getSettings();
        this.assertEqual(settings.water.interval, 30, '间隔应重置为默认值');
        this.assertEqual(settings.ui.theme, 'light', '主题应重置为默认值');
    }

    // 测试类型重置
    testTypeReset() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        // 修改喝水设置
        appSettings.updateSettings('water', { 
            interval: 15, 
            sound: false,
            enabled: false 
        });
        
        // 验证修改
        let waterSettings = appSettings.getSettingsByType('water');
        this.assertEqual(waterSettings.interval, 15, '间隔应已修改');
        this.assertEqual(waterSettings.sound, false, '声音应已修改');
        
        // 重置喝水设置
        const resetResult = appSettings.resetTypeToDefault('water');
        this.assert(resetResult, '类型重置应该成功');
        
        // 验证重置效果
        waterSettings = appSettings.getSettingsByType('water');
        this.assertEqual(waterSettings.interval, 30, '间隔应重置为默认值');
        this.assertEqual(waterSettings.sound, true, '声音应重置为默认值');
        this.assertEqual(waterSettings.enabled, true, '启用状态应重置为默认值');
    }

    // 测试设置导入导出
    testImportExport() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        // 修改一些设置
        appSettings.updateSettings('water', { interval: 25 });
        appSettings.updateSettings('posture', { interval: 75 });
        
        // 导出设置
        const exportedSettings = appSettings.exportSettings();
        this.assertNotNull(exportedSettings, '导出的设置不应为null');
        this.assertEqual(exportedSettings.water.interval, 25, '导出的喝水间隔应正确');
        this.assertEqual(exportedSettings.posture.interval, 75, '导出的久坐间隔应正确');
        
        // 重置设置
        appSettings.resetToDefaults();
        
        // 导入设置
        const importResult = appSettings.importSettings(exportedSettings);
        this.assert(importResult, '导入应该成功');
        
        // 验证导入效果
        const currentSettings = appSettings.getSettings();
        this.assertEqual(currentSettings.water.interval, 25, '导入的喝水间隔应正确');
        this.assertEqual(currentSettings.posture.interval, 75, '导入的久坐间隔应正确');
    }

    // 测试设置摘要
    testSettingsSummary() {
        const mockStorage = new MockStorageManager();
        const appSettings = new AppSettings(mockStorage);
        
        const summary = appSettings.getSettingsSummary();
        this.assertNotNull(summary, '设置摘要不应为null');
        this.assertNotNull(summary.version, '版本不应为null');
        this.assertNotNull(summary.createdAt, '创建时间不应为null');
        this.assertNotNull(summary.updatedAt, '更新时间不应为null');
        this.assertEqual(summary.waterEnabled, true, '喝水启用状态应正确');
        this.assertEqual(summary.waterInterval, 30, '喝水间隔应正确');
        this.assertEqual(summary.postureEnabled, true, '久坐启用状态应正确');
        this.assertEqual(summary.postureInterval, 60, '久坐间隔应正确');
    }

    // 测试设置持久化
    testSettingsPersistence() {
        const mockStorage = new MockStorageManager();
        
        // 创建第一个实例并修改设置
        const appSettings1 = new AppSettings(mockStorage);
        appSettings1.updateSettings('water', { interval: 20 });
        appSettings1.updateSettings('ui', { theme: 'dark' });
        
        // 创建第二个实例，应该加载保存的设置
        const appSettings2 = new AppSettings(mockStorage);
        const settings = appSettings2.getSettings();
        
        this.assertEqual(settings.water.interval, 20, '持久化的喝水间隔应正确');
        this.assertEqual(settings.ui.theme, 'dark', '持久化的主题应正确');
    }

    // 运行所有测试
    runAllTests() {
        console.log('开始AppSettings单元测试...\n');
        
        this.runTest('默认设置测试', () => this.testDefaultSettings());
        this.runTest('设置验证测试', () => this.testSettingsValidation());
        this.runTest('设置更新测试', () => this.testSettingsUpdate());
        this.runTest('单个设置更新测试', () => this.testSingleSettingUpdate());
        this.runTest('获取特定类型设置测试', () => this.testGetSettingsByType());
        this.runTest('设置重置测试', () => this.testSettingsReset());
        this.runTest('类型重置测试', () => this.testTypeReset());
        this.runTest('导入导出测试', () => this.testImportExport());
        this.runTest('设置摘要测试', () => this.testSettingsSummary());
        this.runTest('设置持久化测试', () => this.testSettingsPersistence());
        
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
    try {
        const AppSettings = require('../js/app-settings.js');
        global.AppSettings = AppSettings;
        
        // 运行测试
        const tests = new AppSettingsTests();
        const success = tests.runAllTests();
        
        if (typeof process !== 'undefined') {
            process.exit(success ? 0 : 1);
        }
    } catch (error) {
        console.error('无法加载AppSettings或运行测试:', error);
        if (typeof process !== 'undefined') {
            process.exit(1);
        }
    }
}

// 导出测试类供浏览器使用
if (typeof window !== 'undefined') {
    window.AppSettingsTests = AppSettingsTests;
}