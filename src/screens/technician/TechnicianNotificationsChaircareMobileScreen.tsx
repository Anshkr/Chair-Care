import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, Shadows, BorderRadius, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { notificationApi, AppNotification } from '../../services/api/notificationApi';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';

type FilterType = 'all' | 'jobs' | 'messages' | 'system';

interface FormattedTechNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
  requestId?: string;
  trackingCode?: string;
  chairModel?: string;
  address?: string;
  totalAmount?: number;
  temporaryPassword?: string;
  badgeLabel: string;
  badgeBg: string;
  badgeColor: string;
  iconName: string;
  iconBg: string;
  iconColor: string;
}

export const TechnicianNotificationsChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<FormattedTechNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const formatTimeAgo = (dateStr: string): string => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const transformNotification = useCallback((n: AppNotification): FormattedTechNotification => {
    const data = typeof n.data === 'string' ? JSON.parse(n.data || '{}') : (n.data || {});
    const nType = (n.type || '').toLowerCase();

    let badgeLabel = 'NOTIFICATION';
    let badgeBg = '#F1F5F9';
    let badgeColor = '#475569';
    let iconName = 'Bell';
    let iconBg = '#F1F5F9';
    let iconColor = Colors.secondaryCobalt;

    if (nType === 'admin_job_assigned') {
      badgeLabel = 'ADMIN ASSIGNED';
      badgeBg = '#FEF3C7';
      badgeColor = '#B45309';
      iconName = 'Zap';
      iconBg = '#FEF3C7';
      iconColor = '#D97706';
    } else if (nType === 'job_alert') {
      badgeLabel = 'JOB ALERT';
      badgeBg = '#ECFDF5';
      badgeColor = '#047857';
      iconName = 'Wrench';
      iconBg = '#ECFDF5';
      iconColor = '#10B981';
    } else if (nType === 'chat_message') {
      badgeLabel = 'CUSTOMER MESSAGE';
      badgeBg = '#EEF2FF';
      badgeColor = '#4338CA';
      iconName = 'MessageSquare';
      iconBg = '#EEF2FF';
      iconColor = '#6366F1';
    } else if (nType === 'temporary_password' || nType.includes('password') || Boolean(data.temporaryPassword)) {
      badgeLabel = '🔑 TEMP PASSWORD';
      badgeBg = '#FEE2E2';
      badgeColor = '#B91C1C';
      iconName = 'Key';
      iconBg = '#FEE2E2';
      iconColor = '#DC2626';
    } else if (nType === 'payout') {
      badgeLabel = 'PAYOUT';
      badgeBg = '#ECFDF5';
      badgeColor = '#047857';
      iconName = 'Wallet';
      iconBg = '#ECFDF5';
      iconColor = '#10B981';
    } else if (nType === 'system') {
      badgeLabel = 'SYSTEM';
      badgeBg = '#F3F4F6';
      badgeColor = '#374151';
      iconName = 'Info';
      iconBg = '#F3F4F6';
      iconColor = '#4B5563';
    }

    return {
      id: String(n.id),
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: Boolean(n.isRead),
      createdAt: n.createdAt,
      timeAgo: formatTimeAgo(n.createdAt),
      requestId: data.requestId || data.id,
      trackingCode: data.trackingCode ? `#${data.trackingCode}` : undefined,
      chairModel: data.chairModel,
      address: data.address,
      totalAmount: data.totalAmount,
      temporaryPassword: data.temporaryPassword,
      badgeLabel,
      badgeBg,
      badgeColor,
      iconName,
      iconBg,
      iconColor,
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getNotifications({ role: 'technician' });
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(transformNotification);
        setNotifications(mapped);
      }
    } catch {
      // keep existing state
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [transformNotification]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // ignore
    }
  };

  const handlePressNotification = async (item: FormattedTechNotification) => {
    // 1. Mark as read immediately in local state and backend
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      try {
        await notificationApi.markAsRead(item.id);
      } catch {
        // ignore
      }
    }

    // 2. Role-safe navigation for technician
    if (
      item.type === 'temporary_password' ||
      item.type?.includes('password') ||
      Boolean(item.temporaryPassword)
    ) {
      try {
        navigation.navigate('TechProfileTab', {
          screen: 'TechnicianProfile',
          params: {
            openChangePassword: true,
            temporaryPassword: item.temporaryPassword,
          },
        });
      } catch {
        navigation.navigate('TechnicianProfile', {
          openChangePassword: true,
          temporaryPassword: item.temporaryPassword,
        });
      }
      return;
    }

    if (item.type === 'chat_message' && item.requestId) {
      navigation.navigate('TechnicianChat', {
        requestId: item.requestId,
      });
      return;
    }

    if (
      (item.type === 'job_alert' || item.type === 'admin_job_assigned') &&
      item.requestId
    ) {
      navigation.navigate('JobRequestDetails', {
        requestId: item.requestId,
        ticket: {
          id: item.requestId,
          ticketNumber: item.trackingCode || `#REQ-${item.requestId.slice(0, 4)}`,
          chairModel: item.chairModel || 'Office Ergonomic Chair',
          totalAmount: item.totalAmount || 599,
          locationDetail: item.address || 'Customer Address',
        },
      });
      return;
    }

    // Default route: go to Job Queue
    navigation.navigate('JobRequestsTab');
  };

  // Filter list
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'jobs') {
      return notifications.filter(
        (n) => n.type === 'job_alert' || n.type === 'admin_job_assigned'
      );
    }
    if (activeFilter === 'messages') {
      return notifications.filter((n) => n.type === 'chat_message');
    }
    if (activeFilter === 'system') {
      return notifications.filter(
        (n) =>
          n.type === 'system' ||
          n.type === 'payout' ||
          n.type === 'temporary_password' ||
          n.type?.includes('password') ||
          Boolean(n.temporaryPassword)
      );
    }
    return notifications;
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="ArrowLeft" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerSub}>FIELD PARTNER DISPATCH</Text>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadCounterBadge}>
                  <Text style={styles.unreadCounterText}>{unreadCount} NEW</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markReadBtn}
              onPress={handleMarkAllAsRead}
              activeOpacity={0.7}
            >
              <AppIcon name="CheckCheck" size={15} color={Colors.secondaryCobalt} />
              <Text style={styles.markReadText}>Read All</Text>
            </TouchableOpacity>
          )}
          <ThemeSwitchButton variant="header" style={{ marginLeft: 6, marginRight: 6 }} />
          <TechnicianHeaderAvatar size={36} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              All ({notifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'jobs' && styles.filterChipActive]}
            onPress={() => setActiveFilter('jobs')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === 'jobs' && styles.filterTextActive]}>
              🚨 Job Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'messages' && styles.filterChipActive]}
            onPress={() => setActiveFilter('messages')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === 'messages' && styles.filterTextActive]}>
              💬 Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'system' && styles.filterChipActive]}
            onPress={() => setActiveFilter('system')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, activeFilter === 'system' && styles.filterTextActive]}>
              💼 System
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.secondaryCobalt]}
            tintColor={Colors.secondaryCobalt}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} />
            <Text style={styles.loadingText}>Loading technician alerts...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="Bell" size={32} color={Colors.outline} />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? "You're all caught up! New job dispatches from customers and admin will ring here."
                : `No ${activeFilter} alerts found at the moment.`}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => navigation.navigate('JobRequestsTab')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>View Available Job Queue →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationCard,
                  !item.isRead && styles.notificationCardUnread,
                ]}
                onPress={() => handlePressNotification(item)}
                activeOpacity={0.75}
              >
                {/* Unread indicator ribbon */}
                {!item.isRead && <View style={styles.unreadRibbon} />}

                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardBadgeContainer}>
                    <View
                      style={[
                        styles.typeBadge,
                        { backgroundColor: item.badgeBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          { color: item.badgeColor },
                        ]}
                      >
                        {item.badgeLabel}
                      </Text>
                    </View>
                    {item.trackingCode && (
                      <Text style={styles.trackingPill}>{item.trackingCode}</Text>
                    )}
                  </View>
                  <Text style={styles.timeAgoText}>{item.timeAgo}</Text>
                </View>

                <View style={styles.cardBodyRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: item.iconBg },
                    ]}
                  >
                    <AppIcon
                      name={item.iconName}
                      size={20}
                      color={item.iconColor}
                      strokeWidth={2}
                    />
                  </View>

                  <View style={styles.cardTextCol}>
                    <Text
                      style={[
                        styles.cardTitle,
                        !item.isRead && styles.cardTitleUnread,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.cardMessage} numberOfLines={3}>
                      {item.message}
                    </Text>

                    {/* Metadata tags */}
                    {(item.chairModel || item.totalAmount) && (
                      <View style={styles.metaRow}>
                        {item.chairModel && (
                          <View style={styles.metaChip}>
                            <AppIcon name="Armchair" size={12} color={Colors.onSurfaceVariant} />
                            <Text style={styles.metaChipText}>{item.chairModel}</Text>
                          </View>
                        )}
                        {item.totalAmount && (
                          <View style={styles.metaChipPrice}>
                            <Text style={styles.metaChipPriceText}>
                              ₹{item.totalAmount}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Temporary password preview box */}
                    {Boolean(item.temporaryPassword) && (
                      <View style={styles.tempPassBox}>
                        <View style={styles.tempPassLeft}>
                          <AppIcon name="Key" size={13} color="#DC2626" />
                          <Text style={styles.tempPassLabel}>TEMP PASSWORD:</Text>
                          <Text style={styles.tempPassValue} selectable>{item.temporaryPassword}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.copyPassBtn}
                          onPress={() => {
                            if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
                              (navigator as any).clipboard.writeText(item.temporaryPassword!);
                            }
                            Alert.alert('Temporary Password Copied', `Temporary password '${item.temporaryPassword}' copied to clipboard. Use it in Profile > Change Password.`);
                          }}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="Copy" size={12} color="#DC2626" />
                          <Text style={styles.copyPassText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.cardFooterRow}>
                  <View style={styles.cardFooterLeft}>
                    {!item.isRead ? (
                      <View style={styles.unreadDotRow}>
                        <View style={styles.unreadDot} />
                        <Text style={styles.unreadLabel}>Tap to open & view</Text>
                      </View>
                    ) : (
                      <Text style={styles.readLabel}>Read</Text>
                    )}
                  </View>

                  <View style={styles.actionPill}>
                    <Text style={styles.actionPillText}>
                      {item.type === 'chat_message'
                        ? 'Open Chat →'
                        : item.type === 'admin_job_assigned'
                        ? 'View Assigned Job →'
                        : item.type === 'job_alert'
                        ? 'View Job Details →'
                        : item.type === 'temporary_password' || item.temporaryPassword
                        ? 'Change Password →'
                        : 'View Details →'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    ...Shadows.level1,
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
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  unreadCounterBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadCounterText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(19, 70, 153, 0.08)',
  },
  markReadText: {
    ...Typography.labelSm,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  filterBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  filterText: {
    ...Typography.labelMedium,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryCobalt,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  notificationCardUnread: {
    borderColor: 'rgba(19, 70, 153, 0.25)',
    backgroundColor: '#FAFCFF',
  },
  unreadRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  trackingPill: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    backgroundColor: 'rgba(19, 70, 153, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  timeAgoText: {
    ...Typography.labelSmall,
    color: Colors.onSurfaceVariant,
    fontSize: 11,
  },
  cardBodyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTextCol: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    ...Typography.titleMedium,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  cardMessage: {
    ...Typography.bodyMedium,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  metaChipText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  metaChipPrice: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  metaChipPriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  unreadLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  readLabel: {
    fontSize: 11,
    color: Colors.outline,
  },
  actionPill: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  tempPassBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 8,
  },
  tempPassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  tempPassLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
  tempPassValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  copyPassText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
});
