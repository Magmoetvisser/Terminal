import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  if (!buttons || buttons.length === 0) {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }

  // If there's a destructive/confirm + cancel pattern, use window.confirm
  const cancel = buttons.find((b) => b.style === 'cancel');
  const action = buttons.find((b) => b.style !== 'cancel');

  if (cancel && action) {
    const confirmed = window.confirm(message ? `${title}\n${message}` : title);
    if (confirmed) {
      action.onPress?.();
    } else {
      cancel.onPress?.();
    }
  } else {
    window.alert(message ? `${title}\n${message}` : title);
    buttons[0]?.onPress?.();
  }
}
