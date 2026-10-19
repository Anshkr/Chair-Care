import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';

/**
 * Screen ID: A59
 * Title: System Settings (Super Admin Central Platform Control)
 * Folder: design-reference/admin/admin_settings_chaircare_mobile
 */

interface ConfigItem {
  id: string;
  title: string;
  description: string;
  badge?: string;
  badgeType?: 'success' | 'info' | 'neutral';
  icon: keyof typeof MaterialIcons.glyphMap;
  iconBgType?: 'secondary' | 'surface' | 'tertiary';
  targetScreen?: string;
}

interface ConfigGroup {
  id: string;
  headerTitle: string;
  headerTag: string;
  items: ConfigItem[];
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: 'directories',
    headerTitle: 'User & Directory Management',
    headerTag: 'All Users',
    items: [
      {
        id: 'all_technicians',
        title: 'All Technicians',
        description: 'Field technician roster, active status, ratings & verification',
        badge: 'Fleet Roster',
        badgeType: 'info',
        icon: 'engineering',
        iconBgType: 'secondary',
        targetScreen: 'TechniciansTab',
      },
      {
        id: 'all_customers',
        title: 'All Customers',
        description: 'Customer directory, booking records, phone numbers & profiles',
        badge: 'Customer Base',
        badgeType: 'neutral',
        icon: 'people',
        iconBgType: 'surface',
        targetScreen: 'Customers',
      },
      {
        id: 'all_admins',
        title: 'All Administrators',
        description: 'Admin team members, roles, permissions & access levels',
        badge: 'Admin Team',
        badgeType: 'success',
        icon: 'admin-panel-settings',
        iconBgType: 'secondary',
        targetScreen: 'AdminUsers',
      },
    ],
  },
  {
    id: 'core_ops',
    headerTitle: 'Platform & Service Configuration',
    headerTag: 'Core Settings',
    items: [
      {
        id: 'platform_config',
        title: 'Platform Configuration',
        description: 'Service availability, booking windows, and depot operating hours',
        badge: 'Active & Online',
        badgeType: 'success',
        icon: 'tune',
        iconBgType: 'secondary',
        targetScreen: 'PlatformConfiguration',
      },
      {
        id: 'pricing_config',
        title: 'Service & Pricing Management',
        description: 'Base chair repair rates, spare parts pricing & diagnostic fees',
        badge: 'Active Rates',
        badgeType: 'neutral',
        icon: 'payments',
        iconBgType: 'surface',
        targetScreen: 'ServicePricingConfiguration',
      },
      {
        id: 'fleet_rules',
        title: 'Technician Dispatch Rules',
        description: 'Automatic nearby technician matching and service radius',
        badge: '10 km Radius',
        badgeType: 'info',
        icon: 'commute',
        iconBgType: 'secondary',
        targetScreen: 'TechnicianMatchingSystemConfiguration',
      },
    ],
  },
  {
    id: 'support_care',
    headerTitle: 'Customer Care & Disputes',
    headerTag: 'Resolutions',
    items: [
      {
        id: 'chat_bridge',
        title: 'Customer Support Tickets',
        description: 'Live inquiries, customer help requests, and open tickets',
        badge: 'Live Helpdesk',
        badgeType: 'info',
        icon: 'support-agent',
        iconBgType: 'surface',
        targetScreen: 'Support',
      },
      {
        id: 'refund_controls',
        title: 'Disputes & Refund Requests',
        description: 'Customer claims, dispute resolution & refund approvals',
        badge: 'Claims Center',
        badgeType: 'neutral',
        icon: 'receipt-long',
        iconBgType: 'surface',
        targetScreen: 'Disputes',
      },
      {
        id: 'reviews_ratings',
        title: 'Customer Reviews & Ratings',
        description: 'Service feedback, chair repair ratings & moderation',
        badge: 'Ratings',
        badgeType: 'neutral',
        icon: 'star',
        iconBgType: 'secondary',
        targetScreen: 'ReviewsRatings',
      },
    ],
  },
  {
    id: 'treasury',
    headerTitle: 'Payments & Financials',
    headerTag: 'Transactions',
    items: [
      {
        id: 'escrow_rules',
        title: 'Payments & Transactions',
        description: 'Payment gateway settings, customer invoices & technician payouts',
        badge: 'Protected',
        badgeType: 'success',
        icon: 'account-balance',
        iconBgType: 'secondary',
        targetScreen: 'Payments',
      },
      {
        id: 'tax_tariff',
        title: 'Platform Fees & Taxes',
        description: 'GST invoice breakdown and platform commission percentage',
        badge: 'GST 18%',
        badgeType: 'neutral',
        icon: 'percent',
        iconBgType: 'surface',
      },
    ],
  },
  {
    id: 'system_security',
    headerTitle: 'System & Security',
    headerTag: 'Platform Health',
    items: [
      {
        id: 'sys_health',
        title: 'System Health & Status',
        description: 'Check database status, server response & live uptime',
        badge: 'All Systems Normal',
        badgeType: 'success',
        icon: 'favorite',
        iconBgType: 'tertiary',
        targetScreen: 'AdminProfileSystemStatus',
      },
      {
        id: 'auth_bounds',
        title: 'Security & Login Protections',
        description: 'Two-factor authentication, session timeouts & password security',
        badge: 'Protected',
        badgeType: 'info',
        icon: 'lock',
        iconBgType: 'secondary',
        targetScreen: 'SecuritySystemPreferences',
      },
      {
        id: 'audit_ledger',
        title: 'Activity History & Logs',
        description: 'Detailed log of admin actions, service updates & changes',
        badge: 'Live Log',
        badgeType: 'success',
        icon: 'history',
        iconBgType: 'surface',
        targetScreen: 'ActivityLogs',
      },
      {
        id: 'notif_routing',
        title: 'Alerts & Notifications',
        description: 'Push notification preferences and system announcements',
        icon: 'notifications-active',
        iconBgType: 'surface',
        targetScreen: 'NotificationPreferences',
      },
      {
        id: 'offline_screen_demo',
        title: 'Network Offline Screen (Demo)',
        description: 'Preview buffered radar animation and network diagnostics screen',
        badge: 'Offline UI',
        badgeType: 'info',
        icon: 'wifi-off',
        iconBgType: 'secondary',
        targetScreen: 'NoNetworkOffline',
      },
    ],
  },
];

export const AdminSettingsChaircareMobileScreen: React.FC<{
  navigation?: any;
  route?: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleNavigate = (item: ConfigItem) => {
    if (item.targetScreen && navigation?.navigate) {
      navigation.navigate(item.targetScreen);
    } else {
      showToast(`Accessing ${item.title}`);
    }
  };

  const { logout, currentUser } = useAuth();

  const handleLogout = () => {
    showToast('Admin Session Ended');
    logout();
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return CONFIG_GROUPS;
    const q = searchQuery.toLowerCase();
    return CONFIG_GROUPS.map((group) => {
      const filteredItems = group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q))
      );
      return {
        ...group,
        items: filteredItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery]);

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: insets.top + 60,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialIcons name="check-circle" size={18} color="#4EDEA3" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Fixed Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <MaterialIcons name="precision-manufacturing" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerSub}>SUPER ADMIN</Text>
            <Text style={styles.headerTitle}>System Settings</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('Notifications');
              } else {
                showToast('Notifications Active');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <MaterialIcons name="notifications" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileAvatarWrap}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('AdminProfileSystemStatus');
              }
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida/AEtjO1XnL0Olf_QjUlVIuI224cZqVkVbgpMxdyNh_agAPsJZ_tMQVQHmwLNtuDqxy9X8vtifDZc0Ytn7VN5m9nUntw5O-N0sEGA3GagjWUqCFWmnYYKM_HHPI6Os2DmnFUPG7dYjvEHIYkA2p1psN1p4fiuZepz_tTanBfHdzUEVlF-l8V6xiFblG3C9mUeoD9t22r04-EEzLw1DtP5jg7_TGwnRjm_IZ6qVwmNSwKYg7ar07MVZgk30ZDFV',
              }}
              style={styles.headerAvatarImg}
            />
            <View style={styles.headerAvatarActiveDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 36) },
          isDesktop && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-Header Status Bar */}
        <View style={styles.subHeaderBar}>
          <View style={styles.subHeaderCol}>
            <Text style={styles.subHeaderTitle}>Platform Control</Text>
            <Text style={styles.subHeaderSubtitle}>
              Centralized platform settings & directory management
            </Text>
          </View>
          <View style={styles.nodeLivePill}>
            <View style={styles.nodeLivePulseDot} />
            <Text style={styles.nodeLiveText}>ONLINE</Text>
          </View>
        </View>

        {/* 1. Account & Security Profile Bento Card */}
        <View style={styles.rootProfileCard}>
          <View style={styles.rootCardGlow} />

          <View style={styles.rootCardContent}>
            <View style={styles.rootCardTopRow}>
              <View style={styles.rootCardLeft}>
                <View style={styles.rootAvatarWrap}>
                  <Image
                    source={{
                      uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACDJSYDAnjybQo_YgsRfGG3dv_EDVke6LPo_AEQWe7TFLfqBXkTlRWoWL3XWPMoao4hyd1ourH5BE1mRafYtTIuaabcCv51UC2TygzfvMIK13ySgJwhDJ6PyjwBXhmZOWaxp7CPV9xLOHoV-UThLsyBTXm9EE-LzFTXm4QyU_ACQcN1PFTiu5dVGBNkdDQV2rIw1E7hg_SEDl-sRpPtVn2CPn0Jw_SEXByZIGbl2LPzY_2TwImKKU',
                    }}
                    style={styles.rootAvatarImg}
                  />
                  <View style={styles.rootAvatarCheck}>
                    <MaterialIcons name="check" size={10} color="#002113" />
                  </View>
                </View>

                <View style={styles.rootInfoCol}>
                  <View style={styles.rootNameRow}>
                    <Text style={styles.rootName}>{currentUser?.name || 'Administrator'}</Text>
                    <MaterialIcons name="verified-user" size={16} color="#DBE1FF" />
                  </View>
                  <Text style={styles.rootUid}>{currentUser?.email || 'admin@chaircare.com'}</Text>
                </View>
              </View>

              <View style={styles.fullAccessBadge}>
                <Text style={styles.fullAccessBadgeText}>Full Access</Text>
              </View>
            </View>

            {/* Last Auth Sub-Box */}
            <View style={styles.lastAuthBox}>
              <View style={styles.lastAuthCol}>
                <Text style={styles.lastAuthLabel}>SECURITY STATUS</Text>
                <Text style={styles.lastAuthValue}>Protected & Authenticated</Text>
              </View>
              <View style={styles.hardwareKeyPill}>
                <MaterialIcons name="security" size={14} color="#4EDEA3" />
                <Text style={styles.hardwareKeyText}>Two-Factor Security Active</Text>
              </View>
            </View>

            {/* Manage Root Credentials Link */}
            <TouchableOpacity
              style={styles.manageRootLink}
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('AdminProfileSystemStatus');
                } else {
                  showToast('Admin Profile active');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.manageRootLinkText}>
                View Admin Profile &amp; System Health
              </Text>
              <MaterialIcons name="chevron-right" size={18} color="#7C839B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search / Quick Filter Bar */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search settings, user directories, or services..."
            placeholderTextColor={Colors.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <MaterialIcons name="close" size={18} color={Colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Platform Modules & Configuration Sections */}
        <View style={styles.configGroupsList}>
          {filteredGroups.map((group, gIdx) => (
            <React.Fragment key={group.id}>
              {/* Group Container */}
              <View style={styles.groupSection}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupHeaderTitle}>{group.headerTitle}</Text>
                  <Text
                    style={[
                      styles.groupHeaderTag,
                      group.id === 'system_security' && styles.groupHeaderTagHighShield,
                    ]}
                  >
                    {group.headerTag}
                  </Text>
                </View>

                <View style={styles.groupCard}>
                  {group.items.map((item, idx) => {
                    return (
                      <React.Fragment key={item.id}>
                        <TouchableOpacity
                          style={styles.itemRow}
                          onPress={() => handleNavigate(item)}
                          activeOpacity={0.7}
                        >
                          {/* Item Icon */}
                          <View
                            style={[
                              styles.itemIconWrap,
                              item.iconBgType === 'secondary' && styles.itemIconSecondary,
                              item.iconBgType === 'tertiary' && styles.itemIconTertiary,
                              item.iconBgType === 'surface' && styles.itemIconSurface,
                            ]}
                          >
                            <MaterialIcons
                              name={item.icon}
                              size={20}
                              color={
                                item.iconBgType === 'secondary'
                                  ? '#00174B'
                                  : item.iconBgType === 'tertiary'
                                  ? '#009668'
                                  : '#191C1E'
                              }
                            />
                          </View>

                          {/* Item Text Col */}
                          <View style={styles.itemContentCol}>
                            <View style={styles.itemTitleRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {item.title}
                              </Text>
                              {item.badge && (
                                <View
                                  style={[
                                    styles.itemBadge,
                                    item.badgeType === 'success' && styles.itemBadgeSuccess,
                                    item.badgeType === 'info' && styles.itemBadgeInfo,
                                    item.badgeType === 'neutral' && styles.itemBadgeNeutral,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.itemBadgeText,
                                      item.badgeType === 'success' &&
                                        styles.itemBadgeTextSuccess,
                                      item.badgeType === 'info' && styles.itemBadgeTextInfo,
                                      item.badgeType === 'neutral' && styles.itemBadgeTextNeutral,
                                    ]}
                                  >
                                    {item.badge}
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.itemDescription} numberOfLines={1}>
                              {item.description}
                            </Text>
                          </View>

                          <MaterialIcons
                            name="chevron-right"
                            size={20}
                            color={Colors.outline}
                            style={styles.chevronIcon}
                          />
                        </TouchableOpacity>

                        {idx < group.items.length - 1 && <View style={styles.itemDivider} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* 3. System Status & Logout */}
        <View style={styles.footerSection}>
          <View style={styles.coreEngineCard}>
            <View style={styles.coreEngineHeader}>
              <MaterialIcons name="verified" size={16} color="#4EDEA3" />
              <Text style={styles.coreEngineTitle}>CHAIRCARE PLATFORM v1.0</Text>
            </View>
            <Text style={styles.coreEngineSub}>
              All platform services active • Secure &amp; Protected
            </Text>
          </View>

          {/* Root Logout Button */}
          <TouchableOpacity
            style={styles.rootLogoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <MaterialIcons name="power-settings-new" size={20} color="#93000A" />
            <Text style={styles.rootLogoutBtnText}>
              Log Out of Admin Account
            </Text>
          </TouchableOpacity>

          <Text style={styles.copyrightText}>
            CHAIRCARE TECHNOLOGIES PRIVATE LIMITED
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  desktopContainer: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  // Header
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#131B2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    justifyContent: 'center',
  },
  headerSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#0051D5',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: '#191C1E',
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: -1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  profileAvatarWrap: {
    position: 'relative',
    marginLeft: 4,
  },
  headerAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarActiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4EDEA3',
    borderWidth: 2,
    borderColor: '#F7F9FB',
  },
  // Scroll Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  // Sub-Header Bar
  subHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  subHeaderCol: {
    gap: 2,
  },
  subHeaderTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: '#191C1E',
  },
  subHeaderSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464D',
  },
  nodeLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E6E8EA',
  },
  nodeLivePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4EDEA3',
  },
  nodeLiveText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#009668',
  },
  // Root Profile Bento Card
  rootProfileCard: {
    backgroundColor: '#131B2E',
    borderRadius: 20,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  rootCardGlow: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 81, 213, 0.2)',
  },
  rootCardContent: {
    gap: 12,
  },
  rootCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rootCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  rootAvatarWrap: {
    position: 'relative',
  },
  rootAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  rootAvatarCheck: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4EDEA3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  rootNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rootName: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rootUid: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#7C839B',
    marginTop: 1,
  },
  fullAccessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 81, 213, 0.3)',
  },
  fullAccessBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#DBE1FF',
  },
  lastAuthBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastAuthCol: {
    gap: 1,
  },
  lastAuthLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: '#7C839B',
  },
  lastAuthValue: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  hardwareKeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  hardwareKeyText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#4EDEA3',
    fontWeight: '600',
  },
  manageRootLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  manageRootLinkText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#7C839B',
    fontWeight: '500',
  },
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E6E8EA',
  },
  searchInput: {
    flex: 1,
    ...Typography.bodySm,
    fontSize: 13,
    color: '#191C1E',
    padding: 0,
  },
  // Config Groups
  configGroupsList: {
    gap: 20,
  },
  groupSection: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  groupHeaderTitle: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#0051D5',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  groupHeaderTag: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#76777D',
  },
  groupHeaderTagHighShield: {
    backgroundColor: '#000000',
    color: '#4EDEA3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemIconSecondary: {
    backgroundColor: '#DBE1FF',
  },
  itemIconTertiary: {
    backgroundColor: '#6FFBBE',
  },
  itemIconSurface: {
    backgroundColor: '#E0E3E5',
  },
  itemContentCol: {
    flex: 1,
    minWidth: 0,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginBottom: 2,
  },
  itemTitle: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '600',
    color: '#191C1E',
    flex: 1,
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    flexShrink: 0,
  },
  itemBadgeSuccess: {
    backgroundColor: '#6FFBBE',
  },
  itemBadgeInfo: {
    backgroundColor: 'rgba(0, 81, 213, 0.1)',
  },
  itemBadgeNeutral: {
    backgroundColor: '#ECEEF0',
  },
  itemBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
  },
  itemBadgeTextSuccess: {
    color: '#009668',
  },
  itemBadgeTextInfo: {
    color: '#0051D5',
  },
  itemBadgeTextNeutral: {
    color: '#191C1E',
  },
  itemDescription: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464D',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F2F4F6',
    marginHorizontal: 14,
  },
  chevronIcon: {
    flexShrink: 0,
  },
  // Diagnostics Panel
  diagnosticsPanel: {
    backgroundColor: '#ECEEF0',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E3E5',
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diagnosticsTitle: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  diagnosticsTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  diagnosticsTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#0051D5',
    fontWeight: '700',
  },
  diagnosticsBody: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464D',
    lineHeight: 16,
  },
  gaugeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  gaugeCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  gaugeLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: '#76777D',
  },
  gaugeValue: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  gaugeBarTrack: {
    height: 6,
    backgroundColor: '#E6E8EA',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  gaugeBarFill: {
    height: '100%',
    backgroundColor: '#0051D5',
    borderRadius: 3,
  },
  // Footer
  footerSection: {
    gap: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  coreEngineCard: {
    width: '100%',
    backgroundColor: '#F2F4F6',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  coreEngineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coreEngineTitle: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#191C1E',
  },
  coreEngineSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#45464D',
    textAlign: 'center',
  },
  rootLogoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFDAD6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rootLogoutBtnText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#93000A',
  },
  copyrightText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#76777D',
    letterSpacing: 0.3,
  },
  // Bottom Tab Bar
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
  },
  tabLabel: {
    ...Typography.labelMd,
    fontSize: 10,
    color: '#45464D',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#0051D5',
    fontWeight: '700',
  },
  // Toast
  toastContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: '#2D3133',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  toastText: {
    ...Typography.bodySm,
    color: '#EFF1F3',
    fontWeight: '600',
    fontSize: 12,
  },
});
