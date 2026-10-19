import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';

interface AdminUsersProps {
  navigation?: any;
}

type FilterTab = 'all' | 'active' | 'pending' | 'suspended';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleBadgeType: 'super' | 'ops' | 'support' | 'finance';
  roleIcon: string;
  status: 'active' | 'pending' | 'suspended';
  statusLabel: string;
  avatarUri?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  accessTitle: string;
  accessValue: string;
  lastActiveLabel: string;
  lastActiveValue: string;
  secKey: string;
  actionType: 'view_profile' | 'review_resend';
}

export const AdminUsersChaircareMobileScreen: React.FC<
  AdminUsersProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAdmins = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAdminUsers();
      if (res.success && Array.isArray(res.data)) {
        const mapped: AdminUser[] = res.data.map((a: any) => ({
          id: a.id,
          name: a.name || 'Admin',
          email: a.email,
          role: 'Super Admin',
          roleBadgeType: 'super',
          roleIcon: 'star',
          status: a.isActive ? 'active' : 'suspended',
          statusLabel: a.isActive ? 'Active' : 'Suspended',
          avatarInitials: (a.name || 'AD')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
          avatarBgColor: '#DBE1FF',
          accessTitle: 'Access Level:',
          accessValue: 'Full Console Control',
          lastActiveLabel: 'Created:',
          lastActiveValue: new Date(a.createdAt).toLocaleDateString(),
          secKey: `UID: ${a.id.substring(0, 8)}`,
          actionType: 'view_profile',
        }));
        setAdminUsers(mapped);
      }
    } catch (err) {
      console.warn('Failed to load admin users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, loadAdmins);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  };

  // Filtered dataset
  const filteredAdmins = useMemo(() => {
    return adminUsers.filter((user) => {
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' && user.status === 'active') ||
        (activeTab === 'pending' && user.status === 'pending') ||
        (activeTab === 'suspended' && user.status === 'suspended');

      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q)
      );
    });
  }, [adminUsers, activeTab, searchQuery]);

  const handleAddAdmin = () => {
    if (navigation) {
      navigation.navigate('AddAdmin');
    } else {
      displayToast('Navigating to Add Admin workflow');
    }
  };

  const handleViewProfile = (user: AdminUser) => {
    if (navigation) {
      navigation.navigate('AdminProfilePriyaSharma', { adminId: user.id, adminUser: user });
    } else {
      displayToast(`Opening profile for ${user.name}`);
    }
  };

  const handleResendInvitation = (user: AdminUser) => {
    displayToast(`Invitation & setup link resent to ${user.email}`);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Top Header */}
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

          <View style={styles.headerTitlesCol}>
            <Text style={styles.headerTitleText}>All Administrators</Text>
            <Text style={styles.headerSubtitleText}>Admin Team &amp; Permissions</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => displayToast('Quick filter drawer ready')}
            accessibilityLabel="Filter"
          >
            <AppIcon name="tune" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={handleAddAdmin}
            activeOpacity={0.85}
          >
            <AppIcon name="add" size={20} />
            <Text style={styles.headerAddBtnText}>Add Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerAvatar}
            onPress={() => navigation?.navigate('AdminSettingsTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="person" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Security & Registry Status Bar */}
        <View style={styles.protocolBar}>
          <View style={styles.protocolLeft}>
            <View style={styles.pulseDot} />
            <Text style={styles.protocolText} numberOfLines={1}>
              ADMIN TEAM &amp; USER ACCOUNTS
            </Text>
          </View>

          <View style={styles.auditActivePill}>
            <AppIcon name="shield_with_heart" size={20} />
            <Text style={styles.auditActiveText}>SECURE &amp; ACTIVE</Text>
          </View>
        </View>

        {/* Search & Action Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <AppIcon name="search" size={20} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search admins by name, email, or role..."
              placeholderTextColor="#76777D"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            onPress={() => displayToast('Filter modal options opened')}
          >
            <AppIcon name="tune" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addAdminShortcutBtn}
            onPress={handleAddAdmin}
            activeOpacity={0.85}
          >
            <AppIcon name="person_add" size={20} />
          </TouchableOpacity>
        </View>

        {/* 2x2 KPI Grid (Fleet Metrics) */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Total Fleet */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiWatermarkBox}>
              <AppIcon name="admin_panel_settings" size={20} />
            </View>
            <View style={styles.kpiCardHeader}>
              <Text style={styles.kpiCardLabel}>Total Fleet</Text>
              <View style={[styles.kpiDot, { backgroundColor: '#131B2E' }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiBigNumber}>{adminUsers.length}</Text>
              <Text style={styles.kpiSubtext}>Platform controllers</Text>
            </View>
          </View>

          {/* Card 2: Active */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiWatermarkBox}>
              <AppIcon name="verified_user" size={20} color="#009668" />
            </View>
            <View style={styles.kpiCardHeader}>
              <Text style={styles.kpiCardLabel}>Active</Text>
              <View style={styles.activePercentBadge}>
                <Text style={styles.activePercentText}>
                  {adminUsers.length > 0
                    ? `${Math.round((adminUsers.filter((a) => a.status === 'active').length / adminUsers.length) * 100)}%`
                    : '0%'}
                </Text>
              </View>
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiBigNumber}>
                {adminUsers.filter((a) => a.status === 'active').length}
              </Text>
              <Text style={styles.kpiSubtext}>Operational verified</Text>
            </View>
          </View>

          {/* Card 3: Pending */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiWatermarkBox}>
              <AppIcon name="hourglass_top" size={20} color="#0051D5" />
            </View>
            <View style={styles.kpiCardHeader}>
              <Text style={styles.kpiCardLabel}>Pending</Text>
              <View style={[styles.kpiDot, { backgroundColor: '#316BF3' }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiBigNumber}>
                {adminUsers.filter((a) => a.status === 'pending').length}
              </Text>
              <Text style={styles.kpiSubtext}>Invitation in-flight</Text>
            </View>
          </View>

          {/* Card 4: Suspended */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiWatermarkBox}>
              <AppIcon name="gavel" size={20} color="#BA1A1A" />
            </View>
            <View style={styles.kpiCardHeader}>
              <Text style={styles.kpiCardLabel}>Suspended</Text>
              <View style={[styles.kpiDot, { backgroundColor: '#C6C6CD' }]} />
            </View>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiBigNumber}>
                {adminUsers.filter((a) => a.status === 'suspended').length}
              </Text>
              <Text style={styles.kpiSubtext}>Zero infractions</Text>
            </View>
          </View>
        </View>

        {/* Segmented Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          {[
            { key: 'all', label: `All (${adminUsers.length})` },
            {
              key: 'active',
              label: `Active (${adminUsers.filter((a) => a.status === 'active').length})`,
            },
            {
              key: 'pending',
              label: `Pending (${adminUsers.filter((a) => a.status === 'pending').length})`,
            },
            {
              key: 'suspended',
              label: `Suspended (${adminUsers.filter((a) => a.status === 'suspended').length})`,
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTabButton,
                  isSelected && styles.filterTabButtonActive,
                ]}
                onPress={() => setActiveTab(tab.key as FilterTab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabButtonText,
                    isSelected && styles.filterTabButtonTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Admin Cards List */}
        <View style={styles.adminCardsStack}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
          ) : filteredAdmins.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <AppIcon name="Users" size={24} color={Colors.outline} />
              <Text style={{ marginTop: 8, fontSize: 16, fontWeight: '600', color: Colors.onSurface }}>
                No Administrator Accounts Found
              </Text>
            </View>
          ) : (
            filteredAdmins.map((user) => (
            <View key={user.id} style={styles.adminCard}>
              {/* Card Header Row */}
              <View style={styles.adminCardTop}>
                <View style={styles.adminCardProfileLeft}>
                  {user.avatarUri ? (
                    <View style={styles.adminAvatarBox}>
                      <Image
                        source={{ uri: user.avatarUri }}
                        style={styles.adminAvatarImg}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.adminAvatarBox,
                        { backgroundColor: user.avatarBgColor || '#DBE1FF' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInitialsText,
                          user.roleBadgeType === 'ops' && { color: '#00174B' },
                        ]}
                      >
                        {user.avatarInitials || 'AD'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.adminProfileInfo}>
                    <View style={styles.adminNameRow}>
                      <Text style={styles.adminNameText} numberOfLines={1}>
                        {user.name}
                      </Text>

                      {/* Role Badge */}
                      <View
                        style={[
                          styles.roleBadge,
                          user.roleBadgeType === 'super' && styles.roleBadgeSuper,
                          user.roleBadgeType === 'ops' && styles.roleBadgeOps,
                          user.roleBadgeType === 'support' && styles.roleBadgeSupport,
                          user.roleBadgeType === 'finance' && styles.roleBadgeFinance,
                        ]}
                      >
                        <AppIcon
                          name={user.roleIcon}
                          size={13}
                          color={user.roleBadgeType === 'super' ? '#FFFFFF' : '#00174B'}
                        />
                        <Text
                          style={[
                            styles.roleBadgeText,
                            user.roleBadgeType === 'super' && styles.roleBadgeTextSuper,
                            user.roleBadgeType === 'ops' && styles.roleBadgeTextOps,
                            user.roleBadgeType === 'support' && styles.roleBadgeTextSupport,
                            user.roleBadgeType === 'finance' && styles.roleBadgeTextFinance,
                          ]}
                        >
                          {user.role}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.adminEmailText} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusPill,
                    user.status === 'active' && styles.statusPillActive,
                    user.status === 'pending' && styles.statusPillPending,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      user.status === 'active' && styles.statusDotActive,
                      user.status === 'pending' && styles.statusDotPending,
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      user.status === 'active' && styles.statusPillTextActive,
                      user.status === 'pending' && styles.statusPillTextPending,
                    ]}
                  >
                    {user.statusLabel}
                  </Text>
                </View>
              </View>

              {/* Access Specification Block */}
              <View style={styles.accessSpecBlock}>
                <View style={styles.accessSpecRow}>
                  <View style={styles.accessSpecLabelGroup}>
                    <AppIcon name={user.roleBadgeType === 'super'
                        ? 'lock_open'
                        : user.roleBadgeType === 'ops'
                        ? 'tune'
                        : user.roleBadgeType === 'support'
                        ? 'verified'
                        : 'account_balance'} size={14} color="#45464D" />
                    <Text style={styles.accessSpecLabel}>
                      {user.accessTitle}
                    </Text>
                  </View>
                  <Text style={styles.accessSpecValue} numberOfLines={1}>
                    {user.accessValue}
                  </Text>
                </View>

                <View style={styles.accessSpecRow}>
                  <View style={styles.accessSpecLabelGroup}>
                    <AppIcon name={user.status === 'pending'
                        ? 'mark_email_unread'
                        : 'schedule'} size={14} color="#45464D" />
                    <Text style={styles.accessSpecLabel}>
                      {user.lastActiveLabel}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.accessSpecValueMuted,
                      user.status === 'pending' && { color: '#0051D5', fontFamily: 'Inter-SemiBold' },
                    ]}
                    numberOfLines={1}
                  >
                    {user.lastActiveValue}
                  </Text>
                </View>
              </View>

              {/* Card Footer Row */}
              <View style={styles.adminCardFooter}>
                <Text style={styles.secKeyText}>{user.secKey}</Text>

                {user.actionType === 'view_profile' ? (
                  <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => handleViewProfile(user)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                    <AppIcon name="arrow_forward" size={14} color="#191C1E" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.resendInviteButton}
                    onPress={() => handleResendInvitation(user)}
                    activeOpacity={0.85}
                  >
                    <AppIcon name="send" size={14} color="#FFFFFF" />
                    <Text style={styles.resendInviteText}>Review & Resend</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
        </View>

        {/* Automated Session Safeguard Strip */}
        <View style={styles.safeguardCard}>
          <View style={styles.safeguardTop}>
            <View style={styles.safeguardIconBox}>
              <AppIcon name="verified" size={20} />
            </View>
            <View style={styles.safeguardTextCol}>
              <Text style={styles.safeguardTitle}>
                Automated Session Safeguard
              </Text>
              <Text style={styles.safeguardDesc}>
                2FA enforcement & IP boundary binding are universally applied.
              </Text>
            </View>
          </View>

          <View style={styles.rotationSubCard}>
            <View style={styles.rotationLeft}>
              <AppIcon name="sync_lock" size={20} />
              <Text style={styles.rotationText}>
                Next token rotation in 4d 12h
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => displayToast('Governance session policies loaded')}
              activeOpacity={0.7}
            >
              <Text style={styles.policiesLink}>Policies</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cryptographic Protection Footer */}
        <View style={styles.protectionFooter}>
          <Text style={styles.protectionFooterText}>
            ChairCare Administrative Directory is protected by 256-bit cryptographic access audit logging.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Toast Notification */}
      {toastVisible && (
        <View
          style={[
            styles.toastNotification,
            { top: Math.max(insets.top, 10) + 64 },
          ]}
        >
          <AppIcon name="check_circle" size={20} />
          <Text style={styles.toastMessageText} numberOfLines={2}>
            {toastMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  headerContainer: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E8EA',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#131B2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBadgeText: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#FFFFFF',
  },
  headerTitlesCol: {
    flex: 1,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    color: '#191C1E',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  headerSubtitleText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEEF0',
  },
  actionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#45464D',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0051D5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    ...Shadows.level1,
  },
  headerAddBtnIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerAddBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#FFFFFF',
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  scrollContentDesktop: {
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },

  // Protocol Bar
  protocolBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(230, 232, 234, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  protocolLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051D5',
  },
  protocolText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#191C1E',
    letterSpacing: 0.4,
  },
  auditActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
    ...Shadows.level1,
  },
  auditIcon: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#009668',
  },
  auditActiveText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#45464D',
  },

  // Search Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    ...Shadows.level1,
  },
  searchIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#76777D',
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    color: '#191C1E',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#76777D',
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6E8EA',
    ...Shadows.level1,
  },
  filterActionIcon: {
    fontFamily: 'Material Icons',
    fontSize: 20,
    color: '#191C1E',
  },
  addAdminShortcutBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#0051D5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  addAdminShortcutIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#FFFFFF',
  },

  // 2x2 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  kpiWatermarkBox: {
    position: 'absolute',
    right: 4,
    top: 4,
    opacity: 0.08,
  },
  kpiWatermarkIcon: {
    fontFamily: 'Material Icons',
    fontSize: 44,
    color: '#000000',
  },
  kpiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiCardLabel: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10.5,
    color: '#45464D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  activePercentBadge: {
    backgroundColor: '#6FFBBE',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  activePercentText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
    color: '#002113',
  },
  kpiValueRow: {
    marginTop: 6,
  },
  kpiBigNumber: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 26,
    color: '#191C1E',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  kpiSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464D',
    marginTop: 2,
  },

  // Filter Tabs
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6E8EA',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  filterTabButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabButtonActive: {
    backgroundColor: '#0F172A',
    ...Shadows.level1,
  },
  filterTabButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#45464D',
  },
  filterTabButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },

  // Admin Cards Stack
  adminCardsStack: {
    gap: 12,
  },
  adminCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E8EA',
    gap: 10,
    ...Shadows.level1,
  },
  adminCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  adminCardProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  adminAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131B2E',
  },
  adminAvatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    color: '#191C1E',
  },
  adminProfileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  adminNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  adminNameText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    color: '#191C1E',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeSuper: {
    backgroundColor: '#131B2E',
  },
  roleBadgeOps: {
    backgroundColor: '#DBE1FF',
  },
  roleBadgeSupport: {
    backgroundColor: 'rgba(180, 197, 255, 0.4)',
  },
  roleBadgeFinance: {
    backgroundColor: '#6FFBBE',
  },
  roleBadgeIcon: {
    fontFamily: 'Material Icons',
    fontSize: 12,
  },
  roleBadgeIconSuper: {
    color: '#FFFFFF',
  },
  roleBadgeIconOps: {
    color: '#00174B',
  },
  roleBadgeIconSupport: {
    color: '#003EA8',
  },
  roleBadgeIconFinance: {
    color: '#002113',
  },
  roleBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
  },
  roleBadgeTextSuper: {
    color: '#FFFFFF',
  },
  roleBadgeTextOps: {
    color: '#00174B',
  },
  roleBadgeTextSupport: {
    color: '#003EA8',
  },
  roleBadgeTextFinance: {
    color: '#002113',
  },
  adminEmailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464D',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 12,
  },
  statusPillActive: {
    backgroundColor: '#6FFBBE',
  },
  statusPillPending: {
    backgroundColor: '#E6E8EA',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusDotActive: {
    backgroundColor: '#009668',
  },
  statusDotPending: {
    backgroundColor: '#0051D5',
  },
  statusPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9.5,
  },
  statusPillTextActive: {
    color: '#002113',
  },
  statusPillTextPending: {
    color: '#191C1E',
  },

  // Access Spec Block
  accessSpecBlock: {
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  accessSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accessSpecLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessSpecIcon: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#45464D',
  },
  accessSpecLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464D',
  },
  accessSpecValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    color: '#191C1E',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  accessSpecValueMuted: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#191C1E',
  },

  // Card Footer
  adminCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  secKeyText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777D',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6E8EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewProfileText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191C1E',
  },
  viewProfileIcon: {
    fontFamily: 'Material Icons',
    fontSize: 15,
    color: '#191C1E',
  },
  resendInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0051D5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    ...Shadows.level1,
  },
  resendInviteIcon: {
    fontFamily: 'Material Icons',
    fontSize: 13,
    color: '#FFFFFF',
  },
  resendInviteText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    color: '#FFFFFF',
  },

  // Safeguard Card
  safeguardCard: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    ...Shadows.level1,
  },
  safeguardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safeguardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBE1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  safeguardIcon: {
    fontFamily: 'Material Icons',
    fontSize: 18,
    color: '#00174B',
  },
  safeguardTextCol: {
    flex: 1,
    gap: 2,
  },
  safeguardTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 14,
    color: '#191C1E',
  },
  safeguardDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: 11.5,
    color: '#45464D',
    lineHeight: 16,
  },
  rotationSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rotationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rotationIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#0051D5',
  },
  rotationText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191C1E',
  },
  policiesLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#0051D5',
  },

  // Protection Footer
  protectionFooter: {
    backgroundColor: 'rgba(230, 232, 234, 0.4)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  protectionFooterText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10.5,
    color: '#45464D',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Floating Toast Notification
  toastNotification: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#2D3133',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
    zIndex: 999,
    ...Shadows.level2,
  },
  toastCheckIcon: {
    fontFamily: 'Material Icons',
    fontSize: 16,
    color: '#6FFBBE',
  },
  toastMessageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12.5,
    color: '#EFF1F3',
  },
});
