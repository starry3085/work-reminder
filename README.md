# Office Wellness Reminder

A simple, privacy-first web application that helps office workers maintain healthy habits through water and standup reminders.

## Features

- **Water Reminders**: Customizable intervals (1-60 minutes) to remind you to stay hydrated
- **Standup Reminders**: Regular prompts (1-60 minutes) to take breaks and move around
- **Browser Notifications**: Native browser notifications with fallback to in-page alerts
- **Privacy-First**: All data stays on your device - no external servers or tracking
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Offline Ready**: Functions without internet connection after initial load

## Recent Fixes & Improvements

### 🐛 Bug Fixes
- **Fixed START button responsiveness**: Enhanced event binding and initialization order
- **Fixed time display inconsistency**: Stand-up reminder now correctly displays 30 minutes instead of 45
- **Improved initialization reliability**: Added comprehensive error handling and validation
- **Enhanced DOM readiness**: Ensures all elements are properly loaded before event binding

### ✨ Improvements
- **Better error handling**: Added user-friendly error messages and recovery mechanisms
- **Component validation**: Validates all critical components during initialization
- **Real-time synchronization**: UI now accurately reflects actual reminder settings
- **Retry mechanisms**: Automatic retry for failed UI updates
- **Enhanced logging**: Detailed console logging for debugging and monitoring

## Quick Start

1. Open the application in your web browser
2. Allow notifications when prompted (optional but recommended)
3. Adjust reminder intervals using the number inputs (default: Water 30min, Standup 30min)
4. Click "Start" on the reminders you want to activate
5. The app will show countdown timers and remind you at the specified intervals

## How It Works

### Water Reminder
- Default: Every 30 minutes
- Customizable from 1-60 minutes via inline input
- Shows countdown timer when active (e.g., "29:45")
- Shows full interval time when inactive (e.g., "30:00")
- Browser and in-page notifications

### Standup Reminder
- Default: Every 30 minutes (same as water for consistency)
- Customizable from 1-60 minutes via inline input
- Encourages movement and posture breaks
- Visual and audio notifications

## User Interface

### Reminder Cards
Each reminder shows:
- **Remind every**: Editable interval input (1-60 minutes)
- **Remind after**: Countdown display showing time remaining
- **Start/Stop button**: Toggle reminder on/off

### Button States
- **Start** (blue): Click to begin countdown
- **Stop** (orange): Click to stop active reminder

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Privacy & Data

- **No data collection**: We don't collect any personal information
- **Local storage only**: Settings saved in your browser's local storage
- **No external connections**: Works completely offline after loading
- **No tracking**: No analytics, cookies, or third-party scripts

## Technical Architecture (MVP)

### Core Components
- **UIController**: Manages DOM updates and user interactions
- **ReminderManager**: Base class for timer functionality
- **WaterReminder/StandupReminder**: Specific reminder implementations
- **NotificationService**: Handles browser and in-page notifications
- **StorageManager**: Simple localStorage wrapper
- **ErrorHandler**: Basic error handling and recovery

### Key Features
- **Simplified State Management**: Direct DOM manipulation without complex state layers
- **Real-time Updates**: 1-second interval updates for countdown display
- **Responsive Design**: Mobile-first approach with touch-friendly controls
- **Error Recovery**: Graceful degradation when features unavailable

## Development

This is a static web application built with vanilla JavaScript following MVP principles.

### Local Development
```bash
# Serve locally (recommended for testing)
python -m http.server 8000
# or
npx http-server

# Open http://localhost:8000
```

### File Structure
```
├── index.html              # Main application page
├── styles/main.css         # All styles and responsive design
├── js/
│   ├── app.js             # Application orchestrator
│   ├── ui-controller.js   # DOM management and user interactions
│   ├── reminder-manager.js # Base reminder functionality
│   ├── water-reminder.js  # Water-specific reminder
│   ├── standup-reminder.js # Standup-specific reminder
│   ├── notification-service.js # Notification handling
│   ├── storage-manager.js # Simple localStorage wrapper
│   └── error-handler.js   # Basic error handling
└── README.md              # This file
```

### Deployment
Simply upload all files to any static web hosting service:
- GitHub Pages
- Netlify
- Vercel
- Any web server supporting static files

## License

MIT License - feel free to use and modify as needed.