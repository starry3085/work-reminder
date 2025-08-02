# Technology Stack & Build System

## Tech Stack

### Frontend
- **JavaScript**: Vanilla ES6+ (no frameworks)
- **CSS**: CSS3 with CSS Custom Properties (CSS Variables)
- **HTML**: Semantic HTML5
- **Storage**: localStorage API for data persistence
- **Notifications**: Web Notifications API
- **PWA**: Progressive Web App with manifest.json

### Development Tools
- **Package Manager**: npm
- **Local Server**: http-server for development
- **Deployment**: GitHub Pages with gh-pages package
- **AI Assistant**: Kiro AI for development automation

### Browser APIs Used
- localStorage API for settings persistence
- Web Notifications API for browser notifications
- Page Visibility API for basic state management
- Performance API for timing measurements
- sessionStorage for temporary flags

## Project Structure

```
office-wellness-reminder/
├── index.html              # Main application entry point
├── 404.html               # Error page for GitHub Pages
├── manifest.json          # PWA configuration
├── package.json           # npm configuration
├── styles/
│   └── main.css           # Main stylesheet with CSS variables
├── js/                    # JavaScript modules (class-based architecture)
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
├── assets/                # Static resources (icons, audio files)
└── test-*.html           # Testing and debugging pages
```

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start local development server
npm start
# Alternative: npx http-server . -o

# Start with Python (alternative)
python -m http.server 8000
```

### Deployment
```bash
# Deploy to GitHub Pages
npm run deploy

# Manual deployment preparation
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Testing
```bash
# No automated tests - manual testing via browser
# Use test-simple.html for basic functionality testing
# Use check-settings.html for settings validation
```

## Build Process

This is a pure frontend application with no build step required:
1. All JavaScript files are loaded directly in the browser
2. CSS uses native CSS variables (no preprocessing)
3. No bundling or minification in development
4. Direct deployment to GitHub Pages without build artifacts

## Browser Support

- Chrome 60+ (ES6 classes, CSS variables)
- Firefox 55+ (ES6 classes, CSS variables)
- Safari 12+ (ES6 classes, CSS variables)
- Edge 79+ (Chromium-based)