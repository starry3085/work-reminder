# Office Wellness Reminder

A health reminder web application designed specifically for office workers to help develop good work habits.

## Features

- 🥤 **Water Reminder** - Smart time-based reminders with configurable intervals
- 🪑 **Standup Reminder** - Regular movement reminders with customizable timing
- 🔔 **Smart Notifications** - Browser notifications with graceful fallbacks
- ⚙️ **Comprehensive Settings** - Detailed reminder customization with validation
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 💾 **Persistent Storage** - Settings saved automatically with migration support
- 🔒 **Privacy-First** - All data stays on your device, no external dependencies
- 🛡️ **Error Recovery** - Graceful degradation with memory storage fallback

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+) - No frameworks or libraries
- **Styling**: CSS3 with CSS Custom Properties (CSS Variables)
- **HTML**: Semantic HTML5
- **Storage**: localStorage API with memory storage fallback
- **Notifications**: Web Notifications API with in-page fallback
- **PWA**: Progressive Web App with manifest.json
- **Deployment**: GitHub Pages (static files only)
- **Architecture**: Atomic state management with recovery mechanisms

### Architecture Highlights
- **Atomic State Management**: StateManager provides atomic updates with per-type flags
- **Anti-Circulation Protection**: Advanced `isUpdatingFromState` mechanism prevents circular updates
- **Storage Migration**: Automatic handling of storage key conflicts and version upgrades
- **Error Recovery**: Comprehensive error handling with memory storage fallback
- **Event Deduplication**: Prevents duplicate event listener registration
- **Graceful Degradation**: Continues working even when browser features are unavailable
- **Unified Time Management**: Standardized milliseconds/minutes conversion throughout
- **Resource Cleanup**: Proper cleanup of timers, listeners, and observers

## Project Structure

```
work-reminder/
├── index.html                    # Main page
├── 404.html                      # Error page
├── styles/
│   └── main.css                  # Main stylesheet with responsive design
├── js/
│   ├── app.js                    # Main application orchestrator with dependency injection
│   ├── state-manager.js          # Atomic state management with anti-circulation protection
│   ├── storage-manager.js        # Storage abstraction with migration support
│   ├── app-settings.js           # Settings validation and defaults
│   ├── notification-service.js   # Notification handling with fallbacks
│   ├── reminder-manager.js       # Base reminder functionality with error recovery
│   ├── water-reminder.js         # Water reminder with atomic state updates
│   ├── standup-reminder.js       # Standup reminder with atomic state updates
│   ├── ui-controller.js          # UI management with event cleanup
│   ├── error-handler.js          # Comprehensive error handling and recovery
│   └── mobile-adapter.js         # Mobile optimization with event deduplication
├── assets/                       # Static resources (icons, audio)
├── manifest.json                 # PWA configuration
├── package.json                  # Project configuration
└── README.md                     # Project documentation
```

## Development Notes

This project follows strict MVP (Minimum Viable Product) principles with enterprise-grade reliability:

### Core Improvements Applied

**1. Atomic State Management**
- **Per-type update flags**: `isUpdatingFromState` now uses Map-based tracking per state type
- **Update queues**: Prevents race conditions with atomic state updates
- **State migration**: Automatic handling of storage key conflicts and version upgrades
- **Consistent naming**: Standardized storage keys with version control

**2. Timer Management**
- **Atomic timer operations**: Prevents synchronization issues during rapid state changes
- **Standardized time units**: All internal calculations use milliseconds, UI uses minutes
- **Timer cleanup**: Proper disposal of timers to prevent memory leaks
- **Recovery mechanisms**: Automatic timer reset on critical errors

**3. UI Synchronization**
- **State-driven updates**: All UI updates flow through StateManager subscriptions
- **Debounced rendering**: Prevents excessive DOM updates during rapid state changes
- **Event cleanup**: Comprehensive cleanup of DOM event listeners
- **Responsive breakpoints**: Dynamic handling of mobile/desktop transitions

**4. Component Dependencies**
- **Unified dependency injection**: All components receive StateManager via constructor
- **Initialization order**: Guaranteed proper initialization sequence
- **Resource cleanup**: Complete cleanup on application shutdown
- **Error boundaries**: Isolated error handling per component

**5. Mobile Event Management**
- **Event deduplication**: Prevents duplicate resize/orientation listeners
- **Efficient observers**: Uses ResizeObserver when available, falls back to debounced resize
- **Touch optimization**: Mobile-specific optimizations without duplicate registration
- **Viewport management**: Dynamic viewport adjustments for mobile devices

**6. Error Recovery System**
- **Memory storage fallback**: Continues operation when localStorage is unavailable
- **Graceful degradation**: Reduces functionality but maintains core features
- **User-friendly messages**: Clear communication of issues and solutions
- **Error statistics**: Comprehensive logging and recovery tracking

### Architecture Decisions

**State Management Architecture**:
- **Atomic Operations**: All state changes are atomic and reversible
- **Anti-Circulation**: Advanced mechanism prevents circular state updates
- **Storage Abstraction**: Unified interface handles both localStorage and memory storage
- **Migration System**: Automatic handling of storage format changes
- **Validation Layer**: Comprehensive state validation before updates

**Error Handling Strategy**:
- **Hierarchical Error Handling**: Errors handled at component level with global fallback
- **Recovery Mechanisms**: Automatic recovery for storage, notifications, and timers
- **User Communication**: Clear, actionable error messages for users
- **Logging System**: Comprehensive error tracking with privacy considerations

**Performance Optimizations**:
- **Debounced Updates**: Prevents excessive DOM manipulation
- **Efficient Observers**: Uses modern browser APIs for performance
- **Memory Management**: Proactive cleanup of resources
- **Minimal Re-renders**: State-driven updates prevent unnecessary work

## Browser Support

- **Chrome 60+** - Full feature support
- **Firefox 55+** - Full feature support  
- **Safari 12+** - Full feature support
- **Edge 79+** - Full feature support
- **Mobile browsers** - Responsive design with touch optimizations
- **Legacy browsers** - Graceful degradation with memory storage fallback

## Development Progress

### ✅ Completed Features
- [x] **Atomic state management** with anti-circulation protection
- [x] **Storage migration** system for key conflicts and version upgrades
- [x] **Timer synchronization** with atomic operations
- [x] **Event deduplication** for mobile/desktop transitions
- [x] **Comprehensive error recovery** with memory storage fallback
- [x] **Resource cleanup** for all components and event listeners
- [x] **Time unit standardization** across all components
- [x] **Dependency injection** unification across all components
- [x] **Mobile optimization** with efficient event handling
- [x] **Error boundaries** with graceful degradation
- [x] **Performance optimizations** with debounced updates
- [x] **User experience** improvements with clear error messages

### 🔄 Enhanced Features
- [x] **StateManager** - Atomic updates, migration support, error recovery
- [x] **ReminderManager** - Timer synchronization, error handling, cleanup
- [x] **UIController** - Event cleanup, responsive handling, state synchronization
- [x] **ErrorHandler** - Comprehensive recovery, user communication, statistics
- [x] **MobileAdapter** - Event deduplication, efficient observers, touch optimization
- [x] **StorageManager** - Migration support, key conflict resolution, fallback handling

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
   - Check browser console for any error messages

### Testing Checklist

**Functionality Tests**:
- [ ] Water reminder triggers at configured interval
- [ ] Standup reminder triggers at configured interval
- [ ] Settings persist after page refresh
- [ ] Notifications work (grant permission when prompted)
- [ ] Mobile responsive design works correctly
- [ ] Error handling displays user-friendly messages

**Edge Case Tests**:
- [ ] Local storage disabled (should use memory storage)
- [ ] Notifications blocked (should use in-page alerts)
- [ ] Rapid setting changes (should not cause race conditions)
- [ ] Browser resize between mobile/desktop (should adapt smoothly)
- [ ] Page refresh during active reminders (should restore state)

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
   git commit -m "Enhanced: Atomic state management and error recovery"
   git push origin main
   ```

3. **Automatic Process**
   - GitHub Actions detects the push
   - Automatically deploys to `gh-pages` branch
   - GitHub Pages serves the updated site
   - Usually takes 1-2 minutes to go live

### Verification After Deployment

- ✅ Visit your GitHub Pages URL
- ✅ Test water reminder functionality with different intervals
- ✅ Test standup reminder functionality with different intervals
- ✅ Test on mobile devices with touch interactions
- ✅ Test error scenarios (block notifications, disable localStorage)
- ✅ Check browser console for any warnings or errors
- ✅ Verify responsive design on various screen sizes

### Troubleshooting

**Common Issues and Solutions**:

**Storage Issues**:
- **Problem**: Settings don't persist
- **Solution**: Check browser settings for localStorage permissions, memory storage will be used as fallback

**Notification Issues**:
- **Problem**: No notifications appear
- **Solution**: Grant notification permissions, in-page alerts will be used as fallback

**Timer Issues**:
- **Problem**: Reminders don't trigger
- **Solution**: Check browser console for errors, timers will auto-reset on errors

**Mobile Issues**:
- **Problem**: Layout issues on mobile
- **Solution**: Clear browser cache, check responsive breakpoints in console

**State Issues**:
- **Problem**: Settings don't apply correctly
- **Solution**: Check StateManager initialization in browser console

For detailed troubleshooting, see error messages in browser console and check the ErrorHandler statistics.

## License

MIT License

---

**Enhanced for reliability and user experience** ❤️

**Architecture**: Atomic state management with comprehensive error recovery
**Performance**: Optimized for minimal resource usage and maximum reliability
**User Experience**: Clear feedback, graceful degradation, and intuitive interactions