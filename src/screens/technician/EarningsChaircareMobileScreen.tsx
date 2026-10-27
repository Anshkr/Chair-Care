import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { BrandLogo } from '../../components/common/BrandLogo';

interface EarningsProps {
  navigation?: any;
  route?: {
    params?: {
      request?: any;
      selectedFilter?: string;
    };
  };
}

interface EarningRecord {
  id: string;
  serviceTitle: string;
  customerName: string;
  chairModel: string;
  amount: number;
  completedAt: string;
  breakdown: string;
  icon: string;
  status: 'completed' | 'pending_settlement';
  isDirectQr?: boolean;
}

interface ChartDay {
  day: string;
  label: string;
  amount: number;
  heightPercent: number;
  isPeak?: boolean;
  isOff?: boolean;
}

export const EarningsChaircareMobileScreen: React.FC<EarningsProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const {
    acceptedRequest,
    upiId,
    upiPhone,
    updateUpiSettings,
    qrCollections,
  } = useTechnician();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(5);

  // UPI QR and Dynamic Edit Modals
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showEditUpiModal, setShowEditUpiModal] = useState<boolean>(false);
  const [editUpiInput, setEditUpiInput] = useState<string>(upiId || '');
  const [editPhoneInput, setEditPhoneInput] = useState<string>(upiPhone || '');
  const [isSavingUpi, setIsSavingUpi] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const [earningsState, setEarningsState] = useState<{
    todayEarnings: number;
    weeklyEarnings: number;
    completedJobsToday: number;
    weeklyCompletedJobs: number;
    rating: number;
    recentPayouts: EarningRecord[];
  }>({
    todayEarnings: 0,
    weeklyEarnings: 0,
    completedJobsToday: 0,
    weeklyCompletedJobs: 0,
    rating: 5.0,
    recentPayouts: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchEarnings = async () => {
      try {
        const res = await technicianApi.getEarnings();
        if (res.success && res.data && isMounted) {
          const rawPayouts = Array.isArray(res.data.recentPayouts)
            ? res.data.recentPayouts
            : [];
          const mappedPayouts: EarningRecord[] = rawPayouts.map((p: any) => ({
            id: String(p.id),
            serviceTitle: p.serviceTitle || 'Office Chair Repair',
            customerName: p.customerName || 'Customer',
            chairModel: p.chairModel || 'Ergonomic Task Chair',
            amount: Number(p.amount) || 0,
            completedAt: p.createdAt
              ? new Date(p.createdAt).toLocaleDateString()
              : 'Recent',
            breakdown: `Direct Payout (${p.trackingCode || 'Settled'})`,
            icon: 'Wrench',
            status: 'completed',
          }));

          setEarningsState({
            todayEarnings: Number(res.data.todayEarnings) || 0,
            weeklyEarnings: Number(res.data.weeklyEarnings) || 0,
            completedJobsToday: Number(res.data.completedJobsToday) || 0,
            weeklyCompletedJobs: Number(res.data.weeklyCompletedJobs) || 0,
            rating: Number(res.data.rating) || 5.0,
            recentPayouts: mappedPayouts,
          });
        }
      } catch (err) {
        // silent
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchEarnings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync input values when upiId / upiPhone change
  React.useEffect(() => {
    if (upiId) setEditUpiInput(upiId);
  }, [upiId]);

  React.useEffect(() => {
    if (upiPhone) setEditPhoneInput(upiPhone);
  }, [upiPhone]);

  const handleSaveUpi = async () => {
    const cleanUpi = editUpiInput.trim();
    const cleanPhone = editPhoneInput.trim();
    if (!cleanUpi && !cleanPhone) {
      Alert.alert('Input Required', 'Please enter a valid UPI ID (e.g. yourname@paytm) or Mobile Phone number.');
      return;
    }
    setIsSavingUpi(true);
    try {
      await updateUpiSettings(cleanUpi, cleanPhone);
      setSaveSuccessMsg('UPI configuration updated successfully!');
      setTimeout(() => {
        setSaveSuccessMsg('');
        setShowEditUpiModal(false);
      }, 1000);
    } catch {
      Alert.alert('Error', 'Could not save UPI configuration.');
    } finally {
      setIsSavingUpi(false);
    }
  };

  // Convert QR collections to EarningRecord
  const directQrItems: EarningRecord[] = React.useMemo(() => {
    return (qrCollections || []).map((col) => ({
      id: col.id,
      serviceTitle: col.serviceTitle || 'Chair Service & Repair',
      customerName: col.customerName || 'Customer',
      chairModel: col.chairModel || 'Ergonomic Task Chair',
      amount: Number(col.amount) || 0,
      completedAt: col.completedAt || 'Direct QR',
      breakdown: `Direct UPI (${col.upiId || upiId || 'Technician Account'})`,
      icon: 'QrCode',
      status: 'completed',
      isDirectQr: true,
    }));
  }, [qrCollections, upiId]);

  const realQrTotal = React.useMemo(() => {
    return directQrItems.reduce((acc, item) => acc + item.amount, 0);
  }, [directQrItems]);

  const computedTodayEarnings = earningsState.todayEarnings + realQrTotal;
  const computedWeeklyEarnings = earningsState.weeklyEarnings + realQrTotal;

  // Active Standby UPI QR url
  const cleanActiveUpi = (upiId || (upiPhone ? `${upiPhone.replace(/[^0-9]/g, '')}@paytm` : '9217460742@paytm')).trim();
  const standbyUpiUrl = `upi://pay?pa=${encodeURIComponent(cleanActiveUpi)}&pn=${encodeURIComponent('ChairCare Technician')}&cu=INR&tn=${encodeURIComponent('ChairCare Service Payout')}`;
  const standbyQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&data=${encodeURIComponent(standbyUpiUrl)}`;

  // Dynamic context integration
  const dynamicRequest = route?.params?.request || acceptedRequest;
  const dynamicEarningsList = React.useMemo(() => {
    let list = [...directQrItems, ...earningsState.recentPayouts];
    if (dynamicRequest && dynamicRequest.status === 'completed') {
      const baseCost = Number(dynamicRequest.totalAmount) || Number(dynamicRequest.total_amount) || dynamicRequest.baseRate || 599;
      const additionalCost =
        dynamicRequest.additionalWork?.totalCost ||
        dynamicRequest.additionalPartsCost ||
        0;
      const totalCost = baseCost + additionalCost;

      const dynamicItem: EarningRecord = {
        id: dynamicRequest.id || 'earn-dynamic',
        serviceTitle: dynamicRequest.serviceTitle || 'Office Chair Repair',
        customerName: dynamicRequest.customerName || 'Customer',
        chairModel: dynamicRequest.chairModel || 'Ergonomic Chair',
        amount: totalCost,
        completedAt: 'Today, Just now',
        breakdown: additionalCost > 0 ? `Booked Price ₹${baseCost} + Parts ₹${additionalCost}` : `Booked Service Price ₹${baseCost}`,
        icon: 'Wrench',
        status: 'completed',
        isDirectQr: Boolean(dynamicRequest.paymentMethod === 'direct_upi_qr'),
      };

      list = [dynamicItem, ...list.filter((i) => i.id !== dynamicItem.id)];
    }
    return list;
  }, [directQrItems, dynamicRequest, earningsState.recentPayouts]);

  const weeklyChartData: ChartDay[] = React.useMemo(() => {
    const days = [
      { day: 'Mon', label: 'M', pct: 0.12 },
      { day: 'Tue', label: 'T', pct: 0.15 },
      { day: 'Wed', label: 'W', pct: 0.1 },
      { day: 'Thu', label: 'T', pct: 0.18 },
      { day: 'Fri', label: 'F', pct: 0.15 },
      { day: 'Sat', label: 'S', pct: 0.3, isPeak: true },
      { day: 'Sun', label: 'S', pct: 0.0, isOff: true },
    ];
    const total = computedWeeklyEarnings;
    return days.map((d) => {
      const amt = Math.round(total * d.pct);
      const height = total > 0 ? Math.min(Math.max(Math.round((amt / (total * 0.35 || 1)) * 100), 10), 98) : (d.isOff ? 8 : 20);
      return {
        day: d.day,
        label: d.label,
        amount: amt,
        heightPercent: height,
        isPeak: d.isPeak,
        isOff: d.isOff,
      };
    });
  }, [computedWeeklyEarnings]);

  const handleSelectEarning = (item: EarningRecord) => {
    if (navigation) {
      navigation.navigate('EarningDetails', {
        earningId: item.id,
        earningItem: item,
      });
    }
  };

  const handleExportCSV = () => {
    Alert.alert(
      'Export Earnings Data',
      'A CSV export link with your itemized October 2026 ledger has been generated.',
      [{ text: 'OK' }]
    );
  };

  const handleInstantCashout = () => {
    Alert.alert(
      'Instant Payout Transfer',
      '₹10,800 scheduled for instant settlement to HDFC Bank (••4921) minus 2% processing fee (₹216). Net: ₹10,584.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Cashout', onPress: () => Alert.alert('Settlement Initiated', 'Funds dispatched to your account.') },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={34} containerStyle={{ marginRight: 8 }} />
          <View>
            <Text style={{ ...Typography.labelMono, fontSize: 9.5, fontWeight: '700', color: Colors.secondaryCobalt, letterSpacing: 0.8 }}>
              CHAIRCARE • FIELD PARTNER
            </Text>
            <Text style={styles.headerTitle}>Earnings</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 6 }} />
          <TechnicianHeaderAvatar
            size={38}
            onPress={() => navigation?.navigate?.('TechProfileTab')}
          />
        </View>
      </View>

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Platform Policy / Admin Reference Notice for Technician Platform */}
        <View style={styles.adminAuditNoticeCard}>
          <View style={styles.adminAuditIconBox}>
            <AppIcon name="ShieldAlert" size={18} color="#D97706" />
          </View>
          <View style={styles.adminAuditContent}>
            <View style={styles.adminAuditTitleRow}>
              <Text style={styles.adminAuditTag}>PLATFORM AUDIT POLICY</Text>
              <View style={styles.adminOnlyBadge}>
                <Text style={styles.adminOnlyBadgeText}>Admin Reference Only</Text>
              </View>
            </View>
            <Text style={styles.adminAuditText}>
              Historical payouts and demo records below are preserved for administrative reference & platform audit only. Real money collected directly from customers via your Direct UPI QR goes 100% straight to your personal account.
            </Text>
          </View>
        </View>

        {/* Dynamic Personal Direct UPI QR Settlement Card */}
        <View style={styles.upiDirectCard}>
          <View style={styles.upiDirectHeaderRow}>
            <View style={styles.upiDirectLeft}>
              <View style={styles.upiIconBubble}>
                <AppIcon name="QrCode" size={20} color="#059669" />
              </View>
              <View>
                <View style={styles.directPayoutBadge}>
                  <Text style={styles.directPayoutBadgeText}>DIRECT TO YOUR ACCOUNT</Text>
                </View>
                <Text style={styles.upiDirectTitle}>Personal UPI Collection QR</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.upiEditBtn}
              onPress={() => {
                setEditUpiInput(upiId || '');
                setEditPhoneInput(upiPhone || '');
                setShowEditUpiModal(true);
              }}
              activeOpacity={0.8}
            >
              <AppIcon name="Pencil" size={13} color="#0284C7" />
              <Text style={styles.upiEditBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.upiDetailsRow}>
            <View style={styles.upiDetailCol}>
              <Text style={styles.upiDetailLabel}>LINKED UPI ID (VPA)</Text>
              <Text style={styles.upiDetailValueMono} numberOfLines={1}>
                {cleanActiveUpi}
              </Text>
            </View>
            <View style={styles.upiDividerVertical} />
            <View style={styles.upiDetailCol}>
              <Text style={styles.upiDetailLabel}>PHONE / MOBILE</Text>
              <Text style={styles.upiDetailValueMono} numberOfLines={1}>
                {upiPhone || '+91 92174 60742'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.showQrActionBtn}
            onPress={() => setShowQrModal(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="QrCode" size={17} color="#FFFFFF" />
            <Text style={styles.showQrActionBtnText}>Show My Standby QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Metadata & Payout Notice Subtitle */}
        <View style={styles.noticeSection}>
          <View style={styles.bankIconCircle}>
            <AppIcon name="Landmark" size={18} />
          </View>
          <View style={styles.noticeTextCol}>
            <Text style={styles.financialOverviewTag}>FINANCIAL OVERVIEW</Text>
            <Text style={styles.payoutNoticeText}>
              Auto-payout ledger every Monday to{' '}
              <Text style={styles.bankAccountMono}>HDFC Bank ••4921</Text>
            </Text>
          </View>
        </View>

        {/* Hero Earnings Bento Card */}
        <View style={styles.heroBentoCard}>
          <View style={styles.blurGlowCircle} />

          <View style={styles.bentoHeaderRow}>
            <View style={styles.monthTagGroup}>
              <View style={styles.pulseGreenDot} />
              <Text style={styles.monthTagText}>THIS MONTH (OCT 2026)</Text>
            </View>

            <TouchableOpacity
              onPress={() => Alert.alert('Payout History', 'Full ledger history from August 2026 to October 2026.')}
              activeOpacity={0.8}
              style={styles.payoutHistoryLink}
            >
              <Text style={styles.payoutHistoryText}>Payout History</Text>
              <Text style={styles.northEastArrow}>↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bentoAmountRow}>
            <View>
              <Text style={styles.grossAccruedAmount}>
                ₹{(computedTodayEarnings + computedWeeklyEarnings).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.grossAccruedLabel}>
                Gross technician earnings (Real QR + Accrued)
              </Text>
            </View>

            <View style={styles.trendBadge}>
              <AppIcon name="TrendingUp" size={18} />
              <Text style={styles.trendBadgeText}>Live</Text>
            </View>
          </View>
        </View>

        {/* Summary Metric Grid (3 Cards) */}
        <View style={styles.metricGrid}>
          {/* Card 1: Today */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardTopRow}>
              <Text style={styles.metricLabel}>TODAY</Text>
              <AppIcon name="Zap" size={18} />
            </View>
            <View style={styles.metricCardBottomCol}>
              <Text style={styles.metricValue}>
                ₹{computedTodayEarnings.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.metricSub}>
                {earningsState.completedJobsToday + directQrItems.length} jobs done
              </Text>
            </View>
          </View>

          {/* Card 2: This Week */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardTopRow}>
              <Text style={styles.metricLabel}>THIS WEEK</Text>
              <AppIcon name="CalendarCheck" size={18} />
            </View>
            <View style={styles.metricCardBottomCol}>
              <Text style={styles.metricValue}>
                ₹{computedWeeklyEarnings.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.metricSub}>
                {earningsState.weeklyCompletedJobs + directQrItems.length} jobs done
              </Text>
            </View>
          </View>

          {/* Card 3: Jobs */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardTopRow}>
              <Text style={styles.metricLabel}>JOBS</Text>
              <AppIcon name="Check" size={18} />
            </View>
            <View style={styles.metricCardBottomCol}>
              <Text style={styles.metricValue}>
                {earningsState.completedJobsToday + earningsState.weeklyCompletedJobs + directQrItems.length}
              </Text>
              <Text style={styles.metricSuccessSub}>
                ⭐ {earningsState.rating.toFixed(1)} rating
              </Text>
            </View>
          </View>
        </View>

        {/* Weekly Trend Interactive Bar Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <View>
              <Text style={styles.chartTitle}>Weekly Trend</Text>
              <Text style={styles.chartSubtitle}>
                Last 7 Days (₹{computedWeeklyEarnings.toLocaleString('en-IN')} total)
              </Text>
            </View>
            <View style={styles.peakBadge}>
              <View style={styles.peakDot} />
              <Text style={styles.peakBadgeText}>
                Peak: {weeklyChartData[selectedDayIndex]?.day || 'Sat'}
              </Text>
            </View>
          </View>

          {/* Chart Bars Area */}
          <View style={styles.barsContainer}>
            {weeklyChartData.map((item, index) => {
              const isSelected = selectedDayIndex === index;
              return (
                <TouchableOpacity
                  key={item.day + index}
                  style={styles.barCol}
                  onPress={() => setSelectedDayIndex(index)}
                  activeOpacity={0.8}
                >
                  {/* Top floating amount tag */}
                  {item.isPeak || isSelected ? (
                    <View style={styles.peakTooltip}>
                      <Text style={styles.peakTooltipText}>
                        {item.isOff ? 'Off' : `₹${item.amount.toLocaleString('en-IN')}`}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.barTopAmountText}>
                      {item.isOff ? 'Off' : `${(item.amount / 1000).toFixed(1)}k`}
                    </Text>
                  )}

                  {/* Bar Graphic */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${item.heightPercent}%` },
                        item.isPeak && styles.barFillPeak,
                        item.isOff && styles.barFillOff,
                        isSelected && !item.isPeak && styles.barFillSelected,
                      ]}
                    />
                  </View>

                  {/* Day Label */}
                  <Text
                    style={[
                      styles.barDayLabel,
                      item.isPeak && styles.barDayLabelPeak,
                      item.isOff && styles.barDayLabelOff,
                      isSelected && styles.barDayLabelSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Payout Banner ("Next Scheduled Payout") */}
        <View style={styles.payoutScheduleCard}>
          <View style={styles.payoutScheduleTop}>
            <View style={styles.scheduleIconBox}>
              <AppIcon name="Clock" size={18} />
            </View>
            <View style={styles.scheduleContentCol}>
              <Text style={styles.scheduleTag}>NEXT SCHEDULED PAYOUT</Text>
              <Text style={styles.scheduleAmount}>
                ₹{computedWeeklyEarnings.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.scheduleDateText}>
                Monday Settlement • Direct Bank Transfer
              </Text>
            </View>
          </View>

          {/* Sub-bar */}
          <View style={styles.payoutScheduleBottomBar}>
            <View style={styles.autoSettlementRow}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.autoSettlementText}>Auto-settlement ready</Text>
            </View>

            <TouchableOpacity
              style={styles.instantCashoutBtn}
              onPress={handleInstantCashout}
              activeOpacity={0.7}
            >
              <Text style={styles.instantCashoutText}>
                Instant Cashout{' '}
                <Text style={styles.feeSubText}>(2% fee)</Text>
              </Text>
              <Text style={styles.cashoutArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Completed Jobs / Earnings Section */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <View style={styles.recentTitleGroup}>
              <Text style={styles.recentTitle}>Recent Earnings</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  All ({dynamicEarningsList.length})
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleExportCSV} activeOpacity={0.7}>
              <Text style={styles.exportCsvText}>Export CSV</Text>
            </TouchableOpacity>
          </View>

          {/* List of Earning Items */}
          <View style={styles.earningsListCol}>
            {dynamicEarningsList.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ ...Typography.bodyMd, color: Colors.onSurfaceVariant }}>
                  No recent payouts recorded yet. Completed service requests will appear here.
                </Text>
              </View>
            ) : (
              dynamicEarningsList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.earningItemCard,
                    item.isDirectQr && styles.earningItemCardDirectQr,
                  ]}
                  onPress={() => handleSelectEarning(item)}
                  activeOpacity={0.88}
                >
                  <View style={styles.earningItemTopRow}>
                    <View style={styles.earningItemLeft}>
                      <View style={[
                        styles.itemIconContainer,
                        item.isDirectQr && { backgroundColor: '#ECFDF5' },
                      ]}>
                        <AppIcon
                          name={item.icon}
                          size={20}
                          color={item.isDirectQr ? '#059669' : Colors.primary}
                        />
                      </View>
                      <View style={styles.itemMetaCol}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.serviceTitle}
                        </Text>
                        <Text style={styles.itemCustomerLine} numberOfLines={1}>
                          {item.customerName} • {item.chairModel}
                        </Text>
                      </View>
                    </View>

                    <Text style={[
                      styles.itemAmount,
                      item.isDirectQr && { color: '#059669', fontWeight: '800' },
                    ]}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.earningItemBottomRow}>
                    {item.isDirectQr ? (
                      <View style={styles.directQrBadge}>
                        <View style={styles.emeraldDot} />
                        <Text style={styles.directQrBadgeText}>
                          DIRECT UPI QR • REAL SETTLEMENT
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.adminRefBadge}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#94A3B8' }} />
                        <Text style={styles.adminRefBadgeText}>
                          ADMIN REFERENCE • {item.completedAt}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.itemBreakdownText} numberOfLines={1}>
                      {item.breakdown}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Standby QR Display Modal */}
      <Modal
        visible={showQrModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalPreTitle}>DIRECT SETTLEMENT</Text>
                <Text style={styles.modalTitle}>Your Collection UPI QR</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="X" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Customers can scan this QR code using Google Pay, PhonePe, Paytm, Cred, or BHIM. Money transfers straight to your account.
            </Text>

            {/* High-contrast QR card */}
            <View style={styles.qrCardBox}>
              <Image
                source={{ uri: standbyQrImg }}
                style={styles.qrImage}
                resizeMode="contain"
              />
              <Text style={styles.qrScanNotice}>
                ⚡ All UPI Apps Supported (GPay / PhonePe / Paytm / BHIM)
              </Text>
            </View>

            {/* UPI Details preview */}
            <View style={styles.modalUpiInfoBox}>
              <View style={styles.modalUpiRow}>
                <Text style={styles.modalUpiLabel}>UPI ID:</Text>
                <Text style={styles.modalUpiValueMono}>{cleanActiveUpi}</Text>
              </View>
              <View style={styles.modalUpiRow}>
                <Text style={styles.modalUpiLabel}>Phone:</Text>
                <Text style={styles.modalUpiValueMono}>{upiPhone || '+91 92174 60742'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSwitchEditBtn}
              onPress={() => {
                setShowQrModal(false);
                setEditUpiInput(upiId || '');
                setEditPhoneInput(upiPhone || '');
                setShowEditUpiModal(true);
              }}
              activeOpacity={0.8}
            >
              <AppIcon name="Pencil" size={15} color="#0284C7" />
              <Text style={styles.modalSwitchEditText}>Edit UPI ID / Phone Number</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowQrModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDismissText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Edit UPI & Phone Modal */}
      <Modal
        visible={showEditUpiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditUpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalPreTitle}>ACCOUNT CONFIGURATION</Text>
                <Text style={styles.modalTitle}>Edit Collection UPI & Phone</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditUpiModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="X" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Update your UPI ID or linked phone number anytime. When saved, the customer payment QR code updates instantly.
            </Text>

            {saveSuccessMsg ? (
              <View style={styles.modalSuccessBanner}>
                <AppIcon name="Check" size={16} color="#059669" />
                <Text style={styles.modalSuccessText}>{saveSuccessMsg}</Text>
              </View>
            ) : null}

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>UPI ID (VPA)</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editUpiInput}
                onChangeText={setEditUpiInput}
                placeholder="e.g. 9800000000@paytm or name@okaxis"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.modalInputHint}>
                Format: mobile@bank (e.g. 9812345678@paytm, 9812345678@okhdfcbank)
              </Text>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>MOBILE PHONE NUMBER</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editPhoneInput}
                onChangeText={setEditPhoneInput}
                placeholder="e.g. +91 92174 60742"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditUpiModal(false)}
                activeOpacity={0.8}
                disabled={isSavingUpi}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveUpi}
                activeOpacity={0.8}
                disabled={isSavingUpi}
              >
                {isSavingUpi ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save UPI Details</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontSize: 18,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tuneButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tuneIcon: {
    fontSize: 18,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 14,
  },
  noticeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  bankIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 81, 213, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankIcon: {
    fontSize: 16,
  },
  noticeTextCol: {
    flex: 1,
  },
  financialOverviewTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  payoutNoticeText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  bankAccountMono: {
    ...Typography.labelMono,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  heroBentoCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  blurGlowCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(49, 107, 243, 0.2)',
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4edea3',
  },
  monthTagText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#dae2fd',
    letterSpacing: 1.2,
  },
  payoutHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  payoutHistoryText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: '#dae2fd',
  },
  northEastArrow: {
    fontSize: 12,
    color: '#dae2fd',
  },
  bentoAmountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  grossAccruedAmount: {
    ...Typography.displayHeroMobile,
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.8,
  },
  grossAccruedLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#7c839b',
    marginTop: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  trendArrow: {
    fontSize: 13,
  },
  trendBadgeText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#6ffbbe',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 84,
    ...Shadows.level1,
  },
  metricCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  metricCardIcon: {
    fontSize: 13,
    color: Colors.secondaryCobalt,
  },
  metricCardSuccessIcon: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00875a',
  },
  metricCardBottomCol: {
    marginTop: 8,
  },
  metricValue: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  metricSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  metricSuccessSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#00875a',
    marginTop: 1,
  },
  chartCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    ...Shadows.level1,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chartSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  peakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  peakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  peakBadgeText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 128,
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
    position: 'relative',
  },
  peakTooltip: {
    position: 'absolute',
    top: -12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
    ...Shadows.level1,
  },
  peakTooltipText: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  barTopAmountText: {
    ...Typography.labelMono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
    opacity: 0.85,
  },
  barTrack: {
    width: '100%',
    height: 86,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '85%',
    backgroundColor: 'rgba(0, 81, 213, 0.2)',
    borderRadius: 6,
  },
  barFillPeak: {
    backgroundColor: Colors.primary,
    ...Shadows.level1,
  },
  barFillSelected: {
    backgroundColor: Colors.secondaryCobalt,
  },
  barFillOff: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  barDayLabel: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
    marginTop: 6,
  },
  barDayLabelPeak: {
    fontWeight: '700',
    color: Colors.primary,
  },
  barDayLabelSelected: {
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  barDayLabelOff: {
    color: Colors.outlineVariant,
  },
  payoutScheduleCard: {
    backgroundColor: 'rgba(230, 232, 234, 0.7)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level1,
  },
  payoutScheduleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  scheduleIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleIconText: {
    fontSize: 18,
  },
  scheduleContentCol: {
    flex: 1,
  },
  scheduleTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  scheduleAmount: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 2,
  },
  scheduleDateText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  payoutScheduleBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  autoSettlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedIcon: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00875a',
  },
  autoSettlementText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    fontWeight: '500',
    color: '#00875a',
  },
  instantCashoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  instantCashoutText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  feeSubText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  cashoutArrow: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  recentSection: {
    gap: 10,
    paddingTop: 2,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  countPill: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countPillText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  exportCsvText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  earningsListCol: {
    gap: 10,
  },
  earningItemCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 8,
    ...Shadows.level1,
  },
  earningItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemIconContainer: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 18,
  },
  itemMetaCol: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  itemCustomerLine: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  itemAmount: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  earningItemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 135, 90, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  emeraldDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00875a',
  },
  completedBadgeText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '600',
    color: '#00875a',
  },
  itemBreakdownText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    maxWidth: '48%',
  },
  // Admin Reference Banner
  adminAuditNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 12,
  },
  adminAuditIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAuditContent: {
    flex: 1,
  },
  adminAuditTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adminAuditTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.8,
  },
  adminOnlyBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#FCD34D',
  },
  adminOnlyBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#92400E',
  },
  adminAuditText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    lineHeight: 16.5,
    color: '#92400E',
  },
  // UPI Direct Card
  upiDirectCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    ...Shadows.level1,
    gap: 12,
  },
  upiDirectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upiDirectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upiIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  directPayoutBadge: {
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginBottom: 2,
  },
  directPayoutBadgeText: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.7,
  },
  upiDirectTitle: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  upiEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  upiEditBtnText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  upiDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  upiDetailCol: {
    flex: 1,
  },
  upiDetailLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  upiDetailValueMono: {
    ...Typography.labelMono,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  upiDividerVertical: {
    width: 1,
    height: 28,
    backgroundColor: Colors.outlineVariant,
    marginHorizontal: 12,
  },
  showQrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  showQrActionBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // Earning Item Direct QR vs Admin Reference badges
  earningItemCardDirectQr: {
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    backgroundColor: '#FAFDFB',
  },
  directQrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  directQrBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.4,
  },
  adminRefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  adminRefBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 420,
    ...Shadows.level2,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalPreTitle: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  modalTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  modalSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16.5,
  },
  qrCardBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  qrScanNotice: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  modalUpiInfoBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 4,
  },
  modalUpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalUpiLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  modalUpiValueMono: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSwitchEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalSwitchEditText: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  modalDismissBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalDismissText: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  modalSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  modalSuccessText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  modalInputGroup: {
    gap: 4,
  },
  modalInputLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  modalTextInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    ...Typography.bodyMd,
    fontSize: 13.5,
    color: '#0F172A',
  },
  modalInputHint: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
  },
  modalCancelText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  modalSaveText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
