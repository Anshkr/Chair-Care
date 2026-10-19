import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';
import { useAdminSync } from '../../services/adminSync';

export interface JobRequestTicket {
  id: string;
  ticketNumber: string;
  priority: 'urgent' | 'normal' | 'flexible';
  priorityLabel: string;
  serviceTitle: string;
  customerName: string;
  customerInitials: string;
  customerRating: number;
  isVerifiedCustomer: boolean;
  locationArea: string;
  locationDetail: string;
  scheduleTime: string;
  scheduleTag: string;
  isUrgentTag?: boolean;
  chairModel: string;
  chairTag: string;
  symptom: string;
  payoutRange: string;
  payoutNote1: string;
  payoutNote2: string;
  isHighMargin?: boolean;
  status: 'new' | 'pending' | 'accepted' | 'declined';
  rawStatus?: string;
  totalAmount?: number;
  isPaid?: boolean;
  createdAt?: string;
  isAssignedToMe?: boolean;
}

type TabType = 'new' | 'pending' | 'accepted' | 'declined';

/**
 * Screen ID: T05
 * Title: Job Requests
 * Reference: design-reference/technician/job_requests_chaircare_mobile
 */
export const JobRequestsChaircareMobileScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isOnline, serviceRadius } = useTechnician();

  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [tickets, setTickets] = useState<JobRequestTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(2800),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await technicianApi.getJobs();
      if (res.success && Array.isArray(res.data)) {
        // Drop unaccepted broadcast requests older than 30 minutes
        const activeQueueData = res.data.filter((item: any) => {
          if (item.isAssignedToMe) return true;
          if (item.status === 'finding_technician' && item.createdAt) {
            const diffMs = Date.now() - new Date(item.createdAt).getTime();
            if (diffMs > 30 * 60 * 1000) {
              return false; // Automatically invisible after 30 minutes
            }
          }
          return true;
        });

        const mapped: JobRequestTicket[] = activeQueueData.map((item: any) => {
          let status: 'new' | 'pending' | 'accepted' | 'declined' = 'new';
          if (
            item.status === 'assigned' ||
            item.status === 'technician_assigned' ||
            item.status === 'in_route' ||
            item.status === 'arrived' ||
            item.status === 'in_progress' ||
            item.status === 'completed'
          ) {
            status = 'accepted';
          } else if (item.status === 'finding_technician') {
            status = 'new';
          } else if (item.status === 'cancelled') {
            status = 'declined';
          } else {
            status = 'pending';
          }

          const rawName = item.customerName || 'Customer';
          const nameParts = rawName.trim().split(/\s+/);
          const initials =
            nameParts.length >= 2
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : rawName.slice(0, 2).toUpperCase();

          const total = Number(item.totalAmount) || 599;

          return {
            id: String(item.id),
            ticketNumber: item.trackingCode || `REQ-${String(item.id).slice(0, 4).toUpperCase()}`,
            priority: (item.priority || 'normal') as any,
            priorityLabel:
              item.priority === 'urgent'
                ? 'Urgent • Priority Dispatch'
                : 'Standard Dispatch',
            serviceTitle: item.serviceTitle || 'Office Chair Repair',
            customerName: item.customerName || 'Verified Customer',
            customerInitials: initials,
            customerRating: 4.9,
            isVerifiedCustomer: true,
            locationArea: item.address || 'Service Zone',
            locationDetail: item.unitFloor ? `${item.unitFloor} • Local Corridor` : 'Site Location',
            scheduleTime: item.visitDate
              ? `${item.visitDate}${item.timeSlot ? ' • ' + item.timeSlot : ''}`
              : (item.timeSlot || 'Scheduled Slot'),
            scheduleTag: item.timeSlot ? `Slot: ${item.timeSlot}` : 'Flexible',
            isUrgentTag: item.priority === 'urgent',
            chairModel: item.chairModel || 'Ergonomic Task Chair',
            chairTag: 'Class 4 OEM',
            symptom: item.issueDescription || 'Repair and maintenance inspection required',
            totalAmount: total,
            payoutRange: `₹${total}`,
            payoutNote1: item.isPaid ? 'Prepaid Online' : 'Pay After Fix (Cash/UPI)',
            payoutNote2: 'Exact Booked Price',
            isHighMargin: total >= 800,
            status,
            rawStatus: item.status,
            isPaid: Boolean(item.isPaid),
            createdAt: item.createdAt,
            isAssignedToMe: Boolean(item.isAssignedToMe),
          };
        });
        setTickets(mapped);
      } else {
        setTickets([]);
      }
    } catch (err) {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const timer = setInterval(() => {
      fetchJobs();
    }, 30000); // 30s auto-refresh for queue status & expiration
    return () => clearInterval(timer);
  }, [fetchJobs]);

  // Live real-time sync with backend & admin dispatch
  useAdminSync(navigation, fetchJobs);

  // Active job detection: technician can only work on 1 job at a time
  const activeJobTicket = useMemo(() => {
    return tickets.find(
      (t) =>
        ['assigned', 'technician_assigned', 'in_route', 'arrived', 'in_progress'].includes(
          t.rawStatus || ''
        )
    );
  }, [tickets]);

  const hasActiveJob = Boolean(activeJobTicket);

  const counts = useMemo(() => {
    return {
      new: tickets.filter((t) => t.status === 'new').length,
      pending: tickets.filter((t) => t.status === 'pending').length,
      accepted: tickets.filter((t) => t.status === 'accepted').length,
      declined: tickets.filter((t) => t.status === 'declined').length,
    };
  }, [tickets]);

  const displayedTickets = useMemo(() => {
    return tickets.filter((t) => t.status === activeTab);
  }, [tickets, activeTab]);

  const handleDecline = async (id: string, ticketNum: string) => {
    try {
      await technicianApi.updateJobStatus(id, 'declined');
    } catch (e) {
      // ignore
    }
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'declined' } : t))
    );
    showToast(`Ticket #${ticketNum} declined & returned to dispatch pool.`);
  };

  const handleAccept = async (ticket: JobRequestTicket) => {
    if (hasActiveJob) {
      showToast(
        `Active job in progress (#${activeJobTicket?.ticketNumber}). Complete it before accepting another.`
      );
      return;
    }
    try {
      const res = await technicianApi.acceptJob(ticket.id);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticket.id ? { ...t, status: 'accepted', rawStatus: 'assigned' } : t
          )
        );
        showToast(`Accepted Ticket #${ticket.ticketNumber}! Added to schedule.`);
      } else {
        showToast(res.error || 'Could not accept job. Please retry.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not accept job. Please retry.');
    }
  };

  const handleOpenDetails = (ticket: JobRequestTicket) => {
    navigation.navigate('JobRequestDetails', {
      requestId: ticket.id,
      request: ticket,
    });
  };

  const handleResetQueue = () => {
    fetchJobs();
    showToast('Refreshed job queue with live server data.');
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Toast Notification Container */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top, 16) + 50,
              transform: [{ translateY: toastAnim }],
            },
          ]}
        >
          <View style={styles.toastCard}>
            <View style={styles.toastLeft}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setToastMessage(null)}
              style={styles.toastCloseBtn}
            >
              <AppIcon name="X" size={18} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12) + 4 },
        ]}
      >
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 8 }} />
          <View>
            <Text style={{ ...Typography.labelMono, color: Colors.secondaryCobalt, fontSize: 10, letterSpacing: 0.8 }}>
              CHAIRCARE • FIELD PARTNER
            </Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Job Requests
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 6 }} />
          <TouchableOpacity
            style={styles.tuneBtn}
            onPress={() => navigation.navigate('TechnicianAvailability')}
            activeOpacity={0.7}
            accessibilityLabel="Filter availability"
          >
            <AppIcon name="SlidersHorizontal" size={18} />
          </TouchableOpacity>
          <TechnicianHeaderAvatar size={36} style={{ marginLeft: 6 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Warning Banner if technician is off duty */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <AppIcon name="Circle" size={18} />
            <View style={styles.offlineTextCol}>
              <Text style={styles.offlineTitle}>You are currently offline</Text>
              <Text style={styles.offlineDesc}>
                Turn on your dispatch availability in Settings to receive live
                roadside calls.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.goOnlineBtn}
              onPress={() => navigation.navigate('TechnicianAvailability')}
            >
              <Text style={styles.goOnlineText}>Go Online →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Operational Status Bar & Radar Indicator */}
        <View style={styles.operationalBar}>
          <View style={styles.operationalLeft}>
            {navigation.canGoBack() && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.operationalTitle}>Incoming Queue</Text>
          </View>

          {/* Live Fleet Radar Status Badge */}
          <View style={styles.radarBadge}>
            <View style={styles.radarPingingDot} />
            <Text style={styles.radarText}>
              Fleet Radar: {serviceRadius || 15}km corridor
            </Text>
          </View>
        </View>

        {/* Horizontal Filter Tabs (Pill Rail) */}
        <View style={styles.tabRail}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'new' ? styles.tabBtnActive : styles.tabBtnInactive,
            ]}
            onPress={() => setActiveTab('new')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'new' && styles.tabTextActive,
              ]}
            >
              New
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'new'
                  ? styles.tabCountPillActive
                  : styles.tabCountPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'new' && styles.tabCountTextActive,
                ]}
              >
                {counts.new}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'pending'
                ? styles.tabBtnActive
                : styles.tabBtnInactive,
            ]}
            onPress={() => setActiveTab('pending')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'pending' && styles.tabTextActive,
              ]}
            >
              Pending
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'pending'
                  ? styles.tabCountPillActive
                  : styles.tabCountPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'pending' && styles.tabCountTextActive,
                ]}
              >
                {counts.pending}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'accepted'
                ? styles.tabBtnActive
                : styles.tabBtnInactive,
            ]}
            onPress={() => setActiveTab('accepted')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'accepted' && styles.tabTextActive,
              ]}
            >
              Accepted
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'accepted'
                  ? styles.tabCountPillActive
                  : styles.tabCountPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'accepted' && styles.tabCountTextActive,
                ]}
              >
                {counts.accepted}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'declined'
                ? styles.tabBtnActive
                : styles.tabBtnInactive,
            ]}
            onPress={() => setActiveTab('declined')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'declined' && styles.tabTextActive,
              ]}
            >
              Declined
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'declined'
                  ? styles.tabCountPillActive
                  : styles.tabCountPillInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'declined' && styles.tabCountTextActive,
                ]}
              >
                {counts.declined}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Job in Progress Lock Alert Banner */}
        {hasActiveJob && activeTab === 'new' && (
          <View style={styles.activeJobLockBanner}>
            <View style={styles.activeJobLockIconPod}>
              <AppIcon name="AlertCircle" size={18} color="#D97706" />
            </View>
            <View style={styles.activeJobLockDetails}>
              <Text style={styles.activeJobLockTitle}>
                Active Job in Progress (#{activeJobTicket?.ticketNumber})
              </Text>
              <Text style={styles.activeJobLockDesc}>
                You can accept only one job at a time. Complete your current job before accepting another from this queue.
              </Text>
            </View>
          </View>
        )}

        {/* Queue Notification Dispatch Banner */}
        {activeTab === 'new' && (
          <View style={styles.dispatchBanner}>
            <View style={styles.dispatchIconPod}>
              <AppIcon name="Zap" size={18} />
            </View>
            <View style={styles.dispatchDetails}>
              <View style={styles.dispatchTopRow}>
                <Text style={styles.dispatchTitle}>BIFMA Certified Queue</Text>
                <View style={styles.slaBadge}>
                  <Text style={styles.slaText}>8m SLA</Text>
                </View>
              </View>
              <Text style={styles.dispatchDesc}>
                {counts.new} service tickets matched to your Herman Miller &
                Steelcase credentials in Sector 54 & DLF Phase 2.
              </Text>
            </View>
          </View>
        )}

        {/* Request Cards List */}
        {displayedTickets.length > 0 ? (
          displayedTickets.map((ticket) => {
            const isUrgent = ticket.priority === 'urgent';
            return (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => handleOpenDetails(ticket)}
                activeOpacity={0.9}
              >
                {/* Status Bar Accent & Top Header */}
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketPriorityGroup}>
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor: isUrgent
                            ? Colors.error
                            : ticket.priority === 'normal'
                            ? Colors.secondaryContainer
                            : Colors.tertiaryEmerald,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityLabel,
                        {
                          color: isUrgent
                            ? Colors.error
                            : ticket.priority === 'normal'
                            ? Colors.secondaryContainer
                            : Colors.tertiaryEmerald,
                        },
                      ]}
                    >
                      {ticket.priorityLabel}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {ticket.status === 'new' && ticket.createdAt && (
                      <View style={styles.expiresPill}>
                        <AppIcon name="Clock" size={11} color="#B45309" />
                        <Text style={styles.expiresPillText}>
                          {Math.max(1, Math.ceil((30 * 60 * 1000 - Math.max(0, Date.now() - new Date(ticket.createdAt).getTime())) / 60000))}m left
                        </Text>
                      </View>
                    )}
                    <View style={styles.reqNumPill}>
                      <Text style={styles.reqNumText}>#{ticket.ticketNumber}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.serviceTitle}>{ticket.serviceTitle}</Text>

                {/* Customer Profile Snippet */}
                <View style={styles.customerRow}>
                  <View style={styles.customerLeft}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.customerAvatarText}>
                        {ticket.customerInitials}
                      </Text>
                    </View>
                    <Text style={styles.customerName}>
                      {ticket.customerName}
                    </Text>
                    {ticket.isVerifiedCustomer && (
                      <AppIcon name="Check" size={18} />
                    )}
                  </View>

                  <View style={styles.ratingRow}>
                    <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {ticket.customerRating.toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Diagnostic & Location Meta Grid */}
                <View style={styles.metaCol}>
                  {/* Location */}
                  <View style={styles.metaRow}>
                    <AppIcon name="MapPin" size={18} />
                    <View style={styles.metaTextCol}>
                      <Text style={styles.locationArea}>
                        {ticket.locationArea}
                      </Text>
                      <Text style={styles.locationDetail}>
                        {ticket.locationDetail}
                      </Text>
                    </View>
                  </View>

                  {/* Schedule */}
                  <View style={styles.metaRow}>
                    <AppIcon name="Clock" size={18} />
                    <View style={styles.scheduleTextRow}>
                      <Text style={styles.scheduleTime}>
                        {ticket.scheduleTime}
                      </Text>
                      <View
                        style={[
                          styles.scheduleTagPill,
                          ticket.isUrgentTag
                            ? styles.scheduleTagUrgent
                            : styles.scheduleTagNormal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.scheduleTagText,
                            ticket.isUrgentTag && styles.scheduleTagTextUrgent,
                          ]}
                        >
                          {ticket.scheduleTag}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Chair Model & Ergonomic Symptom Box */}
                  <View style={styles.chairBox}>
                    <AppIcon name="Armchair" size={18} />
                    <View style={styles.chairDetailsCol}>
                      <View style={styles.chairHeaderRow}>
                        <Text style={styles.chairModelName}>
                          {ticket.chairModel}
                        </Text>
                        <Text style={styles.chairTag}>{ticket.chairTag}</Text>
                      </View>
                      <Text style={styles.symptomText}>{ticket.symptom}</Text>
                    </View>
                  </View>
                </View>

                {/* Payout Matrix Box */}
                <View style={styles.payoutBox}>
                  <View>
                    <Text style={styles.payoutLabel}>BOOKED SERVICE PRICE</Text>
                    <Text style={styles.payoutAmount}>₹{ticket.totalAmount || (ticket as any).total || 599}</Text>
                  </View>
                  <View style={styles.payoutRightCol}>
                    <Text style={styles.payoutNote1}>{ticket.payoutNote1}</Text>
                    <Text
                      style={[
                        styles.payoutNote2,
                        ticket.isHighMargin && styles.payoutNote2HighMargin,
                      ]}
                    >
                      {ticket.payoutNote2}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                {activeTab === 'new' && (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={() =>
                        handleDecline(ticket.id, ticket.ticketNumber)
                      }
                      activeOpacity={0.7}
                    >
                      <AppIcon name="X" size={18} />
                      <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.acceptBtn,
                        hasActiveJob && styles.acceptBtnDisabled,
                      ]}
                      onPress={() => handleAccept(ticket)}
                      activeOpacity={hasActiveJob ? 0.7 : 0.85}
                    >
                      <Text style={styles.acceptBtnText}>
                        {hasActiveJob ? 'Busy in Job' : 'View & Accept'}
                      </Text>
                      <Text style={styles.acceptArrow}>→</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeTab !== 'new' && (
                  <View style={styles.viewOnlyActionsRow}>
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => handleOpenDetails(ticket)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.viewDetailsText}>
                        View Request Details
                      </Text>
                      <Text style={styles.viewDetailsArrow}>→</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          /* Empty State Container */
          <View style={styles.emptyQueueCard}>
            <View style={styles.emptyIconPod}>
              <AppIcon name="CheckCheck" size={18} />
            </View>
            <Text style={styles.emptyTitle}>Queue Cleared!</Text>
            <Text style={styles.emptyDesc}>
              No {activeTab} service requests in your area at the moment. Keep
              your dispatch availability online to receive incoming requests.
            </Text>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetQueue}
              activeOpacity={0.8}
            >
              <AppIcon name="RefreshCw" size={18} />
              <Text style={styles.resetBtnText}>Refresh Job Queue</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  toolIconPod: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tuneBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tuneIcon: {
    fontSize: 16,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  toastCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level3,
  },
  toastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  toastCheckIcon: {
    color: Colors.tertiaryEmerald,
    fontSize: 16,
    fontWeight: '800',
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  toastCloseBtn: {
    padding: 4,
    marginLeft: 8,
  },
  toastCloseText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineIcon: {
    fontSize: 16,
  },
  offlineTextCol: {
    flex: 1,
    gap: 2,
  },
  offlineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  offlineDesc: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  goOnlineBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  goOnlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  operationalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  operationalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  operationalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  radarPingingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiaryEmerald,
  },
  radarText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  tabRail: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  tabBtnActive: {
    backgroundColor: Colors.primaryContainer,
    ...Shadows.level1,
  },
  tabBtnInactive: {
    backgroundColor: Colors.surfaceContainer,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: Colors.surfaceContainerLowest,
  },
  tabCountPillInactive: {
    backgroundColor: Colors.surfaceVariant,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
  },
  tabCountTextActive: {
    color: Colors.primaryContainer,
  },
  dispatchBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(219, 225, 255, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  dispatchIconPod: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  dispatchBoltIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  dispatchDetails: {
    flex: 1,
    gap: 2,
  },
  dispatchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dispatchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  slaBadge: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  slaText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  dispatchDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  ticketCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 10,
    ...Shadows.level1,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketPriorityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reqNumPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  reqNumText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  expiresPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  expiresPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#B45309',
    fontWeight: '700',
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedCheck: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.secondaryContainer,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 13,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  metaCol: {
    gap: 8,
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  metaIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  metaTextCol: {
    flex: 1,
  },
  locationArea: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  locationDetail: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  scheduleTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  scheduleTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scheduleTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  scheduleTagUrgent: {
    backgroundColor: Colors.errorContainer,
  },
  scheduleTagNormal: {
    backgroundColor: Colors.surfaceContainer,
  },
  scheduleTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  scheduleTagTextUrgent: {
    color: Colors.onErrorContainer,
  },
  chairBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(230, 232, 234, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginTop: 2,
  },
  chairIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  chairDetailsCol: {
    flex: 1,
    gap: 2,
  },
  chairHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chairModelName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryContainer,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  symptomText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  payoutBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(219, 225, 255, 0.3)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  payoutLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSecondaryFixedVariant,
    letterSpacing: 0.5,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  payoutRightCol: {
    alignItems: 'flex-end',
  },
  payoutNote1: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  payoutNote2: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onTertiaryContainer,
  },
  payoutNote2HighMargin: {
    color: Colors.tertiaryEmerald,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  declineBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
  },
  declineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  acceptBtn: {
    flex: 1,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  acceptBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.85,
  },
  acceptArrow: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  activeJobLockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  activeJobLockIconPod: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeJobLockDetails: {
    flex: 1,
    gap: 3,
  },
  activeJobLockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  activeJobLockDesc: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
  },
  viewOnlyActionsRow: {
    paddingTop: 4,
  },
  viewDetailsBtn: {
    width: '100%',
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  viewDetailsArrow: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyQueueCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 28,
    alignItems: 'center',
    textAlign: 'center',
    gap: 10,
    marginTop: 16,
    ...Shadows.level1,
  },
  emptyIconPod: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(219, 225, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyDoubleCheck: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.secondaryContainer,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginTop: 8,
  },
  resetIcon: {
    fontSize: 14,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});
