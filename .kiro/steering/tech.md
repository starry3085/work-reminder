# Technology Stack & Architecture Guidelines

## Core Development Constraints (CRITICAL)
- **Pure Frontend Only**: No backend server, no APIs, no databases
- **GitHub Pages Compatible**: Static files only, no build process required
- **Privacy-First**: All data stays on user's device (localStorage only)
- **Vanilla JavaScript**: No frameworks or libraries, ES6+ only
- **English Documentation**: All comments, documentation, and naming must be in English

## Tech Stack

### Frontend
- **JavaScript**: Vanilla ES6+ (no frameworks)
- **CSS**: CSS3 with CSS Custom Properties (CSS Variables)
- **HTML**: Semantic HTML5
- **Storage**: localStorage API with memory storage fallback
- **Notifications**: Web Notifications API with in-page fallback
- **PWA**: Progressive Web App with manifest.json

### Development Tools
- **Package Manager**: npm
- **Local Server**: http-server for development
- **Deployment**: GitHub Pages with gh-pages package
- **AI Assistant**: Kiro AI for development automation

### Browser APIs Used
- localStorage API for settings persistence
- Web Notifications API for browser notifications
- Page Visibility API for basic state management
- Performance API for timing measurements
- sessionStorage for temporary flags
- ResizeObserver for efficient responsive handling
- matchMedia for responsive breakpoints

## Architecture Design

### Class-Based Architecture
The application follows a modular class-based architecture with clear separation of concerns:

- **Single Responsibility**: Each class handles one specific aspect of functionality
- **Dependency Injection**: Classes receive dependencies through constructors
- **Event-Driven Communication**: Components communicate through StateManager subscriptions
- **Layered Architecture**: Clear separation between data, business logic, and presentation layers
- **Atomic Operations**: All state changes are atomic and reversible

### Core Components

#### Application Layer
- `OfficeWellnessApp` - Main application orchestrator, coordinates all components with unified dependency injection
- `UIController` - Handles all UI interactions, DOM updates, and event cleanup
- `ErrorHandler` - Comprehensive error handling, recovery mechanisms, and user communication

#### Data Layer (Enhanced State Management)
- `StateManager` - Atomic state management with anti-circulation protection and migration support
- `StorageManager` - Storage abstraction with key conflict resolution and version control
- `AppSettings` - Settings validation, defaults, and configuration management

#### Business Logic Layer
- `ReminderManager` - Base reminder functionality with timer synchronization and error recovery
- `WaterReminder` - Water reminder with atomic state updates and recovery mechanisms
- `StandupReminder` - Standup reminder with atomic state updates and recovery mechanisms
- `NotificationService` - Notification handling with graceful fallbacks

#### Utility Layer
- `MobileAdapter` - Mobile optimization with event deduplication and efficient observers
- `DebugHelper` - Development and debugging utilities

## State Management Architecture (Enhanced)

### Atomic State Management
**StateManager provides atomic state updates with comprehensive protection mechanisms.**

### Unified State Structure (Enhanced)
```javascript
// Atomic state structure with migration support
{
  water: {
    isActive: boolean,
    interval: number, // minutes (1-120)
    timeRemaining: number, // milliseconds
    nextReminderAt: number, // timestamp
    enabled: boolean,
    sound: boolean,
    lastReminderAt: number,
    version: string // for migration tracking
  },
  standup: {
    // Same structure as water
  },
  app: {
    isFirstUse: boolean,
    notificationSettings: {
      browserNotifications: boolean,
      soundEnabled: boolean,
      style: string
    },
    version: string // for state migration
  }
}
```

### Advanced State Management Features

#### StateManager (Atomic State Management)
- **Per-type update flags**: Map-based `isUpdatingFromState` prevents circular updates per state type
- **Update queues**: Atomic state updates prevent race conditions
- **Storage migration**: Automatic handling of storage key conflicts and version upgrades
- **Error recovery**: Memory storage fallback when localStorage unavailable
- **Consistent naming**: Standardized storage keys with version control
- **Validation layer**: Comprehensive state validation before updates

#### StorageManager (Enhanced Storage)
- **Key conflict resolution**: Automatic handling of storage key migrations
- **Version control**: Storage format versioning with backward compatibility
- **Fallback mechanism**: Memory storage when localStorage unavailable
- **Atomic operations**: All storage operations are atomic

### Component Responsibilities (Enhanced)

#### StateManager (Atomic State Management)
- **ONLY** component that manages application state
- **Atomic updates**: All state changes are atomic and reversible
- **Anti-circulation**: Advanced mechanism prevents circular state updates
- **Migration support**: Automatic handling of storage format changes
- **Error recovery**: Memory storage fallback with graceful degradation
- **Subscription system**: Efficient state change notifications

#### AppSettings (Validation & Defaults)
- Provides default settings structure with validation
- Handles settings format validation and sanitization
- No state management responsibilities

#### StorageManager (Storage Abstraction)
- Handles localStorage and memory storage operations
- Provides storage key migration and version control
- Called exclusively by StateManager

#### ReminderManager (Enhanced Base Class)
- **Timer synchronization**: Atomic timer operations prevent race conditions
- **Error recovery**: Automatic timer reset on critical errors
- **State synchronization**: Atomic state updates through StateManager
- **Resource cleanup**: Proper disposal of timers and listeners

#### UIController (Enhanced UI Management)
- **State-driven updates**: All UI updates flow through StateManager subscriptions
- **Event cleanup**: Comprehensive cleanup of DOM event listeners
- **Responsive handling**: Dynamic mobile/desktop transitions
- **Debounced rendering**: Prevents excessive DOM updates

### Data Flow (Enhanced)
```
User Action → UIController → StateManager → StorageManager
                                     ↓
UI Updates ← UIController ← Subscribers ← StateManager
                                     ↓
Error Recovery ← ErrorHandler ← Recovery Strategies
```

### Enhanced Architecture Features

#### 1. Atomic State Management
- **Per-type update flags**: Prevents circular updates per state type
- **Update queues**: Atomic state updates prevent race conditions
- **Storage migration**: Automatic handling of storage key conflicts
- **Error recovery**: Memory storage fallback with graceful degradation

#### 2. Timer Management
- **Atomic timer operations**: Prevents synchronization issues during rapid state changes
- **Standardized time units**: Internal=milliseconds, UI=minutes
- **Timer cleanup**: Proper disposal of timers to prevent memory leaks
- **Recovery mechanisms**: Automatic timer reset on critical errors

#### 3. UI Synchronization
- **State-driven updates**: All UI updates flow through StateManager subscriptions
- **Debounced rendering**: Prevents excessive DOM updates during rapid state changes
- **Event cleanup**: Comprehensive cleanup of DOM event listeners
- **Responsive breakpoints**: Dynamic handling of mobile/desktop transitions

#### 4. Component Dependencies
- **Unified dependency injection**: All components receive StateManager via constructor
- **Initialization order**: Guaranteed proper initialization sequence
- **Resource cleanup**: Complete cleanup on application shutdown
- **Error boundaries**: Isolated error handling per component

#### 5. Mobile Event Management
- **Event deduplication**: Prevents duplicate resize/orientation listeners
- **Efficient observers**: Uses ResizeObserver when available, falls back to debounced resize
- **Touch optimization**: Mobile-specific optimizations without duplicate registration
- **Viewport management**: Dynamic viewport adjustments for mobile devices

#### 6. Error Recovery System
- **Memory storage fallback**: Continues operation when localStorage unavailable
- **Graceful degradation**: Reduces functionality but maintains core features
- **User-friendly messages**: Clear communication of issues and solutions
- **Error statistics**: Comprehensive logging and recovery tracking

### Error Handling Strategy

#### Hierarchical Error Handling
- **Component-level**: Isolated error handling per component
- **Application-level**: Global error handling with recovery mechanisms
- **User communication**: Clear, actionable error messages

#### Recovery Mechanisms
- **Storage errors**: Automatic fallback to memory storage
- **Notification errors**: Graceful degradation to in-page alerts
- **Timer errors**: Automatic reset and recovery
- **State errors**: Validation and migration handling

### Performance Optimizations

#### Memory Management
- **Proactive cleanup**: Automatic disposal of timers, listeners, and observers
- **Efficient observers**: Uses modern browser APIs (ResizeObserver)
- **Debounced updates**: Prevents excessive DOM manipulation
- **Minimal re-renders**: State-driven updates prevent unnecessary work

#### Resource Optimization
- **Event deduplication**: Prevents duplicate event registration
- **Efficient state updates**: Atomic operations prevent redundant work
- **Graceful degradation**: Continues working with reduced functionality

### Systematic Bug Fixes Summary (Enhanced)

#### 1. Atomic State Management ✅
- **Per-type update flags**: Map-based `isUpdatingFromState` prevents circular updates
- **Update queues**: Atomic state updates prevent race conditions
- **Storage migration**: Automatic handling of storage key conflicts and version upgrades
- **Consistent naming**: Standardized storage keys with version control

#### 2. Timer Management ✅
- **Atomic timer operations**: Prevents synchronization issues during rapid state changes
- **Standardized time units**: All internal calculations use milliseconds, UI uses minutes
- **Timer cleanup**: Proper disposal of timers to prevent memory leaks
- **Recovery mechanisms**: Automatic timer reset on critical errors

#### 3. UI Synchronization ✅
- **State-driven updates**: All UI updates flow through StateManager subscriptions
- **Debounced rendering**: Prevents excessive DOM updates during rapid state changes
- **Event cleanup**: Comprehensive cleanup of DOM event listeners
- **Responsive breakpoints**: Dynamic handling of mobile/desktop transitions

#### 4. Component Dependencies ✅
- **Unified dependency injection**: All components receive StateManager via constructor
- **Initialization order**: Guaranteed proper initialization sequence
- **Resource cleanup**: Complete cleanup on application shutdown
- **Error boundaries**: Isolated error handling per component

#### 5. Mobile Event Management ✅
- **Event deduplication**: Prevents duplicate resize/orientation listeners
- **Efficient observers**: Uses ResizeObserver when available, falls back to debounced resize
- **Touch optimization**: Mobile-specific optimizations without duplicate registration
- **Viewport management**: Dynamic viewport adjustments for mobile devices

#### 6. Error Recovery System ✅
- **Memory storage fallback**: Continues operation when localStorage unavailable
- **Graceful degradation**: Reduces functionality but maintains core features
- **User-friendly messages**: Clear communication of issues and solutions
- **Error statistics**: Comprehensive logging and recovery tracking

#### 7. Storage Key Management ✅
- **Version control**: Storage keys include version identifiers
- **Migration support**: Automatic handling of storage format changes
- **Conflict resolution**: Handles storage key conflicts gracefully
- **Backward compatibility**: Maintains compatibility with previous versions

### Testing Checklist (Enhanced)

#### Functionality Tests
- [ ] Water reminder triggers at configured interval
- [ ] Standup reminder triggers at configured interval
- [ ] Settings persist after page refresh
- [ ] Notifications work (grant permission when prompted)
- [ ] Mobile responsive design works correctly
- [ ] Error handling displays user-friendly messages

#### Edge Case Tests
- [ ] Local storage disabled (uses memory storage fallback)
- [ ] Notifications blocked (uses in-page alerts fallback)
- [ ] Rapid setting changes (no race conditions)
- [ ] Browser resize between mobile/desktop (smooth transitions)
- [ ] Page refresh during active reminders (state restored)
- [ ] Storage key conflicts (automatic migration)
- [ ] Timer synchronization during rapid changes
- [ ] Event listener cleanup on application shutdown

#### Performance Tests
- [ ] Memory usage remains stable over time
- [ ] No memory leaks from event listeners
- [ ] Responsive performance on mobile devices
- [ ] Efficient state updates without excessive re-renders
- [ ] Graceful degradation under error conditions

### Architecture Evolution

#### MVP → Enhanced Architecture
- **State Management**: Basic state management → Atomic state management with anti-circulation protection
- **Error Handling**: Basic error handling → Comprehensive error recovery with memory storage fallback
- **Mobile Support**: Basic responsive design → Efficient mobile optimization with event deduplication
- **Resource Management**: Basic cleanup → Proactive resource cleanup with memory management
- **Storage**: Basic localStorage → Storage abstraction with migration support
- **Performance**: Basic functionality → Optimized performance with debounced updates

### Deployment Verification

#### Enhanced Verification Checklist
- ✅ Visit GitHub Pages URL
- ✅ Test water reminder functionality with different intervals
- ✅ Test standup reminder functionality with different intervals
- ✅ Test on mobile devices with touch interactions
- ✅ Test error scenarios (block notifications, disable localStorage)
- ✅ Check browser console for warnings or errors
- ✅ Verify responsive design on various screen sizes
- ✅ Test storage migration scenarios
- ✅ Verify error recovery mechanisms
- ✅ Check memory usage stability over time