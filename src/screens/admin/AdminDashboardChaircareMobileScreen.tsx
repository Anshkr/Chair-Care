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
      {/* Executive Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 10 }} />
          <View>
            <Text style={styles.headerSub}>CONSOLE • HQ</Text>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
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
        {/* Real Status Banner */}
        <FadeIn delay={40}>
          <View style={styles.realStatusCard}>
            <View style={styles.statusCardRow}>
              <View style={styles.liveIndicatorPill}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveIndicatorText}>OPERATIONS LIVE</Text>
              </View>
              <Text style={styles.statusDateText}>
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <Text style={styles.greetingTitle}>Platform Overview</Text>
            <Text style={styles.greetingSub}>
              {metrics.activeRequests} active field dispatch{metrics.activeRequests !== 1 ? 'es' : ''} • {metrics.onlineTechnicians} partner technician{metrics.onlineTechnicians !== 1 ? 's' : ''} online across Delhi NCR
            </Text>
          </View>
        </FadeIn>

        {/* 2x2 Executive KPI Grid */}
        <FadeIn delay={80}>
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

        {/* 1. Live Operations Dispatches (if any active dispatches exist) */}
        {liveActiveOps.length > 0 && currentActive && (
          <FadeIn delay={120}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.sectionHeading}>Live Operations</Text>
                  <View style={styles.liveOpsBadge}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveOpsBadgeText}>
                      {liveActiveOps.length} ACTIVE
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('LiveOperationsOverview')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.headerLinkText}>Open Fleet Map →</Text>
                </TouchableOpacity>
              </View>

              <PrecisionCard
                style={styles.cardContainer}
                onPress={() =>
                  navigation.navigate('ServiceRequestDetails', {
                    requestId: currentActive.trackingCode || currentActive.tracking_code || currentActive.id,
                  })
                }
              >
                {liveActiveOps.length > 1 && (
                  <View style={styles.paginationHeader}>
                    <Text style={styles.paginationText}>
                      OPERATION {Math.min(activeOpIndex, liveActiveOps.length - 1) + 1} OF {liveActiveOps.length}
                    </Text>
                    <View style={styles.arrowGroup}>
                      <TouchableOpacity
                        onPress={() => setActiveOpIndex((prev) => (prev > 0 ? prev - 1 : liveActiveOps.length - 1))}
                        style={styles.arrowBtn}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="ChevronLeft" size={13} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveOpIndex((prev) => (prev < liveActiveOps.length - 1 ? prev + 1 : 0))}
                        style={styles.arrowBtn}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="ChevronRight" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={styles.topManifestRow}>
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
                        : currentActive.status.toUpperCase()
                    }
                    variant={
                      currentActive.status === 'in_route' || currentActive.status === 'in_progress'
                        ? 'info'
                        : 'success'
                    }
                    dot
                  />
                </View>

                <View style={{ gap: 2 }}>
                  <Text style={styles.cardMainTitle}>
                    {currentActive.chairModel || currentActive.chair_model || 'Office Chair'}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {currentActive.serviceTitle || 'Service Dispatch'}
                  </Text>
                </View>

                <View style={styles.twoColumnPair}>
                  <View style={styles.columnItem}>
                    <Text style={styles.columnLabel}>CUSTOMER</Text>
                    <Text style={styles.columnName} numberOfLines={1}>
                      {currentActive.customerName || currentActive.customer_name || 'Customer'}
                    </Text>
                    <Text style={styles.columnSub} numberOfLines={1}>
                      📍 {currentActive.address || 'NCR'}
                    </Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.columnItem}>
                    <Text style={styles.columnLabel}>TECHNICIAN</Text>
                    <Text style={styles.columnName} numberOfLines={1}>
                      {currentActive.technicianName || currentActive.technician_name || 'Matching Tech'}
                    </Text>
                    <Text style={styles.columnSub} numberOfLines={1}>
                      Zone: {currentActive.currentZone || currentActive.current_zone || 'NCR Hub'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActionFooter}>
                  <Text style={styles.footerNoteText}>
                    Real-time field update
                  </Text>
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
            </View>
          </FadeIn>
        )}

        {/* 2. Completed Jobs & Turnaround (Dedicated Card) */}
        <FadeIn delay={150}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>Completed Jobs & Payouts</Text>
                {completedJobsList.length > 0 && (
                  <View style={styles.completedCountBadge}>
                    <AppIcon name="CheckCircle" size={11} color={Colors.tertiaryEmerald} />
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
                <Text style={styles.headerLinkText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {currentCompletedJob ? (
              <PrecisionCard
                style={styles.cardContainer}
                onPress={() =>
                  navigation.navigate('ServiceRequestDetails', {
                    requestId: currentCompletedJob.trackingCode || currentCompletedJob.id,
                  })
                }
              >
                {/* Pagination Controls */}
                {completedJobsList.length > 1 && (
                  <View style={styles.paginationHeader}>
                    <Text style={styles.paginationText}>
                      COMPLETED JOB {Math.min(activeCompletedIndex, completedJobsList.length - 1) + 1} OF {completedJobsList.length}
                    </Text>
                    <View style={styles.arrowGroup}>
                      <TouchableOpacity
                        onPress={() => setActiveCompletedIndex((prev) => (prev > 0 ? prev - 1 : completedJobsList.length - 1))}
                        style={styles.arrowBtn}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="ChevronLeft" size={13} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveCompletedIndex((prev) => (prev < completedJobsList.length - 1 ? prev + 1 : 0))}
                        style={styles.arrowBtn}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="ChevronRight" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Tracking ID & Real Turnaround Speed */}
                <View style={styles.topManifestRow}>
                  <MonoMetric
                    label="JOB MANIFEST"
                    value={currentCompletedJob.trackingCode || `#CC-${currentCompletedJob.id?.slice(0, 5)}`}
                  />
                  <View style={styles.turnaroundPill}>
                    <AppIcon name="Zap" size={11} color={Colors.tertiaryEmerald} />
                    <Text style={styles.turnaroundPillText}>
                      {currentCompletedJob.serviceDurationFormatted || `${currentCompletedJob.serviceDurationMins} mins turnaround`}
                    </Text>
                  </View>
                </View>

                {/* Chair Model & Service Title */}
                <View style={{ gap: 2 }}>
                  <Text style={styles.cardMainTitle}>
                    {currentCompletedJob.chairModel || 'Executive Office Chair'}
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    {currentCompletedJob.serviceTitle}
                  </Text>
                </View>

                {/* Customer's Real Problem Statement if available */}
                {currentCompletedJob.issueDescription && currentCompletedJob.issueDescription !== 'No description provided' ? (
                  <View style={styles.issueBox}>
                    <Text style={styles.issueBoxLabel}>CUSTOMER REPORTED ISSUE</Text>
                    <Text style={styles.issueBoxText} numberOfLines={2}>
                      "{currentCompletedJob.issueDescription}"
                    </Text>
                  </View>
                ) : null}

                {/* Side-by-Side Technician & Customer Profile with Direct Calling */}
                <View style={styles.twoColumnPair}>
                  {/* Technician Column */}
                  <View style={styles.columnItem}>
                    <View style={styles.personHeader}>
                      <AppIcon name="UserCheck" size={13} color={Colors.tertiaryEmerald} />
                      <Text style={styles.columnLabel}>TECHNICIAN</Text>
                    </View>
                    <Text style={styles.columnName} numberOfLines={1}>
                      {currentCompletedJob.technicianName}
                    </Text>
                    <Text style={styles.columnSub} numberOfLines={1}>
                      ★ {currentCompletedJob.technicianRating} • {currentCompletedJob.technicianZone}
                    </Text>
                    <TouchableOpacity
                      style={styles.callActionButton}
                      activeOpacity={0.75}
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
                      <Text style={styles.callActionButtonText}>Call Tech</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.verticalDivider} />

                  {/* Customer Column */}
                  <View style={styles.columnItem}>
                    <View style={styles.personHeader}>
                      <AppIcon name="User" size={13} color={Colors.secondaryCobalt} />
                      <Text style={styles.columnLabel}>CUSTOMER</Text>
                    </View>
                    <Text style={styles.columnName} numberOfLines={1}>
                      {currentCompletedJob.customerName}
                    </Text>
                    <Text style={styles.columnSub} numberOfLines={1}>
                      📍 {currentCompletedJob.customerAddress}
                    </Text>
                    <TouchableOpacity
                      style={styles.callActionButton}
                      activeOpacity={0.75}
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
                      <Text style={[styles.callActionButtonText, { color: Colors.secondaryCobalt }]}>
                        Call Customer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Parts Added / Replaced Section */}
                <View style={styles.partsSectionContainer}>
                  <View style={styles.partsHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <AppIcon name="Wrench" size={12} color={Colors.onSurfaceVariant} />
                      <Text style={styles.partsSectionLabel}>PARTS INSTALLED & REPLACED</Text>
                    </View>
                    <Text style={styles.partsCountNumber}>
                      {currentCompletedJob.partsAdded?.length || 0} ITEMS
                    </Text>
                  </View>
                  <View style={styles.partsWrapRow}>
                    {(currentCompletedJob.partsAdded || []).map((part: string, idx: number) => (
                      <View key={idx} style={styles.partPill}>
                        <AppIcon name="Check" size={10} color={Colors.tertiaryEmerald} />
                        <Text style={styles.partPillText}>{part}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Financials & Payout Strip */}
                <View style={styles.financialPayoutBox}>
                  <View style={styles.payoutColumn}>
                    <Text style={styles.payoutHeaderLabel}>PAID TO TECH (70%)</Text>
                    <Text style={styles.payoutBigNumber}>
                      ₹{currentCompletedJob.technicianPayout}
                    </Text>
                    <Text style={styles.payoutClearedBadge}>Disbursed • Escrow Cleared</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.payoutColumn}>
                    <Text style={styles.payoutHeaderLabel}>TOTAL BILLING</Text>
                    <Text style={styles.billingBigNumber}>
                      ₹{currentCompletedJob.totalAmount}
                    </Text>
                    <Text style={styles.billingMethodMeta}>
                      {currentCompletedJob.paymentMethod} • Margin: ₹{currentCompletedJob.platformFee}
                    </Text>
                  </View>
                </View>

                {/* Warranty & Customer Feedback if available */}
                <View style={styles.warrantyRow}>
                  <View style={styles.warrantyPill}>
                    <AppIcon name="ShieldCheck" size={12} color={Colors.tertiaryEmerald} />
                    <Text style={styles.warrantyPillText}>
                      {currentCompletedJob.warrantyStatus}
                    </Text>
                  </View>
                  {currentCompletedJob.reviewRating ? (
                    <View style={styles.ratingSnippet}>
                      <Text style={styles.ratingStarText}>★ {currentCompletedJob.reviewRating}</Text>
                      {currentCompletedJob.reviewComment ? (
                        <Text style={styles.ratingCommentText} numberOfLines={1}>
                          "{currentCompletedJob.reviewComment}"
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>

                {/* Footer Action Row */}
                <View style={styles.cardActionFooter}>
                  <Text style={styles.footerNoteText}>
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
              <PrecisionCard style={styles.emptyCardBox}>
                <AppIcon name="CheckCircle" size={24} color={Colors.outline} />
                <Text style={styles.emptyCardTitle}>No Completed Jobs Recorded</Text>
                <Text style={styles.emptyCardSub}>
                  Finished service orders and verified technician payouts will appear here.
                </Text>
              </PrecisionCard>
            )}
          </View>
        </FadeIn>

        {/* 3. Customer Support Tickets (Dedicated Card) */}
        <FadeIn delay={190}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>Customer Support Dispatch</Text>
                {supportTicketsList.length > 0 && (
                  <View style={styles.ticketCountBadge}>
                    <AppIcon name="LifeBuoy" size={11} color={Colors.error} />
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
                <Text style={styles.headerLinkText}>Helpdesk Desk →</Text>
              </TouchableOpacity>
            </View>

            {currentTicket ? (
              <PrecisionCard
                style={styles.cardContainer}
                onPress={() =>
                  navigation.navigate('SupportTicketDetailsSup10482', {
                    ticketId: currentTicket.id,
                    ticket: currentTicket,
                  })
                }
              >
                {/* Pagination Controls */}
                {supportTicketsList.length > 1 && (
                  <View style={styles.paginationHeader}>
                    <Text style={styles.paginationText}>
                      TICKET {Math.min(activeTicketIndex, supportTicketsList.length - 1) + 1} OF {supportTicketsList.length}
                    </Text>
                    <View style={styles.arrowGroup}>
                      <TouchableOpacity
                        onPress={() => setActiveTicketIndex((prev) => (prev > 0 ? prev - 1 : supportTicketsList.length - 1))}
                        style={styles.arrowBtn}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="ChevronLeft" size={13} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setActiveTicketIndex((prev) => (prev < supportTicketsList.length - 1 ? prev + 1 : 0))}
                        style={styles.arrowBtn}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="ChevronRight" size={13} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Ticket Code & Priority / Status Badges */}
                <View style={styles.topManifestRow}>
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

                {/* Subject & Customer Message */}
                <View style={{ gap: 4 }}>
                  <Text style={styles.cardMainTitle}>{currentTicket.subject}</Text>
                  <Text style={styles.customerQuoteText} numberOfLines={2}>
                    "{currentTicket.message}"
                  </Text>
                </View>

                {/* Customer & Assigned Tech Mini Details */}
                <View style={styles.twoColumnPair}>
                  <View style={styles.columnItem}>
                    <Text style={styles.columnLabel}>CUSTOMER</Text>
                    <Text style={styles.columnName} numberOfLines={1}>{currentTicket.userName}</Text>
                    <Text style={styles.columnSub} numberOfLines={1}>📍 {currentTicket.serviceAddress}</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.columnItem}>
                    <Text style={styles.columnLabel}>ASSIGNED TECH</Text>
                    <Text style={styles.columnName} numberOfLines={1}>{currentTicket.technicianName}</Text>
                    <Text style={styles.columnSub} numberOfLines={1}>
                      {currentTicket.trackingCode ? `Job ${currentTicket.trackingCode}` : 'Field Specialist'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons: Open Chat, Call Customer, Dossier */}
                <View style={styles.ticketActionsRow}>
                  <TouchableOpacity
                    style={styles.chatActionBtn}
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
                    <Text style={styles.chatActionBtnText}>Open Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.callCustomerActionBtn}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (currentTicket.userPhone) {
                        phoneCallService.callNumber(currentTicket.userPhone, currentTicket.userName);
                      }
                    }}
                  >
                    <AppIcon name="Phone" size={13} color={Colors.primary} />
                    <Text style={styles.callCustomerActionBtnText}>Call Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dossierActionBtn}
                    activeOpacity={0.75}
                    onPress={(e) => {
                      e.stopPropagation();
                      navigation.navigate('SupportTicketDetailsSup10482', {
                        ticketId: currentTicket.id,
                        ticket: currentTicket,
                      });
                    }}
                  >
                    <Text style={styles.dossierActionBtnText}>Dossier →</Text>
                  </TouchableOpacity>
                </View>
              </PrecisionCard>
            ) : (
              <PrecisionCard style={styles.emptyCardBox}>
                <AppIcon name="LifeBuoy" size={24} color={Colors.outline} />
                <Text style={styles.emptyCardTitle}>No Active Support Tickets</Text>
                <Text style={styles.emptyCardSub}>
                  Customer inquiries and escalation tickets will appear here.
                </Text>
              </PrecisionCard>
            )}
          </View>
        </FadeIn>

        {/* 4. Operations Modules Grid */}
        <FadeIn delay={220}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Management Modules</Text>
              <Text style={styles.sectionSubText}>HQ Controls</Text>
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
  realStatusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    gap: 6,
  },
  statusCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  liveIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  liveIndicatorText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
    letterSpacing: 0.5,
  },
  statusDateText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  greetingTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  greetingSub: {
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
  sectionSubText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  headerLinkText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  cardContainer: {
    padding: 14,
    gap: 11,
    width: '100%',
  },
  liveOpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  liveOpsBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  completedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  completedCountText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  ticketCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  ticketCountText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.error,
  },
  paginationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  paginationText: {
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
  arrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topManifestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMainTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  cardSubtitle: {
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
  issueBox: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 2,
  },
  issueBoxLabel: {
    ...Typography.labelMono,
    fontSize: 8.5,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  issueBoxText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  twoColumnPair: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 10,
    gap: 8,
  },
  columnItem: {
    flex: 1,
    gap: 2,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: Colors.outlineHairline,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  columnLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  columnName: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  columnSub: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  callActionButton: {
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
  callActionButtonText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  partsSectionContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    padding: 10,
    gap: 6,
  },
  partsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partsSectionLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  partsCountNumber: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
    fontWeight: '800',
  },
  partsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  partPill: {
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
  partPillText: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  financialPayoutBox: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  payoutColumn: {
    flex: 1,
    gap: 1,
  },
  payoutHeaderLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  payoutBigNumber: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  payoutClearedBadge: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
  },
  billingBigNumber: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  billingMethodMeta: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  warrantyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  warrantyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  warrantyPillText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.tertiaryEmerald,
    fontWeight: '600',
  },
  ratingSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    justifyContent: 'flex-end',
  },
  ratingStarText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: '#D97706',
    fontWeight: '800',
  },
  ratingCommentText: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  customerQuoteText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  cardActionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  footerNoteText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  ticketActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  chatActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  chatActionBtnText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  callCustomerActionBtn: {
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
  callCustomerActionBtnText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  dossierActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dossierActionBtnText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyCardBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
  },
  emptyCardTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCardSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 17,
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
