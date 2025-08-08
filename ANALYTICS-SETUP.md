# Analytics Setup Guide

## Overview
This application uses Baidu Analytics (百度统计) for minimal user engagement tracking. Only two core events are tracked:
- Water reminder completion (`water_done`)
- Standup reminder completion (`standup_done`)

## Setup Instructions

### 1. Get Baidu Analytics ID
1. Visit [Baidu Analytics](https://tongji.baidu.com/)
2. Register/login with your Baidu account
3. Add your website domain: `https://starry3085.github.io/hydrate-move/`
4. Get your tracking ID (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. Configure Tracking ID
1. Open `index.html`
2. Find the Baidu Analytics script section:
```html
<!-- Baidu Analytics -->
<script>
var _hmt = _hmt || [];
(function() {
    var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?YOUR_BAIDU_ANALYTICS_ID";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(hm, s);
})();
</script>
```
3. Replace `YOUR_BAIDU_ANALYTICS_ID` with your actual tracking ID

### 3. Verify Setup
1. Deploy the updated code to GitHub Pages
2. Visit your website and trigger some reminders
3. Click "Done" on reminder notifications
4. Check Baidu Analytics dashboard for event data (may take 24-48 hours to appear)

## What Gets Tracked

### Core Events
- **water_done**: User clicked "Done" on water reminder notification
- **standup_done**: User clicked "Done" on standup reminder notification

### Event Parameters
- Category: `engagement`
- Action: `water_done` or `standup_done`
- Label: (empty)
- Value: `1`

### Privacy
- No personal information is collected
- No user identification or tracking across sessions
- Only anonymous usage statistics for product improvement

## Analytics Code Structure

### Files Modified
- `index.html`: Added Baidu Analytics tracking script
- `js/analytics.js`: Analytics wrapper class
- `js/app.js`: Analytics initialization
- `js/notification-service.js`: Event tracking on Done button clicks

### Key Functions
- `Analytics.trackWaterCompleted()`: Tracks water reminder completion
- `Analytics.trackStandupCompleted()`: Tracks standup reminder completion

## Troubleshooting

### Analytics Not Working
1. Check browser console for errors
2. Verify tracking ID is correct
3. Ensure website is deployed and accessible
4. Wait 24-48 hours for data to appear in Baidu Analytics

### Disable Analytics
To disable analytics tracking:
```javascript
// In browser console
if (window.app && window.app.analytics) {
    window.app.analytics.setEnabled(false);
}
```

## Data Usage
The collected data helps answer:
- Are users actually using the reminder features?
- Which reminder type is more popular?
- Should we adjust the default 30-minute interval?
- Is the PWA functionality worth developing further?

This minimal analytics approach follows the "极简且合规" principle - collecting only essential data for product improvement while respecting user privacy.