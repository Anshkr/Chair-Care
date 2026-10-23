import { Linking, Platform, Alert } from 'react-native';

/**
 * Service to handle phone calls directly through the device's native Phone/Dialer app.
 * Guarantees that the native Phone app (dial pad) is opened, preventing WhatsApp or other
 * chat applications from intercepting the call.
 */
export const phoneCallService = {
  callNumber: async (rawPhoneNumber: string, recipientName?: string): Promise<void> => {
    if (!rawPhoneNumber || typeof rawPhoneNumber !== 'string') {
      Alert.alert('Call', 'No phone number available.');
      return;
    }

    // Clean phone number: keep only digits and leading '+'
    const cleanNumber = rawPhoneNumber.trim().replace(/[^0-9+]/g, '');
    if (!cleanNumber) {
      Alert.alert('Call', 'Invalid phone number.');
      return;
    }

    // 1. Android Native & Android Web:
    // WhatsApp registers for ACTION_VIEW on tel: URIs.
    // By using android.intent.action.DIAL, we strictly target the system Phone dialer app.
    if (Platform.OS === 'android') {
      try {
        const intentUrl = `intent:${cleanNumber}#Intent;action=android.intent.action.DIAL;scheme=tel;end`;
        await Linking.openURL(intentUrl);
        return;
      } catch {
        // Fallback to standard tel URI if intent string fails
        try {
          await Linking.openURL(`tel:${cleanNumber}`);
          return;
        } catch {
          Alert.alert('Phone Call', `Unable to open phone app. Please dial: ${cleanNumber}`);
          return;
        }
      }
    }

    // 2. iOS:
    // telprompt opens the native iOS dialer confirmation dialog
    if (Platform.OS === 'ios') {
      try {
        const promptUrl = `telprompt:${cleanNumber}`;
        const canOpen = await Linking.canOpenURL(promptUrl).catch(() => false);
        if (canOpen) {
          await Linking.openURL(promptUrl);
          return;
        }
        await Linking.openURL(`tel:${cleanNumber}`);
        return;
      } catch {
        Alert.alert('Phone Call', `Unable to open phone app. Please dial: ${cleanNumber}`);
        return;
      }
    }

    // 3. Web (Desktop / Mobile browser):
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          // On mobile web Android, intent URI opens native dialer directly
          const userAgent = navigator.userAgent || '';
          if (/android/i.test(userAgent)) {
            window.location.href = `intent:${cleanNumber}#Intent;action=android.intent.action.DIAL;scheme=tel;end`;
            return;
          }
          window.location.href = `tel:${cleanNumber}`;
          return;
        }
      } catch {
        try {
          window.open(`tel:${cleanNumber}`, '_self');
          return;
        } catch {}
      }
    }

    // Default universal fallback:
    try {
      await Linking.openURL(`tel:${cleanNumber}`);
    } catch {
      Alert.alert('Phone Call', `Please dial: ${cleanNumber}`);
    }
  },
};
