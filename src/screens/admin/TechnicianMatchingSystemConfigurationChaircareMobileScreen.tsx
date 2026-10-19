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

interface PriorityItem {
  id: string;
  title: string;
  subtitle: string;
}

interface ServiceHealthItem {
  id: string;
  title: string;
  status: string;
  latencyText: string;
  uptime: string;
  node: string;
}

interface TechnicianMatchingProps {
  navigation?: any;
}

const INITIAL_PRIORITIES: PriorityItem[] = [
  {
    id: 'p1',
    title: 'Service Expertise & Certification',
    subtitle: 'Class-4 gas-lift, Herman Miller authorized',
  },
  {
    id: 'p2',
    title: 'Availability & Shift Timing',
    subtitle: 'Immediate on-call vs scheduled routes',
  },
  {
    id: 'p3',
    title: 'Distance & Transit Geofence',
    subtitle: 'Shortest road transit ETA in minutes',
  },
  {
    id: 'p4',
    title: 'Customer Rating & Fleet SLA',
    subtitle: 'Historical 4.8+ ergonomic diagnostic rating',
  },
];

const HEALTH_SERVICES: ServiceHealthItem[] = [
  {
    id: 'srv-api',
    title: 'API Services',
    status: 'Healthy',
    latencyText: 'Latency: 28ms • Checked 1m ago',
    uptime: '99.99%',
    node: 'api-cluster-ap-south-1',
  },
  {
    id: 'srv-pay',
    title: 'Payment Gateway',
    status: 'Healthy',
    latencyText: 'Webhook 99.98% • 2m ago',
    uptime: '99.98%',
    node: 'rzp-webhook-worker-02',
  },
  {
    id: 'srv-notif',
    title: 'Notifications Engine',
    status: 'Healthy',
    latencyText: 'FCM & APNs Active • 1m ago',
    uptime: '100.0%',
    node: 'fcm-push-daemon-01',
  },
  {
    id: 'srv-match',
    title: 'Matching Engine',
    status: 'Healthy',
    latencyText: 'Radar Worker Active • 30s ago',
    uptime: '99.99%',
    node: 'geo-radar-worker-m1',
  },
  {
    id: 'srv-db',
    title: 'Database Cluster',
    status: 'Healthy',
    latencyText: 'Postgres Multi-AZ Synced • 1m ago',
    uptime: '99.995%',
    node: 'aurora-pg-primary-az1',
  },
];

export const TechnicianMatchingSystemConfigurationChaircareMobileScreen: React.FC<
  TechnicianMatchingProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Pulse animation for live sync header
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Section 1: Automated Dispatch Engine Toggles State
  const [autoMatching, setAutoMatching] = useState<boolean>(true);
  const [matchByDistance, setMatchByDistance] = useState<boolean>(true);
  const [matchByExpertise, setMatchByExpertise] = useState<boolean>(true);
  const [matchByAvailability, setMatchByAvailability] = useState<boolean>(true);

  // Section 2: Priority List State
  const [priorities, setPriorities] = useState<PriorityItem[]>(INITIAL_PRIORITIES);

  // Section 3: Assignment Rules & SLA Thresholds State
  const [matchingRadius, setMatchingRadius] = useState<number>(10);
  const [assignmentAttempts, setAssignmentAttempts] = useState<number>(5);
  const [responseTimeout, setResponseTimeout] = useState<number>(5);

  // Section 5: Engine Pause / Emergency State
  const [isEnginePaused, setIsEnginePaused] = useState<boolean>(false);
  const [showPauseModal, setShowPauseModal] = useState<boolean>(false);

  // Health Detail Modal
  const [selectedHealthItem, setSelectedHealthItem] = useState<ServiceHealthItem | null>(null);

  // Toast Notification State
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
    }, 2400);
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= priorities.length) return;

    const newPriorities = [...priorities];
    const [movedItem] = newPriorities.splice(index, 1);
    newPriorities.splice(targetIndex, 0, movedItem);
    setPriorities(newPriorities);
    displayToast(`Priority order updated: #${targetIndex + 1} ${movedItem.title}`);
  };

  const handleAdjustRadius = (delta: number) => {
    const nextVal = Math.max(2, Math.min(30, matchingRadius + delta));
    setMatchingRadius(nextVal);
  };

  const handleAdjustAttempts = (delta: number) => {
    const nextVal = Math.max(1, Math.min(10, assignmentAttempts + delta));
    setAssignmentAttempts(nextVal);
  };

  const handleAdjustTimeout = (delta: number) => {
    const nextVal = Math.max(1, Math.min(15, responseTimeout + delta));
    setResponseTimeout(nextVal);
  };

  const handleConfirmPauseToggle = () => {
    setShowPauseModal(false);
    const nextPaused = !isEnginePaused;
    setIsEnginePaused(nextPaused);
    if (nextPaused) {
      displayToast('Technician dispatch engine paused. Emergency queue active.');
    } else {
      displayToast('Technician dispatch engine resumed successfully.');
    }
  };

  const handleSaveParams = () => {
    displayToast('System configuration and algorithm parameters saved.');
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
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Technician Matching Configuration
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => displayToast('Matching telemetry diagnostics')}
            accessibilityLabel="More actions"
          >
            <AppIcon name="more_vert" size={20} />
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
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Overview Pill Header */}
        <View style={styles.statusPillHeader}>
          <View style={styles.statusPillLeft}>
            <View style={styles.pingDotContainer}>
              <Animated.View
                style={[
                  styles.pingDotOuter,
                  {
                    opacity: pulseAnim,
                    backgroundColor: isEnginePaused ? '#ffdad6' : '#4edea3',
                  },
                ]}
              />
              <View
                style={[
                  styles.pingDotInner,
                  {
                    backgroundColor: isEnginePaused ? '#ba1a1a' : '#009668',
                  },
                ]}
              />
            </View>
            <Text style={styles.statusPillText}>
              {isEnginePaused
                ? 'FLEET DISPATCH • PAUSED / MANUAL'
                : 'FLEET DISPATCH V4.8 • ONLINE'}
            </Text>
          </View>
          <View
            style={[
              styles.syncStatusBadge,
              isEnginePaused && styles.syncStatusBadgePaused,
            ]}
          >
            <Text
              style={[
                styles.syncStatusBadgeText,
                isEnginePaused && styles.syncStatusBadgeTextPaused,
              ]}
            >
              {isEnginePaused ? 'Manual Triage' : 'Engine Syncing'}
            </Text>
          </View>
        </View>

        {/* Section 1: Automated Dispatch Engine Controls */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <AppIcon name="tune" size={20} />
              <Text style={styles.sectionTitle}>
                Automated Dispatch Engine
              </Text>
            </View>
            <Text style={styles.sectionTag}>MOD_01</Text>
          </View>

          <View style={styles.cardContainer}>
            {/* Toggle Item 1: Automatic Matching */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>
                  Automatic Technician Matching
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Core autonomous telemetry router
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  autoMatching ? styles.toggleTrackActive : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !autoMatching;
                  setAutoMatching(nextVal);
                  displayToast(
                    nextVal
                      ? 'Automatic matching enabled'
                      : 'Automatic matching switched to manual'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: autoMatching }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    autoMatching ? styles.toggleThumbActive : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowDivider} />

            {/* Toggle Item 2: Match by Distance */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>Match by Distance</Text>
                <Text style={styles.toggleSubtitle}>
                  Proximity-weighted geodesic routing
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  matchByDistance
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !matchByDistance;
                  setMatchByDistance(nextVal);
                  displayToast(
                    nextVal
                      ? 'Distance weighting enabled'
                      : 'Distance weighting disabled'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: matchByDistance }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    matchByDistance
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowDivider} />

            {/* Toggle Item 3: Match by Expertise */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>
                  Match by Service Expertise
                </Text>
                <Text style={styles.toggleSubtitle}>
                  BIFMA & Class-4 gas-lift verification
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  matchByExpertise
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !matchByExpertise;
                  setMatchByExpertise(nextVal);
                  displayToast(
                    nextVal
                      ? 'Expertise matching verified'
                      : 'Expertise matching relaxed'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: matchByExpertise }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    matchByExpertise
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowDivider} />

            {/* Toggle Item 4: Match by Availability & Workload */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>
                  Match by Availability & Workload
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Prevents technician queue overflow
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  matchByAvailability
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !matchByAvailability;
                  setMatchByAvailability(nextVal);
                  displayToast(
                    nextVal
                      ? 'Workload throttling active'
                      : 'Workload throttling bypassed'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: matchByAvailability }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    matchByAvailability
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 2: Matching Priority Order */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <AppIcon name="low_priority" size={20} />
              <Text style={styles.sectionTitle}>Matching Priority Order</Text>
            </View>
            <Text style={styles.sectionTag}>WEIGHT_STACK</Text>
          </View>
          <Text style={styles.sectionDescriptionText}>
            Tap sort arrows to re-prioritize matching weighting rules.
          </Text>

          <View style={styles.priorityStack}>
            {priorities.map((item, index) => {
              const isTop = index === 0;
              return (
                <View key={item.id} style={styles.priorityCard}>
                  <View style={styles.priorityCardLeft}>
                    <View
                      style={[
                        styles.priorityRankBadge,
                        isTop
                          ? styles.priorityRankBadgeTop
                          : styles.priorityRankBadgeNormal,
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityRankText,
                          isTop
                            ? styles.priorityRankTextTop
                            : styles.priorityRankTextNormal,
                        ]}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.priorityDetails}>
                      <Text style={styles.priorityTitle}>{item.title}</Text>
                      <Text style={styles.prioritySubtitle}>
                        {item.subtitle}
                      </Text>
                    </View>
                  </View>

                  {/* Reorder Action Controls */}
                  <View style={styles.priorityControls}>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => movePriority(index, 'up')}
                        activeOpacity={0.7}
                        accessibilityLabel="Move up"
                      >
                        <AppIcon name="arrow_upward" size={20} />
                      </TouchableOpacity>
                    )}
                    {index < priorities.length - 1 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => movePriority(index, 'down')}
                        activeOpacity={0.7}
                        accessibilityLabel="Move down"
                      >
                        <AppIcon name="arrow_downward" size={20} />
                      </TouchableOpacity>
                    )}
                    <View style={styles.dragIndicatorBox}>
                      <AppIcon name="drag_indicator" size={20} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Section 3: Assignment Rules & SLA Thresholds */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <AppIcon name="speed" size={20} />
              <Text style={styles.sectionTitle}>
                Assignment Rules & SLA
              </Text>
            </View>
            <Text style={styles.sectionTag}>POLICY_DEF</Text>
          </View>

          <View style={styles.cardContainer}>
            {/* Radius Control */}
            <View style={styles.slaControlGroup}>
              <View style={styles.slaHeaderRow}>
                <Text style={styles.slaLabel}>Maximum Matching Radius</Text>
                <View style={styles.slaValueBadge}>
                  <Text style={styles.slaValueBadgeText}>
                    {matchingRadius} km
                  </Text>
                </View>
              </View>

              {/* Quick Preset Pills */}
              <View style={styles.radiusPillsRow}>
                {[2, 5, 10, 15, 20, 30].map((r) => {
                  const isSelected = matchingRadius === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.radiusPill,
                        isSelected && styles.radiusPillActive,
                      ]}
                      onPress={() => {
                        setMatchingRadius(r);
                        displayToast(`Matching radius set to ${r} km`);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.radiusPillText,
                          isSelected && styles.radiusPillTextActive,
                        ]}
                      >
                        {r}km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.rangeLabelsRow}>
                <Text style={styles.rangeSubtext}>2 km (Dense Urban)</Text>
                <Text style={styles.rangeSubtext}>30 km (Metro Area)</Text>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Stepper 1: Maximum Assignment Attempts */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperTextGroup}>
                <Text style={styles.slaLabel}>
                  Maximum Assignment Attempts
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Auto-escalates to Super Admin on failure
                </Text>
              </View>
              <View style={styles.stepperBox}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustAttempts(-1)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="remove" size={20} />
                </TouchableOpacity>
                <Text style={styles.stepperValueText}>
                  {assignmentAttempts}
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustAttempts(1)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="add" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.rowDivider} />

            {/* Stepper 2: Technician Response Timeout */}
            <View style={styles.stepperRow}>
              <View style={styles.stepperTextGroup}>
                <Text style={styles.slaLabel}>
                  Technician Response Timeout
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Auto-reassigns to next eligible candidate
                </Text>
              </View>
              <View style={styles.stepperBox}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustTimeout(-1)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="remove" size={20} />
                </TouchableOpacity>
                <Text style={styles.stepperValueText}>
                  {responseTimeout} min
                </Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => handleAdjustTimeout(1)}
                  activeOpacity={0.7}
                >
                  <AppIcon name="add" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Section 4: Real-Time Platform Microservices Health */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderTitleGroup}>
              <AppIcon name="monitor_heart" size={20} />
              <Text style={styles.sectionTitle}>
                Platform Microservices Health
              </Text>
            </View>
            <Text style={styles.sectionTag}>99.98% SLA</Text>
          </View>

          <View style={styles.healthCardContainer}>
            {HEALTH_SERVICES.map((srv) => (
              <View key={srv.id} style={styles.healthItemRow}>
                <View style={styles.healthItemLeft}>
                  <View style={styles.healthDot} />
                  <View style={styles.healthItemDetails}>
                    <View style={styles.healthItemHeadingRow}>
                      <Text style={styles.healthItemName}>{srv.title}</Text>
                      <View style={styles.healthyPill}>
                        <Text style={styles.healthyPillText}>
                          {srv.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.healthItemSubtext}>
                      {srv.latencyText}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.healthDetailsButton}
                  onPress={() => setSelectedHealthItem(srv)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.healthDetailsButtonText}>Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Section 5: Emergency Control (Danger Zone Card) */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.dangerZoneHeader}>
            <AppIcon name="warning" size={20} />
            <Text style={styles.dangerZoneTitle}>
              {isEnginePaused
                ? 'Resume Automated Service Matching'
                : 'Temporarily Pause Service Matching'}
            </Text>
          </View>

          <Text style={styles.dangerZoneDescription}>
            {isEnginePaused
              ? 'Re-enables autonomous radar worker and geodesic routing across active territory dispatch queues.'
              : 'Stops automatic technician matching without disabling existing active services. New requests will queue in Super Admin triage.'}
          </Text>

          <TouchableOpacity
            style={[
              styles.pauseEngineButton,
              isEnginePaused && styles.resumeEngineButton,
            ]}
            onPress={() => setShowPauseModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name={isEnginePaused ? 'play_circle' : 'pause_circle'} size={20} />
            <Text
              style={[
                styles.pauseEngineButtonText,
                isEnginePaused && styles.resumeEngineButtonText,
              ]}
            >
              {isEnginePaused ? 'Resume Matching Engine' : 'Pause Matching Engine'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Realtime Confirmation Toast Container */}
      {toastVisible && (
        <View
          style={[
            styles.toastContainer,
            { bottom: Math.max(insets.bottom, 20) + 75 },
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
            style={styles.saveParamsButton}
            onPress={handleSaveParams}
            activeOpacity={0.85}
          >
            <AppIcon name="check" size={20} />
            <Text style={styles.saveParamsText}>Save System Parameters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Health Item Detail Modal */}
      <Modal
        visible={selectedHealthItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedHealthItem(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedHealthItem(null)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedHealthItem?.title} Telemetry
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedHealthItem(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {selectedHealthItem && (
              <View style={styles.telemetryDetailsList}>
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Service Component</Text>
                  <Text style={styles.telemetryValue}>
                    {selectedHealthItem.node}
                  </Text>
                </View>
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Overall Uptime SLA</Text>
                  <Text style={styles.telemetryValueHighlight}>
                    {selectedHealthItem.uptime}
                  </Text>
                </View>
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Diagnostic Stream</Text>
                  <Text style={styles.telemetryValue}>
                    {selectedHealthItem.latencyText}
                  </Text>
                </View>
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Cluster Status</Text>
                  <View style={styles.healthyPill}>
                    <Text style={styles.healthyPillText}>Operational</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Pause Confirmation Modal */}
      <Modal
        visible={showPauseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPauseModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPauseModal(false)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEnginePaused
                  ? 'Confirm Engine Resume'
                  : 'Emergency Matching Confirmation'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPauseModal(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBodyText}>
              {isEnginePaused
                ? 'Are you ready to restore autonomous technician dispatching? Inbound tickets will immediately be geo-assigned according to priority weights.'
                : 'CRITICAL WARNING: Are you certain you want to pause automated technician dispatch? Incoming service requests will immediately accumulate in manual dispatch triage.'}
            </Text>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowPauseModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  isEnginePaused
                    ? styles.modalConfirmBtnResume
                    : styles.modalConfirmBtnPause,
                ]}
                onPress={handleConfirmPauseToggle}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmBtnText}>
                  {isEnginePaused ? 'Confirm Resume' : 'Confirm Pause'}
                </Text>
              </TouchableOpacity>
            </View>
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
  materialIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
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
    backgroundColor: '#bec6e0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#131b2e',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  /* Status Overview Pill Header */
  statusPillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eceef0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statusPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pingDotContainer: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDotOuter: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pingDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: '#45464d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  syncStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: '#dbe1ff',
  },
  syncStatusBadgePaused: {
    backgroundColor: '#ffdad6',
  },
  syncStatusBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#00174b',
  },
  syncStatusBadgeTextPaused: {
    color: '#ba1a1a',
  },

  /* Section Structure */
  sectionWrapper: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#191c1e',
  },
  sectionTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    textTransform: 'uppercase',
  },
  sectionDescriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#76777d',
    paddingHorizontal: 2,
  },

  /* Card General Styles */
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#f2f4f6',
  },

  /* Toggle Rows */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: '#191c1e',
  },
  toggleSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#76777d',
  },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: '#0051d5',
  },
  toggleTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },

  /* Priority Stack */
  priorityStack: {
    gap: 8,
  },
  priorityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  priorityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  priorityRankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityRankBadgeTop: {
    backgroundColor: '#131b2e',
  },
  priorityRankBadgeNormal: {
    backgroundColor: '#e6e8ea',
  },
  priorityRankText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
  },
  priorityRankTextTop: {
    color: '#ffffff',
  },
  priorityRankTextNormal: {
    color: '#191c1e',
  },
  priorityDetails: {
    flex: 1,
    gap: 2,
  },
  priorityTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 19,
    color: '#191c1e',
  },
  prioritySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: '#76777d',
  },
  priorityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
  },
  dragIndicatorBox: {
    padding: 4,
  },
  dragIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#76777d',
  },

  /* SLA Controls */
  slaControlGroup: {
    gap: 8,
  },
  slaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slaLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#191c1e',
  },
  slaValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#f2f4f6',
  },
  slaValueBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 12,
    color: '#191c1e',
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusPillActive: {
    backgroundColor: '#0051d5',
  },
  radiusPillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  radiusPillTextActive: {
    fontFamily: 'JetBrainsMono-SemiBold',
    color: '#ffffff',
  },
  rangeLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  rangeSubtext: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepperTextGroup: {
    flex: 1,
    gap: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f2f4f6',
    padding: 3,
    borderRadius: 8,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  stepperBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
  },
  stepperValueText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 12,
    color: '#191c1e',
    minWidth: 42,
    textAlign: 'center',
  },

  /* Microservices Health Section */
  healthCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  healthItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  healthItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#009668',
  },
  healthItemDetails: {
    flex: 1,
    gap: 2,
  },
  healthItemHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthItemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },
  healthyPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(111, 251, 190, 0.35)',
  },
  healthyPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#005236',
  },
  healthItemSubtext: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  healthDetailsButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f2f4f6',
  },
  healthDetailsButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#0051d5',
  },

  /* Danger Zone Card */
  dangerZoneCard: {
    backgroundColor: 'rgba(255, 218, 214, 0.45)',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.15)',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerZoneIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ba1a1a',
  },
  dangerZoneTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#ba1a1a',
    flex: 1,
  },
  dangerZoneDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#191c1e',
  },
  pauseEngineButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  resumeEngineButton: {
    backgroundColor: '#0051d5',
  },
  pauseEngineButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ba1a1a',
  },
  resumeEngineButtonIcon: {
    color: '#ffffff',
  },
  pauseEngineButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#ba1a1a',
  },
  resumeEngineButtonText: {
    color: '#ffffff',
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
  },
  saveParamsButton: {
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
  saveParamsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
  },
  saveParamsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.2,
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
  modalBodyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: '#45464d',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#191c1e',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnPause: {
    backgroundColor: '#ba1a1a',
  },
  modalConfirmBtnResume: {
    backgroundColor: '#0051d5',
  },
  modalConfirmBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },

  /* Telemetry Details */
  telemetryDetailsList: {
    gap: 12,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f7f9fb',
    borderRadius: 8,
  },
  telemetryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#45464d',
  },
  telemetryValue: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  telemetryValueHighlight: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 13,
    color: '#0051d5',
  },
});
