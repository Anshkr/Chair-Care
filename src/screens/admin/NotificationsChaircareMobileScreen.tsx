import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

export type NotificationCategory =
  | 'all'
  | 'unread'
  | 'critical'
  | 'system'
  | 'operations';

export interface NotificationItem {
  id: string;
  category: 'critical' | 'operations' | 'system' | 'finance';
  isUnread: boolean;
  priorityLabel?: string;
  timeAgo: string;
  title: string;
  message: string;
  iconName: string;
  iconBgColor: string;
  iconColor: string;
  leftStripeColor: string;
  chipIcon: string;
  chipText: string;
  actionLabel: string;
  targetScreen?: string;
  targetParams?: any;
  hasQuickDispatch?: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    category: 'critical',
    isUnread: true,
    priorityLabel: 'High Priority',
    timeAgo: '10 min ago',
    title: 'Unassigned Service Request',
    message:
      'Request CR-10482 has been waiting for technician assignment for 18 minutes.',
    iconName: 'build_circle',
    iconBgColor: '#ffdad6',
    iconColor: '#93000a',
    leftStripeColor: '#ba1a1a',
    chipIcon: 'chair',
    chipText: 'Herman Miller Aeron • Sec 54 Gurugram',
    actionLabel: 'Assign',
    targetScreen: 'ServiceRequests',
    hasQuickDispatch: true,
  },
  {
    id: 'notif-02',
    category: 'critical',
    isUnread: true,
    priorityLabel: 'Finance',
    timeAgo: '32 min ago',
    title: 'Payment Dispute Opened',
    message:
      'A customer has reported a payment issue for transaction TXN-84291.',
    iconName: 'account_balance_wallet',
    iconBgColor: '#dbe1ff',
    iconColor: '#00174b',
    leftStripeColor: '#0051d5',
    chipIcon: 'currency_rupee',
    chipText: '1,850 • R. Mehta vs R. Sharma',
    actionLabel: 'Escrow',
    targetScreen: 'Disputes',
  },
  {
    id: 'notif-03',
    category: 'operations',
    isUnread: true,
    priorityLabel: 'Verification',
    timeAgo: '1 hr ago',
    title: 'Technician Dossier Pending',
    message:
      'New candidate technician requires BIFMA ANSI/X5.1 credential audit.',
    iconName: 'verified_user',
    iconBgColor: '#e0e3e5',
    iconColor: '#191c1e',
    leftStripeColor: '#565e74',
    chipIcon: 'badge',
    chipText: 'Vikram Singh • CyberCity Hub',
    actionLabel: 'Dossier',
    targetScreen: 'Technicians',
  },
  {
    id: 'notif-04',
    category: 'system',
    isUnread: false,
    priorityLabel: 'System',
    timeAgo: '2 hrs ago',
    title: 'Latency Spike Telemetry',
    message:
      'Webhook delivery latency jumped (+240ms) via Razorpay event bridge.',
    iconName: 'monitor_heart',
    iconBgColor: '#eceef0',
    iconColor: '#45464d',
    leftStripeColor: 'transparent',
    chipIcon: 'hub',
    chipText: 'Node BLR-01 • SLA 98.4%',
    actionLabel: 'Logs',
    targetScreen: 'ActivityLogs',
  },
  {
    id: 'notif-05',
    category: 'operations',
    isUnread: false,
    priorityLabel: 'Operations',
    timeAgo: '3 hrs ago',
    title: 'Technician Transit Delay',
    message:
      'Amit Kumar marked 14 min security check clearance delay at Cyber Hub Tower 4.',
    iconName: 'schedule',
    iconBgColor: '#eceef0',
    iconColor: '#45464d',
    leftStripeColor: 'transparent',
    chipIcon: 'alt_route',
    chipText: 'CC-10475 • Escort Req',
    actionLabel: 'Track',
    targetScreen: 'LiveOperationsOverview',
  },
];

interface NotificationsScreenProps {
  navigation?: any;
}

export const NotificationsChaircareMobileScreen: React.FC<
  NotificationsScreenProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Pulse animations
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

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] =
    useState<NotificationCategory>('all');
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Dispatch Quick Action Modal state
  const [dispatchModalVisible, setDispatchModalVisible] =
    useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] =
    useState<NotificationItem | null>(null);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Computed metrics
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.isUnread).length,
    [notifications]
  );
  const criticalCount = useMemo(
    () => notifications.filter((n) => n.category === 'critical').length,
    [notifications]
  );
  const systemCount = useMemo(
    () => notifications.filter((n) => n.category === 'system').length,
    [notifications]
  );
  const operationsCount = useMemo(
    () => notifications.filter((n) => n.category === 'operations').length,
    [notifications]
  );
  const totalCount = notifications.length;

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Category filter
      if (activeFilter === 'unread' && !item.isUnread) return false;
      if (activeFilter === 'critical' && item.category !== 'critical')
        return false;
      if (activeFilter === 'system' && item.category !== 'system') return false;
      if (activeFilter === 'operations' && item.category !== 'operations')
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMessage = item.message.toLowerCase().includes(q);
        const matchesChip = item.chipText.toLowerCase().includes(q);
        return matchesTitle || matchesMessage || matchesChip;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isUnread: false }))
    );
    triggerToast('All notifications marked as read');
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark clicked item as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
    );

    if (item.hasQuickDispatch) {
      setSelectedIncident(item);
      setDispatchModalVisible(true);
    } else if (item.targetScreen && navigation) {
      navigation.navigate(item.targetScreen, item.targetParams || {});
    }
  };

  const handleDeployTech = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setDispatchModalVisible(false);
      triggerToast('Autonomous dispatch routed to nearest certified tech (2.1km)');
    }, 800);
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={{ padding: 6, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('AdminMain');
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="ArrowLeft" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerEyebrow}>Platform Broadcasts</Text>
            <Text style={styles.headerTitleText} numberOfLines={1}>
              Notifications
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setIsSearchOpen(!isSearchOpen)}
            activeOpacity={0.7}
            accessibilityLabel="Search"
          >
            <AppIcon name="search" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {
              // Cycle or toggle active filter
              setActiveFilter((prev) => (prev === 'all' ? 'unread' : 'all'));
            }}
            activeOpacity={0.7}
            accessibilityLabel="Filter notifications"
          >
            <AppIcon name="tune" size={20} />
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <View style={styles.searchBarContainer}>
          <AppIcon name="search" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications, requests, alerts..."
            placeholderTextColor="#76777d"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="cancel" size={20} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Governance Live Stream Ribbon */}
        <View style={styles.telemetryRibbon}>
          <View style={styles.telemetryLeft}>
            <Animated.View
              style={[styles.telemetryPulseDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.telemetryText} numberOfLines={1}>
              OPERATIONS TELEMETRY • LIVE BROKER ACTIVE
            </Text>
          </View>
          <Text style={styles.telemetrySyncText}>99.98% sync</Text>
        </View>

        {/* 3. Screen Context & Sub-actions Bar */}
        <View style={styles.feedHeaderRow}>
          <View>
            <Text style={styles.feedTitle}>Console Feed</Text>
            <Text style={styles.feedSubtitle}>
              Monitor important platform alerts and system events
            </Text>
          </View>
          <View style={styles.feedActionButtons}>
            <TouchableOpacity
              style={styles.feedActionBtn}
              onPress={() => triggerToast('Notification settings opened')}
              activeOpacity={0.7}
              accessibilityLabel="Alert settings"
            >
              <AppIcon name="settings" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedActionBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}
              accessibilityLabel="Mark all read"
            >
              <AppIcon name="done_all" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. 2x2 Bento Metric Surface */}
        <View style={styles.bentoGrid}>
          {/* KPI 1: Unread */}
          <TouchableOpacity
            style={[
              styles.bentoCard,
              activeFilter === 'unread' && styles.bentoCardActive,
            ]}
            onPress={() => setActiveFilter('unread')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoCardHeader}>
              <Text style={styles.bentoLabel}>UNREAD</Text>
              <View style={styles.bentoIconBadge}>
                <View style={styles.unreadPulseDot} />
                <AppIcon name="mark_email_unread" size={20} />
              </View>
            </View>
            <View style={styles.bentoValueRow}>
              <Text style={styles.bentoValue}>{unreadCount}</Text>
              <Text style={styles.bentoSubtextSecondary}>Requires action</Text>
            </View>
          </TouchableOpacity>

          {/* KPI 2: Critical */}
          <TouchableOpacity
            style={[
              styles.bentoCard,
              activeFilter === 'critical' && styles.bentoCardActive,
            ]}
            onPress={() => setActiveFilter('critical')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoCardHeader}>
              <Text style={styles.bentoLabel}>CRITICAL</Text>
              <View style={styles.bentoIconFireBox}>
                <AppIcon name="local_fire_department" size={20} />
              </View>
            </View>
            <View style={styles.bentoValueRow}>
              <Text style={styles.bentoValueError}>{criticalCount}</Text>
              <Text style={styles.bentoSubtextError}>Escalated</Text>
            </View>
          </TouchableOpacity>

          {/* KPI 3: Gateways */}
          <TouchableOpacity
            style={[
              styles.bentoCard,
              activeFilter === 'system' && styles.bentoCardActive,
            ]}
            onPress={() => setActiveFilter('system')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoCardHeader}>
              <Text style={styles.bentoLabel}>GATEWAYS</Text>
              <View style={styles.bentoIconDnsBox}>
                <AppIcon name="dns" size={20} />
              </View>
            </View>
            <View style={styles.bentoValueRow}>
              <Text style={styles.bentoValue}>5</Text>
              <Text style={styles.bentoSubtextNeutral}>Infra active</Text>
            </View>
          </TouchableOpacity>

          {/* KPI 4: Today Total */}
          <TouchableOpacity
            style={[
              styles.bentoCard,
              activeFilter === 'all' && styles.bentoCardActive,
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}
          >
            <View style={styles.bentoCardHeader}>
              <Text style={styles.bentoLabel}>TODAY</Text>
              <View style={styles.bentoIconCalBox}>
                <AppIcon name="calendar_today" size={20} />
              </View>
            </View>
            <View style={styles.bentoValueRow}>
              <Text style={styles.bentoValue}>{totalCount}</Text>
              <Text style={styles.bentoSubtextNeutral}>Total events</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. Interactive Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterPillsScroll}
          contentContainerStyle={styles.filterPillsContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'unread' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('unread')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'unread' && styles.filterPillTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
            <View style={styles.activePillDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'critical' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('critical')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'critical' && styles.filterPillTextActive,
              ]}
            >
              Alerts ({criticalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'system' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('system')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'system' && styles.filterPillTextActive,
              ]}
            >
              System ({systemCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === 'operations' && styles.filterPillActive,
            ]}
            onPress={() => setActiveFilter('operations')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterPillText,
                activeFilter === 'operations' && styles.filterPillTextActive,
              ]}
            >
              Operations ({operationsCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* 6. Ergonomic Notification Cards Stream */}
        <View style={styles.streamContainer}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppIcon name="notifications_off" size={20} />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtext}>
                No notifications matching current filter criteria.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  !item.isUnread && styles.notificationCardRead,
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.9}
              >
                {/* Left accent stripe */}
                {item.leftStripeColor !== 'transparent' && (
                  <View
                    style={[
                      styles.cardLeftStripe,
                      { backgroundColor: item.leftStripeColor },
                    ]}
                  />
                )}

                <View style={styles.cardContentRow}>
                  {/* Category icon box */}
                  <View
                    style={[
                      styles.cardIconBox,
                      { backgroundColor: item.iconBgColor },
                    ]}
                  >
                    <AppIcon name={item.iconName} size={20} />
                  </View>

                  {/* Main text content */}
                  <View style={styles.cardMainText}>
                    <View style={styles.cardHeaderMetaRow}>
                      <View style={styles.cardBadgeRow}>
                        {item.isUnread && (
                          <View style={styles.cardUnreadDot} />
                        )}
                        {item.priorityLabel && (
                          <View
                            style={[
                              styles.priorityBadge,
                              item.category === 'critical'
                                ? styles.priorityBadgeCritical
                                : item.priorityLabel === 'Finance'
                                ? styles.priorityBadgeFinance
                                : styles.priorityBadgeNeutral,
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityBadgeText,
                                item.category === 'critical'
                                  ? styles.priorityBadgeTextCritical
                                  : item.priorityLabel === 'Finance'
                                  ? styles.priorityBadgeTextFinance
                                  : styles.priorityBadgeTextNeutral,
                              ]}
                            >
                              {item.priorityLabel}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.cardTimeAgo}>{item.timeAgo}</Text>
                    </View>

                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardMessage}>{item.message}</Text>

                    {/* Bottom detail chip & action */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.cardDetailChip}>
                        <AppIcon name={item.chipIcon} size={20} />
                        <Text style={styles.chipText} numberOfLines={1}>
                          {item.chipText}
                        </Text>
                      </View>

                      <View style={styles.actionLinkRow}>
                        <Text style={styles.actionLinkLabel}>
                          {item.actionLabel}
                        </Text>
                        <Text style={styles.actionLinkArrow}>
                          arrow_forward
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* 7. Floating Fast-Broadcast Control Surface */}
      <View style={[styles.floatingBroadcastWrapper, { pointerEvents: 'box-none' }]}>
        <TouchableOpacity
          style={styles.floatingBroadcastBtn}
          onPress={() => {
            if (navigation) {
              navigation.navigate('CreateNotification');
            }
          }}
          activeOpacity={0.88}
        >
          <AppIcon name="campaign" size={20} />
          <Text style={styles.broadcastText}>
            Create Broadcast Notification
          </Text>
        </TouchableOpacity>
      </View>

      {/* 8. Priority Incident Dispatch Protocol Quick Action Modal */}
      <Modal
        visible={dispatchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDispatchModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalDragPill} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalEyebrow}>
                  PRIORITY INCIDENT RESPONSE
                </Text>
                <Text style={styles.modalTitle}>Dispatch Protocol</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDispatchModalVisible(false)}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Direct technician auto-assignment algorithm can route the
              closest certified technician within 2.4km radius.
            </Text>

            {/* SLA Progress Bar */}
            <View style={styles.slaCard}>
              <View style={styles.slaHeaderRow}>
                <Text style={styles.slaLabel}>Target Dispatch SLA:</Text>
                <Text style={styles.slaTimeRemaining}>
                  12m 40s remaining
                </Text>
              </View>
              <View style={styles.slaTrack}>
                <View style={styles.slaFill} />
              </View>
            </View>

            {/* Action Buttons Grid */}
            <View style={styles.modalButtonsGrid}>
              <TouchableOpacity
                style={styles.deferBtn}
                onPress={() => setDispatchModalVisible(false)}
                activeOpacity={0.7}
                disabled={isDeploying}
              >
                <Text style={styles.deferBtnText}>Defer Notice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deployBtn}
                onPress={handleDeployTech}
                activeOpacity={0.85}
                disabled={isDeploying}
              >
                <Text style={styles.deployBtnText}>
                  {isDeploying ? 'Routing Tech...' : 'Deploy Tech Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Feedback */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <AppIcon name="info" size={20} />
          <Text style={styles.toastText}>{toastMessage}</Text>
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
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
    zIndex: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerCampaignIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#000000',
    includeFontPadding: false,
  },
  headerPulseDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0051d5',
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerEyebrow: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
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

  /* Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    ...Shadows.level1,
  },
  searchInnerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#76777d',
    includeFontPadding: false,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    padding: 0,
  },
  searchClearIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#76777d',
    includeFontPadding: false,
  },

  /* Scroll Content */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  /* 2. Governance Live Stream Ribbon */
  telemetryRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131b2e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    ...Shadows.level1,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  telemetryPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  telemetryText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#6ffbbe',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  telemetrySyncText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: 'rgba(124, 131, 155, 0.9)',
  },

  /* 3. Screen Context Header */
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  feedSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    marginTop: 2,
  },
  feedActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#45464d',
    includeFontPadding: false,
  },

  /* 4. Bento Grid */
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bentoCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
    minHeight: 88,
    ...Shadows.level1,
  },
  bentoCardActive: {
    borderColor: '#0051d5',
    borderWidth: 1.5,
  },
  bentoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#45464d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bentoIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  unreadPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  bentoIconSecondary: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  bentoIconFireBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIconFire: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#93000a',
    includeFontPadding: false,
  },
  bentoIconDnsBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIconDns: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
    includeFontPadding: false,
  },
  bentoIconCalBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIconCal: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  bentoValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  bentoValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#191c1e',
  },
  bentoValueError: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  bentoSubtextSecondary: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  bentoSubtextError: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#ba1a1a',
  },
  bentoSubtextNeutral: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
  },

  /* 5. Filter Pills */
  filterPillsScroll: {
    marginHorizontal: -16,
  },
  filterPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#eceef0',
  },
  filterPillActive: {
    backgroundColor: '#0051d5',
    ...Shadows.level1,
  },
  filterPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#45464d',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },

  /* 6. Notification Stream */
  streamContainer: {
    gap: 10,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  notificationCardRead: {
    backgroundColor: '#fbfcfd',
    opacity: 0.92,
  },
  cardLeftStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardContentRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    includeFontPadding: false,
  },
  cardMainText: {
    flex: 1,
  },
  cardHeaderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardUnreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#0051d5',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityBadgeCritical: {
    backgroundColor: '#ba1a1a',
  },
  priorityBadgeFinance: {
    backgroundColor: '#316bf3',
  },
  priorityBadgeNeutral: {
    backgroundColor: '#e0e3e5',
  },
  priorityBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  priorityBadgeTextCritical: {
    color: '#ffffff',
  },
  priorityBadgeTextFinance: {
    color: '#ffffff',
  },
  priorityBadgeTextNeutral: {
    color: '#191c1e',
  },
  cardTimeAgo: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
    marginTop: 1,
  },
  cardMessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    lineHeight: 18,
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardDetailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '72%',
  },
  chipIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#76777d',
    includeFontPadding: false,
  },
  chipText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#191c1e',
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLinkLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },
  actionLinkArrow: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 48,
    color: '#cbd5e1',
    includeFontPadding: false,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#76777d',
    textAlign: 'center',
  },

  /* 7. Floating Fast Broadcast */
  floatingBroadcastWrapper: {
    position: 'absolute',
    bottom: 84,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 35,
  },
  floatingBroadcastBtn: {
    backgroundColor: '#000000',
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level3,
  },
  broadcastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#dbe1ff',
    includeFontPadding: false,
  },
  broadcastText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  /* 8. Dispatch Quick Action Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 49, 51, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
    ...Shadows.level3,
  },
  modalDragPill: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e3e5',
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalEyebrow: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#191c1e',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  modalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#45464d',
    lineHeight: 19,
  },
  slaCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  slaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slaLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
  },
  slaTimeRemaining: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#0051d5',
  },
  slaTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e3e5',
    overflow: 'hidden',
  },
  slaFill: {
    width: '65%',
    height: '65%',
    backgroundColor: '#0051d5',
    borderRadius: 3,
  },
  modalButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  deferBtn: {
    flex: 1,
    backgroundColor: '#eceef0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deferBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  deployBtn: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deployBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  /* 9. Bottom Navigation Bar */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    zIndex: 30,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    flex: 1,
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
    flex: 1,
  },
  navIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#76777d',
    includeFontPadding: false,
  },
  navLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  navActiveIconContainer: {
    position: 'relative',
  },
  navIconActive: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#0051d5',
    includeFontPadding: false,
  },
  navPulseDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  navLabelActive: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#0051d5',
  },

  /* Toast */
  toastContainer: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: '#131b2e',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
    ...Shadows.level3,
  },
  toastIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#6ffbbe',
    includeFontPadding: false,
  },
  toastText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
});
