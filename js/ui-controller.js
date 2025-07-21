/**
 * UI控制器 - 管理用户界面的状态和交互
 */
class UIController {
    constructor() {
        this.elements = {};
        this.isSettingsOpen = false;
        this.currentNotification = null;
        this.eventListeners = {};
        this.uiState = {
            water: {
                isActive: false,
                timeRemaining: 0,
                status: '未启动',
                completedToday: 0,
                targetToday: 8
            },
            posture: {
                isActive: false,
                timeRemaining: 0,
                status: '未启动',
                completedToday: 0,
                targetToday: 8
            },
            settings: {
                isOpen: false
            },
            help: {
                isOpen: false
            }
        };
        
        // 绑定方法
        this.bindEvents = this.bindEvents.bind(this);
        this.handleSettingsToggle = this.handleSettingsToggle.bind(this);
        this.handleHelpToggle = this.handleHelpToggle.bind(this);
        this.handleOutsideClick = this.handleOutsideClick.bind(this);
        this.handleNotificationKeydown = this.handleNotificationKeydown.bind(this);
    }

    /**
     * 初始化UI控制器
     */
    initialize() {
        console.log('初始化UI控制器...');
        this.cacheElements();
        this.bindEvents();
        this.setupInitialState();
        return this;
    }

    /**
     * 缓存DOM元素引用
     * @private
     */
    cacheElements() {
        // 主要控制元素
        this.elements = {
            // 应用容器
            appContainer: document.getElementById('app'),
            
            // 喝水提醒相关
            waterCard: document.getElementById('water-card'),
            waterStatus: document.getElementById('water-status'),
            waterTime: document.getElementById('water-time'),
            waterToggle: document.getElementById('water-toggle'),
            waterReset: document.getElementById('water-reset'),
            waterDrink: document.getElementById('waterDrink'),
            waterStats: document.getElementById('water-stats'),
            waterProgress: document.getElementById('water-progress'),
            
            // 久坐提醒相关
            postureCard: document.getElementById('posture-card'),
            postureStatus: document.getElementById('posture-status'),
            postureTime: document.getElementById('posture-time'),
            postureToggle: document.getElementById('posture-toggle'),
            postureReset: document.getElementById('posture-reset'),
            postureActivity: document.getElementById('postureActivity'),
            postureStats: document.getElementById('posture-stats'),
            postureProgress: document.getElementById('posture-progress'),
            
            // 设置面板
            settingsBtn: document.getElementById('settings-btn'),
            settingsPanel: document.getElementById('settings-panel'),
            settingsClose: document.getElementById('settings-close'),
            saveSettings: document.getElementById('save-settings'),
            resetSettings: document.getElementById('reset-settings'),
            
            // 设置项
            waterEnabled: document.getElementById('water-enabled'),
            waterInterval: document.getElementById('water-interval'),
            postureEnabled: document.getElementById('posture-enabled'),
            postureInterval: document.getElementById('posture-interval'),
            browserNotifications: document.getElementById('browser-notifications'),
            soundEnabled: document.getElementById('sound-enabled'),
            
            // 通知弹窗
            notificationOverlay: document.getElementById('notification-overlay'),
            notificationIcon: document.getElementById('notification-icon'),
            notificationTitle: document.getElementById('notification-title'),
            notificationMessage: document.getElementById('notification-message'),
            notificationConfirm: document.getElementById('notification-confirm'),
            notificationSnooze: document.getElementById('notification-snooze'),
            
            // 帮助面板
            helpBtn: document.getElementById('help-btn'),
            helpOverlay: document.getElementById('help-overlay'),
            helpClose: document.getElementById('help-close')
        };
        
        // 检查必要元素是否存在
        const requiredElements = ['waterCard', 'postureCard', 'settingsPanel'];
        const missingElements = requiredElements.filter(id => !this.elements[id]);
        
        if (missingElements.length > 0) {
            console.error('UI初始化错误: 缺少必要DOM元素', missingElements);
        }
    }

    /**
     * 绑定事件监听器
     * @private
     */
    bindEvents() {
        // 设置面板事件
        this.addEventHandler('settingsBtn', 'click', this.handleSettingsToggle);
        this.addEventHandler('settingsClose', 'click', this.handleSettingsToggle);
        this.addEventHandler('saveSettings', 'click', this.handleSaveSettings.bind(this));
        this.addEventHandler('resetSettings', 'click', this.handleResetSettings.bind(this));
        
        // 帮助面板事件
        this.addEventHandler('helpBtn', 'click', this.handleHelpToggle);
        this.addEventHandler('helpClose', 'click', this.handleHelpToggle);
        
        // 通知弹窗事件
        this.addEventHandler('notificationConfirm', 'click', () => {
            this.hideNotificationModal();
            if (this.currentNotification && this.currentNotification.onConfirm) {
                this.currentNotification.onConfirm();
            }
        });
        
        this.addEventHandler('notificationSnooze', 'click', () => {
            this.hideNotificationModal();
            if (this.currentNotification && this.currentNotification.onSnooze) {
                this.currentNotification.onSnooze();
            }
        });
        
        // 喝水提醒控制按钮
        this.addEventHandler('waterToggle', 'click', () => {
            this.triggerEvent('waterToggle', { isActive: !this.uiState.water.isActive });
        });
        
        this.addEventHandler('waterReset', 'click', () => {
            this.triggerEvent('waterReset');
        });
        
        this.addEventHandler('waterDrink', 'click', () => {
            this.triggerEvent('waterDrink');
        });
        
        // 久坐提醒控制按钮
        this.addEventHandler('postureToggle', 'click', () => {
            this.triggerEvent('postureToggle', { isActive: !this.uiState.posture.isActive });
        });
        
        this.addEventHandler('postureReset', 'click', () => {
            this.triggerEvent('postureReset');
        });
        
        this.addEventHandler('postureActivity', 'click', () => {
            this.triggerEvent('postureActivity');
        });
    }
    
    /**
     * 添加事件处理器并跟踪
     * @param {string} elementId - 元素ID
     * @param {string} eventType - 事件类型
     * @param {Function} handler - 处理函数
     * @private
     */
    addEventHandler(elementId, eventType, handler) {
        const element = this.elements[elementId];
        if (!element) return;
        
        // 存储事件处理器引用以便后续可能的移除
        if (!this.eventListeners[elementId]) {
            this.eventListeners[elementId] = {};
        }
        
        if (!this.eventListeners[elementId][eventType]) {
            this.eventListeners[elementId][eventType] = [];
        }
        
        this.eventListeners[elementId][eventType].push(handler);
        element.addEventListener(eventType, handler);
    }
    
    /**
     * 移除事件处理器
     * @param {string} elementId - 元素ID
     * @param {string} eventType - 事件类型
     * @private
     */
    removeEventHandlers(elementId, eventType) {
        const element = this.elements[elementId];
        if (!element || !this.eventListeners[elementId] || !this.eventListeners[elementId][eventType]) {
            return;
        }
        
        this.eventListeners[elementId][eventType].forEach(handler => {
            element.removeEventListener(eventType, handler);
        });
        
        this.eventListeners[elementId][eventType] = [];
    }
    
    /**
     * 注册自定义事件回调
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    on(eventName, callback) {
        if (!this.eventListeners._custom) {
            this.eventListeners._custom = {};
        }
        
        if (!this.eventListeners._custom[eventName]) {
            this.eventListeners._custom[eventName] = [];
        }
        
        this.eventListeners._custom[eventName].push(callback);
    }
    
    /**
     * 触发自定义事件
     * @param {string} eventName - 事件名称
     * @param {*} data - 事件数据
     */
    triggerEvent(eventName, data = null) {
        if (!this.eventListeners._custom || !this.eventListeners._custom[eventName]) {
            return;
        }
        
        this.eventListeners._custom[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`事件处理错误 (${eventName}):`, error);
            }
        });
    }

    /**
     * 设置初始UI状态
     * @private
     */
    setupInitialState() {
        console.log('设置UI初始状态...');
        
        // 设置初始状态显示
        this.updateReminderStatus('water', {
            isActive: false,
            timeRemaining: 0,
            status: '未启动'
        });
        
        this.updateReminderStatus('posture', {
            isActive: false,
            timeRemaining: 0,
            status: '未启动'
        });
        
        // 初始化进度条
        this.updateDailyProgress('water', 0, 8);
        this.updateDailyProgress('posture', 0, 8);
        
        // 隐藏设置面板
        this.hideSettings();
        
        // 设置主题
        this.applyTheme('light');
        
        // 检查移动设备
        this.checkMobileDevice();
    }
    
    /**
     * 检查是否为移动设备并应用相应样式
     * @private
     */
    checkMobileDevice() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            document.body.classList.add('mobile-device');
        } else {
            document.body.classList.remove('mobile-device');
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            if (window.innerWidth < 768) {
                document.body.classList.add('mobile-device');
            } else {
                document.body.classList.remove('mobile-device');
            }
        });
    }
    
    /**
     * 应用主题
     * @param {string} theme - 主题名称 ('light' | 'dark')
     */
    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    /**
     * 更新提醒状态显示
     * @param {string} type - 'water' | 'posture'
     * @param {Object} status - 状态对象
     */
    updateReminderStatus(type, status) {
        const card = this.elements[`${type}Card`];
        const statusElement = this.elements[`${type}Status`];
        const timeElement = this.elements[`${type}Time`];
        const toggleButton = this.elements[`${type}Toggle`];
        const resetButton = this.elements[`${type}Reset`];
        const actionButton = this.elements[`${type === 'water' ? 'waterDrink' : 'postureActivity'}`];
        
        if (!card || !statusElement || !timeElement || !toggleButton) {
            return;
        }
        
        // 更新卡片状态样式
        if (status.isActive) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
        
        // 更新状态文本
        statusElement.textContent = status.status || (status.isActive ? '运行中' : '未启动');
        
        // 更新剩余时间显示
        if (status.isActive && status.timeRemaining > 0) {
            timeElement.textContent = this.formatTime(status.timeRemaining);
            timeElement.style.display = 'block';
        } else {
            timeElement.textContent = '';
            timeElement.style.display = 'none';
        }
        
        // 更新按钮状态
        if (status.isActive) {
            toggleButton.textContent = '暂停';
            toggleButton.className = 'btn-secondary';
            if (resetButton) resetButton.style.display = 'inline-block';
            if (actionButton) actionButton.style.display = 'inline-block';
        } else {
            toggleButton.textContent = '开始';
            toggleButton.className = 'btn-primary';
            if (resetButton) resetButton.style.display = 'none';
            if (actionButton) actionButton.style.display = 'none';
        }
    }

    /**
     * 显示通知弹窗
     * @param {string} type - 通知类型
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onSnooze - 稍后提醒回调
     */
    showNotificationModal(type, title, message, onConfirm, onSnooze) {
        // 保存当前通知信息
        this.currentNotification = {
            type,
            title,
            message,
            onConfirm,
            onSnooze
        };
        
        // 设置通知内容
        if (this.elements.notificationIcon) {
            this.elements.notificationIcon.textContent = type === 'water' ? '💧' : '🧘';
        }
        
        if (this.elements.notificationTitle) {
            this.elements.notificationTitle.textContent = title;
        }
        
        if (this.elements.notificationMessage) {
            this.elements.notificationMessage.textContent = message;
        }
        
        if (this.elements.notificationConfirm) {
            this.elements.notificationConfirm.textContent = type === 'water' ? '已喝水' : '已起身活动';
        }
        
        // 显示通知弹窗
        if (this.elements.notificationOverlay) {
            this.elements.notificationOverlay.classList.add('show');
            
            // 添加键盘事件监听
            document.addEventListener('keydown', this.handleNotificationKeydown);
        }
    }

    /**
     * 隐藏通知弹窗
     */
    hideNotificationModal() {
        if (this.elements.notificationOverlay) {
            this.elements.notificationOverlay.classList.remove('show');
            
            // 移除键盘事件监听
            document.removeEventListener('keydown', this.handleNotificationKeydown);
        }
        
        // 清除当前通知信息
        this.currentNotification = null;
    }
    
    /**
     * 处理通知弹窗的键盘事件
     * @param {KeyboardEvent} event - 键盘事件
     * @private
     */
    handleNotificationKeydown = (event) => {
        // 按下Escape键关闭通知
        if (event.key === 'Escape') {
            this.hideNotificationModal();
        }
        
        // 按下Enter键确认通知
        if (event.key === 'Enter' && this.currentNotification && this.currentNotification.onConfirm) {
            this.hideNotificationModal();
            this.currentNotification.onConfirm();
        }
    }

    /**
     * 切换设置面板显示状态
     */
    toggleSettings() {
        if (this.isSettingsOpen) {
            this.hideSettings();
        } else {
            this.showSettings();
        }
    }

    /**
     * 显示设置面板
     */
    showSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.add('open');
            this.isSettingsOpen = true;
            
            // 添加键盘事件监听
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    this.hideSettings();
                }
            });
            
            // 添加点击外部关闭事件
            document.addEventListener('click', this.handleOutsideClick);
        }
    }

    /**
     * 隐藏设置面板
     */
    hideSettings() {
        if (this.elements.settingsPanel) {
            this.elements.settingsPanel.classList.remove('open');
            this.isSettingsOpen = false;
            
            // 移除点击外部关闭事件
            document.removeEventListener('click', this.handleOutsideClick);
        }
    }

    /**
     * 切换帮助面板显示状态
     */
    toggleHelp() {
        if (this.elements.helpOverlay) {
            if (this.elements.helpOverlay.classList.contains('show')) {
                this.elements.helpOverlay.classList.remove('show');
            } else {
                this.elements.helpOverlay.classList.add('show');
            }
        }
    }
    
    /**
     * 处理点击外部关闭设置面板
     * @param {MouseEvent} event - 鼠标事件
     * @private
     */
    handleOutsideClick = (event) => {
        if (this.isSettingsOpen && 
            this.elements.settingsPanel && 
            !this.elements.settingsPanel.contains(event.target) && 
            event.target !== this.elements.settingsBtn) {
            this.hideSettings();
        }
    }

    /**
     * 从UI获取当前设置
     * @returns {Object} 设置对象
     */
    getSettingsFromUI() {
        return {
            water: {
                enabled: this.elements.waterEnabled ? this.elements.waterEnabled.checked : true,
                interval: this.elements.waterInterval ? parseInt(this.elements.waterInterval.value) : 30
            },
            posture: {
                enabled: this.elements.postureEnabled ? this.elements.postureEnabled.checked : true,
                interval: this.elements.postureInterval ? parseInt(this.elements.postureInterval.value) : 60
            },
            notifications: {
                browserNotifications: this.elements.browserNotifications ? this.elements.browserNotifications.checked : true,
                soundEnabled: this.elements.soundEnabled ? this.elements.soundEnabled.checked : true
            }
        };
    }

    /**
     * 将设置应用到UI
     * @param {Object} settings - 设置对象
     */
    applySettingsToUI(settings) {
        if (!settings) return;
        
        // 应用喝水提醒设置
        if (settings.water) {
            if (this.elements.waterEnabled) {
                this.elements.waterEnabled.checked = settings.water.enabled !== false;
            }
            if (this.elements.waterInterval) {
                this.elements.waterInterval.value = settings.water.interval || 30;
            }
        }
        
        // 应用久坐提醒设置
        if (settings.posture) {
            if (this.elements.postureEnabled) {
                this.elements.postureEnabled.checked = settings.posture.enabled !== false;
            }
            if (this.elements.postureInterval) {
                this.elements.postureInterval.value = settings.posture.interval || 60;
            }
        }
        
        // 应用通知设置
        if (settings.notifications) {
            if (this.elements.browserNotifications) {
                this.elements.browserNotifications.checked = settings.notifications.browserNotifications !== false;
            }
            if (this.elements.soundEnabled) {
                this.elements.soundEnabled.checked = settings.notifications.soundEnabled !== false;
            }
        }
    }

    /**
     * 处理设置切换
     * @private
     */
    handleSettingsToggle() {
        this.toggleSettings();
    }

    /**
     * 处理帮助切换
     * @private
     */
    handleHelpToggle() {
        this.toggleHelp();
    }

    /**
     * 格式化时间显示
     * @param {number} seconds - 秒数
     * @returns {string} 格式化的时间字符串
     * @private
     */
    formatTime(seconds) {
        if (seconds <= 0) return '';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    /**
     * 更新每日进度显示
     * @param {string} type - 'water' | 'posture'
     * @param {number} current - 当前完成次数
     * @param {number} target - 目标次数
     */
    updateDailyProgress(type, current, target) {
        const statsElement = this.elements[`${type}Stats`];
        const progressElement = this.elements[`${type}Progress`];
        
        if (statsElement) {
            const statsText = statsElement.querySelector('.stats-text');
            if (statsText) {
                const unit = type === 'water' ? '杯' : '次活动';
                statsText.textContent = `今日: ${current}/${target} ${unit}`;
            }
        }
        
        if (progressElement) {
            const percentage = Math.min((current / target) * 100, 100);
            progressElement.style.width = `${percentage}%`;
        }
    }

    /**
     * 显示页面内通知
     * @param {string} type - 通知类型
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {Function} onConfirm - 确认回调
     * @param {Function} onSnooze - 稍后提醒回调
     */
    showInPageNotification(type, title, message, onConfirm, onSnooze) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification-alert notification-${type}`;
        
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${type === 'water' ? '💧' : '🧘'}</div>
                <div class="notification-text">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
                <button class="btn-close">✕</button>
            </div>
            <div class="notification-actions">
                <button class="btn btn-primary">${type === 'water' ? '已喝水' : '已起身活动'}</button>
                <button class="btn btn-secondary">稍后提醒</button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 绑定事件
        const confirmBtn = notification.querySelector('.btn-primary');
        const snoozeBtn = notification.querySelector('.btn-secondary');
        const closeBtn = notification.querySelector('.btn-close');
        
        const removeNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                removeNotification();
                if (onConfirm) onConfirm();
            });
        }
        
        if (snoozeBtn) {
            snoozeBtn.addEventListener('click', () => {
                removeNotification();
                if (onSnooze) onSnooze();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', removeNotification);
        }
        
        // 自动关闭
        setTimeout(removeNotification, 10000);
    }

    /**
     * 显示权限请求提示
     * @param {Function} onAllow - 允许回调
     * @param {Function} onDeny - 拒绝回调
     */
    showPermissionPrompt(onAllow, onDeny) {
        // 创建权限提示元素
        const prompt = document.createElement('div');
        prompt.className = 'permission-prompt';
        
        prompt.innerHTML = `
            <div class="prompt-content">
                <div class="prompt-icon">🔔</div>
                <div class="prompt-text">
                    <h3>启用通知权限</h3>
                    <p>允许发送桌面通知，即使在其他标签页也能收到提醒</p>
                </div>
                <div class="prompt-actions">
                    <button class="btn-primary">允许通知</button>
                    <button class="btn-secondary">暂不开启</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(prompt);
        
        // 显示动画
        setTimeout(() => {
            prompt.classList.add('show');
        }, 100);
        
        // 绑定事件
        const allowBtn = prompt.querySelector('.btn-primary');
        const denyBtn = prompt.querySelector('.btn-secondary');
        
        const removePrompt = () => {
            prompt.classList.remove('show');
            setTimeout(() => {
                if (prompt.parentNode) {
                    prompt.parentNode.removeChild(prompt);
                }
            }, 400);
        };
        
        if (allowBtn) {
            allowBtn.addEventListener('click', () => {
                removePrompt();
                if (onAllow) onAllow();
            });
        }
        
        if (denyBtn) {
            denyBtn.addEventListener('click', () => {
                removePrompt();
                if (onDeny) onDeny();
            });
        }
    }

    /**
     * 获取UI元素
     * @param {string} elementId - 元素ID
     * @returns {HTMLElement|null} DOM元素
     */
    getElement(elementId) {
        return this.elements[elementId] || document.getElementById(elementId);
    }

    /**
     * 设置元素可见性
     * @param {string} elementId - 元素ID
     * @param {boolean} visible - 是否可见
     */
    setElementVisibility(elementId, visible) {
        const element = this.getElement(elementId);
        if (element) {
            element.style.display = visible ? 'block' : 'none';
        }
    }

    /**
     * 设置元素文本内容
     * @param {string} elementId - 元素ID
     * @param {string} text - 文本内容
     */
    setElementText(elementId, text) {
        const element = this.getElement(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * 添加元素CSS类
     * @param {string} elementId - 元素ID
     * @param {string} className - CSS类名
     */
    addElementClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * 移除元素CSS类
     * @param {string} elementId - 元素ID
     * @param {string} className - CSS类名
     */
    removeElementClass(elementId, className) {
        const element = this.getElement(elementId);
        if (element) {
            element.classList.remove(className);
        }
    }
}