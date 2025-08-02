/**
 * Mobile Adapter - Simplified browser compatibility and mobile device adaptation
 */
class MobileAdapter {
    constructor(errorHandler) {
        this.errorHandler = errorHandler || (window.ErrorHandler ? new window.ErrorHandler() : null);
        this.features = {
            localStorage: this.isLocalStorageAvailable(),
            notifications: 'Notification' in window,
            audio: 'Audio' in window
        };
        
        console.log('Browser feature support:', this.features);
    }

    /**
     * Check if local storage is available
     * @returns {boolean} Whether local storage is available
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
     * Detect if current device is mobile
     * @returns {boolean} 是否为移动设备
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }

    /**
     * 应用移动端适配
     */
    applyMobileAdaptation() {
        if (this.isMobileDevice()) {
            document.body.classList.add('mobile-device');
            console.log('Mobile adaptation applied');
        }
    }

    /**
     * 检查功能支持
     * @returns {Object} 功能支持状态
     */
    checkFeatures() {
        return { ...this.features };
    }
}

// 导出给其他脚本使用
window.MobileAdapter = MobileAdapter;