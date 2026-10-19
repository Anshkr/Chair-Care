import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useNetwork } from '../../context/NetworkContext';

interface NoNetworkOfflineScreenProps {
  navigation?: any;
  onDismissOffline?: () => void;
  isOverlay?: boolean;
}

export const NoNetworkOfflineScreen: React.FC<NoNetworkOfflineScreenProps> = ({
  navigation,
  onDismissOffline,
  isOverlay = false,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { checkConnection, isChecking, toggleSimulatedOffline, isSimulatedOffline } = useNetwork();

  const [statusMessage, setStatusMessage] = useState<string>('Searching for available networks...');
  const [retryFailedNotice, setRetryFailedNotice] = useState<boolean>(false);

  // 1. Radar Pulse Animation Values (3 expanding rings)
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  // 2. Buffering Bars Animation Values (5 staggered bars)
  const barHeights = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.6),
    new Animated.Value(0.9),
    new Animated.Value(0.5),
    new Animated.Value(0.2),
  ]).current;

  // 3. Spinning Retry Icon Animation Value
  const spinValue = useRef(new Animated.Value(0)).current;

  // 4. Floating Beacon Elevation Animation Value
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop pulse 1
    const createPulseLoop = (animVal: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animVal, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animVal, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulseAnim1 = createPulseLoop(pulse1, 0);
    const pulseAnim2 = createPulseLoop(pulse2, 800);
    const pulseAnim3 = createPulseLoop(pulse3, 1600);

    pulseAnim1.start();
    pulseAnim2.start();
    pulseAnim3.start();

    // Loop floating beacon
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    // Buffering Wave Animation
    const barAnimations = barHeights.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(anim, {
            toValue: 1,
            duration: 450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 450,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    });

    barAnimations.forEach((a) => a.start());

    return () => {
      pulseAnim1.stop();
      pulseAnim2.stop();
      pulseAnim3.stop();
      floatLoop.stop();
      barAnimations.forEach((a) => a.stop());
    };
  }, []);

  // Trigger spin when retry is checking
  useEffect(() => {
    if (isChecking) {
      spinValue.setValue(0);
      const spinLoop = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoop.start();
      return () => spinLoop.stop();
    } else {
      spinValue.setValue(0);
    }
  }, [isChecking]);

  const handleRetry = async () => {
    setRetryFailedNotice(false);
    setStatusMessage('Pinging ChairCare API & verification nodes...');
    const connected = await checkConnection();
    if (!connected) {
      setRetryFailedNotice(true);
      setStatusMessage('Connection failed. Buffering offline cache.');
      setTimeout(() => {
        setRetryFailedNotice(false);
        setStatusMessage('Searching for available networks...');
      }, 4000);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.brandBadgeRow}>
          <View style={styles.brandLogoBox}>
            <AppIcon name="Wrench" size={15} color="#ffffff" />
          </View>
          <Text style={styles.brandName}>ChairCare</Text>
          <View style={styles.offlineStatusChip}>
            <View style={styles.offlineBeaconDot} />
            <Text style={styles.offlineStatusChipText}>OFFLINE</Text>
          </View>
        </View>

        {isOverlay && onDismissOffline && (
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onDismissOffline}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissBtnText}>Browse Offline</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.desktopContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Radar & Beacon Animation Visualizer */}
        <View style={styles.animationArea}>
          {/* Concentric Pulse Ring 1 */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [
                  {
                    scale: pulse1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 2.3],
                    }),
                  },
                ],
                opacity: pulse1.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
              },
            ]}
          />

          {/* Concentric Pulse Ring 2 */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [
                  {
                    scale: pulse2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 2.3],
                    }),
                  },
                ],
                opacity: pulse2.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
              },
            ]}
          />

          {/* Concentric Pulse Ring 3 */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [
                  {
                    scale: pulse3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 2.3],
                    }),
                  },
                ],
                opacity: pulse3.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0.8, 0.4, 0],
                }),
              },
            ]}
          />

          {/* Floating Central Beacon Orb */}
          <Animated.View
            style={[
              styles.beaconCenterOrb,
              {
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.beaconInnerGlow}>
              <AppIcon name="WifiOff" size={38} color="#ba1a1a" strokeWidth={2.2} />
            </View>
            <View style={styles.beaconAlertPill}>
              <View style={styles.beaconAlertDot} />
              <Text style={styles.beaconAlertText}>DISCONNECTED</Text>
            </View>
          </Animated.View>
        </View>

        {/* Buffering Network Waveform Bars */}
        <View style={styles.bufferingBarsWrapper}>
          <Text style={styles.bufferingLabel}>SIGNAL BUFFER</Text>
          <View style={styles.bufferingBarRow}>
            {barHeights.map((anim, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.bufferingBar,
                  {
                    transform: [{ scaleY: anim }],
                    opacity: anim.interpolate({
                      inputRange: [0.25, 1],
                      outputRange: [0.35, 1],
                    }),
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.bufferingStatusText}>{statusMessage}</Text>
        </View>

        {/* Informational Headlines */}
        <View style={styles.headlineCard}>
          <Text style={styles.mainTitle}>No Internet Connection</Text>
          <Text style={styles.mainSubtitle}>
            ChairCare requires an active Wi-Fi or cellular network connection to synchronize real-time
            service queues, live technician GPS corridors, and database records.
          </Text>
        </View>

        {/* Notice Banner on Failed Check */}
        {retryFailedNotice && (
          <View style={styles.retryFailedBanner}>
            <AppIcon name="AlertCircle" size={16} color="#ba1a1a" />
            <Text style={styles.retryFailedText}>
              Still unable to reach network gateway. Please verify your connection settings.
            </Text>
          </View>
        )}

        {/* Offline Safety Assurance Card */}
        <View style={styles.cacheSafeCard}>
          <View style={styles.cacheSafeHeader}>
            <AppIcon name="ShieldCheck" size={18} color="#009668" />
            <Text style={styles.cacheSafeTitle}>Offline Safe Storage Active</Text>
          </View>
          <Text style={styles.cacheSafeDesc}>
            Your local session data, drafts, and preferences are securely cached. Any pending submissions
            will buffer locally and dispatch automatically once internet is restored.
          </Text>
        </View>

        {/* Quick Diagnostics Checklist */}
        <View style={styles.diagnosticsCard}>
          <Text style={styles.diagnosticsTitle}>Quick Troubleshooting:</Text>

          <View style={styles.diagItem}>
            <View style={styles.diagDot} />
            <Text style={styles.diagText}>
              Check that <Text style={styles.diagBold}>Wi-Fi</Text> or{' '}
              <Text style={styles.diagBold}>Mobile Data</Text> is switched on.
            </Text>
          </View>

          <View style={styles.diagItem}>
            <View style={styles.diagDot} />
            <Text style={styles.diagText}>
              Toggle <Text style={styles.diagBold}>Airplane Mode</Text> on and off to refresh signals.
            </Text>
          </View>

          <View style={styles.diagItem}>
            <View style={styles.diagDot} />
            <Text style={styles.diagText}>
              Ensure your router or cellular hotspot has active internet connectivity.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.retryBtn, isChecking && styles.retryBtnDisabled]}
            onPress={handleRetry}
            disabled={isChecking}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <AppIcon name="RefreshCw" size={18} color="#ffffff" />
            </Animated.View>
            <Text style={styles.retryBtnText}>
              {isChecking ? 'Checking Connection...' : 'Retry Connection'}
            </Text>
          </TouchableOpacity>

          {/* Developer / Demo Simulator Switch */}
          <TouchableOpacity
            style={styles.simToggleBtn}
            onPress={toggleSimulatedOffline}
            activeOpacity={0.75}
          >
            <AppIcon
              name={isSimulatedOffline ? 'Wifi' : 'WifiOff'}
              size={15}
              color={Colors.secondaryCobalt}
            />
            <Text style={styles.simToggleText}>
              {isSimulatedOffline ? 'Resume Online Mode' : 'Simulate Offline Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120', // Sleek deep cobalt dark mode
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  offlineStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(186, 26, 26, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 4,
  },
  offlineBeaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  offlineStatusChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f87171',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
    gap: 16,
  },
  desktopContent: {
    maxWidth: 580,
    alignSelf: 'center',
    width: '100%',
  },

  // Radar Animation Area
  animationArea: {
    width: 240,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  beaconCenterOrb: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  beaconInnerGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.large,
  },
  beaconAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2b1016',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 10,
  },
  beaconAlertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  beaconAlertText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#fca5a5',
    letterSpacing: 0.6,
  },

  // Buffering Signal Waveform
  bufferingBarsWrapper: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    gap: 8,
  },
  bufferingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  bufferingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 26,
    gap: 6,
  },
  bufferingBar: {
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  bufferingStatusText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Headline Card
  headlineCard: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Notice Banner
  retryFailedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(186, 26, 26, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
  },
  retryFailedText: {
    fontSize: 12,
    color: '#fca5a5',
    flex: 1,
    fontWeight: '500',
  },

  // Cache Safe Card
  cacheSafeCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    gap: 6,
  },
  cacheSafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheSafeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
  },
  cacheSafeDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },

  // Diagnostics Card
  diagnosticsCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 10,
  },
  diagnosticsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diagItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  diagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
    marginTop: 6,
  },
  diagText: {
    fontSize: 12.5,
    color: '#cbd5e1',
    lineHeight: 18,
    flex: 1,
  },
  diagBold: {
    fontWeight: '700',
    color: '#f8fafc',
  },

  // Action Buttons
  actionRow: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  retryBtn: {
    height: 48,
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadows.medium,
  },
  retryBtnDisabled: {
    opacity: 0.65,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  simToggleBtn: {
    height: 42,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  simToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#93c5fd',
  },
});
