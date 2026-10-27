import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';
import { adminApi, TemporaryPasswordRequestItem } from '../../services/api/adminApi';

interface SecurityPreferencesProps {
  navigation?: any;
}

const LANGUAGE_OPTIONS = [
  'English (en-IN)',
  'English (en-US)',
  'Hindi (hi-IN)',
  'Arabic (ar-AE)',
];

const CURRENCY_OPTIONS = ['INR (₹)', 'USD ($)', 'AED (د.إ)', 'EUR (€)'];

const DATE_FORMAT_OPTIONS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata (IST • UTC+05:30)',
  'Asia/Dubai (GST • UTC+04:00)',
  'Asia/Singapore (SGT • UTC+08:00)',
  'UTC (Coordinated Universal Time)',
];

export const SecuritySystemPreferencesChaircareMobileScreen: React.FC<
  SecurityPreferencesProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Pulse animation for SOC-2 status indicator
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

  // Section 1: Authentication Protocol Toggles State
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(true);
  const [requireReAuth, setRequireReAuth] = useState<boolean>(true);
  const [instantLoginAlerts, setInstantLoginAlerts] = useState<boolean>(true);
  const [dualApprovalGate, setDualApprovalGate] = useState<boolean>(true);

  // Section 2: Session Governance State
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(4);

  // Section 5: Regional Platform Settings State
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGE_OPTIONS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(CURRENCY_OPTIONS[0]);
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>(DATE_FORMAT_OPTIONS[0]);
  const [selectedTimezone, setSelectedTimezone] = useState<string>(TIMEZONE_OPTIONS[0]);

  // Modals State
  const [selectorModalType, setSelectorModalType] = useState<
    'language' | 'currency' | 'dateFormat' | 'timezone' | null
  >(null);

  // Danger Zone Safety Verification Modal
  const [safetyModalAction, setSafetyModalAction] = useState<string | null>(null);
  const [rootPasswordInput, setRootPasswordInput] = useState<string>('');

  // Credentials Modals
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState<boolean>(false);
  const [credentialModalType, setCredentialModalType] = useState<
    'password' | 'fido2' | 'recovery' | null
  >(null);
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');

  // Temporary Password Requests Management
  const [tempRequests, setTempRequests] = useState<TemporaryPasswordRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all'>('pending');

  // Fulfill Modal State
  const [selectedFulfillRequest, setSelectedFulfillRequest] = useState<TemporaryPasswordRequestItem | null>(null);
  const [fulfillTempPassword, setFulfillTempPassword] = useState<string>('');
  const [isFulfilling, setIsFulfilling] = useState<boolean>(false);

  // Manual On-Demand Issue Modal State
  const [isManualIssueModalVisible, setIsManualIssueModalVisible] = useState<boolean>(false);
  const [manualUserRole, setManualUserRole] = useState<'customer' | 'technician'>('customer');
  const [manualUserList, setManualUserList] = useState<any[]>([]);
  const [selectedManualUser, setSelectedManualUser] = useState<any | null>(null);
  const [manualTempPassword, setManualTempPassword] = useState<string>('');
  const [isManualIssuing, setIsManualIssuing] = useState<boolean>(false);

  const generateSuggestedPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let res = 'ChairCare#';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const loadTemporaryPasswordRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const res = await adminApi.getTemporaryPasswordRequests();
      if (res.success && Array.isArray(res.data)) {
        setTempRequests(res.data);
      }
    } catch (err) {
      console.warn('Failed to load temporary password requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadTemporaryPasswordRequests();
  }, []);

  const handleOpenFulfillModal = (req: TemporaryPasswordRequestItem) => {
    setSelectedFulfillRequest(req);
    setFulfillTempPassword(generateSuggestedPassword());
  };

  const handleFulfillSubmit = async () => {
    if (!selectedFulfillRequest) return;
    if (!fulfillTempPassword.trim()) {
      Alert.alert('Required', 'Please enter or generate a temporary password.');
      return;
    }

    try {
      setIsFulfilling(true);
      const res = await adminApi.fulfillTemporaryPasswordRequest(
        selectedFulfillRequest.id,
        fulfillTempPassword.trim()
      );
      if (res.success) {
        Alert.alert(
          'Temporary Password Issued!',
          `Temporary password '${res.data?.temporaryPassword || fulfillTempPassword.trim()}' has been set for ${selectedFulfillRequest.user_name} (${selectedFulfillRequest.role}) and delivered to their in-app notifications.`
        );
        setSelectedFulfillRequest(null);
        await loadTemporaryPasswordRequests();
        displayToast('Temporary password issued & notification dispatched.');
      } else {
        Alert.alert('Error', res.error || 'Failed to fulfill request.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleOpenManualIssueModal = async () => {
    setIsManualIssueModalVisible(true);
    setManualTempPassword(generateSuggestedPassword());
    setSelectedManualUser(null);
    try {
      if (manualUserRole === 'customer') {
        const res = await adminApi.getAllCustomers();
        if (res.success && Array.isArray(res.data)) {
          setManualUserList(res.data);
        }
      } else {
        const res = await adminApi.getAllTechnicians();
        if (res.success && Array.isArray(res.data)) {
          setManualUserList(res.data);
        }
      }
    } catch {}
  };

  const handleSwitchManualRole = async (role: 'customer' | 'technician') => {
    setManualUserRole(role);
    setSelectedManualUser(null);
    try {
      if (role === 'customer') {
        const res = await adminApi.getAllCustomers();
        if (res.success && Array.isArray(res.data)) setManualUserList(res.data);
      } else {
        const res = await adminApi.getAllTechnicians();
        if (res.success && Array.isArray(res.data)) setManualUserList(res.data);
      }
    } catch {}
  };

  const handleManualIssueSubmit = async () => {
    if (!selectedManualUser) {
      Alert.alert('Required', 'Please select a customer or technician from the list.');
      return;
    }
    if (!manualTempPassword.trim()) {
      Alert.alert('Required', 'Please enter or generate a temporary password.');
      return;
    }

    try {
      setIsManualIssuing(true);
      const res = await adminApi.setUserTemporaryPassword(
        selectedManualUser.id,
        manualTempPassword.trim()
      );
      if (res.success) {
        Alert.alert(
          'Temporary Password Issued!',
          `Temporary password '${res.data?.temporaryPassword || manualTempPassword.trim()}' has been set for ${selectedManualUser.name} and delivered to their notifications.`
        );
        setIsManualIssueModalVisible(false);
        await loadTemporaryPasswordRequests();
        displayToast('Temporary password successfully issued.');
      } else {
        Alert.alert('Error', res.error || 'Failed to issue temporary password.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setIsManualIssuing(false);
    }
  };

  // Save Button Micro-interaction State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Toast State
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
    }, 2500);
  };

  const handleRevokeOtherSessions = () => {
    setActiveSessionsCount(1);
    displayToast('All other active sessions revoked. Only current console remains.');
  };

  const handleTriggerSafetyModal = (actionTitle: string) => {
    setRootPasswordInput('');
    setSafetyModalAction(actionTitle);
  };

  const handleConfirmSafetyAction = () => {
    if (!rootPasswordInput.trim()) {
      displayToast('Root operator password is required.');
      return;
    }
    const action = safetyModalAction;
    setSafetyModalAction(null);
    setRootPasswordInput('');
    displayToast(`Action verified & executed: ${action}`);
  };

  const handleSaveSecurityPreferences = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      displayToast('Security system preferences encrypted & enforced live.');
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    }, 1000);
  };

  const pendingRequests = tempRequests.filter((r) => r.status === 'pending');
  const pendingCount = pendingRequests.length;
  const displayedRequests = requestsFilter === 'pending' ? pendingRequests : tempRequests;

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
            Security System Preferences
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => displayToast('Security compliance export')}
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
        {/* Executive Security Status Banner */}
        <View style={styles.statusBanner}>
          <View style={styles.statusBannerLeft}>
            <View style={styles.verifiedIconContainer}>
              <AppIcon name="verified_user" size={20} />
            </View>
            <View style={styles.statusBannerDetails}>
              <View style={styles.statusTitleRow}>
                <Text style={styles.statusHeadline}>SOC-2 Type II</Text>
                <View style={styles.enforcedPill}>
                  <Animated.View
                    style={[styles.enforcedPulseDot, { opacity: pulseAnim }]}
                  />
                  <Text style={styles.enforcedPillText}>Enforced</Text>
                </View>
              </View>
              <Text style={styles.statusSubtitle}>
                Cryptographic posture & identity policies active
              </Text>
            </View>
          </View>
          <View style={styles.sysVersionBadge}>
            <Text style={styles.sysVersionText}>SYS: v4.18</Text>
          </View>
        </View>

        {/* 1. Executive Security & Authentication Controls */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="shield_lock" size={20} />
              <Text style={styles.cardTitle}>Authentication Protocols</Text>
            </View>
            <Text style={styles.cardHeaderTag}>MFA-GATE-01</Text>
          </View>

          <View style={styles.toggleList}>
            {/* Toggle Item 1 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>
                  Two-Factor Authentication (2FA)
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Hardware token or TOTP mandatory for all admin tiers
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  twoFactorAuth
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !twoFactorAuth;
                  setTwoFactorAuth(nextVal);
                  displayToast(
                    nextVal
                      ? 'Two-Factor Authentication enforced'
                      : 'Two-Factor Authentication relaxed'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: twoFactorAuth }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    twoFactorAuth
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowDivider} />

            {/* Toggle Item 2 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>
                  Require Admin Re-authentication
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Prompt biometrics or PIN before executing escrow actions
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  requireReAuth
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !requireReAuth;
                  setRequireReAuth(nextVal);
                  displayToast(
                    nextVal
                      ? 'Escrow re-authentication enabled'
                      : 'Escrow re-authentication disabled'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: requireReAuth }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    requireReAuth
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowDivider} />

            {/* Toggle Item 3 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>Instant Login Alerts</Text>
                <Text style={styles.toggleSubtitle}>
                  Immediate mobile push & email on unrecognized IP or UA
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  instantLoginAlerts
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !instantLoginAlerts;
                  setInstantLoginAlerts(nextVal);
                  displayToast(
                    nextVal
                      ? 'Instant login security alerts active'
                      : 'Instant login alerts paused'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: instantLoginAlerts }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    instantLoginAlerts
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowDivider} />

            {/* Toggle Item 4 */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <Text style={styles.toggleTitle}>
                  New Admin Dual-Approval Gate
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Requires second Super Admin sign-off before credential issuance
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  dualApprovalGate
                    ? styles.toggleTrackActive
                    : styles.toggleTrackInactive,
                ]}
                onPress={() => {
                  const nextVal = !dualApprovalGate;
                  setDualApprovalGate(nextVal);
                  displayToast(
                    nextVal
                      ? 'Dual-approval gate activated'
                      : 'Dual-approval gate deactivated'
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="switch"
                accessibilityState={{ checked: dualApprovalGate }}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    dualApprovalGate
                      ? styles.toggleThumbActive
                      : styles.toggleThumbInactive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Session Security & Active Logins */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="timer" size={20} />
              <Text style={styles.cardTitle}>Session Governance</Text>
            </View>
            <View style={styles.idleKillBadge}>
              <Text style={styles.idleKillBadgeText}>IDLE-KILL: ON</Text>
            </View>
          </View>

          <View style={styles.statTilesGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statTileLabel}>Inactivity Lockout</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statValue}>30</Text>
                <Text style={styles.statUnit}>minutes</Text>
              </View>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileLabel}>Active Consoles</Text>
              <View style={styles.statValueRow}>
                <Text style={[styles.statValue, { color: '#0051d5' }]}>
                  {activeSessionsCount}
                </Text>
                <Text style={styles.statUnit}>sessions</Text>
              </View>
            </View>
          </View>

          {/* Active Roster Context */}
          <View style={styles.rosterContextBox}>
            <View style={styles.rosterHeaderRow}>
              <Text style={styles.rosterHeaderText}>
                CURRENT CLUSTER DEPLOYMENTS
              </Text>
              <Text style={styles.tlsTag}>TLS 1.3</Text>
            </View>
            <Text style={styles.rosterBodyText}>
              {activeSessionsCount > 1
                ? 'Super Admin (Current) • Ops Lead (BLR-Office) • 2 Support Desks (Remote VPN)'
                : 'Super Admin (Current Console) • All remote sessions revoked'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.revokeSessionsButton}
            onPress={handleRevokeOtherSessions}
            activeOpacity={0.8}
          >
            <AppIcon name="logout" size={20} />
            <Text style={styles.revokeSessionsText}>
              Manage Active Sessions (Revoke All Others)
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Password & Credential Management */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="key" size={20} />
              <Text style={styles.cardTitle}>Credentials & Secrets</Text>
            </View>
          </View>

          <View style={styles.credentialNavList}>
            {/* Nav Row 1 */}
            <TouchableOpacity
              style={styles.credentialNavItem}
              onPress={() => setIsChangePasswordVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.credentialNavLeft}>
                <Text style={styles.credentialNavTitle}>
                  Change Admin Root Password
                </Text>
                <Text style={styles.credentialNavSubtitle}>
                  Last cycled: 42 days ago (Recommended: &lt;90d)
                </Text>
              </View>
              <AppIcon name="chevron_right" size={20} />
            </TouchableOpacity>

            {/* Nav Row 2 */}
            <TouchableOpacity
              style={styles.credentialNavItem}
              onPress={() => setCredentialModalType('fido2')}
              activeOpacity={0.7}
            >
              <View style={styles.credentialNavLeft}>
                <Text style={styles.credentialNavTitle}>
                  Authentication Methods & FIDO2 Keys
                </Text>
                <Text style={styles.credentialNavSubtitleSecondary}>
                  YubiKey 5C NFC Primary (Active)
                </Text>
              </View>
              <AppIcon name="chevron_right" size={20} />
            </TouchableOpacity>

            {/* Nav Row 3 */}
            <TouchableOpacity
              style={styles.credentialNavItem}
              onPress={() => setCredentialModalType('recovery')}
              activeOpacity={0.7}
            >
              <View style={styles.credentialNavLeft}>
                <Text style={styles.credentialNavTitle}>
                  Emergency Recovery Vault
                </Text>
                <Text style={styles.credentialNavSubtitle}>
                  10 of 12 one-time bypass keys unspent
                </Text>
              </View>
              <AppIcon name="chevron_right" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Temporary Password Requests & User Password Reset Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="key" size={20} />
              <Text style={styles.cardTitle}>Temporary Password Requests</Text>
            </View>
            <View style={[
              styles.reqCountBadge,
              pendingCount > 0 ? styles.reqCountBadgePending : styles.reqCountBadgeClear
            ]}>
              <Text style={[
                styles.reqCountBadgeText,
                pendingCount > 0 ? styles.reqCountBadgeTextPending : styles.reqCountBadgeTextClear
              ]}>
                {pendingCount > 0 ? `${pendingCount} PENDING` : 'ALL RESOLVED'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardSubheadingText}>
            Logged-in customers and technicians who forgot their current password can request a temporary password from Admin. Admin can fulfill requests or issue passwords on demand.
          </Text>

          {/* Filter Bar */}
          <View style={styles.requestsFilterBar}>
            <TouchableOpacity
              style={[styles.filterChip, requestsFilter === 'pending' && styles.filterChipActive]}
              onPress={() => setRequestsFilter('pending')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, requestsFilter === 'pending' && styles.filterChipTextActive]}>
                Pending ({pendingCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, requestsFilter === 'all' && styles.filterChipActive]}
              onPress={() => setRequestsFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, requestsFilter === 'all' && styles.filterChipTextActive]}>
                All History ({tempRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshIconBtn}
              onPress={loadTemporaryPasswordRequests}
              activeOpacity={0.7}
            >
              <AppIcon name="refresh" size={16} />
            </TouchableOpacity>
          </View>

          {/* Requests List */}
          {isLoadingRequests ? (
            <View style={styles.requestsLoadingWrap}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.requestsLoadingText}>Checking password requests...</Text>
            </View>
          ) : displayedRequests.length === 0 ? (
            <View style={styles.requestsEmptyBox}>
              <AppIcon name="check_circle" size={24} />
              <Text style={styles.requestsEmptyTitle}>
                {requestsFilter === 'pending' ? 'No Pending Requests' : 'No Request History'}
              </Text>
              <Text style={styles.requestsEmptySubtitle}>
                {requestsFilter === 'pending'
                  ? 'All customer and technician temporary password requests have been fulfilled.'
                  : 'No temporary password requests recorded in the system.'}
              </Text>
            </View>
          ) : (
            <View style={styles.requestsListContainer}>
              {displayedRequests.map((req) => (
                <View key={req.id} style={styles.requestItemCard}>
                  <View style={styles.requestItemHeader}>
                    <View style={styles.requestUserMeta}>
                      <Text style={styles.requestUserName}>{req.user_name}</Text>
                      <View style={[
                        styles.rolePill,
                        req.role === 'technician' ? styles.rolePillTech : styles.rolePillCust
                      ]}>
                        <Text style={[
                          styles.rolePillText,
                          req.role === 'technician' ? styles.rolePillTextTech : styles.rolePillTextCust
                        ]}>
                          {req.role.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.statusPillSmall,
                      req.status === 'pending' ? styles.statusPillSmallPending : styles.statusPillSmallFulfilled
                    ]}>
                      <Text style={[
                        styles.statusPillSmallText,
                        req.status === 'pending' ? styles.statusPillSmallTextPending : styles.statusPillSmallTextFulfilled
                      ]}>
                        {req.status === 'pending' ? 'Pending' : 'Fulfilled'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.requestEmailText}>
                    {req.user_email} {req.user_phone ? `• ${req.user_phone}` : ''}
                  </Text>
                  
                  {req.reason ? (
                    <Text style={styles.requestReasonText}>Reason: "{req.reason}"</Text>
                  ) : null}

                  <View style={styles.requestFooterRow}>
                    <Text style={styles.requestDateText}>
                      {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {req.status === 'pending' ? (
                      <TouchableOpacity
                        style={styles.fulfillActionBtn}
                        onPress={() => handleOpenFulfillModal(req)}
                        activeOpacity={0.8}
                      >
                        <AppIcon name="key" size={14} color="#FFFFFF" />
                        <Text style={styles.fulfillActionBtnText}>Issue Password</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.fulfilledBadgeBox}>
                        <Text style={styles.fulfilledPasswordText}>
                          Temp Pass: <Text style={styles.boldPasswordCode}>{req.temporary_password || '••••••'}</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Quick Action Button: Generate on demand */}
          <TouchableOpacity
            style={styles.manualIssueOpenBtn}
            onPress={handleOpenManualIssueModal}
            activeOpacity={0.8}
          >
            <AppIcon name="add" size={18} color={Colors.primary} />
            <Text style={styles.manualIssueOpenBtnText}>
              + Issue Temporary Password for Any User
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Data Governance & Regulatory Privacy */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="policy" size={20} />
              <Text style={styles.cardTitle}>Data Compliance & PII</Text>
            </View>
            <View style={styles.complianceBadge}>
              <Text style={styles.complianceBadgeText}>ISO 27001</Text>
            </View>
          </View>

          <View style={styles.complianceList}>
            <View style={styles.complianceItem}>
              <View style={styles.complianceItemLeft}>
                <Text style={styles.complianceItemTitle}>
                  Audit Log Lifecycle
                </Text>
                <Text style={styles.complianceItemSubtitle}>
                  Automated archive & zero-trace purge
                </Text>
              </View>
              <View style={styles.auditLifeTag}>
                <Text style={styles.auditLifeTagText}>12 Months</Text>
              </View>
            </View>

            <View style={styles.complianceItem}>
              <View style={styles.complianceItemLeft}>
                <Text style={styles.complianceItemTitle}>Field PII Masking</Text>
                <Text style={styles.complianceItemSubtitle}>
                  Obfuscate customer phone & street address
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>Active</Text>
              </View>
            </View>

            <View style={styles.complianceItem}>
              <View style={styles.complianceItemLeft}>
                <Text style={styles.complianceItemTitle}>
                  SHA-256 Ledger Chaining
                </Text>
                <Text style={styles.complianceItemSubtitle}>
                  Tamper-evident audit trail hashing
                </Text>
              </View>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. System Preferences & Localization */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <AppIcon name="tune" size={20} />
              <Text style={styles.cardTitle}>Regional Platform Settings</Text>
            </View>
          </View>

          <View style={styles.regionalInputsList}>
            {/* Input 1: Language */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Standard Console Language</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setSelectorModalType('language')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownSelectorText}>
                  {selectedLanguage}
                </Text>
                <AppIcon name="expand_more" size={20} />
              </TouchableOpacity>
            </View>

            {/* Input 2: Currency & Date Grid */}
            <View style={styles.gridTwoInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Currency Standard</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setSelectorModalType('currency')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownSelectorText}>
                    {selectedCurrency}
                  </Text>
                  <AppIcon name="expand_more" size={20} />
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Date Representation</Text>
                <TouchableOpacity
                  style={styles.dropdownSelector}
                  onPress={() => setSelectorModalType('dateFormat')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownSelectorText}>
                    {selectedDateFormat}
                  </Text>
                  <AppIcon name="expand_more" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Input 3: Timezone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Canonical Dispatch Timezone</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setSelectorModalType('timezone')}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                  {selectedTimezone}
                </Text>
                <AppIcon name="expand_more" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 6. Platform Danger Zone */}
        <View style={styles.dangerZoneCard}>
          <View style={styles.dangerZoneHeader}>
            <AppIcon name="warning" size={20} />
            <Text style={styles.dangerZoneTitle}>Platform Danger Zone</Text>
          </View>

          <Text style={styles.dangerZoneDescription}>
            High-impact global kill switches. All state transformations require
            biometric pass-thru and root operator confirmation.
          </Text>

          <View style={styles.dangerSwitchesList}>
            {/* Emergency Switch 1 */}
            <View style={styles.dangerSwitchItem}>
              <View style={styles.dangerSwitchLeft}>
                <Text style={styles.dangerSwitchTitle}>
                  Pause Platform Operations
                </Text>
                <Text style={styles.dangerSwitchSubtitle}>
                  Halts new bookings and freeze active technician dispatches
                </Text>
              </View>
              <TouchableOpacity
                style={styles.engageButton}
                onPress={() =>
                  handleTriggerSafetyModal('Pause Platform Operations')
                }
                activeOpacity={0.85}
              >
                <Text style={styles.engageButtonText}>Engage</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Switch 2 */}
            <View style={styles.dangerSwitchItem}>
              <View style={styles.dangerSwitchLeft}>
                <Text style={styles.dangerSwitchTitle}>
                  Disable Customer Onboarding
                </Text>
                <Text style={styles.dangerSwitchSubtitle}>
                  Temporarily locks public registration & corporate self-serve
                </Text>
              </View>
              <TouchableOpacity
                style={styles.toggleDangerButton}
                onPress={() =>
                  handleTriggerSafetyModal('Disable Customer Onboarding')
                }
                activeOpacity={0.85}
              >
                <Text style={styles.toggleDangerButtonText}>Toggle</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Switch 3 */}
            <View style={styles.dangerSwitchItem}>
              <View style={styles.dangerSwitchLeft}>
                <Text style={styles.dangerSwitchTitle}>
                  System Maintenance Mode
                </Text>
                <Text style={styles.dangerSwitchSubtitle}>
                  Display maintenance splash screen across mobile & web apps
                </Text>
              </View>
              <TouchableOpacity
                style={styles.toggleDangerButton}
                onPress={() =>
                  handleTriggerSafetyModal('System Maintenance Mode')
                }
                activeOpacity={0.85}
              >
                <Text style={styles.toggleDangerButtonText}>Setup</Text>
              </TouchableOpacity>
            </View>
          </View>
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

      {/* 7. Sticky Bottom Action Panel */}
      <View
        style={[
          styles.bottomCommitBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.bottomCommitBarContent}>
          <TouchableOpacity
            style={[
              styles.savePreferencesButton,
              isSaved && styles.savePreferencesButtonSaved,
            ]}
            onPress={handleSaveSecurityPreferences}
            activeOpacity={0.85}
            disabled={isSaving}
          >
            <AppIcon name={isSaving
                ? 'progress_activity'
                : isSaved
                ? 'check_circle'
                : 'save_as'} size={20} />
            <Text style={styles.savePreferencesText}>
              {isSaving
                ? 'Encrypting & Syncing...'
                : isSaved
                ? 'Preferences Enforced!'
                : 'Save Security Preferences'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Action Verification Modal */}
      <Modal
        visible={safetyModalAction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSafetyModalAction(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSafetyModalAction(null)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.safetyModalHeaderIcon}>
              <AppIcon name="lock_reset" size={20} />
            </View>

            <View style={styles.safetyModalTitleGroup}>
              <Text style={styles.safetyModalTitle}>{safetyModalAction}</Text>
              <Text style={styles.safetyModalDescription}>
                Please enter your root Super Admin password to initiate this
                state modification.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Root Password</Text>
              <TextInput
                style={styles.passwordTextInput}
                placeholder="••••••••••••"
                placeholderTextColor={Colors.onSurfaceVariant}
                secureTextEntry
                value={rootPasswordInput}
                onChangeText={setRootPasswordInput}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSafetyModalAction(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOverrideBtn}
                onPress={handleConfirmSafetyAction}
                activeOpacity={0.85}
              >
                <Text style={styles.modalOverrideBtnText}>Confirm Override</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Dropdown Selector Modal */}
      <Modal
        visible={selectorModalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorModalType(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectorModalType(null)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectorModalType === 'language'
                  ? 'Select Console Language'
                  : selectorModalType === 'currency'
                  ? 'Select Currency Standard'
                  : selectorModalType === 'dateFormat'
                  ? 'Select Date Representation'
                  : 'Select Canonical Timezone'}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectorModalType(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptionsList}>
              {(selectorModalType === 'language'
                ? LANGUAGE_OPTIONS
                : selectorModalType === 'currency'
                ? CURRENCY_OPTIONS
                : selectorModalType === 'dateFormat'
                ? DATE_FORMAT_OPTIONS
                : TIMEZONE_OPTIONS
              ).map((opt) => {
                const currentVal =
                  selectorModalType === 'language'
                    ? selectedLanguage
                    : selectorModalType === 'currency'
                    ? selectedCurrency
                    : selectorModalType === 'dateFormat'
                    ? selectedDateFormat
                    : selectedTimezone;
                const isSelected = currentVal === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.modalOptionItem,
                      isSelected && styles.modalOptionItemSelected,
                    ]}
                    onPress={() => {
                      if (selectorModalType === 'language') setSelectedLanguage(opt);
                      if (selectorModalType === 'currency') setSelectedCurrency(opt);
                      if (selectorModalType === 'dateFormat') setSelectedDateFormat(opt);
                      if (selectorModalType === 'timezone') setSelectedTimezone(opt);
                      setSelectorModalType(null);
                      displayToast(`Preference updated: ${opt}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && (
                      <AppIcon name="check" size={20} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Credential Management Modal */}
      <Modal
        visible={credentialModalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setCredentialModalType(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCredentialModalType(null)}
        >
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {credentialModalType === 'password'
                  ? 'Change Admin Root Password'
                  : credentialModalType === 'fido2'
                  ? 'Hardware Keys & FIDO2'
                  : 'Emergency Recovery Vault'}
              </Text>
              <TouchableOpacity
                onPress={() => setCredentialModalType(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {credentialModalType === 'password' && (
              <View style={styles.modalFormContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Root Password</Text>
                  <TextInput
                    style={styles.passwordTextInput}
                    placeholder="Enter min. 14 character password"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    secureTextEntry
                    value={newPasswordInput}
                    onChangeText={setNewPasswordInput}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.passwordTextInput}
                    placeholder="Re-enter password"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    secureTextEntry
                    value={confirmPasswordInput}
                    onChangeText={setConfirmPasswordInput}
                  />
                </View>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => {
                    if (!newPasswordInput) {
                      displayToast('Password cannot be empty.');
                      return;
                    }
                    if (newPasswordInput !== confirmPasswordInput) {
                      displayToast('Passwords do not match.');
                      return;
                    }
                    setCredentialModalType(null);
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    displayToast('Admin root password updated successfully.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalSubmitBtnText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            )}

            {credentialModalType === 'fido2' && (
              <View style={styles.modalFormContent}>
                <View style={styles.fidoCard}>
                  <Text style={styles.fidoCardTitle}>Primary Hardware Token</Text>
                  <Text style={styles.fidoCardSubtitle}>
                    YubiKey 5C NFC • Serial: #YB-904820
                  </Text>
                  <Text style={styles.fidoCardStatus}>Status: Active & Enforced</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => {
                    setCredentialModalType(null);
                    displayToast('New FIDO2 registration flow initiated.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalSubmitBtnText}>Register New Hardware Key</Text>
                </TouchableOpacity>
              </View>
            )}

            {credentialModalType === 'recovery' && (
              <View style={styles.modalFormContent}>
                <Text style={styles.recoveryIntroText}>
                  Bypass recovery codes allow one-time root emergency authentication if physical tokens are lost.
                </Text>
                <View style={styles.recoveryCodesBox}>
                  <Text style={styles.recoveryCodeItem}>• 9A4F-28B1-CC09 (Unspent)</Text>
                  <Text style={styles.recoveryCodeItem}>• 18D3-882E-77AF (Unspent)</Text>
                  <Text style={styles.recoveryCodeItem}>• 44C0-1288-FFA1 (Unspent)</Text>
                  <Text style={styles.recoveryCodeItem}>• 99EE-3341-8890 (Unspent)</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={() => {
                    setCredentialModalType(null);
                    displayToast('Recovery vault codes re-generated & encrypted.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalSubmitBtnText}>Generate New Vault Keys</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 1. Fulfill Temporary Password Request Modal */}
      <Modal
        visible={selectedFulfillRequest !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFulfillRequest(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedFulfillRequest(null)}
        >
          <View style={styles.fulfillModalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeftGroup}>
                <AppIcon name="key" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Issue Temporary Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFulfillRequest(null)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {selectedFulfillRequest && (
              <View style={styles.modalFormContent}>
                {/* User Info Box */}
                <View style={styles.fulfillUserInfoBox}>
                  <Text style={styles.fulfillUserNameText}>{selectedFulfillRequest.user_name}</Text>
                  <Text style={styles.fulfillUserSubText}>
                    {selectedFulfillRequest.role.toUpperCase()} • {selectedFulfillRequest.user_email}
                  </Text>
                  {selectedFulfillRequest.reason ? (
                    <Text style={styles.fulfillUserReasonText}>
                      User note: "{selectedFulfillRequest.reason}"
                    </Text>
                  ) : null}
                </View>

                {/* Password Input & Generator */}
                <View style={styles.inputGroup}>
                  <View style={styles.passLabelRow}>
                    <Text style={styles.inputLabel}>Temporary Password to Issue</Text>
                    <TouchableOpacity
                      onPress={() => setFulfillTempPassword(generateSuggestedPassword())}
                      style={styles.regenBtn}
                    >
                      <AppIcon name="refresh" size={13} color={Colors.primary} />
                      <Text style={styles.regenBtnText}>Regenerate</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.tempPassInput}
                    value={fulfillTempPassword}
                    onChangeText={setFulfillTempPassword}
                    placeholder="Enter or generate temporary password"
                    placeholderTextColor={Colors.onSurfaceVariant}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.fulfillNoticeBox}>
                  <AppIcon name="info" size={16} color={Colors.primary} />
                  <Text style={styles.fulfillNoticeText}>
                    Setting this temporary password will overwrite the user's password hash and dispatch an in-app message/notification to them immediately. The user can then use it in their 'Current Password' field to create a new password.
                  </Text>
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setSelectedFulfillRequest(null)}
                    disabled={isFulfilling}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, isFulfilling && { opacity: 0.6 }]}
                    onPress={handleFulfillSubmit}
                    disabled={isFulfilling}
                    activeOpacity={0.85}
                  >
                    {isFulfilling ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <AppIcon name="send" size={16} color="#FFFFFF" />
                        <Text style={styles.modalSubmitBtnText}>Issue & Send</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Manual On-Demand Issue Modal for Any User */}
      <Modal
        visible={isManualIssueModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsManualIssueModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsManualIssueModalVisible(false)}
        >
          <View style={styles.fulfillModalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeftGroup}>
                <AppIcon name="vpn_key" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Issue Password for User</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsManualIssueModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFormContent}>
              {/* Role Selector Tabs */}
              <View style={styles.roleTabsWrap}>
                <TouchableOpacity
                  style={[styles.roleTab, manualUserRole === 'customer' && styles.roleTabActive]}
                  onPress={() => handleSwitchManualRole('customer')}
                >
                  <Text style={[styles.roleTabText, manualUserRole === 'customer' && styles.roleTabTextActive]}>
                    Customer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleTab, manualUserRole === 'technician' && styles.roleTabActive]}
                  onPress={() => handleSwitchManualRole('technician')}
                >
                  <Text style={[styles.roleTabText, manualUserRole === 'technician' && styles.roleTabTextActive]}>
                    Technician
                  </Text>
                </TouchableOpacity>
              </View>

              {/* User Selection List */}
              <Text style={styles.inputLabel}>Select {manualUserRole === 'customer' ? 'Customer' : 'Technician'}:</Text>
              <ScrollView style={styles.userPickerScroll} nestedScrollEnabled>
                {manualUserList.map((u) => {
                  const isSelected = selectedManualUser?.id === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.userPickerItem, isSelected && styles.userPickerItemSelected]}
                      onPress={() => setSelectedManualUser(u)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userPickerName, isSelected && styles.userPickerNameSelected]}>
                          {u.name}
                        </Text>
                        <Text style={styles.userPickerEmail}>{u.email} {u.phone ? `• ${u.phone}` : ''}</Text>
                      </View>
                      {isSelected ? <AppIcon name="check" size={18} color={Colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Password Generator */}
              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <View style={styles.passLabelRow}>
                  <Text style={styles.inputLabel}>Temporary Password</Text>
                  <TouchableOpacity
                    onPress={() => setManualTempPassword(generateSuggestedPassword())}
                    style={styles.regenBtn}
                  >
                    <AppIcon name="refresh" size={13} color={Colors.primary} />
                    <Text style={styles.regenBtnText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.tempPassInput}
                  value={manualTempPassword}
                  onChangeText={setManualTempPassword}
                  placeholder="Enter or generate temporary password"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsManualIssueModalVisible(false)}
                  disabled={isManualIssuing}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSubmitBtn,
                    (!selectedManualUser || isManualIssuing) && { opacity: 0.6 }
                  ]}
                  onPress={handleManualIssueSubmit}
                  disabled={!selectedManualUser || isManualIssuing}
                  activeOpacity={0.85}
                >
                  {isManualIssuing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <AppIcon name="send" size={16} color="#FFFFFF" />
                      <Text style={styles.modalSubmitBtnText}>Issue & Deliver</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Real Change Password Modal */}
      <ChangePasswordModal
        visible={isChangePasswordVisible}
        onClose={() => setIsChangePasswordVisible(false)}
        userRoleLabel="Super Admin Console"
      />
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

  /* Executive Status Banner */
  statusBanner: {
    backgroundColor: '#f2f4f6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  verifiedIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#0051d5',
  },
  statusBannerDetails: {
    flex: 1,
    gap: 2,
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusHeadline: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 17,
    lineHeight: 23,
    color: '#191c1e',
  },
  enforcedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(78, 222, 163, 0.3)',
  },
  enforcedPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  enforcedPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#005236',
  },
  statusSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    lineHeight: 16,
  },
  sysVersionBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sysVersionText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Card General */
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#191c1e',
  },
  cardHeaderTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
    textTransform: 'uppercase',
  },

  /* Toggles */
  toggleList: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
    marginTop: 2,
  },
  toggleTrackActive: {
    backgroundColor: '#000000',
  },
  toggleTrackInactive: {
    backgroundColor: '#e0e3e5',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  rowDivider: {
    height: 1,
    backgroundColor: '#f2f4f6',
  },

  /* Session Governance */
  idleKillBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  idleKillBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  statTilesGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  statTileLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464d',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
  },
  statValue: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: '#191c1e',
  },
  statUnit: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
  },
  rosterContextBox: {
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rosterHeaderText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  tlsTag: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#009668',
  },
  rosterBodyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#191c1e',
  },
  revokeSessionsButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eceef0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  revokeSessionsIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ba1a1a',
  },
  revokeSessionsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#ba1a1a',
  },

  /* Credentials & Secrets */
  credentialNavList: {
    gap: 8,
  },
  credentialNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
  },
  credentialNavLeft: {
    flex: 1,
    gap: 2,
    marginRight: 8,
  },
  credentialNavTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#191c1e',
  },
  credentialNavSubtitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
  },
  credentialNavSubtitleSecondary: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  chevronIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#45464d',
  },

  /* Compliance & PII */
  complianceBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  complianceBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
  },
  complianceList: {
    gap: 8,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    gap: 8,
  },
  complianceItemLeft: {
    flex: 1,
    gap: 2,
  },
  complianceItemTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#191c1e',
  },
  complianceItemSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#76777d',
  },
  auditLifeTag: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  auditLifeTagText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  verifiedPill: {
    backgroundColor: 'rgba(78, 222, 163, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#005236',
  },

  /* Regional Inputs */
  regionalInputsList: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  gridTwoInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464d',
  },
  dropdownSelector: {
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownSelectorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    flex: 1,
    marginRight: 6,
  },
  dropdownIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
  },

  /* Platform Danger Zone */
  dangerZoneCard: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dangerZoneIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffdad6',
  },
  dangerZoneTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#ffffff',
  },
  dangerZoneDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#bec6e0',
  },
  dangerSwitchesList: {
    gap: 8,
    paddingTop: 4,
  },
  dangerSwitchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    gap: 12,
  },
  dangerSwitchLeft: {
    flex: 1,
    gap: 2,
  },
  dangerSwitchTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#ffffff',
  },
  dangerSwitchSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#bec6e0',
  },
  engageButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ba1a1a',
  },
  engageButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },
  toggleDangerButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  toggleDangerButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
  },

  /* Sticky Bottom Action Panel */
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
  savePreferencesButton: {
    height: 50,
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
  savePreferencesButtonSaved: {
    backgroundColor: '#0051d5',
  },
  savePreferencesIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
  },
  savePreferencesText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.2,
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

  /* Safety Verification Modal */
  safetyModalHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffdad6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  safetyLockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 26,
    color: '#ba1a1a',
  },
  safetyModalTitleGroup: {
    gap: 4,
  },
  safetyModalTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    color: '#191c1e',
  },
  safetyModalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  passwordTextInput: {
    height: 44,
    backgroundColor: '#f2f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
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
  modalOverrideBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverrideBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },

  /* Options list for selector modal */
  modalOptionsList: {
    gap: 8,
  },
  modalOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f7f9fb',
  },
  modalOptionItemSelected: {
    backgroundColor: '#dbe1ff',
  },
  modalOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#191c1e',
    flex: 1,
  },
  modalOptionTextSelected: {
    fontFamily: 'Inter-SemiBold',
    color: '#00174b',
  },
  modalOptionCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
  },

  /* Credential Modal Form Styles */
  modalFormContent: {
    gap: 14,
  },
  modalSubmitBtn: {
    height: 46,
    borderRadius: 10,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
  fidoCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  fidoCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#191c1e',
  },
  fidoCardSubtitle: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#0051d5',
  },
  fidoCardStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#005236',
    marginTop: 4,
  },
  recoveryIntroText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#45464d',
  },
  recoveryCodesBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  recoveryCodeItem: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  reqCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  reqCountBadgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reqCountBadgeClear: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  reqCountBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    fontWeight: '700',
  },
  reqCountBadgeTextPending: {
    color: '#B45309',
  },
  reqCountBadgeTextClear: {
    color: '#15803D',
  },
  cardSubheadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#555A64',
    lineHeight: 18,
    marginBottom: 12,
  },
  requestsFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#005236',
  },
  filterChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  refreshIconBtn: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsLoadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  requestsLoadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  requestsEmptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  requestsEmptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  requestsEmptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
  requestsListContainer: {
    gap: 10,
    marginBottom: 12,
  },
  requestItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  requestItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestUserMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestUserName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rolePillTech: {
    backgroundColor: '#F3E8FF',
  },
  rolePillCust: {
    backgroundColor: '#E0F2FE',
  },
  rolePillText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 9.5,
    fontWeight: '700',
  },
  rolePillTextTech: {
    color: '#7E22CE',
  },
  rolePillTextCust: {
    color: '#0369A1',
  },
  statusPillSmall: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusPillSmallPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillSmallFulfilled: {
    backgroundColor: '#DCFCE7',
  },
  statusPillSmallText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    fontWeight: '600',
  },
  statusPillSmallTextPending: {
    color: '#B45309',
  },
  statusPillSmallTextFulfilled: {
    color: '#15803D',
  },
  requestEmailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  requestReasonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#334155',
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
  },
  requestFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  requestDateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#94A3B8',
  },
  fulfillActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#005236',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  fulfillActionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
  },
  fulfilledBadgeBox: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fulfilledPasswordText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#166534',
  },
  boldPasswordCode: {
    fontFamily: 'JetBrainsMono-Medium',
    fontWeight: '700',
    color: '#14532D',
  },
  manualIssueOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#005236',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 82, 54, 0.04)',
    marginTop: 4,
  },
  manualIssueOpenBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#005236',
  },
  fulfillModalSheet: {
    width: '92%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Shadows.large,
  },
  modalHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fulfillUserInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
  },
  fulfillUserNameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 15,
    color: '#0F172A',
  },
  fulfillUserSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748B',
  },
  fulfillUserReasonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#475569',
    marginTop: 4,
  },
  passLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 82, 54, 0.08)',
    borderRadius: 4,
  },
  regenBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#005236',
  },
  tempPassInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  fulfillNoticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(0, 82, 54, 0.06)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  fulfillNoticeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#005236',
    flex: 1,
    lineHeight: 16,
  },
  roleTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.small,
  },
  roleTabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12.5,
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  userPickerScroll: {
    maxHeight: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  userPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userPickerItemSelected: {
    backgroundColor: 'rgba(0, 82, 54, 0.08)',
  },
  userPickerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#1E293B',
  },
  userPickerNameSelected: {
    color: '#005236',
    fontWeight: '700',
  },
  userPickerEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#64748B',
  },
});
