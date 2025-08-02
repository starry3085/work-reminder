# Product Guidelines

## Core Principles

### Development Constraints (CRITICAL)
- **Pure Frontend Only**: No backend server, no APIs, no databases
- **GitHub Pages Compatible**: Static files only, no build process required
- **Privacy-First**: All data stays on user's device (localStorage only)
- **No Registration**: Zero user accounts or external dependencies

### Feature Priorities
1. **Water Reminder** - Primary feature, simple and reliable
2. **Standup Reminder** - Secondary feature with simple time-based reminders
3. **Settings Persistence** - Essential for user experience
4. **Responsive Design** - Must work on mobile and desktop

### User Experience Guidelines
- **Non-Intrusive**: Notifications should not disrupt work flow
- **Accessible**: Follow WCAG guidelines for accessibility
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Offline-First**: Must work without internet connection

### Technical Constraints
- **Vanilla JavaScript**: No frameworks or libraries
- **Modern Web APIs**: Use native browser capabilities
- **Lightweight**: Minimize resource usage and load times
- **Cross-Browser**: Support Chrome, Firefox, Safari, Edge