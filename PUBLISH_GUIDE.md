# TestFlight Publishing Guide

A complete walkthrough for shipping Scroll Tracker Browser to TestFlight for internal or external testing.

## Prerequisites

### 1. Apple Developer Account
- ✅ Active membership in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- ✅ Account status shows **Active**

### 2. Development Environment
- ✅ macOS
- ✅ Xcode installed from the App Store
- ✅ Node.js + npm installed
- ✅ Expo CLI installed

### 3. EAS CLI
```bash
npm install -g eas-cli
```

---

## Step 1: Create / Sign In to Expo

### 1.1 Create an Expo Account
Visit [https://expo.dev](https://expo.dev) and sign up if you do not already have an account.

### 1.2 Sign In via EAS CLI
```bash
eas login
```
Enter your Expo username and password when prompted.

---

## Step 2: Configure Project Metadata

### 2.1 Update `app.json`

Verify that `app.json` contains the correct configuration:

```json
{
  "expo": {
    "name": "Scroll Tracker Browser",
    "slug": "scroll-tracker-browser",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.scrolltrackerbrowser",
      "buildNumber": "1"
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

**Key fields**
- `bundleIdentifier`: Replace with your unique ID (for example `com.minghuizhu.scrolltrackerbrowser`).
- `version`: User-facing version (e.g., `1.0.0`).
- `buildNumber`: Must increase with every submission (`1`, `2`, `3`, ...).

### 2.2 Check `package.json`

Ensure the required dependencies/scripts exist:

```json
{
  "name": "scroll-tracker-browser",
  "version": "1.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

---

## Step 3: Initialize EAS Build

### 3.1 Configure EAS
```bash
eas build:configure
```
This creates the `eas.json` file.

### 3.2 Edit `eas.json`

Suggested configuration:

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Step 4: Create the App in App Store Connect

### 4.1 Sign In
Visit [https://appstoreconnect.apple.com](https://appstoreconnect.apple.com).

### 4.2 Create a New App
1. Go to **My Apps** → **+** → **New App**.
2. Fill out:
   - **Platforms**: iOS
   - **Name**: Scroll Tracker Browser
   - **Primary Language**: English (or Chinese Simplified if preferred)
   - **Bundle ID**: Must match the value in `app.json`
   - **SKU**: Unique identifier (e.g., `scroll-tracker-browser-001`)
   - **User Access**: Full Access
3. Click **Create**.

### 4.3 App Information
On the App Information page provide:
- **Subtitle**: short summary.
- **Privacy Policy URL**: link to your policy.
- **Category**: Utilities or Productivity.

---

## Step 5: Build the iOS App

### 5.1 Kick off the first build
```bash
eas build --platform ios --profile production
```

### 5.2 During the build
EAS prompts for:
1. **Apple ID**: email for your developer account.
2. **Password**: account password or App-Specific Password.
3. **Team ID**: choose your developer team.
4. **Distribution Certificate**: let EAS create one automatically or upload an existing cert.
5. **Provisioning Profile**: automatically generated.

### 5.3 Wait for completion
- Build time: roughly 10–20 minutes.
- Track progress at [expo.dev](https://expo.dev).
- You will also receive an email when the build finishes.

### 5.4 Download build artifacts
After completion:
```bash
# List builds
eas build:list

# Or open in the browser
open https://expo.dev/accounts/YOUR_USERNAME/projects/scroll-tracker-browser/builds
```

---

## Step 6: Submit to TestFlight

### 6.1 Automatic submission (recommended)
```bash
eas submit --platform ios
```
EAS will:
1. Upload the `.ipa` to App Store Connect.
2. Select the latest build.
3. Wait for Apple processing (typically 5–15 minutes).

### 6.2 Manual submission (fallback)
If automatic upload fails:
1. Download the `.ipa` from EAS.
2. Upload via the Transporter app:
   ```bash
   open -a Transporter
   ```
3. Drag the `.ipa` into Transporter.
4. Click **Deliver**.

---

## Step 7: Configure TestFlight

### 7.1 Wait for processing
In App Store Connect → TestFlight:
- Wait until the build moves from **Processing** to **Ready to Submit** or **Ready to Test**.
- Usually 5–15 minutes.

### 7.2 Provide testing information
1. Click the build number.
2. Fill in **What to Test**, for example:
   ```
   Scroll Tracker Browser v1.0.0

   Focus areas:
   - Browser basics (load, navigate)
   - Scroll distance tracking (cm, meters, screen heights)
   - Time tracking (active vs passive)
   - Multi-domain session management
   - Console log output

   Known issues:
   - No persistence layer yet
   - No stats dashboard yet
   ```
3. Complete the **Export Compliance** questionnaire.
4. Click **Save**.

### 7.3 Submit for review (if required)
If the build shows **Ready to Submit**:
1. Click **Submit for Review**.
2. Apple’s internal review generally completes within a few hours.

---

## Step 8: Invite Testers

### 8.1 Internal testers
1. In TestFlight, open the **App Store Connect Users** tab.
2. Click **+** and add testers from your organization.

### 8.2 External testers (optional)
1. Open the **External Testing** tab.
2. Click **+** to create a new test group.
3. Add tester email addresses (no App Store Connect account required).
4. Up to 10,000 external testers are allowed.

---

## Step 9: Tester Installation Flow

### 9.1 Tester requirements
Testers need:
1. The **TestFlight** app from the App Store.
2. To sign in with the invited Apple ID.

### 9.2 Accepting the invite
1. Testers receive an email invite.
2. They tap **View in TestFlight** from the email.
3. Alternatively, open TestFlight and check for available builds.

### 9.3 Installing the build
1. Locate **Scroll Tracker Browser** inside TestFlight.
2. Tap **Install**.
3. After download, tap **Open** to start testing.

---

## Step 10: Ship Updates

### 10.1 Bump versions
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

**Rules**
- `version`: User-facing semantic version (`1.0.0` → `1.0.1`).
- `buildNumber`: Must strictly increase (`1` → `2` → `3`...).

### 10.2 Rebuild
```bash
eas build --platform ios --profile production
```

### 10.3 Resubmit
```bash
eas submit --platform ios
```

### 10.4 Notify testers
Testers receive update notifications automatically (if auto-updates enabled).

---

## FAQ

### Q1: “Bundle identifier is already in use”
**Fix**
- Create a new Bundle ID in App Store Connect.
- Or reuse the existing one listed in App Store Connect.
- Make sure `bundleIdentifier` in `app.json` **exactly** matches App Store Connect.

### Q2: “Invalid provisioning profile”
**Fix**
```bash
eas credentials
# iOS → Production → Provisioning Profile → Remove
# Rebuild to let EAS re-create the profile
```

### Q3: Build failed
**Fix**
```bash
eas build --platform ios --profile production --clear-cache
```

### Q4: “Export compliance missing”
**Fix**
Provide export compliance answers in App Store Connect → TestFlight → the specific build.

### Q5: TestFlight review rejected
**Fix**
- Confirm the app complies with Apple guidelines.
- Provide clear testing instructions.
- Ensure the privacy policy URL is reachable.
- Explain any permissions the app uses.

---

## Quick Command Reference

```bash
# Sign in to EAS
eas login

# Configure project (first time)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Check build status
eas build:list

# Submit to TestFlight
eas submit --platform ios

# Inspect project info
eas project:info

# Manage credentials
eas credentials
```

---

## End-to-End Flow Recap

```bash
eas login                       # Sign in
eas build:configure             # One-time setup
eas build --platform ios --profile production   # Build
eas submit --platform ios        # Upload to TestFlight
# Configure TestFlight in App Store Connect
# Invite testers
# Begin testing
```

---

## Time Estimates

| Step | Approx Time |
|------|-------------|
| Project configuration | 10–15 min |
| First build | 15–20 min |
| Upload to App Store Connect | 5–10 min |
| Apple processing | 5–15 min |
| TestFlight review (external testers) | 24–48 hrs |
| **Total (internal testing)** | **~1 hour** |
| **Total (external testing)** | **1–3 days** |

---

## Notes & Limits

⚠️ **Versioning**
- Increment `buildNumber` every submission.
- Follow semantic versioning for `version` (major.minor.patch).

⚠️ **Bundle ID**
- Cannot change after creation.
- Must be globally unique.
- Recommended pattern: `com.yourname.appname`.

⚠️ **Tester limits**
- Internal testers: up to 100 (need App Store Connect access).
- External testers: up to 10,000 (only need an Apple ID).

⚠️ **TestFlight limits**
- Each build expires after 90 days.
- External testing requires Apple review.
- Up to 100 active builds per app.

---

## Useful Links

- 📱 [App Store Connect](https://appstoreconnect.apple.com)
- 🏗️ [Expo EAS Build Dashboard](https://expo.dev)
- 📚 [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- 📚 [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- 📚 [TestFlight Help](https://developer.apple.com/testflight/)
- 📚 [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

---

**Good luck with your launch! 🚀**

Need extra help? Check `README.md` or `TESTING_GUIDE.md` for more context.
