import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { AppIcon } from '../../components/common/AppIcon';
import { BrandLogo } from '../../components/common/BrandLogo';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';
import { adminApi, TemporaryPasswordRequestItem } from '../../services/api/adminApi';

/**
 * Screen ID: A59
 * Title: Temporary Password Requests (Admin Credentials Management)
 * Tab: Dedicated Password Requests Tab in Admin Console
 */

export const AdminSettingsChaircareMobileScreen: React.FC<{
  navigation?: any;
  route?: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Requests state
  const [tempRequests, setTempRequests] = useState<TemporaryPasswordRequestItem[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [requestsFilter, setRequestsFilter] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Fulfill Modal State
  const [selectedFulfillRequest, setSelectedFulfillRequest] =
    useState<TemporaryPasswordRequestItem | null>(null);
  const [fulfillTempPassword, setFulfillTempPassword] = useState<string>('');
  const [isFulfilling, setIsFulfilling] = useState<boolean>(false);

  // Manual On-Demand Issue Modal State
  const [isManualIssueModalVisible, setIsManualIssueModalVisible] = useState<boolean>(false);
  const [manualUserRole, setManualUserRole] = useState<'customer' | 'technician'>('customer');
  const [manualUserList, setManualUserList] = useState<any[]>([]);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');
  const [selectedManualUser, setSelectedManualUser] = useState<any | null>(null);
  const [manualTempPassword, setManualTempPassword] = useState<string>('');
  const [isManualIssuing, setIsManualIssuing] = useState<boolean>(false);

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

  const generateSuggestedPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let res = 'ChairCare#';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const loadTemporaryPasswordRequests = async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingRequests(true);
      }
      const res = await adminApi.getTemporaryPasswordRequests();
      if (res.success && Array.isArray(res.data)) {
        setTempRequests(res.data);
      }
    } catch (err) {
      console.warn('Failed to load temporary password requests:', err);
    } finally {
      setIsLoadingRequests(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTemporaryPasswordRequests();
  }, []);

  // Filtered requests list
  const pendingRequests = useMemo(() => {
    return tempRequests.filter((r) => r.status === 'pending');
  }, [tempRequests]);

  const displayedRequests = useMemo(() => {
    let list = requestsFilter === 'pending' ? pendingRequests : tempRequests;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const name = (r.userName || r.user_name || '').toLowerCase();
        const email = (r.userEmail || r.user_email || '').toLowerCase();
        const phone = (r.userPhone || r.user_phone || '').toLowerCase();
        const role = (r.role || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || role.includes(q);
      });
    }
    return list;
  }, [requestsFilter, pendingRequests, tempRequests, searchQuery]);

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
          `Temporary password '${res.data?.temporaryPassword || fulfillTempPassword.trim()}' has been set for ${
            selectedFulfillRequest.userName || selectedFulfillRequest.user_name
          } (${selectedFulfillRequest.role}) and delivered to their in-app notifications.`
        );
        setSelectedFulfillRequest(null);
        await loadTemporaryPasswordRequests();
        showToast('Password issued & notification dispatched');
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
    setManualSearchQuery('');
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
    setManualSearchQuery('');
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

  const filteredManualUserList = useMemo(() => {
    if (!manualSearchQuery.trim()) return manualUserList;
    const q = manualSearchQuery.toLowerCase();
    return manualUserList.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q)
    );
  }, [manualUserList, manualSearchQuery]);

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
          `Temporary password '${res.data?.temporaryPassword || manualTempPassword.trim()}' has been set for ${
            selectedManualUser.name
          } and delivered to their in-app notifications.`
        );
        setIsManualIssueModalVisible(false);
        await loadTemporaryPasswordRequests();
        showToast('Temporary password successfully issued');
      } else {
        Alert.alert('Error', res.error || 'Failed to issue temporary password.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setIsManualIssuing(false);
    }
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

      {/* Fixed Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BrandLogo size={36} containerStyle={{ marginRight: 10 }} />
          <View style={styles.headerTitleCol}>
            <Text style={styles.headerSub}>CREDENTIALS &amp; SECURITY</Text>
            <Text style={styles.headerTitle}>Password Requests</Text>
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

          <AdminHeaderAvatar
            size={36}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('AdminProfileSystemStatus');
              }
            }}
          />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 30, 48) },
          isDesktop && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadTemporaryPasswordRequests(true)}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* KPI / Status Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryIconBox}>
              <AppIcon name="Key" size={22} color="#00174B" />
            </View>
            <View style={styles.summaryTexts}>
              <Text style={styles.summaryTitle}>Temporary Password Requests</Text>
              <Text style={styles.summarySub}>
                Fulfill password requests from customers &amp; technicians or issue on demand
              </Text>
            </View>
            <View
              style={[
                styles.summaryBadge,
                pendingRequests.length > 0
                  ? styles.summaryBadgePending
                  : styles.summaryBadgeResolved,
              ]}
            >
              <Text
                style={[
                  styles.summaryBadgeText,
                  pendingRequests.length > 0
                    ? styles.summaryBadgeTextPending
                    : styles.summaryBadgeTextResolved,
                ]}
              >
                {pendingRequests.length > 0
                  ? `${pendingRequests.length} PENDING`
                  : 'ALL RESOLVED'}
              </Text>
            </View>
          </View>

          {/* Issue on Demand Action Button */}
          <TouchableOpacity
            style={styles.actionBtnIssueDemand}
            onPress={handleOpenManualIssueModal}
            activeOpacity={0.85}
          >
            <AppIcon name="Plus" size={16} color="#00174B" />
            <Text style={styles.actionBtnIssueDemandText}>
              + Issue Temporary Password for Any User
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips & Search Bar */}
        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                requestsFilter === 'pending' && styles.filterTabActive,
              ]}
              onPress={() => setRequestsFilter('pending')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  requestsFilter === 'pending' && styles.filterTabTextActive,
                ]}
              >
                Pending ({pendingRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                requestsFilter === 'all' && styles.filterTabActive,
              ]}
              onPress={() => setRequestsFilter('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  requestsFilter === 'all' && styles.filterTabTextActive,
                ]}
              >
                All History ({tempRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => loadTemporaryPasswordRequests()}
              activeOpacity={0.7}
              accessibilityLabel="Refresh"
            >
              <AppIcon name="RefreshCw" size={16} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by user name, email, phone..."
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
        </View>

        {/* List of Requests */}
        {isLoadingRequests ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching password requests...</Text>
          </View>
        ) : displayedRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialIcons name="verified-user" size={32} color="#009668" />
            </View>
            <Text style={styles.emptyTitle}>
              {requestsFilter === 'pending' ? 'No Pending Requests' : 'No Request History'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {requestsFilter === 'pending'
                ? 'All password requests have been successfully fulfilled.'
                : 'No temporary password requests found in the platform.'}
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {displayedRequests.map((req) => {
              const reqUserName = req.userName || req.user_name || 'ChairCare User';
              const reqUserEmail = req.userEmail || req.user_email || '';
              const reqUserPhone = req.userPhone || req.user_phone || '';
              const reqRole = req.role || 'customer';
              const reqPass = req.temporaryPassword || req.temporary_password;
              const rawDate = req.createdAt || req.created_at;
              const formattedDate =
                rawDate && !isNaN(new Date(rawDate).getTime())
                  ? `${new Date(rawDate).toLocaleDateString()} at ${new Date(
                      rawDate
                    ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Recently requested';

              const initials =
                reqUserName
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || 'CC';

              const isTech = reqRole === 'technician';

              return (
                <View key={req.id} style={styles.requestCard}>
                  {/* Top Row: Avatar + Info + Status Pill */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardUserGroup}>
                      <View
                        style={[
                          styles.avatarCircle,
                          isTech ? styles.avatarTech : styles.avatarCust,
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarInitials,
                            isTech ? styles.avatarInitialsTech : styles.avatarInitialsCust,
                          ]}
                        >
                          {initials}
                        </Text>
                      </View>

                      <View style={styles.userInfoTextCol}>
                        <View style={styles.nameRow}>
                          <Text style={styles.userNameText}>{reqUserName}</Text>
                          <View
                            style={[
                              styles.rolePill,
                              isTech ? styles.rolePillTech : styles.rolePillCust,
                            ]}
                          >
                            <Text
                              style={[
                                styles.rolePillText,
                                isTech ? styles.rolePillTextTech : styles.rolePillTextCust,
                              ]}
                            >
                              {reqRole.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {(reqUserEmail || reqUserPhone) && (
                          <Text style={styles.contactText}>
                            {reqUserEmail} {reqUserPhone ? `• ${reqUserPhone}` : ''}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        req.status === 'pending'
                          ? styles.statusPillPending
                          : styles.statusPillFulfilled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          req.status === 'pending'
                            ? styles.statusPillTextPending
                            : styles.statusPillTextFulfilled,
                        ]}
                      >
                        {req.status === 'pending' ? 'PENDING' : 'FULFILLED'}
                      </Text>
                    </View>
                  </View>

                  {/* Reason Note */}
                  {req.reason ? (
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonLabel}>User Note:</Text>
                      <Text style={styles.reasonText}>"{req.reason}"</Text>
                    </View>
                  ) : null}

                  {/* Card Bottom Row */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Requested</Text>
                      <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>

                    {req.status === 'pending' ? (
                      <TouchableOpacity
                        style={styles.fulfillBtn}
                        onPress={() => handleOpenFulfillModal(req)}
                        activeOpacity={0.85}
                      >
                        <AppIcon name="Key" size={14} color="#FFFFFF" />
                        <Text style={styles.fulfillBtnText}>Issue Password</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.issuedBox}>
                        <Text style={styles.issuedLabel}>Issued Password</Text>
                        <Text style={styles.issuedCode}>{reqPass || '••••••'}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 1. Fulfill Temporary Password Request Modal */}
      <Modal
        visible={selectedFulfillRequest !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFulfillRequest(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlayCenter}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedFulfillRequest(null)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeftGroup}>
                <AppIcon name="Key" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Issue Temporary Password</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedFulfillRequest(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {selectedFulfillRequest && (
              <View style={styles.modalFormContent}>
                {/* Target User Info */}
                <View style={styles.modalUserBox}>
                  <Text style={styles.modalUserName}>
                    {selectedFulfillRequest.userName ||
                      selectedFulfillRequest.user_name ||
                      'ChairCare User'}
                  </Text>
                  <Text style={styles.modalUserSub}>
                    {(selectedFulfillRequest.role || 'user').toUpperCase()} •{' '}
                    {selectedFulfillRequest.userEmail ||
                      selectedFulfillRequest.user_email ||
                      'No email'}
                    {selectedFulfillRequest.userPhone || selectedFulfillRequest.user_phone
                      ? ` • ${
                          selectedFulfillRequest.userPhone || selectedFulfillRequest.user_phone
                        }`
                      : ''}
                  </Text>
                  {selectedFulfillRequest.reason ? (
                    <Text style={styles.modalUserReason}>
                      Note: "{selectedFulfillRequest.reason}"
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
                      activeOpacity={0.7}
                    >
                      <AppIcon name="RefreshCw" size={12} color={Colors.primary} />
                      <Text style={styles.regenBtnText}>Regenerate</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.tempPassInput}
                    value={fulfillTempPassword}
                    onChangeText={setFulfillTempPassword}
                    placeholder="Enter temporary password"
                    placeholderTextColor={Colors.outline}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isFulfilling}
                    selectTextOnFocus
                  />
                </View>

                <View style={styles.fulfillNoticeBox}>
                  <MaterialIcons name="info" size={16} color={Colors.primary} />
                  <Text style={styles.fulfillNoticeText}>
                    This sets the temporary password and immediately sends an in-app
                    notification to the user's account.
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
                        <AppIcon name="Send" size={15} color="#FFFFFF" />
                        <Text style={styles.modalSubmitBtnText}>Issue &amp; Send</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 2. Manual On-Demand Issue Modal for Any User */}
      <Modal
        visible={isManualIssueModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsManualIssueModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlayCenter}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setIsManualIssueModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeftGroup}>
                <AppIcon name="Key" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Issue Password for User</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsManualIssueModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFormContent}>
              {/* Role Selector Tabs */}
              <View style={styles.roleTabsWrap}>
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    manualUserRole === 'customer' && styles.roleTabActive,
                  ]}
                  onPress={() => handleSwitchManualRole('customer')}
                >
                  <Text
                    style={[
                      styles.roleTabText,
                      manualUserRole === 'customer' && styles.roleTabTextActive,
                    ]}
                  >
                    Customer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    manualUserRole === 'technician' && styles.roleTabActive,
                  ]}
                  onPress={() => handleSwitchManualRole('technician')}
                >
                  <Text
                    style={[
                      styles.roleTabText,
                      manualUserRole === 'technician' && styles.roleTabTextActive,
                    ]}
                  >
                    Technician
                  </Text>
                </TouchableOpacity>
              </View>

              {/* User search filter */}
              <TextInput
                style={styles.modalSearchInput}
                placeholder={`Search ${manualUserRole}...`}
                placeholderTextColor={Colors.outline}
                value={manualSearchQuery}
                onChangeText={setManualSearchQuery}
              />

              {/* User Picker Scroll */}
              <ScrollView style={styles.userPickerScroll} nestedScrollEnabled>
                {filteredManualUserList.length === 0 ? (
                  <Text style={styles.noUsersFoundText}>No {manualUserRole}s found.</Text>
                ) : (
                  filteredManualUserList.map((u) => {
                    const isSelected = selectedManualUser?.id === u.id;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[
                          styles.userPickerItem,
                          isSelected && styles.userPickerItemSelected,
                        ]}
                        onPress={() => setSelectedManualUser(u)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.userPickerName,
                              isSelected && styles.userPickerNameSelected,
                            ]}
                          >
                            {u.name}
                          </Text>
                          <Text style={styles.userPickerEmail}>
                            {u.email} {u.phone ? `• ${u.phone}` : ''}
                          </Text>
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check" size={18} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Password Generator */}
              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <View style={styles.passLabelRow}>
                  <Text style={styles.inputLabel}>Temporary Password</Text>
                  <TouchableOpacity
                    onPress={() => setManualTempPassword(generateSuggestedPassword())}
                    style={styles.regenBtn}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="RefreshCw" size={12} color={Colors.primary} />
                    <Text style={styles.regenBtnText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.tempPassInput}
                  value={manualTempPassword}
                  onChangeText={setManualTempPassword}
                  placeholder="Enter temporary password"
                  placeholderTextColor={Colors.outline}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isManualIssuing}
                  selectTextOnFocus
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
                  style={[styles.modalSubmitBtn, isManualIssuing && { opacity: 0.6 }]}
                  onPress={handleManualIssueSubmit}
                  disabled={isManualIssuing}
                  activeOpacity={0.85}
                >
                  {isManualIssuing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <AppIcon name="Send" size={15} color="#FFFFFF" />
                      <Text style={styles.modalSubmitBtnText}>Issue &amp; Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  desktopContainer: {
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleCol: {
    flexDirection: 'column',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00297A',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#191C1E',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  // KPI Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTexts: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#191C1E',
  },
  summarySub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#5B6B79',
    marginTop: 2,
    lineHeight: 16,
  },
  summaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  summaryBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  summaryBadgeResolved: {
    backgroundColor: '#DCFCE7',
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryBadgeTextPending: {
    color: '#B45309',
  },
  summaryBadgeTextResolved: {
    color: '#15803D',
  },
  actionBtnIssueDemand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionBtnIssueDemandText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00174B',
  },

  // Filter Section
  filterSection: {
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8EA',
  },
  filterTabActive: {
    backgroundColor: '#00297A',
    borderColor: '#00297A',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5B6B79',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  refreshBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    color: '#191C1E',
    paddingVertical: 0,
  },

  // Requests List
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardUserGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCust: {
    backgroundColor: '#EFF6FF',
  },
  avatarTech: {
    backgroundColor: '#F0FDF4',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarInitialsCust: {
    color: '#1D4ED8',
  },
  avatarInitialsTech: {
    color: '#15803D',
  },
  userInfoTextCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191C1E',
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillCust: {
    backgroundColor: '#DBEAFE',
  },
  rolePillTech: {
    backgroundColor: '#DCFCE7',
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rolePillTextCust: {
    color: '#1E40AF',
  },
  rolePillTextTech: {
    color: '#166534',
  },
  contactText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#5B6B79',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillFulfilled: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillTextPending: {
    color: '#B45309',
  },
  statusPillTextFulfilled: {
    color: '#15803D',
  },
  reasonBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#1E293B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  fulfillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00297A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fulfillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  issuedBox: {
    alignItems: 'flex-end',
  },
  issuedLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  issuedCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
    marginTop: 2,
  },

  // Loading & Empty States
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191C1E',
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },

  // Modals
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191C1E',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalFormContent: {
    marginTop: 14,
    gap: 14,
  },
  modalUserBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalUserSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  modalUserReason: {
    fontSize: 12,
    fontWeight: '400',
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 6,
  },
  inputGroup: {
    gap: 6,
  },
  passLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  tempPassInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  fulfillNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
  },
  fulfillNoticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '400',
    color: '#1E40AF',
    lineHeight: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00297A',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Manual Modal Styles
  roleTabsWrap: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  roleTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  roleTabTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  modalSearchInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '400',
    color: '#1E293B',
  },
  userPickerScroll: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
  },
  userPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  userPickerItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  userPickerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  userPickerNameSelected: {
    color: '#1D4ED8',
  },
  userPickerEmail: {
    fontSize: 11,
    fontWeight: '400',
    color: '#64748B',
  },
  noUsersFoundText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '400',
    color: '#94A3B8',
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#002113',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
