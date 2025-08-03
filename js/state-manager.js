/**
 * Unified State Manager - Centralized state management
 * Solves state management conflicts and duplicate save issues
 */
class StateManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.subscribers = new Map();
        this.stateCache = new Map();
        this.saveQueue = new Map();
        
        // Unified state structure
        this.stateSchema = {
            app: {
                isFirstUse: true,
                compatibilityChecked: false,
                lastSaved: 0
            },
            reminders: {
                water: {
                    isActive: false,
                    isPaused: false,
                    timeRemaining: 0,
                    nextReminderAt: 0,
                    settings: {
                        interval: 30,
                        enabled: true
                    }
                },
                standup: {
                    isActive: false,
                    isPaused: false,
                    timeRemaining: 0,
                    nextReminderAt: 0,
                    settings: {
                        interval: 45,
                        enabled: true
                    }
                }
            }
        };
        
        // Debounce configuration
        this.debounceConfig = {
            delay: 150,
            maxDelay: 1000
        };
    }

    /**
     * Initialize state manager
     */
    async initialize() {
        await this.loadAllStates();
        return this;
    }

    /**
     * Load all states
     * @private
     */
    async loadAllStates() {
        try {
            // Load application state
            const appState = this.storage.getItem('appState', this.stateSchema.app);
            this.stateCache.set('app', appState);
            
            // Load reminder states
            const waterState = this.storage.getItem('waterState', this.stateSchema.reminders.water);
            const standupState = this.storage.getItem('standupState', this.stateSchema.reminders.standup);
            
            this.stateCache.set('water', waterState);
            this.stateCache.set('standup', standupState);
            
            console.log('All states loaded:', {
                app: appState,
                water: waterState,
                standup: standupState
            });
            
        } catch (error) {
            console.error('Failed to load states:', error);
            this.resetToDefaults();
        }
    }

    /**
     * Get state (read-only)
     */
    getState(type) {
        if (type === 'app') {
            return { ...this.stateCache.get('app') };
        }
        
        const reminderState = this.stateCache.get(type);
        return reminderState ? { ...reminderState } : null;
    }

    /**
     * Update state - unified entry point to avoid duplicate saves
     */
    updateState(type, updates, options = {}) {
        try {
            const currentState = this.stateCache.get(type);
            if (!currentState) {
                throw new Error(`State type '${type}' not found`);
            }
            
            // Merge updates
            const newState = this.mergeState(currentState, updates);
            
            // Validate state
            if (!this.validateState(type, newState)) {
                console.warn('Invalid state update rejected:', type, updates);
                return false;
            }
            
            // Update cache
            this.stateCache.set(type, newState);
            
            // Debounce save
            this.scheduleSave(type, newState, options);
            
            // Notify subscribers
        this.notifySubscribers(type, newState);
            
            return true;
        } catch (error) {
            console.error('State update failed:', error);
            return false;
        }
    }

    /**
     * Merge state (deep merge)
     * @private
     */
    mergeState(current, updates) {
        if (typeof updates !== 'object' || updates === null) {
            return updates;
        }
        
        const merged = { ...current };
        
        for (const [key, value] of Object.entries(updates)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                merged[key] = this.mergeState(current[key] || {}, value);
            } else {
                merged[key] = value;
            }
        }
        
        return merged;
    }

    /**
     * Validate state
     * @private
     */
    validateState(type, state) {
        if (type === 'app') {
            return typeof state === 'object' && state !== null;
        }
        
        if (type === 'water' || type === 'standup') {
            return (
                typeof state === 'object' &&
                state !== null &&
                typeof state.isActive === 'boolean' &&
                typeof state.isPaused === 'boolean' &&
                typeof state.timeRemaining === 'number' &&
                state.timeRemaining >= 0 &&
                typeof state.settings === 'object' &&
                state.settings !== null
            );
        }
        
        return false;
    }

    /**
     * Debounce save mechanism
     * @private
     */
    scheduleSave(type, state, options) {
        const key = type;
        
        // Clear existing save queue
        if (this.saveQueue.has(key)) {
            clearTimeout(this.saveQueue.get(key));
        }
        
        // 立即保存或防抖保存
        const saveOperation = () => {
            try {
                this.storage.setItem(key, state, { immediate: true });
                
                // 更新最后保存时间
                if (type === 'app') {
                    state.lastSaved = Date.now();
                }
                
                console.log(`State saved: ${type}`);
                this.saveQueue.delete(key);
            } catch (error) {
                console.error('State save failed:', error);
            }
        };
        
        if (options.immediate) {
            saveOperation();
        } else {
            const timer = setTimeout(saveOperation, this.debounceConfig.delay);
            this.saveQueue.set(key, timer);
        }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        
        this.subscribers.get(type).add(callback);
        
        // Return current state immediately
        const currentState = this.getState(type);
        if (currentState) {
            callback(currentState, type);
        }
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(type);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Notify subscribers of state changes
     * @private
     */
    notifySubscribers(type, state) {
        const callbacks = this.subscribers.get(type);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(state, type);
                } catch (error) {
                    console.error('Subscriber callback error:', error);
                }
            });
        }
    }

    /**
     * Reset to default state
     */
    resetToDefaults() {
        this.stateCache.set('app', { ...this.stateSchema.app });
        this.stateCache.set('water', { ...this.stateSchema.reminders.water });
        this.stateCache.set('standup', { ...this.stateSchema.reminders.standup });
        
        // Save all states immediately
        this.stateCache.forEach((state, type) => {
            this.storage.setItem(type, state, { immediate: true });
        });
        
        console.log('All states reset to defaults');
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clear all pending save queues
        this.saveQueue.forEach(timer => clearTimeout(timer));
        this.saveQueue.clear();
        
        // 清空缓存
        this.stateCache.clear();
        this.subscribers.clear();
        
        console.log('State manager destroyed');
    }
}

// Export for browser use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}

window.StateManager = StateManager;