---
inclusion: always
---

# State Management Design Principles

## Core Principle: Single Source of Truth

The application MUST follow a single source of truth pattern for state management to prevent data conflicts and ensure consistency.

## Architecture Decision

**StateManager is the ONLY authoritative source for all application state.**

### What StateManager Manages
- All reminder states (water, standup)
- All user settings (intervals, enabled status)
- Application state (first use, compatibility flags)
- Persistence to localStorage

### What Other Components Do
- **AppSettings**: ONLY provides validation and default values
- **ReminderManager**: ONLY manages timers and business logic
- **UIController**: ONLY handles UI updates and user interactions

## Critical Rules

### ❌ NEVER DO THIS
```javascript
// AppSettings trying to save state directly
this.stateManager.updateState('water', { settings: newSettings });

// Multiple components saving the same data
this.storageManager.saveSettings('water', settings);
this.stateManager.updateState('water', { settings: settings });
```

### ✅ ALWAYS DO THIS
```javascript
// Only StateManager updates state
stateManager.updateState('water', { 
    settings: { interval: 30 },
    isActive: true 
});

// Other components subscribe to changes
stateManager.subscribe('water', (state) => {
    this.updateUI(state);
});
```

## Data Flow Pattern

```
User Action → UIController → App → StateManager → Storage
                                      ↓
UI Updates ← UIController ← Subscribers ← StateManager
```

## Implementation Guidelines

### StateManager Responsibilities
- Maintain single state cache
- Handle all persistence operations
- Notify subscribers of changes
- Validate state updates
- Provide read-only state access

### AppSettings Responsibilities (Simplified)
- Provide default settings structure
- Validate settings format
- NO direct state management
- NO direct storage operations

### Component Integration
- Components subscribe to StateManager for updates
- Components request changes through StateManager only
- No direct localStorage access outside StateManager

## MVP Compliance

This design follows MVP principles by:
- Eliminating complexity from duplicate state systems
- Providing single, predictable data flow
- Reducing debugging complexity
- Ensuring data consistency

## Migration Strategy

1. Remove all direct storage operations from AppSettings
2. Remove duplicate state management logic
3. Ensure all state changes go through StateManager
4. Update components to use subscription pattern only

## Testing Strategy

- Verify only StateManager writes to localStorage
- Confirm state consistency across components
- Test that UI updates reflect StateManager state
- Validate no race conditions in state updates