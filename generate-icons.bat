@echo off
REM Icon Generator Script for TimeTrackerApp (Windows)
REM Place your logo.png (1024x1024px) in the assets folder and run this script

echo 🖼️  Generating app icons from logo.png...

REM Check if logo.png exists
if not exist "assets/logo.png" (
    echo ❌ Error: assets/logo.png not found!
    echo 📝 Please place your 1024x1024px logo.png in the assets folder
    pause
    exit /b 1
)

REM Create Android icon directories
echo 📁 Creating Android icon directories...
mkdir assets\android\mipmap-hdpi 2>nul
mkdir assets\android\mipmap-mdpi 2>nul
mkdir assets\android\mipmap-xhdpi 2>nul
mkdir assets\android\mipmap-xxhdpi 2>nul
mkdir assets\android\mipmap-xxxhdpi 2>nul

REM Generate Android icons using ImageMagick or similar tool
echo 🤖 Generating Android icons...
REM Note: Requires ImageMagick to be installed
REM You can also use online tools or other image processing software

magick convert assets/logo.png -resize 48x48 assets/android/mipmap-mdpi/ic_launcher.png
magick convert assets/logo.png -resize 72x72 assets/android/mipmap-hdpi/ic_launcher.png
magick convert assets/logo.png -resize 96x96 assets/android/mipmap-xhdpi/ic_launcher.png
magick convert assets/logo.png -resize 144x144 assets/android/mipmap-xxhdpi/ic_launcher.png
magick convert assets/logo.png -resize 192x192 assets/android/mipmap-xxxhdpi/ic_launcher.png

REM Copy main icons
echo 📋 Copying main icons...
copy assets/logo.png assets/icon.png
copy assets/logo.png assets/adaptive-icon.png
copy assets/logo.png assets/splash-icon.png

REM Generate web icons
echo 🌐 Generating web icons...
mkdir assets/web 2>nul

REM Web favicons
magick convert assets/logo.png -resize 16x16 assets/web/favicon-16x16.png
magick convert assets/logo.png -resize 32x32 assets/web/favicon-32x32.png
copy assets/web/favicon-32x32.png assets/favicon.png

REM Web app icons
magick convert assets/logo.png -resize 180x180 assets/web/apple-touch-icon.png
magick convert assets/logo.png -resize 192x192 assets/web/android-chrome-192x192.png
magick convert assets/logo.png -resize 512x512 assets/web/android-chrome-512x512.png

REM Create web manifest
echo 📄 Creating web manifest...
(
echo {
echo   "name": "TimeTrackerApp",
echo   "short_name": "TimeTracker",
echo   "icons": [
echo     {
echo       "src": "/android-chrome-192x192.png",
echo       "sizes": "192x192",
echo       "type": "image/png"
echo     },
echo     {
echo       "src": "/android-chrome-512x512.png",
echo       "sizes": "512x512",
echo       "type": "image/png"
echo     }
echo   ],
echo   "theme_color": "#475569",
echo   "background_color": "#ffffff",
echo   "display": "standalone"
echo }
) > assets/web/site.webmanifest

echo ✅ All icons generated successfully!
echo.
echo 📱 Next steps:
echo 1. Update app.json if needed ^(see CHANGE_LOGO_GUIDE.md^)
echo 2. Clear Expo cache: npx expo start --clear
echo 3. Test on device: npx expo start --android
echo.
echo 🎉 Your new logo is ready!
pause
