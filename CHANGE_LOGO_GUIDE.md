# How to Change Application Logo

This guide explains how to update the app icons and logos for both Android and Web platforms in your Expo React Native app.

## Current Configuration

Your app.json is already configured with these paths:
- **Main Icon**: `./assets/icon.png` (1024x1024px)
- **Android Adaptive Icon**: `./assets/adaptive-icon.png` (1024x1024px)
- **Splash Screen**: `./assets/splash-icon.png` (1024x1024px)
- **Web Favicon**: `./assets/favicon.png` (32x32px)

## Quick Start - Simple Method

### 1. Prepare Your Logo
Create a high-quality square logo in PNG format (transparent background recommended).

### 2. Resize for Different Platforms
Use an online tool like [favicon.io](https://favicon.io/favicon-generator/) or [realfavicongenerator.net](https://realfavicongenerator.net/) to generate all required sizes.

### 3. Replace Current Assets
Replace these files in your `assets/` folder:

#### For Android & iOS
- Replace `assets/icon.png` (1024x1024px)
- Replace `assets/adaptive-icon.png` (1024x1024px)
- Replace `assets/splash-icon.png` (1024x1024px)

#### For Web
- Replace `assets/favicon.png` (32x32px)

### 4. Test the Changes
```bash
# Clear cache and restart
npx expo start --clear

# Or for web specifically
npm run web
```

## Advanced Method - Full Icon Set

### Android Icons Setup

1. **Create Android icon structure:**
```bash
mkdir -p assets/android/mipmap-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}
```

2. **Generate icons in these sizes:**
- `mipmap-mdpi/ic_launcher.png` - 48x48px
- `mipmap-hdpi/ic_launcher.png` - 72x72px
- `mipmap-xhdpi/ic_launcher.png` - 96x96px
- `mipmap-xxhdpi/ic_launcher.png` - 144x144px
- `mipmap-xxxhdpi/ic_launcher.png` - 192x192px

3. **Update app.json for custom Android icons:**
```json
{
  "expo": {
    "android": {
      "icon": "./assets/android/mipmap-mdpi/ic_launcher.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

### Web Icons Setup

1. **Create web icon structure:**
```bash
mkdir -p assets/web
```

2. **Generate web icons in these sizes:**
- `favicon-16x16.png` - 16x16px
- `favicon-32x32.png` - 32x32px
- `apple-touch-icon.png` - 180x180px
- `android-chrome-192x192.png` - 192x192px
- `android-chrome-512x512.png` - 512x512px

3. **Create web manifest:**
```json
// assets/web/site.webmanifest
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

4. **Update app.json for web:**
```json
{
  "expo": {
    "web": {
      "favicon": "./assets/web/favicon-32x32.png",
      "manifest": "./assets/web/site.webmanifest"
    }
  }
}
```

## Splash Screen Customization

### Change Splash Screen Background Color
Update `app.json`:
```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#475569"
    }
  }
}
```

### Custom Splash Screen (Advanced)
For more control, create a custom splash screen component and update `App.tsx`.

## Testing Your Changes

### Android
```bash
# Test on Android device/emulator
npx expo start --android

# Or build for production
npx eas build --platform android
```

### Web
```bash
# Test web version
npx expo start --web

# Build for production
npx expo export --platform web
```

### iOS (if needed)
```bash
# Test on iOS simulator
npx expo start --ios

# Build for production
npx eas build --platform ios
```

## Best Practices

1. **Use PNG format** with transparent backgrounds
2. **Square aspect ratio** (1:1) for all icons
3. **High resolution** - start with 1024x1024px and scale down
4. **Consistent branding** across all platforms
5. **Test on actual devices** - emulators may not show adaptive icons correctly
6. **Clear Expo cache** after making changes: `npx expo start --clear`

## Troubleshooting

### Icons not updating?
- Clear Metro cache: `npx expo start --clear`
- Clear Expo cache: `npx expo r -c`
- Rebuild assets: `npx expo start --clear --offline`

### Android adaptive icons not working?
- Ensure `adaptive-icon.png` has transparent background
- Check background color in app.json matches your design
- Test on physical Android device (emulators may not show adaptive icons)

### Web favicon not updating?
- Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- Clear browser cache
- Check if favicon path in app.json is correct

## Tools for Icon Generation

1. **favicon.io** - Free online favicon generator
2. **realfavicongenerator.net** - Comprehensive icon set generator
3. **ImageMagick** - Command line tool for batch resizing
4. **Android Asset Studio** - Google's official icon generator

## Production Deployment

After updating icons, rebuild your app:

```bash
# For development builds
npx eas build --platform android --profile development

# For production builds
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
npx expo export --platform web
```

Your new logos will be included in the builds and visible when users install your app!
