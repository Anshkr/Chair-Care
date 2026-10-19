import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface ServiceRequestsProps {
  navigation?: any;
}

type FilterTab = 'all' | 'unassigned' | 'assigned' | 'active' | 'completed';

interface RequestCardItem {
  id: string;
  trackingCode: string;
  serviceTitle: string;
  chairModel: string;
  amount: number;
  status: 'unassigned' | 'assigned' | 'active' | 'completed';
  statusLabel: string;
  slaText?: string;
  slaType?: 'urgent' | 'standard' | 'countdown';
  customerName: string;
  customerRating?: number;
  locationText: string;
  scheduleText: string;
  scheduleSub?: string;
  techName?: string;
  techDesignation?: string;
  techRating?: number;
  techVan?: string;
  techEta?: string;
  certifiedNearbyCount?: number;
  indicatorColor: string;
  createdAt?: string;
  realTimeText?: string;
  visitDate?: string;
  timeSlot?: string;
}

const formatRequestRealTime = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return `${day} ${month}, ${hoursStr}:${minutes} ${ampm}`;
  } catch {
    return '';
  }
};

const cleanVisitDate = (visitDate?: string, createdAt?: string): string => {
  if (!visitDate) {
    if (createdAt) {
      const d = new Date(createdAt);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate()} ${months[d.getMonth()]}`;
    }
    return 'Scheduled';
  }
  const dateMatch = visitDate.match(/\b\d{1,2}\s+[A-Za-z]{3}\b/);
  if (dateMatch) return dateMatch[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    const d = new Date(visitDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  if (createdAt) {
    const d = new Date(createdAt);
    if (visitDate.toLowerCase() === 'tomorrow') {
      d.setDate(d.getDate() + 1);
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  }
  return visitDate;
};

const formatTimeSlotDisplay = (slot?: string): string => {
  if (!slot) return 'Anytime';
  const parts = slot.split(/\s*[-–]\s*/);
  if (parts.length > 0 && parts[0]) {
    return parts[0].trim();
  }
  return slot;
};

export const ServiceRequestsChaircareMobileScreen: React.FC<ServiceRequestsProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<RequestCardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [searchVisible, setSearchVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAllRequests();
      if (res.success && Array.isArray(res.data)) {
        const mapped: RequestCardItem[] = res.data.map((r: any) => {
          let status: 'unassigned' | 'assigned' | 'active' | 'completed' = 'unassigned';
          let statusLabel = 'Needs Assignment';
          let indicatorColor = Colors.error;

          if (r.status === 'assigned') {
            status = 'assigned';
            statusLabel = 'Assigned';
            indicatorColor = '#4edea3';
          } else if (
            r.status === 'in_route' ||
            r.status === 'arrived' ||
            r.status === 'in_progress'
          ) {
            status = 'active';
            statusLabel = r.status === 'in_route' ? 'En Route' : 'In Progress';
            indicatorColor = Colors.secondaryCobalt;
          } else if (r.status === 'completed') {
            status = 'completed';
            statusLabel = 'Completed';
            indicatorColor = '#005236';
          }

          const realTime = formatRequestRealTime(r.createdAt);
          const dateClean = cleanVisitDate(r.visitDate, r.createdAt);
          const slotStart = formatTimeSlotDisplay(r.timeSlot);
          const scheduleSlot = `${dateClean} • ${slotStart}`;
          const bookedSub = realTime ? `Booked: ${realTime}` : (r.timeSlot || 'Scheduled');

          return {
            id: r.id,
            trackingCode: r.trackingCode || `#CC-${r.id.substring(0, 5)}`,
            serviceTitle: r.serviceTitle || 'Chair Service',
            chairModel: r.chairModel || 'Ergonomic Desk Chair',
            amount: r.totalAmount || 0,
            status,
            statusLabel,
            slaText: realTime ? realTime : undefined,
            slaType: 'countdown' as const,
            customerName: r.customerName || 'Customer',
            customerRating: 5.0,
            locationText: r.address || 'On-site NCR',
            scheduleText: `Slot: ${scheduleSlot}`,
            scheduleSub: bookedSub,
            techName: r.technicianName,
            techDesignation: r.technicianName ? 'Field Specialist' : undefined,
            indicatorColor,
            createdAt: r.createdAt,
            realTimeText: realTime,
            visitDate: r.visitDate,
            timeSlot: r.timeSlot,
          };
        });
        setRequests(mapped);
      }
    } catch (err) {
      console.warn('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Real-time synchronization across admin tabs & windows
  useAdminSync(navigation, loadRequests);

  const allCount = requests.length;
  const unassignedCount = requests.filter((r) => r.status === 'unassigned').length;
  const assignedCount = requests.filter((r) => r.status === 'assigned').length;
  const activeCount = requests.filter((r) => r.status === 'active').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesTab =
        selectedTab === 'all' ? true : item.status === selectedTab;

      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        item.trackingCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.serviceTitle.toLowerCase().includes(q) ||
        item.locationText.toLowerCase().includes(q) ||
        (item.techName && item.techName.toLowerCase().includes(q))
      );
    });
  }, [requests, selectedTab, searchQuery]);

  const handleOpenDetails = (item: RequestCardItem) => {
    if (navigation) {
      navigation.navigate('ServiceRequestDetails', {
        requestId: item.id,
        requestItem: item,
      });
    }
  };

  const handleAssignTechnician = (item: RequestCardItem) => {
    if (navigation) {
      navigation.navigate('AssignTechnician', {
        requestId: item.id,
        requestItem: item,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('AdminMain'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.superAdminTag}>SUPER ADMIN</Text>
            <Text style={styles.headerTitle}>Service Requests</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setSearchVisible((prev) => !prev)}
            activeOpacity={0.7}
          >
            <AppIcon name="Search" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => Alert.alert('Filter', 'Advanced multi-corridor and SLA filters.')}
            activeOpacity={0.7}
          >
            <AppIcon name="Sliders" size={18} />
          </TouchableOpacity>

          <View style={styles.profileAvatarTop}>
            <AppIcon name="User" size={18} />
          </View>
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
        {/* Search Bar Input (Collapsible) */}
        {searchVisible && (
          <View style={styles.searchBarBox}>
            <AppIcon name="Search" size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ticket #, client, service, tech..."
              placeholderTextColor={Colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Live Corridor & System Telemetry Pill */}
        <View style={styles.telemetryPillCard}>
          <View style={styles.corridorInfoLeft}>
            <View style={styles.beaconPingWrapper}>
              <View style={styles.beaconPingDot} />
            </View>
            <View>
              <Text style={styles.fleetCorridorTag}>FLEET CORRIDOR</Text>
              <Text style={styles.corridorName}>Gurugram & Delhi NCR</Text>
            </View>
          </View>

          <View style={styles.slaBadgeBox}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.slaBadgeText}>99.4% SLA</Text>
          </View>
        </View>

        {/* Segmented Dynamic Filter Rail */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsScroll}
        >
          {/* All */}
          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'all' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, selectedTab === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>{allCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Unassigned */}
          <TouchableOpacity
            style={[
              styles.filterTabPill,
              styles.filterTabUnassigned,
              selectedTab === 'unassigned' && styles.filterTabUnassignedActive,
            ]}
            onPress={() => setSelectedTab('unassigned')}
            activeOpacity={0.8}
          >
            <View style={styles.errorDot} />
            <Text
              style={[
                styles.filterTabText,
                styles.filterTabUnassignedText,
                selectedTab === 'unassigned' && styles.filterTabUnassignedTextActive,
              ]}
            >
              Unassigned
            </Text>
            <View style={styles.unassignedCountPill}>
              <Text style={styles.unassignedCountText}>{unassignedCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Assigned */}
          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'assigned' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('assigned')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'assigned' && styles.filterTabTextActive,
              ]}
            >
              Assigned
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>{assignedCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Active */}
          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'active' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, selectedTab === 'active' && styles.filterTabTextActive]}>
              Active
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>{activeCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Completed */}
          <TouchableOpacity
            style={[styles.filterTabPill, selectedTab === 'completed' && styles.filterTabPillActive]}
            onPress={() => setSelectedTab('completed')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedTab === 'completed' && styles.filterTabTextActive,
              ]}
            >
              Completed
            </Text>
            <View style={styles.tabCountPill}>
              <Text style={styles.tabCountText}>{completedCount}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Critical SLA Breach Alert Banner */}
        {unassignedCount > 0 && (selectedTab === 'all' || selectedTab === 'unassigned') && (
          <View style={styles.slaAlertBanner}>
            <View style={styles.slaAlertLeft}>
              <View style={styles.alertIconBox}>
                <AppIcon name="TriangleAlert" size={18} />
              </View>
              <View style={styles.slaAlertContentCol}>
                <View style={styles.slaAlertTitleRow}>
                  <Text style={styles.slaAlertTitle}>{unassignedCount} Requests Need Assignment</Text>
                  <View style={styles.avgTimeoutBadge}>
                    <Text style={styles.avgTimeoutText}>ACTION REQUIRED</Text>
                  </View>
                </View>
                <Text style={styles.slaAlertBody}>
                  Technician allocation required to dispatch service and fulfill SLA commitments.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Operations Card Feed */}
        <View style={styles.cardsFeedCol}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
          ) : filteredRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="ClipboardList" size={24} color={Colors.outline} />
              <Text style={styles.emptyTitle}>No service requests found</Text>
              <Text style={styles.emptySub}>
                {selectedTab === 'all'
                  ? 'No service requests exist in the system yet.'
                  : `No requests with status "${selectedTab}".`}
              </Text>
            </View>
          ) : (
            filteredRequests.map((item) => (
              <View key={item.id} style={styles.requestCard}>
                {/* Left accent border */}
                <View
                  style={[
                    styles.cardAccentBar,
                    { backgroundColor: item.indicatorColor },
                  ]}
                />

                {/* Top Row Meta */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardStatusGroup}>
                    {item.status === 'unassigned' ? (
                      <View style={styles.unassignedPill}>
                        <View style={styles.pulseRedDot} />
                        <Text style={styles.unassignedPillText}>{item.statusLabel}</Text>
                      </View>
                    ) : item.status === 'active' ? (
                      <View style={styles.enRoutePill}>
                        <View style={styles.pingBlueDot} />
                        <Text style={styles.enRoutePillText}>{item.statusLabel}</Text>
                      </View>
                    ) : (
                      <View style={styles.assignedPill}>
                        <View style={styles.greenDot} />
                        <Text style={styles.assignedPillText}>{item.statusLabel}</Text>
                      </View>
                    )}
                    <Text style={styles.trackingCodeText}>
                      {item.trackingCode.startsWith('#') ? item.trackingCode : `#${item.trackingCode}`}
                    </Text>
                  </View>

                  {/* Right SLA Pill */}
                  {item.slaText && (
                    <View
                      style={[
                        styles.slaPillBox,
                        item.slaType === 'countdown' && styles.slaCountdownBox,
                        item.slaType === 'urgent' && styles.slaUrgentBox,
                      ]}
                    >
                      <AppIcon
                        name="Clock"
                        size={12}
                        color={item.slaType === 'urgent' ? '#ba1a1a' : Colors.secondaryCobalt}
                      />
                      <Text
                        style={[
                          styles.slaPillText,
                          item.slaType === 'countdown' && styles.slaCountdownText,
                          item.slaType === 'urgent' && styles.slaUrgentText,
                        ]}
                      >
                        {item.slaText}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Asset & Service Info */}
                <View style={styles.assetServiceBlock}>
                  <View style={styles.serviceHeadlineRow}>
                    <View style={styles.serviceTitleCol}>
                      <Text style={styles.cardServiceTitle}>{item.serviceTitle}</Text>
                      <Text style={styles.cardChairModel}>{item.chairModel}</Text>
                    </View>
                    <Text style={styles.cardAmount}>₹{item.amount}</Text>
                  </View>
                </View>

                {/* Specs & Telemetry Grid */}
                {item.status === 'unassigned' ? (
                  <View style={styles.unassignedGrid}>
                    <View style={styles.gridCell}>
                      <View style={styles.cellIconBox}>
                        <AppIcon name="User" size={18} />
                      </View>
                      <View style={styles.cellMetaCol}>
                        <View style={styles.customerRatingRow}>
                          <Text style={styles.cellCustomerName} numberOfLines={1}>
                            {item.customerName}
                          </Text>
                          {item.customerRating && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" /><Text style={styles.customerStarRating}>{item.customerRating}</Text></View>
                          )}
                        </View>
                        <Text style={styles.cellLocationText} numberOfLines={1}>
                          {item.locationText}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.gridCell}>
                      <View style={styles.cellIconBox}>
                        <AppIcon name="Clock" size={18} />
                      </View>
                      <View style={styles.cellMetaCol}>
                        <Text style={styles.cellScheduleText} numberOfLines={1}>
                          {item.scheduleText}
                        </Text>
                        <Text style={styles.cellScheduleSub} numberOfLines={1}>
                          {item.scheduleSub}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.assignedTelemetryBox}>
                    <View style={styles.techTelemetryRow}>
                      <View style={styles.techTelemetryLeft}>
                        <AppIcon name="Wrench" size={18} />
                        <Text style={styles.techNameBold}>{item.techName}</Text>
                        <Text style={styles.techTag}>
                          {item.techDesignation || item.techVan}
                        </Text>
                      </View>
                      {item.techRating ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" /><Text style={styles.techRatingMono}>{item.techRating}</Text></View>
                      ) : (
                        <Text style={styles.liveGpsText}>Live GPS</Text>
                      )}
                    </View>

                    <View style={styles.clientLocRow}>
                      <AppIcon name="MapPin" size={18} />
                      <Text style={styles.clientLocText} numberOfLines={1}>
                        {item.customerName} • {item.locationText}
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.schedTimeMono}>{item.scheduleText}</Text>
                        {Boolean(item.scheduleSub) && (
                          <Text style={[styles.schedTimeMono, { fontSize: 9.5, color: Colors.secondaryCobalt, marginTop: 1 }]}>
                            {item.scheduleSub}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* Resource Allocation Note if unassigned */}
                {item.certifiedNearbyCount && (
                  <View style={styles.resourceNoteRow}>
                    <AppIcon name="MapPin" size={18} />
                    <Text style={styles.resourceNoteText}>
                      {item.certifiedNearbyCount} Certified Techs in 5km radius
                    </Text>
                  </View>
                )}

                {/* Action Footer */}
                {item.status === 'unassigned' ? (
                  <View style={styles.actionFooterGrid}>
                    <TouchableOpacity
                      style={styles.viewDetailsBtn}
                      onPress={() => handleOpenDetails(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewDetailsBtnText}>View Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.assignTechBtn}
                      onPress={() => handleAssignTechnician(item)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.assignTechBtnText}>Assign Technician</Text>
                      <Text style={styles.forwardArrow}>→</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionFooterSingle}>
                    <TouchableOpacity
                      style={styles.viewRequestFullBtn}
                      onPress={() => handleOpenDetails(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.viewRequestFullBtnText}>View Request</Text>
                      <AppIcon name="ChevronRight" size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* End of Feed Subtle Indicator */}
        <View style={styles.endOfFeedContainer}>
          <AppIcon name="Globe" size={18} color={Colors.secondary} />
          <Text style={styles.endOfFeedText}>Real-time Operations Sync Active</Text>
        </View>
      </ScrollView>
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
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  superAdminTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
  },
  profileAvatarTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    gap: 12,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    ...Shadows.level1,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: Colors.outline,
    paddingHorizontal: 4,
  },
  telemetryPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.level1,
  },
  corridorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  beaconPingWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconPingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  fleetCorridorTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  corridorName: {
    ...Typography.labelMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  slaBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  verifiedIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  slaBadgeText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  filterTabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  filterTabPillActive: {
    backgroundColor: '#dae2fd',
  },
  filterTabUnassigned: {
    backgroundColor: '#ffdad6',
  },
  filterTabUnassignedActive: {
    backgroundColor: '#ba1a1a',
  },
  filterTabText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterTabTextActive: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  filterTabUnassignedText: {
    color: '#93000a',
    fontWeight: '600',
  },
  filterTabUnassignedTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  errorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  tabCountPill: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  tabCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  unassignedCountPill: {
    backgroundColor: '#ba1a1a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  unassignedCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  slaAlertBanner: {
    backgroundColor: '#ffdad6',
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  slaAlertLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  alertIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  alertIconText: {
    fontSize: 15,
  },
  slaAlertContentCol: {
    flex: 1,
  },
  slaAlertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slaAlertTitle: {
    ...Typography.headlineSm,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#93000a',
  },
  avgTimeoutBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  avgTimeoutText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  slaAlertBody: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: 'rgba(147, 0, 10, 0.9)',
    lineHeight: 16,
    marginTop: 4,
  },
  cardsFeedCol: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    ...Shadows.level1,
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  cardStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unassignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffdad6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pulseRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ba1a1a',
  },
  unassignedPillText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#93000a',
  },
  enRoutePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pingBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  enRoutePillText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  assignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#005236',
  },
  assignedPillText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#005236',
  },
  trackingCodeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  slaPillBox: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  slaCountdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  slaUrgentBox: {
    backgroundColor: '#ffdad6',
  },
  timerMiniIcon: {
    fontSize: 10,
  },
  slaPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  slaCountdownText: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    fontSize: 10.5,
  },
  slaUrgentText: {
    color: '#ba1a1a',
    fontWeight: '800',
  },
  assetServiceBlock: {
    paddingLeft: 4,
  },
  serviceHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  cardServiceTitle: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardChairModel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '500',
    marginTop: 2,
  },
  cardAmount: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  unassignedGrid: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 8,
    borderRadius: BorderRadius.lg,
    marginLeft: 4,
  },
  gridCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  cellIcon: {
    fontSize: 13,
  },
  cellMetaCol: {
    flex: 1,
  },
  customerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cellCustomerName: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  customerStarRating: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  cellLocationText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  cellScheduleText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cellScheduleSub: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  assignedTelemetryBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
    gap: 6,
    marginLeft: 4,
  },
  techTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techTelemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  techWrenchIcon: {
    fontSize: 13,
  },
  techNameBold: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  techRatingMono: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  liveGpsText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  clientLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  locPinIcon: {
    fontSize: 11,
  },
  clientLocText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  schedTimeMono: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
  },
  resourceNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 4,
  },
  radarIcon: {
    fontSize: 12,
  },
  resourceNoteText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  actionFooterGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
    paddingLeft: 4,
  },
  viewDetailsBtn: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  assignTechBtn: {
    flex: 1,
    height: 38,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.level1,
  },
  assignTechBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  forwardArrow: {
    fontSize: 13,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  actionFooterSingle: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  viewRequestFullBtn: {
    height: 38,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewRequestFullBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chevronIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptySub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  endOfFeedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    opacity: 0.7,
  },
  hubIcon: {
    fontSize: 16,
  },
  endOfFeedText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
});
