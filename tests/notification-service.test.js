/**
 * 通知服务测试
 */

describe('NotificationService', () => {
    let notificationService;
    let originalNotification;
    let originalAudioContext;
    
    beforeEach(() => {
        // 保存原始的Notification和AudioContext
        originalNotification = window.Notification;
        originalAudioContext = window.AudioContext || window.webkitAudioContext;
        
        // 模拟Notification API
        window.Notification = {
            permission: 'default',
            requestPermission: function() {
                return Promise.resolve(this.permission);
            }
        };
        
        // 模拟AudioContext
        window.AudioContext = function() {
            return {
                state: 'running',
                createOscillator: () => ({
                    connect: () => {},
                    frequency: { value: 0 },
                    start: () => {},
                    stop: () => {}
                }),
                createGain: () => ({
                    connect: () => {},
                    gain: { 
                        value: 0,
                        exponentialRampToValueAtTime: () => {}
                    }
                }),
                destination: {},
                currentTime: 0,
                resume: () => {}
            };
        };
        
        // 创建通知服务实例
        notificationService = new NotificationService();
    });
    
    afterEach(() => {
        // 清理DOM中的通知元素
        const notifications = document.querySelectorAll('#wellness-notification, #notification-permission-prompt');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // 恢复原始的Notification和AudioContext
        window.Notification = originalNotification;
        if (originalAudioContext) {
            window.AudioContext = originalAudioContext;
        } else {
            delete window.AudioContext;
        }
    });
    
    test('应该检测浏览器通知支持', () => {
        expect(notificationService.isNotificationSupported()).toBeDefined();
    });
    
    test('应该显示页面内通知', () => {
        notificationService.showInPageAlert('water', '喝水提醒', '该喝水了！', () => {}, () => {});
        
        const notification = document.getElementById('wellness-notification');
        expect(notification).not.toBeNull();
        expect(notification.querySelector('.notification-title').textContent).toBe('喝水提醒');
        expect(notification.querySelector('.notification-message').textContent).toBe('该喝水了！');
    });
    
    test('应该隐藏页面内通知', () => {
        notificationService.showInPageAlert('water', '喝水提醒', '该喝水了！', () => {}, () => {});
        
        const notification = document.getElementById('wellness-notification');
        expect(notification).not.toBeNull();
        
        notificationService.hideInPageAlert();
        
        // 由于动画延迟，我们需要等待一段时间后再检查
        setTimeout(() => {
            const notificationAfterHide = document.getElementById('wellness-notification');
            expect(notificationAfterHide).toBeNull();
        }, 400);
    });
    
    test('应该根据类型返回正确的图标', () => {
        expect(notificationService.getNotificationIcon('water')).toBe('assets/water-icon.png');
        expect(notificationService.getNotificationIcon('posture')).toBe('assets/posture-icon.png');
        expect(notificationService.getNotificationIcon('unknown')).toBe('assets/default-icon.png');
    });
    
    test('应该根据类型返回正确的表情符号', () => {
        expect(notificationService.getNotificationEmoji('water')).toBe('💧');
        expect(notificationService.getNotificationEmoji('posture')).toBe('🧘');
        expect(notificationService.getNotificationEmoji('unknown')).toBe('⏰');
    });
    
    test('应该能够设置音效开关', () => {
        expect(notificationService.soundEnabled).toBe(true);
        
        notificationService.setSoundEnabled(false);
        expect(notificationService.soundEnabled).toBe(false);
        
        notificationService.setSoundEnabled(true);
        expect(notificationService.soundEnabled).toBe(true);
    });
    
    test('应该显示权限请求提示', () => {
        const mockCallback = jest.fn();
        notificationService.showPermissionPrompt(mockCallback);
        
        const prompt = document.getElementById('notification-permission-prompt');
        expect(prompt).not.toBeNull();
        
        // 测试点击请求按钮
        const requestBtn = prompt.querySelector('#request-permission-btn');
        requestBtn.click();
        
        expect(mockCallback).toHaveBeenCalled();
        
        // 确认提示已被隐藏
        setTimeout(() => {
            const promptAfterClick = document.getElementById('notification-permission-prompt');
            expect(promptAfterClick).toBeNull();
        }, 400);
    });
    
    test('应该隐藏权限请求提示', () => {
        notificationService.showPermissionPrompt(() => {});
        
        const prompt = document.getElementById('notification-permission-prompt');
        expect(prompt).not.toBeNull();
        
        notificationService.hidePermissionPrompt();
        
        // 由于动画延迟，我们需要等待一段时间后再检查
        setTimeout(() => {
            const promptAfterHide = document.getElementById('notification-permission-prompt');
            expect(promptAfterHide).toBeNull();
        }, 400);
    });
    
    test('应该在浏览器通知不可用时显示页面内通知', () => {
        // 模拟浏览器通知不可用
        notificationService.isSupported = false;
        
        // 调用通知方法
        notificationService.showNotification('water', '喝水提醒', '该喝水了！', () => {}, () => {});
        
        // 验证页面内通知是否显示
        const notification = document.getElementById('wellness-notification');
        expect(notification).not.toBeNull();
    });
    
    test('应该在没有通知权限时显示页面内通知', () => {
        // 模拟没有通知权限
        notificationService.isSupported = true;
        notificationService.hasPermission = false;
        
        // 调用通知方法
        notificationService.showNotification('water', '喝水提醒', '该喝水了！', () => {}, () => {});
        
        // 验证页面内通知是否显示
        const notification = document.getElementById('wellness-notification');
        expect(notification).not.toBeNull();
    });
    
    test('应该正确初始化音频上下文', () => {
        expect(notificationService.audioContext).not.toBeNull();
    });
    
    test('应该在音频上下文不可用时降级到HTML5 Audio', () => {
        // 模拟音频上下文不可用
        window.AudioContext = undefined;
        window.webkitAudioContext = undefined;
        
        // 重新创建通知服务
        const newNotificationService = new NotificationService();
        
        // 验证音频上下文是否为null
        expect(newNotificationService.audioContext).toBeNull();
        
        // 模拟Audio对象
        const originalAudio = window.Audio;
        window.Audio = function() {
            return {
                play: () => Promise.resolve(),
                volume: 0,
                src: '',
                currentTime: 0
            };
        };
        
        // 调用播放音效方法
        const playSpy = jest.spyOn(newNotificationService, 'playAudioFile');
        newNotificationService.playSound('water');
        
        // 验证是否调用了HTML5 Audio方法
        expect(playSpy).toHaveBeenCalled();
        
        // 恢复原始Audio对象
        window.Audio = originalAudio;
    });
    
    test('应该检查通知权限状态', () => {
        // 模拟不同的权限状态
        notificationService.isSupported = true;
        window.Notification.permission = 'granted';
        expect(notificationService.checkPermissionStatus()).toBe('granted');
        
        window.Notification.permission = 'denied';
        expect(notificationService.checkPermissionStatus()).toBe('denied');
        
        window.Notification.permission = 'default';
        expect(notificationService.checkPermissionStatus()).toBe('default');
        
        // 模拟不支持通知
        notificationService.isSupported = false;
        expect(notificationService.checkPermissionStatus()).toBe('unsupported');
    });
});