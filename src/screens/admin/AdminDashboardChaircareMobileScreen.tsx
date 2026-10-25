import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
  const [loading, setLoading] = useState(true);

  const fetchMetrics = React.useCallback(async () => {
    try {
      const res = await adminApi.getDashboardMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch {
      // Fallback to zero counts on network fail
    } finally {
      setLoading(false);
    }
  }, []);

  const [activeOpIndex, setActiveOpIndex] = useState(0);
  const [activeCompletedIndex, setActiveCompletedIndex] = useState(0);
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, fetchMetrics);

  const liveActiveOps = React.useMemo(() => {
    const list =
      (metrics as any).activeLiveOperations && (metrics as any).activeLiveOperations.length > 0
        ? (metrics as any).activeLiveOperations
        : (metrics.latestRequests || []).filter((r: any) =>
            ['finding_technician', 'assigned', 'in_route', 'arrived', 'in_progress'].includes(r.status)
          );
    return list;
  }, [metrics]);

  const currentActive =
    liveActiveOps.length > 0
      ? liveActiveOps[Math.min(activeOpIndex, liveActiveOps.length - 1)]
      : metrics.latestRequests?.[0] || null;

  const completedJobsList = React.useMemo(() => {
    return (metrics as any).completedJobs || [];
  }, [metrics]);

  const currentCompletedJob =
    completedJobsList.length > 0
      ? completedJobsList[Math.min(activeCompletedIndex, completedJobsList.length - 1)]
      : null;

  const supportTicketsList = React.useMemo(() => {
    return (metrics as any).supportTickets || [];
  }, [metrics]);

  const currentTicket =
    supportTicketsList.length > 0
      ? supportTicketsList[Math.min(activeTicketIndex, supportTicketsList.length - 1)]
      : null;

  return (
    <ScreenContainer hasPadding={false}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerSub}>CONSOLE • HQ</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 6 }} />
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
        {/* Executive Greeting Card */}
        <FadeIn delay={40}>
          <PrecisionCard style={styles.executiveCard}>
            <View style={styles.execHeaderRow}>
              <View style={styles.execLivePill}>
                <View style={styles.pulseDot} />
                <Text style={styles.execLiveText}>CONSOLE OVERVIEW</Text>
              </View>
              <StatusBadge label="NODES NOMINAL" variant="success" dot />
            </View>

            <Text style={styles.execTitle}>Good morning, Platform Admin</Text>
            <Text style={styles.execSub}>
              Real-time telemetry and dispatch health across Gurugram and Delhi NCR corridors.
            </Text>

            {/* Operational Corridor Micro-Strip */}
            <View style={styles.corridorStrip}>
              <View style={styles.corridorLeft}>
                <AppIcon name="Radio" size={16} color={Colors.secondaryCobalt} />
                <Text style={styles.corridorName}>Gurugram Tech Mesh v4.2</Text>
              </View>
              <Text style={styles.corridorSync}>48/50 Nodes Syncing</Text>
            </View>
          </PrecisionCard>
        </FadeIn>

        {/* 2x2 KPI Metrics Grid */}
        <FadeIn delay={120}>
          <View style={styles.kpiGrid}>
            {/* Row 1: Active Services & Pending Queue */}
            <View style={styles.kpiRow}>
              <PrecisionCard
                style={styles.kpiCard}
                onPress={() => navigation.navigate('ServiceRequestsTab')}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>ACTIVE SERVICES</Text>
                  <AppIcon name="Activity" size={18} color={Colors.secondaryCobalt} />
                </View>
                <AnimatedNumber value={metrics.activeRequests} style={styles.kpiNumber} />
                <Text style={styles.kpiDelta} numberOfLines={1}>
                  {metrics.todayRequests} requested today
                </Text>
              </PrecisionCard>

              <PrecisionCard
                style={styles.kpiCard}
                onPress={() => navigation.navigate('ServiceRequestsTab')}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>PENDING QUEUE</Text>
                  <AppIcon name="Clock" size={18} color={Colors.error} />
                </View>
                <AnimatedNumber
                  value={metrics.pendingRequests}
                  style={[styles.kpiNumber, { color: metrics.pendingRequests > 0 ? Colors.error : Colors.onSurface }]}
                />
                <Text style={styles.kpiDeltaError} numberOfLines={1}>
                  {metrics.pendingRequests > 0 ? 'Awaiting assignment' : 'Queue clear'}
                </Text>
              </PrecisionCard>
            </View>

            {/* Row 2: Techs Online & Today's GMV */}
            <View style={styles.kpiRow}>
              <PrecisionCard
                style={styles.kpiCard}
                onPress={() => navigation.navigate('TechniciansTab')}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>TECHS ONLINE</Text>
                  <AppIcon name="Users" size={18} color={Colors.tertiaryEmerald} />
                </View>
                <AnimatedNumber
                  value={metrics.onlineTechnicians}
                  style={[styles.kpiNumber, { color: Colors.tertiaryEmerald }]}
                />
                <Text style={styles.kpiDeltaSuccess} numberOfLines={1}>
                  {metrics.totalTechnicians} total registered
                </Text>
              </PrecisionCard>

              <PrecisionCard
                style={styles.kpiCard}
                onPress={() => navigation.navigate('PaymentsTab')}
              >
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>TOTAL REVENUE</Text>
                  <AppIcon name="IndianRupee" size={18} color={Colors.onSurface} />
                </View>
                <AnimatedNumber
                  value={Number(metrics.totalRevenue) || 0}
                  prefix="₹"
                  style={styles.kpiNumber}
                />
                <Text style={styles.kpiDeltaSuccess} numberOfLines={1}>Verified payments</Text>
              </PrecisionCard>
            </View>
          </View>
        </FadeIn>

        {/* Live Operations Highlight */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionHeading}>Live Operations</Text>
              {liveActiveOps.length > 0 && (
                <View style={styles.liveOpsCountBadge}>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.liveOpsCountText}>
                    {liveActiveOps.length} ACTIVE
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LiveOperationsOverview')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Open Fleet Map →</Text>
            </TouchableOpacity>
          </View>

          {currentActive ? (
            <PrecisionCard
              style={styles.liveOpsCard}
              onPress={() =>
                navigation.navigate('ServiceRequestDetails', {
                  requestId: currentActive.trackingCode || currentActive.tracking_code || currentActive.id,
                })
              }
            >
              {/* Pagination controls if multiple active ops */}
              {liveActiveOps.length > 1 && (
                <View style={styles.liveOpsPaginationRow}>
                  <Text style={styles.liveOpsPageText}>
                    OPERATION {Math.min(activeOpIndex, liveActiveOps.length - 1) + 1} OF {liveActiveOps.length}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setActiveOpIndex((prev) => (prev > 0 ? prev - 1 : liveActiveOps.length - 1))}
                      style={styles.pageArrowBtn}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="ChevronLeft" size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveOpIndex((prev) => (prev < liveActiveOps.length - 1 ? prev + 1 : 0))}
                      style={styles.pageArrowBtn}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="ChevronRight" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.liveOpsTop}>
                <View style={styles.reqIdRow}>
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
                        ? 'QUEUED • MATCHING TECH'
                        : currentActive.status.toUpperCase()
                    }
                    variant={
                      currentActive.status === 'completed'
                        ? 'success'
                        : currentActive.status === 'in_route' || currentActive.status === 'in_progress'
                        ? 'info'
                        : currentActive.status === 'assigned'
                        ? 'success'
                        : 'warning'
                    }
                    dot
                  />
                </View>
                <Text style={styles.liveOpsChair}>
                  {currentActive.chairModel || currentActive.chair_model || 'Office Chair Service'}
                </Text>
                <Text style={styles.liveOpsDetails}>
                  Customer: {currentActive.customerName || currentActive.customer_name || 'Customer'} • Tech:{' '}
                  {currentActive.technicianName || currentActive.technician_name || 'Awaiting Match'}
                </Text>
              </View>

              <View style={styles.liveOpsActionRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.liveOpsZone} numberOfLines={1}>
                    📍 {currentActive.address || 'NCR Region'}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.secondaryCobalt, marginTop: 2 }}>
                    {currentActive.serviceTitle ? `${currentActive.serviceTitle} • ` : ''}
                    Corridor: {currentActive.currentZone || currentActive.current_zone || 'Delhi NCR'}
                  </Text>
                </View>
                <PrecisionButton
                  title="View Manifest →"
                  size="sm"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate('ServiceRequestDetails', {
                      requestId: currentActive.trackingCode || currentActive.tracking_code || currentActive.id,
                    })
                  }
                />
              </View>
            </PrecisionCard>
          ) : (
            <PrecisionCard style={[styles.liveOpsCard, { paddingVertical: 20, alignItems: 'center' }]}>
              <AppIcon name="Activity" size={24} color={Colors.outline} />
              <Text style={[styles.liveOpsChair, { fontSize: 14, textAlign: 'center', marginTop: 6 }]}>
                No active field dispatches at this moment
              </Text>
              <Text style={[styles.liveOpsDetails, { textAlign: 'center' }]}>
                Incoming customer requests and dispatched technicians will be streamed here in real time.
              </Text>
            </PrecisionCard>
          )}
        </View>

        {/* Completed Jobs & Turnaround Audit Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionHeading}>Completed Services & Payouts</Text>
              {completedJobsList.length > 0 && (
                <View style={styles.completedCountBadge}>
                  <AppIcon name="CheckCircle" size={12} color={Colors.tertiaryEmerald} />
                  <Text style={styles.completedCountText}>
                    {completedJobsList.length} COMPLETED
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('ServiceRequestsTab')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {currentCompletedJob ? (
            <PrecisionCard
              style={styles.completedCard}
              onPress={() =>
                navigation.navigate('ServiceRequestDetails', {
                  requestId: currentCompletedJob.trackingCode || currentCompletedJob.id,
                })
              }
            >
              {/* Pagination controls */}
              {completedJobsList.length > 1 && (
                <View style={styles.liveOpsPaginationRow}>
                  <Text style={styles.liveOpsPageText}>
                    COMPLETED JOB {Math.min(activeCompletedIndex, completedJobsList.length - 1) + 1} OF {completedJobsList.length}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setActiveCompletedIndex((prev) => (prev > 0 ? prev - 1 : completedJobsList.length - 1))}
                      style={styles.pageArrowBtn}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="ChevronLeft" size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveCompletedIndex((prev) => (prev < completedJobsList.length - 1 ? prev + 1 : 0))}
                      style={styles.pageArrowBtn}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="ChevronRight" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Top Row: Request ID & Turnaround Speed */}
              <View style={styles.reqIdRow}>
                <MonoMetric
                  label="JOB MANIFEST"
                  value={currentCompletedJob.trackingCode || `#CC-${currentCompletedJob.id?.slice(0, 5)}`}
                />
                <View style={styles.turnaroundBadge}>
                  <AppIcon name="Zap" size={11} color={Colors.tertiaryEmerald} />
                  <Text style={styles.turnaroundText}>
                    {currentCompletedJob.serviceDurationFormatted || `${currentCompletedJob.serviceDurationMins || 42} mins turnaround`}
                  </Text>
                </View>
              </View>

              {/* Title & Service info */}
              <View style={{ gap: 2 }}>
                <Text style={styles.liveOpsChair}>
                  {currentCompletedJob.chairModel || 'Executive Office Chair'}
                </Text>
                <Text style={styles.serviceSubtitle}>
                  {currentCompletedJob.serviceTitle}
                </Text>
              </View>

              {/* Customer & Technician 2-Column Section */}
              <View style={styles.entityRow}>
                {/* Technician Column */}
                <View style={styles.entityCol}>
                  <View style={styles.entityHeader}>
                    <AppIcon name="UserCheck" size={14} color={Colors.tertiaryEmerald} />
                    <Text style={styles.entityRole}>TECHNICIAN</Text>
                  </View>
                  <Text style={styles.entityName} numberOfLines={1}>
                    {currentCompletedJob.technicianName}
                  </Text>
                  <Text style={styles.entityMeta} numberOfLines={1}>
                    ★ {currentCompletedJob.technicianRating} • {currentCompletedJob.technicianVehicle || 'Unit #12'}
                  </Text>
                  <TouchableOpacity
                    style={styles.callTechBtn}
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (currentCompletedJob.technicianPhone) {
                        phoneCallService.callNumber(currentCompletedJob.technicianPhone, currentCompletedJob.technicianName);
                      }
                    }}
                  >
                    <AppIcon name="Phone" size={12} color={Colors.primary} />
                    <Text style={styles.callTechBtnText}>Call Tech</Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.entityDivider} />

                {/* Customer Column */}
                <View style={styles.entityCol}>
                  <View style={styles.entityHeader}>
                    <AppIcon name="User" size={14} color={Colors.secondaryCobalt} />
                    <Text style={styles.entityRole}>CUSTOMER</Text>
                  </View>
                  <Text style={styles.entityName} numberOfLines={1}>
                    {currentCompletedJob.customerName}
                  </Text>
                  <Text style={styles.entityMeta} numberOfLines={1}>
                    📍 {currentCompletedJob.customerAddress}
                  </Text>
                  <TouchableOpacity
                    style={styles.callCustBtn}
                    activeOpacity={0.7}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (currentCompletedJob.customerPhone) {
                        phoneCallService.callNumber(currentCompletedJob.customerPhone, currentCompletedJob.customerName);
                      }
                    }}
                  >
                    <AppIcon name="Phone" size={12} color={Colors.secondaryCobalt} />
                    <Text style={styles.callCustBtnText}>Call Customer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Parts Added / Replaced Section */}
              <View style={styles.partsSection}>
                <View style={styles.partsHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <AppIcon name="Wrench" size={13} color={Colors.onSurfaceVariant} />
                    <Text style={styles.partsLabel}>PARTS INSTALLED & REPLACED</Text>
                  </View>
                  <Text style={styles.partsCount}>
                    {currentCompletedJob.partsAdded?.length || 0} ITEMS
                  </Text>
                </View>
                <View style={styles.partsWrap}>
                  {(currentCompletedJob.partsAdded || []).map((part: string, idx: number) => (
                    <View key={idx} style={styles.partChip}>
                      <AppIcon name="Check" size={11} color={Colors.tertiaryEmerald} />
                      <Text style={styles.partChipText}>{part}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Financials & Payout Strip */}
              <View style={styles.financialStrip}>
                <View style={styles.financialCol}>
                  <Text style={styles.financialLabel}>PAID TO TECH (70%)</Text>
                  <Text style={styles.financialTechPayout}>
                    ₹{currentCompletedJob.technicianPayout}
                  </Text>
                  <Text style={styles.payoutStatus}>Disbursed • Escrow Cleared</Text>
                </View>
                <View style={styles.financialDivider} />
                <View style={styles.financialCol}>
                  <Text style={styles.financialLabel}>TOTAL CHARGE</Text>
                  <Text style={styles.financialTotal}>
                    ₹{currentCompletedJob.totalAmount}
                  </Text>
                  <Text style={styles.paymentMethodText}>
                    {currentCompletedJob.paymentMethod} • Fee: ₹{currentCompletedJob.platformFee}
                  </Text>
                </View>
              </View>

              {/* Warranty & Review Banner if present */}
              <View style={styles.warrantyRow}>
                <View style={styles.warrantyBadge}>
                  <AppIcon name="ShieldCheck" size={13} color={Colors.tertiaryEmerald} />
                  <Text style={styles.warrantyText}>
                    {currentCompletedJob.warrantyStatus || '90-Day Digital Warranty Active'}
                  </Text>
                </View>
                {currentCompletedJob.reviewRating ? (
                  <View style={styles.reviewSnippet}>
                    <Text style={styles.reviewStar}>★ {currentCompletedJob.reviewRating}</Text>
                    {currentCompletedJob.reviewComment ? (
                      <Text style={styles.reviewSnippetText} numberOfLines={1}>
                        "{currentCompletedJob.reviewComment}"
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {/* Bottom Action Row */}
              <View style={styles.cardFooterRow}>
                <Text style={styles.completedTimestamp}>
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
            <PrecisionCard style={[styles.liveOpsCard, { paddingVertical: 20, alignItems: 'center' }]}>
              <AppIcon name="CheckCircle" size={24} color={Colors.outline} />
              <Text style={[styles.liveOpsChair, { fontSize: 14, textAlign: 'center', marginTop: 6 }]}>
                No completed jobs recorded yet
              </Text>
              <Text style={[styles.liveOpsDetails, { textAlign: 'center' }]}>
                Finished service orders, parts replaced, and technician payouts will populate here.
              </Text>
            </PrecisionCard>
          )}
        </View>

        {/* Customer Support Dispatch Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.sectionHeading}>Customer Support Dispatch</Text>
              {supportTicketsList.length > 0 && (
                <View style={styles.ticketCountBadge}>
                  <AppIcon name="LifeBuoy" size={12} color={Colors.error} />
                  <Text style={styles.ticketCountText}>
                    {supportTicketsList.length} ACTIVE
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('Support')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>Helpdesk Desk →</Text>
            </TouchableOpacity>
          </View>

          {currentTicket ? (
            <PrecisionCard
              style={styles.ticketCard}
              onPress={() =>
                navigation.navigate('SupportTicketDetailsSup10482', {
                  ticketId: currentTicket.id,
                  ticket: currentTicket,
                })
              }
            >
              {/* Pagination controls */}
              {supportTicketsList.length > 1 && (
                <View style={styles.liveOpsPaginationRow}>
                  <Text style={styles.liveOpsPageText}>
                    TICKET {Math.min(activeTicketIndex, supportTicketsList.length - 1) + 1} OF {supportTicketsList.length}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => setActiveTicketIndex((prev) => (prev > 0 ? prev - 1 : supportTicketsList.length - 1))}
                      style={styles.pageArrowBtn}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="ChevronLeft" size={14} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTicketIndex((prev) => (prev < supportTicketsList.length - 1 ? prev + 1 : 0))}
                      style={styles.pageArrowBtn}
                      activeOpacity={0.7}
                    >
                      <AppIcon name="ChevronRight" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Ticket ID & Badges */}
              <View style={styles.reqIdRow}>
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

              {/* Subject & Statement */}
              <View style={{ gap: 4 }}>
                <Text style={styles.ticketSubject}>
                  {currentTicket.subject}
                </Text>
                <Text style={styles.ticketMessage} numberOfLines={2}>
                  "{currentTicket.message}"
                </Text>
              </View>

              {/* Customer & Technician Mini Details */}
              <View style={styles.ticketPartyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partyRoleLabel}>CUSTOMER</Text>
                  <Text style={styles.partyName} numberOfLines={1}>{currentTicket.userName}</Text>
                  <Text style={styles.partySub} numberOfLines={1}>📍 {currentTicket.serviceAddress}</Text>
                </View>
                <View style={styles.ticketPartyDivider} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.partyRoleLabel}>ASSIGNED TECH</Text>
                  <Text style={styles.partyName} numberOfLines={1}>{currentTicket.technicianName}</Text>
                  <Text style={styles.partySub} numberOfLines={1}>
                    {currentTicket.trackingCode ? `Job ${currentTicket.trackingCode}` : 'Field Specialist'}
                  </Text>
                </View>
              </View>

              {/* Workable Action Buttons Row: Open Chat, Call Customer, View Dossier */}
              <View style={styles.ticketActionRow}>
                <TouchableOpacity
                  style={styles.ticketChatBtn}
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
                  <AppIcon name="MessageSquare" size={14} color="#FFFFFF" />
                  <Text style={styles.ticketChatBtnText}>Open Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ticketCallBtn}
                  activeOpacity={0.75}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (currentTicket.userPhone) {
                      phoneCallService.callNumber(currentTicket.userPhone, currentTicket.userName);
                    }
                  }}
                >
                  <AppIcon name="Phone" size={14} color={Colors.primary} />
                  <Text style={styles.ticketCallBtnText}>Call Customer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.ticketDossierBtn}
                  activeOpacity={0.75}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('SupportTicketDetailsSup10482', {
                      ticketId: currentTicket.id,
                      ticket: currentTicket,
                    });
                  }}
                >
                  <Text style={styles.ticketDossierBtnText}>Dossier →</Text>
                </TouchableOpacity>
              </View>
            </PrecisionCard>
          ) : (
            <PrecisionCard style={[styles.liveOpsCard, { paddingVertical: 20, alignItems: 'center' }]}>
              <AppIcon name="LifeBuoy" size={24} color={Colors.outline} />
              <Text style={[styles.liveOpsChair, { fontSize: 14, textAlign: 'center', marginTop: 6 }]}>
                No customer support tickets active
              </Text>
              <Text style={[styles.liveOpsDetails, { textAlign: 'center' }]}>
                Incoming support requests, warranty claims, and customer chats will appear here.
              </Text>
            </PrecisionCard>
          )}
        </View>

        {/* Admin Operational Modules Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Operations Modules</Text>

          <View style={styles.moduleGrid}>
            <View style={styles.moduleRow}>
              <TouchableOpacity
                style={styles.moduleCard}
                onPress={() => navigation.navigate('ServiceRequestsTab')}
                activeOpacity={0.8}
              >
                <AppIcon name="ClipboardList" size={20} color={Colors.primary} />
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
                <AppIcon name="UserCog" size={20} color={Colors.primary} />
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
                <AppIcon name="Users" size={20} color={Colors.primary} />
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
                <AppIcon name="CreditCard" size={20} color={Colors.primary} />
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
                <AppIcon name="Scale" size={20} color={Colors.secondaryCobalt} />
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
                <AppIcon name="LifeBuoy" size={20} color={Colors.primary} />
                <Text style={styles.moduleTitle} numberOfLines={1}>Support Tickets</Text>
                <Text style={styles.moduleSub} numberOfLines={1}>
                  {metrics.unresolvedSupport} unresolved
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    gap: 10,
  },
  headerSub: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 1,
    fontSize: 10,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  logoutText: {
    ...Typography.labelMono,
    color: Colors.error,
    fontWeight: '700',
    fontSize: 11,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    width: '100%',
  },
  executiveCard: {
    padding: 16,
    gap: 10,
    width: '100%',
  },
  execHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  execLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  execLiveText: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    fontSize: 10,
  },
  execTitle: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  execSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  corridorStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginTop: 4,
  },
  corridorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  corridorName: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  corridorSync: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  kpiGrid: {
    gap: 12,
    width: '100%',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    gap: 4,
    justifyContent: 'space-between',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  kpiTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 4,
  },
  kpiNumber: {
    ...Typography.headlineSm,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 4,
  },
  kpiDelta: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    marginTop: 2,
  },
  kpiDeltaError: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.error,
    marginTop: 2,
  },
  kpiDeltaSuccess: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.tertiaryEmerald,
    marginTop: 2,
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
    color: Colors.onSurface,
    fontWeight: '700',
  },
  seeAllText: {
    ...Typography.labelMd,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  liveOpsCard: {
    padding: 16,
    gap: 12,
    width: '100%',
  },
  liveOpsTop: {
    gap: 6,
  },
  reqIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveOpsChair: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  liveOpsDetails: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  liveOpsActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 12,
  },
  liveOpsZone: {
    ...Typography.labelMono,
    color: Colors.outline,
    fontSize: 10,
  },
  liveOpsCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  liveOpsCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  liveOpsPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  liveOpsPageText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  pageArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleGrid: {
    gap: 12,
    width: '100%',
  },
  moduleRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  moduleCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    gap: 4,
  },
  moduleTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  moduleSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  completedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  completedCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  completedCard: {
    padding: 16,
    gap: 12,
    width: '100%',
  },
  turnaroundBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  turnaroundText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiaryEmerald,
  },
  serviceSubtitle: {
    ...Typography.bodySm,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  entityRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 10,
  },
  entityCol: {
    flex: 1,
    gap: 4,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  entityRole: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  entityName: {
    ...Typography.bodyMd,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  entityMeta: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  callTechBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  callTechBtnText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  callCustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  callCustBtnText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  entityDivider: {
    width: 1,
    backgroundColor: Colors.outlineHairline,
  },
  partsSection: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    padding: 12,
    gap: 8,
  },
  partsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partsLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  partsCount: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
  },
  partsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  partChipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  financialStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  financialCol: {
    flex: 1,
    gap: 2,
  },
  financialDivider: {
    width: 1,
    backgroundColor: Colors.outlineHairline,
    marginHorizontal: 8,
  },
  financialLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  financialTechPayout: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  payoutStatus: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.tertiaryEmerald,
  },
  financialTotal: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  paymentMethodText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  warrantyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  warrantyText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.tertiaryEmerald,
    fontWeight: '600',
  },
  reviewSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewStar: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#D97706',
    fontWeight: '800',
  },
  reviewSnippetText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  completedTimestamp: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  ticketCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ticketCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
  },
  ticketCard: {
    padding: 16,
    gap: 12,
    width: '100%',
  },
  ticketSubject: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ticketMessage: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  ticketPartyRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 10,
  },
  ticketPartyDivider: {
    width: 1,
    backgroundColor: Colors.outlineHairline,
  },
  partyRoleLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  partyName: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 2,
  },
  partySub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  ticketActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 12,
  },
  ticketChatBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  ticketChatBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketCallBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  ticketCallBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  ticketDossierBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketDossierBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});

