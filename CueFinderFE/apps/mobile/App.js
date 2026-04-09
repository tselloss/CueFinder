import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@cuefinder/auth';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  configureStorage,
  hydrateStorage,
} from '@cuefinder/storage';
import { AppNavigator } from './src/navigation/AppNavigator';
import { createSecureStorageAdapter } from './src/storage/secureStorage';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      configureStorage(createSecureStorageAdapter());
      await hydrateStorage([AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY]);

      if (isMounted) {
        setIsReady(true);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {isReady ? <AuthProvider><AppNavigator /></AuthProvider> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6efe6',
  },
});