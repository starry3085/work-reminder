/**
 * 移动端适配器 - 处理浏览器兼容性和移动设备适配
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
        
        console.log('浏览器功能支持检测结果:', this.features);
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
        let browserName = "未知浏览器";
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
            
            console.log('已应用移动端适配');
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
                message: '本地存储不可用，设置将无法保存',
                solution: '使用内存存储'
            };
            
            // 报告错误
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    message: '本地存储不可用，设置将无法在会话结束后保存',
                    timestamp: Date.now()
                });
            }
        }
        
        if (!this.features.notifications) {
            result.fallbacks.notifications = {
                message: '浏览器通知不可用，将使用页面内通知',
                solution: '使用页面内通知'
            };
            
            // 报告错误
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    message: '浏览器通知不可用，将使用页面内通知',
                    timestamp: Date.now()
                });
            }
        }
        
        if (!this.features.audio) {
            result.fallbacks.audio = {
                message: '音频功能不可用，将使用静音通知',
                solution: '使用静音通知'
            };
            
            // 报告错误
            if (this.errorHandler) {
                this.errorHandler.handleError({
                    type: 'compatibility',
                    message: '音频功能不可用，将使用静音通知',
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
                    <h3>浏览器兼容性提示</h3>
                    <button class="btn-close" id="compatibility-close">✕</button>
                </div>
                <div class="compatibility-content">
                    <p>检测到您正在使用 ${browserInfo.name} ${browserInfo.version}，某些功能可能受限：</p>
                    <ul>
            `;
            
            // 添加不支持的功能
            if (!featureCheck.supported.localStorage) {
                noticeContent += `<li>本地存储不可用，您的设置将无法在会话结束后保存</li>`;
            }
            if (!featureCheck.supported.notifications) {
                noticeContent += `<li>浏览器通知不可用，将使用页面内通知代替</li>`;
            }
            if (!featureCheck.supported.audio) {
                noticeContent += `<li>音频功能不可用，提醒将不会播放声音</li>`;
            }
            
            noticeContent += `
                    </ul>
                    <p>为了获得最佳体验，建议使用最新版本的Chrome、Firefox、Safari或Edge浏览器。</p>
                </div>
                <div class="compatibility-footer">
                    <button class="btn-primary" id="compatibility-understand">我知道了</button>
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
                console.warn('未提供容器元素，无法显示兼容性提示');
            }
        }
    }
}

// 导出给其他脚本使用
window.MobileAdapter = MobileAdapter;