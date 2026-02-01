# Setup Guide

This project consists of three parts:
- **Backend**: Python FastAPI app with Pydantic AI (Dockerized).
- **Web**: React TypeScript app for user login and dashboard.
- **Mobile**: Bare React Native TypeScript app for iOS with Live Activities.

## Prerequisites

- Node.js 24.13.0 (use `nvm use`)
- Python 3.9+
- Docker (for backend deployment)
- Apple Developer Account (for APNs and Live Activities)
- Firebase Project (for Auth and Firestore)
- CocoaPods & Xcode (for iOS build)

## 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** and add **Google** and **Apple** providers.
3. Enable **Firestore Database** in production mode.
4. **Backend Auth**: Generate a Service Account Key for the backend:
   - Project Settings -> Service accounts -> Generate new private key.
   - Save this file as `service-account.json` in `backend/`.
5. **Client Auth**: Create a Web App in Firebase console and get the config object (apiKey, authDomain, etc.).
   - Update `web/.env` with these values.
   - Update `mobile/firebaseConfig.ts` with these values.

## 2. Apple Developer Setup

1. Create a Key for Apple Push Notifications service (APNs).
   - Apple Developer Portal -> Keys -> Create a key -> Enable Apple Push Notifications service (APNs).
   - Download the `.p8` file.
   - Place it in `backend/` (e.g., `authkey.p8`).
   - Note the **Key ID** and your **Team ID**.
2. Create an App ID with "Push Notifications" capability enabled.

## 3. Backend Setup

### Local
1. Navigate to `backend/`.
2. Create `.env`:
   ```
   FIREBASE_CREDENTIALS_PATH=service-account.json
   APPLE_TEAM_ID=your_team_id
   APPLE_KEY_ID=your_key_id
   APPLE_BUNDLE_ID=your_bundle_id
   APPLE_P8_PATH=authkey.p8
   OPENAI_API_KEY=your_openai_key (Optional)
   APNS_ENV=sandbox
   APP_VERSION=local
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run:
   ```bash
   uvicorn main:app --reload
   ```

### Docker
```bash
cd backend
docker build --build-arg APP_VERSION=v1.0.0 -t myapp-backend .
docker run -p 8000:8000 myapp-backend
```

## 4. Web App Setup

1. Navigate to `web/`.
2. Create `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   # ... other firebase config
   ```
3. Run:
   ```bash
   npm install
   npm run dev
   ```

## 5. Mobile App Setup (Bare React Native)

1. Navigate to `mobile/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. **iOS Setup**:
   - `cd ios`
   - `pod install`
   - Open `mobile.xcworkspace` in Xcode.
4. **Live Activity Setup**:
   - In Xcode, File -> New -> Target -> Widget Extension.
   - Check "Include Live Activity". Name it "MyActivity".
   - **Crucial**: Ensure the `LiveActivityAttributes` struct in your Widget Extension matches `mobile/ios/mobile/LiveActivityAttributes.swift`. You may need to share this file between targets or copy the definition.
   - The native module logic is already in `mobile/ios/mobile/LiveActivityModule.swift` and exposed via `LiveActivityModule.m`.
5. **Run**:
   ```bash
   npx react-native run-ios
   ```

## TestFlight Deployment

To deploy the iOS application to TestFlight for beta testing:

1.  **Prepare for Archive**:
    -   Open `mobile/ios/mobile.xcworkspace` in Xcode.
    -   Select your generic iOS Device (Any iOS Device) as the build target.
    -   Ensure your **Signing & Capabilities** are correctly configured with your Apple Distribution Certificate and Provisioning Profile.

2.  **Archive**:
    -   Go to **Product** > **Archive**.
    -   Xcode will build the app and the Widget Extension. Wait for the Archives window to appear.

3.  **Upload to App Store Connect**:
    -   Select the latest archive in the Organizer window.
    -   Click **Distribute App**.
    -   Select **App Store Connect** > **Upload**.
    -   Follow the wizard (validation checks, managing symbols, etc.).
    -   Click **Upload**.

4.  **TestFlight**:
    -   Log in to [App Store Connect](https://appstoreconnect.apple.com).
    -   Go to **My Apps** > Select your app > **TestFlight** tab.
    -   Once the build finishes processing (this may take a few minutes to an hour), it will appear in the list.
    -   Add **Internal Testing** groups or individual testers to invite them to download the app via the TestFlight app.

## Release Workflow

GitHub Action `release.yml` triggers on tags (`v*`).
- **Backend**: Builds Docker image with tag version.
- **Web**: Builds static site with tag version.
- **Mobile**: Bundles JS for iOS/Android (does not build IPA/APK).
