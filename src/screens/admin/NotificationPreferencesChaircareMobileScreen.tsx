import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi, NotificationChannelStatus } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';

interface ChannelStatus {
  id: 'console' | 'push' | 'email';
  title: string;
  statusLabel: string;
  icon: string;
  isActive: boolean;
}

interface PreferenceItem {
  key: string;
  title: string;
  subtitle: string;
  defaultValue: boolean;
}

interface PreferenceCategory {
  id: string;
  title: string;
  icon: string;
  items: PreferenceItem[];
}

const DEFAULT_PREFERENCES: Record<string, boolean> = {
  // Operations
  'op-new': true,
  'op-unassigned': true,
  'op-assignment': true,
  'op-active': true,
  'op-delays': true,

  // Finance
  'fin-success': false,
  'fin-failed': true,
  'fin-refunds': true,
  'fin-disputes': true,

  // People & Governance
  'gov-apps': true,
  'gov-verify': true,
  'gov-customer': true,
  'gov-tech': true,

  // System & Infrastructure
  'sys-api': true,
  'sys-gateway': true,
  'sys-notification': true,
  'sys-downtime': true,
};

const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    id: 'operations',
    title: 'Operations',
    icon: 'precision_manufacturing',
    items: [
      {
        key: 'op-new',
        title: 'New Service Requests',
        subtitle: 'Real-time booking submissions',
        defaultValue: true,
      },
      {
        key: 'op-unassigned',
        title: 'Unassigned Requests',
        subtitle: 'Flag requests unassigned > 10 mins',
        defaultValue: true,
      },
      {
        key: 'op-assignment',
        title: 'Technician Assignment Issues',
        subtitle: 'Rejections & timeout alerts',
        defaultValue: true,
      },
      {
        key: 'op-active',
        title: 'Active Service Alerts',
        subtitle: 'On-site milestones & check-in',
        defaultValue: true,
      },
      {
        key: 'op-delays',
        title: 'Service Delays',
        subtitle: 'Technicians running > 15m behind ETA',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: 'account_balance_wallet',
    items: [
      {
        key: 'fin-success',
        title: 'Successful Payments',
        subtitle: 'Gateway settlement confirmations',
        defaultValue: false,
      },
      {
        key: 'fin-failed',
        title: 'Failed Payments',
        subtitle: 'Invoiced attempts requiring retry',
        defaultValue: true,
      },
      {
        key: 'fin-refunds',
        title: 'Refunds',
        subtitle: 'Supervisory approvals & reversals',
        defaultValue: true,
      },
      {
        key: 'fin-disputes',
        title: 'Payment Disputes',
        subtitle: 'Escrow holds & chargeback notices',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'governance',
    title: 'People & Governance',
    icon: 'verified_user',
    items: [
      {
        key: 'gov-apps',
        title: 'New Technician Applications',
        subtitle: 'Onboarding queue',
        defaultValue: true,
      },
      {
        key: 'gov-verify',
        title: 'Verification Requests',
        subtitle: 'BIFMA document uploads',
        defaultValue: true,
      },
      {
        key: 'gov-customer',
        title: 'Customer Issues',
        subtitle: 'Negative reviews & complaints',
        defaultValue: true,
      },
      {
        key: 'gov-tech',
        title: 'Technician Issues',
        subtitle: 'GPS drift & compliance flags',
        defaultValue: true,
      },
    ],
  },
  {
    id: 'system',
    title: 'System & Infrastructure',
    icon: 'dns',
    items: [
      {
        key: 'sys-api',
        title: 'API Errors',
        subtitle: 'Ingress timeouts & 5xx rates',
        defaultValue: true,
      },
      {
        key: 'sys-gateway',
        title: 'Payment Gateway Alerts',
        subtitle: 'Razorpay / UPI latency spikes',
        defaultValue: true,
      },
      {
        key: 'sys-notification',
        title: 'Notification Failures',
        subtitle: 'Push/email delivery drops',
        defaultValue: true,
      },
      {
        key: 'sys-downtime',
        title: 'System Downtime',
        subtitle: 'Server maintenance & health checks',
        defaultValue: true,
      },
    ],
  },
];

interface NotificationPreferencesProps {
  navigation?: any;
}

export const NotificationPreferencesChaircareMobileScreen: React.FC<
  NotificationPreferencesProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Pulse animation for live telemetry badge & incident pulse
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

  // Delivery channels state
  const [channels, setChannels] = useState<ChannelStatus[]>([
    {
      id: 'console',
      title: 'In-App Console',
      statusLabel: 'Syncing',
      icon: 'terminal',
      isActive: true,
    },
    {
      id: 'push',
      title: 'Push Device',
      statusLabel: 'FCM Active',
      icon: 'notifications_active',
      isActive: true,
    },
    {
      id: 'email',
      title: 'Corp Email',
      statusLabel: 'SMTP Pool',
      icon: 'mark_email_unread',
      isActive: true,
    },
  ]);

  // Preference switches state
  const [preferences, setPreferences] =
    useState<Record<string, boolean>>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Notification preferences synced');

  const activeChannelCount = useMemo(
    () => channels.filter((c) => c.isActive).length,
    [channels]
  );

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getNotificationPreferences();
      if (res.success && res.data) {
        const data = res.data;
        if (Array.isArray(data.channels) && data.channels.length > 0) {
          setChannels(data.channels);
        }
        if (data.preferences && Object.keys(data.preferences).length > 0) {
          const loadedPrefs = data.preferences;
          setPreferences((prev) => ({ ...prev, ...loadedPrefs }));
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useAdminSync(navigation, loadPreferences);

  const toggleChannel = (id: 'console' | 'push' | 'email') => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              isActive: !c.isActive,
              statusLabel: !c.isActive
                ? id === 'console'
                  ? 'Syncing'
                  : id === 'push'
                  ? 'FCM Active'
                  : 'SMTP Pool'
                : 'Paused',
            }
          : c
      )
    );
  };

  const togglePreference = (key: string) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await adminApi.updateNotificationPreferences({
        channels,
        preferences,
      });
      if (res.success) {
        setToastMessage('Notification preferences saved to live database.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
      } else {
        setToastMessage(res.error || 'Failed to save preferences.');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
      }
    } catch (err: any) {
      setToastMessage(err?.message || 'Error saving notification preferences.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    const defaultChannels: ChannelStatus[] = [
      { id: 'console', title: 'In-App Console', statusLabel: 'Syncing', icon: 'terminal', isActive: true },
      { id: 'push', title: 'Push Device', statusLabel: 'FCM Active', icon: 'notifications_active', isActive: true },
      { id: 'email', title: 'Corp Email', statusLabel: 'SMTP Pool', icon: 'mark_email_unread', isActive: true },
    ];
    setPreferences(DEFAULT_PREFERENCES);
    setChannels(defaultChannels);
    try {
      await adminApi.updateNotificationPreferences({
        channels: defaultChannels,
        preferences: DEFAULT_PREFERENCES,
      });
      setToastMessage('Restored regional defaults & updated live database.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
    } catch {
      setToastMessage('Restored local defaults.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3200);
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
            Notification Preferences
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('CreateNotification')}
            accessibilityLabel="Send broadcast notification"
          >
            <AppIcon name="campaign" size={20} color="#0051d5" />
          </TouchableOpacity>
          <AdminHeaderAvatar size={34} />
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Contextual Subtitle & Admin Identity Banner */}
        <View style={styles.contextHeader}>
          <View style={styles.contextMetaRow}>
            <Text style={styles.contextEyebrow}>
              ADMIN SETTINGS // REGION: NORTH
            </Text>
            <View style={styles.telemetryLiveBadge}>
              <Animated.View
                style={[styles.telemetryPulseDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.telemetryLiveText}>
                Realtime Telemetry Live
              </Text>
            </View>
          </View>
          <Text style={styles.contextSubtitle}>
            Configure alerts, urgency rules, and broadcast channels
          </Text>
        </View>

        {/* Quick Broadcast Notification Banner */}
        <TouchableOpacity
          style={styles.broadcastBanner}
          activeOpacity={0.88}
          onPress={() => navigation?.navigate('CreateNotification')}
        >
          <View style={styles.broadcastBannerLeft}>
            <View style={styles.broadcastIconBox}>
              <AppIcon name="campaign" size={24} color="#0051d5" />
            </View>
            <View style={styles.broadcastTextGroup}>
              <Text style={styles.broadcastBannerTitle}>
                Send Notification Broadcast
              </Text>
              <Text style={styles.broadcastBannerSubtitle}>
                Deploy announcements or emergency alerts to Admins, Customers, Technicians, or Selected Members
              </Text>
            </View>
          </View>
          <View style={styles.broadcastActionPill}>
            <Text style={styles.broadcastActionPillText}>Broadcast</Text>
            <AppIcon name="arrow_forward" size={14} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Delivery Channels Matrix */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <AppIcon name="cell_tower" size={20} />
              <Text style={styles.sectionHeaderTitle}>Delivery Methods</Text>
            </View>
            <Text style={styles.sectionActiveCount}>
              {activeChannelCount} ACTIVE
            </Text>
          </View>

          {/* 3 Active Channel Cards */}
          <View style={styles.channelsGrid}>
            {channels.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                style={[
                  styles.channelCard,
                  !channel.isActive && styles.channelCardInactive,
                ]}
                onPress={() => toggleChannel(channel.id)}
                activeOpacity={0.8}
              >
                <View style={styles.channelCardTop}>
                  <View style={styles.channelIconWrapper}>
                    <AppIcon
                      name={channel.icon}
                      size={20}
                      color={channel.isActive ? Colors.secondary : Colors.onSurfaceVariant}
                      strokeWidth={1.8}
                    />
                  </View>
                  <AppIcon
                    name={channel.isActive ? 'check_circle' : 'radio_button_unchecked'}
                    size={20}
                    color={channel.isActive ? Colors.secondary : Colors.outline}
                  />
                </View>
                <View style={styles.channelCardBottom}>
                  <Text style={styles.channelName} numberOfLines={1}>
                    {channel.title}
                  </Text>
                  <View style={styles.channelStatusRow}>
                    <View
                      style={[
                        styles.channelStatusDot,
                        {
                          backgroundColor: channel.isActive
                            ? '#009668'
                            : '#76777d',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.channelStatusText,
                        { color: channel.isActive ? '#009668' : '#76777d' },
                      ]}
                    >
                      {channel.statusLabel}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Informational Field Note */}
          <View style={styles.infoFieldNote}>
            <AppIcon name="info" size={20} />
            <Text style={styles.infoFieldText}>
              SMS alerts reserved exclusively for technician field emergencies &
              customer OTPs.
            </Text>
          </View>
        </View>

        {/* Dispatcher Telemetry Visual Strip */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryCardHeader}>
            <View style={styles.telemetryCardHeaderLeft}>
              <Animated.View
                style={[styles.incidentPulseDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.telemetryTitle}>
                LIVE INCIDENT PULSE (24H)
              </Text>
            </View>
            <Text style={styles.telemetryEvents}>1,482 EVENTS</Text>
          </View>

          {/* Mini Bar Visualizer */}
          <View style={styles.barsRow}>
            <View style={[styles.bar, { height: '40%' }]} />
            <View style={[styles.bar, { height: '65%' }]} />
            <View style={[styles.barActive, { height: '90%' }]} />
            <View style={[styles.bar, { height: '45%' }]} />
            <View style={[styles.bar, { height: '30%' }]} />
            <View style={[styles.barActive, { height: '80%' }]} />
            <View style={[styles.barActive, { height: '100%' }]} />
            <View style={[styles.bar, { height: '55%' }]} />
            <View style={[styles.bar, { height: '70%' }]} />
            <View style={[styles.bar, { height: '35%' }]} />
            <View style={[styles.barActive, { height: '95%' }]} />
            <View style={[styles.bar, { height: '60%' }]} />
          </View>

          <View style={styles.barsFooterRow}>
            <Text style={styles.barsFooterText}>00:00 UTC</Text>
            <Text style={styles.barsFooterTextCenter}>
              DISPATCH PEAK (14:30)
            </Text>
            <Text style={styles.barsFooterText}>NOW</Text>
          </View>
        </View>

        {/* Visual Asset Feature: Ergonomic Precision Workshop Graphic */}
        <View style={styles.complianceGraphicBanner}>
          <View style={styles.complianceOverlay}>
            <Text style={styles.complianceEyebrow}>
              FLEET COMPLIANCE STANDARD
            </Text>
            <Text style={styles.complianceTitle}>BIFMA-X5.1 Telemetry</Text>
            <Text style={styles.complianceSub} numberOfLines={1}>
              Class-4 gas cylinders & tilt tension diagnostics
            </Text>
          </View>
        </View>

        {/* 4 Categorized Switch Sections */}
        <View style={styles.categoriesContainer}>
          {PREFERENCE_CATEGORIES.map((category) => {
            const activeCount = category.items.filter(
              (item) => preferences[item.key]
            ).length;

            return (
              <View key={category.id} style={styles.categoryBlock}>
                {/* Category Header */}
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryHeaderLeft}>
                    <View style={styles.categoryIconBox}>
                      <AppIcon name={category.icon} size={20} color={Colors.secondary} strokeWidth={1.8} />
                    </View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                  </View>
                  <View style={styles.categoryActiveBadge}>
                    <Text style={styles.categoryActiveBadgeText}>
                      {activeCount} ACTIVE
                    </Text>
                  </View>
                </View>

                {/* Category Items List */}
                <View style={styles.itemsCard}>
                  {category.items.map((item, idx) => {
                    const isChecked = !!preferences[item.key];
                    const isLast = idx === category.items.length - 1;

                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.preferenceItemRow,
                          !isLast && styles.preferenceItemBorder,
                        ]}
                        onPress={() => togglePreference(item.key)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.itemTextContainer}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          <Text style={styles.itemSubtitle}>
                            {item.subtitle}
                          </Text>
                        </View>

                        {/* Custom Smooth Switch */}
                        <View
                          style={[
                            styles.switchTrack,
                            isChecked
                              ? styles.switchTrackActive
                              : styles.switchTrackInactive,
                          ]}
                        >
                          <View
                            style={[
                              styles.switchThumb,
                              isChecked
                                ? styles.switchThumbActive
                                : styles.switchThumbInactive,
                            ]}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Save Toast Banner */}
      {showToast && (
        <View style={styles.toastContainer}>
          <View style={styles.toastLeft}>
            <View style={styles.toastCheckCircle}>
              <AppIcon name="check" size={20} />
            </View>
            <Text style={styles.toastMessageText}>
              {toastMessage}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowToast(false)}
            style={styles.toastCloseBtn}
          >
            <AppIcon name="close" size={20} />
          </TouchableOpacity>
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 10) + 4 },
        ]}
      >
        <View style={styles.stickyActionsInner}>
          {/* Primary Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            activeOpacity={0.88}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <AppIcon name="save" size={20} color="#ffffff" />
            )}
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving to Database...' : 'Save Preferences (Confirm)'}
            </Text>
          </TouchableOpacity>

          {/* Reset Defaults Link */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleRestoreDefaults}
            activeOpacity={0.7}
          >
            <AppIcon name="restart_alt" size={20} />
            <Text style={styles.resetText}>
              Restore Recommended Admin Defaults
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    gap: 16,
  },
  scrollContentDesktop: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  /* Context Header */
  contextHeader: {
    gap: 4,
    paddingHorizontal: 2,
  },
  contextMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextEyebrow: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
    letterSpacing: 0.8,
  },
  telemetryLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  telemetryPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  telemetryLiveText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    fontWeight: '500',
    color: '#005236',
  },
  contextSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },

  /* Section Common */
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  sectionHeaderTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  sectionActiveCount: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.5,
  },

  /* Channels Grid */
  channelsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  channelCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
    minHeight: 82,
    ...Shadows.level1,
  },
  channelCardInactive: {
    opacity: 0.75,
    backgroundColor: '#f8fafc',
  },
  channelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  channelIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#191c1e',
    includeFontPadding: false,
  },
  channelCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    includeFontPadding: false,
  },
  channelCheckIconActive: {
    color: '#009668',
  },
  channelCheckIconInactive: {
    color: '#c6c6cd',
  },
  channelCardBottom: {
    gap: 2,
  },
  channelName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#191c1e',
  },
  channelStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  channelStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  channelStatusText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
  },

  /* Info Field Note */
  infoFieldNote: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoFieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
    marginTop: 1,
  },
  infoFieldText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
    flex: 1,
    lineHeight: 16,
  },

  /* Telemetry Card */
  telemetryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  telemetryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incidentPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  telemetryTitle: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: 0.5,
  },
  telemetryEvents: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#0051d5',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 6,
    paddingTop: 4,
  },
  bar: {
    flex: 1,
    backgroundColor: '#eceef0',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barActive: {
    flex: 1,
    backgroundColor: '#0051d5',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barsFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  barsFooterText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 9,
    color: '#76777d',
  },
  barsFooterTextCenter: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9,
    color: '#45464d',
  },

  /* Compliance Graphic Banner */
  complianceGraphicBanner: {
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#131b2e',
    ...Shadows.level1,
  },
  complianceOverlay: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    backgroundColor: 'rgba(19, 27, 46, 0.9)',
    gap: 2,
  },
  complianceEyebrow: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#6ffbbe',
    letterSpacing: 0.6,
  },
  complianceTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  complianceSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#bec6e0',
  },

  /* Categories Container */
  categoriesContainer: {
    gap: 16,
  },
  categoryBlock: {
    gap: 8,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
  },
  categoryTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  categoryActiveBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryActiveBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
  },

  /* Items Card */
  itemsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  preferenceItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  preferenceItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  itemTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  itemSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
    marginTop: 1,
  },

  /* Custom Smooth Switch */
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: '#0051d5',
  },
  switchTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },

  /* Sticky Bottom Action Bar */
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 40,
    ...Shadows.level2,
  },
  stickyActionsInner: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  resetIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#0051d5',
    includeFontPadding: false,
  },
  resetText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#0051d5',
  },

  /* Toast Notification */
  toastContainer: {
    position: 'absolute',
    bottom: 86,
    left: 16,
    right: 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    ...Shadows.level3,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  toastCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#002113',
    fontWeight: 'bold',
    includeFontPadding: false,
  },
  toastMessageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#ffffff',
    flex: 1,
  },
  toastCloseBtn: {
    padding: 2,
  },
  toastCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#bec6e0',
    includeFontPadding: false,
  },

  /* Quick Broadcast Banner */
  broadcastBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#dbe1ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#0051d5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  broadcastBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  broadcastIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#edf0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastTextGroup: {
    flex: 1,
    gap: 2,
  },
  broadcastBannerTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#131b2e',
  },
  broadcastBannerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#565e74',
    lineHeight: 16,
  },
  broadcastActionPill: {
    backgroundColor: '#0051d5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  broadcastActionPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
});
