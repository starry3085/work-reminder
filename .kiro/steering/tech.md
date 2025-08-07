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

#### Data Layer (Current Implementation)
- ~~`StateManager` - Atomic state management with anti-circulation protection and migration support~~ (NOT IMPLEMENTED IN MVP)
- `StorageManager` - Storage abstraction with basic localStorage operations (contains duplicate methods)
- `AppSettings` - Settings validation, defaults, and configuration management

#### Business Logic Layer
- `ReminderManager` - Base reminder functionality with timer synchronization and error recovery
- `WaterReminder` - Water reminder with atomic state updates and recovery mechanisms
- `StandupReminder` - Standup reminder with atomic state updates and recovery mechanisms
- `NotificationService` - Notification handling with graceful fallbacks

#### Utility Layer
- `MobileAdapter` - Mobile optimization with event deduplication and efficient observers
- `DebugHelper` - Development and debugging utilities

## State Management Architecture (Current MVP Implementation)

### Current State Management
**Direct component communication without centralized StateManager (MVP implementation).**

### Current State Structure (MVP)
```javascript
// Basic state structure used in current implementation
{
  water: {
    enabled: boolean,
    interval: number, // minutes (30 default)
    sound: boolean,
    lastReminder: null // timestamp
  },
  posture: {
    enabled: boolean,
    interval: number, // minutes (60 default)
    sound: boolean,
    lastReminder: null // timestamp
  },
  notifications: {
    browserNotifications: boolean,
    soundEnabled: boolean
  },
  ui: {
    language: 'en-US' // 'zh-CN' | 'en-US'
  }
}
```

### Current State Management Features (MVP)

#### Direct Component Communication
- **Component-level state management**: Each component manages its own state
- **Manual synchronization**: Components manually sync state through direct calls
- **Basic error handling**: Simple fallback mechanisms without advanced recovery
- **Storage limitations**: Basic localStorage operations without migration support

#### StorageManager (Current Implementation)
- **Basic storage operations**: Simple setItem/getItem operations
- **Duplicate method issue**: saveSettings/loadSettings duplicate setItem/getItem
- **Limited error handling**: Basic fallback to memory storage
- **No migration support**: Static storage key management

### Component Responsibilities (Current MVP)

#### ~~StateManager (Atomic State Management)~~ (NOT IMPLEMENTED)
- ~~**ONLY** component that manages application state~~
- ~~**Atomic updates**: All state changes are atomic and reversible~~
- ~~**Anti-circulation**: Advanced mechanism prevents circular state updates~~
- ~~**Migration support**: Automatic handling of storage format changes~~

#### AppSettings (Validation & Defaults)
- Provides default settings structure with validation
- Handles settings format validation and sanitization
- **First-use detection**: Manages first-time user experience
- **No state management responsibilities**

#### StorageManager (Storage Abstraction)
- Handles localStorage and memory storage operations
- **Contains duplicate methods**: saveSettings/loadSettings duplicate setItem/getItem
- **Basic fallback**: Simple memory storage fallback
- **No migration support**: Static storage key management

#### ReminderManager (Base Class)
- **Timer management**: Basic timer operations with separate clearTimer/clearUpdateTimer methods
- **State synchronization**: Manual state updates through direct calls
- **Resource cleanup**: Basic timer disposal
- **Limited error recovery**: Simple error handling

#### UIController (UI Management)
- **Direct UI updates**: Manual DOM updates without state subscriptions
- **Event cleanup**: Basic cleanup of DOM event listeners
- **Responsive handling**: Basic mobile/desktop transitions
- **Splash screen handling**: Force UI updates for initialization timing issues

### Current Data Flow (MVP)
```
User Action → UIController → Direct Component Updates → StorageManager
                                     ↓
UI Updates ← Manual State Sync ← Component Communication
                                     ↓
Basic Error Handling ← ErrorHandler ← Simple Recovery
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

### Current MVP Architecture Features & Issues

#### 1. State Management (Current Issues)
- **~~Atomic state management~~**: NOT IMPLEMENTED - StateManager does not exist
- **Manual state sync**: Components use direct communication instead of centralized state
- **Circular update risk**: No protection against circular state updates
- **Basic error handling**: Simple fallback without advanced recovery

#### 2. Timer Management (Current Issues)
- **~~Atomic timer operations~~**: NOT IMPLEMENTED - Uses basic setInterval/clearInterval
- **Separate timer methods**: clearTimer() and clearUpdateTimer() exist as separate methods
- **No synchronization**: Timer operations not atomic during rapid changes
- **Basic cleanup**: Simple timer disposal without comprehensive cleanup

#### 3. UI Synchronization (Current Issues)
- **~~State-driven updates~~**: NOT IMPLEMENTED - Manual DOM updates without state subscriptions
- **Splash screen issues**: Force UI updates (forceUIUpdate) to handle initialization timing
- **Basic responsive**: Standard CSS media queries for mobile/desktop
- **Direct DOM manipulation**: No debounced rendering or optimized updates

#### 4. Component Dependencies (Current)
- **~~Unified dependency injection~~**: NOT IMPLEMENTED - Direct instantiation without DI
- **Manual initialization**: Components initialized in specific sequence
- **Basic cleanup**: Limited resource cleanup on component destruction
- **Error isolation**: Basic error handling per component

#### 5. Mobile Event Management (Current)
- **~~Event deduplication~~**: NOT IMPLEMENTED - Basic event listeners without deduplication
- **Standard events**: resize/orientation event listeners
- **CSS-based responsive**: Media query-based responsive design
- **Basic mobile support**: Standard touch and viewport handling

#### 6. Error Recovery System (Basic)
- **Memory storage fallback**: Simple fallback when localStorage unavailable
- **Basic degradation**: Reduced functionality on errors
- **Console logging**: Basic error messages to console
- **Limited recovery**: Simple error handling without comprehensive recovery

#### 7. Storage Management (Current Issues)
- **~~Version control~~**: NOT IMPLEMENTED - Static storage keys without versioning
- **~~Migration support~~**: NOT IMPLEMENTED - No automatic storage format changes
- **Duplicate methods**: saveSettings/loadSettings duplicate setItem/getItem functionality
- **Basic conflict handling**: Simple error handling for storage conflicts

### Current MVP Testing Checklist

#### Functionality Tests
- [ ] Water reminder triggers at configured interval
- [ ] Standup reminder triggers at configured interval
- [ ] Settings persist after page refresh
- [ ] Notifications work (grant permission when prompted)
- [ ] Mobile responsive design works correctly
- [ ] Error handling displays basic messages

#### Known Issues to Test
- [ ] **Splash screen timing**: Check for "--:--" display during initialization
- [ ] **Storage method duplication**: Verify saveSettings/loadSettings vs setItem/getItem
- [ ] **Timer cleanup**: Check for proper timer disposal on component destruction
- [ ] **State synchronization**: Verify consistent state across components
- [ ] **Mobile event listeners**: Check for duplicate event registration

#### Edge Case Tests (Current MVP)
- [ ] Local storage disabled (uses memory storage fallback)
- [ ] Notifications blocked (uses in-page alerts fallback)
- [ ] Rapid setting changes (may have race conditions)
- [ ] Browser resize between mobile/desktop (basic transitions)
- [ ] Page refresh during active reminders (state restored)
- [ ] **Storage key conflicts** (no automatic migration - manual handling required)
- [ ] **Timer synchronization issues** during rapid changes
- [ ] **Event listener cleanup** on application shutdown

#### Performance Tests (Current MVP)
- [ ] Memory usage stability over time
- [ ] Potential memory leaks from event listeners
- [ ] Responsive performance on mobile devices
- [ ] **Excessive DOM updates** during rapid state changes
- [ ] Basic graceful degradation under error conditions

### Architecture Status (MVP vs Planned)

#### Current MVP Architecture
- **State Management**: Basic direct component communication
- **Error Handling**: Simple error handling with console logging
- **Mobile Support**: Basic responsive CSS design
- **Resource Management**: Manual cleanup in component methods
- **Storage**: Basic localStorage with duplicate method issue
- **Performance**: Basic functionality without optimization

#### Planned Enhancements (Future)
- **State Management**: Atomic state management with StateManager
- **Error Handling**: Comprehensive error recovery with memory storage fallback
- **Mobile Support**: Efficient mobile optimization with event deduplication
- **Resource Management**: Proactive resource cleanup with memory management
- **Storage**: Storage abstraction with migration support
- **Performance**: Optimized performance with debounced updates

### Current MVP Deployment Verification

#### Basic Verification Checklist
- ✅ Visit GitHub Pages URL
- ✅ Test water reminder functionality with different intervals
- ✅ Test standup reminder functionality with different intervals
- ✅ Test on mobile devices with touch interactions
- ✅ Test error scenarios (block notifications, disable localStorage)
- ✅ Check browser console for warnings or errors
- ✅ Verify responsive design on various screen sizes
- ⚠️ **Storage migration scenarios** (NOT IMPLEMENTED - manual handling required)
- ⚠️ **Error recovery mechanisms** (basic implementation only)
- ⚠️ **Memory usage stability** (needs monitoring)