import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';

interface CustomersScreenProps {
  navigation?: any;
}

export type CustomerFilterTab = 'all' | 'active' | 'new' | 'blocked';

export interface CustomerRosterItem {
  id: string;
  name: string;
  initials: string;
  avatarBgColor: string;
  avatarTextColor: string;
  isVerified: boolean;
  location: string;
  status: 'active' | 'new' | 'blocked';
  statusLabel: string;
  requestsCount: number;
  totalSpentFormatted: string;
  rating: number;
  lastServiceTitle: string;
  lastServiceTime: string;
  isHold?: boolean;
  holdReason?: string;
  phone?: string;
  email?: string;
}

export const CustomersChaircareMobileScreen: React.FC<CustomersScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState<CustomerRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<CustomerFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMatrixOpen, setFilterMatrixOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAllCustomers();
      if (res.success && Array.isArray(res.data)) {
        const mapped: CustomerRosterItem[] = res.data.map((c: any) => {
          const initials = (c.name || 'CU')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          const status: 'active' | 'new' | 'blocked' = !c.isActive
            ? 'blocked'
            : c.requestsCount === 0
            ? 'new'
            : 'active';
          const statusLabel =
            status === 'active'
              ? 'Active'
              : status === 'new'
              ? 'New Customer'
              : 'Suspended';

          return {
            id: c.id,
            name: c.name,
            initials,
            avatarBgColor: status === 'blocked' ? '#ffdad6' : '#131b2e',
            avatarTextColor: status === 'blocked' ? '#ba1a1a' : '#ffffff',
            isVerified: true,
            location: c.location || 'NCR Region',
            status,
            statusLabel,
            requestsCount: c.requestsCount || 0,
            totalSpentFormatted:
              c.totalSpent > 0 ? `₹${c.totalSpent.toLocaleString()} spent` : '₹0 spent',
            rating: 5.0,
            lastServiceTitle: c.lastServiceTitle || 'No Service Yet',
            lastServiceTime:
              c.lastServiceTime !== 'None'
                ? new Date(c.lastServiceTime).toLocaleDateString()
                : 'Never',
            phone: c.phone,
            email: c.email,
          };
        });
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn('Failed to load real customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, loadCustomers);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.status === 'active').length;
  const newCount = customers.filter((c) => c.status === 'new').length;
  const blockedCount = customers.filter((c) => c.status === 'blocked').length;

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesTab =
        selectedTab === 'all' ||
        (selectedTab === 'new'
          ? cust.requestsCount < 5 && cust.status === 'active'
          : cust.status === selectedTab);

      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        cust.name.toLowerCase().includes(q) ||
        cust.location.toLowerCase().includes(q) ||
        (cust.phone && cust.phone.toLowerCase().includes(q)) ||
        cust.lastServiceTitle.toLowerCase().includes(q)
      );
    });
  }, [customers, selectedTab, searchQuery]);

  const handleSelectCustomer = (customer: CustomerRosterItem) => {
    if (navigation) {
      navigation.navigate('CustomerProfileAnshKumar', {
        customerId: customer.id,
        customer,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
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
          <View>
            <Text style={styles.headerEyebrow}>CUSTOMER DIRECTORY</Text>
            <Text style={styles.headerTitle}>All Customers</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => showToast('Search filter active')}
            activeOpacity={0.7}
            accessibilityLabel="Search accounts"
          >
            <AppIcon name="Search" size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminAvatarCircle}
            onPress={() => navigation?.navigate('AdminSettingsTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Floating Toast */}
      {toastMessage && (
        <View style={[styles.toastContainer, { top: Math.max(insets.top, 12) + 56 }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* 3. Main Scrollable Container */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-header & Live Registry Status */}
        <View style={styles.registryStatusRow}>
          <View style={styles.registryStatusLeft}>
            <View style={styles.pingDotWrapper}>
              <View style={styles.pingDotLive} />
            </View>
            <Text style={styles.registryStatusText}>CUSTOMER REGISTRY • NCR CORRIDOR</Text>
          </View>
          <View style={styles.versionBadge}>
            <Text style={styles.versionBadgeText}>v3.4 Live</Text>
          </View>
        </View>

        {/* Search & Filter Trigger Bar */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputWrapper}>
            <AppIcon name="Search" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search customers by name, phone, ticket..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterTriggerBtn,
              filterMatrixOpen && styles.filterTriggerBtnActive,
            ]}
            onPress={() => {
              setFilterMatrixOpen(!filterMatrixOpen);
              showToast(filterMatrixOpen ? 'Filter matrix closed' : 'Filter matrix active');
            }}
            activeOpacity={0.75}
            accessibilityLabel="Open filter matrix"
          >
            <AppIcon name="Settings" size={18} />
          </TouchableOpacity>
        </View>

        {/* Compact Summary KPI Grid (2x2) */}
        <View style={styles.kpiGrid}>
          {/* KPI 1: Total Customers */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>TOTAL CUSTOMERS</Text>
              <View style={styles.kpiIconBox}>
                <AppIcon name="Users" size={18} />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={styles.kpiValue}>{totalCustomers}</Text>
              <Text style={styles.kpiSubtext}>Registered accounts</Text>
            </View>
          </View>

          {/* KPI 2: Active */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>ACTIVE</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: 'rgba(78, 222, 163, 0.2)' }]}>
                <AppIcon name="CheckCircle" size={18} />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={styles.kpiValue}>{activeCount}</Text>
              <View style={styles.kpiSubtextRow}>
                <View style={[styles.kpiDot, { backgroundColor: '#009668' }]} />
                <Text style={[styles.kpiSubtext, { color: '#009668', fontWeight: '600' }]}>
                  {totalCustomers > 0 ? `${Math.round((activeCount / totalCustomers) * 100)}% active` : '0% active'}
                </Text>
              </View>
            </View>
          </View>

          {/* KPI 3: New This Month */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>NEW CUSTOMERS</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#dbe1ff' }]}>
                <AppIcon name="User" size={18} />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={styles.kpiValue}>{newCount}</Text>
              <Text style={[styles.kpiSubtext, { color: Colors.secondaryCobalt, fontWeight: '600' }]}>
                Recent signups
              </Text>
            </View>
          </View>

          {/* KPI 4: Blocked / Compliance */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <Text style={styles.kpiLabel}>BLOCKED</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#ffdad6' }]}>
                <AppIcon name="CircleAlert" size={16} color="#BA1A1A" />
              </View>
            </View>
            <View style={styles.kpiBottomCol}>
              <Text style={[styles.kpiValue, { color: '#ba1a1a' }]}>{blockedCount}</Text>
              <View style={styles.kpiSubtextRow}>
                <View style={[styles.kpiDot, { backgroundColor: '#ba1a1a' }]} />
                <Text style={[styles.kpiSubtext, { color: '#ba1a1a', fontWeight: '600' }]}>
                  Compliance hold
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Segmented Horizontally Scrollable Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          <TouchableOpacity
            style={[
              styles.tabPill,
              selectedTab === 'all' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setSelectedTab('all')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabPillText,
                selectedTab === 'all' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              All
            </Text>
            <Text
              style={[
                styles.tabCountText,
                selectedTab === 'all' ? styles.tabCountActive : styles.tabCountInactive,
              ]}
            >
              {totalCustomers}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              selectedTab === 'active' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setSelectedTab('active')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabPillText,
                selectedTab === 'active' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Active
            </Text>
            <Text
              style={[
                styles.tabCountText,
                selectedTab === 'active' ? styles.tabCountActive : styles.tabCountInactive,
              ]}
            >
              {activeCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              selectedTab === 'new' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setSelectedTab('new')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabPillText,
                selectedTab === 'new' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              New
            </Text>
            <Text
              style={[
                styles.tabCountText,
                selectedTab === 'new' ? styles.tabCountActive : styles.tabCountInactive,
              ]}
            >
              {newCount}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              selectedTab === 'blocked' ? styles.tabPillActive : styles.tabPillInactive,
            ]}
            onPress={() => setSelectedTab('blocked')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.tabPillText,
                selectedTab === 'blocked' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Blocked
            </Text>
            <Text
              style={[
                styles.tabCountText,
                selectedTab === 'blocked' ? styles.tabCountActive : styles.tabCountInactive,
              ]}
            >
              {blockedCount}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Customer Cards List */}
        <View style={styles.customerList}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
          ) : filteredCustomers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <AppIcon name="Users" size={24} color={Colors.outline} />
              <Text style={styles.emptyTitle}>No Customers Found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'all'
                  ? 'No registered customer accounts found in the database.'
                  : `No customers matching filter "${selectedTab}".`}
              </Text>
              {(selectedTab !== 'all' || searchQuery.length > 0) && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setSelectedTab('all');
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredCustomers.map((cust) => {
              const isBlocked = cust.status === 'blocked';
              return (
                <TouchableOpacity
                  key={cust.id}
                  style={styles.customerCard}
                  onPress={() => handleSelectCustomer(cust)}
                  activeOpacity={0.92}
                >
                  {/* Top Row: Avatar, Name, Location & Status Pill */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardProfileLeft}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: cust.avatarBgColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarInitials,
                            { color: cust.avatarTextColor },
                          ]}
                        >
                          {cust.initials}
                        </Text>
                        <View
                          style={[
                            styles.avatarCheckBadge,
                            isBlocked
                              ? styles.avatarBadgeBlocked
                              : styles.avatarBadgeActive,
                          ]}
                        >
                          <AppIcon name={isBlocked ? 'AlertTriangle' : 'Check'} size={10} color="#ffffff" />
                        </View>
                      </View>

                      <View style={styles.nameLocationCol}>
                        <View style={styles.nameVerifiedRow}>
                          <Text style={styles.customerName} numberOfLines={1}>
                            {cust.name}
                          </Text>
                          {cust.isVerified && (
                            <AppIcon name="ShieldCheck" size={16} color="#009668" />
                          )}
                        </View>
                        <Text style={styles.locationText} numberOfLines={1}>
                          {cust.location}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusPillBadge,
                        isBlocked
                          ? styles.statusPillBlocked
                          : styles.statusPillNormal,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          isBlocked
                            ? styles.statusDotBlocked
                            : styles.statusDotActive,
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillLabel,
                          isBlocked
                            ? styles.statusTextBlocked
                            : styles.statusTextActive,
                        ]}
                      >
                        {cust.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Warning / Hold Escalation Banner if Blocked */}
                  {isBlocked && cust.holdReason && (
                    <View style={styles.warningHoldBanner}>
                      <AppIcon name="TriangleAlert" size={18} />
                      <Text style={styles.warningHoldText} numberOfLines={1}>
                        {cust.holdReason}
                      </Text>
                    </View>
                  )}

                  {/* Quick Metrics Row */}
                  <View style={styles.quickMetricsRow}>
                    <View style={styles.metricItem}>
                      <AppIcon name="Wrench" size={18} />
                      <Text style={styles.metricText}>{cust.requestsCount} requests</Text>
                    </View>

                    <View style={styles.spentBadge}>
                      <Text style={styles.spentText}>{cust.totalSpentFormatted}</Text>
                    </View>

                    <View style={styles.ratingBox}>
                      <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingValue}>{cust.rating}</Text>
                    </View>
                  </View>

                  {/* Last Service & Action Row */}
                  <View style={styles.cardFooterRow}>
                    <View style={styles.lastServiceLeft}>
                      <AppIcon name={isBlocked ? 'Clock' : 'CheckCircle2'} size={15} color={isBlocked ? '#ba1a1a' : '#009668'} />
                      <Text style={styles.lastServiceText} numberOfLines={1}>
                        Last: <Text style={styles.lastServiceBold}>{cust.lastServiceTitle}</Text> •{' '}
                        {cust.lastServiceTime}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.cardActionBtn,
                        isBlocked ? styles.cardActionBtnBlocked : styles.cardActionBtnNormal,
                      ]}
                      onPress={() => handleSelectCustomer(cust)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.cardActionBtnText,
                          isBlocked ? styles.cardActionTextBlocked : styles.cardActionTextNormal,
                        ]}
                      >
                        {isBlocked ? 'Review / Manage' : 'View Profile'}
                      </Text>
                      <Text
                        style={[
                          styles.cardActionArrow,
                          isBlocked ? styles.cardActionTextBlocked : styles.cardActionTextNormal,
                        ]}
                      >
                        {isBlocked ? 'AUDIT' : '→'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Telemetry Footnote */}
        <View style={styles.telemetryFootnote}>
          <AppIcon name="RefreshCw" size={18} />
          <Text style={styles.telemetrySyncText}>
            Customer Database Active • Live Records
          </Text>
        </View>
      </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIcon: {
    fontSize: 18,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '800',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    ...Shadows.level1,
  },
  headerActionIcon: {
    fontSize: 16,
  },
  adminAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#191c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarIcon: {
    fontSize: 15,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#191c1e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    zIndex: 999,
    ...Shadows.level2,
  },
  toastText: {
    ...Typography.bodySm,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  registryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  registryStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingDotWrapper: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 81, 213, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  registryStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  versionBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#45464d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    ...Shadows.level1,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: '#191c1e',
    height: '100%',
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchIcon: {
    fontSize: 12,
    color: '#76777d',
  },
  filterTriggerBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  filterTriggerBtnActive: {
    backgroundColor: '#e6e8ea',
  },
  filterTriggerIcon: {
    fontSize: 17,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    ...Shadows.level1,
    justifyContent: 'space-between',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#76777d',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiEmoji: {
    fontSize: 13,
  },
  kpiBottomCol: {
    marginTop: 8,
  },
  kpiValue: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '800',
    color: '#191c1e',
    letterSpacing: -0.5,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#76777d',
    marginTop: 2,
  },
  kpiSubtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  kpiDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  tabPillActive: {
    backgroundColor: '#191c1e',
  },
  tabPillInactive: {
    backgroundColor: '#f2f4f6',
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextInactive: {
    color: '#45464d',
  },
  tabCountText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabCountActive: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  tabCountInactive: {
    color: '#76777d',
  },
  customerList: {
    gap: 12,
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    ...Shadows.level1,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  emptySubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#76777d',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  resetFilterBtn: {
    backgroundColor: '#191c1e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    ...Shadows.level1,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarBadgeActive: {
    backgroundColor: '#009668',
  },
  avatarBadgeBlocked: {
    backgroundColor: '#ba1a1a',
  },
  avatarBadgeSymbol: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  nameLocationCol: {
    flex: 1,
    minWidth: 0,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  customerName: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
    flexShrink: 1,
  },
  verifiedCheckmark: {
    fontSize: 12,
  },
  locationText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#76777d',
    marginTop: 1,
  },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillNormal: {
    backgroundColor: '#f2f4f6',
  },
  statusPillBlocked: {
    backgroundColor: '#ffdad6',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusDotActive: {
    backgroundColor: '#009668',
  },
  statusDotBlocked: {
    backgroundColor: '#ba1a1a',
  },
  statusPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#005236',
  },
  statusTextBlocked: {
    color: '#93000a',
  },
  warningHoldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 218, 214, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  warningHoldIcon: {
    fontSize: 13,
  },
  warningHoldText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ba1a1a',
    flex: 1,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricIcon: {
    fontSize: 13,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  spentBadge: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  spentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#191c1e',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  starIcon: {
    fontSize: 12,
    color: '#f59e0b',
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 2,
  },
  lastServiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  lastServiceIcon: {
    fontSize: 12,
  },
  lastServiceText: {
    fontSize: 11,
    color: '#76777d',
    flexShrink: 1,
  },
  lastServiceBold: {
    fontWeight: '600',
    color: '#191c1e',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  cardActionBtnNormal: {
    backgroundColor: '#eceef0',
  },
  cardActionBtnBlocked: {
    backgroundColor: '#ffdad6',
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionTextNormal: {
    color: '#191c1e',
  },
  cardActionTextBlocked: {
    color: '#93000a',
  },
  cardActionArrow: {
    fontSize: 12,
    fontWeight: '700',
  },
  telemetryFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f2f4f6',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  telemetrySyncIcon: {
    fontSize: 13,
  },
  telemetrySyncText: {
    fontSize: 11,
    color: '#76777d',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    zIndex: 60,
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  navTabItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
  },
  activeIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPingDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  navTabIcon: {
    fontSize: 18,
    color: '#76777d',
  },
  navTabIconActive: {
    fontSize: 18,
  },
  navTabLabel: {
    fontSize: 10,
    color: '#76777d',
    marginTop: 2,
    fontWeight: '600',
  },
  navTabLabelActive: {
    fontSize: 10,
    color: '#0051d5',
    marginTop: 2,
    fontWeight: '700',
  },
});
