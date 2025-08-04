# Office Wellness Reminder

A health reminder web application designed specifically for office workers to help develop good work habits.

## Features

- 🥤 **Water Reminder** - Simple time-based reminders to stay hydrated (MVP focus)
- 🪑 **Standup Reminder** - Simple time-based reminders to get up and move regularly
- 🔔 **Automatic Notifications** - In-page alerts that auto-dismiss after 5 seconds
- ⚙️ **Simple Settings** - Basic reminder intervals customization
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **Local Storage** - Settings saved automatically, no registration needed
- 🔒 **Privacy-First** - All data stays on your device, no external dependencies

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+) - No frameworks or libraries
- **Styling**: CSS3 with CSS Custom Properties (CSS Variables)
- **HTML**: Semantic HTML5
- **Storage**: localStorage API for data persistence
- **Notifications**: Web Notifications API
- **PWA**: Progressive Web App with manifest.json
- **Deployment**: GitHub Pages (static files only)
- **Development Tools**: Kiro AI Assistant with automated documentation updates

### Architecture Highlights
- **Single Source of Truth**: StateManager handles all application state (fixed circular updates)
- **Class-Based Architecture**: Modular ES6+ classes with clear separation of concerns
- **State-Driven Communication**: Components communicate through StateManager subscriptions only
- **Privacy-First Design**: No backend server, no APIs, no external dependencies
- **MVP Architecture**: Simplified callback system, unified state management
- **Error Prevention**: Removed method call errors and duplicate state updates

## Project Structure

```
work-reminder/
├── index.html              # Main page
├── 404.html               # Error page
├── styles/
│   └── main.css           # Main stylesheet
├── js/
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
├── assets/                # Static resources (icons, audio)
├── manifest.json          # PWA configuration
├── package.json           # Project configuration
└── README.md              # Project documentation
```

## Development Notes

This project follows strict MVP (Minimum Viable Product) principles:
- **Pure Frontend Only**: No backend server, no APIs, no databases
- **GitHub Pages Compatible**: Static files only, no build process required
- **Privacy-First**: All data stays on user's device (localStorage only)
- **Vanilla JavaScript**: No frameworks or libraries, ES6+ only
- **Focus on Core Features**: Water and standup reminders with simple time-based intervals
- **User Experience**: Non-intrusive notifications, accessible design, offline-first

### Architecture Decisions

**State Management**: 
- **StateManager** is the single source of truth for all application state (see `.kiro/steering/tech.md` for detailed architecture)
- **AppSettings** only provides validation and default values (no state management)
- **StorageManager** only handles localStorage operations (called by StateManager only)
- **Reminder classes** subscribe to StateManager for unified state synchronization
- **UIController** subscribes to StateManager for real-time UI updates
- **Anti-circulation mechanisms** prevent duplicate state updates (fixed circular update issues)
- **Simplified callback system** - removed redundant callbacks, StateManager subscriptions only

**Key Fixes Applied**:
- **Fixed method call errors**: Removed calls to non-existent `updateSettings()` method
- **Fixed duplicate state updates**: All state changes flow through StateManager
- **Fixed state recovery**: Implemented proper state restoration via StateManager
- **Fixed circular updates**: Improved `isUpdatingFromState` flag implementation
- **Fixed state structure**: Unified naming conventions across all components

**MVP Simplifications**:
- **ActivityDetector removed** - using simple time-based reminders instead
- **No user activity detection** or intelligent pause/resume
- **Simplified callback system** - StateManager subscriptions only
- **Focus on core reminder functionality** only

### Development Automation

The project uses Kiro AI Assistant for development assistance, including the following automated features:
- **Documentation Sync**: Automatically detect code changes and update related documentation
- **Code Comments**: Automatically maintain consistency of inline documentation and code comments
- **Development Workflow**: Smart suggestions and code quality checks

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development Progress

- [x] Project foundation structure and core interfaces
- [x] Storage management and settings system (StateManager + StorageManager)
- [x] Notification service (browser notifications + in-page fallback)
- [x] Simple time-based reminders (MVP focus - ActivityDetector removed)
- [x] Water reminder functionality
- [x] Standup reminder functionality  
- [x] User interface controller
- [x] Responsive design and mobile adaptation
- [x] Application initialization and state recovery
- [x] Error handling and compatibility support
- [x] Code internationalization (all English)
- [x] Architecture optimization (unified state management)
- [x] Testing and optimization
- [x] GitHub Pages deployment

## Quick Start

### Online Access
Visit the live demo: [Office Wellness Reminder](https://starry3085.github.io/work-reminder/)

### Local Development

1. **Clone and Setup**
   ```bash
   git clone https://github.com/starry3085/work-reminder.git
   cd work-reminder
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   # Or manually: npx http-server . -o
   # Or with Python: python -m http.server 8000
   ```

3. **Access Application**
   - Open `http://localhost:8000` in your browser
   - Test all features work correctly

## Deployment

### Simple Deployment

This project uses **GitHub Actions** for automatic deployment:

1. **Deploy with npm script**
   ```bash
   npm run deploy
   ```

2. **Or manually push to main**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

3. **Automatic Process**
   - GitHub Actions detects the push
   - Automatically deploys to `gh-pages` branch
   - GitHub Pages serves the updated site
   - Usually takes 1-2 minutes to go live

### Verification After Deployment

- ✅ Visit your GitHub Pages URL
- ✅ Test water reminder functionality
- ✅ Test standup reminder functionality  
- ✅ Test on mobile devices
- ✅ Check browser console for errors

### Troubleshooting

**Common Issues:**
- **404 Error**: Check GitHub Pages settings and branch configuration
- **JavaScript Errors**: Check browser console, ensure all files are pushed
- **Features Not Working**: Verify localStorage is enabled in browser
- **Mobile Issues**: Test responsive design on actual devices

For detailed troubleshooting, see `FORCE_REFRESH_SOLUTION.md`

## License

MIT License

---

Designed for healthy office work ❤️