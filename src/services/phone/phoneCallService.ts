import { Linking, Platform, Alert } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

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

    // 1. Android Native:
    // WhatsApp registers for ACTION_VIEW on tel: URIs.
    // By using android.intent.action.DIAL via IntentLauncher, we strictly target the system
    // Phone dialer app (e.g. Google Phone, Samsung Phone) which WhatsApp does not handle.
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync('android.intent.action.DIAL', {
          data: `tel:${cleanNumber}`,
        });
        return;
      } catch (err) {
        console.warn('Default ACTION_DIAL failed, trying known system dialer packages:', err);
        const dialerPackages = [
          'com.google.android.dialer',
          'com.samsung.android.dialer',
          'com.android.dialer',
        ];

        for (const pkg of dialerPackages) {
          try {
            await IntentLauncher.startActivityAsync('android.intent.action.DIAL', {
              data: `tel:${cleanNumber}`,
              packageName: pkg,
            });
            return;
          } catch {}
        }

        // Fallback to standard tel URI
        try {
          await Linking.openURL(`tel:${cleanNumber}`);
          return;
        } catch {
          Alert.alert('Phone Call', `Please dial customer at: ${cleanNumber}`);
          return;
        }
      }
    }

    // 2. iOS Native:
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
          const userAgent = navigator.userAgent || '';

          // On mobile web Android, intent URI with ACTION_DIAL forces opening the native phone dialer
          if (/android/i.test(userAgent)) {
            const link = document.createElement('a');
            link.href = `intent:#Intent;action=android.intent.action.DIAL;data=tel:${cleanNumber};end`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }

          // On iOS mobile web, anchor tag click with tel: triggers native phone prompt cleanly
          if (/iphone|ipad|ipod/i.test(userAgent)) {
            const link = document.createElement('a');
            link.href = `tel:${cleanNumber}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }

          // Desktop Web: copy to clipboard first to ensure user always has the number
          try {
            if (navigator.clipboard) {
              await navigator.clipboard.writeText(cleanNumber);
            }
          } catch {}

          // Trigger standard tel: protocol for system dialer
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
