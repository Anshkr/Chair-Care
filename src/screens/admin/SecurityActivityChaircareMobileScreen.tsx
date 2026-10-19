import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface SecurityActivityProps {
  navigation?: any;
}

interface SecurityEventItem {
  id: string;
  badgeLabel: string;
  badgeType: 'critical' | 'enforcement' | 'alert' | 'crypto' | 'role';
  time: string;
  title: string;
  description: string;
  actorOrTarget: string;
  locationOrOrigin?: string;
  authMethodOrAction?: string;
  triggerDetails?: string;
  executorOrSignoff?: string;
  extraStatus?: string;
  actionButtonTitle?: string;
  actionButtonIcon?: string;
}

const SECURITY_EVENTS: SecurityEventItem[] = [
  {
    id: 'evt-1',
    badgeLabel: 'CRITICAL PERM',
    badgeType: 'critical',
    time: 'Today • 09:21 AM',
    title: 'Admin Permissions Elevated',
    description:
      'Super Admin granted temporary Escrow Overwrite (>₹5,000) to Neha Gupta (ADM-0044).',
    actorOrTarget: 'Actor: Super Admin (#SA-01)',
    locationOrOrigin: 'Delhi-NCR (Static IP)',
    authMethodOrAction: 'WebAuthn • YubiKey 5C NFC',
    extraStatus: 'Hardware Attested',
    actionButtonTitle: 'Inspect Permission Delta',
    actionButtonIcon: 'arrow_forward',
  },
  {
    id: 'evt-2',
    badgeLabel: 'ACCOUNT ENFORCEMENT',
    badgeType: 'enforcement',
    time: 'Today • 10:42 AM',
    title: 'Technician Dispatch Account Suspended',
    description:
      'Field operator Rahul Sharma suspended immediately across central booking routers.',
    triggerDetails:
      'Class-4 cylinder cert expired • 3 consecutive SLA violations',
    executorOrSignoff:
      'Enforced by: Super Admin (#SA-01) • Queue reassigned to Zone North',
    actorOrTarget: 'Rahul Sharma (#TECH-841)',
    actionButtonTitle: 'Review Suspension Dossier',
    actionButtonIcon: 'description',
  },
  {
    id: 'evt-3',
    badgeLabel: 'BRUTE-FORCE DETECTED',
    badgeType: 'alert',
    time: 'Today • 08:12 AM',
    title: 'Anonymized Login Surge Blocked',
    description:
      '3 rapid invalid credential submissions against administrative root access.',
    actorOrTarget: 'Target Identity: admin.support@chaircare.in',
    locationOrOrigin: 'Origin: 185.220.101.5 (Tor Exit Node)',
    authMethodOrAction: 'Automated Action: IP Quarantined (24h)',
    extraStatus: 'Biometric Unlock Enforced • Active Defense',
  },
  {
    id: 'evt-4',
    badgeLabel: 'CRYPTOGRAPHIC GOVERNANCE',
    badgeType: 'crypto',
    time: 'Today • 04:00 AM',
    title: 'Master Gateway Secrets Rotated',
    description:
      'Razorpay settlement & payout webhook key cycle completed.',
    executorOrSignoff: 'Executor: Automated Vault Cron',
    extraStatus: 'Zero Downtime',
    actorOrTarget: 'Razorpay Gateway Pool',
  },
  {
    id: 'evt-5',
    badgeLabel: 'ROLE PROVISIONED',
    badgeType: 'role',
    time: 'Yesterday • 04:32 PM',
    title: 'Dispatch Lead Admin Account Initialized',
    description:
      'Aman Verma (ADM-0091) provisioned with North Regional Dispatch privileges.',
    executorOrSignoff: 'Sign-off: Super Admin (#SA-01)',
    extraStatus: 'MFA Initialized',
    actorOrTarget: 'Aman Verma (ADM-0091)',
  },
];

export const SecurityActivityChaircareMobileScreen: React.FC<
  SecurityActivityProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Pulse animation for live security indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
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

  // Selected Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<SecurityEventItem | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2500);
  };

  const handleInspectDelta = (event: SecurityEventItem) => {
    setSelectedEvent(event);
  };

  const handleDownloadReport = () => {
    displayToast('Generating Sentinel incident audit report (PDF)...');
  };

  const handleViewAllLogs = () => {
    if (navigation?.navigate) {
      // Check if ActivityLogs or navigation target exists
      displayToast('Loading complete 30-day security audit stream...');
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
              if (navigation?.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back_ios_new" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Security Activity
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => displayToast('Sharing incident telemetry stream')}
            accessibilityLabel="Share"
          >
            <AppIcon name="share" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatar}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Context Badge & Subtitle */}
        <View style={styles.contextHeaderRow}>
          <View style={styles.contextTextGroup}>
            <View style={styles.contextTitleRow}>
              <Text style={styles.contextTitle}>Security Activity</Text>
              <Animated.View
                style={[styles.pulseDot, { opacity: pulseAnim }]}
              />
            </View>
            <Text style={styles.contextSubtitle}>
              Monitor sensitive administrative actions & real-time alerts
            </Text>
          </View>

          <View style={styles.shieldIconContainer}>
            <AppIcon name="shield_lock" size={20} />
          </View>
        </View>

        {/* Reassuring Security Status Banner */}
        <View style={styles.statusBannerCard}>
          <View style={styles.statusBannerContent}>
            <View style={styles.verifiedUserIconBox}>
              <AppIcon name="verified_user" size={20} />
            </View>
            <View style={styles.statusBannerDetails}>
              <View style={styles.statusBannerHeadingRow}>
                <Text style={styles.statusBannerTitle}>
                  No Critical Incidents
                </Text>
                <View style={styles.protectedPill}>
                  <Text style={styles.protectedPillText}>PROTECTED</Text>
                </View>
              </View>
              <Text style={styles.statusBannerBody}>
                All 6 high-risk administrative operations today verified by 2FA
                token authentication and hardware keys.
              </Text>
              <View style={styles.sentinelChip}>
                <AppIcon name="history" size={20} />
                <Text style={styles.sentinelChipText}>
                  2m ago • Sentinel Engine v4.9 Active
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Summary KPI Cards (2x2 grid) */}
        <View style={styles.kpiGrid}>
          {/* KPI 1: Critical */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>CRITICAL</Text>
              <View style={styles.kpiIconBoxError}>
                <AppIcon name="warning" size={20} />
              </View>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>6</Text>
              <Text style={styles.kpiTagError}>Flagged</Text>
            </View>
            <Text style={styles.kpiSubtext} numberOfLines={1}>
              Requires admin review
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '75%', backgroundColor: '#ba1a1a' }]} />
            </View>
          </View>

          {/* KPI 2: Auth Blocks */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>AUTH BLOCKS</Text>
              <View style={styles.kpiIconBoxError}>
                <AppIcon name="lock_clock" size={20} />
              </View>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>3</Text>
              <Text style={styles.kpiTagError}>Failed</Text>
            </View>
            <Text style={styles.kpiSubtext} numberOfLines={1}>
              Rate-limited rogue IPs
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '40%', backgroundColor: '#93000a' }]} />
            </View>
          </View>

          {/* KPI 3: Perms Delta */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>PERMS DELTA</Text>
              <View style={styles.kpiIconBoxSecondary}>
                <AppIcon name="tune" size={20} />
              </View>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>2</Text>
              <Text style={styles.kpiTagSecondary}>Valid</Text>
            </View>
            <Text style={styles.kpiSubtext} numberOfLines={1}>
              Dual sign-off granted
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '33%', backgroundColor: '#0051d5' }]} />
            </View>
          </View>

          {/* KPI 4: Lifecycle */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>LIFECYCLE</Text>
              <View style={styles.kpiIconBoxPrimary}>
                <AppIcon name="manage_accounts" size={20} />
              </View>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>8</Text>
              <Text style={styles.kpiTagNeutral}>Applied</Text>
            </View>
            <Text style={styles.kpiSubtext} numberOfLines={1}>
              Locks & activations
            </Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%', backgroundColor: '#191c1e' }]} />
            </View>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.auditStreamHeader}>
          <View style={styles.auditStreamLeft}>
            <Text style={styles.auditStreamTitle}>Audit Stream</Text>
            <View style={styles.liveStreamPill}>
              <Text style={styles.liveStreamPillText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.timezoneText}>UTC +05:30</Text>
        </View>

        {/* Event Stream Cards */}
        <View style={styles.eventCardsStack}>
          {SECURITY_EVENTS.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              {/* Event Header */}
              <View style={styles.eventCardHeader}>
                <View style={styles.eventBadgeGroup}>
                  <View
                    style={[
                      styles.eventDot,
                      event.badgeType === 'critical' || event.badgeType === 'alert'
                        ? styles.eventDotError
                        : event.badgeType === 'enforcement' || event.badgeType === 'crypto'
                        ? styles.eventDotSecondary
                        : styles.eventDotPrimary,
                    ]}
                  />
                  <View
                    style={[
                      styles.eventPillBadge,
                      event.badgeType === 'critical' || event.badgeType === 'alert'
                        ? styles.eventPillBadgeError
                        : event.badgeType === 'enforcement' || event.badgeType === 'crypto'
                        ? styles.eventPillBadgeSecondary
                        : styles.eventPillBadgePrimary,
                    ]}
                  >
                    <Text
                      style={[
                        styles.eventPillBadgeText,
                        event.badgeType === 'critical' || event.badgeType === 'alert'
                          ? styles.eventPillBadgeTextError
                          : event.badgeType === 'enforcement' || event.badgeType === 'crypto'
                          ? styles.eventPillBadgeTextSecondary
                          : styles.eventPillBadgeTextPrimary,
                      ]}
                    >
                      {event.badgeLabel}
                    </Text>
                  </View>
                </View>

                <Text style={styles.eventTimeText}>{event.time}</Text>
              </View>

              {/* Event Main Content */}
              <View style={styles.eventMainContent}>
                <Text style={styles.eventTitleText}>{event.title}</Text>
                <Text style={styles.eventDescText}>{event.description}</Text>
              </View>

              {/* Metadata Details Box */}
              <View style={styles.eventMetaBox}>
                {event.triggerDetails && (
                  <View style={styles.triggerRow}>
                    <AppIcon name="report_problem" size={20} />
                    <Text style={styles.triggerText}>
                      Trigger: {event.triggerDetails}
                    </Text>
                  </View>
                )}

                {event.actorOrTarget && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaRowLeftText}>
                      {event.actorOrTarget}
                    </Text>
                    {event.locationOrOrigin && (
                      <Text style={styles.metaRowRightText}>
                        {event.locationOrOrigin}
                      </Text>
                    )}
                  </View>
                )}

                {event.authMethodOrAction && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaRowLeftTextHighlight}>
                      {event.authMethodOrAction}
                    </Text>
                    {event.extraStatus && (
                      <View style={styles.metaStatusBadge}>
                        <Text style={styles.metaStatusBadgeText}>
                          {event.extraStatus}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {event.executorOrSignoff && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaRowLeftText}>
                      {event.executorOrSignoff}
                    </Text>
                    {event.extraStatus && !event.authMethodOrAction && (
                      <Text style={styles.metaRowRightHighlight}>
                        {event.extraStatus}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Action Button if specified */}
              {event.actionButtonTitle && (
                <TouchableOpacity
                  style={styles.inspectButton}
                  onPress={() => handleInspectDelta(event)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.inspectButtonText}>
                    {event.actionButtonTitle}
                  </Text>
                  <AppIcon name={event.actionButtonIcon || 'arrow_forward'} size={20} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* End of Stream Indicator */}
        <View style={styles.endOfStreamContainer}>
          <View style={styles.endOfStreamLine} />
          <Text style={styles.endOfStreamText}>END OF 48-HOUR WINDOW</Text>
          <View style={styles.endOfStreamLine} />
        </View>
      </ScrollView>

      {/* Realtime Confirmation Toast Container */}
      {toastVisible && (
        <View
          style={[
            styles.toastContainer,
            { bottom: Math.max(insets.bottom, 20) + 115 },
          ]}
        >
          <View style={styles.toastLeft}>
            <AppIcon name="check_circle" size={20} />
            <Text style={styles.toastMessageText} numberOfLines={2}>
              {toastMessage}
            </Text>
          </View>
          <Text style={styles.toastNowTag}>NOW</Text>
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomCommitBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.bottomCommitBarContent}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleViewAllLogs}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>
              View All Security Audit Logs
            </Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={handleDownloadReport}
            activeOpacity={0.8}
          >
            <AppIcon name="picture_as_pdf" size={20} />
            <Text style={styles.secondaryActionText}>
              Download Incident Report (PDF)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Details / Dossier Modal */}
      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedEvent(null)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedEvent?.badgeLabel} Dossier
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {selectedEvent && (
              <View style={styles.modalEventDetails}>
                <Text style={styles.modalEventTitle}>{selectedEvent.title}</Text>
                <Text style={styles.modalEventDesc}>
                  {selectedEvent.description}
                </Text>

                <View style={styles.modalMetaCard}>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaLabel}>Logged Timestamp</Text>
                    <Text style={styles.modalMetaVal}>{selectedEvent.time}</Text>
                  </View>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaLabel}>Actor Identity</Text>
                    <Text style={styles.modalMetaVal}>
                      {selectedEvent.actorOrTarget}
                    </Text>
                  </View>
                  {selectedEvent.locationOrOrigin && (
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaLabel}>Origin / IP</Text>
                      <Text style={styles.modalMetaVal}>
                        {selectedEvent.locationOrOrigin}
                      </Text>
                    </View>
                  )}
                  {selectedEvent.authMethodOrAction && (
                    <View style={styles.modalMetaRow}>
                      <Text style={styles.modalMetaLabel}>Cryptographic Proof</Text>
                      <Text style={styles.modalMetaValHighlight}>
                        {selectedEvent.authMethodOrAction}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={() => {
                    setSelectedEvent(null);
                    displayToast('Audit signature verified and sealed.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalConfirmBtnText}>
                    Acknowledge & Seal Entry
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    marginLeft: -4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    lineHeight: 26,
    color: '#191c1e',
    marginLeft: 4,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  actionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  /* Header Context */
  contextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  contextTextGroup: {
    flex: 1,
    gap: 2,
  },
  contextTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    lineHeight: 28,
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  contextSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#45464d',
  },
  shieldIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#6ffbbe',
  },

  /* Reassuring Status Banner */
  statusBannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  statusBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  verifiedUserIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedUserIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#6ffbbe',
  },
  statusBannerDetails: {
    flex: 1,
    gap: 4,
  },
  statusBannerHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBannerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#191c1e',
  },
  protectedPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
  },
  protectedPillText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#002113',
  },
  statusBannerBody: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#45464d',
  },
  sentinelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sentinelChipIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
  },
  sentinelChipText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiIconBoxError: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconError: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#93000a',
  },
  kpiIconBoxSecondary: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconSecondary: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#00174b',
  },
  kpiIconBoxPrimary: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#dae2fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconPrimary: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#131b2e',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  kpiValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: '#191c1e',
  },
  kpiTagError: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#ba1a1a',
  },
  kpiTagSecondary: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#0051d5',
  },
  kpiTagNeutral: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#45464d',
  },
  kpiSubtext: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#e6e8ea',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  /* Audit Stream Header */
  auditStreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 4,
  },
  auditStreamLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditStreamTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 17,
    color: '#191c1e',
  },
  liveStreamPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#e6e8ea',
  },
  liveStreamPillText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#191c1e',
  },
  timezoneText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },

  /* Event Cards Stack */
  eventCardsStack: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventDotError: {
    backgroundColor: '#ba1a1a',
  },
  eventDotSecondary: {
    backgroundColor: '#0051d5',
  },
  eventDotPrimary: {
    backgroundColor: '#131b2e',
  },
  eventPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventPillBadgeError: {
    backgroundColor: '#ffdad6',
  },
  eventPillBadgeSecondary: {
    backgroundColor: '#dbe1ff',
  },
  eventPillBadgePrimary: {
    backgroundColor: '#dae2fd',
  },
  eventPillBadgeText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
  },
  eventPillBadgeTextError: {
    color: '#93000a',
  },
  eventPillBadgeTextSecondary: {
    color: '#00174b',
  },
  eventPillBadgeTextPrimary: {
    color: '#131b2e',
  },
  eventTimeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  eventMainContent: {
    gap: 2,
  },
  eventTitleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: '#191c1e',
  },
  eventDescText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  eventMetaBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  triggerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#ba1a1a',
  },
  triggerText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#ba1a1a',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaRowLeftText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
    flex: 1,
  },
  metaRowRightText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  metaRowLeftTextHighlight: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#005236',
    flex: 1,
  },
  metaRowRightHighlight: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#009668',
  },
  metaStatusBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metaStatusBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  inspectButton: {
    height: 38,
    backgroundColor: '#e6e8ea',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  inspectButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#191c1e',
  },
  inspectButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
  },

  /* End of stream */
  endOfStreamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  endOfStreamLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e3e5',
  },
  endOfStreamText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    letterSpacing: 1,
  },

  /* Sticky Bottom Action Bar */
  bottomCommitBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomCommitBarContent: {
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
    gap: 8,
  },
  primaryActionButton: {
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  primaryActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
  },
  secondaryActionButton: {
    height: 40,
    backgroundColor: '#e6e8ea',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
  },
  secondaryActionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191c1e',
  },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#131b2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  toastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#6ffbbe',
  },
  toastMessageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#ffffff',
    flex: 1,
  },
  toastNowTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#7c839b',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '80%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 17,
    color: '#191c1e',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
  },
  modalEventDetails: {
    gap: 12,
  },
  modalEventTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#191c1e',
  },
  modalEventDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  modalMetaCard: {
    backgroundColor: '#f7f9fb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  modalMetaLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#76777d',
  },
  modalMetaVal: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  modalMetaValHighlight: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#0051d5',
  },
  modalConfirmBtn: {
    height: 46,
    backgroundColor: '#0051d5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalConfirmBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});
