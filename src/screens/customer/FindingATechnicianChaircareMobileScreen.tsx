import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';

import { customerApi } from '../../services/api';
import { Alert } from 'react-native';

/**
 * Screen ID: C09
 * Title: Finding a Technician (Radar Matching)
 * Reference: design-reference/customer/finding_a_technician_chaircare_mobile
 */
export const FindingATechnicianChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const [stepIndex, setStepIndex] = useState<number>(1); // 0, 1, 2, 3 (steps of matching)

  // Radar Animation
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous sweep rotation animation
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulseLoop.start();
    rotateLoop.start();

    // Sequence visual feedback
    const t1 = setTimeout(() => setStepIndex(2), 1200);
    const t2 = setTimeout(() => setStepIndex(3), 2400);

    // REAL BACKEND POLLING: Wait until a technician actually accepts the job
    const pollInterval = setInterval(async () => {
      try {
        const res = await customerApi.getMyRequests();
        if (res.success && Array.isArray(res.data)) {
          const accepted = res.data.find(
            (r: any) =>
              r.status === 'assigned' ||
              r.status === 'in_route' ||
              r.status === 'arrived' ||
              r.status === 'in_progress'
          );
          if (accepted) {
            clearInterval(pollInterval);
            navigation.replace('TechnicianAssigned', {
              request: accepted,
              requestId: accepted.id,
              technician: {
                name: accepted.technician_name,
                phone: accepted.technician_phone,
                rating: accepted.technician_rating,
                vehicleInfo: accepted.technician_vehicle,
              },
            });
          }
        }
      } catch {
        // keep polling
      }
    }, 3000);

    return () => {
      pulseLoop.stop();
      rotateLoop.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      clearInterval(pollInterval);
    };
  }, [navigation, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const serviceTitle = draft?.serviceTitle || 'Office Chair Repair';
  const serviceAddress = draft?.serviceAddress || 'Customer Service Location';
  const visitDate = draft?.visitDate || 'Today';
  const timeSlot = draft?.timeSlot ? draft.timeSlot.split('–')[0].trim() : '03:30 PM';

  const handleGoDashboard = () => {
    navigation.navigate('CustomerMain', { screen: 'ServicesAvailableTab' });
  };

  const executeCancelSearch = async () => {
    try {
      const targetId = route.params?.requestId;
      if (targetId) {
        await customerApi.cancelRequest(targetId, 'Cancelled by user during search');
      } else {
        const res = await customerApi.getMyRequests();
        const latest =
          res.success && Array.isArray(res.data)
            ? res.data.find(
                (r: any) => r.status === 'finding_technician' || r.status === 'pending'
              )
            : null;
        if (latest?.id) {
          await customerApi.cancelRequest(latest.id, 'Cancelled by user during search');
        }
      }
      navigation.navigate('CustomerMain', { screen: 'ServicesAvailableTab' });
    } catch {
      navigation.navigate('CustomerMain', { screen: 'ServicesAvailableTab' });
    }
  };

  const handleCancel = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to cancel looking for a technician?');
      if (confirmed) {
        executeCancelSearch();
      }
    } else {
      Alert.alert(
        'Cancel Search',
        'Are you sure you want to cancel searching for a technician?',
        [
          { text: 'Keep Searching', style: 'cancel' },
          {
            text: 'Cancel Request',
            style: 'destructive',
            onPress: executeCancelSearch,
          },
        ]
      );
    }
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Technician Live Tracker</Text>
        </View>

        <CustomerHeaderAvatar
          onPress={() => navigation.navigate('CustomerProfileTab')}
          size={36}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Radar Visual Representation Container */}
        <View style={styles.radarContainer}>
          {/* Scanning Pill Header */}
          <View style={styles.scanningPill}>
            <View style={styles.livePulseDot} />
            <Text style={styles.scanningText}>Scanning 5 km radius...</Text>
          </View>

          {/* Radar Concentric Rings */}
          <View style={styles.ringOuter}>
            <View style={styles.ringMid}>
              <View style={styles.ringInner}>
                <View style={styles.ringCore} />
              </View>
            </View>
          </View>

          {/* Dynamic Scanning Sweep Beam */}
          <Animated.View
            style={[
              styles.radarSweep,
              { transform: [{ rotate: spin }] },
            ]}
          />

          {/* Center User Location Pin */}
          <View style={styles.centerLocationBox}>
            <Animated.View
              style={[
                styles.centerPingRing,
                { transform: [{ scale: pulseAnim }], opacity: pulseAnim },
              ]}
            />
            <View style={styles.centerPinIcon}>
              <AppIcon name="MapPin" size={18} />
            </View>
            <View style={styles.yourLocationBadge}>
              <Text style={styles.yourLocationText}>YOUR LOCATION</Text>
            </View>
          </View>

          {/* Technician Marker 1 (Top Right - 0.8 km) */}
          <View style={styles.techMarker1}>
            <View style={styles.techAvatarBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                }}
                style={styles.techAvatarImage}
              />
            </View>
            <View style={styles.techDistanceRow}>
              <Text style={styles.techDistanceText}>0.8 km</Text>
              <View style={styles.techActiveDot} />
            </View>
          </View>

          {/* Technician Marker 2 (Bottom Left - 1.4 km) */}
          <View style={styles.techMarker2}>
            <View style={styles.techAvatarBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
                }}
                style={styles.techAvatarImage}
              />
            </View>
            <View style={styles.techDistanceRow}>
              <Text style={styles.techDistanceText}>1.4 km</Text>
              <View style={styles.techActiveDot} />
            </View>
          </View>

          {/* Technician Marker 3 (Bottom Right - 2.2 km) */}
          <View style={styles.techMarker3}>
            <View style={styles.techAvatarBox}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
                }}
                style={styles.techAvatarImage}
              />
            </View>
            <View style={styles.techDistanceRow}>
              <Text style={styles.techDistanceText}>2.2 km</Text>
              <View style={styles.techActiveDot} />
            </View>
          </View>
        </View>

        {/* 2. Typography & Messaging Header */}
        <View style={styles.messageSection}>
          <Text style={styles.messageTitle}>Finding a Technician</Text>
          <Text style={styles.messageSub}>
            We’re checking nearby technicians who are available for your service.
          </Text>
        </View>

        {/* 3. Sequential Matching Progress Checklist Card */}
        <View style={styles.checklistCard}>
          {/* Step 1: Completed */}
          <View style={styles.stepRow}>
            <View style={styles.stepCompletedCircle}>
              <AppIcon name="Check" size={18} />
            </View>
            <View style={styles.stepInfo}>
              <View style={styles.stepTitleRow}>
                <Text style={styles.stepTitle}>Finding nearby technicians</Text>
                <View style={styles.matchedBadge}>
                  <Text style={styles.matchedBadgeText}>Matched</Text>
                </View>
              </View>
              <Text style={styles.stepSub}>3 verified technicians located nearby</Text>
            </View>
          </View>

          {/* Step 2: In-Progress / Active */}
          <View style={[styles.stepRow, stepIndex < 1 && styles.stepInactive]}>
            <View
              style={
                stepIndex >= 2
                  ? styles.stepCompletedCircle
                  : styles.stepActiveCircle
              }
            >
              <Text
                style={
                  stepIndex >= 2 ? styles.stepCheckmark : styles.stepPulseText
                }
              >
                {stepIndex >= 2 ? '✓' : '•'}
              </Text>
            </View>
            <View style={styles.stepInfo}>
              <View style={styles.stepTitleRow}>
                <Text
                  style={[
                    styles.stepTitle,
                    stepIndex === 1 && styles.stepTitleActive,
                  ]}
                >
                  Checking availability
                </Text>
                {stepIndex === 1 && (
                  <Text style={styles.syncingText}>Syncing...</Text>
                )}
                {stepIndex >= 2 && (
                  <View style={styles.matchedBadge}>
                    <Text style={styles.matchedBadgeText}>Available</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stepSub}>
                Verifying schedule slots & travel times
              </Text>
            </View>
          </View>

          {/* Step 3: Matching Service Expertise */}
          <View style={[styles.stepRow, stepIndex < 2 && styles.stepInactive]}>
            <View
              style={
                stepIndex >= 3
                  ? styles.stepCompletedCircle
                  : stepIndex === 2
                  ? styles.stepActiveCircle
                  : styles.stepPendingCircle
              }
            >
              <Text
                style={
                  stepIndex >= 3 ? styles.stepCheckmark : styles.stepPulseText
                }
              >
                {stepIndex >= 3 ? '✓' : '•'}
              </Text>
            </View>
            <View style={styles.stepInfo}>
              <View style={styles.stepTitleRow}>
                <Text
                  style={[
                    styles.stepTitle,
                    stepIndex === 2 && styles.stepTitleActive,
                  ]}
                >
                  Matching service expertise
                </Text>
                {stepIndex === 2 && (
                  <Text style={styles.syncingText}>Matching...</Text>
                )}
                {stepIndex >= 3 && (
                  <View style={styles.matchedBadge}>
                    <Text style={styles.matchedBadgeText}>Certified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.stepSub}>
                Certified chair repair specialist assigned
              </Text>
            </View>
          </View>

          {/* Step 4: Confirming Technician */}
          <View style={[styles.stepRow, stepIndex < 3 && styles.stepInactive]}>
            <View
              style={
                stepIndex >= 3
                  ? styles.stepActiveCircle
                  : styles.stepPendingCircle
              }
            >
              <Text style={styles.stepPulseText}>•</Text>
            </View>
            <View style={styles.stepInfo}>
              <View style={styles.stepTitleRow}>
                <Text
                  style={[
                    styles.stepTitle,
                    stepIndex === 3 && styles.stepTitleActive,
                  ]}
                >
                  Confirming technician
                </Text>
                {stepIndex === 3 && (
                  <Text style={styles.syncingText}>Assigning...</Text>
                )}
              </View>
              <Text style={styles.stepSub}>
                Finalizing technician assignment & arrival time
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Compact Request Summary Card */}
        <View style={styles.requestSummaryCard}>
          <View style={styles.summaryIconBox}>
            <AppIcon name="Wrench" size={18} />
          </View>
          <View style={styles.summaryDetails}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {serviceTitle}
              </Text>
              <View style={styles.step5Badge}>
                <Text style={styles.step5BadgeText}>Step 5/5</Text>
              </View>
            </View>
            <View style={styles.summaryMetaRow}>
              <AppIcon name="MapPin" size={18} />
              <Text style={styles.metaText} numberOfLines={1}>
                {serviceAddress}
              </Text>
            </View>
            <View style={styles.summaryMetaRow}>
              <AppIcon name="CalendarCheck" size={18} />
              <Text style={styles.metaText} numberOfLines={1}>
                {visitDate} • {timeSlot}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Bottom Animated Loading Indicator */}
        <View style={styles.loadingIndicatorBox}>
          <View style={styles.bouncingDotsRow}>
            <View style={[styles.bounceDot, { opacity: 0.9 }]} />
            <View style={[styles.bounceDot, { opacity: 0.6 }]} />
            <View style={[styles.bounceDot, { opacity: 0.3 }]} />
          </View>
          <Text style={styles.loadingNote}>
            This usually takes a few moments.
          </Text>
        </View>

        {/* Actions Row */}
        <View style={styles.cancelContainer}>
          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={handleGoDashboard}
            activeOpacity={0.8}
          >
            <Text style={styles.dashboardBtnText}>Return to Home • Wait in Background</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  radarContainer: {
    width: '100%',
    height: 270,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  scanningPill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  scanningText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  ringOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(224, 227, 229, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(224, 227, 229, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(224, 227, 229, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
  },
  radarSweep: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderTopWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  centerLocationBox: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
  },
  centerPingRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  centerPinIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  pinIconText: {
    fontSize: 16,
  },
  yourLocationBadge: {
    marginTop: 4,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  yourLocationText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  techMarker1: {
    position: 'absolute',
    top: 24,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 3,
    paddingRight: 8,
    borderRadius: BorderRadius.full,
    ...Shadows.level2,
  },
  techMarker2: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 3,
    paddingRight: 8,
    borderRadius: BorderRadius.full,
    ...Shadows.level2,
  },
  techMarker3: {
    position: 'absolute',
    bottom: 36,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 3,
    paddingRight: 8,
    borderRadius: BorderRadius.full,
    ...Shadows.level2,
  },
  techAvatarBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  techAvatarImage: {
    width: '100%',
    height: '100%',
  },
  techDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  techDistanceText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.tertiaryEmerald,
  },
  messageSection: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  messageTitle: {
    ...Typography.headlineMd,
    fontSize: 22,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  messageSub: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  checklistCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepInactive: {
    opacity: 0.45,
  },
  stepCompletedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepActiveCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepPendingCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepCheckmark: {
    fontSize: 12,
    color: Colors.onSecondary,
    fontWeight: '800',
  },
  stepPulseText: {
    fontSize: 14,
    color: Colors.secondaryCobalt,
    fontWeight: '900',
  },
  stepInfo: {
    flex: 1,
    gap: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  stepTitleActive: {
    color: Colors.secondaryCobalt,
  },
  matchedBadge: {
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  matchedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryContainer,
    fontWeight: '700',
  },
  syncingText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  stepSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  requestSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 12,
  },
  summaryIconBox: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryDetails: {
    flex: 1,
    gap: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
    flex: 1,
  },
  step5Badge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  step5BadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaIcon: {
    fontSize: 11,
  },
  metaText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  loadingIndicatorBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  bouncingDotsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  bounceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  loadingNote: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  cancelContainer: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    width: '100%',
  },
  dashboardBtn: {
    backgroundColor: Colors.secondaryCobalt,
    width: '100%',
    paddingVertical: 13,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  dashboardBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  cancelBtnText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.error || '#BA1A1A',
    fontWeight: '600',
  },
});
