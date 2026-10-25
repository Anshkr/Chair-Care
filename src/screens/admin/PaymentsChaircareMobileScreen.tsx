import { AppIcon } from '../../components/common/AppIcon';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';

interface PaymentsScreenProps {
  navigation?: any;
  route?: any;
}

export type PaymentFilterTab = 'all' | 'successful' | 'pending' | 'failed' | 'refunded';

export interface PaymentTransactionItem {
  id: string;
  code: string;
  status: 'successful' | 'pending' | 'failed' | 'refunded';
  statusLabel: string;
  amountFormatted: string;
  amountNumber: number;
  isRefunded?: boolean;
  customerName: string;
  customerLocation: string;
  technicianName: string;
  technicianRoleOrService: string;
  paymentMethodText: string;
  paymentMethodType: 'upi' | 'card' | 'netbanking';
  paymentTimestamp: string;
  statusNote?: string;
  actionButtonLabel: string;
  actionIcon?: string;
  serviceId?: string;
  gatewayRef?: string;
}

export const PaymentsChaircareMobileScreen: React.FC<PaymentsScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isTab = route?.name === 'PaymentsTab';

  const [payments, setPayments] = useState<PaymentTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<PaymentFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Pulse animation for gateway status
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

  const loadPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPayments();
      if (res.success && Array.isArray(res.data)) {
        const mapped: PaymentTransactionItem[] = res.data.map((p: any) => {
          let status: 'successful' | 'pending' | 'failed' | 'refunded' = 'successful';
          let statusLabel = 'Successful';

          if (p.status === 'pending') {
            status = 'pending';
            statusLabel = 'Pending Escrow';
          } else if (p.status === 'failed') {
            status = 'failed';
            statusLabel = 'Failed';
          } else if (p.status === 'refunded') {
            status = 'refunded';
            statusLabel = 'Refunded';
          }

          return {
            id: p.id,
            code: p.transactionId || `TXN-${p.id.substring(0, 6)}`,
            status,
            statusLabel,
            amountFormatted: `₹${Number(p.amount || 0).toLocaleString()}`,
            amountNumber: Number(p.amount || 0),
            isRefunded: status === 'refunded',
            customerName: p.customerName || 'Customer',
            customerLocation: 'Gurugram / Delhi NCR',
            technicianName: 'Field Specialist',
            technicianRoleOrService: `Service ${p.trackingCode || '#CC'}`,
            paymentMethodText: `${p.provider || 'Gateway'} • ${new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            paymentMethodType: 'upi',
            paymentTimestamp: new Date(p.createdAt).toLocaleDateString(),
            actionButtonLabel: 'Inspect',
            actionIcon: 'chevron_right',
            serviceId: p.trackingCode || '#CC',
            gatewayRef: p.transactionId,
          };
        });
        setPayments(mapped);
      }
    } catch (err) {
      console.warn('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, loadPayments);

  // Tab count metrics
  const tabCounts = useMemo(() => {
    return {
      all: payments.length.toString(),
      successful: payments.filter((p) => p.status === 'successful').length.toString(),
      pending: payments.filter((p) => p.status === 'pending').length.toString(),
      failed: payments.filter((p) => p.status === 'failed').length.toString(),
      refunded: payments.filter((p) => p.status === 'refunded').length.toString(),
    };
  }, [payments]);

  const totalRevenue = useMemo(() => {
    return payments
      .filter((p) => p.status === 'successful')
      .reduce((sum, p) => sum + p.amountNumber, 0);
  }, [payments]);

  const pendingCount = useMemo(() => {
    return payments.filter((p) => p.status === 'pending').length;
  }, [payments]);

  const refundsTotal = useMemo(() => {
    return payments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amountNumber, 0);
  }, [payments]);

  // Filtered transactions
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Tab filter
      if (activeTab !== 'all' && item.status !== activeTab) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesCust = item.customerName.toLowerCase().includes(query);
        const matchesTech = item.technicianName.toLowerCase().includes(query);
        const matchesLoc = item.customerLocation.toLowerCase().includes(query);
        const matchesMethod = item.paymentMethodText.toLowerCase().includes(query);
        return matchesCode || matchesCust || matchesTech || matchesLoc || matchesMethod;
      }
      return true;
    });
  }, [payments, activeTab, searchQuery]);

  // Navigate to Payment Details (A20)
  const handleSelectPayment = (payment: PaymentTransactionItem) => {
    if (navigation) {
      navigation.navigate('PaymentDetailsTxn84291', {
        txnId: payment.id,
        transaction: payment,
      });
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return 'credit_card';
      case 'netbanking':
        return 'account_balance';
      default:
        return 'account_balance_wallet';
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar with Ambient Glass Styling */}
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
          <Text style={styles.headerTitleText}>Payments</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            activeOpacity={0.7}
            onPress={() => {
              if (navigation) {
                navigation.navigate('Notifications');
              }
            }}
          >
            <AppIcon name="notifications" size={20} />
          </TouchableOpacity>
          <AdminHeaderAvatar size={34} />
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Page Header & Telemetry Status Bar */}
        <View style={styles.telemetrySection}>
          <View style={styles.telemetryTopRow}>
            <View style={styles.gatewayStatusPill}>
              <Animated.View
                style={[styles.gatewayStatusDot, { opacity: pulseAnim }]}
              />
              <Text style={styles.gatewayStatusText}>
                REAL-TIME SETTLEMENTS • GATEWAY SYNC
              </Text>
            </View>

            <View style={styles.telemetryActions}>
              <TouchableOpacity
                style={[
                  styles.toolIconButton,
                  showSearchInput && styles.toolIconButtonActive,
                ]}
                onPress={() => setShowSearchInput(!showSearchInput)}
                activeOpacity={0.7}
              >
                <AppIcon name="search" size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.toolIconButton}
                onPress={() => {
                  // Cycle tabs or toggle filter
                  setActiveTab((prev) =>
                    prev === 'all'
                      ? 'pending'
                      : prev === 'pending'
                      ? 'successful'
                      : 'all'
                  );
                }}
                activeOpacity={0.7}
              >
                <AppIcon name="tune" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar expandable input */}
          {showSearchInput && (
            <View style={styles.searchInputContainer}>
              <AppIcon name="search" size={20} />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search by TXN ID, Customer, Tech, Location..."
                placeholderTextColor="#76777d"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearBtn}
                >
                  <AppIcon name="close" size={20} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.pageTitleCol}>
            <Text style={styles.pageTitleHeading}>Payments</Text>
            <Text style={styles.pageTitleSubtitle}>
              Monitor transactions, invoices, refunds and payment status
            </Text>
          </View>
        </View>

        {/* 3. KPI 2x2 Metric Grid */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Today's Revenue */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHead}>
              <Text style={styles.kpiCardLabel}>Total Revenue</Text>
              <View style={styles.kpiIconContainer}>
                <AppIcon name="currency_rupee" size={20} />
              </View>
            </View>
            <Text style={styles.kpiValueText}>₹{totalRevenue.toLocaleString()}</Text>
            <View style={styles.kpiFooterRow}>
              <View style={styles.trendingPill}>
                <AppIcon name="trending_up" size={20} />
                <Text style={styles.trendingText}>LIVE</Text>
              </View>
              <Text style={styles.kpiSubText}>Settled volume</Text>
            </View>
          </View>

          {/* Card 2: This Month */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHead}>
              <Text style={styles.kpiCardLabel}>Completed Orders</Text>
              <View style={styles.kpiIconContainerMuted}>
                <AppIcon name="calendar_month" size={20} />
              </View>
            </View>
            <Text style={styles.kpiValueText}>{tabCounts.successful}</Text>
            <View style={styles.kpiProgressRow}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width:
                        payments.length > 0
                          ? `${Math.round(
                              (Number(tabCounts.successful) / payments.length) * 100
                            )}%`
                          : '0%',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressPercentText}>
                {payments.length > 0
                  ? `${Math.round(
                      (Number(tabCounts.successful) / payments.length) * 100
                    )}%`
                  : '0%'}
              </Text>
            </View>
          </View>

          {/* Card 3: Pending Payments */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHead}>
              <Text style={styles.kpiCardLabel}>Pending</Text>
              <View style={styles.kpiIconContainerAmber}>
                <AppIcon name="lock_clock" size={20} />
              </View>
            </View>
            <Text style={styles.kpiValueText}>{pendingCount}</Text>
            <View style={styles.kpiFooterRow}>
              <View style={styles.amberDot} />
              <Text style={styles.kpiSubText}>Escrow locked</Text>
            </View>
          </View>

          {/* Card 4: Refunds */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiCardHead}>
              <Text style={styles.kpiCardLabel}>Refunds</Text>
              <View style={styles.kpiIconContainerMuted}>
                <AppIcon name="replay" size={20} />
              </View>
            </View>
            <Text style={styles.kpiValueText}>₹{refundsTotal.toLocaleString()}</Text>
            <View style={styles.kpiFooterRow}>
              <Text style={styles.kpiSubText}>{tabCounts.refunded} processed</Text>
            </View>
          </View>
        </View>

        {/* 4. Status Segment Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {(
            [
              { key: 'all', label: 'All', count: tabCounts.all },
              { key: 'successful', label: 'Successful', count: tabCounts.successful },
              { key: 'pending', label: 'Pending', count: tabCounts.pending },
              { key: 'failed', label: 'Failed', count: tabCounts.failed },
              { key: 'refunded', label: 'Refunded', count: tabCounts.refunded },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentTabLabel,
                    isActive && styles.segmentTabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.segmentBadge,
                    isActive && styles.segmentBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBadgeText,
                      isActive && styles.segmentBadgeTextActive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Transaction List Cards */}
        <View style={styles.transactionListContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
          ) : filteredPayments.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <AppIcon name="search_off" size={24} color={Colors.outline} />
              <Text style={styles.emptyStateTitle}>No transactions found</Text>
              <Text style={styles.emptyStateDesc}>
                {activeTab === 'all'
                  ? 'No transaction records found in the database.'
                  : `No transactions with status "${activeTab}".`}
              </Text>
              {(activeTab !== 'all' || searchQuery.length > 0) && (
                <TouchableOpacity
                  style={styles.emptyResetButton}
                  onPress={() => {
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.emptyResetText}>Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredPayments.map((item) => {
              const isSuccess = item.status === 'successful';
              const isPending = item.status === 'pending';
              const isFailed = item.status === 'failed';
              const isRefund = item.status === 'refunded';

              return (
                <View key={item.id} style={styles.paymentCard}>
                  {/* Top Row: TXN code & status pill | Amount */}
                  <View style={styles.paymentCardTopRow}>
                    <View style={styles.paymentCodeStatusCol}>
                      <Text style={styles.paymentCodeText}>{item.code}</Text>
                      <View
                        style={[
                          styles.statusBadgePill,
                          isSuccess && styles.statusBadgeSuccess,
                          isPending && styles.statusBadgePending,
                          isFailed && styles.statusBadgeFailed,
                          isRefund && styles.statusBadgeRefunded,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            isSuccess && styles.statusDotSuccess,
                            isPending && styles.statusDotPending,
                            isFailed && styles.statusDotFailed,
                            isRefund && styles.statusDotRefunded,
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isSuccess && styles.textSuccessDark,
                            isPending && styles.textAmberDark,
                            isFailed && styles.textError,
                            isRefund && styles.textPurpleDark,
                          ]}
                        >
                          {item.statusLabel}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.paymentAmountText,
                        item.isRefunded && styles.paymentAmountRefunded,
                      ]}
                    >
                      {item.amountFormatted}
                    </Text>
                  </View>

                  {/* Customer & Technician 2-column info */}
                  <View style={styles.paymentDetailsGrid}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailColLabel}>Customer</Text>
                      <Text style={styles.detailColValue} numberOfLines={1}>
                        {item.customerName}
                      </Text>
                      <Text style={styles.detailColSub} numberOfLines={1}>
                        {item.customerLocation}
                      </Text>
                    </View>

                    <View style={styles.detailCol}>
                      <Text style={styles.detailColLabel}>Technician</Text>
                      <Text style={styles.detailColValue} numberOfLines={1}>
                        {item.technicianName}
                      </Text>
                      <Text
                        style={[
                          styles.detailColSub,
                          isSuccess && styles.textSecondary,
                        ]}
                        numberOfLines={1}
                      >
                        {item.technicianRoleOrService}
                      </Text>
                    </View>
                  </View>

                  {/* Status Note Banner (Pending, Failed, Refunded) */}
                  {item.statusNote && (
                    <View
                      style={[
                        styles.statusNoteBox,
                        isFailed && styles.statusNoteBoxFailed,
                      ]}
                    >
                      <AppIcon name={isFailed ? 'warning' : 'info'} size={20} />
                      <Text
                        style={[
                          styles.statusNoteText,
                          isFailed && styles.textError,
                        ]}
                        numberOfLines={1}
                      >
                        {item.statusNote}
                      </Text>
                    </View>
                  )}

                  {/* Bottom Strip: Method & Inspect Action */}
                  <View style={styles.paymentCardBottomStrip}>
                    <View style={styles.methodInfoLeft}>
                      <AppIcon name={getMethodIcon(item.paymentMethodType)} size={20} />
                      <Text
                        style={styles.methodInfoText}
                        numberOfLines={1}
                      >
                        {item.paymentMethodText}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.inspectButton}
                      onPress={() => handleSelectPayment(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.inspectButtonText}>
                        {item.actionButtonLabel}
                      </Text>
                      <AppIcon name={item.actionIcon || 'chevron_right'} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 6. Bottom Audit Telemetry Footer Pill */}
        <View style={styles.telemetryFooterPill}>
          <AppIcon name="verified_user" size={20} />
          <Text style={styles.telemetryFooterText}>
            Secure 256-bit Razorpay &amp; Cashfree Gateway Active
          </Text>
        </View>
      </ScrollView>

      {/* 7. Bottom Navigation Bar (Rendered when opened via stack screen) */}
      {!isTab && (
        <View
          style={[
            styles.bottomNavContainer,
            {
              backgroundColor: theme.surfaceContainerLowest,
              borderTopColor: theme.outlineHairline,
              paddingBottom: Math.max(insets.bottom, 8),
              height: 60 + Math.max(insets.bottom, 8),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => navigation?.navigate('AdminMain', { screen: 'AdminDashboardTab' })}
            activeOpacity={0.7}
          >
            <AppIcon name="LayoutDashboard" size={20} color={theme.outline} strokeWidth={1.8} />
            <Text style={[styles.navTabLabel, { color: theme.outline }]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => navigation?.navigate('AdminMain', { screen: 'ServiceRequestsTab' })}
            activeOpacity={0.7}
          >
            <AppIcon name="ClipboardList" size={20} color={theme.outline} strokeWidth={1.8} />
            <Text style={[styles.navTabLabel, { color: theme.outline }]}>Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => navigation?.navigate('AdminMain', { screen: 'TechniciansTab' })}
            activeOpacity={0.7}
          >
            <AppIcon name="Users" size={20} color={theme.outline} strokeWidth={1.8} />
            <Text style={[styles.navTabLabel, { color: theme.outline }]}>Technicians</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItemActive}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <AppIcon name="CreditCard" size={20} color={theme.secondaryCobalt} strokeWidth={2.2} />
            <Text style={[styles.navTabLabelActive, { color: theme.secondaryCobalt }]}>Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => navigation?.navigate('AdminMain', { screen: 'AdminSettingsTab' })}
            activeOpacity={0.7}
          >
            <AppIcon name="Settings" size={20} color={theme.outline} strokeWidth={1.8} />
            <Text style={[styles.navTabLabel, { color: theme.outline }]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
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
    borderBottomColor: '#eceef0',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
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
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* 2. Telemetry Section */
  telemetrySection: {
    gap: 8,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gatewayStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#e6e8ea',
    gap: 6,
    ...Shadows.level1,
  },
  gatewayStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  gatewayStatusText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#191c1e',
    fontWeight: '600',
  },
  telemetryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f2f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconButtonActive: {
    backgroundColor: '#dae2fd',
  },
  toolIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#45464d',
    includeFontPadding: false,
  },
  toolIconActive: {
    color: '#0051d5',
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#e0e3e5',
    ...Shadows.level1,
  },
  searchBarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#76777d',
    marginRight: 8,
    includeFontPadding: false,
  },
  searchTextInput: {
    flex: 1,
    ...Typography.bodySm,
    color: '#191c1e',
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
  },

  pageTitleCol: {
    marginTop: 2,
  },
  pageTitleHeading: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  pageTitleSubtitle: {
    ...Typography.bodySm,
    fontSize: 12.5,
    color: '#45464d',
    marginTop: 2,
  },

  /* 3. KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 14,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  kpiCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiCardLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#45464d',
  },
  kpiIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconRupee: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  kpiIconContainerMuted: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eceef0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconMuted: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#45464d',
    includeFontPadding: false,
  },
  kpiIconContainerAmber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconAmber: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#d97706',
    includeFontPadding: false,
  },
  kpiValueText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.3,
  },
  kpiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  trendingIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#003ea8',
    includeFontPadding: false,
  },
  trendingText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10.5,
    color: '#003ea8',
    fontWeight: '600',
  },
  kpiSubText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#45464d',
  },
  kpiProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e6e8ea',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#0051d5',
  },
  progressPercentText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#45464d',
    fontWeight: '600',
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },

  /* 4. Segment Tabs */
  tabsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tabsContentContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ffffff',
    gap: 6,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
  },
  segmentTabActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  segmentTabLabel: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#45464d',
  },
  segmentTabLabelActive: {
    color: '#ffffff',
  },
  segmentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    backgroundColor: '#eceef0',
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  segmentBadgeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
    fontWeight: '600',
  },
  segmentBadgeTextActive: {
    color: '#ffffff',
  },

  /* 5. Transaction Cards */
  transactionListContainer: {
    gap: 12,
    marginTop: 4,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: '#eceef0',
    overflow: 'hidden',
  },
  paymentCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentCodeStatusCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentCodeText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 12,
    color: '#45464d',
    letterSpacing: 0.4,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  statusBadgeFailed: {
    backgroundColor: '#ffdad6',
  },
  statusBadgeRefunded: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotSuccess: {
    backgroundColor: '#047857',
  },
  statusDotPending: {
    backgroundColor: '#b45309',
  },
  statusDotFailed: {
    backgroundColor: '#ba1a1a',
  },
  statusDotRefunded: {
    backgroundColor: '#9333ea',
  },
  statusBadgeText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 11,
    fontWeight: '600',
  },
  paymentAmountText: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
  },
  paymentAmountRefunded: {
    textDecorationLine: 'line-through',
    color: '#76777d',
  },

  paymentDetailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailCol: {
    flex: 1,
    gap: 1,
  },
  detailColLabel: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#76777d',
  },
  detailColValue: {
    ...Typography.bodyMd,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  detailColSub: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
  },

  statusNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusNoteBoxFailed: {
    backgroundColor: 'rgba(255, 218, 214, 0.5)',
  },
  statusNoteIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    includeFontPadding: false,
  },
  statusNoteText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
    flex: 1,
  },

  paymentCardBottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e3e5',
  },
  methodInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  methodIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#45464d',
    includeFontPadding: false,
  },
  methodInfoText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#45464d',
    flex: 1,
  },
  inspectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  inspectButtonText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },
  inspectButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },

  /* Empty State */
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.lg,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  emptyStateIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 40,
    color: '#76777d',
    includeFontPadding: false,
  },
  emptyStateTitle: {
    fontFamily: Typography.titleLg.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#191c1e',
  },
  emptyStateDesc: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#76777d',
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyResetButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eceef0',
  },
  emptyResetText: {
    fontFamily: Typography.labelMd.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#0051d5',
  },

  /* 6. Bottom Audit Telemetry */
  telemetryFooterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#eceef0',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
    ...Shadows.level1,
  },
  telemetryFooterIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  telemetryFooterText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#45464d',
    textAlign: 'center',
  },

  /* 7. Bottom Navigation Bar */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Shadows.level2,
    zIndex: 100,
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 8,
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
  },
  navTabItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 8,
  },
  navTabLabelActive: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  /* Color utilities */
  textSuccessDark: {
    color: '#065f46',
  },
  textAmber: {
    color: '#d97706',
  },
  textAmberDark: {
    color: '#92400e',
  },
  textError: {
    color: '#ba1a1a',
  },
  textPurpleDark: {
    color: '#7e22ce',
  },
  textSecondary: {
    color: '#0051d5',
  },
  textMuted: {
    color: '#76777d',
  },
});
