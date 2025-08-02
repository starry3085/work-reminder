/**
 * GitHub Pages Compatibility Fix
 * 解决GitHub Pages环境下PAUSE按钮不工作的问题
 */

// 等待DOM完全加载后执行修复
document.addEventListener('DOMContentLoaded', function() {
    console.log('GitHub Pages Fix: DOM loaded, starting compatibility fixes...');
    
    // 延迟执行，确保主应用已初始化
    setTimeout(function() {
        applyGitHubPagesFixes();
    }, 3000);
});

function applyGitHubPagesFixes() {
    console.log('GitHub Pages Fix: Applying compatibility fixes...');
    
    // 修复1: 强制重新绑定关键按钮事件
    fixButtonEventBindings();
    
    // 修复2: 添加全局调试信息
    addGlobalDebugInfo();
    
    // 修复3: 监控应用状态
    monitorAppState();
}

function fixButtonEventBindings() {
    console.log('GitHub Pages Fix: Fixing button event bindings...');
    
    // 获取关键按钮
    const standupToggle = document.getElementById('standup-toggle');
    const waterToggle = document.getElementById('water-toggle');
    
    if (standupToggle) {
        console.log('GitHub Pages Fix: Found standup toggle button');
        
        // 创建强制事件处理器
        const forceHandler = function(event) {
            console.log('GitHub Pages Fix: Force handler triggered for standup toggle');
            event.preventDefault();
            event.stopPropagation();
            
            // 直接调用应用方法
            if (window.app && window.app.standupReminder) {
                const reminder = window.app.standupReminder;
                const currentStatus = reminder.getCurrentStatus();
                
                console.log('GitHub Pages Fix: Current standup status:', currentStatus);
                
                if (!currentStatus.isActive) {
                    console.log('GitHub Pages Fix: Starting standup reminder');
                    window.app.startReminder('standup');
                } else if (currentStatus.isPaused) {
                    console.log('GitHub Pages Fix: Resuming standup reminder');
                    window.app.resumeReminder('standup');
                } else {
                    console.log('GitHub Pages Fix: Pausing standup reminder');
                    window.app.pauseReminder('standup');
                }
            } else {
                console.error('GitHub Pages Fix: App or standup reminder not available');
            }
        };
        
        // 移除所有现有事件监听器并添加新的
        const newButton = standupToggle.cloneNode(true);
        standupToggle.parentNode.replaceChild(newButton, standupToggle);
        newButton.addEventListener('click', forceHandler);
        
        console.log('GitHub Pages Fix: Standup toggle force handler added');
    }
    
    if (waterToggle) {
        console.log('GitHub Pages Fix: Found water toggle button');
        
        // 为水提醒按钮也添加类似的修复
        const forceHandler = function(event) {
            console.log('GitHub Pages Fix: Force handler triggered for water toggle');
            event.preventDefault();
            event.stopPropagation();
            
            if (window.app && window.app.waterReminder) {
                const reminder = window.app.waterReminder;
                const currentStatus = reminder.getCurrentStatus();
                
                console.log('GitHub Pages Fix: Current water status:', currentStatus);
                
                if (!currentStatus.isActive) {
                    console.log('GitHub Pages Fix: Starting water reminder');
                    window.app.startReminder('water');
                } else if (currentStatus.isPaused) {
                    console.log('GitHub Pages Fix: Resuming water reminder');
                    window.app.resumeReminder('water');
                } else {
                    console.log('GitHub Pages Fix: Pausing water reminder');
                    window.app.pauseReminder('water');
                }
            } else {
                console.error('GitHub Pages Fix: App or water reminder not available');
            }
        };
        
        const newButton = waterToggle.cloneNode(true);
        waterToggle.parentNode.replaceChild(newButton, waterToggle);
        newButton.addEventListener('click', forceHandler);
        
        console.log('GitHub Pages Fix: Water toggle force handler added');
    }
}

function addGlobalDebugInfo() {
    console.log('GitHub Pages Fix: Adding global debug info...');
    
    // 添加全局调试函数
    window.debugGitHubPages = function() {
        console.log('=== GitHub Pages Debug Info ===');
        console.log('App instance:', window.app);
        console.log('Water reminder:', window.app?.waterReminder);
        console.log('Standup reminder:', window.app?.standupReminder);
        console.log('UI Controller:', window.app?.uiController);
        
        if (window.app?.standupReminder) {
            console.log('Standup reminder status:', window.app.standupReminder.getCurrentStatus());
        }
        
        if (window.app?.waterReminder) {
            console.log('Water reminder status:', window.app.waterReminder.getCurrentStatus());
        }
        
        // 检查DOM元素
        console.log('Standup toggle element:', document.getElementById('standup-toggle'));
        console.log('Water toggle element:', document.getElementById('water-toggle'));
        
        console.log('=== End Debug Info ===');
    };
    
    // 添加到控制台，方便调试
    console.log('GitHub Pages Fix: Global debug function added. Use window.debugGitHubPages() to debug.');
}

function monitorAppState() {
    console.log('GitHub Pages Fix: Starting app state monitoring...');
    
    // 每5秒检查一次应用状态
    setInterval(function() {
        if (window.app && window.app.standupReminder) {
            const status = window.app.standupReminder.getCurrentStatus();
            
            // 检查UI是否与实际状态同步
            const toggleButton = document.getElementById('standup-toggle');
            if (toggleButton) {
                const expectedText = !status.isActive ? 'Start' : 
                                   status.isPaused ? 'Resume' : 'Pause';
                
                if (toggleButton.textContent !== expectedText) {
                    console.warn('GitHub Pages Fix: UI state mismatch detected!');
                    console.warn('Expected button text:', expectedText);
                    console.warn('Actual button text:', toggleButton.textContent);
                    console.warn('Reminder status:', status);
                    
                    // 尝试修复UI状态
                    if (window.app.uiController) {
                        console.log('GitHub Pages Fix: Attempting to fix UI state...');
                        window.app.uiController.updateReminderStatus('standup', status);
                    }
                }
            }
        }
    }, 5000);
}

// 导出修复函数供其他模块使用
window.GitHubPagesFix = {
    applyFixes: applyGitHubPagesFixes,
    fixButtonEventBindings: fixButtonEventBindings,
    addGlobalDebugInfo: addGlobalDebugInfo,
    monitorAppState: monitorAppState
};

console.log('GitHub Pages Fix: Compatibility fix module loaded');