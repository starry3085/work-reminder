# Office Wellness Reminder

A health reminder web application designed specifically for office workers to help develop good work habits.

## Features

- 🥤 **Water Reminder** - Timed reminders to stay hydrated and maintain good health
- 🪑 **Standup Reminder** - Smart activity detection to remind you to get up and move
- 🔔 **Multiple Notification Types** - Support for browser notifications and in-page alerts
- ⚙️ **Personalized Settings** - Customizable reminder intervals and notification preferences
- 📱 **Responsive Design** - Perfect compatibility with desktop and mobile devices
- 💾 **Local Storage** - Automatic settings save, no account registration required

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 + Flexbox/Grid
- **Storage**: localStorage API
- **Notifications**: Web Notifications API
- **Deployment**: GitHub Pages
- **Development Tools**: Kiro AI Assistant with automated documentation updates

## Project Structure

```
office-wellness-reminder/
├── index.html              # Main page
├── 404.html               # Error page
├── styles/
│   └── main.css           # Main stylesheet
├── js/
│   ├── app.js             # Main application file
│   ├── storage-manager.js # Storage manager
│   ├── app-settings.js    # Application settings
│   ├── notification-service.js # Notification service
│   ├── activity-detector.js    # Activity detector
│   ├── reminder-manager.js     # Reminder manager
│   ├── water-reminder.js       # Water reminder
│   ├── standup-reminder.js     # Standup reminder
│   ├── ui-controller.js        # UI controller
│   ├── error-handler.js        # Error handler
│   └── mobile-adapter.js       # Mobile adapter
├── assets/                # Static resources (icons, audio)
├── manifest.json          # PWA configuration
├── package.json           # Project configuration
└── README.md              # Project documentation
```

## Development Notes

This project is a Kiro Hackathon entry, strictly following competition rules:
- Pure frontend implementation, no backend server required
- Direct deployment to GitHub Pages
- Modern web technology stack
- Focus on user experience and accessibility

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

- [x] Project foundation structure
- [x] Storage management system
- [x] Notification service
- [x] User activity detection
- [x] Reminder management core functionality
- [x] UI interaction control
- [x] Responsive design
- [x] Testing and optimization
- [x] GitHub Pages deployment

## Deployment Guide

### GitHub Pages Deployment

1. Fork or clone this repository
2. Enable GitHub Pages:
   - Go to repository settings -> Pages
   - Select `gh-pages` branch as source
   - Click save
3. Automatic deployment will execute after each push to `main` branch
4. Visit `https://<your-username>.github.io/office-wellness-reminder/` to view the application

### Local Development

1. Clone repository: `git clone https://github.com/yourusername/office-wellness-reminder.git`
2. Enter project directory: `cd office-wellness-reminder`
3. Run project using local server:
   - Using Python: `python -m http.server`
   - Or using Node.js: `npx serve`
4. Access `http://localhost:8000` in browser

## License

MIT License

---

Designed for healthy office work ❤️