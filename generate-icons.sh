#!/bin/bash
# Icon Generator Script for TimeTrackerApp
# Place your logo.png (1024x1024px) in the assets folder and run this script

echo "🖼️  Generating app icons from logo.png..."

# Check if logo.png exists
if [ ! -f "assets/logo.png" ]; then
    echo "❌ Error: assets/logo.png not found!"
    echo "📝 Please place your 1024x1024px logo.png in the assets folder"
    exit 1
fi

# Create Android icon directories
echo "📁 Creating Android icon directories..."
mkdir -p assets/android/mipmap-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi}

# Generate Android icons
echo "🤖 Generating Android icons..."
convert assets/logo.png -resize 48x48 assets/android/mipmap-mdpi/ic_launcher.png
convert assets/logo.png -resize 72x72 assets/android/mipmap-hdpi/ic_launcher.png
convert assets/logo.png -resize 96x96 assets/android/mipmap-xhdpi/ic_launcher.png
convert assets/logo.png -resize 144x144 assets/android/mipmap-xxhdpi/ic_launcher.png
convert assets/logo.png -resize 192x192 assets/android/mipmap-xxxhdpi/ic_launcher.png

# Copy main icons
echo "📋 Copying main icons..."
cp assets/logo.png assets/icon.png
cp assets/logo.png assets/adaptive-icon.png
cp assets/logo.png assets/splash-icon.png

# Generate web icons
echo "🌐 Generating web icons..."
mkdir -p assets/web

# Web favicons
convert assets/logo.png -resize 16x16 assets/web/favicon-16x16.png
convert assets/logo.png -resize 32x32 assets/web/favicon-32x32.png
cp assets/web/favicon-32x32.png assets/favicon.png

# Web app icons
convert assets/logo.png -resize 180x180 assets/web/apple-touch-icon.png
convert assets/logo.png -resize 192x192 assets/web/android-chrome-192x192.png
convert assets/logo.png -resize 512x512 assets/web/android-chrome-512x512.png

# Create web manifest
echo "📄 Creating web manifest..."
cat > assets/web/site.webmanifest << EOF
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
EOF

echo "✅ All icons generated successfully!"
echo ""
echo "📱 Next steps:"
echo "1. Update app.json if needed (see CHANGE_LOGO_GUIDE.md)"
echo "2. Clear Expo cache: npx expo start --clear"
echo "3. Test on device: npx expo start --android"
echo ""
echo "🎉 Your new logo is ready!"
