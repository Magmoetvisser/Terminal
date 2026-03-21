import React, { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';

// On web, WebView doesn't exist. This module provides a lazy-loaded
// re-export so native code works unchanged, while web gets a placeholder.

let _WebView: any = null;
let _loaded = false;

export function useWebView() {
  const [ready, setReady] = useState(_loaded);

  useEffect(() => {
    if (Platform.OS === 'web' || _loaded) {
      setReady(true);
      return;
    }
    import('react-native-webview').then((mod) => {
      _WebView = mod.default;
      _loaded = true;
      setReady(true);
    });
  }, []);

  if (Platform.OS === 'web') {
    return { WebView: null, ready: true, isWeb: true };
  }
  return { WebView: _WebView, ready, isWeb: false };
}

export function WebPlaceholder({ message }: { message?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#888', fontSize: 14 }}>
        {message || 'Dit onderdeel is niet beschikbaar op web.'}
      </Text>
    </View>
  );
}
