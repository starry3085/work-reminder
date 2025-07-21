/**
 * UI控制器测试
 */

describe('UIController', () => {
    let uiController;
    
    // 创建模拟DOM元素
    beforeEach(() => {
        // 创建模拟DOM结构
        document.body.innerHTML = `
            <div id="app">
                <div id="water-card">
                    <div id="water-status"></div>
                    <div id="water-time"></div>
                    <button id="water-toggle"></button>
                    <button id="water-reset"></button>
                </div>
                <div id="posture-card">
                    <div id="posture-status"></div>
                    <div id="posture-time"></div>
                    <button id="posture-toggle"></button>
                    <button id="posture-reset"></button>
                </div>
                <button id="settings-btn"></button>
                <button id="help-btn"></button>
                
                <div id="settings-panel">
                    <button id="settings-close"></button>
                    <button id="save-settings"></button>
                    <button id="reset-settings"></button>
                    <input type="checkbox" id="water-enabled">
                    <select id="water-interval"></select>
                    <input type="checkbox" id="posture-enabled">
                    <select id="posture-interval"></select>
                    <input type="checkbox" id="browser-notifications">
                    <input type="checkbox" id="sound-enabled">
                </div>
                
                <div id="notification-overlay">
                    <div id="notification-icon"></div>
                    <div id="notification-title"></div>
                    <div id="notification-message"></div>
                    <button id="notification-confirm"></button>
                    <button id="notification-snooze"></button>
                </div>
                
                <div id="help-overlay">
                    <button id="help-close"></button>
                </div>
            </div>
        `;
        
        // 创建UI控制器实例
        uiController = new UIController();
        uiController.initialize();
    });
    
    afterEach(() => {
        document.body.innerHTML = '';
    });
    
    test('应该显示通知弹窗', () => {
        const confirmSpy = jest.fn();
        const snoozeSpy = jest.fn();
        
        uiController.showNotificationModal('water', '喝水提醒', '该喝水了！', confirmSpy, snoozeSpy);
        
        expect(uiController.currentNotification).not.toBeNull();
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(true);
        expect(uiController.elements.notificationTitle.textContent).toBe('喝水提醒');
        expect(uiController.elements.notificationMessage.textContent).toBe('该喝水了！');
        expect(uiController.elements.notificationConfirm.textContent).toBe('已喝水');
    });
    
    test('应该隐藏通知弹窗', () => {
        uiController.showNotificationModal('water', '喝水提醒', '该喝水了！', () => {}, () => {});
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(true);
        
        uiController.hideNotificationModal();
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(false);
        expect(uiController.currentNotification).toBeNull();
    });
    
    test('应该处理通知确认按钮点击', () => {
        const confirmSpy = jest.fn();
        uiController.showNotificationModal('water', '喝水提醒', '该喝水了！', confirmSpy, () => {});
        
        uiController.elements.notificationConfirm.click();
        
        expect(confirmSpy).toHaveBeenCalled();
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(false);
    });
    
    test('应该处理通知稍后提醒按钮点击', () => {
        const snoozeSpy = jest.fn();
        uiController.showNotificationModal('water', '喝水提醒', '该喝水了！', () => {}, snoozeSpy);
        
        uiController.elements.notificationSnooze.click();
        
        expect(snoozeSpy).toHaveBeenCalled();
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(false);
    });
    
    test('应该处理通知的键盘事件', () => {
        const confirmSpy = jest.fn();
        uiController.showNotificationModal('water', '喝水提醒', '该喝水了！', confirmSpy, () => {});
        
        // 模拟按下Enter键
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        document.dispatchEvent(enterEvent);
        
        expect(confirmSpy).toHaveBeenCalled();
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(false);
        
        // 重新显示通知
        uiController.showNotificationModal('water', '喝水提醒', '该喝水了！', () => {}, () => {});
        
        // 模拟按下Escape键
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
        
        expect(uiController.elements.notificationOverlay.classList.contains('show')).toBe(false);
    });
    
    test('应该切换设置面板显示状态', () => {
        expect(uiController.isSettingsOpen).toBe(false);
        
        uiController.toggleSettings();
        expect(uiController.isSettingsOpen).toBe(true);
        expect(uiController.elements.settingsPanel.classList.contains('open')).toBe(true);
        
        uiController.toggleSettings();
        expect(uiController.isSettingsOpen).toBe(false);
        expect(uiController.elements.settingsPanel.classList.contains('open')).toBe(false);
    });
    
    test('应该切换帮助面板显示状态', () => {
        expect(uiController.elements.helpOverlay.classList.contains('show')).toBe(false);
        
        uiController.toggleHelp();
        expect(uiController.elements.helpOverlay.classList.contains('show')).toBe(true);
        
        uiController.toggleHelp();
        expect(uiController.elements.helpOverlay.classList.contains('show')).toBe(false);
    });
});