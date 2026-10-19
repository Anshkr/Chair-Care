import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';

/**
 * Screen ID: A57
 * Title: Admin Profile (Priya Sharma / Selected Admin)
 * Folder: design-reference/admin/admin_profile_priya_sharma_chaircare_mobile
 */

export const AdminProfilePriyaSharmaChaircareMobileScreen: React.FC<{
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
  const { currentUser } = useAuth();

  // Selected admin data from route params or real logged-in currentUser
  const admin = route?.params?.adminUser || {
    id: currentUser?.id || 'ADM-0001',
    name: currentUser?.name || 'Super Administrator',
    email: currentUser?.email || 'admin@chaircare.com',
    phone: currentUser?.phone || '+91 98000 00000',
    role: currentUser?.role === 'admin' ? 'Super Admin' : 'Administrator',
    location: 'Gurugram Ops HQ',
    workstation: 'Command Hub • Station Ops-01',
    level: 'Tier-1 Root',
    dispatches: 'Active',
    slaScore: '100%',
    status: 'ACTIVE',
    avatarInitials: (currentUser?.name || 'AD')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase(),
    provisionedDate: 'System Active',
    provisionedBy: 'System Root',
    lastActive: 'Just now (Authenticated)',
  };

  // State
  const [isSuspended, setIsSuspended] = useState<boolean>(
    admin.status?.toLowerCase() === 'suspended'
  );
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

  const handleCopy = (text: string, label: string) => {
    showToast(`Copied ${label} to clipboard`);
  };

  const handleToggleSuspend = () => {
    Alert.alert(
      isSuspended ? 'Reactivate Administrator' : 'Suspend Administrator',
      isSuspended
        ? `Are you sure you want to restore administrative access for ${admin.name}?`
        : `Are you sure you want to suspend administrative access for ${admin.name}? This will immediately revoke active session tokens.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSuspended ? 'Reactivate' : 'Suspend Access',
          style: isSuspended ? 'default' : 'destructive',
          onPress: () => {
            setIsSuspended(!isSuspended);
            showToast(
              isSuspended
                ? `Account restored for ${admin.name}`
                : `Account suspended for ${admin.name}`
            );
          },
        },
      ]
    );
  };

  const handleEditPermissions = () => {
    if (navigation?.navigate) {
      navigation.navigate('EditPermissionsPriyaSharma', {
        adminId: admin.id,
        adminUser: admin,
      });
    }
  };

  return (
    <View style={[styles.screenContainer, { paddingTop: insets.top }]}>
      {/* Floating Toast Notification */}
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
            onPress={() => navigation?.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Profile</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="More options"
            onPress={() => showToast('Super Admin Session #SA-01')}
          >
            <MaterialIcons name="more-vert" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.headerAvatarThumb}>
            <Text style={styles.headerAvatarThumbText}>
              {admin.avatarInitials || 'PS'}
            </Text>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
          isDesktop && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Hero Identity Bento Card */}
        <View style={styles.heroCard}>
          {/* Ambient Glows */}
          <View style={styles.ambientGlowTopRight} />
          <View style={styles.ambientGlowBottomLeft} />

          {/* Avatar & Security Status Badge */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarContainer}>
              {admin.avatarUri ? (
                <Image
                  source={{ uri: admin.avatarUri }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {admin.avatarInitials || 'PS'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.statusDotWrap}>
              <View
                style={[
                  styles.statusDot,
                  isSuspended ? styles.statusDotSuspended : styles.statusDotActive,
                ]}
              />
            </View>
          </View>

          {/* Identity Details */}
          <View style={styles.identityDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.adminName}>{admin.name || 'Priya Sharma'}</Text>
              <MaterialIcons name="verified" size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.adminRole}>{admin.role || 'Operations Admin'}</Text>
          </View>

          {/* Active Badge & Location Tag */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.accountBadgePill,
                isSuspended ? styles.accountBadgePillSuspended : styles.accountBadgePillActive,
              ]}
            >
              <View
                style={[
                  styles.accountBadgeDot,
                  isSuspended ? styles.accountBadgeDotSuspended : styles.accountBadgeDotActive,
                ]}
              />
              <Text
                style={[
                  styles.accountBadgeText,
                  isSuspended ? styles.accountBadgeTextSuspended : styles.accountBadgeTextActive,
                ]}
              >
                {isSuspended ? 'Suspended Account' : 'Active Account'}
              </Text>
            </View>

            <View style={styles.locationPill}>
              <Text style={styles.locationPillText}>
                #{admin.id || 'ADM-9042'} • {admin.location || 'Gurugram Ops'}
              </Text>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.metricsStrip}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>LEVEL</Text>
              <Text style={styles.metricValue}>{admin.level || 'Tier-2'}</Text>
            </View>
            <View style={[styles.metricCol, styles.metricColBorder]}>
              <Text style={styles.metricLabel}>DISPATCHES</Text>
              <Text style={styles.metricValue}>{admin.dispatches || '1,420'}</Text>
            </View>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>SLA SCORE</Text>
              <Text style={[styles.metricValue, { color: Colors.secondary }]}>
                {admin.slaScore || '99.4%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact & Workstation Node Card ("Corporate Credentials") */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionHeaderIconWrap}>
                <MaterialIcons name="badge" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.sectionTitle}>Corporate Credentials</Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>VERIFIED</Text>
            </View>
          </View>

          <View style={styles.credentialsList}>
            {/* Corporate Email */}
            <View style={styles.credentialItem}>
              <View style={styles.credentialItemLeft}>
                <View style={styles.itemIconWrap}>
                  <MaterialIcons name="alternate-email" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.credentialTextCol}>
                  <Text style={styles.itemFieldLabel}>CORPORATE EMAIL</Text>
                  <Text style={styles.itemFieldValue} numberOfLines={1}>
                    {admin.email || 'admin@chaircare.pro'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => handleCopy(admin.email || 'admin@chaircare.pro', 'Email')}
                activeOpacity={0.7}
                accessibilityLabel="Copy Email"
              >
                <MaterialIcons name="content-copy" size={18} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Work Mobile */}
            <View style={styles.credentialItem}>
              <View style={styles.credentialItemLeft}>
                <View style={styles.itemIconWrap}>
                  <MaterialIcons name="call" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.credentialTextCol}>
                  <Text style={styles.itemFieldLabel}>WORK MOBILE</Text>
                  <Text style={styles.itemFieldValue} numberOfLines={1}>
                    {admin.phone || '+91 98201 44810'}
                  </Text>
                </View>
              </View>
              <View style={styles.dualActionRow}>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => showToast(`Calling ${admin.phone || '+91 98201 44810'}...`)}
                  activeOpacity={0.7}
                  accessibilityLabel="Call Mobile"
                >
                  <MaterialIcons name="phone-in-talk" size={18} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleCopy(admin.phone || '+91 98201 44810', 'Phone')}
                  activeOpacity={0.7}
                  accessibilityLabel="Copy Phone"
                >
                  <MaterialIcons name="content-copy" size={18} color={Colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Workstation Node */}
            <View style={styles.credentialItem}>
              <View style={styles.credentialItemLeft}>
                <View style={styles.itemIconWrap}>
                  <MaterialIcons name="pin-drop" size={18} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.credentialTextCol}>
                  <Text style={styles.itemFieldLabel}>WORKSTATION NODE</Text>
                  <Text style={styles.itemFieldValue} numberOfLines={1}>
                    {admin.workstation || 'DLF CyberCity Hub • Station Ops-04'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Access & Governance Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionHeaderIconWrap}>
                <MaterialIcons name="shield" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.sectionTitle}>Access &amp; Governance</Text>
            </View>
            <View style={styles.tierTag}>
              <Text style={styles.tierTagText}>{admin.level || 'Tier-2'}</Text>
            </View>
          </View>

          <View style={styles.governanceList}>
            {/* Account Provisioning */}
            <View style={styles.governanceItem}>
              <View style={styles.itemIconWrapSmall}>
                <MaterialIcons name="how-to-reg" size={16} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.governanceTextCol}>
                <Text style={styles.itemFieldLabel}>ACCOUNT PROVISIONING</Text>
                <Text style={styles.governanceValue}>
                  {admin.provisionedDate || '12 Aug 2026'} • by{' '}
                  <Text style={styles.governanceValueSub}>
                    {admin.provisionedBy || 'Ansh Kumar (Super Admin)'}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Last Active Session */}
            <View style={styles.governanceItem}>
              <View style={styles.itemIconWrapSmall}>
                <MaterialIcons name="devices" size={16} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.governanceTextCol}>
                <Text style={styles.itemFieldLabel}>LAST ACTIVE SESSION</Text>
                <Text style={styles.governanceValue}>
                  {admin.lastActive || 'Today • 10:15 AM'}{' '}
                  <Text style={styles.governanceValueSub}>(via Mobile Console)</Text>
                </Text>
              </View>
            </View>

            {/* Authentication Policy */}
            <View style={styles.governanceItem}>
              <View style={styles.itemIconWrapSmall}>
                <MaterialIcons name="vpn-key" size={16} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.governanceTextCol}>
                <Text style={styles.itemFieldLabel}>AUTHENTICATION POLICY</Text>
                <View style={styles.authPolicyRow}>
                  <MaterialIcons name="check-circle" size={14} color="#009668" />
                  <Text style={styles.governanceValue}>
                    Hardware Key &amp; Authenticator Enabled
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Permissions Breakdown Section ("Permissions Summary") */}
        <View style={styles.sectionCard}>
          <View style={styles.permissionSummaryHeader}>
            <Text style={styles.sectionTitle}>Permissions Summary</Text>
            <Text style={styles.permissionSummarySub}>5 ENABLED • 3 RESTRICTED</Text>
          </View>

          {/* Operational Authorities (Enabled) */}
          <View style={styles.permissionCategoryCol}>
            <Text style={styles.permissionCategoryLabel}>OPERATIONAL AUTHORITIES</Text>

            {[
              'Service Requests & Dispatch',
              'Active Jobs & Fleet Telemetry',
              'Customer Bookings & Scheduling',
              'Technician Management & Routing',
              'Customer Management & Audits',
            ].map((perm, idx) => (
              <View key={idx} style={styles.enabledPermItem}>
                <View style={styles.checkCircleBadge}>
                  <MaterialIcons name="check" size={14} color="#6FFBBE" />
                </View>
                <Text style={styles.enabledPermText}>{perm}</Text>
              </View>
            ))}
          </View>

          {/* Restricted Controls */}
          <View style={styles.permissionCategoryCol}>
            <Text style={styles.restrictedCategoryLabel}>RESTRICTED CONTROLS</Text>

            {[
              {
                title: 'Payments, Escrow & Invoices',
                sub: 'Restricted to Finance & Super Admin',
              },
              {
                title: 'Platform System Settings & API Keys',
                sub: 'Super Admin Only',
              },
              {
                title: 'Admin Management & Role Allocation',
                sub: 'Super Admin Only',
              },
            ].map((perm, idx) => (
              <View key={idx} style={styles.restrictedPermItem}>
                <View style={styles.lockCircleBadge}>
                  <MaterialIcons name="lock" size={14} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.restrictedTextCol}>
                  <Text style={styles.restrictedPermTitle}>{perm.title}</Text>
                  <Text style={styles.restrictedPermSub}>{perm.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Administrative Activity Logs ("Recent Logs") */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionHeaderIconWrap}>
                <MaterialIcons name="history" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <Text style={styles.sectionTitle}>Recent Logs</Text>
            </View>
            <Text style={styles.liveAuditTag}>LIVE AUDIT</Text>
          </View>

          <View style={styles.logsList}>
            {/* Log 1 */}
            <View style={styles.logItem}>
              <View style={[styles.logDot, { backgroundColor: Colors.secondary }]} />
              <View style={styles.logTextCol}>
                <Text style={styles.logBody}>
                  Assigned Tech <Text style={styles.logHighlight}>Rahul Sharma</Text> to Ticket{' '}
                  <Text style={styles.logTicketCode}>#CC-10483</Text>
                </Text>
                <Text style={styles.logTimestamp}>Today • 09:40 AM</Text>
              </View>
            </View>

            {/* Log 2 */}
            <View style={styles.logItem}>
              <View style={[styles.logDot, { backgroundColor: '#C6C6CD' }]} />
              <View style={styles.logTextCol}>
                <Text style={styles.logBody}>
                  Approved Technician <Text style={styles.logHighlight}>Vikram Singh</Text>{' '}
                  document review
                </Text>
                <Text style={styles.logTimestamp}>Yesterday • 05:22 PM</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleEditPermissions}
            activeOpacity={0.85}
          >
            <MaterialIcons name="admin-panel-settings" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionBtnText}>Edit Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              isSuspended && styles.secondaryActionBtnReactivate,
            ]}
            onPress={handleToggleSuspend}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={isSuspended ? 'lock-open' : 'block'}
              size={20}
              color={isSuspended ? '#005236' : '#93000A'}
            />
            <Text
              style={[
                styles.secondaryActionBtnText,
                isSuspended && styles.secondaryActionBtnTextReactivate,
              ]}
            >
              {isSuspended ? 'Reactivate Admin Access' : 'Suspend Admin Access'}
            </Text>
          </TouchableOpacity>
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
  // Hero Identity Bento Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6E8EA',
  },
  ambientGlowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(219, 225, 255, 0.5)',
  },
  ambientGlowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(111, 251, 190, 0.35)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#131B2E',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
    backgroundColor: '#DBE1FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    ...Typography.headlineLg,
    fontSize: 28,
    color: '#00174B',
    fontWeight: '700',
  },
  statusDotWrap: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  statusDotActive: {
    backgroundColor: '#009668',
  },
  statusDotSuspended: {
    backgroundColor: '#BA1A1A',
  },
  identityDetails: {
    alignItems: 'center',
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminName: {
    ...Typography.headlineMd,
    fontSize: 22,
    fontWeight: '700',
    color: '#191C1E',
    letterSpacing: -0.2,
  },
  adminRole: {
    ...Typography.titleLg,
    fontSize: 15,
    color: '#45464D',
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  accountBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  accountBadgePillActive: {
    backgroundColor: '#002113',
  },
  accountBadgePillSuspended: {
    backgroundColor: '#FFDAD6',
  },
  accountBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accountBadgeDotActive: {
    backgroundColor: '#6FFBBE',
  },
  accountBadgeDotSuspended: {
    backgroundColor: '#BA1A1A',
  },
  accountBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
  },
  accountBadgeTextActive: {
    color: '#6FFBBE',
  },
  accountBadgeTextSuspended: {
    color: '#93000A',
  },
  locationPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#E6E8EA',
  },
  locationPillText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#45464D',
    fontWeight: '600',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    backgroundColor: '#F2F4F6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricColBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E0E3E5',
  },
  metricLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#45464D',
    letterSpacing: 0.5,
  },
  metricValue: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '700',
    color: '#191C1E',
  },
  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: '#191C1E',
  },
  verifiedTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#E6E8EA',
  },
  verifiedTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#45464D',
  },
  tierTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
    backgroundColor: '#DBE1FF',
  },
  tierTagText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#003EA8',
  },
  credentialsList: {
    gap: 8,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
  },
  credentialItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  credentialTextCol: {
    flex: 1,
    minWidth: 0,
  },
  itemFieldLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#45464D',
  },
  itemFieldValue: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: '#191C1E',
    marginTop: 1,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dualActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  governanceList: {
    gap: 8,
  },
  governanceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
  },
  itemIconWrapSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  governanceTextCol: {
    flex: 1,
    minWidth: 0,
  },
  governanceValue: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#191C1E',
    marginTop: 1,
  },
  governanceValueSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464D',
  },
  authPolicyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  // Permissions Breakdown
  permissionSummaryHeader: {
    gap: 2,
  },
  permissionSummarySub: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#45464D',
    fontWeight: '600',
  },
  permissionCategoryCol: {
    gap: 8,
  },
  permissionCategoryLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#009668',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  restrictedCategoryLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#45464D',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  enabledPermItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
  },
  checkCircleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#002113',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  enabledPermText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: '#191C1E',
  },
  restrictedPermItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#ECEEF0',
    opacity: 0.88,
  },
  lockCircleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  restrictedTextCol: {
    flex: 1,
  },
  restrictedPermTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: '#191C1E',
  },
  restrictedPermSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#45464D',
    marginTop: 1,
  },
  // Recent Logs
  liveAuditTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondary,
  },
  logsList: {
    gap: 8,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F2F4F6',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  logTextCol: {
    flex: 1,
    minWidth: 0,
  },
  logBody: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#191C1E',
    lineHeight: 18,
  },
  logHighlight: {
    fontWeight: '700',
  },
  logTicketCode: {
    ...Typography.labelMono,
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 12,
  },
  logTimestamp: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#45464D',
    marginTop: 3,
  },
  // Actions
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  primaryActionBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#131B2E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryActionBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFDAD6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionBtnReactivate: {
    backgroundColor: '#E6F9F0',
  },
  secondaryActionBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#93000A',
  },
  secondaryActionBtnTextReactivate: {
    color: '#005236',
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
