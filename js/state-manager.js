/**
 * Unified State Manager - Centralized state management
 * Solves state management conflicts and duplicate save issues
 * 
 * Architecture:
 * - Single source of truth for all application state
 * - Atomic state updates with anti-circulation mechanisms
 * - Standardized key naming conventions
 * - Unified time unit handling (milliseconds internally)
 * - Comprehensive error handling and recovery
 */
class StateManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.subscribers = new Map();
        this.stateCache = new Map();
        this.isUpdatingFromState = new Map(); // Per-type update flags
        this.updateQueues = new Map(); // Prevent race conditions
        
        // Standardized state structure for MVP
        this.stateSchema = {
            app: {
                isFirstUse: true,
                compatibilityChecked: false,
                notifications: {
                    browserNotifications: true,
                    soundEnabled: true,
                    style: 'standard'
                },
                appearance: {
                    language: 'en-US'
                }
            },
            water: {
                isActive: false,
                timeRemaining: 0, // milliseconds
                nextReminderAt: 0, // timestamp
                settings: {
                    interval: 30, // minutes (UI unit)
                    enabled: true,
                    sound: true,
                    lastReminder: null
                }
            },
            standup: {
                isActive: false,
                timeRemaining: 0, // milliseconds
                nextReminderAt: 0, // timestamp
                settings: {
                    interval: 30, // minutes (UI unit)
                    enabled: true,
                    sound: true,
                    lastReminder: null
                }
            }
        };

        // Standardized storage keys - prevent conflicts
        this.storageKeys = {
            app: 'app-state-v2',
            water: 'water-state-v2',
            standup: 'standup-state-v2'
        };
    }

    /**
     * Initialize state manager
     * @returns {Promise<StateManager>} Promise that resolves when initialization is complete
     */
    async initialize() {
        await this.loadAllStates();
        this.cleanupInterval = setInterval(() => this.cleanupOldStates(), 300000); // 5 minutes
        return this;
    }

    /**
     * Load all states with migration handling
     * @private
     */
    async loadAllStates() {
        try {
            for (const [type, key] of Object.entries(this.storageKeys)) {
                const state = await this.loadStateWithMigration(type, key);
                this.stateCache.set(type, state);
            }
            console.log('All states loaded successfully with migration handling');
        } catch (error) {
            console.error('Failed to load states:', error);
            this.resetToDefaults();
        }
    }

    /**
     * Load state with migration from old keys
     * @private
     */
    async loadStateWithMigration(type, key) {
        try {
            // Try new key first
            let state = this.storage.getItem(key, this.stateSchema[type]);
            
            // If not found, try old keys for migration
            if (!state || Object.keys(state).length === 0) {
                const oldKey = this.getOldStorageKey(type);
                if (oldKey) {
                    state = this.storage.getItem(oldKey, this.stateSchema[type]);
                    if (state && Object.keys(state).length > 0) {
                        console.log(`Migrated ${type} state from old key: ${oldKey}`);
                        // Save to new key
                        this.storage.setItem(key, state, { immediate: true });
                    }
                }
            }
            
            return state || { ...this.stateSchema[type] };
        } catch (error) {
            console.error(`Failed to load ${type} state:`, error);
            return { ...this.stateSchema[type] };
        }
    }

    /**
     * Get old storage key for migration
     * @private
     */
    getOldStorageKey(type) {
        const oldKeys = {
            app: 'app-settings-v1',
            water: 'water-reminder-settings',
            standup: 'standup-reminder-settings'
        };
        return oldKeys[type];
    }

    /**
     * Update state with atomic operations and anti-circulation
     * @param {string} type - State type ('app', 'water', 'standup')
     * @param {Object} updates - State updates
     * @param {boolean} silent - Don't notify subscribers
     */
    updateState(type, updates, silent = false) {
        if (!type || !updates || typeof updates !== 'object') {
            console.warn('Invalid state update parameters');
            return false;
        }

        // Prevent concurrent updates
        if (this.isUpdatingFromState.get(type)) {
            console.warn(`State update blocked for ${type} - already updating`);
            return false;
        }

        try {
            // Atomic update operation
            this.isUpdatingFromState.set(type, true);
            
            // Queue update to prevent race conditions
            if (!this.updateQueues.has(type)) {
                this.updateQueues.set(type, []);
            }
            
            this.updateQueues.get(type).push(updates);
            this.processUpdateQueue(type, silent);
            
            return true;
        } catch (error) {
            console.error(`Failed to update ${type} state:`, error);
            return false;
        } finally {
            this.isUpdatingFromState.set(type, false);
        }
    }

    /**
     * Process update queue to ensure sequential updates
     * @private
     */
    processUpdateQueue(type, silent) {
        const queue = this.updateQueues.get(type);
        if (!queue || queue.length === 0) return;

        // Process all queued updates as a single batch
        let currentState = this.stateCache.get(type) || { ...this.stateSchema[type] };
        
        while (queue.length > 0) {
            const updates = queue.shift();
            currentState = this.deepMerge(currentState, updates);
        }

        // Validate state structure
        currentState = this.validateStateStructure(type, currentState);
        
        // Update cache
        this.stateCache.set(type, currentState);
        
        // Save to storage
        this.saveStateType(type, currentState);
        
        // Notify subscribers
        if (!silent) {
            this.notifySubscribers(type, currentState);
        }
    }

    /**
     * Deep merge objects while preserving structure
     * @private
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Validate state structure against schema
     * @private
     */
    validateStateStructure(type, state) {
        const schema = this.stateSchema[type];
        if (!schema) return state;

        // Ensure required structure
        const validated = { ...state };
        
        // Validate time units
        if (type === 'water' || type === 'standup') {
            if (typeof validated.settings?.interval === 'string') {
                validated.settings.interval = parseInt(validated.settings.interval, 10);
            }
            
            // Ensure timeRemaining is in milliseconds
            if (validated.timeRemaining && validated.timeRemaining < 60000) {
                // Likely already in milliseconds, but validate
                validated.timeRemaining = Math.max(0, validated.timeRemaining);
            }
        }

        return validated;
    }

    /**
     * Get current state
     * @param {string} type - State type
     * @returns {Object} Current state
     */
    getState(type) {
        return this.stateCache.get(type) || { ...this.stateSchema[type] };
    }

    /**
     * Subscribe to state changes
     * @param {string} type - State type to subscribe to
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        
        this.subscribers.get(type).add(callback);
        
        // Return unsubscribe function
        return () => {
            if (this.subscribers.has(type)) {
                this.subscribers.get(type).delete(callback);
            }
        };
    }

    /**
     * Notify subscribers of state changes
     * @private
     */
    notifySubscribers(type, state) {
        const callbacks = this.subscribers.get(type);
        if (!callbacks) return;

        // Use microtask to prevent synchronous update loops
        queueMicrotask(() => {
            callbacks.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error(`Error in ${type} state subscriber:`, error);
                }
            });
        });
    }

    /**
     * Save specific state type to storage
     * @private
     */
    saveStateType(type, state) {
        try {
            const key = this.storageKeys[type];
            if (key) {
                this.storage.setItem(key, state);
            }
        } catch (error) {
            console.error(`Failed to save ${type} state:`, error);
        }
    }

    /**
     * Save all states to storage
     * @returns {boolean} Success status
     */
    saveState() {
        try {
            this.stateCache.forEach((state, type) => {
                this.saveStateType(type, state);
            });
            console.log('All states saved via StateManager');
            return true;
        } catch (error) {
            console.error('Failed to save states:', error);
            return false;
        }
    }

    /**
     * Reset to default state
     */
    resetToDefaults() {
        try {
            for (const [type, schema] of Object.entries(this.stateSchema)) {
                const defaultState = { ...schema };
                this.stateCache.set(type, defaultState);
                this.saveStateType(type, defaultState);
                this.notifySubscribers(type, defaultState);
            }
            
            console.log('All states reset to defaults via StateManager');
        } catch (error) {
            console.error('Failed to reset to defaults:', error);
        }
    }

    /**
     * Cleanup old states and resources
     * @private
     */
    cleanupOldStates() {
        // Clean up update queues
        for (const [type, queue] of this.updateQueues.entries()) {
            if (queue.length === 0) {
                this.updateQueues.delete(type);
            }
        }
        
        // Clean up update flags
        for (const [type, flag] of this.isUpdatingFromState.entries()) {
            if (!flag) {
                this.isUpdatingFromState.delete(type);
            }
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        try {
            // Save final state before cleanup
            this.saveState();
            
            // Clear timers
            if (this.cleanupInterval) {
                clearInterval(this.cleanupInterval);
            }
            
            // Clear caches
            this.stateCache.clear();
            this.subscribers.clear();
            this.isUpdatingFromState.clear();
            this.updateQueues.clear();
            
            console.log('State manager destroyed and cleaned up');
        } catch (error) {
            console.error('Error during state manager cleanup:', error);
        }
    }
}

// Export for browser use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}

window.StateManager = StateManager;