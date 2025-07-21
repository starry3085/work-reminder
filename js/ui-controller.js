/**
 * UI控制器 - 管理用户界面的状态和交互
 */
class UIController {
    constructor() {
        this.elements = {};
        this.isSettingsOpen = false;
        this.currentNotification = null;
        
        // 绑定方法
        this.bindEvents = this.bindEvents.bind(this);
        this.handleSettingsToggle = this.handleSettingsToggle.bind(this);
        this.handleHelpToggle = this.handleHelpToggle.bind(this);
    }

    /**
     * 初始化UI控制器
     */
    initialize() {
        this.cacheElements();
        this.bindEvents();
        this.setupInitialState();
    }

    /**
     * 缓存DOM元素引用
     * @private
     */
    cacheElements() {
        // 主要控制元素
        this.elements = {
            // 喝水提醒相关
            waterCard: document.getElementById('water-card'),
            waterStatus: document.getElementById('water-status'),
            waterTime: document.getElementById('water-time'),
            waterToggle: document.getElementById('water-toggle'),
            waterReset: document.getElementById('water-reset'),
            
            // 久坐提醒相关
            postureCard: document.getElementById('posture-card'),
            postureStatus: document.getElementById('posture-status'),
            postureTime: document.getElementById('posture-time'),
            postureToggle: document.getElementById('posture-toggle'),
            postureReset: document.getElementById('posture-reset'),
            
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
    }

    /**
     * 绑定事件监听器
     * @private
     */
    bindEvents() {
        // 设置面板事件
        if (this.elements.settingsBtn) {
            this.elements.settingsBtn.addEventListener('click', this.handleSettingsToggle);
        }
        
        if (this.elements.settingsClose) {
            this.elements.settingsClose.addEventListener('click', this.handleSettingsToggle);
        }
        
        // 帮助面板事件
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener('click', this.handleHelpToggle);
        }
        
        if (this.elements.helpClose) {
            this.elements.helpClose.addEventListener('click', this.handleHelpToggle);
        }
        
        // 通知弹窗事件
        if (this.elements.notificationConfirm) {
            this.elements.notificationConfirm.addEventListener('click', () => {
                this.hideNotificationModal();
                if (this.currentNotification && this.currentNotification.onConfirm) {
                    this.currentNotification.onConfirm();
                }
            });
        }
        
        if (this.elements.notificationSnooze) {
            this.elements.notificationSnooze.addEventListener('click', () => {
                this.hideNotificationModal();
                if (this.currentNotification && this.currentNotification.onSnooze) {
                    this.currentNotification.onSnooze();
                }
            });
        }
    }

    /**
     * 设置初始UI状态
     * @private
     */
    setupInitialState() {
        // 待实现
    }

    /**
     * 更新提醒状态显示
     * @param {string} type - 'water' | 'posture'
     * @param {Object} status - 状态对象
     */
    updateReminderStatus(type, status) {
        // 待实现
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
        // 待实现
        return {};
    }

    /**
     * 将设置应用到UI
     * @param {Object} settings - 设置对象
     */
    applySettingsToUI(settings) {
        // 待实现
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
}