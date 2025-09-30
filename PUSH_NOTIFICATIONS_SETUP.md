# Push Notifications Setup Guide

This guide explains how to implement push notifications for the Rhood App when applications are approved or rejected.

## Overview

The notification system has been implemented with:

1. ✅ **In-app notifications** - Stored in database and displayed in the app
2. 🔄 **Push notifications** - Ready for integration with mobile push services
3. ✅ **Application handlers** - Automatically create notifications when applications are approved/rejected

## Current Implementation

### 1. Notification Service (`src/lib/notifications.ts`)

- Creates in-app notifications in the database
- Sends push notifications (placeholder implementation)
- Manages notification states (read/unread)

### 2. Application Handlers

- Updated both main applications page and detail page
- Automatically creates notifications when applications are approved/rejected
- Sends both in-app and push notifications

### 3. Notification UI Components

- `NotificationCenter` - Full notification display component
- `NotificationBell` - Header notification bell with unread count

## Push Notification Integration Options

### Option 1: Firebase Cloud Messaging (FCM) - Recommended

**Best for:** React Native apps, cross-platform support

#### Setup Steps:

1. **Install Firebase SDK:**

```bash
# For React Native
npm install @react-native-firebase/app @react-native-firebase/messaging

# For Expo
npx expo install expo-notifications expo-device expo-constants
```

2. **Configure Firebase:**

   - Create a Firebase project
   - Add iOS and Android apps
   - Download configuration files

3. **Update notification service:**

```typescript
// Replace the placeholder in src/lib/notifications.ts
export async function sendPushNotification(
  userId: string,
  pushData: PushNotificationData
) {
  try {
    // Get user's FCM token
    const { data: userToken } = await supabase
      .from("user_fcm_tokens")
      .select("fcm_token")
      .eq("user_id", userId)
      .single();

    if (!userToken?.fcm_token) {
      return { success: false, error: "No FCM token found" };
    }

    // Send via Firebase Admin SDK
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: userToken.fcm_token,
        notification: {
          title: pushData.title,
          body: pushData.body,
        },
        data: pushData.data || {},
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error };
  }
}
```

4. **Create API endpoint:**

```typescript
// app/api/send-notification/route.ts
import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, getApps, cert } from "firebase-admin/app";

const firebaseConfig = {
  // Your Firebase config
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export async function POST(request: Request) {
  try {
    const { token, notification, data } = await request.json();

    const messaging = getMessaging(app);
    const message = {
      token,
      notification,
      data,
    };

    const response = await messaging.send(message);
    return Response.json({ success: true, messageId: response });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### Option 2: Expo Notifications

**Best for:** Expo-managed React Native apps

#### Setup Steps:

1. **Install Expo Notifications:**

```bash
npx expo install expo-notifications expo-device expo-constants
```

2. **Configure app.json:**

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

3. **Update notification service:**

```typescript
import * as Notifications from "expo-notifications";

export async function sendPushNotification(
  userId: string,
  pushData: PushNotificationData
) {
  try {
    const { data: userToken } = await supabase
      .from("user_expo_tokens")
      .select("expo_token")
      .eq("user_id", userId)
      .single();

    if (!userToken?.expo_token) {
      return { success: false, error: "No Expo token found" };
    }

    const message = {
      to: userToken.expo_token,
      sound: "default",
      title: pushData.title,
      body: pushData.body,
      data: pushData.data || {},
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    return await response.json();
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error };
  }
}
```

### Option 3: OneSignal

**Best for:** Easy setup, web + mobile support

#### Setup Steps:

1. **Install OneSignal:**

```bash
npm install react-native-onesignal
```

2. **Update notification service:**

```typescript
import OneSignal from "react-native-onesignal";

export async function sendPushNotification(
  userId: string,
  pushData: PushNotificationData
) {
  try {
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("onesignal_player_id")
      .eq("id", userId)
      .single();

    if (!userProfile?.onesignal_player_id) {
      return { success: false, error: "No OneSignal player ID found" };
    }

    OneSignal.postNotification({
      contents: { en: pushData.body },
      headings: { en: pushData.title },
      include_player_ids: [userProfile.onesignal_player_id],
      data: pushData.data || {},
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return { success: false, error };
  }
}
```

## Database Schema Updates

You'll need to add tables to store push notification tokens:

### For Firebase FCM:

```sql
CREATE TABLE user_fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
```

### For Expo:

```sql
CREATE TABLE user_expo_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  expo_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_expo_tokens_user_id ON user_expo_tokens(user_id);
```

## Mobile App Integration

### Token Registration

In your mobile app, register for push notifications and store the token:

```typescript
// Example for Expo
import * as Notifications from "expo-notifications";
import { supabase } from "./supabase-client";

export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Failed to get push token for push notification!");
    return;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Store token in database
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("user_expo_tokens").upsert({
      user_id: user.id,
      expo_token: token,
    });
  }

  return token;
}
```

### Notification Handling

Handle incoming notifications in your mobile app:

```typescript
// Listen for notifications
Notifications.addNotificationReceivedListener((notification) => {
  console.log("Notification received:", notification);
});

// Handle notification taps
Notifications.addNotificationResponseReceivedListener((response) => {
  console.log("Notification tapped:", response);
  // Navigate to relevant screen based on notification data
});
```

## Testing

1. **Test in-app notifications:**

   - Approve/reject an application in the admin panel
   - Check that notifications appear in the database
   - Verify the notification UI displays correctly

2. **Test push notifications:**
   - Set up your chosen push notification service
   - Register a test device
   - Send a test notification
   - Verify the notification appears on the device

## Best Practices

1. **User Consent:** Always ask for permission before sending push notifications
2. **Token Management:** Regularly refresh and validate push tokens
3. **Fallback:** In-app notifications work even if push notifications fail
4. **Rate Limiting:** Implement rate limiting to prevent spam
5. **Analytics:** Track notification open rates and user engagement

## Current Status

✅ **Completed:**

- In-app notification system
- Application approval/rejection handlers
- Notification UI components
- Database structure

🔄 **Ready for Implementation:**

- Push notification service integration
- Mobile app token registration
- Notification handling in mobile app

The foundation is complete - you just need to choose and implement your preferred push notification service!
