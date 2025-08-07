/**
 * Storage Manager - Simple localStorage wrapper
 * Basic read/write operations for app settings
 */
class StorageManager {
    constructor() {
        this.STORAGE_PREFIX = 'wellness-reminder';
        this.isStorageAvailable = this.checkStorageAvailability();
        this.memoryStorage = new Map(); // Fallback memory storage
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Whether storage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = this.STORAGE_PREFIX + '.test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage unavailable, will use memory storage:', error);
            return false;
        }
    }

    /**
     * Save data to storage (unified API)
     * @param {string} key - Storage key name
     * @param {any} data - Data to save
     * @returns {boolean} Whether save was successful
     */
    saveSettings(key, data) {
        return this.setItem(key, data);
    }

    /**
     * Load data from storage (unified API)
     * @param {string} key - Storage key name
     * @returns {any|null} Loaded data, returns null on failure
     */
    loadSettings(key) {
        return this.getItem(key);
    }

    /**
     * Clear all application data
     * @returns {boolean} Whether clearing was successful
     */
    clearAllData() {
        try {
            if (this.isStorageAvailable) {
                // Clear all localStorage items that start with the app prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.STORAGE_PREFIX)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            // Clear memory storage
            this.memoryStorage.clear();
            
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Check if storage is available
     * @returns {boolean} Storage availability status
     */
    isAvailable() {
        return this.isStorageAvailable;
    }

    /**
     * Get storage usage information (localStorage only)
     * @returns {object} Storage usage information
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
                    
                    if (key.startsWith(this.STORAGE_PREFIX)) {
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
            console.error('Failed to get storage information:', error);
            return {
                available: false,
                error: error.message,
                type: 'localStorage'
            };
        }
    }

    /**
     * Generate storage key with unified naming convention
     * @private
     */
    generateStorageKey(key) {
        const keyStr = String(key || '');
        return `${this.STORAGE_PREFIX}.${keyStr}`;
    }

    /**
     * Save data to storage (setItem API)
     * @param {string} key - Storage key name
     * @param {any} data - Data to save
     * @returns {boolean} Whether save was successful
     */
    setItem(key, data) {
        try {
            if (this.isStorageAvailable) {
                const fullKey = this.generateStorageKey(key);
                localStorage.setItem(fullKey, JSON.stringify(data));
            } else {
                // Use memory storage as fallback
                this.memoryStorage.set(key, data);
            }
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    }

    /**
     * Load data from storage (getItem API)
     * @param {string} key - Storage key name
     * @returns {any|null} Loaded data, returns null on failure
     */
    getItem(key) {
        try {
            if (this.isStorageAvailable) {
                const fullKey = this.generateStorageKey(key);
                const data = localStorage.getItem(fullKey);
                return data ? JSON.parse(data) : null;
            } else {
                // Use memory storage as fallback
                return this.memoryStorage.get(key) || null;
            }
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return null;
        }
    }

    /**
     * Remove item from storage
     * @param {string} key - Storage key name
     * @returns {boolean} Whether removal was successful
     */
    removeItem(key) {
        try {\            if (this.isStorageAvailable) {\                const fullKey = this.generateStorageKey(key);
                localStorage.removeItem(fullKey);
            } else {
                this.memoryStorage.delete(key);
            }
            return true;
        } catch (error) {
            console.error('Failed to remove from storage:', error);
            return false;
        }
    }

    /**
     * Clear all application data
     * @returns {boolean} Whether clearing was successful
     */
    clearAllData() {
        try {
            if (this.isStorageAvailable) {
                // Clear all localStorage items that start with the app prefix
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith(this.STORAGE_PREFIX)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            
            // Clear memory storage
            this.memoryStorage.clear();
            
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }
}

// Export for browser use
window.StorageManager = StorageManager;