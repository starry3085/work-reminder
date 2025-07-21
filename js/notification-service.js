/**
 * 通知服务 - 负责管理浏览器通知和页面内通知
 */
class NotificationService {
    constructor() {
        this.hasPermission = false;
        this.isSupported = 'Notification' in window;
        this.soundEnabled = true;
        this.audioContext = null;
        this.audioFiles = {
            water: null,
            posture: null,
            default: null
        };
        
        // 检查是否已有权限
        if (this.isSupported && Notification.permission === 'granted') {
            this.hasPermission = true;
        }
        
        // 初始化音频上下文（如果支持）
        this.initAudioContext();
    }

    /**
     * 初始化音频上下文
     * @private
     */
    initAudioContext() {
        try {
            if (window.AudioContext || window.webkitAudioContext) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContextClass();
                console.log('音频上下文初始化成功');
            } else {
                console.warn('浏览器不支持Web Audio API，将使用HTML5 Audio');
            }
        } catch (error) {
            console.warn('初始化音频上下文失败:', error);
            this.audioContext = null;
        }
    }

    /**
     * 请求通知权限
     * @returns {Promise<boolean>} 是否获得权限
     */
    async requestPermission() {
        if (!this.isSupported) {
            console.warn('浏览器不支持通知功能');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
            
            if (this.hasPermission) {
                console.log('通知权限已获得');
            } else {
                console.warn('用户拒绝了通知权限');
            }
            
            return this.hasPermission;
        } catch (error) {
            console.error('请求通知权限时出错:', error);
            return false;
        }
    }

    /**
     * 显示通知（自动选择最佳通知方式）
     * @param {string} type - 通知类型 ('water' | 'posture')
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onSnooze - 稍后提醒回调
     * @returns {boolean} 是否成功显示
     */
    showNotification(type, title, message, onConfirm, onSnooze) {
        // 尝试显示浏览器通知
        const browserNotificationShown = this.showBrowserNotification(type, title, message);
        
        // 如果浏览器通知失败，显示页面内通知
        if (!browserNotificationShown) {
            this.showInPageAlert(type, title, message, onConfirm, onSnooze);
        }
        
        // 无论哪种通知方式，都播放提醒音效
        if (this.soundEnabled) {
            this.playSound(type);
        }
        
        return true;
    }

    /**
     * 显示浏览器通知
     * @param {string} type - 通知类型 ('water' | 'posture')
     * @param {string} title - 通知标题
     * @param {string} message - 通知内容
     * @returns {boolean} 是否成功显示
     */
    showBrowserNotification(type, title, message) {
        if (!this.isSupported) {
            console.warn('浏览器不支持通知功能，使用页面内通知');
            return false;
        }

        if (!this.hasPermission) {
            console.warn('没有通知权限，使用页面内通知');
            return false;
        }

        try {
            const options = {
                body: message,
                icon: this.getNotificationIcon(type),
                badge: this.getNotificationIcon(type),
                tag: `wellness-reminder-${type}`,
                requireInteraction: true,
                silent: !this.soundEnabled,
                vibrate: [200, 100, 200] // 振动模式（移动设备）
            };

            const notification = new Notification(title, options);
            
            // 设置点击事件
            notification.onclick = () => {
                window.focus();
                notification.close();
                // 触发确认回调（如果有）
                if (window.app && window.app[`${type}Reminder`]) {
                    window.app[`${type}Reminder`].acknowledge();
                }
            };

            // 自动关闭通知（30秒后）
            setTimeout(() => {
                notification.close();
            }, 30000);

            return true;
        } catch (error) {
            console.error('显示浏览器通知时出错:', error);
            return false;
        }
    }

    /**
     * 显示页面内提醒弹窗
     * @param {string} type - 提醒类型 ('water' | 'posture')
     * @param {string} title - 提醒标题
     * @param {string} message - 提醒内容
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onSnooze - 稍后提醒回调
     */
    showInPageAlert(type, title, message, onConfirm, onSnooze) {
        // 移除已存在的通知
        this.hideInPageAlert();

        // 创建通知容器
        const alertContainer = document.createElement('div');
        alertContainer.className = `notification-alert notification-${type}`;
        alertContainer.id = 'wellness-notification';

        // 创建通知内容
        alertContainer.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationEmoji(type)}
                </div>
                <div class="notification-text">
                    <h3 class="notification-title">${title}</h3>
                    <p class="notification-message">${message}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-primary" id="confirm-btn">
                        ${type === 'water' ? '已喝水' : '已起身活动'}
                    </button>
                    <button class="btn btn-secondary" id="snooze-btn">
                        稍后提醒
                    </button>
                    <button class="btn btn-close" id="close-btn">×</button>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(alertContainer);

        // 绑定事件
        const confirmBtn = alertContainer.querySelector('#confirm-btn');
        const snoozeBtn = alertContainer.querySelector('#snooze-btn');
        const closeBtn = alertContainer.querySelector('#close-btn');

        confirmBtn.addEventListener('click', () => {
            this.hideInPageAlert();
            if (onConfirm) onConfirm();
        });

        snoozeBtn.addEventListener('click', () => {
            this.hideInPageAlert();
            if (onSnooze) onSnooze();
        });

        closeBtn.addEventListener('click', () => {
            this.hideInPageAlert();
        });

        // 添加显示动画
        setTimeout(() => {
            alertContainer.classList.add('show');
        }, 100);

        // 自动隐藏（60秒后）
        setTimeout(() => {
            if (document.getElementById('wellness-notification')) {
                this.hideInPageAlert();
            }
        }, 60000);
    }

    /**
     * 播放提醒音效
     * @param {string} type - 音效类型
     */
    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            // 创建音频上下文（如果支持）
            if (this.audioContext) {
                this.playBeepSound(type);
            } else {
                // 降级方案：使用HTML5 Audio
                this.playAudioFile(type);
            }
        } catch (error) {
            console.warn('播放音效失败:', error);
        }
    }

    /**
     * 检查浏览器是否支持通知
     * @returns {boolean}
     */
    isNotificationSupported() {
        return this.isSupported;
    }

    /**
     * 设置音效开关
     * @param {boolean} enabled
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    /**
     * 获取通知图标URL
     * @param {string} type - 通知类型 ('water' | 'posture')
     * @returns {string} 图标URL
     */
    getNotificationIcon(type) {
        // 根据类型返回不同的图标URL
        if (type === 'water') {
            return 'assets/water-icon.png';
        } else if (type === 'posture') {
            return 'assets/posture-icon.png';
        }
        return 'assets/default-icon.png';
    }
    
    /**
     * 获取通知表情符号
     * @param {string} type - 通知类型 ('water' | 'posture')
     * @returns {string} 表情符号HTML
     */
    getNotificationEmoji(type) {
        if (type === 'water') {
            return '💧';
        } else if (type === 'posture') {
            return '🧘';
        }
        return '⏰';
    }
    
    /**
     * 隐藏页面内通知
     */
    hideInPageAlert() {
        const existingAlert = document.getElementById('wellness-notification');
        if (existingAlert) {
            existingAlert.classList.remove('show');
            setTimeout(() => {
                if (existingAlert.parentNode) {
                    existingAlert.parentNode.removeChild(existingAlert);
                }
            }, 300); // 等待淡出动画完成
        }
    }
    
    /**
     * 使用Web Audio API播放提示音
     * @param {string} type - 音效类型
     */
    playBeepSound(type) {
        try {
            if (!this.audioContext) {
                this.initAudioContext();
                if (!this.audioContext) {
                    throw new Error('音频上下文不可用');
                }
            }
            
            // 如果音频上下文被暂停（浏览器策略），尝试恢复
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // 创建音频节点
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 根据提醒类型设置不同的音调
            if (type === 'water') {
                oscillator.type = 'sine';
                oscillator.frequency.value = 800; // 较高的音调
                gainNode.gain.value = 0.1;
                
                // 创建水滴音效
                oscillator.start();
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                // 0.3秒后停止
                setTimeout(() => {
                    oscillator.stop();
                }, 300);
            } else if (type === 'posture') {
                oscillator.type = 'triangle';
                oscillator.frequency.value = 600; // 较低的音调
                gainNode.gain.value = 0.1;
                
                // 创建双音节提醒音
                oscillator.start();
                
                // 第一个音节
                setTimeout(() => {
                    oscillator.frequency.value = 700;
                }, 200);
                
                // 0.4秒后停止
                setTimeout(() => {
                    oscillator.stop();
                }, 400);
            } else {
                // 默认提示音
                oscillator.type = 'sine';
                oscillator.frequency.value = 700;
                gainNode.gain.value = 0.1;
                
                oscillator.start();
                
                // 0.2秒后停止
                setTimeout(() => {
                    oscillator.stop();
                }, 200);
            }
        } catch (error) {
            console.warn('Web Audio API不可用:', error);
            // 降级到HTML5 Audio
            this.playAudioFile(type);
        }
    }
    
    /**
     * 播放音频文件
     * @param {string} type - 音效类型
     */
    playAudioFile(type) {
        try {
            // 检查是否已经有缓存的音频对象
            if (!this.audioFiles[type]) {
                const audio = new Audio();
                audio.volume = 0.5;
                
                // 根据类型设置不同的音效
                if (type === 'water') {
                    audio.src = 'assets/water-reminder.mp3';
                } else if (type === 'posture') {
                    audio.src = 'assets/posture-reminder.mp3';
                } else {
                    audio.src = 'assets/notification.mp3';
                }
                
                // 缓存音频对象
                this.audioFiles[type] = audio;
            }
            
            // 重置音频并播放
            const audio = this.audioFiles[type];
            audio.currentTime = 0;
            
            audio.play().catch(error => {
                console.warn('播放音频失败:', error);
                
                // 如果是自动播放策略问题，尝试创建新的音频对象
                if (error.name === 'NotAllowedError') {
                    // 创建一个新的音频对象，可能会绕过某些浏览器的自动播放限制
                    const newAudio = new Audio();
                    newAudio.volume = 0.5;
                    
                    if (type === 'water') {
                        newAudio.src = 'assets/water-reminder.mp3';
                    } else if (type === 'posture') {
                        newAudio.src = 'assets/posture-reminder.mp3';
                    } else {
                        newAudio.src = 'assets/notification.mp3';
                    }
                    
                    // 尝试播放新创建的音频
                    newAudio.play().catch(e => {
                        console.warn('二次尝试播放音频失败:', e);
                    });
                }
            });
        } catch (error) {
            console.warn('HTML5 Audio不可用:', error);
        }
    }
    
    /**
     * 检查当前通知权限状态
     * @returns {string} 权限状态 ('granted', 'denied', 'default', 'unsupported')
     */
    checkPermissionStatus() {
        if (!this.isSupported) {
            return 'unsupported';
        }
        return Notification.permission;
    }
    
    /**
     * 显示通知权限请求提示
     * @param {Function} onRequestClick - 点击请求权限按钮的回调
     */
    showPermissionPrompt(onRequestClick) {
        // 创建权限请求提示容器
        const promptContainer = document.createElement('div');
        promptContainer.className = 'permission-prompt';
        promptContainer.id = 'notification-permission-prompt';
        
        // 创建提示内容
        promptContainer.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-icon">🔔</div>
                <div class="prompt-text">
                    <h3>启用通知</h3>
                    <p>为了更好地提醒您喝水和起身活动，请允许浏览器通知权限。</p>
                </div>
                <div class="prompt-actions">
                    <button class="btn btn-primary" id="request-permission-btn">允许通知</button>
                    <button class="btn btn-secondary" id="dismiss-prompt-btn">稍后再说</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(promptContainer);
        
        // 绑定事件
        const requestBtn = promptContainer.querySelector('#request-permission-btn');
        const dismissBtn = promptContainer.querySelector('#dismiss-prompt-btn');
        
        requestBtn.addEventListener('click', () => {
            this.hidePermissionPrompt();
            if (onRequestClick) onRequestClick();
        });
        
        dismissBtn.addEventListener('click', () => {
            this.hidePermissionPrompt();
        });
        
        // 添加显示动画
        setTimeout(() => {
            promptContainer.classList.add('show');
        }, 100);
    }
    
    /**
     * 隐藏通知权限请求提示
     */
    hidePermissionPrompt() {
        const promptContainer = document.getElementById('notification-permission-prompt');
        if (promptContainer) {
            promptContainer.classList.remove('show');
            setTimeout(() => {
                if (promptContainer.parentNode) {
                    promptContainer.parentNode.removeChild(promptContainer);
                }
            }, 300);
        }
    }
}