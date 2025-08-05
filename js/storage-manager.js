/**
 * Storage Manager - Manages browser local storage operations
 * Responsible for localStorage read/write, error handling, and storage availability detection
 */
class StorageManager {
    constructor() {
        this.STORAGE_PREFIX = 'wellness-reminder';
        this.STORAGE_VERSION = '1.0.0';
        this.storageKeys = {
            // Reserved keys for AppSettings (to avoid conflicts with StateManager)
            'app-settings': 'app-settings-v1',
            'app-state': 'app-state-v1',
            // Keep these keys for backward compatibility
            'water-settings': 'water-reminder-settings',
            'standup-settings': 'standup-reminder-settings',
            'water-state': 'water-reminder-state',
            'standup-state': 'standup-reminder-state'
        };
        this.isStorageAvailable = this.checkStorageAvailability();
        this.memoryStorage = new Map(); // Backup memory storage
        this.pendingSaves = new Map(); // Debounce pending saves
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
        const normalizedKey = this.storageKeys[keyStr] || keyStr.replace(/_/g, '-');
        return `${this.STORAGE_PREFIX}.${normalizedKey}`;
    }

    /**
     * Set item to storage with debounced batching
     * @param {string} key - Storage key name (without prefix)
     * @param {any} data - Data to save
     * @param {Object} options - Save options
     * @returns {boolean} Whether save was successful
     */
    setItem(key, data, options = {}) {
        try {
            const fullKey = this.generateStorageKey(key);
            const storageData = {
                data,
                timestamp: Date.now(),
                version: this.STORAGE_VERSION
            };
            const jsonData = JSON.stringify(storageData);
            
            // Clear existing pending save
            if (this.pendingSaves.has(fullKey)) {
                clearTimeout(this.pendingSaves.get(fullKey));
            }
            
            const saveOperation = () => {
                try {
                    if (this.isStorageAvailable) {
                        localStorage.setItem(fullKey, jsonData);
                    } else {
                        this.memoryStorage.set(fullKey, jsonData);
                    }
                } catch (error) {
                    console.error('Failed to save to storage:', error);
                    this.memoryStorage.set(fullKey, jsonData);
                }
            };
            
            if (options.immediate) {
                saveOperation();
            } else {
                const timer = setTimeout(saveOperation, 100);
                this.pendingSaves.set(fullKey, timer);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to prepare save:', error);
            return false;
        }
    }

    /**
     * Get item from storage with version checking
     * @param {string} key - Storage key name (without prefix)
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Loaded data or default value
     */
    getItem(key, defaultValue = null) {
        try {
            const fullKey = this.generateStorageKey(key);
            let jsonData = null;
            
            if (this.isStorageAvailable) {
                jsonData = localStorage.getItem(fullKey);
            } else {
                jsonData = this.memoryStorage.get(fullKey);
            }
            
            if (jsonData === null || jsonData === undefined) {
                return defaultValue;
            }
            
            const parsed = JSON.parse(jsonData);
            
            // Version compatibility check
            if (parsed.version !== this.STORAGE_VERSION) {
                console.warn(`Storage version mismatch for key: ${key}`);
                return this.migrateStorageData(key, parsed, defaultValue);
            }
            
            return parsed.data;
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return defaultValue;
        }
    }



    /**
     * Migrate storage data when version mismatch occurs
     * @private
     */
    migrateStorageData(key, oldData, defaultValue) {
        try {
            // Simple migration: just return data if structure is compatible
            if (oldData && typeof oldData.data === 'object') {
                return oldData.data;
            }
        } catch (error) {
            console.error('Migration failed:', error);
        }
        return defaultValue;
    }

    /**
     * Save state with unified key mapping
     * @param {string} type - Reminder type ('water' | 'standup')
     * @param {Object} state - State object
     */
    saveState(type, state) {
        const key = type === 'water' ? 'waterState' : 'standupState';
        this.setItem(key, state, { immediate: false });
    }

    /**
     * Load state with unified key mapping
     * @param {string} type - Reminder type ('water' | 'standup')
     * @returns {Object|null} State object
     */
    loadState(type) {
        const key = type === 'water' ? 'waterState' : 'standupState';
        return this.getItem(key, {});
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
                    if (key && key.startsWith(this.STORAGE_PREFIX)) {
                        const shortKey = key.replace(this.STORAGE_PREFIX, '');
                        backup[shortKey] = JSON.parse(localStorage.getItem(key));
                    }
                }
            } else {
                // Backup from memory storage
                this.memoryStorage.forEach((value, key) => {
                    if (key.startsWith(this.STORAGE_PREFIX)) {
                    const shortKey = key.replace(this.STORAGE_PREFIX, '');
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
                this.setItem(key, value.data || value, { immediate: true });
            }
            
            return true;
        } catch (error) {
            console.error('Failed to restore data:', error);
            return false;
        }
    }
}

// Export for browser use
window.StorageManager = StorageManager;