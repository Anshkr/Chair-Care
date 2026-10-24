import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Animated,
  Platform,
  Linking,
  Image,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { PrecisionCard } from '../../components/common/PrecisionCard';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MonoMetric } from '../../components/common/MonoMetric';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi, notificationApi } from '../../services/api';
import { useAdminSync } from '../../services/adminSync';
import { AnimatedNumber } from '../../animations/AnimatedNumber';
import { FadeIn } from '../../animations/FadeIn';
import { VoiceCallModal } from '../../components/common/VoiceCallModal';
import { phoneCallService } from '../../services/phone/phoneCallService';

export const TechnicianDashboardChaircareMobileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { logout, currentUser } = useAuth();
  const {
    isOnline,
    setIsOnline,
    availabilityStatus,
    serviceRadius,
    schedules,
  } = useTechnician();

  const [jobs, setJobs] = useState<any[]>([]);
  const [completedHistory, setCompletedHistory] = useState<any[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'active' | 'history'>('active');
  const [earnings, setEarnings] = useState<any>({ todayEarnings: 0, completedJobs: 0 });
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);
  const [isMarkingArrived, setIsMarkingArrived] = useState<boolean>(false);

  const fetchTechData = useCallback(async () => {
    try {
      const [jobsRes, earningsRes, notifsRes, historyRes] = await Promise.all([
        technicianApi.getJobs(),
        technicianApi.getEarnings(),
        notificationApi.getUnreadCount(),
        technicianApi.getJobHistory(),
      ]);
      if (jobsRes.success && Array.isArray(jobsRes.data)) {
        setJobs(jobsRes.data);
      }
      if (earningsRes.success && earningsRes.data) {
        setEarnings(earningsRes.data);
      }
      if (notifsRes.success && notifsRes.data) {
        setUnreadNotifCount(notifsRes.data.count);
      }
      if (historyRes.success && Array.isArray(historyRes.data)) {
        setCompletedHistory(historyRes.data);
      }
    } catch {
      // Handled with initial empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechData();
    const interval = setInterval(fetchTechData, 4000);
    return () => clearInterval(interval);
  }, [fetchTechData]);

  // Live real-time sync with backend & admin events
  useAdminSync(navigation, fetchTechData);

  const handleToggleOnline = (val: boolean) => {
    setIsOnline(val);
    setToastMessage(
      val
        ? 'You are now ONLINE • Accepting customer service dispatches'
        : 'You are now OFFLINE • Duty paused (no incoming dispatches)'
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const techName = currentUser?.name || 'Rajesh Kumar';
  const techInitials = techName
    .split(' ')
    .filter(Boolean)
    .map((p: string) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'RK';

  const todaySchedule = schedules.find((s) => s.active)?.hours || '09:00 - 19:00';

  // Active accepted jobs by this technician
  // Unaccepted broadcast jobs (finding_technician) belong strictly in Queue (queuedJobs)
  const activeJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (j.status === 'finding_technician' || j.status === 'completed' || j.status === 'cancelled') {
        return false;
      }
      const isAcceptedByMe = j.isAssignedToMe === true || Boolean(j.technician_id || j.technicianId);
      const hasActiveStatus = ['assigned', 'technician_assigned', 'in_route', 'arrived', 'in_progress'].includes(j.status);
      return isAcceptedByMe && hasActiveStatus;
    });
  }, [jobs]);

  // Active working job takes priority: in_progress > arrived > in_route > assigned
  const activeJob = useMemo(() => {
    if (activeJobs.length === 0) return null;

    const stageRank: Record<string, number> = {
      in_progress: 1,
      arrived: 2,
      in_route: 3,
      assigned: 4,
      technician_assigned: 4,
    };

    return [...activeJobs].sort(
      (a, b) => (stageRank[a.status] || 99) - (stageRank[b.status] || 99)
    )[0];
  }, [activeJobs]);

  const hasActiveJob = Boolean(activeJob);

  // Queued jobs assigned by Admin for when current active job finishes
  const adminQueuedJobs = useMemo(() => {
    if (!activeJob) return [];
    return activeJobs.filter((j) => j.id !== activeJob.id);
  }, [activeJobs, activeJob]);

  // Continuous rhythmic blinking animation for pending job recognition
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hasActiveJob) {
      const blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.15,
            duration: 650,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 650,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      blinkLoop.start();
      return () => blinkLoop.stop();
    }
  }, [hasActiveJob, blinkAnim]);

  const queuedJobs = jobs.filter((j) => {
    if (j.status !== 'finding_technician') return false;
    if (j.isAssignedToMe) return false;
    const createdAtStr = j.createdAt || j.created_at;
    if (createdAtStr) {
      const diffMs = Date.now() - new Date(createdAtStr).getTime();
      if (diffMs > 30 * 60 * 1000) return false;
    }
    return true;
  });
  const hasQueuedJobs = queuedJobs.length > 0;

  // Normalized active job fields
  const jobTicketCode = activeJob?.trackingCode || activeJob?.tracking_code || 'DISPATCH';
  const jobTitle = activeJob?.serviceTitle || activeJob?.service_title || 'Chair Repair Dispatch';
  const jobModel = activeJob?.chairModel || activeJob?.chair_model || 'Ergonomic Task Chair';
  const customerName = activeJob?.customerName || activeJob?.customer_name || 'Customer';
  const customerPhone = activeJob?.customerPhone || activeJob?.customer_phone;
  const jobAddress = activeJob?.address || 'Site Address';
  const jobTimeSlot = activeJob?.timeSlot || activeJob?.time_slot || 'ASAP';
  const jobVisitDate = activeJob?.visitDate || activeJob?.visit_date || 'Today';
  const jobFare = activeJob?.totalAmount || activeJob?.total_amount || 0;
  const jobStatus = (activeJob?.status || 'assigned').replace('_', ' ').toUpperCase();

  const dutyLabel = !isOnline
    ? 'DUTY PAUSED (OFFLINE)'
    : hasActiveJob
    ? `DOING JOB • #${jobTicketCode}`
    : 'FIELD OPERATIVE ONLINE';

  const dutyBadgeLabel = !isOnline
    ? 'OFFLINE'
    : hasActiveJob
    ? 'DOING JOB'
    : 'ONLINE';

  const dutyBadgeColor = !isOnline
    ? '#64748b'
    : hasActiveJob
    ? Colors.secondaryCobalt
    : Colors.tertiaryEmerald;

  const dutyBadgeBg = !isOnline
    ? 'rgba(148, 163, 184, 0.2)'
    : hasActiveJob
    ? 'rgba(19, 70, 153, 0.15)'
    : 'rgba(16, 185, 129, 0.15)';

  return (
    <ScreenContainer hasPadding={false}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={34} containerStyle={{ marginRight: 8 }} />
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerSub}>CHAIRCARE • FIELD PARTNER</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Technician Dashboard
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" />
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <AppIcon name="Bell" size={18} color={Colors.onSurface} />
            {unreadNotifCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TechnicianHeaderAvatar size={38} />
        </View>
      </View>

      {/* Floating Status Toast Notification */}
      {!!toastMessage && (
        <View style={styles.toastNotification}>
          <View
            style={[
              styles.toastDot,
              { backgroundColor: isOnline ? Colors.tertiaryEmerald : Colors.outline },
            ]}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting & Technician Identity */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingLeft}>
            <View style={[styles.statusChip, hasActiveJob && styles.statusChipActiveJob]}>
              <Animated.View
                style={[
                  styles.statusDot,
                  { backgroundColor: dutyBadgeColor, opacity: hasActiveJob ? blinkAnim : 1 },
                ]}
              />
              <Text
                style={[
                  styles.statusChipText,
                  { color: dutyBadgeColor },
                ]}
              >
                {dutyLabel}
              </Text>
            </View>
            <Text style={styles.greetingHeading}>Good morning, {techName.split(' ')[0]}</Text>
            <Text style={styles.greetingSub}>
              {!isOnline
                ? 'You are currently off duty. Switch online to receive jobs.'
                : hasActiveJob
                ? `You have an active in-field dispatch: ${jobTitle} (${jobModel}).`
                : 'Your radar is live in Delhi NCR corridor accepting new requests.'}
            </Text>
          </View>

          <View style={styles.profileAvatarContainer}>
            <TechnicianHeaderAvatar
              size={50}
              borderRadius={BorderRadius.xl}
              showBadge={true}
              onPress={() => navigation.navigate('TechProfileTab')}
            />
            <View style={styles.ratingBadge}>
              <AppIcon name="Star" size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>
                {earnings?.rating ? Number(earnings.rating).toFixed(1) : '4.9'}
              </Text>
            </View>
          </View>
        </View>

        {/* 📋 ADMIN ASSIGNED QUEUED JOB BANNER: NOTIFIES TECHNICIAN ABOUT ADMIN ASSIGNMENT */}
        {adminQueuedJobs.length > 0 && (
          <View style={styles.adminQueuedBanner}>
            <View style={styles.adminQueuedLeft}>
              <View style={styles.adminQueuedIconBox}>
                <AppIcon name="Shield" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.adminQueuedTextGroup}>
                <View style={styles.adminQueuedTitleRow}>
                  <Text style={styles.adminQueuedTitle}>
                    ADMIN ASSIGNED YOU A JOB • #{adminQueuedJobs[0].trackingCode || adminQueuedJobs[0].tracking_code}
                  </Text>
                  <View style={styles.queuedNextBadge}>
                    <Text style={styles.queuedNextBadgeText}>QUEUED NEXT</Text>
                  </View>
                </View>
                <Text style={styles.adminQueuedSub} numberOfLines={1}>
                  {adminQueuedJobs[0].serviceTitle || adminQueuedJobs[0].chairModel || 'Repair Service'} • Scheduled to start after you complete current job #{jobTicketCode}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ⚡ PROMINENT BROADCAST BANNER: NEW JOB REQUEST WAITING IN QUEUE */}
        {hasQueuedJobs && (
          <TouchableOpacity
            style={styles.newJobsQueuedBanner}
            onPress={() => navigation.navigate('JobRequestsTab')}
            activeOpacity={0.85}
          >
            <View style={styles.newJobsQueuedLeft}>
              <View style={styles.newJobsIconBox}>
                <AppIcon name="Zap" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.newJobsTextGroup}>
                <View style={styles.newJobsTitleRow}>
                  <Text style={styles.newJobsQueuedTitle}>
                    {queuedJobs.length} NEW JOB REQUEST{queuedJobs.length > 1 ? 'S' : ''} IN QUEUE
                  </Text>
                  <View style={styles.newPulseBadge}>
                    <Text style={styles.newPulseBadgeText}>BROADCAST</Text>
                  </View>
                </View>
                <Text style={styles.newJobsQueuedSub} numberOfLines={1}>
                  {queuedJobs[0].serviceTitle || queuedJobs[0].chairModel || 'Repair'} • Payout ₹{queuedJobs[0].totalAmount || 599} • Tap to view & accept
                </Text>
              </View>
            </View>
            <View style={styles.newJobsQueuedArrow}>
              <Text style={styles.newJobsArrowText}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 🚨 PROMINENT BLINKING HERO ALERT: ACTIVE PENDING JOB REQUIRING TECHNICIAN ATTENTION */}
        {hasActiveJob && (
          <View
            style={[
              styles.pendingJobHeroCard,
              activeJob?.status === 'arrived' && styles.pendingJobHeroCardArrived,
            ]}
          >
            {/* Top Status Bar: Status Alert Beacon + Dynamic Status Pill */}
            <View style={styles.pendingJobTopRow}>
              <View style={styles.pendingBlinkHeader}>
                <Animated.View
                  style={[
                    styles.blinkingBeaconDot,
                    { opacity: blinkAnim },
                    activeJob?.status === 'arrived' && { backgroundColor: '#10B981' },
                  ]}
                />
                <Animated.Text
                  style={[
                    styles.pendingAlertTag,
                    { opacity: blinkAnim },
                    activeJob?.status === 'arrived' && { color: '#059669' },
                  ]}
                >
                  {activeJob?.status === 'arrived'
                    ? '📍 AT LOCATION • READY TO INSPECT'
                    : '● ACTIVE DISPATCH • ACTION REQUIRED'}
                </Animated.Text>
              </View>

              <View
                style={[
                  styles.pendingStatusBadge,
                  activeJob?.status === 'arrived' && { backgroundColor: '#DCFCE7' },
                  activeJob?.status === 'in_route' && { backgroundColor: '#FEF3C7' },
                ]}
              >
                <Text
                  style={[
                    styles.pendingStatusBadgeText,
                    activeJob?.status === 'arrived' && { color: '#15803D' },
                    activeJob?.status === 'in_route' && { color: '#B45309' },
                  ]}
                >
                  {jobStatus}
                </Text>
              </View>
            </View>

            {/* Ticket & Payout Headline */}
            <View style={styles.pendingJobBody}>
              <View style={styles.pendingTicketRow}>
                <Text style={styles.pendingTicketCode}>Ticket #{jobTicketCode}</Text>
                <View style={styles.payoutBadgePill}>
                  <Text style={styles.pendingFareMono}>₹{jobFare} Booked Price</Text>
                </View>
              </View>
              <Text style={styles.pendingJobTitleText}>
                {jobTitle}
              </Text>
              <Text style={styles.pendingJobModelSub}>{jobModel}</Text>
            </View>

            {/* In-field Customer & Location Details */}
            <View style={styles.pendingDetailsCol}>
              <View style={styles.pendingDetailRow}>
                <View style={styles.detailIconCircle}>
                  <AppIcon name="User" size={14} color={Colors.secondaryCobalt} />
                </View>
                <Text style={styles.pendingDetailText} numberOfLines={1}>
                  Client: <Text style={{ fontWeight: '700', color: Colors.onSurface }}>{customerName}</Text>
                  {customerPhone ? ` • ${customerPhone}` : ''}
                </Text>
              </View>

              <View style={styles.pendingDetailRow}>
                <View style={styles.detailIconCircle}>
                  <AppIcon name="MapPin" size={14} color={Colors.secondaryCobalt} />
                </View>
                <Text style={styles.pendingDetailText} numberOfLines={2}>
                  {jobAddress}
                </Text>
              </View>

              <View style={styles.pendingDetailRow}>
                <View style={styles.detailIconCircle}>
                  <AppIcon name="Clock" size={14} color={Colors.secondaryCobalt} />
                </View>
                <Text style={styles.pendingDetailText}>
                  Slot: <Text style={{ fontWeight: '600', color: Colors.onSurface }}>{jobVisitDate} • {jobTimeSlot}</Text>
                </Text>
              </View>
            </View>

            {/* Action Deck: Clean, Spacious, Two-Tier Layout (Eliminates Messy Cramping) */}
            <View style={styles.cleanActionDeck}>
              {/* Row 1: Primary Direct Action CTAs */}
              <View style={styles.primaryActionRow}>
                {activeJob?.status === 'arrived' ? (
                  <TouchableOpacity
                    style={[styles.heroPrimaryBtn, styles.heroArrivedActiveBtn]}
                    onPress={() =>
                      navigation.navigate('ArrivedAtCustomer', {
                        requestId: activeJob.id || jobTicketCode,
                        request: activeJob,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.heroBtnContent}>
                      <AppIcon name="MapPin" size={17} color="#FFFFFF" />
                      <Text style={styles.heroPrimaryBtnText}>Arrived at Location • Checklist</Text>
                    </View>
                    <Text style={styles.heroBtnArrow}>→</Text>
                  </TouchableOpacity>
                ) : activeJob?.status === 'in_progress' ? (
                  <TouchableOpacity
                    style={[styles.heroPrimaryBtn, styles.heroInProgressActiveBtn]}
                    onPress={() =>
                      navigation.navigate('ActiveJob', {
                        requestId: activeJob.id || jobTicketCode,
                        request: activeJob,
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <View style={styles.heroBtnContent}>
                      <AppIcon name="Wrench" size={17} color="#FFFFFF" />
                      <Text style={styles.heroPrimaryBtnText}>Repair In Progress • Active Job</Text>
                    </View>
                    <Text style={styles.heroBtnArrow}>→</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.heroNavigateHalfBtn}
                      onPress={() =>
                        navigation.navigate('NavigateToCustomer', {
                          requestId: activeJob.id || jobTicketCode,
                          request: activeJob,
                        })
                      }
                      activeOpacity={0.85}
                    >
                      <AppIcon name="Navigation" size={16} color="#FFFFFF" />
                      <Text style={styles.heroNavigateHalfBtnText}>Navigate</Text>
                      <Text style={styles.heroBtnArrowSmall}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.heroArrivedGateHalfBtn,
                        isMarkingArrived && { opacity: 0.65 },
                      ]}
                      disabled={isMarkingArrived}
                      onPress={async () => {
                        const resolvedId = activeJob.id || jobTicketCode;
                        setIsMarkingArrived(true);
                        try {
                          await technicianApi.updateJobStatus(
                            resolvedId,
                            'arrived',
                            'Technician has arrived at customer location.'
                          );
                          setToastMessage('✓ Arrived at Location! Customer notified.');
                          setTimeout(() => setToastMessage(null), 3500);
                          await fetchTechData();
                        } catch (err: any) {
                          setToastMessage('Could not update arrival status.');
                          setTimeout(() => setToastMessage(null), 3000);
                        } finally {
                          setIsMarkingArrived(false);
                        }
                      }}
                      activeOpacity={0.85}
                    >
                      <AppIcon name="MapPin" size={16} color="#B45309" />
                      <Text style={styles.heroArrivedGateHalfBtnText}>
                        {isMarkingArrived ? 'Marking...' : 'Mark Arrived'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Row 2: Secondary Auxiliary Actions (Details, Chat, Call) */}
              <View style={styles.secondaryActionRow}>
                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() =>
                    navigation.navigate('JobRequestDetails', {
                      jobId: activeJob.id || jobTicketCode,
                      request: activeJob,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <AppIcon name="ClipboardList" size={15} color={Colors.secondaryCobalt} />
                  <Text style={styles.heroSecondaryBtnText}>Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() =>
                    navigation.navigate('TechnicianChat', {
                      customerName,
                      customerPhone,
                      requestId: activeJob.id || jobTicketCode,
                      request: activeJob,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <AppIcon name="MessageSquare" size={15} color={Colors.secondaryCobalt} />
                  <Text style={styles.heroSecondaryBtnText}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.heroSecondaryBtn}
                  onPress={() => phoneCallService.callNumber(customerPhone || '', customerName || 'Customer')}
                  activeOpacity={0.8}
                >
                  <AppIcon name="Phone" size={15} color={Colors.secondaryCobalt} />
                  <Text style={styles.heroSecondaryBtnText}>Call</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Availability Card */}
        <PrecisionCard
          style={[
            styles.availabilityCard,
            !isOnline && styles.availabilityCardOffline,
          ]}
        >
          <View style={styles.availabilityHeader}>
            <View style={styles.availabilityLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.availTitle}>Duty Status</Text>
                <View
                  style={[
                    styles.dutyLiveBadge,
                    {
                      backgroundColor: dutyBadgeBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dutyLiveText,
                      { color: dutyBadgeColor },
                    ]}
                  >
                    {dutyBadgeLabel}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.availStatus,
                  {
                    color: !isOnline
                      ? Colors.outline
                      : hasActiveJob
                      ? Colors.secondaryCobalt
                      : Colors.tertiaryEmerald,
                  },
                ]}
              >
                {!isOnline
                  ? 'Currently offline and hidden from dispatch radar'
                  : hasActiveJob
                  ? `Active in service: #${activeJob.trackingCode} (${activeJob.chairModel})`
                  : 'Accepting incoming customer service requests'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: Colors.outlineVariant, true: Colors.tertiaryEmerald }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={styles.availDesc}>
            {isOnline
              ? `You are discoverable within your ${serviceRadius} km dispatch corridor.`
              : 'Switch online to start receiving instant job alerts and roadside dispatch.'}
          </Text>
          <View style={styles.availFooter}>
            <TouchableOpacity
              onPress={() => navigation.navigate('TechnicianAvailability')}
            >
              <Text style={styles.adjustHoursText}>Adjust Working Hours & Zone →</Text>
            </TouchableOpacity>
            <MonoMetric value={todaySchedule} label="DUTY SLOT" />
          </View>
        </PrecisionCard>

        {/* Today's KPI Summary Row (4 stats) */}
        <View style={styles.kpiRow}>
          {/* Stat 1: Requests */}
          <PrecisionCard
            style={styles.kpiCard}
            onPress={() => navigation.navigate('JobRequestsTab')}
          >
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>Queue</Text>
              <AppIcon name="Zap" size={16} color={Colors.secondaryCobalt} />
            </View>
            <AnimatedNumber
              value={queuedJobs.length}
              style={styles.kpiValue}
            />
            <Text style={styles.kpiSubSecondary}>Radar alerts</Text>
          </PrecisionCard>

          {/* Stat 2: Active */}
          <PrecisionCard
            style={[
              styles.kpiCard,
              dashboardTab === 'active' && { borderColor: Colors.secondaryCobalt, borderWidth: 1.5 },
            ]}
            onPress={() => setDashboardTab('active')}
          >
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>Active</Text>
              <AppIcon name="Wrench" size={16} color={Colors.secondaryCobalt} />
            </View>
            <AnimatedNumber
              value={activeJobs.length}
              style={styles.kpiValue}
            />
            <Text style={styles.kpiSub}>Dispatches</Text>
          </PrecisionCard>

          {/* Stat 3: Completed History */}
          <PrecisionCard
            style={[
              styles.kpiCard,
              dashboardTab === 'history' && { borderColor: Colors.tertiaryEmerald, borderWidth: 1.5 },
            ]}
            onPress={() => setDashboardTab('history')}
          >
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>History</Text>
              <AppIcon name="CheckCircle2" size={16} color={Colors.tertiaryEmerald} />
            </View>
            <AnimatedNumber
              value={completedHistory.length}
              style={[styles.kpiValue, { color: Colors.tertiaryEmerald }]}
            />
            <Text style={styles.kpiSubSuccess}>Completed</Text>
          </PrecisionCard>

          {/* Stat 4: Earnings */}
          <PrecisionCard
            style={styles.kpiCard}
            onPress={() => navigation.navigate('EarningsTab')}
          >
            <View style={styles.kpiTop}>
              <Text style={styles.kpiLabel}>Earnings</Text>
              <AppIcon name="Wallet" size={16} color="#B45309" />
            </View>
            <AnimatedNumber
              value={Number(earnings?.todayEarnings) || 0}
              prefix="₹"
              style={styles.kpiValue}
            />
            <Text style={styles.kpiSubSuccess}>Verified</Text>
          </PrecisionCard>
        </View>

        {/* Interactive Segmented Switcher: Active Dispatches vs Completed History */}
        <View style={styles.dashboardTabSegmentRow}>
          <TouchableOpacity
            style={[
              styles.dashboardTabBtn,
              dashboardTab === 'active' && styles.dashboardTabBtnActive,
            ]}
            onPress={() => setDashboardTab('active')}
            activeOpacity={0.8}
          >
            <AppIcon
              name="Zap"
              size={15}
              color={dashboardTab === 'active' ? '#FFFFFF' : Colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.dashboardTabBtnText,
                dashboardTab === 'active' && styles.dashboardTabBtnTextActive,
              ]}
            >
              Active Dispatches ({activeJobs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.dashboardTabBtn,
              dashboardTab === 'history' && styles.dashboardTabBtnActive,
            ]}
            onPress={() => setDashboardTab('history')}
            activeOpacity={0.8}
          >
            <AppIcon
              name="History"
              size={15}
              color={dashboardTab === 'history' ? '#FFFFFF' : Colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.dashboardTabBtnText,
                dashboardTab === 'history' && styles.dashboardTabBtnTextActive,
              ]}
            >
              Completed History ({completedHistory.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Completed Jobs History View */}
        {dashboardTab === 'history' ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <AppIcon name="FolderClock" size={18} color={Colors.tertiaryEmerald} />
                <Text style={styles.sectionHeading}>Completed Jobs ({completedHistory.length})</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('TechHistoryTab')}>
                <Text style={styles.seeAllText}>Full History Tab →</Text>
              </TouchableOpacity>
            </View>

            {completedHistory.length === 0 ? (
              <PrecisionCard style={[styles.jobRequestCard, { paddingVertical: 28, alignItems: 'center', gap: 8 }]}>
                <AppIcon name="FolderClock" size={32} color={Colors.outline} />
                <Text style={[styles.jobTitle, { fontSize: 15, textAlign: 'center' }]}>
                  No completed jobs recorded yet
                </Text>
                <Text style={[styles.jobSub, { textAlign: 'center', maxWidth: 300 }]}>
                  When you service chairs and enter the customer security PIN, your completed jobs with settled earnings will appear right here.
                </Text>
                <PrecisionButton
                  title="Switch to Active Dispatches →"
                  size="sm"
                  variant="primary"
                  style={{ marginTop: 8 }}
                  onPress={() => setDashboardTab('active')}
                />
              </PrecisionCard>
            ) : (
              completedHistory.slice(0, 6).map((job) => {
                const dateStr = job.completedAt
                  ? new Date(job.completedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Completed';

                return (
                  <PrecisionCard key={job.id} style={styles.historyCardMini}>
                    {/* Header */}
                    <View style={styles.historyCardMiniHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.completedPillSmall}>
                          <AppIcon name="CheckCircle2" size={12} color={Colors.tertiaryEmerald} />
                          <Text style={styles.completedPillTextSmall}>COMPLETED</Text>
                        </View>
                        <Text style={styles.historyTicketCode}>#{job.trackingCode}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.historyPayoutText}>+₹{job.payoutAmount || Math.round((job.totalAmount || 0) * 0.7)}</Text>
                        <Text style={styles.historyPayoutSub}>Payout Settled</Text>
                      </View>
                    </View>

                    {/* Service & Chair */}
                    <Text style={styles.historyServiceTitle}>{job.serviceTitle || 'Chair Repair Service'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppIcon name="Wrench" size={13} color={Colors.secondaryCobalt} />
                      <Text style={styles.historyChairModel}>{job.chairModel}</Text>
                    </View>

                    {/* Customer & Address */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <AppIcon name="MapPin" size={13} color={Colors.onSurfaceVariant} />
                      <Text style={styles.historyAddressText} numberOfLines={1}>
                        {job.customerName} • {job.address}
                      </Text>
                    </View>

                    {/* Review Snippet if available */}
                    {job.rating ? (
                      <View style={styles.historyReviewSnippet}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <AppIcon name="Star" size={12} color="#EAB308" />
                          <Text style={styles.historyRatingNum}>{job.rating}.0 / 5.0</Text>
                        </View>
                        {!!job.reviewComment && (
                          <Text style={styles.historyReviewText} numberOfLines={1}>
                            "{job.reviewComment}"
                          </Text>
                        )}
                      </View>
                    ) : null}

                    {/* Footer */}
                    <View style={styles.historyFooterRow}>
                      <Text style={styles.historyDateText}>Completed: {dateStr}</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.historyActionLink}
                          onPress={() =>
                            navigation.navigate('JobRequestDetails', {
                              jobId: job.id,
                              request: job,
                            })
                          }
                        >
                          <Text style={styles.historyActionLinkText}>Details →</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.historyActionLink}
                          onPress={() =>
                            navigation.navigate('TechnicianChat', {
                              customerName: job.customerName,
                              customerPhone: job.customerPhone,
                              requestId: job.id,
                              request: job,
                            })
                          }
                        >
                          <Text style={styles.historyActionLinkText}>Chat</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </PrecisionCard>
                );
              })
            )}

            {completedHistory.length > 6 && (
              <PrecisionButton
                title={`View All ${completedHistory.length} Completed Jobs in History Tab →`}
                variant="outline"
                size="sm"
                onPress={() => navigation.navigate('TechHistoryTab')}
              />
            )}
          </View>
        ) : (
          /* Tab 2: Active Dispatches Feed Section */
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Active Dispatches</Text>
              <TouchableOpacity onPress={() => navigation.navigate('JobRequestsTab')}>
                <Text style={styles.seeAllText}>Radar Queue ({queuedJobs.length}) →</Text>
              </TouchableOpacity>
            </View>

            {activeJob ? (
              <PrecisionCard
                style={[
                  styles.jobRequestCard,
                  hasActiveJob && styles.jobRequestCardActiveGlow,
                ]}
                onPress={() =>
                  navigation.navigate('JobRequestDetails', {
                    jobId: activeJob.id || jobTicketCode,
                    request: activeJob,
                  })
                }
              >
                <View style={styles.jobCardTop}>
                  <View style={styles.jobBadgeRow}>
                    <View style={styles.blinkingRowMini}>
                      <Animated.View style={[styles.miniBlinkDot, { opacity: blinkAnim }]} />
                      <StatusBadge label={jobStatus} variant="info" />
                    </View>
                    <MonoMetric label="BOOKED PRICE" value={`₹${jobFare}`} highlight />
                  </View>
                  <Text style={styles.jobTitle}>
                    {jobTitle}
                  </Text>
                  <Text style={styles.jobSub}>
                    {jobModel} • {jobAddress}
                  </Text>
                </View>

                <View style={styles.jobCardActionRow}>
                  <Text style={styles.jobTimeText}>
                    Scheduled: {jobVisitDate} • {jobTimeSlot}
                  </Text>
                  <PrecisionButton
                    title="Navigate to Customer →"
                    size="sm"
                    variant="primary"
                    onPress={() =>
                      navigation.navigate('NavigateToCustomer', {
                        requestId: activeJob.id || jobTicketCode,
                        request: activeJob,
                      })
                    }
                  />
                </View>
              </PrecisionCard>
            ) : (
              <PrecisionCard style={[styles.jobRequestCard, { paddingVertical: 24, alignItems: 'center' }]}>
                <AppIcon name="Wrench" size={24} color={Colors.outline} />
                <Text style={[styles.jobTitle, { fontSize: 14, textAlign: 'center', marginTop: 8 }]}>
                  No active dispatches
                </Text>
                <Text style={[styles.jobSub, { textAlign: 'center' }]}>
                  {queuedJobs.length > 0
                    ? `You have ${queuedJobs.length} radar alert${queuedJobs.length > 1 ? 's' : ''} in queue waiting for technician acceptance.`
                    : isOnline
                    ? 'You are active. New chair repair requests in your radius will show up in Queue.'
                    : 'Toggle your availability online above to receive new job dispatches.'}
                </Text>
                {queuedJobs.length > 0 && (
                  <TouchableOpacity
                    style={[styles.heroPrimaryBtn, { marginTop: 14, paddingHorizontal: 20 }]}
                    onPress={() => navigation.navigate('JobRequestsTab')}
                  >
                    <Text style={styles.heroPrimaryBtnText}>Open Radar Queue ({queuedJobs.length}) →</Text>
                  </TouchableOpacity>
                )}
              </PrecisionCard>
            )}
          </View>
        )}

        {/* Today's Schedule */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Today's Schedule</Text>

          {activeJob ? (
            <PrecisionCard style={styles.scheduleCard}>
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleTime}>
                  <Text style={styles.scheduleHour}>{activeJob.time_slot?.split('-')[0] || '10:00 AM'}</Text>
                  <Text style={styles.scheduleDuration}>45m</Text>
                </View>
                <View style={styles.scheduleDivider} />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleCustomer}>
                    {activeJob.customer_name || 'Customer'}
                  </Text>
                  <Text style={styles.scheduleIssue}>
                    {activeJob.chair_model} - {activeJob.issue_description}
                  </Text>
                  <StatusBadge label={activeJob.status.toUpperCase()} variant="success" />
                </View>
              </View>
            </PrecisionCard>
          ) : (
            <PrecisionCard style={[styles.scheduleCard, { paddingVertical: 18, alignItems: 'center' }]}>
              <Text style={[styles.jobSub, { textAlign: 'center' }]}>
                No appointments scheduled for today.
              </Text>
            </PrecisionCard>
          )}
        </View>
      </ScrollView>

      <VoiceCallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        contactName={customerName || 'Customer'}
        contactRole="Client / Resident"
        phoneNumber={customerPhone || ''}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
    gap: 1,
  },
  techIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techBadgeIcon: {
    fontSize: 18,
  },
  headerSub: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingLeft: {
    flex: 1,
    gap: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  greetingHeading: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  greetingSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  toastNotification: {
    position: 'absolute',
    top: 68,
    left: 16,
    right: 16,
    zIndex: 99,
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level3,
  },
  toastDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toastText: {
    ...Typography.bodySm,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
    fontSize: 12,
  },
  dutyLiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  dutyLiveText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
  },
  profileAvatarContainer: {
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#005ac1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.tertiaryEmerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ratingStar: {
    fontSize: 10,
  },
  ratingText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  availabilityCard: {
    padding: 14,
    gap: 8,
    backgroundColor: '#F3FAF7',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  availabilityCardOffline: {
    backgroundColor: '#F8FAFC',
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityLeft: {
    gap: 2,
  },
  availTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  availStatus: {
    ...Typography.labelMd,
    fontWeight: '600',
  },
  availDesc: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  availFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
    paddingTop: 8,
    marginTop: 4,
  },
  adjustHoursText: {
    ...Typography.labelMd,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
  },
  kpiIcon: {
    fontSize: 14,
  },
  kpiValue: {
    ...Typography.headlineSm,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  kpiSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  kpiSubSecondary: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  kpiSubSuccess: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 10,
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
  jobRequestCard: {
    padding: 14,
    gap: 12,
  },
  jobCardTop: {
    gap: 6,
  },
  jobBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  jobSub: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  jobCardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  jobTimeText: {
    ...Typography.labelMono,
    color: Colors.outline,
    fontSize: 11,
  },
  scheduleCard: {
    padding: 14,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleTime: {
    alignItems: 'center',
  },
  scheduleHour: {
    ...Typography.labelMono,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scheduleDuration: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  scheduleDivider: {
    width: 2,
    height: 40,
    backgroundColor: Colors.secondaryFixedDim,
    borderRadius: 1,
  },
  scheduleDetails: {
    flex: 1,
    gap: 4,
  },
  scheduleCustomer: {
    ...Typography.bodyMd,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scheduleIssue: {
    ...Typography.bodySm,
    color: Colors.onSurfaceVariant,
  },
  // Pending Job Hero Alert Card
  statusChipActiveJob: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: 'rgba(19, 70, 153, 0.3)',
  },
  pendingJobHeroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#93C5FD',
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    shadowColor: Colors.secondaryCobalt,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  pendingJobHeroCardArrived: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    shadowColor: '#10B981',
  },
  pendingJobTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingBlinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blinkingBeaconDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  pendingAlertTag: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.6,
  },
  pendingStatusBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: BorderRadius.full,
  },
  pendingStatusBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  pendingJobBody: {
    gap: 4,
  },
  pendingTicketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingTicketCode: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  payoutBadgePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pendingFareMono: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  pendingJobTitleText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    lineHeight: 22,
  },
  pendingJobModelSub: {
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  pendingDetailsCol: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 8,
  },
  pendingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingDetailText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  cleanActionDeck: {
    gap: 8,
    marginTop: 2,
  },
  primaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroNavigateHalfBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    ...Shadows.level1,
  },
  heroNavigateHalfBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroArrivedGateHalfBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  heroArrivedGateHalfBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  heroPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...Shadows.level1,
  },
  heroArrivedActiveBtn: {
    backgroundColor: '#059669',
  },
  heroInProgressActiveBtn: {
    backgroundColor: Colors.secondaryCobalt,
  },
  heroBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroPrimaryBtnText: {
    ...Typography.labelMd,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroBtnArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroBtnArrowSmall: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSecondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroSecondaryBtnText: {
    ...Typography.labelSm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  jobRequestCardActiveGlow: {
    borderWidth: 2,
    borderColor: Colors.secondaryCobalt,
    backgroundColor: '#f8faff',
  },
  blinkingRowMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBlinkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLowest,
  },
  notifBadgeText: {
    ...Typography.labelMono,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  newJobsQueuedBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    borderRadius: BorderRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...Shadows.level2,
  },
  newJobsQueuedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newJobsIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  newJobsTextGroup: {
    flex: 1,
    gap: 2,
  },
  newJobsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newJobsQueuedTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.3,
  },
  newPulseBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  newPulseBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  newJobsQueuedSub: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: '#1E40AF',
  },
  newJobsQueuedArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newJobsArrowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.level1,
  },
  adminQueuedBanner: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    borderRadius: BorderRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...Shadows.level2,
  },
  adminQueuedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminQueuedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  adminQueuedTextGroup: {
    flex: 1,
    gap: 2,
  },
  adminQueuedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminQueuedTitle: {
    ...Typography.titleLg,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#5B21B6',
    letterSpacing: 0.3,
  },
  queuedNextBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  queuedNextBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: '#6D28D9',
  },
  adminQueuedSub: {
    ...Typography.bodyMd,
    fontSize: 11.5,
    color: '#6D28D9',
  },
  dashboardTabSegmentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  dashboardTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  dashboardTabBtnActive: {
    backgroundColor: Colors.secondaryCobalt,
    ...Shadows.level1,
  },
  dashboardTabBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  dashboardTabBtnTextActive: {
    color: '#FFFFFF',
  },
  historyCardMini: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  historyCardMiniHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  completedPillTextSmall: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
    letterSpacing: 0.5,
  },
  historyTicketCode: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  historyPayoutText: {
    ...Typography.titleSm,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
    fontSize: 14,
  },
  historyPayoutSub: {
    ...Typography.labelMono,
    fontSize: 8.5,
    color: Colors.outline,
  },
  historyServiceTitle: {
    ...Typography.titleMd,
    fontWeight: '700',
    color: Colors.onSurface,
    fontSize: 14,
  },
  historyChairModel: {
    ...Typography.bodySm,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
    fontSize: 12,
  },
  historyAddressText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  historyReviewSnippet: {
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 2,
  },
  historyRatingNum: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#EAB308',
  },
  historyReviewText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
    fontStyle: 'italic',
  },
  historyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  historyDateText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  historyActionLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  historyActionLinkText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
});
