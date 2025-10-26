# Web Favicon Requirements

For the web version, create these files:

## Standard Favicon
- `favicon.png` - 32x32px PNG (already configured in app.json)

## Complete Web Icon Set (Recommended)
Create these additional sizes in an `assets/web/` folder:

```
assets/web/
├── favicon-16x16.png (16x16px)
├── favicon-32x32.png (32x32px) - Main favicon
├── apple-touch-icon.png (180x180px) - iOS home screen
├── android-chrome-192x192.png (192x192px)
├── android-chrome-512x512.png (512x512px)
└── site.webmanifest (manifest file)
```

## HTML Meta Tags (add to public/index.html if needed)
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
```

## Web App Manifest (site.webmanifest)
```json
{
  "name": "TimeTrackerApp",
  "short_name": "TimeTracker",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#475569",
  "background_color": "#ffffff",
  "display": "standalone"
}
```
