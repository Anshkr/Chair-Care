import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { ThemeSwitchButton } from '../../components/common/ThemeSwitchButton';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { customerApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { downloadInvoice } from '../../services/invoiceService';
import { DisputeTicketModal } from '../../components/customer/DisputeTicketModal';

type FilterType = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled';

interface RequestTicket {
  id: string;
  ticketNumber: string;
  serviceTitle: string;
  status: 'completed' | 'active' | 'upcoming' | 'cancelled';
  statusLabel: string;
  chairModel: string;
  issueDescription: string;
  chairIcon: string;
  technician?: {
    name: string;
    role: string;
    rating: number;
    avatarUrl: string;
  };
  dateInfo: string;
  locationInfo?: string;
  amount: number;
  isPaid: boolean;
  isEstimated?: boolean;
  timeSlot?: string;
  enRouteStatus?: string;
  fullDescription?: string;
  cancellationReason?: string;
}

/**
 * Screen ID: C19
 * Title: My Requests (Active & Historic Bookings)
 * Reference: design-reference/customer/my_requests_chaircare_mobile
 */
export const MyRequestsChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, currentUser } = useAuth();

  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ticketsData, setTicketsData] = useState<RequestTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null);
  const [disputeTargetTicket, setDisputeTargetTicket] = useState<RequestTicket | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) {
      setTicketsData([]);
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const res = await customerApi.getMyRequests();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const mapped: RequestTicket[] = res.data.map((item: any) => {
            const rawStatus = (item.status || '').toLowerCase().trim();
            let itemStatus: 'completed' | 'active' | 'upcoming' | 'cancelled' = 'active';
            let label = 'Tech Assigned';

            if (rawStatus === 'cancelled' || rawStatus === 'canceled') {
              itemStatus = 'cancelled';
              label = 'Cancelled';
            } else if (rawStatus === 'completed') {
              itemStatus = 'completed';
              label = 'Completed';
            } else if (rawStatus === 'draft' || rawStatus === 'scheduled') {
              itemStatus = 'upcoming';
              label = 'Scheduled';
            } else if (rawStatus === 'in_route') {
              label = 'En Route';
            } else if (rawStatus === 'arrived') {
              label = 'Arrived';
            } else if (rawStatus === 'in_progress') {
              label = 'In Progress';
            } else if (rawStatus === 'finding_technician' || rawStatus === 'pending') {
              label = 'Finding Tech';
            }

            const rawAmount = item.totalAmount ?? item.total_amount ?? item.amount;
            const parsedAmount = rawAmount !== undefined && rawAmount !== null ? Number(rawAmount) : 0;
            const finalAmount = parsedAmount > 0 ? parsedAmount : (itemStatus === 'completed' ? 299 : 0);

            const trackingCode = item.trackingCode || item.tracking_code;
            const isPaid = item.isPaid !== undefined 
              ? Boolean(item.isPaid) 
              : Boolean(item.is_paid);

            const chairModel = item.chairModel || item.chair_model || 'Office Chair';
            const issueDescription = item.issueDescription || item.issue_description || 'General inspection & repair';
            const serviceTitle = item.serviceTitle || item.service_title || (item.service && item.service.title) || 'Inspection (Health audit)';
            const visitDate = item.visitDate || item.visit_date || 'Today';
            const timeSlot = item.timeSlot || item.time_slot || 'Flexible';
            
            const techName = item.technicianName || item.technician_name || (item.technician && item.technician.name);
            const techAvatar = item.technicianAvatar || item.technician_avatar || (item.technician && item.technician.avatarUrl) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
            const techRating = Number(item.technicianRating ?? item.technician_rating ?? (item.technician && item.technician.rating) ?? 4.9);
            const techRole = item.technicianRole || item.technician_role || 'Certified Technician';

            return {
              id: item.id || trackingCode || 'CC-3350',
              ticketNumber: trackingCode ? `#${trackingCode}` : `#CC-${item.id?.substring(0, 4) || '8492'}`,
              serviceTitle,
              status: itemStatus,
              statusLabel: label,
              chairModel,
              issueDescription,
              chairIcon: 'Armchair',
              technician: techName ? {
                name: techName,
                role: techRole,
                rating: techRating,
                avatarUrl: techAvatar,
              } : undefined,
              dateInfo: `${visitDate} • ${timeSlot}`,
              locationInfo: item.address,
              enRouteStatus: item.status === 'in_route' ? 'En Route' : label,
              amount: finalAmount,
              isPaid,
              isEstimated: !isPaid && itemStatus !== 'completed' && itemStatus !== 'cancelled',
              cancellationReason: item.cancellationReason || item.cancellation_reason,
            };
          });
          setTicketsData(mapped);
        }
      } catch {
        // Handled silently with empty list
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return ticketsData.filter((item) => {
      const matchesFilter =
        currentFilter === 'all' || item.status === currentFilter;
      const searchTerms = `${item.ticketNumber} ${item.serviceTitle} ${item.chairModel} ${item.issueDescription} ${item.technician?.name || ''}`.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        searchTerms.includes(searchQuery.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [ticketsData, currentFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      all: ticketsData.length,
      upcoming: ticketsData.filter((t) => t.status === 'upcoming').length,
      active: ticketsData.filter((t) => t.status === 'active').length,
      completed: ticketsData.filter((t) => t.status === 'completed').length,
      cancelled: ticketsData.filter((t) => t.status === 'cancelled').length,
    }),
    [ticketsData]
  );

  const handleCancelRequest = (ticket: RequestTicket) => {
    const doCancel = async () => {
      try {
        setLoading(true);
        const res = await customerApi.cancelRequest(ticket.id, 'Cancelled by customer');
        if (res.success) {
          setTicketsData((prev) =>
            prev.map((t) =>
              t.id === ticket.id
                ? {
                    ...t,
                    status: 'cancelled',
                    statusLabel: 'Cancelled',
                    cancellationReason: 'Cancelled by customer',
                  }
                : t
            )
          );
          Alert.alert(
            'Request Cancelled',
            `Ticket ${ticket.ticketNumber} has been successfully cancelled.`
          );
        } else {
          Alert.alert('Unable to Cancel', res.error || 'Failed to cancel request.');
        }
      } catch (err: any) {
        Alert.alert('Unable to Cancel', err.message || 'Failed to cancel request.');
      } finally {
        setLoading(false);
      }
    };

    Alert.alert(
      'Cancel Service Request?',
      `Are you sure you want to cancel ticket ${ticket.ticketNumber}? This will terminate technician dispatch.`,
      [
        { text: 'Keep Request', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
      ]
    );
  };

  const handleDownloadInvoice = async (ticket: RequestTicket) => {
    try {
      setDownloadingTicketId(ticket.id);
      const res = await downloadInvoice({
        ticketNumber: ticket.ticketNumber,
        serviceTitle: ticket.serviceTitle,
        chairModel: ticket.chairModel,
        issueDescription: ticket.issueDescription,
        amount: ticket.amount,
        isPaid: ticket.isPaid,
        dateInfo: ticket.dateInfo,
        locationInfo: ticket.locationInfo,
        customerName: currentUser?.name || 'Verified Customer',
        customerPhone: currentUser?.phone || '+91 98765 43210',
        customerEmail: currentUser?.email,
        technicianName: ticket.technician?.name,
        technicianRole: ticket.technician?.role,
      });

      if (res.success) {
        Alert.alert(
          'Invoice Ready',
          `Tax invoice ${res.invoiceNumber} (₹${res.amount}) has been downloaded and prepared for printing/saving as PDF.`,
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      console.error('Download invoice failed:', e);
      Alert.alert('Download Error', 'Could not generate invoice. Please try again.');
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const handleTrackTech = (ticketId: string) => {
    navigation.navigate('LiveTechnicianTracking', { requestId: ticketId });
  };

  const handleViewDetails = (ticketId: string) => {
    navigation.navigate('RequestDetails', { requestId: ticketId });
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Fixed Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <BrandLogo size={36} containerStyle={{ marginRight: 10 }} />
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandSubtitle}>ChairCare Portal</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              My Requests
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <ThemeSwitchButton variant="header" style={{ marginRight: 8 }} />
          <CustomerHeaderAvatar onPress={() => navigation.navigate('CustomerProfileTab')} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-header & Action Bar */}
        <View style={styles.subHeaderRow}>
          <View style={styles.subHeaderLeft}>
            <Text style={styles.subHeaderTitle}>Service Tickets</Text>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillText}>
                {ticketsData.length} Total
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <AppIcon name="Search" size={18} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search service, ticket #, or chair..."
            placeholderTextColor={Colors.outline}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearSearchBtn}
            >
              <AppIcon name="X" size={18} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pill Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'all' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                currentFilter === 'all' && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  currentFilter === 'all' && styles.filterCountTextActive,
                ]}
              >
                {counts.all}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'upcoming' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('upcoming')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'upcoming' && styles.filterPillTextActive,
              ]}
            >
              Upcoming
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                currentFilter === 'upcoming' && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  currentFilter === 'upcoming' && styles.filterCountTextActive,
                ]}
              >
                {counts.upcoming}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'active' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('active')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'active' && styles.filterPillTextActive,
              ]}
            >
              Active
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                currentFilter === 'active' && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  currentFilter === 'active' && styles.filterCountTextActive,
                ]}
              >
                {counts.active}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'completed' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('completed')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'completed' && styles.filterPillTextActive,
              ]}
            >
              Completed
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                currentFilter === 'completed' && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  currentFilter === 'completed' && styles.filterCountTextActive,
                ]}
              >
                {counts.completed}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              currentFilter === 'cancelled' && styles.filterPillActive,
            ]}
            onPress={() => setCurrentFilter('cancelled')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                currentFilter === 'cancelled' && styles.filterPillTextActive,
              ]}
            >
              Cancelled
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                currentFilter === 'cancelled' && styles.filterCountBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  currentFilter === 'cancelled' && styles.filterCountTextActive,
                ]}
              >
                {counts.cancelled}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <View style={[styles.emptyStateContainer, { paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.emptyStateSub, { marginTop: 12 }]}>Loading your service requests...</Text>
          </View>
        ) : filteredTickets.length > 0 ? (
          <View style={styles.ticketsList}>
            {filteredTickets.map((ticket) => {
              const isCompleted = ticket.status === 'completed';
              const isActive = ticket.status === 'active';
              const isUpcoming = ticket.status === 'upcoming';
              const isCancelled = ticket.status === 'cancelled';
              const isPending = ticket.statusLabel === 'Finding Tech' || !ticket.technician;

              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => handleViewDetails(ticket.id)}
                  activeOpacity={0.92}
                >
                  {/* Card Header: Ticket ID & Status */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleColumn}>
                      <Text style={styles.ticketNumText}>
                        Ticket {ticket.ticketNumber}
                      </Text>
                      <Text style={styles.cardMainTitle} numberOfLines={1}>
                        {ticket.serviceTitle}
                      </Text>
                    </View>

                    {isCompleted && (
                      <View style={styles.completedBadge}>
                        <AppIcon name="CheckCircle2" size={13} color="#059669" />
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    )}

                    {isCancelled && (
                      <View style={styles.cancelledBadge}>
                        <AppIcon name="XCircle" size={13} color="#DC2626" />
                        <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                      </View>
                    )}

                    {isActive && (
                      <View style={styles.activeBadge}>
                        <AppIcon name="Clock" size={13} color={Colors.secondaryCobalt} />
                        <Text style={styles.activeBadgeText}>
                          {ticket.statusLabel}
                        </Text>
                      </View>
                    )}

                    {isUpcoming && (
                      <View style={styles.upcomingBadge}>
                        <AppIcon name="CalendarCheck" size={13} color="#D97706" />
                        <Text style={styles.upcomingBadgeText}>Scheduled</Text>
                      </View>
                    )}
                  </View>

                  {/* Chair Spec Banner */}
                  <View style={styles.chairSpecBanner}>
                    <View style={styles.chairIconBox}>
                      <AppIcon name="Armchair" size={18} color={Colors.secondaryCobalt} />
                    </View>
                    <View style={styles.chairSpecTextGroup}>
                      <Text style={styles.chairModelName} numberOfLines={1}>
                        {ticket.chairModel}
                      </Text>
                      <Text style={styles.issueDescText} numberOfLines={1}>
                        {ticket.issueDescription}
                      </Text>
                    </View>
                  </View>

                  {/* Upcoming Description if present */}
                  {isUpcoming && ticket.fullDescription && (
                    <Text style={styles.fullDescText}>
                      {ticket.fullDescription}
                    </Text>
                  )}

                  {/* Technician Row if present */}
                  {ticket.technician && (
                    <View style={styles.techRow}>
                      <View style={styles.techLeft}>
                        <Image
                          source={{ uri: ticket.technician.avatarUrl }}
                          style={styles.techThumb}
                          resizeMode="cover"
                        />
                        <View style={styles.techMetaGroup}>
                          <View style={styles.techNameRow}>
                            <Text style={styles.techName}>
                              {ticket.technician.name}
                            </Text>
                            <AppIcon name="BadgeCheck" size={14} color="#059669" />
                            <View style={styles.techRatingChip}>
                              <AppIcon name="Star" size={11} color="#F59E0B" fill="#F59E0B" />
                              <Text style={styles.ratingValueText}>
                                {ticket.technician.rating.toFixed(2)}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.techRole}>
                            {ticket.technician.role}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Timing & Address Strip for Cancelled */}
                  {isCancelled && (
                    <View style={styles.cancelledTimingBox}>
                      <View style={styles.cancelledTimingHeader}>
                        <View style={styles.cancelledTimingLeft}>
                          <AppIcon name="Clock" size={15} color="#DC2626" />
                          <Text style={styles.cancelledTimingText}>
                            {ticket.dateInfo}
                          </Text>
                        </View>
                        <Text style={styles.cancelledTag}>
                          {ticket.cancellationReason || 'CANCELLED'}
                        </Text>
                      </View>
                      {ticket.locationInfo && (
                        <View style={styles.activeLocationRow}>
                          <AppIcon name="MapPin" size={14} color={Colors.outline} />
                          <Text
                            style={styles.activeLocationText}
                            numberOfLines={1}
                          >
                            {ticket.locationInfo}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Timing & Address Pill Strip for Active */}
                  {isActive && (
                    <View style={styles.activeTimingBox}>
                      <View style={styles.activeTimingHeader}>
                        <View style={styles.activeTimingLeft}>
                          <AppIcon name="Clock" size={15} color={Colors.secondaryCobalt} />
                          <Text style={styles.activeTimingText}>
                            {ticket.dateInfo}
                          </Text>
                        </View>
                        <Text style={styles.enRouteTag}>
                          {ticket.enRouteStatus}
                        </Text>
                      </View>
                      {ticket.locationInfo && (
                        <View style={styles.activeLocationRow}>
                          <AppIcon name="MapPin" size={14} color={Colors.outline} />
                          <Text
                            style={styles.activeLocationText}
                            numberOfLines={1}
                          >
                            {ticket.locationInfo}
                          </Text>
                        </View>
                      )}

                      {/* Payment Status Bar for Active Ticket */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <AppIcon
                            name={ticket.isPaid ? 'ShieldCheck' : 'Banknote'}
                            size={14}
                            color={ticket.isPaid ? '#15803D' : '#B45309'}
                          />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: ticket.isPaid ? '#15803D' : '#B45309' }}>
                            {ticket.isPaid ? 'Paid Online • Do not pay tech' : 'Pay on Delivery • Due on fix'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: ticket.isPaid ? '#15803D' : Colors.onSurface }}>
                          ₹{ticket.amount}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Upcoming Timing Box */}
                  {isUpcoming && (
                    <View style={styles.upcomingTimingBox}>
                      <View style={styles.upcomingTimingLeft}>
                        <AppIcon name="CalendarCheck" size={15} color={Colors.outline} />
                        <Text style={styles.upcomingTimingText}>
                          {ticket.dateInfo}
                        </Text>
                      </View>
                      <Text style={styles.upcomingAmountText}>
                        ₹{ticket.amount}{' '}
                        <Text style={styles.estPill}>(Est.)</Text>
                      </Text>
                    </View>
                  )}

                  {/* Date, Location & Billing Meta for Completed */}
                  {isCompleted && (
                    <View style={styles.completedMetaRow}>
                      <View style={styles.completedMetaLeft}>
                        <AppIcon name="CalendarCheck" size={15} color={Colors.outline} />
                        <Text
                          style={styles.completedDateText}
                          numberOfLines={1}
                        >
                          {ticket.dateInfo}
                        </Text>
                      </View>
                      <View style={[styles.paidAmountBadge, ticket.isPaid && { backgroundColor: '#DCFCE7' }]}>
                        <Text style={[styles.paidAmountText, ticket.isPaid && { color: '#15803D' }]}>
                          ₹{ticket.amount}{' '}
                          <Text style={[styles.paidLabel, ticket.isPaid && { color: '#15803D', fontWeight: '800' }]}>
                            ({ticket.isPaid ? 'Paid Online' : 'Pay on Delivery'})
                          </Text>
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Action Row */}
                  <View style={styles.actionRow}>
                    {isCompleted && (
                      <View style={styles.completedActionRow}>
                        <TouchableOpacity
                          style={styles.rateSpecialistBtn}
                          onPress={() =>
                            navigation.navigate('RateExperience', {
                              requestId: ticket.id,
                              technicianName: ticket.technician?.name,
                              technicianRating: ticket.technician?.rating,
                              technicianAvatar: ticket.technician?.avatarUrl,
                              serviceTitle: ticket.serviceTitle,
                              visitDate: ticket.dateInfo,
                            })
                          }
                          activeOpacity={0.8}
                        >
                          <AppIcon name="Star" size={13} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={styles.rateSpecialistBtnText}>Rate Tech</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.downloadInvoiceBtn}
                          onPress={() => handleDownloadInvoice(ticket)}
                          disabled={downloadingTicketId === ticket.id}
                          activeOpacity={0.75}
                        >
                          {downloadingTicketId === ticket.id ? (
                            <ActivityIndicator size="small" color={Colors.secondaryCobalt} />
                          ) : (
                            <>
                              <AppIcon name="FileText" size={13} color={Colors.secondaryCobalt} />
                              <Text style={styles.downloadInvoiceText}>Invoice</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.disputeReportBtn}
                          onPress={() => setDisputeTargetTicket(ticket)}
                          activeOpacity={0.75}
                        >
                          <AppIcon name="AlertTriangle" size={13} color="#ba1a1a" />
                          <Text style={styles.disputeReportText}>Report</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.viewDetailsBtn}
                          onPress={() => handleViewDetails(ticket.id)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.viewDetailsBtnText}>Details</Text>
                          <AppIcon name="ChevronRight" size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}

                    {isCancelled && (
                      <View style={styles.activeActionFullRow}>
                        <View style={styles.activeEstimatedCol}>
                          <Text style={[styles.estimatedSmallLabel, { color: '#DC2626' }]}>
                            STATUS
                          </Text>
                          <Text style={[styles.estimatedBigAmount, { color: '#DC2626', fontSize: 13 }]}>
                            Terminated
                          </Text>
                        </View>
                        <View style={styles.activeButtonsGroup}>
                          <TouchableOpacity
                            style={styles.disputeReportBtn}
                            onPress={() => setDisputeTargetTicket(ticket)}
                            activeOpacity={0.75}
                          >
                            <AppIcon name="AlertTriangle" size={13} color="#ba1a1a" />
                            <Text style={styles.disputeReportText}>Report</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={() => handleViewDetails(ticket.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.detailsBtnText}>Details</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.rebookBtn}
                            onPress={() => navigation.navigate('CustomerMain', { screen: 'ServicesAvailableTab' })}
                            activeOpacity={0.85}
                          >
                            <AppIcon name="RotateCcw" size={13} color={Colors.primary} />
                            <Text style={styles.rebookBtnText}>Book Again</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {isActive && (
                      <View style={styles.activeActionFullRow}>
                        <View style={styles.activeEstimatedCol}>
                          <Text style={styles.estimatedSmallLabel}>
                            ESTIMATED
                          </Text>
                          <Text style={styles.estimatedBigAmount}>
                            ₹{ticket.amount}
                          </Text>
                        </View>
                        <View style={styles.activeButtonsGroup}>
                          <TouchableOpacity
                            style={styles.disputeReportBtn}
                            onPress={() => setDisputeTargetTicket(ticket)}
                            activeOpacity={0.75}
                          >
                            <AppIcon name="AlertTriangle" size={13} color="#ba1a1a" />
                            <Text style={styles.disputeReportText}>Report</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.detailsBtn}
                            onPress={() => handleViewDetails(ticket.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.detailsBtnText}>Details</Text>
                          </TouchableOpacity>

                          {/* Only show Track Tech when technician is assigned and NOT pending */}
                          {!isPending ? (
                            <TouchableOpacity
                              style={styles.trackTechBtn}
                              onPress={() => handleTrackTech(ticket.id)}
                              activeOpacity={0.85}
                            >
                              <AppIcon name="MapPin" size={14} color="#FFFFFF" />
                              <Text style={styles.trackTechBtnText}>
                                Track Tech
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.cancelTicketBtn}
                              onPress={() => handleCancelRequest(ticket)}
                              activeOpacity={0.85}
                            >
                              <AppIcon name="XCircle" size={13} color="#DC2626" />
                              <Text style={styles.cancelTicketBtnText}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}

                    {isUpcoming && (
                      <View style={styles.upcomingActionRow}>
                        <TouchableOpacity
                          style={styles.disputeReportBtn}
                          onPress={() => setDisputeTargetTicket(ticket)}
                          activeOpacity={0.75}
                        >
                          <AppIcon name="AlertTriangle" size={13} color="#ba1a1a" />
                          <Text style={styles.disputeReportText}>Report Issue</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.manageBookingBtn}
                          onPress={() => handleViewDetails(ticket.id)}
                          activeOpacity={0.85}
                        >
                          <AppIcon name="CalendarCheck" size={14} />
                          <Text style={styles.manageBookingBtnText}>
                            Manage Booking
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : ticketsData.length === 0 ? (
          /* Honest Empty State for No Requests */
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="ClipboardList" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>
              {!isAuthenticated
                ? 'Sign in to access your requests'
                : "You haven't made any service requests yet."}
            </Text>
            <Text style={styles.emptyStateSub}>
              {!isAuthenticated
                ? 'Track your ongoing chair repairs, technician arrival, and service history.'
                : 'Book expert repairs, gas lift replacements, or chair maintenance in a few taps.'}
            </Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() =>
                !isAuthenticated
                  ? navigation.navigate('AuthenticationGate', { returnTo: 'MyRequestsTab' })
                  : navigation.navigate('ServicesAvailableTab')
              }
              activeOpacity={0.85}
            >
              <Text style={styles.clearFilterBtnText}>
                {!isAuthenticated ? 'Sign In to ChairCare' : 'Browse Services'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Filter/Search Empty State */
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon name="Search" size={18} />
            </View>
            <Text style={styles.emptyStateTitle}>No matching tickets</Text>
            <Text style={styles.emptyStateSub}>
              Try searching another term or clear active filters.
            </Text>
            <TouchableOpacity
              style={styles.clearFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setCurrentFilter('all');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFilterBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Counter Footer */}
        <View style={styles.footerCounterRow}>
          <Text style={styles.footerCounterText}>
            Showing {filteredTickets.length} of {ticketsData.length} service requests
          </Text>
        </View>
      </ScrollView>

      {/* Customer Dispute / Issue Intake Modal */}
      <DisputeTicketModal
        visible={!!disputeTargetTicket}
        onClose={() => setDisputeTargetTicket(null)}
        requestId={disputeTargetTicket?.id || ''}
        trackingCode={disputeTargetTicket?.ticketNumber}
        chairModel={disputeTargetTicket?.chairModel}
        technicianName={disputeTargetTicket?.technician?.name}
        technicianAvatar={disputeTargetTicket?.technician?.avatarUrl}
        onSuccess={() => {
          Alert.alert(
            'Dispute Submitted',
            'Your grievance ticket has been registered and escalated to the Admin panel.'
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 64,
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
    flex: 1,
  },
  headerTitleGroup: {
    gap: 1,
  },
  brandSubtitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLow,
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profileAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    ...Typography.labelMono,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subHeaderTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  totalPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  totalPillText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  filterIcon: {
    fontSize: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: Colors.outline,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurface,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 12,
    color: Colors.outline,
    fontWeight: '700',
  },
  filterPillsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  filterPillActive: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
    ...Shadows.level1,
  },
  filterPillText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterCountBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  filterCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterCountText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  filterCountTextActive: {
    color: '#FFFFFF',
  },
  ticketsList: {
    gap: 12,
  },
  ticketCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xxl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleColumn: {
    flex: 1,
    gap: 2,
  },
  ticketNumText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.outline,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardMainTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  completedCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  completedBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  activeWrench: {
    fontSize: 10,
  },
  activeBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  upcomingCalendar: {
    fontSize: 10,
  },
  upcomingBadgeText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  chairSpecBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  chairIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairBannerIcon: {
    fontSize: 16,
  },
  chairSpecTextGroup: {
    flex: 1,
    gap: 2,
  },
  chairModelName: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  issueDescText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  fullDescText: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  techLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  techThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1.5,
    borderColor: Colors.outlineHairline,
  },
  techMetaGroup: {
    gap: 2,
    flex: 1,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techName: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  starMini: {
    fontSize: 9,
  },
  ratingValueText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  techRole: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  cancelledTimingBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  cancelledTimingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cancelledTimingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelledTimingText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  cancelledTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  activeTimingBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 4,
  },
  activeTimingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTimingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeClockIcon: {
    fontSize: 13,
  },
  activeTimingText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  enRouteTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    textTransform: 'uppercase',
  },
  activeLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  homePinIcon: {
    fontSize: 12,
  },
  activeLocationText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  upcomingTimingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  upcomingTimingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTimingText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  upcomingAmountText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  estPill: {
    fontWeight: '400',
    fontSize: 10,
    color: Colors.outline,
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  completedMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 13,
  },
  completedDateText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  paidAmountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  paidAmountText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  paidLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  completedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
    flexWrap: 'wrap',
  },
  rateSpecialistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#d97706',
    ...Shadows.level1,
  },
  rateSpecialistBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  disputeReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  disputeReportText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: '#ba1a1a',
    fontWeight: '700',
  },
  downloadInvoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  invoiceDocIcon: {
    fontSize: 13,
  },
  downloadInvoiceText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryCobalt,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.xl,
    ...Shadows.level1,
  },
  viewDetailsBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevronIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  activeActionFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  activeEstimatedCol: {
    gap: 1,
  },
  estimatedSmallLabel: {
    ...Typography.labelMono,
    fontSize: 8,
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  estimatedBigAmount: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  activeButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsBtn: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  trackTechBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  trackNearIcon: {
    fontSize: 12,
  },
  trackTechBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  cancelTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelTicketBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  rebookBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upcomingActionRow: {
    width: '100%',
    alignItems: 'flex-end',
  },
  manageBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  manageCalendarIcon: {
    fontSize: 12,
  },
  manageBookingBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyStateTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyStateSub: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  clearFilterBtn: {
    marginTop: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  clearFilterBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  footerCounterRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerCounterText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
});
