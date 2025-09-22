import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNakama } from '../contexts/NakamaContext';

interface LoginScreenProps {
  onLoginSuccess: (userId: string, username: string) => void;
  onNavigateToRegister: () => void;
  onNavigateToDebug?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToDebug,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { authenticateWithEmail, authenticateWithFacebook, authenticateWithGoogle } = useNakama();

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Authenticate with Nakama
      const nakamaAuth = await authenticateWithEmail(email.trim(), password);
      
      // Success - navigate to main app
      onLoginSuccess(nakamaAuth.nakamaId, nakamaAuth.username);
    } catch (error) {
      console.error('Login error:', error);
      
      // Show detailed error in alert for debugging
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const fullError = error instanceof Error ? error.stack : String(error);
      
      Alert.alert(
        'Login Failed - Debug Info',
        `Error: ${errorMessage}\n\nFull Error: ${fullError}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    try {
      // Authenticate with Nakama (Facebook)
      const nakamaAuth = await authenticateWithFacebook('mock_facebook_token');
      
      // Success - navigate to main app
      onLoginSuccess(nakamaAuth.nakamaId, nakamaAuth.username);
    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert(
        'Facebook Login Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Authenticate with Nakama (Google)
      const nakamaAuth = await authenticateWithGoogle('mock_google_token');
      
      // Success - navigate to main app
      onLoginSuccess(nakamaAuth.nakamaId, nakamaAuth.username);
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert(
        'Google Login Failed',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Wayfarer</Text>
      <Text style={styles.subtitle}>Sign in to continue your adventure</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleEmailLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In with Email</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.dividerText}>or</Text>

        <TouchableOpacity
          style={[styles.button, styles.facebookButton]}
          onPress={handleFacebookLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Sign In with Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Sign In with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={onNavigateToRegister}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

        {onNavigateToDebug && (
          <TouchableOpacity
            style={[styles.button, styles.debugButton]}
            onPress={onNavigateToDebug}
          >
            <Text style={styles.buttonText}>Debug Connection</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkTextBold: {
    fontWeight: '600',
    color: '#007AFF',
  },
  dividerText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 16,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  debugButton: {
    backgroundColor: '#FF9500',
  },
});
