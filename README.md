# Office Wellness Reminder

A health reminder web application designed specifically for office workers to help develop good work habits.

## Features

- 🥤 **Water Reminder** - Simple timed reminders to stay hydrated
- 🪑 **Standup Reminder** - Timed reminders to get up and move regularly
- 🔔 **Automatic Notifications** - In-page alerts that auto-dismiss after 5 seconds
- ⚙️ **Simple Settings** - Basic reminder intervals customization
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 💾 **Local Storage** - Settings saved automatically, no registration needed

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: CSS3 + Flexbox/Grid
- **Storage**: localStorage API
- **Notifications**: Web Notifications API
- **Deployment**: GitHub Pages
- **Development Tools**: Kiro AI Assistant with automated documentation updates

## Project Structure

```
work-reminder/
├── index.html              # Main page
├── 404.html               # Error page
├── styles/
│   └── main.css           # Main stylesheet
├── js/
│   ├── app.js             # Main application orchestrator
│   ├── storage-manager.js # localStorage abstraction layer
│   ├── app-settings.js    # Settings and state management
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
- [x] Simple time-based reminders (MVP focus)
- [x] Reminder management core functionality
- [x] UI interaction control
- [x] Responsive design
- [x] Code internationalization (all English)
- [x] Architecture optimization
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