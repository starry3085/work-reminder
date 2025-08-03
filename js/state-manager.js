/**
 * Unified State Manager - Centralized state management
 * 统一状态管理器 - 解决状态管理冲突和重复保存问题
 */
class StateManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.subscribers = new Map();
        this.stateCache = new Map();
        this.saveQueue = new Map();
        
        // 统一的状态结构
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
        
        // 防抖配置
        this.debounceConfig = {
            delay: 150,
            maxDelay: 1000
        };
    }

    /**
     * 初始化状态管理器
     */
    async initialize() {
        await this.loadAllStates();
        return this;
    }

    /**
     * 加载所有状态
     * @private
     */
    async loadAllStates() {
        try {
            // 加载应用状态
            const appState = this.storage.getItem('appState', this.stateSchema.app);
            this.stateCache.set('app', appState);
            
            // 加载提醒状态
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
     * 获取状态（只读）
     */
    getState(type) {
        if (type === 'app') {
            return { ...this.stateCache.get('app') };
        }
        
        const reminderState = this.stateCache.get(type);
        return reminderState ? { ...reminderState } : null;
    }

    /**
     * 更新状态 - 统一入口，避免重复保存
     */
    updateState(type, updates, options = {}) {
        try {
            const currentState = this.stateCache.get(type);
            if (!currentState) {
                throw new Error(`State type '${type}' not found`);
            }
            
            // 合并更新
            const newState = this.mergeState(currentState, updates);
            
            // 验证状态
            if (!this.validateState(type, newState)) {
                console.warn('Invalid state update rejected:', type, updates);
                return false;
            }
            
            // 更新缓存
            this.stateCache.set(type, newState);
            
            // 防抖保存
            this.scheduleSave(type, newState, options);
            
            // 通知订阅者
            this.notifySubscribers(type, newState);
            
            return true;
        } catch (error) {
            console.error('State update failed:', error);
            return false;
        }
    }

    /**
     * 合并状态（深合并）
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
     * 验证状态
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
     * 防抖保存机制
     * @private
     */
    scheduleSave(type, state, options) {
        const key = type;
        
        // 清除现有的保存队列
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
     * 订阅状态变化
     */
    subscribe(type, callback) {
        if (!this.subscribers.has(type)) {
            this.subscribers.set(type, new Set());
        }
        
        this.subscribers.get(type).add(callback);
        
        // 立即返回当前状态
        const currentState = this.getState(type);
        if (currentState) {
            callback(currentState, type);
        }
        
        // 返回取消订阅函数
        return () => {
            const callbacks = this.subscribers.get(type);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * 通知订阅者状态变化
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
     * 重置为默认状态
     */
    resetToDefaults() {
        this.stateCache.set('app', { ...this.stateSchema.app });
        this.stateCache.set('water', { ...this.stateSchema.reminders.water });
        this.stateCache.set('standup', { ...this.stateSchema.reminders.standup });
        
        // 立即保存所有状态
        this.stateCache.forEach((state, type) => {
            this.storage.setItem(type, state, { immediate: true });
        });
        
        console.log('All states reset to defaults');
    }

    /**
     * 清理资源
     */
    destroy() {
        // 清除所有待保存的队列
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