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

## Quick Start

### Online Access
Visit the live demo: [Office Wellness Reminder](https://starry3085.github.io/work-reminder/)

### Local Development

1. **Clone and Setup**
   ```bash
   git clone https://github.com/yourusername/office-wellness-reminder.git
   cd office-wellness-reminder
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

### Automatic Deployment (Recommended)

This project uses **GitHub Actions** for automatic deployment:

1. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Automatic Process**
   - GitHub Actions detects the push
   - Automatically deploys to `gh-pages` branch
   - GitHub Pages serves the updated site
   - Usually takes 1-2 minutes to go live

3. **Setup GitHub Pages** (One-time setup)
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `/ (root)`
   - Save settings

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