/**
 * Unified State Manager - Centralized state management
 * Solves state management conflicts and duplicate save issues
 */
class StateManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.subscribers = new Map();
        this.stateCache = new Map();
        
        // Simplified state structure for MVP
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
                isPaused: false,
                timeRemaining: 0,
                nextReminderAt: 0,
                settings: {
                    interval: 30,
                    enabled: true,
                    sound: true,
                    lastReminder: null
                }
            },
            standup: {
                isActive: false,
                isPaused: false,
                timeRemaining: 0,
                nextReminderAt: 0,
                settings: {
                    interval: 30,
                    enabled: true,
                    sound: true,
                    lastReminder: null
                }
            }
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
            // Load states directly
            const appState = this.storage.getItem('app', this.stateSchema.app);
            const waterState = this.storage.getItem('water', this.stateSchema.water);
            const standupState = this.storage.getItem('standup', this.stateSchema.standup);
            
            this.stateCache.set('app', appState);
            this.stateCache.set('water', waterState);
            this.stateCache.set('standup', standupState);
            
            console.log('States loaded successfully');
            
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
     * Update state - simplified for MVP
     */
    updateState(type, updates) {
        try {
            const currentState = this.stateCache.get(type);
            if (!currentState) {
                throw new Error(`State type '${type}' not found`);
            }
            
            // Merge updates
            const newState = this.mergeState(currentState, updates);
            
            // Update cache
            this.stateCache.set(type, newState);
            
            // Save immediately
            this.storage.setItem(type, newState);
            
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
        // Reset to schema defaults
        this.stateCache.set('app', { ...this.stateSchema.app });
        this.stateCache.set('water', { ...this.stateSchema.water });
        this.stateCache.set('standup', { ...this.stateSchema.standup });
        
        // Save all states immediately
        this.stateCache.forEach((state, type) => {
            this.storage.setItem(type, state, { immediate: true });
            // Notify subscribers of reset
            this.notifySubscribers(type, state);
        });
        
        console.log('All states reset to defaults via StateManager');
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clear cache
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