# Product Guidelines

## Core Principles

### Product Vision
Office Wellness Reminder is a lightweight, privacy-first web application that helps office workers maintain healthy habits through simple, non-intrusive reminders.

### User Experience Guidelines
- **Non-Intrusive**: Notifications should not disrupt work flow
- **Accessible**: Follow WCAG guidelines for accessibility
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Offline-First**: Must work without internet connection
- **Privacy-First**: All data stays on user's device (localStorage only)
- **Zero Setup**: No registration or external dependencies required
- **Simplified Configuration**: Fixed 30-minute intervals reduce complexity and decision fatigue

### Target Users
- Office workers who spend long hours at computers
- Remote workers needing health habit reminders
- Anyone seeking simple wellness tracking without complex apps

### Success Metrics
- User can set up reminders in under 30 seconds
- Notifications are helpful, not annoying
- Application works reliably across all major browsers
- Zero data privacy concerns
- Fixed 30-minute intervals provide optimal health benefits without overwhelming users

### Design Decisions
- **Fixed 30-minute intervals**: Based on health research showing optimal reminder frequency for hydration and posture breaks
- **No interval customization**: Reduces cognitive load and prevents analysis paralysis
- **Centralized constants**: Easy maintenance and consistent behavior across the application
- **GitHub-based feedback**: Leverages existing open source infrastructure, no backend required
- **Feedback button placement**: Top-right corner maintains consistency with web application conventions
- **Color hierarchy**: Demo button uses orange (#f39c12) default state to attract first-time user attention, feedback button uses subtle primary color (#2c3e50) default state to avoid distraction
- **Hover discoverability**: Both buttons use color inversion on hover - demo button darkens to primary color, feedback button highlights to orange
- **Icon sizing**: GitHub icon proportionally increased to 28px for better visual balance in 48px circular button