import React, { useRef, useState, useEffect } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';

export default function useAppState(onForeground? : () => void) {
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange);

    return () => {
      AppState.removeEventListener('change', _handleAppStateChange);
    };
  }, []);

  const _handleAppStateChange = (nextAppState : AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      if (onForeground) onForeground();
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  return appStateVisible;
}