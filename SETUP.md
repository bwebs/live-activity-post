# Setup Guide

This project consists of three parts:
- **Backend**: Python FastAPI app with Pydantic AI.
- **Web**: React app for user login and dashboard.
- **Mobile**: React Native (Expo) app for iOS with Live Activities.

## Prerequisites

- Node.js & npm/yarn
- Python 3.9+
- Apple Developer Account (for APNs and Live Activities)
- Firebase Project (for Auth and Firestore)

## 1. Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** and add **Google** and **Apple** providers.
3. Enable **Firestore Database** in production mode.
4. **Backend Auth**: Generate a Service Account Key for the backend:
   - Project Settings -> Service accounts -> Generate new private key.
   - Save this file as `service-account.json` in `backend/`.
5. **Client Auth**: Create a Web App in Firebase console and get the config object (apiKey, authDomain, etc.).
   - Update `web/.env` with these values.
   - Update `mobile/firebaseConfig.js` with these values.

## 2. Apple Developer Setup

1. Create a Key for Apple Push Notifications service (APNs).
   - Apple Developer Portal -> Keys -> Create a key -> Enable Apple Push Notifications service (APNs).
   - Download the `.p8` file.
   - Place it in `backend/` (e.g., `authkey.p8`).
   - Note the **Key ID** and your **Team ID**.
2. Create an App ID with "Push Notifications" capability enabled.

## 3. Backend Setup

1. Navigate to `backend/`.
2. Create `.env`:
   ```
   FIREBASE_CREDENTIALS_PATH=service-account.json
   APPLE_TEAM_ID=your_team_id
   APPLE_KEY_ID=your_key_id
   APPLE_BUNDLE_ID=your_bundle_id
   APPLE_P8_PATH=authkey.p8
   OPENAI_API_KEY=your_openai_key (Optional, for AI features)
   APNS_ENV=sandbox (or production)
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run server:
   ```bash
   uvicorn main:app --reload
   ```

## 4. Web App Setup

1. Navigate to `web/`.
2. Create `.env` based on Firebase config:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

## 5. Mobile App Setup

1. Navigate to `mobile/`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `firebaseConfig.js` with your Firebase config.
4. Update `App.js` with your Backend URL (`BACKEND_URL`).
5. **Native Integration (Live Activities)**:
   - Since Live Activities require native code, you must use a development build or prebuild.
   - Run `npx expo prebuild` to generate the `ios` directory.
   - Add a **Widget Extension** target in Xcode:
     - File -> New -> Target -> Widget Extension.
     - Ensure "Include Live Activity" is checked.
   - Copy the contents of `mobile/ios/LiveActivityAttributes.swift` into your Widget Extension's swift file.
   - Create a Native Module (Bridge) to start the activity using the code provided in `mobile/ios/LiveActivityModule.swift`.
     - You will need to wrap this in an Expo Module or a standard React Native Native Module.
6. Run the app:
   ```bash
   npx expo run:ios
   ```

## Usage Flow

1. **Web**: User logs in. Dashboard shows "Download App".
2. **Mobile**: User logs in. App asks for Push Permission.
3. **Mobile**: App generates a `webhookToken` and registers it with the Backend (saving push token).
4. **Web**: Dashboard detects the token and shows the Webhook URL.
5. **Action**: Send a POST request to the Webhook URL:
   ```bash
   curl -X POST http://localhost:8000/webhook/THE_TOKEN \
     -H "Content-Type: application/json" \
     -d '{"event": "Goal Scored", "value": 1.0}'
   ```
6. **Result**: Backend receives payload -> AI processes it -> Sends APNs Live Activity Update -> Notification appears on iPhone.
