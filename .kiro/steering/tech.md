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
- **Storage**: localStorage API for data persistence
- **Notifications**: Web Notifications API
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

## Architecture Design

### Class-Based Architecture
The application follows a modular class-based architecture with clear separation of concerns:

- **Single Responsibility**: Each class handles one specific aspect of functionality
- **Dependency Injection**: Classes receive dependencies through constructors
- **Event-Driven Communication**: Components communicate through callbacks and event handlers
- **Layered Architecture**: Clear separation between data, business logic, and presentation layers

### Core Components

#### Application Layer
- `OfficeWellnessApp` - Main application orchestrator, coordinates all components
- `UIController` - Handles all UI interactions and DOM updates
- `ErrorHandler` - Centralized error handling and logging

#### Data Layer (CRITICAL - Single Source of Truth)
- `StateManager` - **ONLY** component that manages application state
- `StorageManager` - **ONLY** handles localStorage operations, called by StateManager only
- `AppSettings` - **ONLY** provides validation and default values (no state management)

#### Business Logic Layer
- `ReminderManager` - Base class for reminder functionality
- `WaterReminder` - Water reminder implementation
- `StandupReminder` - Standup reminder with time-based intervals
- `NotificationService` - Handles browser and in-page notifications

#### Utility Layer
- `MobileAdapter` - Mobile device optimizations and compatibility checks
- `DebugHelper` - Development and debugging utilities

## State Management Architecture (CRITICAL)

### Single Source of Truth Principle
**StateManager is the ONLY component that manages application state.**

### Component Responsibilities (FINAL)

#### StateManager (Single Source of Truth)
- **ONLY** component that reads/writes application state
- **ONLY** component that calls StorageManager for persistence
- Manages state cache and subscriptions
- Notifies subscribers of state changes
- Handles state validation and merging

#### AppSettings (Validation Only)
- **ONLY** provides default settings structure
- **ONLY** validates settings format
- **NEVER** saves or manages state directly
- **NEVER** calls StorageManager directly

#### StorageManager (Persistence Only)
- **ONLY** handles localStorage operations
- **ONLY** called by StateManager
- **NEVER** called directly by other components

#### Other Components (Business Logic)
- **ONLY** subscribe to StateManager for state updates
- **ONLY** request state changes through StateManager
- **NEVER** access localStorage directly
- **NEVER** manage state independently

### Data Flow (ENFORCED)
```
User Action → UIController → App → StateManager → StorageManager
                                      ↓
UI Updates ← UIController ← Subscribers ← StateManager
```

### Critical Rules (NO EXCEPTIONS)
1. **Only StateManager writes to localStorage**
2. **Only StateManager manages application state**
3. **All state changes go through StateManager.updateState()**
4. **All state access goes through StateManager.getState()**
5. **Components subscribe to StateManager for updates**

### Code Examples

#### ❌ NEVER DO THIS
```javascript
// AppSettings trying to save state directly
this.stateManager.updateState('water', { settings: newSettings });

// Multiple components saving the same data
this.storageManager.saveSettings('water', settings);
this.stateManager.updateState('water', { settings: settings });

// Direct state mutation without StateManager
this.waterSettings = newSettings;
this.saveToLocalStorage();
```

#### ✅ ALWAYS DO THIS
```javascript
// Only StateManager updates state
stateManager.updateState('water', { 
    settings: { interval: 30 },
    isActive: true 
});

// Reminder classes subscribe to StateManager
this.stateManager.subscribe('water', (state) => {
    this.handleStateUpdate(state);
});

// UIController subscribes for real-time updates
this.stateManager.subscribe('water', (state) => {
    if (!this.isUpdatingFromState) {
        this.updateWaterUI(state);
    }
});

// Prevent circular updates
updateWaterUI(state) {
    this.isUpdatingFromState = true;
    // Update UI elements
    this.isUpdatingFromState = false;
}
```

## Code Style Guidelines

### JavaScript
- ES6+ features: classes, arrow functions, const/let
- Comprehensive JSDoc comments for all public methods (all in English)
- Error handling with try-catch blocks
- Console logging for debugging (removed in production)
- All variable and function names in English

### File Naming Conventions
- JavaScript files: kebab-case (`water-reminder.js`)
- Class names: PascalCase (`WaterReminder`)
- CSS classes: kebab-case (`.reminder-card`, `.status-badge`)
- HTML IDs: kebab-case (`water-toggle`, `standup-countdown`)

### CSS
- CSS custom properties for theming
- Flexbox and Grid for layouts
- Mobile-first media queries
- Consistent spacing using rem/em units

### HTML
- Semantic HTML5 structure
- Accessibility attributes (ARIA, alt text)
- Progressive enhancement approach

## ActivityDetector Status (FINAL)

**ActivityDetector has been REMOVED from MVP.**

### Rationale
- Simplifies architecture for MVP release
- Reduces complexity and potential bugs
- Focuses on core reminder functionality
- Can be added in future releases

### Current Implementation
- Simple time-based reminders only
- No user activity detection
- No intelligent pause/resume
- Fixed interval reminders

## Project Structure

```
office-wellness-reminder/
├── index.html              # Main application entry point
├── 404.html               # Error page for GitHub Pages
├── manifest.json          # PWA configuration
├── package.json           # npm configuration
├── styles/
│   └── main.css           # Main stylesheet with CSS variables
├── js/                    # JavaScript modules (class-based architecture)
│   ├── app.js             # Main application orchestrator
│   ├── state-manager.js   # Single source of truth for state management
│   ├── storage-manager.js # localStorage abstraction layer
│   ├── app-settings.js    # Settings validation and defaults only
│   ├── notification-service.js # Notification handling
│   ├── reminder-manager.js     # Base reminder functionality
│   ├── water-reminder.js       # Water reminder implementation
│   ├── standup-reminder.js     # Standup reminder implementation
│   ├── ui-controller.js        # UI event handling and updates
│   ├── error-handler.js        # Error handling and logging
│   └── mobile-adapter.js       # Mobile device adaptations
├── assets/                # Static resources (icons, audio files)
└── test-*.html           # Testing and debugging pages
```

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start local development server
npm start
# Alternative: npx http-server . -o

# Start with Python (alternative)
python -m http.server 8000
```

### Deployment
```bash
# Deploy to GitHub Pages
npm run deploy

# Manual deployment preparation
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Testing
```bash
# No automated tests - manual testing via browser
# Use test-simple.html for basic functionality testing
# Use check-settings.html for settings validation
```

## Build Process

This is a pure frontend application with no build step required:
1. All JavaScript files are loaded directly in the browser
2. CSS uses native CSS variables (no preprocessing)
3. No bundling or minification in development
4. Direct deployment to GitHub Pages without build artifacts

## Browser Support

- Chrome 60+ (ES6 classes, CSS variables)
- Firefox 55+ (ES6 classes, CSS variables)
- Safari 12+ (ES6 classes, CSS variables)
- Edge 79+ (Chromium-based)