import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  NativeModules,
  NativeEventEmitter,
  Platform,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { auth } from './firebaseConfig';
import { User } from 'firebase/auth';

// Backend URL (replace with actual IP for dev)
const BACKEND_URL = "http://192.168.1.100:8000";
// In bare RN, read from package.json or babel-plugin-transform-inline-environment-variables
// For simplicity, hardcoded or use a config file
// This variable is replaced during build time if using babel-plugin-transform-inline-environment-variables
// or passing it via Config. For this setup, we rely on the CI/CD to replace this string or set it via Config.
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

function App(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [activityToken, setActivityToken] = useState<string>('');
  const [webhookToken, setWebhookToken] = useState<string>('');

  useEffect(() => {
    // Listen for Live Activity Token
    if (NativeModules.LiveActivityModule) {
        const eventEmitter = new NativeEventEmitter(NativeModules.LiveActivityModule);
        const eventListener = eventEmitter.addListener('onActivityToken', (event: any) => {
            console.log("Received Activity Token:", event.token);
            setActivityToken(event.token);
        });

        return () => {
            eventListener.remove();
        };
    }
  }, []);

  const handleLogin = async () => {
    try {
        console.log("Simulating login...");
        const mockUser: any = { uid: "test-user-id", email: "test@example.com" };
        setUser(mockUser);
        onLoginSuccess(mockUser);
    } catch (e: any) {
        Alert.alert("Login Error", e.message);
    }
  };

  const onLoginSuccess = async (currentUser: User) => {
    const newWebhookToken = uuidv4();
    setWebhookToken(newWebhookToken);

    // Start Live Activity to get the token
    startLiveActivity();

    // In a real app, we wait for activityToken to be set by the event listener
    setTimeout(() => {
        registerToken(currentUser.uid, newWebhookToken);
    }, 2000);
  };

  const registerToken = async (uid: string, wToken: string) => {
    // We only care about Activity Token for this specific feature
    if (!activityToken) {
        console.warn("No activity token yet. Waiting...");
        // In real app, you might retry or wait for the state update
    }

    // If we don't have an activity token, we might be sending empty string which backend should handle/log
    const tokenToSend = activityToken || "waiting-for-token";

    try {
        const response = await fetch(`${BACKEND_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-App-Version': APP_VERSION
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Live Activity App</Text>
        <Text>Version: {APP_VERSION}</Text>

        {user ? (
            <View style={styles.infoContainer}>
                <Text>Logged in as: {user.email}</Text>
                <Text>Webhook Token:</Text>
                <Text style={styles.code}>{webhookToken}</Text>
                <Text>Activity Token (APNs):</Text>
                <Text style={styles.code}>{activityToken ? activityToken.substring(0, 20) + "..." : "Waiting..."}</Text>
            </View>
        ) : (
            <Button title="Login" onPress={handleLogin} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  code: {
    backgroundColor: '#eee',
    padding: 5,
    marginVertical: 5,
    fontFamily: 'monospace',
  }
});

export default App;
