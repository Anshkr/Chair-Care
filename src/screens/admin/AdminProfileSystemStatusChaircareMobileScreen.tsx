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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api/adminApi';

/**
 * Screen ID: A58
 * Title: Admin Profile / System Status & Telemetry
 * Folder: design-reference/admin/admin_profile_system_status_chaircare_mobile
 */

export const AdminProfileSystemStatusChaircareMobileScreen: React.FC<{
  navigation?: any;
  route?: {
    params?: {
      adminUser?: any;
    };
  };
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { currentUser, logout } = useAuth();

  const [systemTelemetry, setSystemTelemetry] = useState<any>(null);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await adminApi.getSystemStatus();
        if (res.data) {
          setSystemTelemetry(res.data);
        }
      } catch (err) {
        console.warn('Telemetry fetch error:', err);
      }
    };
    fetchStatus();
  }, []);

  // Selected or current admin context
  const admin = route?.params?.adminUser || {
    name: currentUser?.name || 'Super Admin',
    email: currentUser?.email || 'admin@chaircare.pro',
    role: 'Super Admin',
    tier: 'Tier 1 Master',
    sessionId: `SESSION #${(currentUser?.id || '8849').slice(0, 6).toUpperCase()}`,
    lastAuth: 'Today • Authenticated',
    ip: '103.21.244.12 • Gurugram HQ',
    avatarUri:
      currentUser?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  };

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

  const handleLogout = () => {
    showToast('Session terminated successfully');
    logout();
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
            <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Profile</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            accessibilityLabel="Settings"
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('AdminSettings');
              } else {
                showToast('Admin Settings');
              }
            }}
          >
            <MaterialIcons name="settings" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <View style={styles.headerAvatarWrap}>
            <MaterialIcons name="person" size={18} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Main Scroll View */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
          isDesktop && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Profile Hero Card */}
        <View style={styles.heroCard}>
          {/* Subtle architectural backdrop tints */}
          <View style={styles.ambientGlowTopRight} />
          <View style={styles.ambientGlowBottomLeft} />

          {/* Avatar & Verified Badge */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarImageContainer}>
              <Image
                source={{ uri: admin.avatarUri }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.verifiedBadgeWrap}>
              <MaterialIcons name="verified-user" size={16} color="#FFFFFF" />
            </View>
          </View>

          {/* Identity Text */}
          <Text style={styles.adminHeroName}>{admin.name || 'Super Admin'}</Text>
          <Text style={styles.adminHeroEmail}>{admin.email || 'admin@chaircare.pro'}</Text>

          {/* Access Badge */}
          <View style={styles.accessBadgePill}>
            <View style={styles.accessBadgePulseDot} />
            <Text style={styles.accessBadgeText}>
              FULL ACCESS • {admin.tier ? admin.tier.toUpperCase() : 'TIER 1 MASTER'}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => showToast('Editing privileged credentials active')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="tune" size={16} color={Colors.onSurfaceVariant} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Access Scope & Session Metadata Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sessionSectionTitle}>ACCESS SCOPE &amp; SESSION</Text>
            <Text style={styles.sessionTag}>{admin.sessionId || 'SESSION #8849'}</Text>
          </View>

          <View style={styles.sessionItemsList}>
            {/* Platform Role */}
            <View style={styles.sessionItem}>
              <View style={styles.itemIconWrap}>
                <MaterialIcons name="badge" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.sessionItemCol}>
                <Text style={styles.itemFieldLabel}>Platform Role</Text>
                <Text style={styles.itemFieldValueBold}>{admin.role || 'Super Admin'}</Text>
              </View>
            </View>

            {/* Access Authority */}
            <View style={styles.sessionItem}>
              <View style={styles.itemIconWrap}>
                <MaterialIcons name="domain-verification" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.sessionItemCol}>
                <Text style={styles.itemFieldLabel}>Access Authority</Text>
                <Text style={styles.itemFieldValue}>
                  All Platform Operations (Customer, Tech, Finance, API)
                </Text>
              </View>
            </View>

            {/* Last Authenticated */}
            <View style={styles.sessionItem}>
              <View style={styles.itemIconWrap}>
                <MaterialIcons name="history" size={18} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.sessionItemCol}>
                <Text style={styles.itemFieldLabel}>Last Authenticated</Text>
                <Text style={styles.itemFieldValue}>{admin.lastAuth || 'Today • 9:42 AM'}</Text>
                <Text style={styles.itemFieldSubMono}>
                  IP: {admin.ip || '103.21.244.12 • Gurugram HQ'}
                </Text>
              </View>
            </View>

            {/* Hardware Security Key */}
            <View style={styles.sessionItem}>
              <View style={[styles.itemIconWrap, styles.itemIconWrapGreen]}>
                <MaterialIcons name="security" size={18} color="#005236" />
              </View>
              <View style={styles.sessionItemCol}>
                <Text style={styles.itemFieldLabel}>Hardware Security Key</Text>
                <View style={styles.securityKeyActiveRow}>
                  <View style={styles.greenDotSmall} />
                  <Text style={styles.securityKeyActiveText}>Hardware Token 2FA Active</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Live Telemetry / System Status Section */}
        <View style={styles.telemetrySection}>
          <View style={styles.telemetryHeader}>
            <View style={styles.telemetryHeaderLeft}>
              <MaterialIcons name="speed" size={20} color={Colors.secondary} />
              <Text style={styles.telemetrySectionTitle}>System Status</Text>
            </View>
            <View style={styles.allOperationalBadge}>
              <View style={styles.operationalGreenDot} />
              <Text style={styles.allOperationalText}>All Systems Operational</Text>
            </View>
          </View>

          {/* 4 Status Cards */}
          <View style={styles.statusCardsList}>
            {/* 1. API Operational */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardIconWrap}>
                <MaterialIcons name="hub" size={20} color="#009668" />
              </View>
              <View style={styles.statusCardContent}>
                <View style={styles.statusCardTitleRow}>
                  <View style={styles.statusTitleWithDot}>
                    <View style={styles.operationalGreenDot} />
                    <Text style={styles.statusCardTitle}>API &amp; Neon DB</Text>
                  </View>
                  <Text style={styles.statusCardMetric}>
                    {systemTelemetry?.dbConnected ? 'Online' : 'Connected'}
                  </Text>
                </View>
                <Text style={styles.statusCardSub}>
                  {systemTelemetry?.uptimeSeconds
                    ? `Neon PostgreSQL • ${systemTelemetry.uptimeSeconds}s uptime`
                    : 'Response: 24ms • REST API v1.0'}
                </Text>
              </View>
            </View>

            {/* 2. Platform Records */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardIconWrap}>
                <MaterialIcons name="people" size={20} color="#009668" />
              </View>
              <View style={styles.statusCardContent}>
                <View style={styles.statusCardTitleRow}>
                  <View style={styles.statusTitleWithDot}>
                    <View style={styles.operationalGreenDot} />
                    <Text style={styles.statusCardTitle}>Registered Accounts</Text>
                  </View>
                  <Text style={styles.statusCardMetric}>
                    {systemTelemetry?.stats ? `${systemTelemetry.stats.user_count} Users` : 'Active'}
                  </Text>
                </View>
                <Text style={styles.statusCardSub}>
                  {systemTelemetry?.stats
                    ? `${systemTelemetry.stats.tech_count} Technicians • ${systemTelemetry.stats.request_count} Requests`
                    : 'Customer & technician entities synchronized'}
                </Text>
              </View>
            </View>

            {/* 3. Support Queue */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardIconWrap}>
                <MaterialIcons name="support-agent" size={20} color="#009668" />
              </View>
              <View style={styles.statusCardContent}>
                <View style={styles.statusCardTitleRow}>
                  <View style={styles.statusTitleWithDot}>
                    <View style={styles.operationalGreenDot} />
                    <Text style={styles.statusCardTitle}>Support Tickets</Text>
                  </View>
                  <Text style={styles.statusCardMetric}>
                    {systemTelemetry?.stats ? `${systemTelemetry.stats.ticket_count} Total` : '0 Queue'}
                  </Text>
                </View>
                <Text style={styles.statusCardSub}>Real-time triage and customer escalation</Text>
              </View>
            </View>

            {/* 4. Payments Operational */}
            <View style={styles.statusCard}>
              <View style={styles.statusCardIconWrap}>
                <MaterialIcons name="credit-card" size={20} color="#009668" />
              </View>
              <View style={styles.statusCardContent}>
                <View style={styles.statusCardTitleRow}>
                  <View style={styles.statusTitleWithDot}>
                    <View style={styles.operationalGreenDot} />
                    <Text style={styles.statusCardTitle}>Payments &amp; Ledger</Text>
                  </View>
                  <Text style={styles.statusCardMetric}>
                    {systemTelemetry?.stats ? `${systemTelemetry.stats.payment_count} Records` : 'Live'}
                  </Text>
                </View>
                <Text style={styles.statusCardSub}>Razorpay &amp; UPI settlements synchronized</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security & Governance Section */}
        <View style={styles.telemetrySection}>
          <View style={styles.telemetryHeader}>
            <Text style={styles.telemetrySectionTitle}>Security &amp; Governance</Text>
            <Text style={styles.isoTag}>ISO 27001</Text>
          </View>

          <View style={styles.governanceCard}>
            {/* Change Password */}
            <TouchableOpacity
              style={styles.governanceNavRow}
              onPress={() => showToast('Password security token checked')}
              activeOpacity={0.7}
            >
              <View style={styles.governanceNavLeft}>
                <View style={styles.governanceNavIconWrap}>
                  <MaterialIcons name="vpn-key" size={20} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.governanceNavTextCol}>
                  <Text style={styles.governanceNavTitle}>Change Password</Text>
                  <Text style={styles.governanceNavSub}>Last changed 18 days ago</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            </TouchableOpacity>

            {/* Two-Factor Authentication */}
            <TouchableOpacity
              style={styles.governanceNavRow}
              onPress={() => showToast('2FA token verified')}
              activeOpacity={0.7}
            >
              <View style={styles.governanceNavLeft}>
                <View style={styles.governanceNavIconWrap}>
                  <MaterialIcons name="phonelink-lock" size={20} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.governanceNavTextCol}>
                  <Text style={styles.governanceNavTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.governanceNavSub}>Enforced • Authenticator App</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            </TouchableOpacity>

            {/* Login Activity & Audit Logs */}
            <TouchableOpacity
              style={styles.governanceNavRow}
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('ActivityLogs');
                } else {
                  showToast('Navigating to Audit Logs');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.governanceNavLeft}>
                <View style={styles.governanceNavIconWrap}>
                  <MaterialIcons name="shield" size={20} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.governanceNavTextCol}>
                  <Text style={styles.governanceNavTitle}>Login Activity &amp; Audit Logs</Text>
                  <Text style={styles.governanceNavSub}>View all 48 recent access attempts</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            </TouchableOpacity>

            {/* Platform API Keys & Webhooks */}
            <TouchableOpacity
              style={[styles.governanceNavRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('PlatformConfiguration');
                } else {
                  showToast('Platform API Keys & Webhooks');
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.governanceNavLeft}>
                <View style={styles.governanceNavIconWrap}>
                  <MaterialIcons name="webhook" size={20} color={Colors.onSurfaceVariant} />
                </View>
                <View style={styles.governanceNavTextCol}>
                  <Text style={styles.governanceNavTitle}>Platform API Keys &amp; Webhooks</Text>
                  <Text style={styles.governanceNavSub}>4 production endpoints connected</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Actions & Footer */}
        <View style={styles.bottomSection}>
          {/* Danger Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <MaterialIcons name="logout" size={20} color="#BA1A1A" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>

          {/* System Build Footer */}
          <View style={styles.buildFooter}>
            <Text style={styles.buildFooterText}>
              ChairCare Enterprise Core v2.4.0 (Build 890){'\n'}
              <Text style={styles.buildFooterSub}>Confidential Administrator Interface</Text>
            </Text>
          </View>
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
    paddingHorizontal: 12,
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
    gap: 6,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    color: '#191C1E',
    fontWeight: '700',
    letterSpacing: -0.2,
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
    borderRadius: 8,
  },
  headerAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  ambientGlowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadgeWrap: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0051D5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  adminHeroName: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '700',
    color: '#191C1E',
    letterSpacing: -0.2,
  },
  adminHeroEmail: {
    ...Typography.bodyMd,
    fontSize: 14,
    color: '#45464D',
    fontWeight: '500',
    marginTop: 2,
  },
  accessBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 33, 19, 0.08)',
    marginTop: 10,
  },
  accessBadgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  accessBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#009668',
    letterSpacing: 0.3,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F4F6',
    marginTop: 14,
  },
  editProfileBtnText: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '600',
    color: '#191C1E',
  },
  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionSectionTitle: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#45464D',
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sessionTag: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#0051D5',
    fontWeight: '600',
  },
  sessionItemsList: {
    gap: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F2F4F6',
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0E3E5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  itemIconWrapGreen: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
  },
  sessionItemCol: {
    flex: 1,
    minWidth: 0,
  },
  itemFieldLabel: {
    ...Typography.labelMd,
    fontSize: 11,
    color: '#45464D',
  },
  itemFieldValueBold: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
    marginTop: 1,
  },
  itemFieldValue: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '500',
    color: '#191C1E',
    marginTop: 1,
    lineHeight: 18,
  },
  itemFieldSubMono: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#45464D',
    marginTop: 3,
  },
  securityKeyActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  securityKeyActiveText: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '600',
    color: '#009668',
  },
  // Telemetry / System Status
  telemetrySection: {
    gap: 10,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  telemetryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telemetrySectionTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191C1E',
  },
  allOperationalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E0E3E5',
  },
  operationalGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  allOperationalText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: '#191C1E',
  },
  statusCardsList: {
    gap: 8,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 33, 19, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  statusCardContent: {
    flex: 1,
    minWidth: 0,
  },
  statusCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  statusTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusCardTitle: {
    ...Typography.bodySm,
    fontSize: 13,
    fontWeight: '700',
    color: '#191C1E',
  },
  statusCardMetric: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: '#009668',
  },
  statusCardSub: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#45464D',
    marginTop: 3,
  },
  // Governance Nav Cards
  isoTag: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#45464D',
    fontWeight: '600',
  },
  governanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  governanceNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F6',
  },
  governanceNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  governanceNavIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECEEF0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  governanceNavTextCol: {
    flex: 1,
    minWidth: 0,
  },
  governanceNavTitle: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '600',
    color: '#191C1E',
  },
  governanceNavSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#45464D',
    marginTop: 1,
  },
  // Bottom
  bottomSection: {
    gap: 14,
    marginTop: 4,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 14,
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
  logoutBtnText: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '700',
    color: '#BA1A1A',
  },
  buildFooter: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buildFooterText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#76777D',
    textAlign: 'center',
    lineHeight: 16,
  },
  buildFooterSub: {
    color: 'rgba(69, 70, 77, 0.8)',
    fontWeight: '600',
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
