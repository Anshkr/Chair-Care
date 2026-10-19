import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../context/NetworkContext';
import { NoNetworkOfflineScreen } from '../../screens/common/NoNetworkOfflineScreen';
import { AppIcon } from './AppIcon';
import { Shadows } from '../../constants/theme';

export const NetworkStatusBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // If user is offline and hasn't explicitly dismissed the screen
  if (!isOnline && !isDismissed) {
    return (
      <NoNetworkOfflineScreen
        isOverlay
        onDismissOffline={() => setIsDismissed(true)}
      />
    );
  }

  return (
    <View style={styles.rootContainer}>
      {children}

      {/* Floating Offline Mini-Banner if user chose to browse cached app while offline */}
      {!isOnline && isDismissed && (
        <TouchableOpacity
          style={[styles.floatingOfflineBanner, { top: Math.max(insets.top, 10) + 8 }]}
          onPress={() => setIsDismissed(false)}
          activeOpacity={0.85}
        >
          <View style={styles.offlineDot} />
          <Text style={styles.floatingBannerText}>Offline Mode • Tap to reconnect</Text>
          <AppIcon name="ChevronRight" size={14} color="#f87171" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  floatingOfflineBanner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e1b2e',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    zIndex: 99999,
    ...Shadows.medium,
  },
  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  floatingBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#fca5a5',
  },
});
