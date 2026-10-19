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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface NotificationDetailsProps {
  navigation?: any;
  route?: {
    params?: {
      notifId?: string;
      notification?: any;
    };
  };
}

export const NotificationDetailsChaircareMobileScreen: React.FC<
  NotificationDetailsProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const passedNotif = route?.params?.notification;

  const notif = {
    id: passedNotif?.id || 'NOT-84920',
    caseId: '#NOT-84920 • PRIORITY DISPATCH',
    title: passedNotif?.title || 'Unassigned Service Request',
    message:
      passedNotif?.message ||
      'Request CR-10482 has been waiting for technician assignment for 18 minutes. Automatic geofence dispatch matching found 3 nearby technicians, but no technician has acknowledged the broadcast.',
    isHighPriority: true,
    timeAgo: passedNotif?.timeAgo || '10 min ago',
    requestRef: 'CR-10482',
    slaMinutes: 18,
    slaPercent: 60,
    broadcastAttempt: 'Attempt 3/3',
    chairModel: 'Herman Miller Aeron',
    serviceTitle: 'Hydraulic Replacement',
    serviceCategory: 'Class-4 Gas Strut Repair',
    serviceValue: '₹1,850',
    clientName: 'Rahul Mehta',
    clientTier: 'Tier-1',
    clientAccount: 'Corporate Workplace Account',
    clientPhone: '+91 98110 49201',
    serviceSite: 'Sector 54, Palm Springs, Gurugram',
    serviceSiteDetails: 'Tower C, Floor 8 • Gate 2 Entry Clearance',
    requestedSlot: 'Today • 05:00 PM – 07:00 PM',
    alertRule: 'SLA_BREACH_WARN_T1',
    autoEscalateTime: '00:12:00',
    suggestedTech: {
      name: 'Rahul Sharma',
      initials: 'RS',
      van: 'Van #04',
      distance: '1.8 km',
      status: 'Ready',
    },
    candidates: [
      {
        name: 'Rahul Sharma (Van #04)',
        distance: '1.8 km • Idle',
        statusColor: '#4edea3',
      },
      {
        name: 'Vikas Gupta (Van #02)',
        distance: '2.4 km • Finishing Job',
        statusColor: '#0051d5',
      },
      {
        name: 'Amit Patel (Bike #09)',
        distance: '3.1 km • Standby',
        statusColor: '#76777d',
      },
    ],
  };

  // State
  const [isRead, setIsRead] = useState<boolean>(false);
  const [isQuickDispatched, setIsQuickDispatched] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('check_circle');

  // Pulse animation for priority ping dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  const showToast = (msg: string, icon: string = 'check_circle') => {
    setToastIcon(icon);
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleMarkAsRead = () => {
    setIsRead(!isRead);
    if (!isRead) {
      showToast(`Alert #${notif.id} marked as read`, 'done_all');
    } else {
      showToast(`Alert #${notif.id} marked as unread`, 'mark_email_unread');
    }
  };

  const handleQuickAssign = () => {
    setIsQuickDispatched(true);
    showToast(
      `Direct dispatch order pushed to ${notif.suggestedTech.name}`,
      'local_shipping'
    );
  };

  const handleViewOrder = () => {
    if (navigation) {
      navigation.navigate('ServiceRequests');
    }
  };

  const handleMuteAlerts = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      showToast('Unassigned alerts muted for 1 hr', 'notifications_paused');
    } else {
      showToast('Unassigned alerts unmuted', 'notifications');
    }
  };

  const handleCallClient = () => {
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${notif.clientPhone}`);
    } else {
      showToast(`Calling ${notif.clientName} (${notif.clientPhone})...`, 'call');
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
              } else {
                navigation?.navigate('Notifications');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Notification Details
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
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Live Pulse Notification Header Card */}
        <View style={styles.headerCard}>
          {/* Subtle Ambient Gradient Corner */}
          <View style={styles.ambientCorner} />

          {/* Status Meta Bar */}
          <View style={styles.statusMetaBar}>
            <View style={styles.statusMetaLeft}>
              <View style={styles.wrenchIconBox}>
                <AppIcon name="build" size={20} />
              </View>
              <View style={styles.priorityPill}>
                <Animated.View
                  style={[styles.priorityPingDot, { opacity: pulseAnim }]}
                />
                <Text style={styles.priorityPillText}>High Priority</Text>
              </View>
              <View
                style={[
                  styles.readStatePill,
                  isRead ? styles.readStatePillRead : styles.readStatePillUnread,
                ]}
              >
                <Text
                  style={[
                    styles.readStatePillText,
                    isRead
                      ? styles.readStatePillTextRead
                      : styles.readStatePillTextUnread,
                  ]}
                >
                  {isRead ? 'Acknowledged' : 'Unread'}
                </Text>
              </View>
            </View>
            <View style={styles.timeAgoRow}>
              <AppIcon name="schedule" size={20} />
              <Text style={styles.timeAgoText}>{notif.timeAgo}</Text>
            </View>
          </View>

          {/* Headline & Case ID */}
          <View style={styles.headlineBlock}>
            <Text style={styles.headlineTitle}>{notif.title}</Text>
            <View style={styles.caseIdBadge}>
              <AppIcon name="sensors" size={20} />
              <Text style={styles.caseIdText}>{notif.caseId}</Text>
            </View>
          </View>

          {/* Detailed Narrative */}
          <Text style={styles.narrativeText}>
            Request{' '}
            <Text style={styles.narrativeRefText}>{notif.requestRef}</Text> has
            been waiting for technician assignment for{' '}
            <Text style={styles.narrativeHighlight}>
              {notif.slaMinutes} minutes
            </Text>
            . Automatic geofence dispatch matching found 3 nearby technicians,
            but no technician has acknowledged the broadcast.
          </Text>

          {/* Broadcast Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeaderRow}>
              <View style={styles.radarGroup}>
                <AppIcon name="radar" size={20} />
                <Text style={styles.progressAttemptText}>
                  Broadcast Cycle: {notif.broadcastAttempt}
                </Text>
              </View>
              <Text style={styles.slaElapsedText}>
                {notif.slaPercent}% SLA elapsed
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${notif.slaPercent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 2. Related Information Dossier Card */}
        <View style={styles.dossierCard}>
          <View style={styles.dossierHeader}>
            <View style={styles.dossierHeaderLeft}>
              <View style={styles.blueDot} />
              <Text style={styles.dossierTitle}>SERVICE ORDER CONTEXT</Text>
            </View>
            <View style={styles.orderRefBadge}>
              <Text style={styles.orderRefText}>#{notif.requestRef}</Text>
            </View>
          </View>

          {/* Chair Asset Profile Highlight */}
          <View style={styles.chairAssetRow}>
            <View style={styles.chairImgWrapper}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1580481077197-73fa1380b62b?auto=format&fit=crop&w=300&q=80',
                }}
                style={styles.chairImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.chairInfoGroup}>
              <View style={styles.chairVerifiedRow}>
                <AppIcon name="verified" size={20} />
                <Text style={styles.chairModelName}>{notif.chairModel}</Text>
              </View>
              <Text style={styles.chairServiceTitle}>{notif.serviceTitle}</Text>
              <View style={styles.chairCategoryRow}>
                <AppIcon name="category" size={20} />
                <Text style={styles.chairCategoryText}>
                  {notif.serviceCategory}
                </Text>
              </View>
            </View>
            <View style={styles.chairValueGroup}>
              <Text style={styles.valueLabel}>Value</Text>
              <Text style={styles.valueAmount}>{notif.serviceValue}</Text>
            </View>
          </View>

          {/* Client & Schedule Specs */}
          <View style={styles.specsGrid}>
            {/* Client Spec */}
            <View style={styles.specCard}>
              <View style={styles.clientProfileLeft}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>RM</Text>
                </View>
                <View style={styles.clientInfoText}>
                  <View style={styles.clientNameRow}>
                    <Text style={styles.clientName}>{notif.clientName}</Text>
                    <View style={styles.tierPill}>
                      <Text style={styles.tierPillText}>{notif.clientTier}</Text>
                    </View>
                  </View>
                  <Text style={styles.clientAccount}>{notif.clientAccount}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callClientBtn}
                onPress={handleCallClient}
                activeOpacity={0.7}
                accessibilityLabel="Call Client"
              >
                <AppIcon name="call" size={20} />
              </TouchableOpacity>
            </View>

            {/* Location Spec */}
            <View style={styles.specCardLocation}>
              <View style={styles.locIconBox}>
                <AppIcon name="location_on" size={20} />
              </View>
              <View style={styles.locInfo}>
                <Text style={styles.specLabel}>SERVICE SITE</Text>
                <Text style={styles.locMainText}>{notif.serviceSite}</Text>
                <Text style={styles.locSubText}>{notif.serviceSiteDetails}</Text>
              </View>
            </View>

            {/* Time Window & Status */}
            <View style={styles.specCardSlot}>
              <View style={styles.slotLeft}>
                <View style={styles.eventIconBox}>
                  <AppIcon name="event" size={20} />
                </View>
                <View>
                  <Text style={styles.specLabel}>REQUESTED SLOT</Text>
                  <Text style={styles.slotMainText}>{notif.requestedSlot}</Text>
                </View>
              </View>
              <View style={styles.unassignedSlaBadge}>
                <AppIcon name="warning" size={20} />
                <Text style={styles.unassignedSlaText}>
                  Unassigned • {notif.slaMinutes}m SLA
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Recommended Action Callout Card */}
        <View style={styles.recommendedCard}>
          <View style={styles.recommendedLeftStripe} />
          <View style={styles.recommendedContentRow}>
            <View style={styles.lightbulbBox}>
              <AppIcon name="lightbulb" size={20} />
            </View>
            <View style={styles.recommendedBody}>
              <View>
                <Text style={styles.recommendedEyebrow}>
                  RECOMMENDED ACTION
                </Text>
                <Text style={styles.recommendedHeading}>
                  Immediate Manual Assignment
                </Text>
              </View>
              <Text style={styles.recommendedDesc}>
                Assign an available technician to prevent SLA breach. Master
                Specialist{' '}
                <Text style={styles.boldTech}>
                  {notif.suggestedTech.name} ({notif.suggestedTech.van})
                </Text>{' '}
                is{' '}
                <Text style={styles.distanceHighlight}>
                  {notif.suggestedTech.distance}
                </Text>{' '}
                away with full hydraulic repair kit.
              </Text>

              {/* Suggested Tech Mini-Profile */}
              <View style={styles.suggestedTechRow}>
                <View style={styles.suggestedTechLeft}>
                  <View style={styles.suggestedTechAvatar}>
                    <Text style={styles.suggestedTechAvatarText}>
                      {notif.suggestedTech.initials}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.suggestedTechName}>
                      {notif.suggestedTech.name}
                    </Text>
                    <View style={styles.readyRow}>
                      <View style={styles.readyGreenDot} />
                      <Text style={styles.readyText}>
                        {notif.suggestedTech.status} • {notif.suggestedTech.van}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.quickAssignBtn,
                    isQuickDispatched && styles.quickAssignBtnDispatched,
                  ]}
                  onPress={handleQuickAssign}
                  disabled={isQuickDispatched}
                  activeOpacity={0.85}
                >
                  <AppIcon name={isQuickDispatched ? 'done' : 'send'} size={20} />
                  <Text style={styles.quickAssignText}>
                    {isQuickDispatched ? 'Dispatched' : 'Assign'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Dispatch Telemetry Snapshot */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryCardHeader}>
            <View style={styles.telemetryHeaderLeft}>
              <AppIcon name="travel_explore" size={20} />
              <Text style={styles.telemetryCardTitle}>Dispatch Telemetry</Text>
            </View>
            <View style={styles.liveSensorBadge}>
              <Animated.View
                style={[styles.liveSensorDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.liveSensorText}>Live Sensor</Text>
            </View>
          </View>

          {/* Mini Telemetry Map Banner */}
          <View style={styles.miniMapBanner}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=600&q=80',
              }}
              style={styles.miniMapImage}
              resizeMode="cover"
            />
            <View style={styles.miniMapOverlay}>
              <View style={styles.mapTargetLeft}>
                <AppIcon name="pin_drop" size={20} />
                <Text style={styles.mapTargetText}>Target: Sector 54</Text>
              </View>
              <Text style={styles.mapRadiusText}>Radius: 3.5 km</Text>
            </View>
          </View>

          {/* Metric Quad Grid */}
          <View style={styles.quadGrid}>
            <View style={styles.quadItem}>
              <Text style={styles.quadLabel}>GEOFENCE SCOPE</Text>
              <View style={styles.quadValueRow}>
                <Text style={styles.quadValue}>3.5</Text>
                <Text style={styles.quadUnit}>km active</Text>
              </View>
            </View>

            <View style={styles.quadItem}>
              <Text style={styles.quadLabel}>CANDIDATES</Text>
              <View style={styles.quadValueRow}>
                <Text style={styles.quadValueBlue}>3</Text>
                <Text style={styles.quadUnit}>nearby</Text>
              </View>
            </View>

            <View style={styles.quadItem}>
              <Text style={styles.quadLabel}>NEAREST ETA</Text>
              <View style={styles.quadValueRow}>
                <Text style={styles.quadValue}>8</Text>
                <Text style={styles.quadUnit}>mins</Text>
              </View>
            </View>

            <View style={styles.quadItem}>
              <Text style={styles.quadLabelError}>SLA DEADLINE</Text>
              <View style={styles.quadValueRow}>
                <Text style={styles.quadValueError}>12</Text>
                <Text style={styles.quadUnitError}>mins left</Text>
              </View>
            </View>
          </View>

          {/* Active Candidates Mini-List */}
          <View style={styles.candidatesQueue}>
            <Text style={styles.queueTitle}>CANDIDATE QUEUE</Text>
            {notif.candidates.map((cand, idx) => (
              <View key={idx} style={styles.candidateRow}>
                <View style={styles.candidateLeft}>
                  <View
                    style={[
                      styles.candidateDot,
                      { backgroundColor: cand.statusColor },
                    ]}
                  />
                  <Text style={styles.candidateName}>{cand.name}</Text>
                </View>
                <Text style={styles.candidateDistance}>{cand.distance}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 5. Notification Diagnostic Meta */}
        <View style={styles.diagnosticBanner}>
          <View style={styles.diagnosticLeft}>
            <AppIcon name="terminal" size={20} />
            <Text style={styles.diagnosticRule}>
              Alert Rule: {notif.alertRule}
            </Text>
          </View>
          <Text style={styles.diagnosticEscalate}>
            Auto-escalate in {notif.autoEscalateTime}
          </Text>
        </View>

        {/* 6. Action Controls */}
        <View style={styles.actionControls}>
          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.primaryOrderBtn}
            onPress={handleViewOrder}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryOrderBtnText}>
              View Service Request
            </Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          {/* Secondary CTA: Mark as Read */}
          <TouchableOpacity
            style={styles.secondaryReadBtn}
            onPress={handleMarkAsRead}
            activeOpacity={0.75}
          >
            <AppIcon name="check_circle" size={20} />
            <Text style={styles.secondaryReadBtnText}>
              {isRead ? 'Mark as Unread' : 'Mark as Read'}
            </Text>
          </TouchableOpacity>

          {/* Tertiary CTA: Mute alerts */}
          <TouchableOpacity
            style={styles.tertiaryMuteBtn}
            onPress={handleMuteAlerts}
            activeOpacity={0.7}
          >
            <AppIcon name="notifications_off" size={20} />
            <Text style={styles.muteBtnText}>
              {isMuted
                ? 'Muted for 60m (Tap to undo)'
                : 'Mute Similar Unassigned Alerts (1 hr)'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Action Toast Banner */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <AppIcon name={toastIcon} size={20} />
          <Text style={styles.toastMsgText}>{toastMessage}</Text>
          <TouchableOpacity onPress={() => setToastMessage(null)}>
            <Text style={styles.toastDismissText}>DISMISS</Text>
          </TouchableOpacity>
        </View>
      )}
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
    gap: 14,
  },
  scrollContentDesktop: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  /* 1. Header Card */
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  ambientCorner: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 218, 214, 0.4)',
  },
  statusMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrenchIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrenchIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffdad6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  priorityPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  readStatePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  readStatePillUnread: {
    backgroundColor: '#dbe1ff',
  },
  readStatePillRead: {
    backgroundColor: '#e6e8ea',
  },
  readStatePillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
  },
  readStatePillTextUnread: {
    color: '#003ea8',
  },
  readStatePillTextRead: {
    color: '#45464d',
  },
  timeAgoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#76777d',
    includeFontPadding: false,
  },
  timeAgoText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },

  /* Headline Block */
  headlineBlock: {
    gap: 4,
  },
  headlineTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  caseIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  sensorsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  caseIdText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
  },
  narrativeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464d',
    lineHeight: 19,
  },
  narrativeRefText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#191c1e',
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  narrativeHighlight: {
    fontFamily: 'Inter-SemiBold',
    color: '#ba1a1a',
    fontWeight: '600',
  },

  /* Progress Section */
  progressSection: {
    gap: 6,
    paddingTop: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  radarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  progressAttemptText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  slaElapsedText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eceef0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0051d5',
    borderRadius: 3,
  },

  /* 2. Related Dossier Card */
  dossierCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  dossierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dossierHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  dossierTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
  },
  orderRefBadge: {
    backgroundColor: 'rgba(219, 225, 255, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  orderRefText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
  },

  /* Chair Asset Profile */
  chairAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f2f4f6',
  },
  chairImgWrapper: {
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eceef0',
  },
  chairImg: {
    width: '100%',
    height: '100%',
  },
  chairInfoGroup: {
    flex: 1,
  },
  chairVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chairVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#0051d5',
    includeFontPadding: false,
  },
  chairModelName: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#0051d5',
  },
  chairServiceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
    marginTop: 1,
  },
  chairCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  chairCategoryIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#009668',
    includeFontPadding: false,
  },
  chairCategoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  chairValueGroup: {
    alignItems: 'flex-end',
  },
  valueLabel: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  valueAmount: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 17,
    fontWeight: '700',
    color: '#191c1e',
  },

  /* Specs Grid */
  specsGrid: {
    gap: 8,
  },
  specCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  clientProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  clientInfoText: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  tierPill: {
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tierPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#ffffff',
  },
  clientAccount: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  callClientBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  specCardLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  locIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  locIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  locInfo: {
    flex: 1,
  },
  specLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  locMainText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#191c1e',
    marginTop: 1,
  },
  locSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  specCardSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  slotMainText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#191c1e',
  },
  unassignedSlaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 218, 214, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  slaWarningIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  unassignedSlaText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },

  /* 3. Recommended Action Card */
  recommendedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  recommendedLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#316bf3',
  },
  recommendedContentRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  lightbulbBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightbulbIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#00174b',
    includeFontPadding: false,
  },
  recommendedBody: {
    flex: 1,
    gap: 6,
  },
  recommendedEyebrow: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
    letterSpacing: 0.5,
  },
  recommendedHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  recommendedDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    lineHeight: 18,
  },
  boldTech: {
    fontFamily: 'Inter-SemiBold',
    color: '#191c1e',
    fontWeight: '600',
  },
  distanceHighlight: {
    fontFamily: 'Inter-SemiBold',
    color: '#0051d5',
    fontWeight: '600',
  },
  suggestedTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 8,
    marginTop: 4,
  },
  suggestedTechLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestedTechAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedTechAvatarText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#191c1e',
  },
  suggestedTechName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readyGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4edea3',
  },
  readyText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#009668',
  },
  quickAssignBtn: {
    backgroundColor: '#0051d5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    ...Shadows.level1,
  },
  quickAssignBtnDispatched: {
    backgroundColor: '#eceef0',
  },
  quickAssignIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
  },
  quickAssignText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  /* 4. Dispatch Telemetry Snapshot */
  telemetryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  telemetryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetryHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  telemetryCardTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  liveSensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveSensorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4edea3',
  },
  liveSensorText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  miniMapBanner: {
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#eceef0',
  },
  miniMapImage: {
    width: '100%',
    height: '100%',
  },
  miniMapOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  mapTargetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mapPinIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ba1a1a',
    includeFontPadding: false,
  },
  mapTargetText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#191c1e',
  },
  mapRadiusText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#0051d5',
  },

  /* Metric Quad Grid */
  quadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quadItem: {
    width: '48.8%',
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 10,
    gap: 2,
  },
  quadLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  quadLabelError: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#ba1a1a',
    textTransform: 'uppercase',
  },
  quadValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  quadValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
  },
  quadValueBlue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#0051d5',
  },
  quadValueError: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  quadUnit: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  quadUnitError: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#ba1a1a',
  },

  /* Candidate Queue */
  candidatesQueue: {
    gap: 6,
    paddingTop: 4,
  },
  queueTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  candidateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  candidateName: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  candidateDistance: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },

  /* 5. Diagnostic Banner */
  diagnosticBanner: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  terminalIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  diagnosticRule: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  diagnosticEscalate: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
  },

  /* 6. Action Controls */
  actionControls: {
    gap: 8,
    paddingTop: 4,
  },
  primaryOrderBtn: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryOrderBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryOrderBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  secondaryReadBtn: {
    backgroundColor: '#eceef0',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryReadIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  secondaryReadBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  tertiaryMuteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  muteIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
  },
  muteBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#76777d',
  },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 100,
    ...Shadows.level3,
  },
  toastIconFont: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#4edea3',
    includeFontPadding: false,
  },
  toastMsgText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
  toastDismissText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#6ffbbe',
    letterSpacing: 0.5,
  },
});
