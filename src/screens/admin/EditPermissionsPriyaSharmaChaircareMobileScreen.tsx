import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { Typography } from '../../constants/typography';

/**
 * Screen ID: A56
 * Title: Edit Permissions (Priya Sharma / Selected Admin)
 * Folder: design-reference/admin/edit_permissions_priya_sharma_chaircare_mobile
 */

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  superAdminOnly?: boolean;
}

interface PermissionGroup {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'ops',
    title: 'Operations & Dispatch',
    subtitle: 'Core Dispatch & Field Telemetry',
    icon: 'alt-route',
    items: [
      {
        id: 'ops_requests',
        title: 'Service Requests',
        description: 'Create, edit, and cancel platform requests',
      },
      {
        id: 'ops_bookings',
        title: 'Bookings & Scheduling',
        description: 'Modify visit windows and calendar slots',
      },
      {
        id: 'ops_telemetry',
        title: 'Active Jobs & Telemetry',
        description: 'Live GPS corridor monitoring',
      },
      {
        id: 'ops_assignment',
        title: 'Technician Assignment',
        description: 'Manual technician dispatch override',
      },
    ],
  },
  {
    id: 'people',
    title: 'People Management',
    subtitle: 'Accounts, Verification & Access',
    icon: 'group',
    items: [
      {
        id: 'people_customers',
        title: 'Customer Management',
        description: 'View profiles, audit history, account blocks',
      },
      {
        id: 'people_technicians',
        title: 'Technician Verification',
        description: 'Review documents, verify BIFMA certs',
      },
      {
        id: 'people_admins',
        title: 'Admin Users',
        description: 'Provision system roles and elevated scopes',
        superAdminOnly: true,
      },
    ],
  },
  {
    id: 'finance',
    title: 'Finance & Payments',
    subtitle: 'Escrow, Payouts & Direct Banking',
    icon: 'account-balance-wallet',
    items: [
      {
        id: 'fin_escrow',
        title: 'Payments & Escrow',
        description: 'View gateway balances and payouts',
      },
      {
        id: 'fin_refunds',
        title: 'Refunds & Chargebacks',
        description: 'Authorize direct banking reversals',
      },
      {
        id: 'fin_disputes',
        title: 'Dispute Mediation',
        description: 'Resolve financial transaction claims',
      },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics & Telemetry',
    subtitle: 'Fleet Indices & Aggregates',
    icon: 'insights',
    items: [
      {
        id: 'analytics_reports',
        title: 'Reports & Analytics',
        description: 'View GMV, completion rates, fleet metrics',
      },
    ],
  },
  {
    id: 'system',
    title: 'System Settings & Logs',
    subtitle: 'Cryptographic Keys & Telemetry Hooks',
    icon: 'terminal',
    items: [
      {
        id: 'sys_notifs',
        title: 'Push & SMS Notifications',
        description: 'Broadcast alerts & cellular carrier gateway templates',
      },
      {
        id: 'sys_logs',
        title: 'Cryptographic Activity Logs',
        description: 'Inspect raw append-only ledger transaction blocks',
      },
      {
        id: 'sys_api',
        title: 'Platform API Keys & Webhooks',
        description: 'Manage developer ingress tokens and signing secrets',
      },
    ],
  },
];

const INITIAL_SELECTED_PERMISSIONS: Record<string, boolean> = {
  ops_requests: true,
  ops_bookings: true,
  ops_telemetry: true,
  ops_assignment: true,
  people_customers: true,
  people_technicians: true,
  people_admins: false,
  fin_escrow: false,
  fin_refunds: false,
  fin_disputes: false,
  analytics_reports: true,
  sys_notifs: false,
  sys_logs: false,
  sys_api: false,
};

export const EditPermissionsPriyaSharmaChaircareMobileScreen: React.FC<{
  navigation?: any;
  route?: {
    params?: {
      adminId?: string;
      adminUser?: any;
      updatedPermissions?: any;
    };
  };
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Selected admin data from route params or fallback to Priya Sharma reference
  const adminData = route?.params?.adminUser || {
    id: 'OP-ADM-8824-A',
    name: 'Priya Sharma',
    email: 'priya.ops@chaircare.corp',
    role: 'Operations Admin',
    status: 'ACTIVE',
    avatarInitials: 'PS',
  };

  // State of selected permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, boolean>>({
    ...INITIAL_SELECTED_PERMISSIONS,
    ...(route?.params?.updatedPermissions || {}),
  });

  // Collapsible state for each section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ops: true,
    people: true,
    finance: true,
    analytics: true,
    system: true,
  });

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

  const toggleSection = (groupId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const togglePermission = (permId: string) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [permId]: !prev[permId],
    }));
  };

  const handleSave = () => {
    showToast('Permissions updated and signed to audit log');
    // Save updated permissions and navigate back or to admin profile after short confirmation delay
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('AdminUsers');
      }
    }, 1200);
  };

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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Permissions</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="More options"
            onPress={() => showToast('Audit trail active: SA-01')}
          >
            <MaterialIcons name="more-vert" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.headerAvatarThumb}>
            <Text style={styles.headerAvatarThumbText}>
              {adminData.avatarInitials || 'PS'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 130 },
          isDesktop && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Target Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {adminData.avatarInitials || 'PS'}
                </Text>
              </View>
              <View style={styles.activeIndicatorRing} />
            </View>

            <View style={styles.adminInfoCol}>
              <View style={styles.adminNameRow}>
                <Text style={styles.adminName} numberOfLines={1}>
                  {adminData.name || 'Priya Sharma'}
                </Text>
                <View style={styles.activeBadgePill}>
                  <View style={styles.activePulseDot} />
                  <Text style={styles.activeBadgeText}>
                    {adminData.status ? adminData.status.toUpperCase() : 'ACTIVE'}
                  </Text>
                </View>
              </View>
              <Text style={styles.adminRole}>{adminData.role || 'Operations Admin'}</Text>
              <Text style={styles.adminId}>ID: {adminData.id || 'OP-ADM-8824-A'}</Text>
            </View>
          </View>

          {/* Sub banner note */}
          <View style={styles.subBanner}>
            <MaterialIcons name="admin-panel-settings" size={18} color={Colors.secondary} />
            <Text style={styles.subBannerText}>
              Customizing granular system access tokens for this administrator.
            </Text>
          </View>
        </View>

        {/* Sensitive Privilege Alert Box */}
        <View style={styles.alertCard}>
          <MaterialIcons
            name="warning"
            size={22}
            color="#B45309"
            style={styles.alertIcon}
          />
          <View style={styles.alertTextCol}>
            <Text style={styles.alertTitle}>Sensitive Data Access Notice</Text>
            <Text style={styles.alertBody}>
              Enabling Finance or System permissions gives this user access to sensitive
              platform transactions and infrastructure configurations. All changes are logged
              to the cryptographic master audit log.
            </Text>
          </View>
        </View>

        {/* Module Permissions Accordion / Cards List */}
        <View style={styles.moduleList}>
          {PERMISSION_GROUPS.map((group) => {
            const isExpanded = expandedSections[group.id] ?? true;
            const enabledCount = group.items.filter((item) => selectedPermissions[item.id]).length;
            const totalCount = group.items.length;
            const hasAnyEnabled = enabledCount > 0;

            return (
              <View key={group.id} style={styles.moduleCard}>
                {/* Accordion Header */}
                <TouchableOpacity
                  style={styles.moduleHeader}
                  onPress={() => toggleSection(group.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.moduleHeaderLeft}>
                    <MaterialIcons name={group.icon} size={20} color={Colors.secondary} />
                    <View style={styles.moduleHeaderTitleCol}>
                      <Text style={styles.moduleTitle}>{group.title}</Text>
                      <Text style={styles.moduleSubtitle}>{group.subtitle}</Text>
                    </View>
                  </View>

                  <View style={styles.moduleHeaderRight}>
                    <View
                      style={[
                        styles.badgeCount,
                        hasAnyEnabled ? styles.badgeCountActive : styles.badgeCountInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeCountText,
                          hasAnyEnabled
                            ? styles.badgeCountTextActive
                            : styles.badgeCountTextInactive,
                        ]}
                      >
                        {`${enabledCount}/${totalCount} Enabled`}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={20}
                      color={Colors.outline}
                    />
                  </View>
                </TouchableOpacity>

                {/* Accordion Content */}
                {isExpanded && (
                  <View style={styles.moduleContent}>
                    {group.items.map((item, index) => {
                      const isChecked = !!selectedPermissions[item.id];
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.permissionItemRow,
                            index < group.items.length - 1 && styles.permissionItemBorder,
                          ]}
                          onPress={() => togglePermission(item.id)}
                          activeOpacity={0.7}
                        >
                          {/* Checkbox */}
                          <View
                            style={[
                              styles.checkboxBox,
                              isChecked && styles.checkboxBoxChecked,
                            ]}
                          >
                            {isChecked && (
                              <MaterialIcons name="check" size={15} color="#FFFFFF" />
                            )}
                          </View>

                          {/* Item Labels */}
                          <View style={styles.permissionItemTextCol}>
                            <View style={styles.permissionTitleRow}>
                              <Text
                                style={[
                                  styles.permissionItemTitle,
                                  isChecked && styles.permissionItemTitleChecked,
                                ]}
                              >
                                {item.title}
                              </Text>
                              {item.superAdminOnly && (
                                <View style={styles.superAdminPill}>
                                  <Text style={styles.superAdminPillText}>
                                    Super Admin Only
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.permissionItemDescription}>
                              {item.description}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <MaterialIcons name="verified-user" size={19} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save Permissions (Confirm)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.discardBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.discardBtnText}>Discard Changes</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    height: 56,
    paddingHorizontal: 8,
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
    gap: 4,
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: '#191C1E',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerAvatarThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBE1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  headerAvatarThumbText: {
    ...Typography.labelMono,
    color: '#00174B',
    fontWeight: '700',
    fontSize: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBE1FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarText: {
    ...Typography.headlineSm,
    color: '#00174B',
    fontWeight: '700',
  },
  activeIndicatorRing: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4EDEA3',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  adminNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  adminName: {
    ...Typography.headlineSm,
    fontSize: 18,
    color: '#191C1E',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  activeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#002113',
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  activeBadgeText: {
    ...Typography.labelMono,
    color: '#009668',
    fontSize: 10,
    fontWeight: '700',
  },
  adminRole: {
    ...Typography.bodyMd,
    color: '#45464D',
    fontWeight: '500',
    marginTop: 2,
  },
  adminId: {
    ...Typography.labelMono,
    color: '#76777D',
    fontSize: 11,
    marginTop: 2,
  },
  subBanner: {
    backgroundColor: '#F2F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subBannerText: {
    ...Typography.bodySm,
    color: '#45464D',
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  // Sensitive Alert Card
  alertCard: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  alertIcon: {
    marginTop: 2,
  },
  alertTextCol: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#78350F',
    letterSpacing: -0.1,
  },
  alertBody: {
    ...Typography.bodySm,
    color: '#92400E',
    lineHeight: 18,
  },
  // Module Cards
  moduleList: {
    gap: 14,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  moduleHeader: {
    padding: 14,
    backgroundColor: '#F2F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moduleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  moduleHeaderTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  moduleTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
    letterSpacing: -0.1,
  },
  moduleSubtitle: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#45464D',
    marginTop: 1,
  },
  moduleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  badgeCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeCountActive: {
    backgroundColor: '#DBE1FF',
  },
  badgeCountInactive: {
    backgroundColor: '#ECEEF0',
  },
  badgeCountText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
  },
  badgeCountTextActive: {
    color: '#00174B',
  },
  badgeCountTextInactive: {
    color: '#45464D',
  },
  moduleContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  permissionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  permissionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#76777D',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    borderColor: '#0051D5',
    backgroundColor: '#0051D5',
  },
  permissionItemTextCol: {
    flex: 1,
    minWidth: 0,
  },
  permissionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  permissionItemTitle: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '600',
    color: '#191C1E',
  },
  permissionItemTitleChecked: {
    color: '#191C1E',
  },
  superAdminPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#ECEEF0',
  },
  superAdminPillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#45464D',
  },
  permissionItemDescription: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464D',
    marginTop: 2,
    lineHeight: 16,
  },
  // Bottom Sticky Action Footer
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderTopWidth: 1,
    borderTopColor: '#E6E8EA',
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  saveBtnText: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  discardBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  discardBtnText: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '600',
    color: '#45464D',
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
