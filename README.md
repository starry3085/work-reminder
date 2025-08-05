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
- **Architecture**: Direct state management with minimal complexity

### Architecture Highlights
- **Direct State Management**: Simple boolean flags and direct property access
- **Minimal Complexity**: No complex state synchronization or anti-circulation mechanisms
- **Clean Architecture**: Each component manages its own state independently
- **Immediate Updates**: Real-time state changes without synchronization delays
- **Easy Debugging**: Direct state inspection without abstraction layers
- **Graceful Degradation**: Continues working even when browser features are unavailable
- **Resource Efficiency**: Minimal memory usage and CPU overhead
- **MVP Principles**: Maximum functionality with minimum code complexity

## Project Structure

```
work-reminder/
├── index.html                    # Main page
├── 404.html                      # Error page
├── styles/
│   └── main.css                  # Main stylesheet with responsive design
├── js/
│   ├── app.js                    # Main application orchestrator
│   ├── storage-manager.js        # Simple storage abstraction
│   ├── app-settings.js           # Settings validation and defaults
│   ├── notification-service.js   # Notification handling with fallbacks
│   ├── reminder-manager.js       # Base reminder functionality
│   ├── water-reminder.js         # Water reminder implementation
│   ├── standup-reminder.js       # Standup reminder implementation
│   ├── ui-controller.js          # UI management with direct state access
│   ├── error-handler.js          # Error handling and recovery
│   └── mobile-adapter.js         # Mobile optimization
├── assets/                       # Static resources (icons, audio)
├── manifest.json                 # PWA configuration
├── package.json                  # Project configuration
└── README.md                     # Project documentation
```

## Development Notes

This project follows strict MVP (Minimum Viable Product) principles with enterprise-grade reliability:

### Core Improvements Applied

**1. Direct State Management**
- **Simple boolean flags**: Direct property access without abstraction layers
- **Immediate updates**: Real-time state changes without synchronization delays
- **Easy debugging**: Direct state inspection and modification
- **Clean architecture**: Each component manages its own state independently

**2. Simplified Timer Management**
- **Direct timer control**: Each reminder manages its own timers directly
- **Standardized time units**: All internal calculations use milliseconds, UI uses minutes
- **Timer cleanup**: Proper disposal of timers to prevent memory leaks
- **Simple recovery**: Automatic restart on page refresh

**3. Direct UI Synchronization**
- **Immediate state access**: UI reads state directly from reminder instances
- **Real-time updates**: Changes reflected instantly without synchronization
- **Event cleanup**: Comprehensive cleanup of DOM event listeners
- **Responsive design**: Dynamic handling of mobile/desktop transitions

**4. Simplified Component Architecture**
- **No dependency injection**: Components created with minimal parameters
- **Direct initialization**: Simple creation and connection of components
- **Resource cleanup**: Complete cleanup on application shutdown
- **Error handling**: Isolated error handling per component

**5. Efficient Mobile Support**
- **Event deduplication**: Prevents duplicate resize/orientation listeners
- **Efficient observers**: Uses ResizeObserver when available, falls back to debounced resize
- **Touch optimization**: Mobile-specific optimizations without duplicate registration
- **Viewport management**: Dynamic viewport adjustments for mobile devices

**6. Reliable Error Handling**
- **Memory storage fallback**: Continues operation when localStorage is unavailable
- **Graceful degradation**: Reduces functionality but maintains core features
- **User-friendly messages**: Clear communication of issues and solutions
- **Simple recovery**: Automatic restart on page refresh

### Architecture Decisions

**State Management Architecture**:
- **Direct Access**: Components access state through direct property access
- **No Abstraction**: No complex state management layer or synchronization
- **Simple Storage**: Direct localStorage usage with minimal wrapper
- **Clear Boundaries**: Each component owns and manages its own state
- **Immediate Updates**: State changes are reflected immediately without delay

**Error Handling Strategy**:
- **Component-level Handling**: Each component handles its own errors
- **Simple Recovery**: Automatic restart on page refresh
- **User Communication**: Clear, actionable error messages for users
- **Minimal Logging**: Essential error logging without complexity

**Performance Optimizations**:
- **Direct Updates**: Immediate state changes without synchronization overhead
- **Efficient Observers**: Uses modern browser APIs for performance
- **Memory Management**: Proactive cleanup of resources
- **Minimal Complexity**: Maximum functionality with minimum code

## Browser Support

- **Chrome 60+** - Full feature support
- **Firefox 55+** - Full feature support  
- **Safari 12+** - Full feature support
- **Edge 79+** - Full feature support
- **Mobile browsers** - Responsive design with touch optimizations
- **Legacy browsers** - Graceful degradation with memory storage fallback

## Development Progress

### ✅ Completed Features
- [x] **Direct state management** with simple boolean flags
- [x] **Immediate state updates** without synchronization delays
- [x] **Clean component architecture** with minimal dependencies
- [x] **Simple error handling** with memory storage fallback
- [x] **Resource cleanup** for all components and event listeners
- [x] **Time unit standardization** across all components
- [x] **Mobile optimization** with efficient event handling
- [x] **User experience** improvements with clear error messages
- [x] **MVP principles** - Maximum functionality with minimum complexity

### 🔄 Enhanced Features
- [x] **Direct state access** - No complex state management layer
- [x] **ReminderManager** - Simple timer management with error handling
- [x] **UIController** - Direct state access and responsive handling
- [x] **ErrorHandler** - Simple recovery and user communication
- [x] **MobileAdapter** - Efficient event handling and touch optimization
- [x] **StorageManager** - Simple storage abstraction with fallback

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