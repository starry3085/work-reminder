/**
 * 存储管理器 - 管理浏览器本地存储操作
 * 负责localStorage的读写、错误处理和存储可用性检测
 */
class StorageManager {
    constructor() {
        this.storagePrefix = 'wellness_reminder_';
        this.isStorageAvailable = this.checkStorageAvailability();
        this.memoryStorage = new Map(); // 备用内存存储
    }

    /**
     * 检查localStorage是否可用
     * @returns {boolean} 存储是否可用
     */
    checkStorageAvailability() {
        try {
            const testKey = this.storagePrefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage不可用，将使用内存存储:', error);
            return false;
        }
    }

    /**
     * 保存设置到存储
     * @param {string} key - 存储键名
     * @param {any} data - 要保存的数据
     * @returns {boolean} 保存是否成功
     */
    saveSettings(key, data) {
        try {
            const fullKey = this.storagePrefix + key;
            const jsonData = JSON.stringify(data);
            
            if (this.isStorageAvailable) {
                localStorage.setItem(fullKey, jsonData);
            } else {
                // 使用内存存储作为备选
                this.memoryStorage.set(fullKey, jsonData);
            }
            
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            // 尝试使用内存存储
            try {
                const fullKey = this.storagePrefix + key;
                this.memoryStorage.set(fullKey, JSON.stringify(data));
                return true;
            } catch (memError) {
                console.error('内存存储也失败:', memError);
                return false;
            }
        }
    }

    /**
     * 从存储加载设置
     * @param {string} key - 存储键名
     * @returns {any|null} 加载的数据，失败时返回null
     */
    loadSettings(key) {
        try {
            const fullKey = this.storagePrefix + key;
            let jsonData = null;
            
            if (this.isStorageAvailable) {
                jsonData = localStorage.getItem(fullKey);
            } else {
                jsonData = this.memoryStorage.get(fullKey);
            }
            
            if (jsonData === null || jsonData === undefined) {
                return null;
            }
            
            return JSON.parse(jsonData);
        } catch (error) {
            console.error('加载设置失败:', error);
            return null;
        }
    }

    /**
     * 清除所有应用数据
     * @returns {boolean} 清除是否成功
     */
    clearAllData() {
        try {
            if (this.isStorageAvailable) {
                // 清除所有以应用前缀开头的localStorage项
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.storagePrefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            // 清除内存存储
            this.memoryStorage.clear();
            
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }

    /**
     * 检查存储是否可用
     * @returns {boolean} 存储可用性状态
     */
    isAvailable() {
        return this.isStorageAvailable;
    }

    /**
     * 获取存储使用情况（仅localStorage）
     * @returns {object} 存储使用信息
     */
    getStorageInfo() {
        if (!this.isStorageAvailable) {
            return {
                available: false,
                used: this.memoryStorage.size,
                type: 'memory'
            };
        }

        try {
            let totalSize = 0;
            let appSize = 0;
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length;
                    totalSize += size;
                    
                    if (key.startsWith(this.storagePrefix)) {
                        appSize += size;
                    }
                }
            }
            
            return {
                available: true,
                totalUsed: totalSize,
                appUsed: appSize,
                type: 'localStorage'
            };
        } catch (error) {
            console.error('获取存储信息失败:', error);
            return {
                available: false,
                error: error.message,
                type: 'localStorage'
            };
        }
    }

    /**
     * 备份所有应用数据
     * @returns {object|null} 备份数据对象
     */
    backupData() {
        try {
            const backup = {};
            
            if (this.isStorageAvailable) {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.storagePrefix)) {
                        const shortKey = key.replace(this.storagePrefix, '');
                        backup[shortKey] = JSON.parse(localStorage.getItem(key));
                    }
                }
            } else {
                // 从内存存储备份
                this.memoryStorage.forEach((value, key) => {
                    if (key.startsWith(this.storagePrefix)) {
                        const shortKey = key.replace(this.storagePrefix, '');
                        backup[shortKey] = JSON.parse(value);
                    }
                });
            }
            
            return backup;
        } catch (error) {
            console.error('备份数据失败:', error);
            return null;
        }
    }

    /**
     * 恢复备份数据
     * @param {object} backupData - 备份数据对象
     * @returns {boolean} 恢复是否成功
     */
    restoreData(backupData) {
        try {
            if (!backupData || typeof backupData !== 'object') {
                throw new Error('无效的备份数据');
            }
            
            for (const [key, value] of Object.entries(backupData)) {
                this.saveSettings(key, value);
            }
            
            return true;
        } catch (error) {
            console.error('恢复数据失败:', error);
            return false;
        }
    }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}