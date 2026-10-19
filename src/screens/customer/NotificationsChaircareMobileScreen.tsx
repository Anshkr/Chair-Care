import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { customerApi } from '../../services/api/customerApi';
import { notificationApi } from '../../services/api/notificationApi';
import { adminSyncEmitter } from '../../services/adminSync';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';

type FilterCategory = 'all' | 'service' | 'billing' | 'system';

interface NotificationItem {
  id: string;
  requestId?: string;
  category: 'service' | 'billing' | 'system';
  section: 'today' | 'yesterday';
  title: string;
  timeAgo: string;
  message: string;
  ticketNumber?: string;
  vehicleNumber?: string;
  isUnread: boolean;
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  badge?: string;
  etaNote?: string;
  actionType?: 'details' | 'track' | 'rate' | 'receipt';
  actionLabel?: string;
  subMeta?: string;
  stars?: number;
  warrantyPill?: string;
  timestamp?: number;
}

/**
 * Calculates exact timestamp, relative interval, and calendar section for notifications
 */
export const formatNotificationTimestamp = (
  dateInput?: string | Date | null
): {
  timeAgo: string;
  section: 'today' | 'yesterday';
  subMeta: string;
  timestamp: number;
} => {
  if (!dateInput) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    return {
      timeAgo: 'Just now',
      section: 'today',
      subMeta: `Today, ${timeStr}`,
      timestamp: Date.now(),
    };
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return {
      timeAgo: 'Recent',
      section: 'today',
      subMeta: '',
      timestamp: 0,
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  // Exact formatted clock time: e.g. "10:30 AM" or "4:15 PM"
  const exactTime = d.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Local calendar date boundaries
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const dTime = d.getTime();

  const isToday = dTime >= startOfToday;
  const isYesterday = dTime >= startOfYesterday && dTime < startOfToday;
  const section: 'today' | 'yesterday' = isToday ? 'today' : 'yesterday';

  const monthDay = d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  });

  // Concise, exact time tag for the top-right of the card
  let timeAgo = '';
  if (isToday) {
    if (diffSec < 60) {
      timeAgo = 'Just now';
    } else {
      timeAgo = exactTime;
    }
  } else if (isYesterday) {
    timeAgo = `Yesterday, ${exactTime}`;
  } else {
    timeAgo = `${monthDay}, ${exactTime}`;
  }

  // Exact context subtitle for bottom-left (relative + date)
  let subMeta = '';
  if (isToday) {
    if (diffSec < 60) {
      subMeta = `Just now • Today, ${exactTime}`;
    } else if (diffMin < 60) {
      subMeta = `${diffMin}m ago • Today, ${exactTime}`;
    } else if (diffHr < 24) {
      subMeta = `${diffHr}h ago • Today, ${exactTime}`;
    } else {
      subMeta = `Today, ${exactTime}`;
    }
  } else if (isYesterday) {
    subMeta = `Yesterday at ${exactTime}`;
  } else {
    subMeta = `${monthDay} at ${exactTime}`;
  }

  return {
    timeAgo,
    section,
    subMeta,
    timestamp: dTime,
  };
};

/**
 * Screen ID: C21
 * Title: Customer Notifications
 * Reference: design-reference/customer/notifications_chaircare_mobile
 */
export const NotificationsChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [currentFilter, setCurrentFilter] = useState<FilterCategory>('all');

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    // Strict isolation: Customer notifications screen is strictly for customer accounts
    if (!isAuthenticated || currentUser?.role !== 'customer') {
      setNotifications([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const requestsPromise = customerApi.getMyRequests().catch(() => ({ success: false, data: [] }));

      const [notifRes, requestsRes] = await Promise.all([
        notificationApi.getNotifications({ role: 'customer' }).catch(() => ({ success: false, data: [] })),
        requestsPromise,
      ]);

      const generated: NotificationItem[] = [];

      // 1. Add database notifications strictly isolated to customer with exact timestamps
      if (notifRes.success && Array.isArray(notifRes.data)) {
        notifRes.data
          .filter((dbNotif) => {
            // Exclude technician/admin operational alerts from customer notification screen
            if (
              dbNotif.type === 'job_alert' ||
              dbNotif.type === 'admin_job_assigned' ||
              dbNotif.type === 'payout'
            ) {
              return false;
            }

            // Exclude chat notifications if:
            // 1. Sent by customer (outbound message to technician, never show in customer alerts)
            // 2. The job is completed or cancelled
            if (dbNotif.type === 'chat_message') {
              if (dbNotif.data?.senderRole === 'customer') {
                return false;
              }

              const reqId = dbNotif.data?.requestId;
              const trkCode = dbNotif.data?.trackingCode;
              const matchingReq =
                requestsRes.success && Array.isArray(requestsRes.data)
                  ? requestsRes.data.find(
                      (r: any) =>
                        (reqId && String(r.id) === String(reqId)) ||
                        (trkCode && String(r.tracking_code) === String(trkCode))
                    )
                  : null;

              if (matchingReq && (matchingReq.status === 'completed' || matchingReq.status === 'cancelled')) {
                // Delete from DB asynchronously so it's permanently gone
                notificationApi.deleteNotification(dbNotif.id).catch(() => {});
                return false;
              }
            }

            return true;
          })
          .forEach((dbNotif) => {
            const rawDate = dbNotif.createdAt || (dbNotif as any).created_at;
            const timeInfo = formatNotificationTimestamp(rawDate);

            let cat: FilterCategory = 'service';
            if (dbNotif.type === 'payment' || dbNotif.type === 'invoice') cat = 'billing';
            else if (dbNotif.type === 'system' || dbNotif.type === 'promo') cat = 'system';

            const isChat = dbNotif.type === 'chat_message';

            generated.push({
              id: dbNotif.id,
              requestId: dbNotif.data?.requestId,
              category: cat,
              section: timeInfo.section,
              title: dbNotif.title,
              timeAgo: timeInfo.timeAgo,
              subMeta: timeInfo.subMeta,
              timestamp: timeInfo.timestamp,
              message: dbNotif.message,
              ticketNumber: dbNotif.data?.trackingCode ? `#${dbNotif.data.trackingCode}` : undefined,
              isUnread: !dbNotif.isRead,
              icon: isChat ? 'MessageSquare' : 'Bell',
              iconBgColor: isChat ? '#EEF2FF' : Colors.secondaryCobalt,
              iconTextColor: isChat ? '#4F46E5' : Colors.onSecondary,
              actionType: 'details',
              actionLabel: isChat ? 'Open Chat' : 'View Details',
            });
          });
      }

      // 2. Supplement with active service request updates with dynamic timestamps
      if (requestsRes.success && Array.isArray(requestsRes.data)) {
        requestsRes.data.forEach((item: any) => {
          const ticketCode = item.tracking_code
            ? `#${item.tracking_code}`
            : `#CC-${item.id?.substring(0, 4) || 'REQ'}`;

          // Avoid duplicate if already present in database notifications
          if (generated.some((g) => g.ticketNumber === ticketCode)) return;

          const rawDate = item.created_at || item.createdAt || item.visit_date;
          const timeInfo = formatNotificationTimestamp(rawDate);

          if (item.status === 'completed') {
            generated.push({
              id: `notif-comp-${item.id}`,
              requestId: item.id,
              category: 'service',
              section: timeInfo.section,
              title: 'Service Completed & Verified',
              timeAgo: timeInfo.timeAgo,
              subMeta: timeInfo.subMeta,
              timestamp: timeInfo.timestamp,
              message: `Your ${item.service_title || 'Chair Repair'} has been completed and verified with mechanical calibration.`,
              ticketNumber: ticketCode,
              isUnread: false,
              icon: 'Check',
              iconBgColor: Colors.tertiaryFixed,
              iconTextColor: Colors.tertiaryContainer,
              badge: '14-PT TESTED',
              actionType: 'rate',
              actionLabel: 'Rate Service',
            });
          } else if (item.status === 'in_route') {
            generated.push({
              id: `notif-route-${item.id}`,
              requestId: item.id,
              category: 'service',
              section: 'today',
              title: 'Technician On The Way',
              timeAgo: 'Live',
              subMeta: timeInfo.subMeta,
              timestamp: timeInfo.timestamp,
              message: `${item.technician_name || 'Your technician'} is on the way in mobile service unit.`,
              ticketNumber: ticketCode,
              vehicleNumber: item.technician_vehicle || undefined,
              isUnread: true,
              icon: 'Truck',
              iconBgColor: Colors.secondaryContainer,
              iconTextColor: Colors.onSecondaryContainer,
              etaNote: item.time_slot ? `Slot: ${item.time_slot}` : 'Arriving soon',
              actionType: 'track',
              actionLabel: 'Track Van',
            });
          } else if (item.status === 'assigned') {
            generated.push({
              id: `notif-asgn-${item.id}`,
              requestId: item.id,
              category: 'service',
              section: timeInfo.section,
              title: 'Technician Assigned',
              timeAgo: timeInfo.timeAgo,
              subMeta: timeInfo.subMeta,
              timestamp: timeInfo.timestamp,
              message: `${item.technician_name || 'Certified Specialist'} has been assigned to your request.`,
              ticketNumber: ticketCode,
              isUnread: true,
              icon: 'Bell',
              iconBgColor: Colors.secondaryCobalt,
              iconTextColor: Colors.onSecondary,
              actionType: 'details',
              actionLabel: 'View Details',
            });
          } else {
            generated.push({
              id: `notif-req-${item.id}`,
              requestId: item.id,
              category: 'service',
              section: timeInfo.section,
              title: 'Service Request Registered',
              timeAgo: timeInfo.timeAgo,
              subMeta: timeInfo.subMeta,
              timestamp: timeInfo.timestamp,
              message: `Your booking for ${item.chair_model || 'office chair'} is confirmed. System finding technician.`,
              ticketNumber: ticketCode,
              isUnread: false,
              icon: 'Clock',
              iconBgColor: Colors.surfaceContainerHighest,
              iconTextColor: Colors.onSurface,
              actionType: 'details',
              actionLabel: 'View Details',
            });
          }

          if (item.is_paid && item.total_amount > 0) {
            generated.push({
              id: `notif-pay-${item.id}`,
              requestId: item.id,
              category: 'billing',
              section: timeInfo.section,
              title: 'Payment Confirmed',
              timeAgo: timeInfo.timeAgo,
              subMeta: timeInfo.subMeta,
              timestamp: timeInfo.timestamp,
              message: `Payment of ₹${item.total_amount} received via ${item.payment_method || 'online'}.`,
              ticketNumber: ticketCode,
              isUnread: false,
              icon: 'CreditCard',
              iconBgColor: Colors.surfaceContainerHighest,
              iconTextColor: Colors.onSurface,
              actionType: 'receipt',
              actionLabel: 'View Receipt',
            });
          }
        });
      }

      // Sort notifications newest first by exact timestamp
      generated.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setNotifications(generated);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, currentUser?.role]);

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh when admin, technician, or customer trigger sync events
    const unsubscribeSync = adminSyncEmitter.subscribe(() => {
      fetchNotifications();
    });

    return () => {
      unsubscribeSync();
    };
  }, [fetchNotifications]);

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.isUnread).length,
    [notifications]
  );

  const todayUnreadCount = useMemo(
    () =>
      notifications.filter((n) => n.section === 'today' && n.isUnread).length,
    [notifications]
  );

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // Non-blocking UI update
    }
  };

  const handleCardPress = (item: NotificationItem) => {
    if (item.isUnread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
      );
      if (item.id && !item.id.startsWith('notif-')) {
        notificationApi.markAsRead(item.id).catch(() => {});
      }
    }

    const reqId = item.requestId || item.id;
    if (item.actionType === 'details') {
      navigation.navigate('RequestDetails', { requestId: reqId });
    } else if (item.actionType === 'track') {
      navigation.navigate('LiveTechnicianTracking', { requestId: reqId });
    } else if (item.actionType === 'rate') {
      navigation.navigate('RateYourExperience', { requestId: reqId });
    } else if (item.actionType === 'receipt') {
      navigation.navigate('PaymentInvoice', { requestId: reqId });
    }
  };

  const handleActionBtnPress = (item: NotificationItem) => {
    const reqId = item.requestId || item.id;
    if (item.actionType === 'details') {
      navigation.navigate('RequestDetails', { requestId: reqId });
    } else if (item.actionType === 'track') {
      navigation.navigate('LiveTechnicianTracking', { requestId: reqId });
    } else if (item.actionType === 'rate') {
      navigation.navigate('RateYourExperience', { requestId: reqId });
    } else if (item.actionType === 'receipt') {
      navigation.navigate('PaymentInvoice', { requestId: reqId });
    }
  };

  // Group notifications by section based on filter
  const filteredNotifications = useMemo(() => {
    if (currentFilter === 'all') return notifications;
    return notifications.filter((n) => n.category === currentFilter);
  }, [notifications, currentFilter]);

  const todayList = useMemo(
    () => filteredNotifications.filter((n) => n.section === 'today'),
    [filteredNotifications]
  );

  const yesterdayList = useMemo(
    () => filteredNotifications.filter((n) => n.section === 'yesterday'),
    [filteredNotifications]
  );

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Navigation Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 10 }} />
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandSubtitle}>ChairCare Portal</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Notifications
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 8 }} />
          <CustomerHeaderAvatar onPress={() => navigation.navigate('CustomerProfileTab')} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Top Action & Summary Bar */}
        <View style={styles.topSummaryRow}>
          <View style={styles.topSummaryLeft}>
            <Text style={styles.sectionHeading}>Notifications</Text>
            {unreadCount > 0 ? (
              <View style={styles.newBadgePill}>
                <Text style={styles.newBadgeText}>{unreadCount} NEW</Text>
              </View>
            ) : (
              <View style={styles.allReadBadgePill}>
                <Text style={styles.allReadBadgeText}>ALL READ</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}
            >
              <AppIcon name="CheckCheck" size={18} />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills Horizontal Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                currentFilter === 'all' && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  currentFilter === 'all' && styles.filterCountTextActive,
                ]}
              >
                {notifications.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'service' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('service')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'service' && styles.filterPillTextActive,
              ]}
            >
              Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'billing' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('billing')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'billing' && styles.filterPillTextActive,
              ]}
            >
              Billing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'system' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('system')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'system' && styles.filterPillTextActive,
              ]}
            >
              System
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Notification Stream Sections */}
        {filteredNotifications.length > 0 ? (
          <View style={styles.streamContainer}>
            {/* SECTION 1: TODAY */}
            {todayList.length > 0 && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleLabel}>Today</Text>
                  <Text
                    style={[
                      styles.sectionMetaTag,
                      todayUnreadCount > 0
                        ? styles.sectionMetaTagActive
                        : styles.sectionMetaTagMuted,
                    ]}
                  >
                    {todayUnreadCount > 0
                      ? `${todayUnreadCount} UNREAD`
                      : 'ALL CAUGHT UP'}
                  </Text>
                </View>

                <View style={styles.cardsList}>
                  {todayList.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.notificationCard,
                        item.isUnread
                          ? styles.unreadCardBg
                          : styles.readCardBg,
                      ]}
                      onPress={() => handleCardPress(item)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.cardMainRow}>
                        {/* Icon Container with Unread Dot */}
                        <View style={styles.iconContainer}>
                          <View
                            style={[
                              styles.iconCircle,
                              { backgroundColor: item.iconBgColor },
                            ]}
                          >
                            <AppIcon
                              name={item.icon}
                              size={18}
                              color={item.iconTextColor}
                              strokeWidth={1.8}
                            />
                          </View>
                          {item.isUnread && <View style={styles.unreadDot} />}
                        </View>

                        {/* Text & Action Column */}
                        <View style={styles.cardContentCol}>
                          <View style={styles.cardTitleRow}>
                            <Text
                              style={styles.cardTitleText}
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            <Text style={styles.timeAgoText}>
                              {item.timeAgo}
                            </Text>
                          </View>

                          <Text style={styles.messageText}>
                            {item.message}
                            {item.ticketNumber && (
                              <Text style={styles.ticketPillSpan}>
                                {item.ticketNumber}
                              </Text>
                            )}
                            {item.vehicleNumber && (
                              <Text style={styles.vehicleBadgeSpan}>
                                {item.vehicleNumber}
                              </Text>
                            )}
                          </Text>

                          {/* Embedded Live ETA Progress micro-component if present */}
                          {item.etaNote && (
                            <View style={styles.embeddedEtaBox}>
                              <View style={styles.embeddedEtaLeft}>
                                <View style={styles.etaPulseDot} />
                                <Text style={styles.etaNoteText}>
                                  {item.etaNote}
                                </Text>
                              </View>
                              {item.actionLabel && (
                                <TouchableOpacity
                                  style={styles.trackVanAction}
                                  onPress={() => handleActionBtnPress(item)}
                                >
                                  <Text style={styles.trackVanActionText}>
                                    {item.actionLabel}
                                  </Text>
                                  <Text style={styles.navArrowIcon}>↗</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}

                          {/* Bottom Card Action / Meta if not ETA box */}
                          {!item.etaNote && (
                            <View style={styles.cardBottomActionRow}>
                              {item.subMeta && (
                                <Text style={styles.subMetaText}>
                                  {item.subMeta}
                                </Text>
                              )}
                              {item.actionLabel && (
                                <TouchableOpacity
                                  style={styles.viewDetailsAction}
                                  onPress={() => handleActionBtnPress(item)}
                                >
                                  <Text style={styles.viewDetailsActionText}>
                                    {item.actionLabel}
                                  </Text>
                                  <Text style={styles.arrowForwardIcon}>→</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SECTION 2: YESTERDAY & EARLIER */}
            {yesterdayList.length > 0 && (
              <View style={styles.sectionGroup}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitleLabel}>Yesterday & Earlier</Text>
                  <Text style={styles.archivedMetaTag}>
                    {yesterdayList.length} ARCHIVED
                  </Text>
                </View>

                <View style={styles.cardsList}>
                  {yesterdayList.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.notificationCard, styles.readCardBg]}
                      onPress={() => handleCardPress(item)}
                      activeOpacity={0.9}
                    >
                      <View style={styles.cardMainRow}>
                        {/* Icon Container */}
                        <View style={styles.iconContainer}>
                          <View
                            style={[
                              styles.iconCircle,
                              { backgroundColor: item.iconBgColor },
                            ]}
                          >
                            <AppIcon
                              name={item.icon}
                              size={18}
                              color={item.iconTextColor}
                              strokeWidth={1.8}
                            />
                          </View>
                        </View>

                        {/* Text & Action Column */}
                        <View style={styles.cardContentCol}>
                          <View style={styles.cardTitleRow}>
                            <View style={styles.titleBadgeGroup}>
                              <Text
                                style={styles.cardTitleText}
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                              {item.badge && (
                                <View style={styles.testedBadge}>
                                  <Text style={styles.testedBadgeText}>
                                    {item.badge}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.timeAgoMuted}>
                              {item.timeAgo}
                            </Text>
                          </View>

                          <Text style={styles.messageText}>
                            {item.message}
                          </Text>

                          {/* Star rating and Rate CTA for completed service */}
                          {item.actionType === 'rate' && (
                            <View style={styles.cardRatingActionRow}>
                              <View style={styles.starsRow}>
                                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                                <AppIcon name="Star" size={14} color={Colors.outlineVariant} />
                              </View>
                              <TouchableOpacity
                                style={styles.rateServiceBtn}
                                onPress={() => handleActionBtnPress(item)}
                              >
                                <Text style={styles.rateServiceBtnText}>
                                  Rate Service
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* View Receipt CTA for payment */}
                          {item.actionType === 'receipt' && (
                            <View style={styles.viewReceiptRow}>
                              <TouchableOpacity
                                style={styles.viewReceiptBtn}
                                onPress={() => handleActionBtnPress(item)}
                              >
                                <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
                                <Text style={styles.viewReceiptText}>
                                  View Receipt
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {/* View Details CTA for general/service details in yesterday section */}
                          {item.actionType === 'details' && (
                            <View style={styles.cardBottomActionRow}>
                              {item.subMeta && (
                                <Text style={styles.subMetaText}>
                                  {item.subMeta}
                                </Text>
                              )}
                              {item.actionLabel && (
                                <TouchableOpacity
                                  style={styles.viewDetailsAction}
                                  onPress={() => handleActionBtnPress(item)}
                                >
                                  <Text style={styles.viewDetailsActionText}>
                                    {item.actionLabel}
                                  </Text>
                                  <Text style={styles.arrowForwardIcon}>→</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}

                          {/* Warranty Pill for system notice */}
                          {item.warrantyPill && (
                            <View style={styles.warrantyPillWrapper}>
                              <View style={styles.warrantyPillBadge}>
                                <View style={styles.warrantyInnerDot} />
                                <Text style={styles.warrantyPillText}>
                                  {item.warrantyPill}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : (
          /* Empty State when filter yields 0 items */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="BellOff" size={32} color={Colors.outlineVariant} />
            </View>
            <Text style={styles.emptyTitle}>
              {!isAuthenticated ? 'Sign In to View Alerts' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptySub}>
              {!isAuthenticated
                ? 'Please sign in to track your service requests, technician arrival, and payment updates.'
                : 'When you book a service or your technician provides an update, your real-time alerts will appear here.'}
            </Text>
            {!isAuthenticated ? (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: Colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.medium,
                }}
                onPress={() =>
                  navigation.navigate('AuthenticationGate', { returnTo: 'NotificationsTab' })
                }
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Sign In to ChairCare</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: Colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: BorderRadius.medium,
                }}
                onPress={() => navigation.navigate('ServicesAvailableTab')}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Browse Services</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bottom Clarifying Banner / Settings Shortcut */}
        <View style={styles.settingsFooterBanner}>
          <AppIcon name="Settings" size={18} />
          <Text style={styles.settingsFooterText}>
            Notification preferences can be managed in your{' '}
            <Text
              style={styles.profileSettingsLink}
              onPress={() => navigation.navigate('CustomerProfileTab')}
            >
              Profile settings
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 58,
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
    gap: 10,
    flex: 1,
  },
  brandIcon: {
    fontSize: 22,
  },
  headerTitleGroup: {
    gap: 1,
  },
  brandSubtitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  topSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  topSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeading: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  newBadgePill: {
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  newBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  allReadBadgePill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  allReadBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.outline,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markAllCheckIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  markAllText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  filterPillsScroll: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    ...Shadows.level1,
  },
  filterPillText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: Colors.onPrimary,
  },
  filterCountBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  filterCountTextActive: {
    color: Colors.onPrimary,
  },
  streamContainer: {
    gap: 16,
  },
  sectionGroup: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitleLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionMetaTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
  },
  sectionMetaTagActive: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  sectionMetaTagMuted: {
    color: Colors.outline,
  },
  archivedMetaTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '600',
  },
  cardsList: {
    gap: 10,
  },
  notificationCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  unreadCardBg: {
    backgroundColor: 'rgba(0, 81, 213, 0.04)',
    borderColor: 'rgba(0, 81, 213, 0.15)',
  },
  readCardBg: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    position: 'relative',
    marginTop: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  iconSymbol: {
    fontSize: 18,
    fontWeight: '700',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondaryCobalt,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLowest,
  },
  cardContentCol: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardTitleText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  testedBadge: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  testedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.tertiaryContainer,
    textTransform: 'uppercase',
  },
  timeAgoText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flexShrink: 0,
    fontWeight: '600',
  },
  timeAgoMuted: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.outline,
    flexShrink: 0,
    fontWeight: '600',
  },
  messageText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  ticketPillSpan: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  vehicleBadgeSpan: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  embeddedEtaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: BorderRadius.lg,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  embeddedEtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  etaPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  etaNoteText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  trackVanAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trackVanActionText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  navArrowIcon: {
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  cardBottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 2,
  },
  subMetaText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    textTransform: 'uppercase',
  },
  viewDetailsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsActionText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  arrowForwardIcon: {
    fontSize: 14,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  cardRatingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starFilled: {
    fontSize: 15,
    color: Colors.onSurfaceVariant,
  },
  starEmpty: {
    fontSize: 15,
    color: Colors.outlineVariant,
  },
  rateServiceBtn: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  rateServiceBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  viewReceiptRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  receiptDocIcon: {
    fontSize: 13,
  },
  viewReceiptText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  warrantyPillWrapper: {
    marginTop: 6,
  },
  warrantyPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
    alignSelf: 'flex-start',
  },
  warrantyInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryContainer,
  },
  warrantyPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyBellIcon: {
    fontSize: 26,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptySub: {
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  settingsFooterBanner: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  tuneIcon: {
    fontSize: 18,
    color: Colors.outline,
  },
  settingsFooterText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  profileSettingsLink: {
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
});
