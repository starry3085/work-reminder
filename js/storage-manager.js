/**
 * Storage Manager - Manages browser local storage operations
 * Responsible for localStorage read/write, error handling, and storage availability detection
 */
class StorageManager {
    constructor() {
        this.storagePrefix = 'wellness_reminder_';
        this.isStorageAvailable = this.checkStorageAvailability();
        this.memoryStorage = new Map(); // Backup memory storage
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Whether storage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = this.storagePrefix + 'test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage unavailable, will use memory storage:', error);
            return false;
        }
    }

    /**
     * Save settings to storage
     * @param {string} key - Storage key name
     * @param {any} data - Data to save
     * @returns {boolean} Whether save was successful
     */
    saveSettings(key, data) {
        try {
            const fullKey = this.storagePrefix + key;
            const jsonData = JSON.stringify(data);
            
            if (this.isStorageAvailable) {
                localStorage.setItem(fullKey, jsonData);
            } else {
                // Use memory storage as fallback
                this.memoryStorage.set(fullKey, jsonData);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            // Try using memory storage
            try {
                const fullKey = this.storagePrefix + key;
                this.memoryStorage.set(fullKey, JSON.stringify(data));
                return true;
            } catch (memError) {
                console.error('Memory storage also failed:', memError);
                return false;
            }
        }
    }

    /**
     * Load settings from storage
     * @param {string} key - Storage key name
     * @returns {any|null} Loaded data, returns null on failure
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
            console.error('Failed to load settings:', error);
            return null;
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
                    if (key && key.startsWith(this.storagePrefix)) {
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
            console.error('Failed to get storage information:', error);
            return {
                available: false,
                error: error.message,
                type: 'localStorage'
            };
        }
    }

    /**
     * Backup all application data
     * @returns {object|null} Backup data object
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
                // Backup from memory storage
                this.memoryStorage.forEach((value, key) => {
                    if (key.startsWith(this.storagePrefix)) {
                        const shortKey = key.replace(this.storagePrefix, '');
                        backup[shortKey] = JSON.parse(value);
                    }
                });
            }
            
            return backup;
        } catch (error) {
            console.error('Failed to backup data:', error);
            return null;
        }
    }

    /**
     * Restore backup data
     * @param {object} backupData - Backup data object
     * @returns {boolean} Whether restoration was successful
     */
    restoreData(backupData) {
        try {
            if (!backupData || typeof backupData !== 'object') {
                throw new Error('Invalid backup data');
            }
            
            for (const [key, value] of Object.entries(backupData)) {
                this.saveSettings(key, value);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to restore data:', error);
            return false;
        }
    }
}

// Export class for use by other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}