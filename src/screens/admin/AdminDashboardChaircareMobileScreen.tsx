import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { PrecisionCard } from '../../components/common/PrecisionCard';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MonoMetric } from '../../components/common/MonoMetric';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../services/api';
import { useAdminSync } from '../../services/adminSync';
import { phoneCallService } from '../../services/phone/phoneCallService';
import { AnimatedNumber } from '../../animations/AnimatedNumber';
import { FadeIn } from '../../animations/FadeIn';

type OperationsTab = 'live' | 'completed' | 'support';

export const AdminDashboardChaircareMobileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [metrics, setMetrics] = useState({
    activeRequests: 0,
    pendingRequests: 0,
    onlineTechnicians: 0,
    verifiedTechnicians: 0,
    totalRevenue: 0,
    todayRequests: 0,
    totalCustomers: 0,
    totalTechnicians: 0,
    unresolvedSupport: 0,
    pendingDisputes: 0,
    latestRequests: [] as any[],
    completedJobs: [] as any[],
    supportTickets: [] as any[],
  });

  const [activeOpsTab, setActiveOpsTab] = useState<OperationsTab>('live');
  const [activeOpIndex, setActiveOpIndex] = useState(0);
  const [activeCompletedIndex, setActiveCompletedIndex] = useState(0);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await adminApi.getDashboardMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch {
      // Fallback to zero counts on network fail
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, fetchMetrics);

  const liveActiveOps = useMemo(() => {
    const list =
      (metrics as any).activeLiveOperations && (metrics as any).activeLiveOperations.length > 0
        ? (metrics as any).activeLiveOperations
        : (metrics.latestRequests || []).filter((r: any) =>
            ['finding_technician', 'assigned', 'in_route', 'arrived', 'in_progress'].includes(r.status)
          );
    return list;
  }, [metrics]);

  const completedJobsList = useMemo(() => {
    return (metrics as any).completedJobs || [];
  }, [metrics]);

  const supportTicketsList = useMemo(() => {
    return (metrics as any).supportTickets || [];
  }, [metrics]);

  const currentActive =
    liveActiveOps.length > 0
      ? liveActiveOps[Math.min(activeOpIndex, liveActiveOps.length - 1)]
      : metrics.latestRequests?.[0] || null;

  const currentCompletedJob =
    completedJobsList.length > 0
      ? completedJobsList[Math.min(activeCompletedIndex, completedJobsList.length - 1)]
      : null;

  const currentTicket =
    supportTicketsList.length > 0
      ? supportTicketsList[Math.min(activeTicketIndex, supportTicketsList.length - 1)]
      : null;

  return (
    <ScreenContainer hasPadding={false}>
      {/* Sleek Executive Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerSub}>CHAIRCARE • HQ</Text>
            <Text style={styles.headerTitle}>Operations Console</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 4 }} />
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation?.navigate('Notifications')}
          >
            <AppIcon name="Bell" size={18} />
            {metrics.pendingRequests > 0 && <View style={styles.notifBadgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutPill} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 85, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Executive Overview Banner */}
        <FadeIn delay={40}>
          <View style={styles.overviewHeroCard}>
            <View style={styles.overviewTopRow}>
              <View style={styles.networkStatusPill}>
                <View style={styles.pulseDot} />
                <Text style={styles.networkStatusText}>NCR TECH MESH ONLINE</Text>
              </View>
              <View style={styles.syncStatusBadge}>
                <AppIcon name="Radio" size={12} color={Colors.tertiaryEmerald} />
                <Text style={styles.syncStatusText}>48/50 Nodes</Text>
              </View>
            </View>

            <Text style={styles.heroGreeting}>Welcome back, Platform Admin</Text>
            <Text style={styles.heroSub}>
              Live telemetry, service dispatches, and field payouts across Gurugram & Delhi NCR.
            </Text>
          </View>
        </FadeIn>

        {/* 2x2 KPI Executive Tiles */}
        <FadeIn delay={90}>
          <View style={styles.kpiGrid}>
            {/* Row 1: Active Services & Pending Queue */}
            <View style={styles.kpiRow}>
              <TouchableOpacity
                style={styles.kpiCard}
                onPress={() => navigation.navigate('ServiceRequestsTab')}
                activeOpacity={0.8}
              >
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>ACTIVE SERVICES</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(0, 81, 213, 0.08)' }]}>
                    <AppIcon name="Activity" size={16} color={Colors.secondaryCobalt} />
                  </View>
                </View>
                <AnimatedNumber value={metrics.activeRequests} style={styles.kpiValue} />
                <Text style={styles.kpiFooterText} numberOfLines={1}>
                  {metrics.todayRequests} requested today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.kpiCard,
                  metrics.pendingRequests > 0 && styles.kpiCardAlert,
                ]}
                onPress={() => navigation.navigate('ServiceRequestsTab')}
                activeOpacity={0.8}
              >
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>PENDING QUEUE</Text>
                  <View
                    style={[
                      styles.kpiIconWrap,
                      {
                        backgroundColor:
                          metrics.pendingRequests > 0
                            ? 'rgba(239, 68, 68, 0.1)'
                            : Colors.surfaceContainer,
                      },
                    ]}
                  >
                    <AppIcon
                      name="Clock"
                      size={16}
                      color={metrics.pendingRequests > 0 ? Colors.error : Colors.outline}
                    />
                  </View>
                </View>
                <AnimatedNumber
                  value={metrics.pendingRequests}
                  style={[
                    styles.kpiValue,
                    metrics.pendingRequests > 0 && { color: Colors.error },
                  ]}
                />
                <Text
                  style={[
                    styles.kpiFooterText,
                    metrics.pendingRequests > 0 && { color: Colors.error, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {metrics.pendingRequests > 0 ? 'Awaiting assignment' : 'Queue clear'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Techs Online & Total Revenue */}
            <View style={styles.kpiRow}>
              <TouchableOpacity
                style={styles.kpiCard}
                onPress={() => navigation.navigate('TechniciansTab')}
                activeOpacity={0.8}
              >
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>TECHS ONLINE</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(5, 150, 105, 0.08)' }]}>
                    <AppIcon name="Users" size={16} color={Colors.tertiaryEmerald} />
                  </View>
                </View>
                <AnimatedNumber
                  value={metrics.onlineTechnicians}
                  style={[styles.kpiValue, { color: Colors.tertiaryEmerald }]}
                />
                <Text style={styles.kpiFooterText} numberOfLines={1}>
                  {metrics.totalTechnicians} total registered
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.kpiCard}
                onPress={() => navigation.navigate('PaymentsTab')}
                activeOpacity={0.8}
              >
                <View style={styles.kpiTopRow}>
                  <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
                  <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(0, 0, 0, 0.04)' }]}>
                    <AppIcon name="IndianRupee" size={16} color={Colors.onSurface} />
                  </View>
                </View>
                <AnimatedNumber
                  value={Number(metrics.totalRevenue) || 0}
                  prefix="₹"
                  style={styles.kpiValue}
                />
                <Text style={styles.kpiFooterText} numberOfLines={1}>Verified payments</Text>
              </TouchableOpacity>
            </View>
          </View>
        </FadeIn>

        {/* Operations Hub: Clean Segmented Controller */}
        <FadeIn delay={140}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Operations Stream</Text>
              <Text style={styles.sectionSubBadge}>Real-time Feed</Text>
            </View>

            {/* Segmented Switch Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeOpsTab === 'live' && styles.tabButtonActive]}
                onPress={() => setActiveOpsTab('live')}
                activeOpacity={0.8}
              >
                <View style={[styles.tabDot, { backgroundColor: Colors.secondaryCobalt }]} />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeOpsTab === 'live' && styles.tabButtonTextActive,
                  ]}
                >
                  Live Ops ({liveActiveOps.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeOpsTab === 'completed' && styles.tabButtonActive]}
                onPress={() => setActiveOpsTab('completed')}
                activeOpacity={0.8}
              >
                <View style={[styles.tabDot, { backgroundColor: Colors.tertiaryEmerald }]} />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeOpsTab === 'completed' && styles.tabButtonTextActive,
                  ]}
                >
                  Completed ({completedJobsList.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeOpsTab === 'support' && styles.tabButtonActive]}
                onPress={() => setActiveOpsTab('support')}
                activeOpacity={0.8}
              >
                <View style={[styles.tabDot, { backgroundColor: Colors.error }]} />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeOpsTab === 'support' && styles.tabButtonTextActive,
                  ]}
                >
                  Support ({supportTicketsList.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: LIVE OPERATIONS */}
            {activeOpsTab === 'live' && (
              currentActive ? (
                <PrecisionCard
                  style={styles.streamCard}
                  onPress={() =>
                    navigation.navigate('ServiceRequestDetails', {
                      requestId: currentActive.trackingCode || currentActive.tracking_code || currentActive.id,
                    })
                  }
                >
                  {/* Pagination Header */}
                  {liveActiveOps.length > 1 && (
                    <View style={styles.streamPaginationRow}>
                      <Text style={styles.streamPageText}>
                        DISPATCH {Math.min(activeOpIndex, liveActiveOps.length - 1) + 1} OF {liveActiveOps.length}
                      </Text>
                      <View style={styles.arrowGroup}>
                        <TouchableOpacity
                          onPress={() => setActiveOpIndex((prev) => (prev > 0 ? prev - 1 : liveActiveOps.length - 1))}
                          style={styles.pageArrowBtn}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="ChevronLeft" size={13} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setActiveOpIndex((prev) => (prev < liveActiveOps.length - 1 ? prev + 1 : 0))}
                          style={styles.pageArrowBtn}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="ChevronRight" size={13} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Manifest ID & Status */}
                  <View style={styles.streamTopRow}>
                    <MonoMetric
                      label="REQUEST"
                      value={currentActive.trackingCode || currentActive.tracking_code || `#CC-${currentActive.id?.slice(0, 5)}`}
                    />
                    <StatusBadge
                      label={
                        currentActive.status === 'in_route'
                          ? 'ON THE WAY'
                          : currentActive.status === 'arrived'
                          ? 'ARRIVED'
                          : currentActive.status === 'in_progress'
                          ? 'IN PROGRESS'
                          : currentActive.status === 'assigned'
                          ? 'ASSIGNED'
                          : currentActive.status === 'finding_technician'
                          ? 'MATCHING TECH'
                          : currentActive.status.toUpperCase()
                      }
                      variant={
                        currentActive.status === 'in_route' || currentActive.status === 'in_progress'
                          ? 'info'
                          : currentActive.status === 'assigned'
                          ? 'success'
                          : 'warning'
                      }
                      dot
                    />
                  </View>

                  {/* Chair & Service Info */}
                  <View style={{ gap: 2 }}>
                    <Text style={styles.streamTitle}>
                      {currentActive.chairModel || currentActive.chair_model || 'Office Chair Service'}
                    </Text>
                    <Text style={styles.streamSubtitle}>
                      {currentActive.serviceTitle || 'Precision Field Inspection & Overhaul'}
                    </Text>
                  </View>

                  {/* Customer & Technician Pair */}
                  <View style={styles.detailsPairRow}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>CUSTOMER</Text>
                      <Text style={styles.detailBoxName} numberOfLines={1}>
                        {currentActive.customerName || currentActive.customer_name || 'Customer'}
                      </Text>
                      <Text style={styles.detailBoxSub} numberOfLines={1}>
                        📍 {currentActive.address || 'Delhi NCR'}
                      </Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>ASSIGNED TECH</Text>
                      <Text style={styles.detailBoxName} numberOfLines={1}>
                        {currentActive.technicianName || currentActive.technician_name || 'Awaiting Match'}
                      </Text>
                      <Text style={styles.detailBoxSub} numberOfLines={1}>
                        Corridor: {currentActive.currentZone || currentActive.current_zone || 'NCR Hub'}
                      </Text>
                    </View>
                  </View>

                  {/* Footer Actions */}
                  <View style={styles.streamFooterRow}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('LiveOperationsOverview')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.fleetMapLink}>Open Fleet Map ↗</Text>
                    </TouchableOpacity>
                    <PrecisionButton
                      title="View Manifest →"
                      size="sm"
                      variant="primary"
                      onPress={() =>
                        navigation.navigate('ServiceRequestDetails', {
                          requestId: currentActive.trackingCode || currentActive.tracking_code || currentActive.id,
                        })
                      }
                    />
                  </View>
                </PrecisionCard>
              ) : (
                <PrecisionCard style={styles.emptyStreamCard}>
                  <AppIcon name="Activity" size={24} color={Colors.outline} />
                  <Text style={styles.emptyTitle}>No Active Dispatches Right Now</Text>
                  <Text style={styles.emptySub}>
                    Incoming requests and technicians in the field will stream here automatically.
                  </Text>
                </PrecisionCard>
              )
            )}

            {/* TAB 2: COMPLETED JOBS & PAYOUTS */}
            {activeOpsTab === 'completed' && (
              currentCompletedJob ? (
                <PrecisionCard
                  style={styles.streamCard}
                  onPress={() =>
                    navigation.navigate('ServiceRequestDetails', {
                      requestId: currentCompletedJob.trackingCode || currentCompletedJob.id,
                    })
                  }
                >
                  {/* Pagination Header */}
                  {completedJobsList.length > 1 && (
                    <View style={styles.streamPaginationRow}>
                      <Text style={styles.streamPageText}>
                        COMPLETED JOB {Math.min(activeCompletedIndex, completedJobsList.length - 1) + 1} OF {completedJobsList.length}
                      </Text>
                      <View style={styles.arrowGroup}>
                        <TouchableOpacity
                          onPress={() => setActiveCompletedIndex((prev) => (prev > 0 ? prev - 1 : completedJobsList.length - 1))}
                          style={styles.pageArrowBtn}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="ChevronLeft" size={13} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setActiveCompletedIndex((prev) => (prev < completedJobsList.length - 1 ? prev + 1 : 0))}
                          style={styles.pageArrowBtn}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="ChevronRight" size={13} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Manifest ID & Turnaround Speed */}
                  <View style={styles.streamTopRow}>
                    <MonoMetric
                      label="JOB MANIFEST"
                      value={currentCompletedJob.trackingCode || `#CC-${currentCompletedJob.id?.slice(0, 5)}`}
                    />
                    <View style={styles.turnaroundPill}>
                      <AppIcon name="Zap" size={11} color={Colors.tertiaryEmerald} />
                      <Text style={styles.turnaroundPillText}>
                        {currentCompletedJob.serviceDurationFormatted || `${currentCompletedJob.serviceDurationMins || 42} mins turnaround`}
                      </Text>
                    </View>
                  </View>

                  {/* Chair & Service Details */}
                  <View style={{ gap: 2 }}>
                    <Text style={styles.streamTitle}>
                      {currentCompletedJob.chairModel || 'Executive Office Chair'}
                    </Text>
                    <Text style={styles.streamSubtitle}>
                      {currentCompletedJob.serviceTitle}
                    </Text>
                  </View>

                  {/* Technician & Customer 2-Column Clean Cards */}
                  <View style={styles.peopleRow}>
                    {/* Technician Column */}
                    <View style={styles.personCard}>
                      <View style={styles.personHeader}>
                        <AppIcon name="UserCheck" size={13} color={Colors.tertiaryEmerald} />
                        <Text style={styles.personRoleLabel}>TECHNICIAN</Text>
                      </View>
                      <Text style={styles.personName} numberOfLines={1}>
                        {currentCompletedJob.technicianName}
                      </Text>
                      <Text style={styles.personMeta} numberOfLines={1}>
                        ★ {currentCompletedJob.technicianRating} • {currentCompletedJob.technicianVehicle || 'Unit #12'}
                      </Text>
                      <TouchableOpacity
                        style={styles.personCallBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (currentCompletedJob.technicianPhone) {
                            phoneCallService.callNumber(
                              currentCompletedJob.technicianPhone,
                              currentCompletedJob.technicianName
                            );
                          }
                        }}
                      >
                        <AppIcon name="Phone" size={11} color={Colors.primary} />
                        <Text style={styles.personCallBtnText}>Call Tech</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Customer Column */}
                    <View style={styles.personCard}>
                      <View style={styles.personHeader}>
                        <AppIcon name="User" size={13} color={Colors.secondaryCobalt} />
                        <Text style={styles.personRoleLabel}>CUSTOMER</Text>
                      </View>
                      <Text style={styles.personName} numberOfLines={1}>
                        {currentCompletedJob.customerName}
                      </Text>
                      <Text style={styles.personMeta} numberOfLines={1}>
                        📍 {currentCompletedJob.customerAddress}
                      </Text>
                      <TouchableOpacity
                        style={styles.personCallBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          if (currentCompletedJob.customerPhone) {
                            phoneCallService.callNumber(
                              currentCompletedJob.customerPhone,
                              currentCompletedJob.customerName
                            );
                          }
                        }}
                      >
                        <AppIcon name="Phone" size={11} color={Colors.secondaryCobalt} />
                        <Text style={[styles.personCallBtnText, { color: Colors.secondaryCobalt }]}>
                          Call Customer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Parts Added / Replaced Section */}
                  <View style={styles.partsCard}>
                    <View style={styles.partsTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <AppIcon name="Wrench" size={12} color={Colors.onSurfaceVariant} />
                        <Text style={styles.partsSectionTitle}>PARTS INSTALLED & REPLACED</Text>
                      </View>
                      <Text style={styles.partsCountText}>
                        {currentCompletedJob.partsAdded?.length || 0} ITEMS
                      </Text>
                    </View>
                    <View style={styles.partsWrap}>
                      {(currentCompletedJob.partsAdded || []).map((part: string, idx: number) => (
                        <View key={idx} style={styles.partChip}>
                          <AppIcon name="Check" size={10} color={Colors.tertiaryEmerald} />
                          <Text style={styles.partChipText}>{part}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Financials & Payout Strip */}
                  <View style={styles.payoutStrip}>
                    <View style={styles.payoutCol}>
                      <Text style={styles.payoutColLabel}>PAID TO TECH (70%)</Text>
                      <Text style={styles.payoutAmountTech}>
                        ₹{currentCompletedJob.technicianPayout}
                      </Text>
                      <Text style={styles.payoutDisbursedBadge}>Disbursed • Escrow Cleared</Text>
                    </View>
                    <View style={styles.payoutDivider} />
                    <View style={styles.payoutCol}>
                      <Text style={styles.payoutColLabel}>TOTAL BILLING</Text>
                      <Text style={styles.payoutAmountTotal}>
                        ₹{currentCompletedJob.totalAmount}
                      </Text>
                      <Text style={styles.payoutMeta}>
                        {currentCompletedJob.paymentMethod} • Fee: ₹{currentCompletedJob.platformFee}
                      </Text>
                    </View>
                  </View>

                  {/* Warranty & Review Banner */}
                  <View style={styles.guaranteeRow}>
                    <View style={styles.guaranteeBadge}>
                      <AppIcon name="ShieldCheck" size={12} color={Colors.tertiaryEmerald} />
                      <Text style={styles.guaranteeBadgeText}>
                        {currentCompletedJob.warrantyStatus || '90-Day Digital Warranty Active'}
                      </Text>
                    </View>
                    {currentCompletedJob.reviewRating && (
                      <View style={styles.reviewBadge}>
                        <Text style={styles.reviewStar}>★ {currentCompletedJob.reviewRating}</Text>
                        {currentCompletedJob.reviewComment ? (
                          <Text style={styles.reviewComment} numberOfLines={1}>
                            "{currentCompletedJob.reviewComment}"
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>

                  {/* Card Bottom Row */}
                  <View style={styles.streamFooterRow}>
                    <Text style={styles.timestampText}>
                      Completed: {new Date(currentCompletedJob.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(currentCompletedJob.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                    <PrecisionButton
                      title="Service Dossier →"
                      size="sm"
                      variant="outline"
                      onPress={() =>
                        navigation.navigate('ServiceRequestDetails', {
                          requestId: currentCompletedJob.trackingCode || currentCompletedJob.id,
                        })
                      }
                    />
                  </View>
                </PrecisionCard>
              ) : (
                <PrecisionCard style={styles.emptyStreamCard}>
                  <AppIcon name="CheckCircle" size={24} color={Colors.outline} />
                  <Text style={styles.emptyTitle}>No Completed Jobs Recorded</Text>
                  <Text style={styles.emptySub}>
                    Finished service orders, parts replaced, and technician payouts will populate here.
                  </Text>
                </PrecisionCard>
              )
            )}

            {/* TAB 3: CUSTOMER SUPPORT DISPATCH */}
            {activeOpsTab === 'support' && (
              currentTicket ? (
                <PrecisionCard
                  style={styles.streamCard}
                  onPress={() =>
                    navigation.navigate('SupportTicketDetailsSup10482', {
                      ticketId: currentTicket.id,
                      ticket: currentTicket,
                    })
                  }
                >
                  {/* Pagination Header */}
                  {supportTicketsList.length > 1 && (
                    <View style={styles.streamPaginationRow}>
                      <Text style={styles.streamPageText}>
                        TICKET {Math.min(activeTicketIndex, supportTicketsList.length - 1) + 1} OF {supportTicketsList.length}
                      </Text>
                      <View style={styles.arrowGroup}>
                        <TouchableOpacity
                          onPress={() => setActiveTicketIndex((prev) => (prev > 0 ? prev - 1 : supportTicketsList.length - 1))}
                          style={styles.pageArrowBtn}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="ChevronLeft" size={13} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setActiveTicketIndex((prev) => (prev < supportTicketsList.length - 1 ? prev + 1 : 0))}
                          style={styles.pageArrowBtn}
                          activeOpacity={0.7}
                        >
                          <AppIcon name="ChevronRight" size={13} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Ticket Code & Status */}
                  <View style={styles.streamTopRow}>
                    <MonoMetric
                      label="TICKET CODE"
                      value={currentTicket.ticketCode || `#SUP-${currentTicket.id?.slice(0, 5)}`}
                    />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <StatusBadge
                        label={currentTicket.priority}
                        variant={
                          currentTicket.priority === 'URGENT' || currentTicket.priority === 'HIGH'
                            ? 'error'
                            : 'warning'
                        }
                        dot
                      />
                      <StatusBadge
                        label={currentTicket.status.toUpperCase()}
                        variant={
                          currentTicket.status === 'resolved' || currentTicket.status === 'closed'
                            ? 'success'
                            : 'info'
                        }
                      />
                    </View>
                  </View>

                  {/* Subject & Customer Statement */}
                  <View style={{ gap: 4 }}>
                    <Text style={styles.streamTitle}>{currentTicket.subject}</Text>
                    <Text style={styles.ticketExcerpt} numberOfLines={2}>
                      "{currentTicket.message}"
                    </Text>
                  </View>

                  {/* Customer & Assigned Tech Details */}
                  <View style={styles.detailsPairRow}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>CUSTOMER</Text>
                      <Text style={styles.detailBoxName} numberOfLines={1}>{currentTicket.userName}</Text>
                      <Text style={styles.detailBoxSub} numberOfLines={1}>📍 {currentTicket.serviceAddress}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>ASSIGNED TECH</Text>
                      <Text style={styles.detailBoxName} numberOfLines={1}>{currentTicket.technicianName}</Text>
                      <Text style={styles.detailBoxSub} numberOfLines={1}>
                        {currentTicket.trackingCode ? `Job ${currentTicket.trackingCode}` : 'Field Specialist'}
                      </Text>
                    </View>
                  </View>

                  {/* Workable Action Buttons */}
                  <View style={styles.ticketActionsRow}>
                    <TouchableOpacity
                      style={styles.ticketChatAction}
                      activeOpacity={0.75}
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('SupportConversation', {
                          ticketId: currentTicket.id,
                          ticket: currentTicket,
                          customerName: currentTicket.userName,
                          customerPhone: currentTicket.userPhone,
                        });
                      }}
                    >
                      <AppIcon name="MessageSquare" size={13} color="#FFFFFF" />
                      <Text style={styles.ticketChatActionText}>Open Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ticketCallAction}
                      activeOpacity={0.75}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (currentTicket.userPhone) {
                          phoneCallService.callNumber(currentTicket.userPhone, currentTicket.userName);
                        }
                      }}
                    >
                      <AppIcon name="Phone" size={13} color={Colors.primary} />
                      <Text style={styles.ticketCallActionText}>Call Customer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.ticketDossierAction}
                      activeOpacity={0.75}
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('SupportTicketDetailsSup10482', {
                          ticketId: currentTicket.id,
                          ticket: currentTicket,
                        });
                      }}
                    >
                      <Text style={styles.ticketDossierActionText}>Dossier →</Text>
                    </TouchableOpacity>
                  </View>
                </PrecisionCard>
              ) : (
                <PrecisionCard style={styles.emptyStreamCard}>
                  <AppIcon name="LifeBuoy" size={24} color={Colors.outline} />
                  <Text style={styles.emptyTitle}>No Active Support Tickets</Text>
                  <Text style={styles.emptySub}>
                    Incoming complaints, warranty inquiries, and customer helpdesk tickets will appear here.
                  </Text>
                </PrecisionCard>
              )
            )}
          </View>
        </FadeIn>

        {/* Clean Operations Modules Grid */}
        <FadeIn delay={180}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Management Modules</Text>
              <Text style={styles.sectionSubBadge}>HQ Controls</Text>
            </View>

            <View style={styles.moduleGrid}>
              <View style={styles.moduleRow}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('ServiceRequestsTab')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: 'rgba(0, 81, 213, 0.08)' }]}>
                    <AppIcon name="ClipboardList" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>Service Queue</Text>
                  <Text style={styles.moduleSub} numberOfLines={1}>
                    {metrics.activeRequests} active request{metrics.activeRequests !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('TechniciansTab')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: 'rgba(5, 150, 105, 0.08)' }]}>
                    <AppIcon name="UserCog" size={18} color={Colors.tertiaryEmerald} />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>Technicians</Text>
                  <Text style={styles.moduleSub} numberOfLines={1}>
                    {metrics.onlineTechnicians > 0
                      ? `${metrics.onlineTechnicians} online (${metrics.totalTechnicians} total)`
                      : `${metrics.totalTechnicians} registered partner${metrics.totalTechnicians !== 1 ? 's' : ''}`}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.moduleRow}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('Customers')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: 'rgba(124, 58, 237, 0.08)' }]}>
                    <AppIcon name="Users" size={18} color="#7C3AED" />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>Customers</Text>
                  <Text style={styles.moduleSub} numberOfLines={1}>
                    {metrics.totalCustomers} CRM account{metrics.totalCustomers !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('PaymentsTab')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]}>
                    <AppIcon name="CreditCard" size={18} color={Colors.onSurface} />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>Financials</Text>
                  <Text style={styles.moduleSub} numberOfLines={1}>
                    ₹{metrics.totalRevenue.toLocaleString()} gross revenue
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.moduleRow}>
                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('Disputes')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: 'rgba(217, 119, 6, 0.08)' }]}>
                    <AppIcon name="Scale" size={18} color="#D97706" />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>Disputes Arbiter</Text>
                  <Text style={styles.moduleSub} numberOfLines={1}>
                    {metrics.pendingDisputes} escalated claim{metrics.pendingDisputes !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.moduleCard}
                  onPress={() => navigation.navigate('Support')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.moduleIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                    <AppIcon name="LifeBuoy" size={18} color={Colors.error} />
                  </View>
                  <Text style={styles.moduleTitle} numberOfLines={1}>Support Tickets</Text>
                  <Text style={styles.moduleSub} numberOfLines={1}>
                    {metrics.unresolvedSupport} unresolved
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </FadeIn>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSub: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 1,
    fontSize: 9.5,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '800',
    fontSize: 17,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  logoutPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  logoutText: {
    ...Typography.labelMono,
    color: Colors.error,
    fontWeight: '700',
    fontSize: 10.5,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    width: '100%',
  },
  overviewHeroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    gap: 6,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  networkStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  networkStatusText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
    letterSpacing: 0.5,
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  syncStatusText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  heroGreeting: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  heroSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  kpiGrid: {
    gap: 10,
    width: '100%',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    gap: 3,
  },
  kpiCardAlert: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.02)',
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
    flex: 1,
  },
  kpiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    ...Typography.headlineSm,
    fontSize: 21,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 2,
  },
  kpiFooterText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  sectionContainer: {
    gap: 10,
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  sectionSubBadge: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 3,
    gap: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    ...Shadows.level1,
  },
  tabDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  tabButtonText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: Colors.onSurface,
    fontWeight: '800',
  },
  streamCard: {
    padding: 14,
    gap: 11,
    width: '100%',
  },
  emptyStreamCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  emptyTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 4,
    textAlign: 'center',
  },
  emptySub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 17,
  },
  streamPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  streamPageText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  arrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pageArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streamTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  streamSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  turnaroundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  turnaroundPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiaryEmerald,
  },
  detailsPairRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  detailBox: {
    flex: 1,
    gap: 2,
  },
  detailDivider: {
    width: 1,
    backgroundColor: Colors.outlineHairline,
  },
  detailBoxLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  detailBoxName: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  detailBoxSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  streamFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  fleetMapLink: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  timestampText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  peopleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 3,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  personRoleLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  personName: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  personMeta: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  personCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: 5,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  personCallBtnText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  partsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    padding: 10,
    gap: 6,
  },
  partsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partsSectionTitle: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  partsCountText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
    fontWeight: '800',
  },
  partsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  partChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.07)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.18)',
  },
  partChipText: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  payoutStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  payoutCol: {
    flex: 1,
    gap: 1,
  },
  payoutDivider: {
    width: 1,
    backgroundColor: Colors.outlineHairline,
    marginHorizontal: 8,
  },
  payoutColLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  payoutAmountTech: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  payoutDisbursedBadge: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
  },
  payoutAmountTotal: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  payoutMeta: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  guaranteeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  guaranteeBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.tertiaryEmerald,
    fontWeight: '600',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewStar: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: '#D97706',
    fontWeight: '800',
  },
  reviewComment: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  ticketExcerpt: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  ticketActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  ticketChatAction: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  ticketChatActionText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketCallAction: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  ticketCallActionText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  ticketDossierAction: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketDossierActionText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  moduleGrid: {
    gap: 10,
    width: '100%',
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  moduleCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    gap: 3,
  },
  moduleIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  moduleTitle: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  moduleSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
});
