# Project Structure & Architecture Patterns

## Code Organization

### Class-Based Architecture
The application follows a modular class-based architecture with clear separation of concerns:

- **Single Responsibility**: Each class handles one specific aspect of functionality
- **Dependency Injection**: Classes receive dependencies through constructors
- **Event-Driven Communication**: Components communicate through callbacks and event handlers
- **Layered Architecture**: Clear separation between data, business logic, and presentation layers

### Core Classes & Responsibilities

#### Application Layer
- `OfficeWellnessApp` - Main application orchestrator, coordinates all components
- `UIController` - Handles all UI interactions and DOM updates
- `ErrorHandler` - Centralized error handling and logging

#### Data Layer
- `StorageManager` - localStorage abstraction with fallback to memory storage
- `AppSettings` - Settings and application state management with validation

#### Business Logic Layer
- `ReminderManager` - Base class for reminder functionality
- `WaterReminder` - Water reminder implementation
- `PostureReminder` (standup) - Standup reminder with activity detection
- `NotificationService` - Handles browser and in-page notifications
- `ActivityDetector` - User activity monitoring for smart pause/resume

#### Utility Layer
- `MobileAdapter` - Mobile device optimizations and compatibility checks
- `DebugHelper` - Development and debugging utilities

## File Naming Conventions

### JavaScript Files
- Use kebab-case: `water-reminder.js`, `activity-detector.js`
- Class names use PascalCase: `WaterReminder`, `ActivityDetector`
- One class per file, matching the filename

### CSS Classes
- Use kebab-case: `.reminder-card`, `.status-badge`
- BEM methodology for complex components: `.card__header--active`
- CSS custom properties use kebab-case: `--primary-color`

### HTML IDs and Elements
- Use kebab-case: `water-toggle`, `standup-countdown`
- Semantic HTML5 elements preferred
- ARIA attributes for accessibility

## Directory Structure Rules

### Root Level
- Configuration files: `package.json`, `manifest.json`
- Entry points: `index.html`, `404.html`
- Documentation: `README.md`, `DEPLOYMENT.md`

### `/js/` Directory
- All JavaScript modules
- No subdirectories - flat structure for simplicity
- Backup files use `.bak` extension

### `/styles/` Directory
- Single `main.css` file with all styles
- CSS custom properties defined in `:root`
- Mobile-first responsive design

### `/assets/` Directory
- Static resources: icons, audio files, images
- Organized by type if needed

## Code Style Guidelines

### JavaScript
- ES6+ features: classes, arrow functions, const/let
- Comprehensive JSDoc comments for all public methods
- Error handling with try-catch blocks
- Console logging for debugging (removed in production)

### CSS
- CSS custom properties for theming
- Flexbox and Grid for layouts
- Mobile-first media queries
- Consistent spacing using rem/em units

### HTML
- Semantic HTML5 structure
- Accessibility attributes (ARIA, alt text)
- Progressive enhancement approach

## Component Communication Patterns

### Event-Driven Architecture
- UI events handled by `UIController`
- Business logic events use callback functions
- Status changes propagated through observer pattern

### Data Flow
1. User interaction → UIController
2. UIController → Business Logic Classes
3. Business Logic → StorageManager (persistence)
4. State changes → UI updates via callbacks

### Error Handling
- Centralized error handling through `ErrorHandler`
- Graceful degradation for missing features
- Fallback mechanisms for storage and notifications

## Testing Strategy

### Manual Testing
- Use `test-simple.html` for basic functionality
- Use `check-settings.html` for settings validation
- Browser developer tools for debugging

### Debugging Tools
- `DebugHelper` class for diagnostic information
- Console logging with structured messages
- Error boundary patterns for graceful failures