import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface NotificationConfirmationSentProps {
  navigation?: any;
  route?: {
    params?: {
      notificationData?: any;
      notifId?: string;
    };
  };
}

export const NotificationConfirmationSentChaircareMobileScreen: React.FC<
  NotificationConfirmationSentProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const passedData = route?.params?.notificationData;

  const payload = {
    id: passedData?.id || 'NOT-58291',
    code: '#NOT-58291',
    title:
      passedData?.title || 'Service Area Update: Cyber City Expansion',
    message:
      passedData?.message ||
      'Please review your updated service area before accepting new requests. New commercial buildings in Cyber City Phase 2 are now eligible for priority dispatch with bonus incentives.',
    audienceLabel: passedData?.audienceLabel || 'All Technicians',
    audienceCount: '86 Active Field Specialists',
    recipientCount: '86',
    notificationType: passedData?.notificationType || 'Service Alert',
    notificationTag:
      passedData?.notificationTag || 'Service Alert',
    channels:
      passedData?.channels?.push && passedData?.channels?.inbox
        ? 'Push + In-App'
        : passedData?.channels?.push
        ? 'Push Notification'
        : passedData?.channels?.inbox
        ? 'In-App Inbox'
        : 'Push + In-App',
    execution:
      passedData?.deliverySchedule === 'later'
        ? `Scheduled (${passedData?.scheduledTime || 'Tomorrow, 09:00 AM'})`
        : 'Instant Dispatched',
    sentTimestamp: '05 Oct 2026, 07:15 PM IST',
    gatewayProvider: 'FCM Enterprise Gateway v2.4 • APNs High-Priority',
    authAdmin: 'Super Admin (#SA-01) • Authenticated',
    ledgerHash: 'Hash: e8f9...4b12c • Dispatched by SA-01',
  };

  // Phase state: 'review' | 'dispatching' | 'receipt'
  const [phase, setPhase] = useState<'review' | 'dispatching' | 'receipt'>(
    'review'
  );
  const [isAttested, setIsAttested] = useState<boolean>(false);
  const [copiedNotificationId, setCopiedNotificationId] =
    useState<boolean>(false);

  // Pulse & scale animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const handleSendBroadcast = () => {
    if (!isAttested || phase !== 'review') return;

    setPhase('dispatching');
    setTimeout(() => {
      setPhase('receipt');
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1100);
  };

  const handleCopyId = () => {
    setCopiedNotificationId(true);
    setTimeout(() => {
      setCopiedNotificationId(false);
    }, 2000);
  };

  const handleBackToNotifications = () => {
    if (navigation) {
      navigation.navigate('Notifications');
    }
  };

  const handleReturnToDashboard = () => {
    if (navigation) {
      navigation.navigate('AdminDashboard');
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (phase === 'review') {
                if (navigation?.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation?.navigate('CreateNotification');
                }
              } else {
                handleBackToNotifications();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            {phase === 'receipt'
              ? 'Notification Dispatched'
              : 'Review & Broadcast Notification'}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            accessibilityLabel="More actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= PHASE 1: REVIEW & BROADCAST ================= */}
        {phase === 'review' && (
          <View style={styles.phaseContainer}>
            {/* Meta Header */}
            <View style={styles.stepMetaRow}>
              <Text style={styles.stepMetaText}>
                STEP 2 OF 2 • FINAL DISPATCH
              </Text>
              <View style={styles.stageReadyBadge}>
                <Animated.View
                  style={[styles.stagePulseDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.stageReadyText}>STAGE READY</Text>
              </View>
            </View>

            {/* Title Block */}
            <View style={styles.titleBlock}>
              <Text style={styles.mainTitle}>Review Notification</Text>
              <Text style={styles.mainSubtitle}>
                Verify audience scope and dispatch payload before broadcast
              </Text>
            </View>

            {/* Visual Fleet Anchor Image */}
            <View style={styles.fleetAnchorBanner}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
                }}
                style={styles.fleetImage}
                resizeMode="cover"
              />
              <View style={styles.fleetOverlay}>
                <Animated.View
                  style={[styles.fleetPulseDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.fleetCoverageText}>
                  FLEET COVERAGE: DELHI-NCR SECTOR 01-14
                </Text>
              </View>
            </View>

            {/* Detailed Preview Manifest Card */}
            <View style={styles.manifestCard}>
              <View style={styles.manifestHeader}>
                <View style={styles.manifestHeaderLeft}>
                  <AppIcon name="cell_tower" size={20} />
                  <Text style={styles.manifestTitle}>Payload Manifest</Text>
                </View>
                <View style={styles.typeBadge}>
                  <AppIcon name="warning" size={20} />
                  <Text style={styles.typeBadgeText}>
                    {payload.notificationTag}
                  </Text>
                </View>
              </View>

              {/* Recipient Audience Box */}
              <View style={styles.audienceBox}>
                <Text style={styles.boxLabel}>Recipient Audience</Text>
                <View style={styles.audienceRow}>
                  <Text style={styles.audienceName}>
                    {payload.audienceLabel}
                  </Text>
                  <View style={styles.audienceCountBadge}>
                    <Text style={styles.audienceCountText}>
                      {payload.audienceCount}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Channels & Execution Grid */}
              <View style={styles.twoColGrid}>
                <View style={styles.gridBox}>
                  <Text style={styles.boxLabel}>Channels</Text>
                  <Text style={styles.gridValue}>{payload.channels}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.boxLabel}>Execution</Text>
                  <Text style={styles.gridValue}>{payload.execution}</Text>
                </View>
              </View>

              {/* Notification Message Simulation Box */}
              <View style={styles.simulationBox}>
                <View style={styles.simulationHeader}>
                  <Text style={styles.simulationLabel}>
                    Target Notification Preview
                  </Text>
                  <AppIcon name="devices" size={20} />
                </View>
                <Text style={styles.simulationTitle}>{payload.title}</Text>
                <Text style={styles.simulationMessage}>{payload.message}</Text>
              </View>
            </View>

            {/* Dispatch Safeguard Notice */}
            <View style={styles.safeguardBanner}>
              <View style={styles.safeguardIconBox}>
                <AppIcon name="notification_important" size={20} />
              </View>
              <View style={styles.safeguardTextGroup}>
                <Text style={styles.safeguardTitle}>
                  Critical Safeguard Warning
                </Text>
                <Text style={styles.safeguardDesc}>
                  Review the recipient group and message carefully before
                  sending. Broadcast push notifications will be delivered
                  instantly to {payload.recipientCount} mobile devices across
                  Delhi-NCR and cannot be recalled.
                </Text>
              </View>
            </View>

            {/* Admin Attestation Card */}
            <View style={styles.attestationCard}>
              <TouchableOpacity
                style={styles.attestationCheckboxRow}
                onPress={() => setIsAttested(!isAttested)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.attestationCheckbox,
                    isAttested && styles.attestationCheckboxChecked,
                  ]}
                >
                  {isAttested && (
                    <AppIcon name="check" size={20} />
                  )}
                </View>
                <Text style={styles.attestationLabel}>
                  I have reviewed this notification payload and confirm
                  authorization to broadcast to {payload.recipientCount}{' '}
                  technicians.
                </Text>
              </TouchableOpacity>

              <View style={styles.attestationAuthRow}>
                <View style={styles.attestationAuthLeft}>
                  <AppIcon name="verified_user" size={20} />
                  <Text style={styles.authorizingAdminLabel}>
                    Authorizing Admin:
                  </Text>
                </View>
                <View style={styles.adminTag}>
                  <Text style={styles.adminTagText}>{payload.authAdmin}</Text>
                </View>
              </View>
            </View>

            {/* Primary Action Trigger */}
            <View style={styles.actionBlock}>
              <TouchableOpacity
                style={[
                  styles.sendBroadcastBtn,
                  isAttested
                    ? styles.sendBroadcastBtnActive
                    : styles.sendBroadcastBtnDisabled,
                ]}
                onPress={handleSendBroadcast}
                disabled={!isAttested}
                activeOpacity={0.88}
              >
                <Text style={styles.sendBroadcastBtnText}>
                  Send Notification (Broadcast)
                </Text>
                <AppIcon name="send" size={20} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.helperText,
                  isAttested && styles.helperTextActive,
                ]}
              >
                {isAttested
                  ? 'Payload authorized. Tap to instantly broadcast.'
                  : 'Admin attestation required to unlock broadcast'}
              </Text>
            </View>
          </View>
        )}

        {/* ================= PHASE 2: DISPATCHING ANIMATION ================= */}
        {phase === 'dispatching' && (
          <View style={styles.dispatchingContainer}>
            <View style={styles.dispatchingSpinnerWrapper}>
              <View style={styles.dispatchingAuraRing} />
              <View style={styles.dispatchingIconBox}>
                <AppIcon name="sync" size={20} />
              </View>
            </View>
            <Text style={styles.dispatchingTitle}>
              Broadcasting to {payload.recipientCount} Devices...
            </Text>
            <Text style={styles.dispatchingSub}>
              Connecting to FCM Enterprise & APNs High-Priority pipes
            </Text>
          </View>
        )}

        {/* ================= PHASE 3: RECEIPT SUCCESS ================= */}
        {phase === 'receipt' && (
          <Animated.View
            style={[styles.phaseContainer, { opacity: fadeAnim }]}
          >
            {/* Status Immutable Ribbon */}
            <View style={styles.statusRibbon}>
              <View style={styles.statusRibbonLeft}>
                <Animated.View
                  style={[styles.statusPulseDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.statusRibbonText}>
                  BROADCAST DISPATCHED
                </Text>
              </View>
              <View style={styles.notifIdBadge}>
                <Text style={styles.notifIdText}>{payload.code}</Text>
              </View>
            </View>

            {/* Success Hero Emblem Card */}
            <View style={styles.successHeroCard}>
              <View style={styles.successEmblemCircle}>
                <AppIcon name="check_circle" size={20} />
              </View>
              <Text style={styles.successHeroTitle}>
                Notification Sent Successfully
              </Text>
              <Text style={styles.successHeroDesc}>
                Your notification has been successfully delivered to the
                selected recipients.
              </Text>

              {/* Spark Metrics */}
              <View style={styles.sparkMetricsRow}>
                <View style={styles.sparkItem}>
                  <Text style={styles.sparkValue}>
                    {payload.recipientCount}
                  </Text>
                  <Text style={styles.sparkLabel}>PINGS SENT</Text>
                </View>
                <View style={styles.sparkDivider} />
                <View style={styles.sparkItem}>
                  <Text style={styles.sparkValueSecondary}>100%</Text>
                  <Text style={styles.sparkLabel}>ACK RATE</Text>
                </View>
                <View style={styles.sparkDivider} />
                <View style={styles.sparkItem}>
                  <Text style={styles.sparkValueGreen}>0ms</Text>
                  <Text style={styles.sparkLabel}>QUEUED DELAY</Text>
                </View>
              </View>
            </View>

            {/* Delivery Manifest Card */}
            <View style={styles.manifestCard}>
              <View style={styles.manifestHeader}>
                <View style={styles.manifestHeaderLeft}>
                  <AppIcon name="receipt_long" size={20} />
                  <Text style={styles.manifestTitle}>Delivery Manifest</Text>
                </View>
                <View style={styles.auditedBadge}>
                  <Text style={styles.auditedBadgeText}>AUDITED</Text>
                </View>
              </View>

              <View style={styles.manifestList}>
                <View style={styles.manifestRow}>
                  <Text style={styles.manifestRowLabel}>Recipients</Text>
                  <Text style={styles.manifestRowValue}>
                    {payload.recipientCount} Technicians (100% Delivery
                    Acknowledged)
                  </Text>
                </View>

                <View style={styles.manifestRow}>
                  <Text style={styles.manifestRowLabel}>
                    Delivery Channels
                  </Text>
                  <Text style={styles.manifestRowValue}>
                    Push Notification + In-App Inbox
                  </Text>
                </View>

                <View style={styles.manifestRow}>
                  <Text style={styles.manifestRowLabel}>Sent Timestamp</Text>
                  <Text style={styles.manifestRowValueMono}>
                    {payload.sentTimestamp}
                  </Text>
                </View>

                <View style={styles.manifestRow}>
                  <Text style={styles.manifestRowLabel}>Notification ID</Text>
                  <View style={styles.copyIdGroup}>
                    <Text style={styles.notifIdMonoText}>{payload.id}</Text>
                    <TouchableOpacity
                      onPress={handleCopyId}
                      style={styles.copyBtn}
                    >
                      <AppIcon name={copiedNotificationId ? 'done' : 'content_copy'} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.manifestRow}>
                  <Text style={styles.manifestRowLabel}>
                    Delivery Success Rate
                  </Text>
                  <Text style={styles.manifestSuccessRate}>
                    {payload.recipientCount} / {payload.recipientCount} Received
                    (0 Bounces, 0 Failures)
                  </Text>
                </View>

                <View style={styles.gatewayBox}>
                  <AppIcon name="dns" size={20} />
                  <View style={styles.gatewayInfo}>
                    <Text style={styles.gatewayLabel}>Gateway Provider</Text>
                    <Text style={styles.gatewayValue}>
                      {payload.gatewayProvider}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Secondary Visual Telemetry Snippet */}
            <View style={styles.ledgerStampBox}>
              <View style={styles.ledgerStampIconBox}>
                <AppIcon name="verified" size={20} />
              </View>
              <View style={styles.ledgerStampInfo}>
                <Text style={styles.ledgerStampTitle}>
                  Immutable Ledger Stamp Verified
                </Text>
                <Text style={styles.ledgerStampHash}>
                  {payload.ledgerHash}
                </Text>
              </View>
            </View>

            {/* Bottom Action Buttons */}
            <View style={styles.bottomActionsGroup}>
              <TouchableOpacity
                style={styles.primaryFeedBtn}
                onPress={handleBackToNotifications}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryFeedBtnText}>
                  View Notifications Feed
                </Text>
                <AppIcon name="arrow_forward" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneDashboardBtn}
                onPress={handleReturnToDashboard}
                activeOpacity={0.75}
              >
                <Text style={styles.doneDashboardBtnText}>
                  Done (Return to Dashboard)
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
    zIndex: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    ...Shadows.level1,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Scroll Content */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContentDesktop: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  phaseContainer: {
    gap: 16,
  },

  /* Phase 1: Review & Broadcast */
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  stepMetaText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
    letterSpacing: 0.5,
  },
  stageReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
  },
  stagePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  stageReadyText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#00174b',
  },
  titleBlock: {
    gap: 2,
  },
  mainTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  mainSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464d',
    lineHeight: 18,
  },

  /* Fleet Anchor Banner */
  fleetAnchorBanner: {
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#131b2e',
    ...Shadows.level1,
  },
  fleetImage: {
    width: '100%',
    height: '100%',
  },
  fleetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(19, 27, 46, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fleetPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6ffbbe',
  },
  fleetCoverageText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  /* Payload Manifest Card */
  manifestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  manifestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  manifestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  manifestIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  manifestTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#ffdad6',
  },
  typeBadgeIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#93000a',
    includeFontPadding: false,
  },
  typeBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#93000a',
  },

  /* Audience Box */
  audienceBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  boxLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  audienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audienceName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  audienceCountBadge: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  audienceCountText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#191c1e',
  },

  /* 2-Col Grid */
  twoColGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  gridBox: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  gridValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#191c1e',
  },

  /* Simulation Box */
  simulationBox: {
    backgroundColor: '#eceef0',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  simulationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simulationLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    textTransform: 'uppercase',
  },
  simulationIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
  },
  simulationTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#191c1e',
  },
  simulationMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    lineHeight: 18,
  },

  /* Safeguard Banner */
  safeguardBanner: {
    backgroundColor: 'rgba(255, 218, 214, 0.45)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#ffdad6',
  },
  safeguardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  safeguardIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  safeguardTextGroup: {
    flex: 1,
    gap: 2,
  },
  safeguardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#93000a',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  safeguardDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#93000a',
    lineHeight: 16,
  },

  /* Attestation Card */
  attestationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  attestationCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  attestationCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  attestationCheckboxChecked: {
    backgroundColor: '#0051d5',
  },
  attestationCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
  },
  attestationLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
    flex: 1,
    lineHeight: 17,
  },
  attestationAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f2f4f6',
  },
  attestationAuthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#009668',
    includeFontPadding: false,
  },
  authorizingAdminLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  adminTag: {
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminTagText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Primary Action */
  actionBlock: {
    gap: 6,
  },
  sendBroadcastBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBroadcastBtnActive: {
    backgroundColor: '#000000',
    ...Shadows.level2,
  },
  sendBroadcastBtnDisabled: {
    backgroundColor: '#e0e3e5',
  },
  sendBroadcastBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  sendBroadcastBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  helperText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
    textAlign: 'center',
  },
  helperTextActive: {
    color: '#0051d5',
    fontFamily: 'JetBrainsMono-Medium',
  },

  /* Phase 2: Dispatching State */
  dispatchingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  dispatchingSpinnerWrapper: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dispatchingAuraRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dbe1ff',
  },
  dispatchingIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  dispatchingSyncIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#ffffff',
    includeFontPadding: false,
  },
  dispatchingTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
  },
  dispatchingSub: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
    textAlign: 'center',
  },

  /* Phase 3: Receipt Success */
  statusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#002113',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadows.level1,
  },
  statusRibbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6ffbbe',
  },
  statusRibbonText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#6ffbbe',
    letterSpacing: 0.5,
  },
  notifIdBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notifIdText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#6ffbbe',
  },
  successHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  successEmblemCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.level2,
  },
  successCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 36,
    color: '#002113',
    includeFontPadding: false,
  },
  successHeroTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#191c1e',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successHeroDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464d',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  sparkMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f2f4f6',
    gap: 16,
  },
  sparkItem: {
    alignItems: 'center',
    flex: 1,
  },
  sparkValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
  },
  sparkValueSecondary: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#0051d5',
  },
  sparkValueGreen: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#009668',
  },
  sparkLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    color: '#76777d',
    marginTop: 1,
  },
  sparkDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e6e8ea',
  },

  /* Audited Badge */
  auditedBadge: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  auditedBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#005236',
  },
  manifestList: {
    gap: 8,
  },
  manifestRow: {
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manifestRowLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  manifestRowValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
    maxWidth: '65%',
    textAlign: 'right',
  },
  manifestRowValueMono: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  copyIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifIdMonoText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: '#0051d5',
  },
  copyBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#45464d',
    includeFontPadding: false,
  },
  manifestSuccessRate: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#009668',
  },
  gatewayBox: {
    backgroundColor: '#e6e8ea',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gatewayIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  gatewayInfo: {
    flex: 1,
  },
  gatewayLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  gatewayValue: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Ledger Stamp Box */
  ledgerStampBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  ledgerStampIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  ledgerStampInfo: {
    flex: 1,
  },
  ledgerStampTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  ledgerStampHash: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
    marginTop: 1,
  },

  /* Bottom Action Buttons */
  bottomActionsGroup: {
    gap: 8,
    marginTop: 4,
  },
  primaryFeedBtn: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryFeedBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryFeedBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  doneDashboardBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doneDashboardBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
});
