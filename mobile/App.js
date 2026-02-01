import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, Alert, Platform, NativeModules, NativeEventEmitter } from 'react-native';
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from './firebaseConfig';
import { signInWithCredential, GoogleAuthProvider, signInWithCustomToken } from 'firebase/auth';

// Backend URL (replace with actual IP for dev)
const BACKEND_URL = "http://192.168.1.100:8000";

export default function App() {
  const [user, setUser] = useState(null);
  const [pushToken, setPushToken] = useState('');
  const [activityToken, setActivityToken] = useState('');
  const [webhookToken, setWebhookToken] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setPushToken(token));

    // Listen for Live Activity Token
    if (NativeModules.LiveActivityModule) {
        const eventEmitter = new NativeEventEmitter(NativeModules.LiveActivityModule);
        const eventListener = eventEmitter.addListener('onActivityToken', (event) => {
            console.log("Received Activity Token:", event.token);
            setActivityToken(event.token);
        });

        return () => {
            eventListener.remove();
        };
    }
  }, []);

  const handleLogin = async () => {
    // Mock login for demo purposes since we don't have native Google Sign-In setup here
    // In real app, use expo-google-app-auth or firebase JS SDK with popup (web) / native (mobile)
    try {
        // This is a placeholder. In a real app, you'd get a credential.
        console.log("Simulating login...");
        // Simulate auth state change
        const mockUser = { uid: "test-user-id", email: "test@example.com" };
        setUser(mockUser);
        onLoginSuccess(mockUser);
    } catch (e) {
        Alert.alert("Login Error", e.message);
    }
  };

  const onLoginSuccess = async (currentUser) => {
    const newWebhookToken = uuidv4();
    setWebhookToken(newWebhookToken);

    // Start Live Activity to get the token
    startLiveActivity();

    // In a real app, we wait for activityToken to be set by the event listener
    // For this demo, we'll try to register with what we have (pushToken)
    // but typically you send the activityToken.

    setTimeout(() => {
        registerToken(currentUser.uid, newWebhookToken);
    }, 2000); // Wait for activity start
  };

  const registerToken = async (uid, wToken) => {
    // Prefer activityToken if available, else fallback to pushToken (for standard push)
    const tokenToSend = activityToken || pushToken;

    if (!tokenToSend) {
        Alert.alert("Error", "No push token available.");
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: uid,
                pushToken: tokenToSend,
                webhookToken: wToken
            }),
        });

        const data = await response.json();
        console.log("Registration:", data);
        Alert.alert("Success", "Ready! Check the web dashboard.");
    } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to register with backend.");
    }
  };

  const startLiveActivity = () => {
      console.log("Starting Live Activity...");
      if (NativeModules.LiveActivityModule) {
          NativeModules.LiveActivityModule.startActivity();
      } else {
          console.warn("Native Module not found");
      }
  };

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>

      {user ? (
        <View>
             <Text>Logged in as: {user.email}</Text>
             <Text>Webhook Token: {webhookToken}</Text>
        </View>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}

      <StatusBar style="auto" />
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data; // Or getDevicePushTokenAsync for APNs direct
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
