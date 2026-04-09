import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@cuefinder/auth';

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      await login(username.trim(), password);
    } catch (submissionError) {
      setError(submissionError?.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.screen}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>CueFinder Mobile</Text>
        <Text style={styles.title}>Marketplace access, now mobile-first</Text>
        <Text style={styles.description}>
          Use your existing CueFinder account. This screen is wired to the shared auth package and backend API.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#8f8275"
            style={styles.input}
            value={username}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#8f8275"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || !username.trim() || !password}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.button,
            (isSubmitting || !username.trim() || !password) && styles.buttonDisabled,
            pressed && !(isSubmitting || !username.trim() || !password) && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Signing in...' : 'Sign In'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6efe6',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#fffaf5',
  },
  eyebrow: {
    marginBottom: 10,
    color: '#9a5b2d',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginBottom: 12,
    color: '#1f1b17',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  description: {
    marginBottom: 24,
    color: '#4a4138',
    fontSize: 16,
    lineHeight: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#3a312a',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#d7c5b4',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    color: '#1f1b17',
    fontSize: 16,
  },
  error: {
    marginBottom: 16,
    color: '#a02626',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#9a5b2d',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: '#fff9f2',
    fontSize: 16,
    fontWeight: '700',
  },
});