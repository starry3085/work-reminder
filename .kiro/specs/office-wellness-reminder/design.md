# Design Document

## Overview

The Office Wellness Reminder System is a pure frontend Single Page Application (SPA) based on modern web technologies. The application adopts a modular architecture using native JavaScript, HTML5, and CSS3 technology stack to ensure lightweight and high performance. The system manages user data through browser local storage, provides system-level reminders using the Web Notifications API, and implements intelligent user activity detection through event listening.

**Important Note**: This design strictly follows Kiro Hackathon competition rules, adopting a pure frontend technology stack with no backend server required, fully compliant with GitHub Pages deployment requirements. All implementations will follow web development best practices, including accessibility, performance optimization, security, and user experience design principles.

## Architecture

### Overall Architecture
```
┌─────────────────────────────────────────┐
│            User Interface Layer          │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │Main Control │ │   Settings Panel    │ │
│  │    Panel    │ │                     │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│           Business Logic Layer           │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │  Reminder   │ │  User Activity      │ │
│  │  Manager    │ │    Detector         │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│            Data Storage Layer            │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │Local Storage│ │   State Manager     │ │
│  │  Manager    │ │                     │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### Technology Stack Selection
- **Frontend Framework**: Native JavaScript (ES6+) - Ensures lightweight and fast loading
- **Styling**: CSS3 + CSS Grid/Flexbox - Implements responsive layout
- **Build Tools**: No build tools required - Direct deployment of static files to GitHub Pages
- **Notification System**: Web Notifications API + Custom in-page notifications
- **Data Storage**: localStorage API
- **Deployment Platform**: GitHub Pages

## Components and Interfaces

### Core Components

#### 1. ReminderManager (Reminder Manager)
```javascript
class ReminderManager {
  constructor(type, settings) // type: 'water' | 'posture'
  start()                     // Start reminder
  pause()                     // Pause reminder
  reset()                     // Reset timer
  updateSettings(settings)    // Update settings
  getCurrentStatus()          // Get current status
}
```

**Responsibilities:**
- Manage timers for water and sedentary reminders
- Handle reminder trigger logic
- Integrate with notification system

#### 2. ActivityDetector (Activity Detector)
```javascript
class ActivityDetector {
  constructor(callback)       // Activity detection callback
  startMonitoring()          // Start monitoring user activity
  stopMonitoring()           // Stop monitoring
  getLastActivityTime()      // Get last activity time
  isUserActive()             // Check if user is active
}
```

**Responsibilities:**
- Listen for mouse movement, clicks, keyboard input events
- Detect user away state (page unfocused for more than 5 minutes)
- Provide intelligent pause functionality for sedentary reminders

#### 3. NotificationService (Notification Service)
```javascript
class NotificationService {
  constructor()
  requestPermission()        // Request notification permission
  showNotification(type, message) // Show notification
  showInPageAlert(type, message)  // Show in-page alert
  isSupported()             // Check browser support
}
```

**Responsibilities:**
- Manage browser notification permissions
- Send system-level notifications
- Provide in-page fallback notification solution

#### 4. StorageManager (Storage Manager)
```javascript
class StorageManager {
  saveSettings(key, data)    // Save settings
  loadSettings(key)          // Load settings
  clearAllData()            // Clear all data
  isAvailable()             // Check storage availability
}
```

**Responsibilities:**
- Manage localStorage read/write operations
- Handle storage exception situations
- Provide data backup and recovery functionality

#### 5. UIController (UI Controller)
```javascript
class UIController {
  constructor()
  initializeUI()            // Initialize interface
  updateStatus(type, status) // Update status display
  showSettings()            // Show settings panel
  hideSettings()            // Hide settings panel
  bindEvents()              // Bind event listeners
}
```

**Responsibilities:**
- Manage user interface state
- Handle user interaction events
- Update interface display content

### Interface Design

#### Settings Data Structure
```javascript
const AppSettings = {
  water: {
    enabled: true,
    interval: 30,        // minutes
    sound: true,
    lastReminder: null   // timestamp
  },
  posture: {
    enabled: true,
    interval: 60,        // minutes
    sound: true,
    lastReminder: null,
    activityThreshold: 5 // minutes
  },
  notifications: {
    browserNotifications: true,
    soundEnabled: true
  },
  ui: {
    theme: 'light',      // 'light' | 'dark'
    language: 'en-US'    // 'zh-CN' | 'en-US'
  }
}
```

## Data Models

### Application State Model
```javascript
const AppState = {
  isInitialized: false,
  waterReminder: {
    isActive: false,
    timeRemaining: 0,
    nextReminderAt: null
  },
  postureReminder: {
    isActive: false,
    timeRemaining: 0,
    nextReminderAt: null,
    lastActivity: null
  },
  userActivity: {
    isActive: true,
    lastActivityTime: Date.now(),
    awayStartTime: null
  }
}
```

### Event Model
```javascript
const Events = {
  WATER_REMINDER_TRIGGERED: 'water:reminder',
  POSTURE_REMINDER_TRIGGERED: 'posture:reminder',
  USER_ACTIVITY_DETECTED: 'user:activity',
  USER_AWAY_DETECTED: 'user:away',
  SETTINGS_UPDATED: 'settings:updated',
  REMINDER_ACKNOWLEDGED: 'reminder:acknowledged'
}
```

## Error Handling

### Error Types and Handling Strategies

#### 1. Notification Permission Errors
- **Scenario**: User denies browser notification permission
- **Handling**: Degrade to in-page notifications, display permission request prompt

#### 2. Local Storage Errors
- **Scenario**: localStorage unavailable or insufficient storage space
- **Handling**: Use memory storage, notify user that data won't persist

#### 3. Timer Errors
- **Scenario**: Page running in background for long periods causing timer inaccuracy
- **Handling**: Use timestamp verification, recalculate when page reactivates

#### 4. Browser Compatibility Errors
- **Scenario**: Older browsers don't support certain APIs
- **Handling**: Feature degradation, provide basic reminder functionality

### Error Handling Implementation
```javascript
class ErrorHandler {
  static handleNotificationError(error) {
    console.warn('Notification functionality unavailable:', error);
    // Degrade to in-page notifications
  }
  
  static handleStorageError(error) {
    console.warn('Storage functionality unavailable:', error);
    // Use memory storage
  }
  
  static handleTimerError(error) {
    console.error('Timer error:', error);
    // Reinitialize timer
  }
}
```

## Testing Strategy

### Unit Testing
- **ReminderManager**: Test timer logic and state management
- **ActivityDetector**: Test event listening and activity detection algorithms
- **StorageManager**: Test data storage and retrieval functionality
- **NotificationService**: Test notification sending and permission handling

### Integration Testing
- **User Flow Testing**: Complete setup-start-remind-confirm workflows
- **Cross-Browser Testing**: Verify functionality consistency across mainstream browsers
- **Responsive Testing**: Interface adaptation across different screen sizes

### User Experience Testing
- **Usability Testing**: Interface intuitiveness and operation convenience
- **Performance Testing**: Page load speed and memory usage
- **Accessibility Testing**: Keyboard navigation and screen reader support

### Testing Tools and Methods
- **Unit Testing**: Jest or native testing frameworks
- **End-to-End Testing**: Playwright or Cypress
- **Performance Testing**: Chrome DevTools and Lighthouse
- **Compatibility Testing**: BrowserStack or local multi-browser testing

### Test Data and Scenarios
```javascript
const TestScenarios = {
  normalUsage: {
    waterInterval: 30,
    postureInterval: 60,
    userActiveTime: 8 // hours
  },
  edgeCases: {
    veryShortInterval: 1,    // minutes
    veryLongInterval: 480,   // 8 hours
    browserMinimized: true,
    tabInactive: true
  },
  errorConditions: {
    noNotificationPermission: true,
    noLocalStorage: true,
    oldBrowser: true
  }
}
```

## Deployment and Performance Optimization

### GitHub Pages Deployment Configuration
- **Static File Structure**: All resources placed in root directory or docs folder
- **HTTPS Support**: GitHub Pages automatically provides HTTPS
- **CDN Acceleration**: Utilize GitHub's global CDN network

### Performance Optimization Strategies
- **Resource Compression**: CSS and JavaScript file compression
- **Image Optimization**: Use WebP format and appropriate sizes
- **Caching Strategy**: Utilize browser cache and Service Worker
- **Lazy Loading**: Delayed loading of non-critical resources

### Monitoring and Analytics
- **Error Monitoring**: Use try-catch and window.onerror
- **Performance Monitoring**: Use Performance API
- **User Behavior**: Basic usage statistics (local storage)