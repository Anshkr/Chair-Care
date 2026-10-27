import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface TimelineStep {
  title: string;
  time: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  badge?: string;
  tag?: string;
}

interface PricingLineItem {
  label: string;
  subLabel?: string;
  amount: number;
}

interface TicketDetailData {
  id: string;
  ticketNumber: string;
  categoryTag: string;
  statusText: string;
  statusType: 'active' | 'completed' | 'upcoming' | 'cancelled';
  etaText: string;
  timeline: TimelineStep[];
  serviceTitle: string;
  serviceCategory: string;
  assetSpec: string;
  chairModel: string;
  chairSpecs: string;
  reportedIssue: string;
  photos: {
    title: string;
    url: string;
    tag: string;
  }[];
  technician: {
    name: string;
    role: string;
    rating: number;
    reviewCount: number;
    jobCount: number;
    avatarUrl: string;
    badge: string;
    phone: string;
  };
  appointmentDate: string;
  appointmentDay: string;
  appointmentWindow: string;
  appointmentSlotNote: string;
  locationTitle: string;
  locationAddress: string;
  gateCode?: string;
  pricingItems: PricingLineItem[];
  totalAmount: number;
  isPaid: boolean;
  bottomDistanceText: string;
  bottomStatusText: string;
  primaryActionTitle: string;
}

import { customerApi } from '../../services/api/customerApi';
import { DisputeTicketModal } from '../../components/customer/DisputeTicketModal';

/**
 * Screen ID: C20
 * Title: Request Details
 * Reference: design-reference/customer/request_details_chaircare_mobile
 */
export const RequestDetailsChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const requestId = route?.params?.requestId || 'req-8492';
  const [selectedPhoto, setSelectedPhoto] = useState<{
    title: string;
    url: string;
    tag: string;
  } | null>(null);

  const [serverTicket, setServerTicket] = useState<any>(null);
  const [isDisputeModalVisible, setIsDisputeModalVisible] = useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    const fetchTicket = async () => {
      try {
        const res = await customerApi.getRequestDetails(requestId);
        if (res.success && res.data && isMounted) {
          setServerTicket(res.data);
        }
      } catch (err) {
        // silent
      }
    };
    fetchTicket();
    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const fallbackTech = {
    name: 'Certified Partner Specialist',
    rating: 4.95,
    phone: '+91 800 555 0199',
  };

  const activeServiceTitle = draft?.serviceTitle || 'Chair Service';
  const activeChairType = draft?.chairType || 'Office Ergonomic Chair';
  const activeAddress =
    draft?.unitOrFloor && draft?.serviceAddress
      ? `${draft.unitOrFloor}, ${draft.serviceAddress}`
      : draft?.serviceAddress || 'Address on file';
  const activeVisitDate = draft?.visitDate || 'Scheduled date';
  const activeTimeSlot = draft?.timeSlot || 'Scheduled slot';
  const activeTotal = draft?.estimatedTotal || 0;

  // Master ticket store
  const ticketData: TicketDetailData = useMemo(() => {
    if (serverTicket) {
      const rawStatus = (serverTicket.status || '').toLowerCase().trim();
      const isCancelled = rawStatus === 'cancelled' || rawStatus === 'canceled';
      const isCompleted = rawStatus === 'completed';
      const isAssigned =
        rawStatus === 'technician_assigned' ||
        rawStatus === 'assigned' ||
        rawStatus === 'in_progress' ||
        rawStatus === 'in_route' ||
        rawStatus === 'arrived';
      const isPending =
        rawStatus === 'finding_technician' ||
        rawStatus === 'pending' ||
        (!isCancelled && !isCompleted && !isAssigned);

      const techName = serverTicket.technicianName || (isAssigned ? fallbackTech.name : 'Finding Specialist...');
      const techPhone = serverTicket.technicianPhone || fallbackTech.phone;
      const techRating = Number(serverTicket.technicianRating || 4.9);

      let statusText = 'Finding Technician';
      let statusType: 'active' | 'completed' | 'upcoming' | 'cancelled' = 'active';
      let etaText = 'ETA: 20 MINS';
      let bottomDistanceText = 'Specialist en route';
      let bottomStatusText = 'Live tracking active';
      let primaryActionTitle = 'Track Technician';

      if (isCancelled) {
        statusText = 'Cancelled';
        statusType = 'cancelled';
        etaText = 'CANCELLED';
        bottomDistanceText = 'Request Cancelled';
        bottomStatusText = serverTicket.cancellationReason || serverTicket.cancellation_reason || 'Cancelled by customer';
        primaryActionTitle = 'Back to Requests';
      } else if (isCompleted) {
        statusText = 'Service Completed';
        statusType = 'completed';
        etaText = 'COMPLETED';
        bottomDistanceText = 'Completed & Signed Off';
        bottomStatusText = '90-day warranty active';
        primaryActionTitle = 'Download Invoice';
      } else if (isPending) {
        statusText = 'Finding Technician';
        statusType = 'active';
        etaText = 'DISPATCHING';
        bottomDistanceText = 'Awaiting Specialist';
        bottomStatusText = 'Searching certified technicians nearby';
        primaryActionTitle = 'Cancel Request';
      }

      const timeline: TimelineStep[] = isCancelled
        ? [
            {
              title: 'Request Submitted',
              time: serverTicket.createdAt
                ? new Date(serverTicket.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Confirmed',
              description: 'Service request created and queued',
              status: 'completed',
            },
            {
              title: 'Service Cancelled',
              time: 'Cancelled',
              description: serverTicket.cancellationReason || serverTicket.cancellation_reason || 'Request cancelled by user',
              status: 'completed',
            },
          ]
        : [
            {
              title: 'Request Submitted',
              time: serverTicket.createdAt
                ? new Date(serverTicket.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Confirmed',
              description: 'Service request created and queued',
              status: 'completed',
            },
            {
              title: 'Technician Assigned',
              time: isAssigned || isCompleted ? 'Assigned' : 'Pending',
              description:
                isAssigned || isCompleted
                  ? `Specialist ${techName} assigned`
                  : 'Locating nearest certified specialist',
              status: isAssigned || isCompleted ? 'completed' : 'pending',
            },
            {
              title: isCompleted ? 'Service Completed' : 'Service Visit',
              time: isCompleted
                ? 'Completed'
                : (serverTicket.timeSlot || 'Scheduled'),
              description: isCompleted
                ? 'Diagnostics and repairs signed off'
                : 'On-site ergonomic calibration',
              status: isCompleted ? 'completed' : isAssigned ? 'active' : 'pending',
              badge: isAssigned && !isCompleted ? 'LIVE' : undefined,
            },
          ];

      return {
        id: String(serverTicket.id),
        ticketNumber: serverTicket.trackingCode
          ? `#${serverTicket.trackingCode}`
          : `#REQ-${String(serverTicket.id).slice(0, 4).toUpperCase()}`,
        categoryTag: 'BIFMA-CAT: ERGO-1',
        statusText,
        statusType,
        etaText,
        timeline,
        serviceTitle: serverTicket.serviceTitle || activeServiceTitle,
        serviceCategory: 'Ergonomic Calibration',
        assetSpec: 'OEM Spec',
        chairModel: serverTicket.chairModel || activeChairType,
        chairSpecs: 'Ergonomic Gas Cylinder & Tilt Mechanism',
        reportedIssue:
          serverTicket.issueDescription ||
          'Repair and maintenance diagnostic inspection',
        photos: [],
        technician: {
          name: techName,
          role: isAssigned ? 'Fleet Specialist' : 'Pending Assignment',
          rating: techRating,
          reviewCount: 180,
          jobCount: 220,
          avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
          badge: 'BIFMA Certified',
          phone: techPhone,
        },
        appointmentDate: serverTicket.visitDate
          ? new Date(serverTicket.visitDate).toLocaleDateString()
          : activeVisitDate,
        appointmentDay: 'Scheduled',
        appointmentWindow: serverTicket.timeSlot || activeTimeSlot,
        appointmentSlotNote: 'Confirmed slot',
        locationTitle: serverTicket.unitFloor
          ? `${serverTicket.unitFloor}`
          : 'Site Address',
        locationAddress: serverTicket.address || activeAddress,
        gateCode: serverTicket.trackingCode || '8492',
        pricingItems: [
          {
            label:
              serverTicket.serviceTitle || 'Diagnostic & Repair Service',
            amount: Number(serverTicket.totalAmount) || activeTotal,
          },
        ],
        totalAmount: Number(serverTicket.totalAmount) || activeTotal,
        isPaid: Boolean(serverTicket.is_paid || serverTicket.isPaid),
        bottomDistanceText,
        bottomStatusText,
        primaryActionTitle,
      };
    }
    return {
      id: requestId,
      ticketNumber: requestId.startsWith('#') ? requestId : `#${requestId}`,
      categoryTag: 'CHAIRCARE SERVICE',
      statusText: 'Technician Assigned',
      statusType: 'active',
      etaText: 'Active Order',
      timeline: [
        {
          title: 'Request Registered',
          time: 'Active',
          description: 'Service request registered in dispatch queue',
          status: 'completed',
        },
        {
          title: 'Technician Assigned',
          time: 'Active',
          description: `${fallbackTech.name} assigned to request`,
          status: 'completed',
        },
      ],
      serviceTitle: activeServiceTitle,
      serviceCategory: 'Ergonomic Calibration',
      assetSpec: 'Office Chair',
      chairModel: activeChairType,
      chairSpecs: 'Ergonomic Task Chair',
      reportedIssue: draft?.problemDescription || 'Inspection & repair diagnostic',
      photos: [],
      technician: {
        name: fallbackTech.name,
        role: 'Certified Technician',
        rating: fallbackTech.rating,
        reviewCount: 140,
        jobCount: 180,
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        badge: 'Certified',
        phone: fallbackTech.phone,
      },
      appointmentDate: activeVisitDate,
      appointmentDay: 'Scheduled',
      appointmentWindow: activeTimeSlot,
      appointmentSlotNote: 'Confirmed slot',
      locationTitle: draft?.unitOrFloor || 'Service Address',
      locationAddress: activeAddress,
      pricingItems: [
        {
          label: activeServiceTitle,
          amount: activeTotal || 599,
        },
      ],
      totalAmount: activeTotal || 599,
      isPaid: Boolean((draft as any)?.isPaid),
      bottomDistanceText: 'Specialist dispatched',
      bottomStatusText: 'Active service ticket',
      primaryActionTitle: 'Track Technician',
    };
  }, [serverTicket, requestId, activeServiceTitle, activeChairType, activeAddress, activeVisitDate, activeTimeSlot, activeTotal, fallbackTech, draft]);

  const handleCall = (phoneNumber: string) => {
    phoneCallService.callNumber(phoneNumber, ticketData.technician.name);
  };

  const handleMessage = () => {
    navigation.navigate('ChatWithTechnician', { requestId: ticketData.id });
  };

  const handleCallDispatcher = () => {
    phoneCallService.callNumber('+918005550199', 'ChairCare Priority Dispatch');
  };

  const handleMoreOptions = () => {
    Alert.alert(
      `Ticket ${ticketData.ticketNumber}`,
      'Manage this service request:',
      [
        {
          text: 'Share Ticket Status',
          onPress: () => Alert.alert('Share', `Telemetry link for ${ticketData.ticketNumber} copied.`),
        },
        {
          text: 'Download Service PDF',
          onPress: () => Alert.alert('Export', `Service summary for ${ticketData.ticketNumber} saved.`),
        },
        ...(ticketData.statusType !== 'completed' && ticketData.statusType !== 'cancelled'
          ? [
              {
                text: 'Cancel Service Request',
                style: 'destructive' as const,
                onPress: () => handleCancelCurrentRequest(),
              },
            ]
          : []),
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const handleCancelCurrentRequest = () => {
    Alert.alert(
      'Cancel Service Request?',
      `Are you sure you want to cancel ticket ${ticketData.ticketNumber}? This will terminate technician dispatch for this request.`,
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await customerApi.cancelRequest(ticketData.id, 'Cancelled by customer');
              if (res.success) {
                setServerTicket((prev: any) => ({
                  ...prev,
                  status: 'cancelled',
                  cancellation_reason: 'Cancelled by customer',
                  cancellationReason: 'Cancelled by customer',
                }));
                Alert.alert('Request Cancelled', `Ticket ${ticketData.ticketNumber} has been cancelled.`);
              } else {
                Alert.alert('Unable to Cancel', res.error || 'Failed to cancel request.');
              }
            } catch (err: any) {
              Alert.alert('Unable to Cancel', err.message || 'Failed to cancel request.');
            }
          },
        },
      ]
    );
  };

  const handlePrimaryBottomAction = () => {
    if (ticketData.statusType === 'cancelled') {
      navigation.navigate('MyRequestsTab');
    } else if (ticketData.statusType === 'completed') {
      Alert.alert(
        'Download Invoice',
        `Official tax invoice INV-${ticketData.ticketNumber.replace('#', '')}-2026 has been saved.`,
        [{ text: 'OK' }]
      );
    } else if (ticketData.statusType === 'upcoming') {
      Alert.alert(
        'Reschedule Visit',
        `Would you like to reschedule your appointment for ${ticketData.chairModel}?`,
        [
          { text: 'Keep Current Slot', style: 'cancel' },
          {
            text: 'Reschedule',
            onPress: () => navigation.navigate('BookingStep4'),
          },
        ]
      );
    } else if (ticketData.primaryActionTitle === 'Cancel Request') {
      handleCancelCurrentRequest();
    } else {
      navigation.navigate('LiveTechnicianTracking', { requestId: ticketData.id });
    }
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <BrandLogo size={22} containerStyle={{ marginRight: 8 }} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Request Details
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleCallDispatcher}
            activeOpacity={0.7}
            accessibilityLabel="Call Dispatcher"
          >
            <AppIcon name="Phone" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleMoreOptions}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <Text style={styles.moreHeaderIcon}>⋮</Text>
          </TouchableOpacity>

          <CustomerHeaderAvatar
            onPress={() => navigation.navigate('CustomerProfileTab')}
            size={36}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Ticket ID & Status Row */}
        <View style={styles.topStatusRow}>
          <View style={styles.ticketIdPillGroup}>
            <View style={styles.ticketPill}>
              <Text style={styles.ticketPillText}>{ticketData.ticketNumber}</Text>
            </View>
            <Text style={styles.bifmaCategoryText}>{ticketData.categoryTag}</Text>
          </View>

          <View
            style={[
              styles.liveStatusBadge,
              ticketData.statusType === 'completed' && styles.completedStatusBadge,
              ticketData.statusType === 'upcoming' && styles.upcomingStatusBadge,
              ticketData.statusType === 'cancelled' && styles.cancelledStatusBadge,
            ]}
          >
            {ticketData.statusType === 'active' && (
              <View style={styles.pulseDotWrapper}>
                <View style={styles.pulseDotOuter} />
                <View style={styles.pulseDotInner} />
              </View>
            )}
            {ticketData.statusType === 'completed' && <AppIcon name="Check" size={18} />}
            {ticketData.statusType === 'upcoming' && <AppIcon name="CalendarCheck" size={18} />}
            {ticketData.statusType === 'cancelled' && <AppIcon name="XCircle" size={16} color="#DC2626" />}
            <Text
              style={[
                styles.liveStatusText,
                ticketData.statusType === 'completed' && styles.completedStatusText,
                ticketData.statusType === 'upcoming' && styles.upcomingStatusText,
                ticketData.statusType === 'cancelled' && styles.cancelledStatusText,
              ]}
            >
              {ticketData.statusText}
            </Text>
          </View>
        </View>

        {/* Card 1: Service Progress */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Service Progress</Text>
            <Text style={styles.cardEtaText}>{ticketData.etaText}</Text>
          </View>

          {/* Stepper Timeline */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineConnectingLine} />

            {ticketData.timeline.map((step, idx) => {
              const isDone = step.status === 'completed';
              const isActive = step.status === 'active';
              const isPending = step.status === 'pending';

              return (
                <View key={idx} style={[styles.timelineStepRow, isPending && styles.stepPendingOpacity]}>
                  {/* Left Step Node Marker */}
                  <View style={styles.stepNodeContainer}>
                    {isDone && (
                      <View style={styles.nodeDoneCircle}>
                        <AppIcon name="Check" size={18} />
                      </View>
                    )}
                    {isActive && (
                      <View style={styles.nodeActiveCircle}>
                        <View style={styles.nodeActiveInnerDot} />
                      </View>
                    )}
                    {isPending && (
                      <View style={styles.nodePendingCircle}>
                        <View style={styles.nodePendingInnerDot} />
                      </View>
                    )}
                  </View>

                  {/* Right Step Content */}
                  <View style={styles.stepContent}>
                    <View style={styles.stepTitleRow}>
                      <View style={styles.stepTitleGroup}>
                        <Text
                          style={[
                            styles.stepTitleText,
                            isActive && styles.stepTitleTextActive,
                            isPending && styles.stepTitleTextPending,
                          ]}
                        >
                          {step.title}
                        </Text>
                        {step.badge && (
                          <View style={styles.liveTagChip}>
                            <Text style={styles.liveTagText}>{step.badge}</Text>
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.stepTimeText,
                          isActive && styles.stepTimeTextActive,
                        ]}
                      >
                        {step.time}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.stepDescText,
                        isActive && styles.stepDescTextActive,
                        isPending && styles.stepDescTextPending,
                      ]}
                    >
                      {step.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 2: Service Information */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderWithIcon}>
              <AppIcon name="Armchair" size={18} />
              <Text style={styles.cardTitle}>Service Information</Text>
            </View>
            <View style={styles.hydroBadge}>
              <Text style={styles.hydroBadgeText}>{ticketData.serviceCategory}</Text>
            </View>
          </View>

          {/* Asset Calibrated Box */}
          <View style={styles.assetBox}>
            <View style={styles.assetBoxHeader}>
              <Text style={styles.assetCalibratedLabel}>ASSET CALIBRATED</Text>
              <View style={styles.verifiedSpecPill}>
                <Text style={styles.verifiedSpecText}>{ticketData.assetSpec}</Text>
              </View>
            </View>
            <Text style={styles.chairModelTitle}>{ticketData.chairModel}</Text>
            <Text style={styles.chairSpecsSub}>{ticketData.chairSpecs}</Text>
          </View>

          {/* Reported Mechanical Issue */}
          <View style={styles.issueSection}>
            <Text style={styles.issueLabel}>REPORTED MECHANICAL ISSUE</Text>
            <Text style={styles.issueBodyText}>{ticketData.reportedIssue}</Text>
          </View>

          {/* Diagnostic Photos */}
          {ticketData.photos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.photosLabel}>
                Diagnostic Photos ({ticketData.photos.length})
              </Text>
              <View style={styles.photosGrid}>
                {ticketData.photos.map((photo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.photoThumbCard}
                    onPress={() => setSelectedPhoto(photo)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: photo.url }} style={styles.photoImg} />
                    <View style={styles.photoZoomOverlay}>
                      <View style={styles.photoTagPill}>
                        <AppIcon name="Search" size={18} />
                        <Text style={styles.photoTagText}>{photo.tag}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Card 3: Field Specialist */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.fieldSpecialistLabel}>FIELD SPECIALIST</Text>
            <View style={styles.bifmaMasterBadge}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.bifmaMasterText}>{ticketData.technician.badge}</Text>
            </View>
          </View>

          {/* Tech Profile Row */}
          <View style={styles.techProfileRow}>
            <View style={styles.techAvatarContainer}>
              <Image
                source={{ uri: ticketData.technician.avatarUrl }}
                style={styles.techAvatarImg}
              />
              <View style={styles.techAvatarSubBadge}>
                <AppIcon name="Settings" size={18} />
              </View>
            </View>

            <View style={styles.techDetailsCol}>
              <Text style={styles.techNameText} numberOfLines={1}>
                {ticketData.technician.name}
              </Text>
              <Text style={styles.techRoleText}>{ticketData.technician.role}</Text>

              <View style={styles.techMetaChipsRow}>
                <View style={styles.techRatingChip}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingValueText}>
                    {ticketData.technician.rating.toFixed(1)}
                  </Text>
                </View>
                <Text style={styles.techReviewCountText}>
                  {ticketData.technician.reviewCount}+ reviews
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.techJobCountText}>
                  {ticketData.technician.jobCount}+ jobs
                </Text>
              </View>
            </View>
          </View>

          {/* Call, Message & Dispute Actions */}
          <View style={styles.techActionButtonsRow}>
            <TouchableOpacity
              style={styles.techCallBtn}
              onPress={() => handleCall(ticketData.technician.phone)}
              activeOpacity={0.8}
            >
              <AppIcon name="Phone" size={16} />
              <Text style={styles.techBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.techMessageBtn}
              onPress={handleMessage}
              activeOpacity={0.8}
            >
              <AppIcon name="MessageCircle" size={16} />
              <Text style={styles.techBtnText}>Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.techDisputeBtn}
              onPress={() => setIsDisputeModalVisible(true)}
              activeOpacity={0.8}
            >
              <AppIcon name="AlertTriangle" size={16} color="#ba1a1a" />
              <Text style={styles.techDisputeBtnText}>Report Issue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 4: Appointment Details */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderWithIcon}>
              <AppIcon name="CalendarCheck" size={18} />
              <Text style={styles.cardTitle}>Appointment Details</Text>
            </View>
          </View>

          {/* Date & Window Grid */}
          <View style={styles.appointmentGrid}>
            <View style={styles.appointmentGridBox}>
              <Text style={styles.appointmentGridLabel}>DATE</Text>
              <Text style={styles.appointmentGridValue}>{ticketData.appointmentDate}</Text>
              <Text style={styles.appointmentGridSub}>{ticketData.appointmentDay}</Text>
            </View>

            <View style={styles.appointmentGridBox}>
              <Text style={styles.appointmentGridLabel}>WINDOW</Text>
              <Text style={styles.appointmentGridValue} numberOfLines={1}>
                {ticketData.appointmentWindow}
              </Text>
              <Text style={styles.appointmentGridSlotNote}>
                {ticketData.appointmentSlotNote}
              </Text>
            </View>
          </View>

          {/* Map Preview & Location Box */}
          <View style={styles.locationWrapper}>
            {/* Visual Telemetry Map Box */}
            <View style={styles.telemetryMapVisual}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80',
                }}
                style={styles.mapBackgroundImg}
              />
              <View style={styles.mapDarkScrim} />

              {/* Floating Live Telemetry Chip */}
              <View style={styles.mapTelemetryChip}>
                <View style={styles.mapPulseDot} />
                <Text style={styles.mapTelemetryText}>VAN TELEMETRY SYNCED</Text>
              </View>

              {/* Centered Map Pin */}
              <View style={styles.mapPinCenterWrapper}>
                <View style={styles.mapPingCircle} />
                <View style={styles.mapPinCircle}>
                  <AppIcon name="MapPin" size={18} />
                </View>
              </View>
            </View>

            {/* Address Details */}
            <View style={styles.locationDetailsBox}>
              <AppIcon name="Home" size={18} />
              <View style={styles.locationTextCol}>
                <Text style={styles.locationPrimaryTitle}>
                  {ticketData.locationTitle}
                </Text>
                <Text style={styles.locationSubAddress}>
                  {ticketData.locationAddress}
                </Text>

                {ticketData.gateCode && (
                  <View style={styles.gateCodePill}>
                    <AppIcon name="Key" size={18} />
                    <Text style={styles.gateCodeText}>
                      Gate code:{' '}
                      <Text style={styles.gateCodeBold}>{ticketData.gateCode}</Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Card 5: Pricing & Estimate */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderWithIcon}>
              <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
              <Text style={styles.cardTitle}>Pricing & Estimate</Text>
            </View>
            <View style={styles.rateCardPill}>
              <Text style={styles.rateCardText}>BIFMA Rate Card</Text>
            </View>
          </View>

          {/* Line Items */}
          <View style={styles.pricingItemsList}>
            {ticketData.pricingItems.map((item, idx) => (
              <View key={idx} style={styles.pricingItemRow}>
                <View style={styles.pricingItemLabelGroup}>
                  <Text style={styles.pricingItemLabel}>{item.label}</Text>
                  {item.subLabel && (
                    <Text style={styles.pricingItemSub}>{item.subLabel}</Text>
                  )}
                </View>
                <Text style={styles.pricingItemAmount}>₹{item.amount}</Text>
              </View>
            ))}

            <View style={styles.pricingDivider} />

            {/* Total Row */}
            <View style={styles.pricingTotalRow}>
              <View style={styles.pricingTotalLabelCol}>
                <Text style={styles.pricingTotalTitle}>
                  {ticketData.isPaid ? 'Total Paid (Online)' : 'Estimated Cost'}
                </Text>
                <Text style={[styles.pricingTaxesNote, ticketData.isPaid && { color: '#15803D', fontWeight: '700' }]}>
                  {ticketData.isPaid ? 'Paid via Razorpay • ₹0 Due' : 'Taxes included • Due upon completion'}
                </Text>
              </View>
              <Text style={[styles.pricingTotalAmount, ticketData.isPaid && { color: '#15803D' }]}>
                ₹{ticketData.totalAmount}
              </Text>
            </View>
          </View>

          {/* Guarantee Box & Payment Instructions */}
          <View style={[styles.guaranteeBox, ticketData.isPaid && { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
            <AppIcon name="ShieldCheck" size={18} color={ticketData.isPaid ? '#15803D' : undefined} />
            <Text style={[styles.guaranteeText, ticketData.isPaid && { color: '#166534' }]}>
              {ticketData.isPaid ? (
                <>
                  <Text style={{ fontWeight: '800', color: '#15803D' }}>PAID IN FULL ONLINE.</Text> Technician has been notified that payment is completed. Zero cash collection required. 90-day comprehensive warranty active.
                </>
              ) : (
                <>
                  <Text style={styles.guaranteeStrong}>Pay on Delivery.</Text> Please pay ₹{ticketData.totalAmount} to your technician in cash or UPI upon completing the service. 90-day warranty included.
                </>
              )}
            </Text>
          </View>
        </View>

        {/* Card 6: Official Support & Dispute Claims */}
        <View style={styles.disputeCardContainer}>
          <View style={styles.disputeCardHeader}>
            <View style={styles.disputeIconCircle}>
              <AppIcon name="ShieldAlert" size={20} color="#ba1a1a" />
            </View>
            <View style={styles.disputeHeaderTextCol}>
              <Text style={styles.disputeCardTitle}>Need Help or Have a Dispute?</Text>
              <Text style={styles.disputeCardSub}>
                If you are unsatisfied with technician workmanship, punctuality, or billing, submit a dispute ticket to pause escrow and request arbitration.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.raiseDisputeActionBtn}
            onPress={() => setIsDisputeModalVisible(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="AlertTriangle" size={16} color="#ba1a1a" />
            <Text style={styles.raiseDisputeBtnText}>Raise a Dispute Ticket</Text>
            <AppIcon name="ChevronRight" size={16} color="#ba1a1a" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Panel */}
      <View style={[styles.bottomPanel, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <View style={styles.bottomTelemetryRow}>
          <View style={styles.bottomTelemetryLeft}>
            <View style={styles.bottomPulseDot} />
            <Text style={styles.bottomDistanceText}>
              {ticketData.bottomDistanceText}
            </Text>
          </View>
          <Text style={styles.bottomStatusText}>
            {ticketData.bottomStatusText}
          </Text>
        </View>

        {ticketData.statusType === 'completed' ? (
          <View style={styles.completedBottomButtonsRow}>
            <TouchableOpacity
              style={styles.rateTechnicianBottomBtn}
              onPress={() =>
                navigation.navigate('RateExperience', {
                  requestId: ticketData.id,
                  technicianName: ticketData.technician.name,
                  technicianRating: ticketData.technician.rating,
                  technicianAvatar: ticketData.technician.avatarUrl,
                  serviceTitle: ticketData.serviceTitle,
                  visitDate: ticketData.appointmentDate,
                })
              }
              activeOpacity={0.88}
            >
              <AppIcon name="Star" size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.rateTechnicianBottomBtnText}>Rate Experience</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.invoiceBottomBtn}
              onPress={handlePrimaryBottomAction}
              activeOpacity={0.88}
            >
              <AppIcon name="FileText" size={15} color={Colors.primary} />
              <Text style={styles.invoiceBottomBtnText}>Invoice</Text>
            </TouchableOpacity>
          </View>
        ) : ticketData.statusType === 'cancelled' ? (
          <TouchableOpacity
            style={[styles.primaryBottomBtn, { backgroundColor: Colors.surfaceContainerHigh }]}
            onPress={handlePrimaryBottomAction}
            activeOpacity={0.88}
          >
            <Text style={[styles.primaryBottomBtnText, { color: Colors.onSurface }]}>
              {ticketData.primaryActionTitle}
            </Text>
            <AppIcon name="ArrowRight" size={16} color={Colors.onSurface} />
          </TouchableOpacity>
        ) : ticketData.primaryActionTitle === 'Cancel Request' ? (
          <TouchableOpacity
            style={[styles.primaryBottomBtn, { backgroundColor: '#DC2626' }]}
            onPress={handlePrimaryBottomAction}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBottomBtnText}>
              Cancel Service Request
            </Text>
            <AppIcon name="XCircle" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryBottomBtn}
            onPress={handlePrimaryBottomAction}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBottomBtnText}>
              {ticketData.primaryActionTitle}
            </Text>
            <Text style={styles.primaryBottomBtnArrow}>↗</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal Photo Viewer */}
      {selectedPhoto && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalCloseBackdrop}
              onPress={() => setSelectedPhoto(null)}
              activeOpacity={1}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedPhoto.title}</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <AppIcon name="X" size={18} />
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.modalPhotoImg}
                resizeMode="cover"
              />

              <View style={styles.modalFooter}>
                <View style={styles.modalTagBadge}>
                  <Text style={styles.modalTagText}>{selectedPhoto.tag}</Text>
                </View>
                <Text style={styles.modalTelemetrySub}>
                  Calibrated mechanical visual inspection (1080p)
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Customer Dispute / Issue Intake Modal */}
      <DisputeTicketModal
        visible={isDisputeModalVisible}
        onClose={() => setIsDisputeModalVisible(false)}
        requestId={ticketData.id}
        trackingCode={ticketData.ticketNumber}
        chairModel={ticketData.chairModel}
        technicianName={ticketData.technician.name}
        technicianAvatar={ticketData.technician.avatarUrl}
        onSuccess={() => {
          Alert.alert(
            'Dispute Logged',
            'Your claim has been submitted to the administration desk. You can monitor updates directly.'
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 58,
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
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerBrandIcon: {
    fontSize: 18,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callHeaderIcon: {
    fontSize: 15,
  },
  moreHeaderIcon: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  profileAvatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  profileAvatarText: {
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  ticketIdPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  ticketPillText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  bifmaCategoryText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '600',
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
    ...Shadows.level1,
  },
  completedStatusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  upcomingStatusBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  cancelledStatusBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pulseDotWrapper: {
    width: 8,
    height: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotOuter: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
    opacity: 0.5,
  },
  pulseDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  badgeCheck: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  badgeCalendar: {
    fontSize: 10,
  },
  liveStatusText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  completedStatusText: {
    color: Colors.tertiaryEmerald,
  },
  upcomingStatusText: {
    color: Colors.onSurfaceVariant,
  },
  cancelledStatusText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  cardContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardEtaText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.5,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 22,
    gap: 14,
    marginTop: 4,
  },
  timelineConnectingLine: {
    position: 'absolute',
    left: 7,
    top: 6,
    bottom: 8,
    width: 2,
    backgroundColor: Colors.surfaceVariant,
  },
  timelineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  stepPendingOpacity: {
    opacity: 0.5,
  },
  stepNodeContainer: {
    position: 'absolute',
    left: -22,
    top: 2,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDoneCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCheckIcon: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.tertiaryContainer,
  },
  nodeActiveCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActiveInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  nodePendingCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodePendingInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outline,
  },
  stepContent: {
    flex: 1,
    gap: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 6,
  },
  stepTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  stepTitleText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  stepTitleTextActive: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  stepTitleTextPending: {
    color: Colors.outline,
  },
  liveTagChip: {
    backgroundColor: Colors.secondaryFixedDim,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  liveTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  stepTimeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  stepTimeTextActive: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  stepDescText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  stepDescTextActive: {
    color: Colors.onSurface,
  },
  stepDescTextPending: {
    color: Colors.outline,
  },
  chairSectionIcon: {
    fontSize: 16,
  },
  hydroBadge: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  hydroBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  assetBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 3,
  },
  assetBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  assetCalibratedLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  verifiedSpecPill: {
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedSpecText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.tertiaryEmerald,
  },
  chairModelTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairSpecsSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  issueSection: {
    gap: 4,
  },
  issueLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  issueBodyText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 18,
  },
  photosSection: {
    gap: 6,
  },
  photosLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoThumbCard: {
    flex: 1,
    height: 85,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainer,
    position: 'relative',
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoZoomOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
    ...Shadows.level1,
  },
  photoZoomIcon: {
    fontSize: 10,
  },
  photoTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  fieldSpecialistLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  bifmaMasterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(111, 251, 190, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  bifmaMasterCheck: {
    fontSize: 10,
    color: Colors.tertiaryEmerald,
    fontWeight: '800',
  },
  bifmaMasterText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
  },
  techProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  techAvatarContainer: {
    position: 'relative',
  },
  techAvatarImg: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  techAvatarSubBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  techBadgeEngineeringIcon: {
    fontSize: 11,
  },
  techDetailsCol: {
    flex: 1,
    gap: 2,
  },
  techNameText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techRoleText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  techMetaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  techRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  ratingStar: {
    fontSize: 11,
  },
  ratingValueText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  techReviewCountText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
  },
  metaDot: {
    color: Colors.outlineVariant,
    fontSize: 10,
  },
  techJobCountText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  techActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  techCallBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  techMessageBtn: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  techBtnIcon: {
    fontSize: 14,
  },
  techBtnText: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  calendarSectionIcon: {
    fontSize: 16,
  },
  appointmentGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  appointmentGridBox: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 2,
  },
  appointmentGridLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  appointmentGridValue: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  appointmentGridSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  appointmentGridSlotNote: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  locationWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow,
  },
  telemetryMapVisual: {
    height: 110,
    position: 'relative',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  mapBackgroundImg: {
    width: '100%',
    height: '100%',
  },
  mapDarkScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.15)',
  },
  mapTelemetryChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 5,
    ...Shadows.level1,
  },
  mapPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  mapTelemetryText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  mapPinCenterWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPingCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 81, 213, 0.25)',
  },
  mapPinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  mapPinDropIcon: {
    fontSize: 12,
  },
  locationDetailsBox: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  homePinIcon: {
    fontSize: 16,
    marginTop: 2,
  },
  locationTextCol: {
    flex: 1,
    gap: 2,
  },
  locationPrimaryTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  locationSubAddress: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  gateCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  gateKeyIcon: {
    fontSize: 11,
  },
  gateCodeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  gateCodeBold: {
    fontWeight: '800',
    color: Colors.onSurface,
  },
  receiptSectionIcon: {
    fontSize: 16,
  },
  rateCardPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rateCardText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.outline,
    textTransform: 'uppercase',
  },
  pricingItemsList: {
    gap: 8,
  },
  pricingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingItemLabelGroup: {
    flex: 1,
    gap: 1,
  },
  pricingItemLabel: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  pricingItemSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  pricingItemAmount: {
    ...Typography.labelMono,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pricingDivider: {
    height: 1,
    backgroundColor: Colors.outlineHairline,
    marginVertical: 4,
  },
  pricingTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  pricingTotalLabelCol: {
    gap: 1,
  },
  pricingTotalTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pricingTaxesNote: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  pricingTotalAmount: {
    ...Typography.headlineMd,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 8,
  },
  guaranteeShieldIcon: {
    fontSize: 15,
    marginTop: 1,
  },
  guaranteeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
    flex: 1,
  },
  guaranteeStrong: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    ...Shadows.level3,
  },
  bottomTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  bottomTelemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bottomPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  bottomDistanceText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  bottomStatusText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  primaryBottomBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryBottomBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  primaryBottomBtnArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCloseBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    gap: 12,
    paddingBottom: 16,
    ...Shadows.level3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  modalTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  modalPhotoImg: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  modalTagBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  modalTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  modalTelemetrySub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  techDisputeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  techDisputeBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  disputeCardContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 12,
    ...Shadows.level1,
  },
  disputeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  disputeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeHeaderTextCol: {
    flex: 1,
    gap: 4,
  },
  disputeCardTitle: {
    ...Typography.titleMd,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  disputeCardSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  raiseDisputeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#fda4af',
  },
  raiseDisputeBtnText: {
    ...Typography.titleSmall,
    fontSize: 13,
    fontWeight: '700',
    color: '#ba1a1a',
    flex: 1,
    marginLeft: 8,
  },
  completedBottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  rateTechnicianBottomBtn: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  rateTechnicianBottomBtnText: {
    ...Typography.titleMd,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  invoiceBottomBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  invoiceBottomBtnText: {
    ...Typography.titleMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});
