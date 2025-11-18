import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NakamaProvider } from './src/contexts/NakamaContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { HomeScreen } from './src/screens/HomeScreen';

type AppScreen = 'login' | 'register' | 'home';

interface AppState {
  screen: AppScreen;
  userId?: string;
  username?: string;
}

function AppContent() {
  const [appState, setAppState] = useState<AppState>({ screen: 'login' });

  const handleLoginSuccess = (userId: string, username: string) => {
    setAppState({ screen: 'home', userId, username });
  };

  const handleRegisterSuccess = (userId: string, username: string) => {
    setAppState({ screen: 'home', userId, username });
  };

  const handleLogout = () => {
    setAppState({ screen: 'login' });
  };

  const handleUsernameUpdate = (newUsername: string) => {
    setAppState(prev => ({
      ...prev,
      username: newUsername,
    }));
  };

  const navigateToRegister = () => {
    setAppState({ screen: 'register' });
  };

  const navigateToLogin = () => {
    setAppState({ screen: 'login' });
  };


  const renderScreen = () => {
    switch (appState.screen) {
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={navigateToRegister}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={handleRegisterSuccess}
            onNavigateToLogin={navigateToLogin}
          />
        );
      case 'home':
        return (
          <HomeScreen
            userId={appState.userId!}
            username={appState.username!}
            onLogout={handleLogout}
            onUsernameUpdate={handleUsernameUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderScreen()}
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <NakamaProvider>
      <AppContent />
    </NakamaProvider>
  );
}

