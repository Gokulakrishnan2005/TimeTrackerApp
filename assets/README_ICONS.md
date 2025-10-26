# Android App Icon Requirements

Create these files in your assets folder:

## Standard Icons (for iOS and basic Android)
- `icon.png` - 1024x1024px PNG

## Android Adaptive Icons (Recommended)
- `adaptive-icon.png` - 1024x1024px PNG (foreground)
- Background color is set to white in app.json

## Required Sizes for Full Compatibility
For complete Android compatibility, create these additional sizes:

```
assets/
├── icon.png (1024x1024px) - Main icon
├── adaptive-icon.png (1024x1024px) - Android adaptive foreground
└── android/
    ├── mipmap-hdpi/
    │   └── ic_launcher.png (72x72px)
    ├── mipmap-mdpi/
    │   └── ic_launcher.png (48x48px)
    ├── mipmap-xhdpi/
    │   └── ic_launcher.png (96x96px)
    ├── mipmap-xxhdpi/
    │   └── ic_launcher.png (144x144px)
    └── mipmap-xxxhdpi/
        └── ic_launcher.png (192x192px)
```
