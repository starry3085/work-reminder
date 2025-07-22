/**
 * Mobile Adapter - Handles browser compatibility and mobile device adaptation
 */
class MobileAdapter {
    constructor(errorHandler) {
        this.errorHandler = errorHandler || (window.ErrorHandler ? new window.ErrorHandler() : null);
        this.features = {
            localStorage: false,
            notifications: false,
            audio: false,
            serviceWorker: false,
            pageVisibility: false,
            touchEvents: false
        };
        
        // 检测浏览器功能支持
        this.detectFeatures();
    }

    /**
     * 检测浏览器功能支持
     * @private
     */
    detectFeatures() {
        // 检测本地存储支持
        this.features.localStorage = this.isLocalStorageAvailable();
        
        // 检测通知API支持
        this.features.notifications = 'Notification' in window;
        
        // 检测音频支持
        this.features.audio = 'Audio' in window;
        
        // 检测Service Worker支持
        this.features.serviceWorker = 'serviceWorker' in navigator;
        
        // 检测页面可见性API支持
        this.features.pageVisibility = 'hidden' in document;
        
        // 检测触摸事件支持
        this.features.touchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        console.log('Browser feature support detection results:', this.features);
    }

    /**
     * 检测本地存储是否可用
     * @returns {boolean} 是否可用
     * @private
     */
    isLocalStorageAvailable() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            const result = localStorage.getItem(testKey) === testKey;
            localStorage.removeItem(testKey);
            return result;
        } catch (e) {
            return false;
        }
    }

    /**
     * 检测是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }

    /**
     * 检测是否为iOS设备
     * @returns {boolean} 是否为iOS设备
     */
    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * 检测是否为Android设备
     * @returns {boolean} 是否为Android设备
     */
    isAndroidDevice() {
        return /Android/i.test(navigator.userAgent);
    }

    /**
     * 获取浏览器信息
     * @returns {Object} 浏览器信息
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browserName = "Unknown Browser";
        let browserVersion = "";
        
        // 检测常见浏览器
        if (ua.indexOf("Firefox") > -1) {
            browserName = "Firefox";
            browserVersion = ua.match(/Firefox\/([\d.]+)/)[1];
        } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
            browserName = "Edge";
            browserVersion = ua.match(/Edge?\/([\d.]+)/)[1];
        } else if (ua.indexOf("Chrome") > -1) {
            browserName = "Chrome";
            browserVersion = ua.match(/Chrome\/([\d.]+)/)[1];
        } else if (ua.indexOf("Safari") > -1) {
            browserName = "Safari";
            browserVersion = ua.match(/Version\/([\d.]+)/)[1];
        } else if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) {
            browserName = "Internet Explorer";
            browserVersion = ua.match(/(?:MSIE |rv:)([\d.]+)/)[1];
        }
        
        return {
            name: browserName,
            version: browserVersion,
            userAgent: ua,
            isMobile: this.isMobileDevice(),
            isIOS: this.isIOSDevice(),
            isAndroid: this.isAndroidDevice()
        };
    }

    /**
     * 应用移动端适配
     */
    applyMobileAdaptation() {
        if (this.isMobileDevice()) {
            // 添加移动端类名到body
            document.body.classList.add('mobile-device');
            
            // 如果是iOS设备，添加特定类名
            if (this.isIOSDevice()) {
                document.body.classList.add('ios-device');
            }
            
            // 如果是Android设备，添加特定类名
            if (this.isAndroidDevice()) {
                document.body.classList.add('android-device');
            }
            
            // 处理iOS上的特殊问题
            if (this.isIOSDevice()) {
                this.handleIOSSpecifics();
            }
            
            console.log('Mobile adaptation applied');
        }
    }

    /**
     * 处理iOS特定问题
     * @private
     */
    handleIOSSpecifics() {
        // 处理iOS上的音频自动播放限制
        document.addEventListener('touchstart', () => {
            // 创建并立即暂停一个空的音频上下文，解锁音频
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const emptyBuffer = audioContext.createBuffer(1, 1, 22050);
            const source = audioContext.createBufferSource();
            source.buffer = emptyBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            source.stop(0);
            
            // 移除事件监听器
            document.removeEventListener('touchstart', arguments.callee);
        }, { once: true });
    }

    /**
     * 检查功能支持并提供替代方案
     * @returns {Object} 功能支持状态和替代方案
     */
    checkFeaturesAndFallbacks() {
        const result = {
            supported: { ...this.features },
            fallbacks: {}
        };
        
        // 为不支持的功能提供替代方案
        if (!this.features.localStorage) {
            result.fallbacks.localStorage = {
                message: 'Local storage unavailable, settings cannot be saved',
                solution: 'Using memory storage'
            };
            
            // 报告错误
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    message: 'Local storage unavailable, settings cannot be saved after session ends',
                    timestamp: Date.now()
                });
            }
        }
        
        if (!this.features.notifications) {
            result.fallbacks.notifications = {
                message: 'Browser notifications unavailable, will use in-page notifications',
                solution: 'Using in-page notifications'
            };
            
            // 报告错误
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    message: 'Browser notifications unavailable, will use in-page notifications',
                    timestamp: Date.now()
                });
            }
        }
        
        if (!this.features.audio) {
            result.fallbacks.audio = {
                message: 'Audio functionality unavailable, will use silent notifications',
                solution: 'Using silent notifications'
            };
            
            // 报告错误
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    message: 'Audio functionality unavailable, will use silent notifications',
                    timestamp: Date.now()
                });
            }
        }
        
        return result;
    }

    /**
     * 显示浏览器兼容性提示
     * @param {HTMLElement} container - 显示提示的容器元素
     */
    showCompatibilityNotice(container) {
        const browserInfo = this.getBrowserInfo();
        const featureCheck = this.checkFeaturesAndFallbacks();
        
        // 检查是否有不支持的关键功能
        const hasUnsupportedFeatures = Object.values(featureCheck.supported).includes(false);
        
        if (hasUnsupportedFeatures) {
            // 创建提示元素
            const noticeElement = document.createElement('div');
            noticeElement.className = 'compatibility-notice';
            
            let noticeContent = `
                <div class="compatibility-header">
                    <h3>Browser Compatibility Notice</h3>
                    <button class="btn-close" id="compatibility-close">X</button>
                </div>
                <div class="compatibility-content">
                    <p>You are using ${browserInfo.name} ${browserInfo.version}, some features may be limited:</p>
                    <ul>
            `;
            
            // 添加不支持的功能
            if (!featureCheck.supported.localStorage) {
                noticeContent += `<li>Local storage unavailable, your settings cannot be saved after session ends</li>`;
            }
            if (!featureCheck.supported.notifications) {
                noticeContent += `<li>Browser notifications unavailable, will use in-page notifications instead</li>`;
            }
            if (!featureCheck.supported.audio) {
                noticeContent += `<li>Audio functionality unavailable, reminders will not play sounds</li>`;
            }
            
            noticeContent += `
                    </ul>
                    <p>For the best experience, we recommend using the latest version of Chrome, Firefox, Safari, or Edge.</p>
                </div>
                <div class="compatibility-footer">
                    <button class="btn-primary" id="compatibility-understand">I Understand</button>
                </div>
            `;
            
            noticeElement.innerHTML = noticeContent;
            
            // 添加到容器
            if (container) {
                container.appendChild(noticeElement);
                
                // 添加事件监听
                document.getElementById('compatibility-close').addEventListener('click', () => {
                    noticeElement.remove();
                });
                
                document.getElementById('compatibility-understand').addEventListener('click', () => {
                    noticeElement.remove();
                });
            } else {
                console.warn('No container element provided, cannot display compatibility notice');
            }
        }
    }
}

// 导出给其他脚本使用
window.MobileAdapter = MobileAdapter;