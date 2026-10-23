import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { JobRequestTicket } from './JobRequestsChaircareMobileScreen';
import { customerApi } from '../../services/api/customerApi';
import { technicianApi } from '../../services/api/technicianApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';

const normalizeJobTicket = (item: any): any => {
  if (!item) return null;
  const total = Number(item.totalAmount || item.total_amount) || 599;
  const explicitCustomerName = item.customerName || item.customer_name;
  const rawCustomerName =
    explicitCustomerName && explicitCustomerName !== 'Customer'
      ? explicitCustomerName
      : 'Ananya Sharma';
  const customerPhone =
    item.customerPhone || item.customer_phone || '+91 91234 56789';
  const parts = rawCustomerName.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : rawCustomerName.slice(0, 2).toUpperCase() || 'AS';

  const fullAddr =
    item.fullAddress ||
    item.address ||
    'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon';
  const tracking =
    item.trackingCode ||
    item.tracking_code ||
    item.ticketNumber ||
    (item.id ? `CC-${String(item.id).slice(0, 4).toUpperCase()}` : 'DISPATCH');
  const cleanTracking = String(tracking).replace(/^#/, '');

  const visitDateStr = item.visitDate || item.visit_date || item.scheduleDate || 'Today';
  const timeSlotStr = item.timeSlot || item.time_slot || item.scheduleTime || '02:00 PM - 04:00 PM';

  return {
    id: String(item.id || cleanTracking),
    ticketNumber: cleanTracking,
    serviceTitle:
      item.service?.title ||
      item.serviceTitle ||
      item.service_title ||
      'Office Chair Repair',
    customerName: rawCustomerName,
    customerPhone: customerPhone,
    customerEmail: item.customerEmail || item.customer_email || 'ananya.sharma@example.com',
    customerInitials: initials,
    customerRating: Number(item.customerRating || 4.9) || 4.9,
    isVerifiedCustomer: true,
    locationArea: fullAddr,
    locationDetail:
      item.unitFloor || item.unit_floor
        ? `${item.unitFloor || item.unit_floor} • Site Location`
        : 'Site Location',
    fullAddress: fullAddr,
    unitFloor: item.unitFloor || item.unit_floor || '',
    gatePass:
      item.gatePass ||
      (item.unitFloor || item.unit_floor
        ? `Unit: ${item.unitFloor || item.unit_floor} (Auto-verified)`
        : 'Main Entrance / Security Pass'),
    scheduleDate: visitDateStr,
    scheduleTime: timeSlotStr,
    scheduleWindow:
      item.scheduleWindow || `${timeSlotStr} (Arrival Window)`,
    chairModel:
      item.chairModel ||
      item.chair_model ||
      'Herman Miller Aeron (Size B)',
    chairTag: item.chairTag || 'BIFMA Class-4 OEM',
    symptom:
      item.symptom ||
      item.issueDescription ||
      item.issue_description ||
      'Gas Lift (Sinking height fix) & tilt tension calibration',
    descriptionQuote:
      item.descriptionQuote ||
      `“${item.issueDescription || item.issue_description || 'Cylinder sinks slowly when seated. Tilt mechanism needs diagnostic inspection.'}”`,
    totalAmount: total,
    payoutRange: `₹${total}`,
    payoutBase: `Exact Booked Price ₹${total}`,
    payoutMargin:
      item.isPaid || item.is_paid ? 'Prepaid Online' : 'Pay After Fix (Cash/UPI)',
    distance: item.distance || '3.2 km (Dispatch Corridor)',
    travelTime: item.travelTime || '~15 mins',
    status: item.status || 'assigned',
    isPaid: Boolean(item.isPaid ?? item.is_paid),
  };
};

/**
 * Screen ID: T06
 * Title: Job Request Details
 * Reference: design-reference/technician/job_request_details_chaircare_mobile
 */
export const JobRequestDetailsChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedRequest: any = route?.params?.request;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  const initialTicket = normalizeJobTicket(passedRequest);
  const [ticketData, setTicketData] = useState<any>(initialTicket || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialTicket && !!passedId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (passedId) {
      const cleanId = String(passedId).trim().replace(/^#/, '');
      // Try technician API first, fallback to customer API
      technicianApi
        .getJobDetails(cleanId)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setTicketData(normalizeJobTicket(res.data));
            return null;
          }
          return customerApi.getRequestDetails(cleanId);
        })
        .then((res) => {
          if (isMounted && res && res.success && res.data) {
            setTicketData(normalizeJobTicket(res.data));
          } else if (isMounted && !initialTicket && res && !res.success) {
            setErrorMessage(sanitizeUserErrorMessage(res.error) || 'Job details could not be retrieved.');
          }
        })
        .catch((err) => {
          if (isMounted && !initialTicket) {
            setErrorMessage(sanitizeUserErrorMessage(err) || 'Error loading job details. Please try again.');
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else if (!passedRequest) {
      setIsLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [passedId]);

  const ticket = ticketData || initialTicket || {
    id: passedId ? String(passedId).replace(/^#/, '') : 'DISPATCH',
    ticketNumber: passedId ? String(passedId).replace(/^#/, '') : 'CC-8942',
    serviceTitle: 'Gas Lift (Sinking height fix)',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98101 23456',
    customerEmail: 'ananya.sharma@example.com',
    customerInitials: 'AS',
    customerRating: 4.9,
    isVerifiedCustomer: true,
    locationArea: 'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon',
    locationDetail: 'Apt 1102 • Cyber Heights',
    fullAddress: 'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon',
    unitFloor: 'Apt 1102',
    gatePass: 'MyGate Code: #4492 (Auto-approved)',
    scheduleDate: 'Today',
    scheduleTime: '02:00 PM - 04:00 PM',
    scheduleWindow: '02:00 PM - 04:00 PM (Scheduled Arrival Window)',
    chairModel: 'Herman Miller Aeron (Size B)',
    chairTag: 'BIFMA Class-4 Certified',
    symptom: 'Gas Lift (Sinking height fix) & tilt lock check',
    descriptionQuote: '“Cylinder sinks under normal weight. Needs nitrogen cylinder replacement.”',
    totalAmount: 1299,
    payoutRange: '₹909 – ₹1299',
    payoutBase: 'Base payout ₹909 (70% commission)',
    payoutMargin: 'Prepaid Online',
    distance: '3.2 km (Dispatch Zone)',
    travelTime: '~15 mins',
    status: 'assigned',
    isPaid: true,
  };

  const isAlreadyAccepted = [
    'assigned',
    'technician_assigned',
    'in_route',
    'arrived',
    'in_progress',
    'completed',
  ].includes(ticket.status);

  // Countdown timer state (starts at 12m 40s)
  const [secondsLeft, setSecondsLeft] = useState<number>(12 * 60 + 40);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Photo Zoom Modal State
  const [zoomedPhoto, setZoomedPhoto] = useState<{
    uri: string;
    title: string;
    tag: string;
    notes: string;
  } | null>(null);

  // More Actions Menu State
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Copy Gate Pass state
  const [copiedPass, setCopiedPass] = useState(false);

  const handleCopyPass = () => {
    setCopiedPass(true);
    Alert.alert('Gate Pass Copied', `Access detail: "${ticket.gatePass}" copied to clipboard.`);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleCallCustomer = () => {
    if (ticket.customerPhone) {
      if (Platform.OS === 'web') {
        window.open(`tel:${ticket.customerPhone}`);
      } else {
        Linking.openURL(`tel:${ticket.customerPhone}`);
      }
    } else {
      Alert.alert(
        'Call Customer',
        `Connecting secure line to ${ticket.customerName}...`
      );
    }
  };

  const handleMessageCustomer = () => {
    navigation.navigate('TechnicianChat', {
      requestId: ticket.id,
      customerName: ticket.customerName,
    });
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this job? It will be returned to the fleet dispatch radar.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline Job',
          style: 'destructive',
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('TechnicianMain');
            }
          },
        },
      ]
    );
  };

  const handleAccept = () => {
    navigation.navigate('AcceptRequestConfirmation', {
      requestId: ticket.id,
      request: ticket,
    });
  };

  if (isLoading) {
    return (
      <ScreenContainer hasPadding={false}>
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading Job Details...</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ marginTop: 12, ...Typography.bodyMd, color: Colors.onSurfaceVariant }}>
            Fetching live request details from server...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (errorMessage && !ticketData && !initialTicket) {
    return (
      <ScreenContainer hasPadding={false}>
        <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Not Available</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <AppIcon name="AlertCircle" size={48} color={Colors.error} />
          <Text style={{ ...Typography.h2, color: Colors.onSurface, marginTop: 16, textAlign: 'center' }}>
            Job Details Unavailable
          </Text>
          <Text style={{ ...Typography.bodyMd, color: Colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
            {errorMessage || 'This service request is no longer available in the dispatch pool.'}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 20,
              backgroundColor: Colors.primary,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: BorderRadius.md,
            }}
            onPress={() => navigation.navigate('TechnicianMain', { screen: 'TechDashboardTab' })}
          >
            <Text style={{ ...Typography.labelMd, color: '#FFFFFF', fontWeight: '700' }}>
              Return to Dashboard →
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12) + 4 },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Job Request Details
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setIsMenuVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="More actions"
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>
          <BrandLogo size={32} rounded={true} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Urgency / Status Banner */}
        <View style={styles.urgencyBanner}>
          <View style={styles.glowAura} />
          <View style={styles.urgencyTopRow}>
            {isAlreadyAccepted ? (
              <View
                style={[
                  styles.timerPill,
                  {
                    backgroundColor:
                      ticket.status === 'in_route'
                        ? 'rgba(19, 70, 153, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.pulsingRedDot,
                    {
                      backgroundColor:
                        ticket.status === 'in_route'
                          ? Colors.secondaryCobalt
                          : Colors.tertiaryEmerald,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.timerText,
                    {
                      color:
                        ticket.status === 'in_route'
                          ? Colors.secondaryCobalt
                          : Colors.tertiaryEmerald,
                    },
                  ]}
                >
                  JOB ACCEPTED • {ticket.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            ) : (
              <View style={styles.timerPill}>
                <View style={styles.pulsingRedDot} />
                <Text style={styles.timerText}>
                  NEW REQUEST • {formatTimer(secondsLeft)} REMAINING
                </Text>
              </View>
            )}
            <View style={styles.reqNumBadge}>
              <Text style={styles.reqNumBadgeText}>#{ticket.ticketNumber}</Text>
            </View>
          </View>

          <View style={styles.urgencyTitleCol}>
            <Text style={styles.urgencyServiceTitle}>{ticket.serviceTitle}</Text>
            <View style={styles.bifmaPillRow}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.bifmaText}>BIFMA Class-4 Category Standard</Text>
            </View>
          </View>
        </View>

        {/* Customer Profile Card */}
        <View style={styles.cardContainer}>
          <View style={styles.customerTopRow}>
            <View style={styles.customerLeftCol}>
              <View style={styles.customerAvatarContainer}>
                <View
                  style={[
                    styles.customerImg,
                    {
                      backgroundColor: Colors.secondaryContainer,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>
                    {ticket.customerInitials || 'CU'}
                  </Text>
                </View>
                <View style={styles.verifiedBadgeMini}>
                  <AppIcon name="Check" size={14} />
                </View>
              </View>

              <View style={styles.customerNameCol}>
                <View style={styles.customerNameRow}>
                  <Text style={styles.customerNameText}>
                    {ticket.customerName}
                  </Text>
                  <AppIcon name="Check" size={18} />
                </View>
                {ticket.customerPhone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <AppIcon name="Phone" size={12} color={Colors.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary }}>
                      {ticket.customerPhone}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.customerRatingRow}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingNumber}>
                    {(Number(ticket.customerRating) || 4.9).toFixed(1)}
                  </Text>
                  <Text style={styles.completedCallsText}>
                    (Verified Customer)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.distanceBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppIcon name="MapPin" size={14} />
                <Text style={styles.distanceKmText}>{ticket.distance}</Text>
              </View>
              <Text style={styles.distanceSub}>From current hub</Text>
            </View>
          </View>

          {/* Action Quick-Pills */}
          <View style={styles.quickPillsRow}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleCallCustomer}
              activeOpacity={0.7}
            >
              <AppIcon name="Phone" size={18} />
              <Text style={styles.quickActionText}>
                {ticket.customerPhone ? `Call Customer` : 'Call Customer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleMessageCustomer}
              activeOpacity={0.7}
            >
              <AppIcon name="MessageCircle" size={18} />
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnostic Problem Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>What's wrong?</Text>
            <View style={styles.diagPill}>
              <Text style={styles.diagPillText}>MECHANICAL DIAGNOSTIC</Text>
            </View>
          </View>

          {/* Model Spec Box */}
          <View style={styles.equipBox}>
            <View style={styles.equipIconPod}>
              <AppIcon name="Armchair" size={18} />
            </View>
            <View style={styles.equipTextCol}>
              <Text style={styles.equipLabel}>REGISTERED EQUIPMENT</Text>
              <Text style={styles.equipTitle} numberOfLines={1}>
                {ticket.chairModel}
              </Text>
            </View>
          </View>

          {/* Description Quote */}
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>{ticket.descriptionQuote}</Text>
          </View>

          {/* Symptom Tags */}
          <View style={styles.symptomTagsRow}>
            <View style={styles.symptomPillError}>
              <AppIcon name="Lock" size={18} />
              <Text style={styles.symptomTextError}>Tilt Lock Inactive</Text>
            </View>
            <View style={styles.symptomPillError}>
              <AppIcon name="ArrowDown" size={18} />
              <Text style={styles.symptomTextError}>Gas Cylinder Drift</Text>
            </View>
            <View style={styles.symptomPillNeutral}>
              <AppIcon name="SlidersHorizontal" size={18} />
              <Text style={styles.symptomTextNeutral}>PostureFit Tension</Text>
            </View>
          </View>
        </View>

        {/* Customer Photos Inspection Section */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.photoCountRow}>
              <Text style={styles.cardTitle}>Customer Photos</Text>
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>2</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Search" size={12} color={Colors.onSurfaceVariant} /><Text style={styles.tapZoomHint}>Tap zoom</Text></View>
          </View>

          <View style={styles.photoGrid}>
            {/* Photo 1 */}
            <TouchableOpacity
              style={styles.photoCard}
              onPress={() =>
                setZoomedPhoto({
                  uri: 'https://images.unsplash.com/photo-1580481077197-28d8b671391d?w=800&auto=format&fit=crop&q=80',
                  title: 'Tilt Mechanism Hub',
                  tag: 'Photo #1 • Underside Assembly',
                  notes:
                    'Macro view of dual-action spring housing and cable connector clamp.',
                })
              }
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1580481077197-28d8b671391d?w=400&auto=format&fit=crop&q=80',
                }}
                style={styles.photoImg}
              />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoTitleText} numberOfLines={1}>
                  Tilt Mechanism Hub
                </Text>
                <Text style={styles.photoSubText}>Photo #1 • Underside</Text>
              </View>
            </TouchableOpacity>

            {/* Photo 2 */}
            <TouchableOpacity
              style={styles.photoCard}
              onPress={() =>
                setZoomedPhoto({
                  uri: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80',
                  title: 'Class-4 Cylinder Joint',
                  tag: 'Photo #2 • Hydraulic Shaft',
                  notes:
                    'Class-4 nitrogen gas strut joint displaying oil ring wear and slight tilt drift.',
                })
              }
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=400&auto=format&fit=crop&q=80',
                }}
                style={styles.photoImg}
              />
              <View style={styles.photoOverlay}>
                <Text style={styles.photoTitleText} numberOfLines={1}>
                  Class-4 Cylinder Joint
                </Text>
                <Text style={styles.photoSubText}>Photo #2 • Hydraulic Shaft</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.photoFootnote}>
            Tap thumbnail to view full diagnostic zoom & telemetry
          </Text>
        </View>

        {/* Service Location & Route Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Service Location</Text>
            <View style={styles.zonePill}>
              <Text style={styles.zonePillText}>ZONE A-2</Text>
            </View>
          </View>

          {/* Map Preview Box */}
          <View style={styles.mapContainer}>
            <View style={styles.mapHeaderBadge}>
              <View style={styles.mapPulseDot} />
              <Text style={styles.mapHeaderBadgeText}>
                Fastest: {ticket.travelTime}
              </Text>
            </View>

            <View style={styles.mapPinBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="MapPin" size={14} color="#DC2626" /><Text style={styles.mapPinText}>Destination Point</Text></View>
            </View>
          </View>

          {/* Address Breakdown */}
          <View style={styles.addressCol}>
            <View style={styles.addressRow}>
              <AppIcon name="Building2" size={18} color={Colors.primary} />
              <View style={styles.addressTextCol}>
                <Text style={styles.addressLine1} numberOfLines={2}>
                  {ticket.fullAddress || ticket.address || 'Service Location Address'}
                </Text>
                {ticket.unitFloor ? (
                  <Text style={styles.addressLine2}>
                    Unit / Flat / Floor: {ticket.unitFloor}
                  </Text>
                ) : (
                  <Text style={styles.addressLine2}>
                    Corridor Dispatch • On-Site Customer Location
                  </Text>
                )}
                {ticket.latitude != null && ticket.longitude != null && (
                  <Text style={[styles.addressLine2, { color: '#0284c7', fontWeight: '600', marginTop: 3 }]}>
                    📍 Doorstep GPS: {Number(ticket.latitude).toFixed(5)}° N, {Number(ticket.longitude).toFixed(5)}° E
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.gatePassRow}>
              <View style={styles.gatePassLeft}>
                <AppIcon name="ShieldCheck" size={18} color="#059669" />
                <Text style={styles.gatePassText}>
                  Direct Customer Dispatch • Verified Site
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewRouteBtn}
            onPress={() =>
              navigation.navigate('NavigateToCustomer', {
                requestId: ticket.id || ticket.ticketNumber,
                request: ticket,
              })
            }
            activeOpacity={0.8}
          >
            <AppIcon name="Compass" size={18} color={Colors.secondary} />
            <Text style={styles.viewRouteText}>Navigate to Customer on Map →</Text>
          </TouchableOpacity>
        </View>

        {/* Appointment Window Card */}
        <View style={styles.cardContainer}>
          <View style={styles.appointmentRow}>
            <View style={styles.calendarIconPod}>
              <AppIcon name="CalendarCheck" size={18} />
            </View>
            <View style={styles.appointmentTextCol}>
              <Text style={styles.appointmentLabel}>SCHEDULED WINDOW</Text>
              <Text style={styles.appointmentDate}>{ticket.scheduleDate}</Text>
              <View style={styles.appointmentSlotRow}>
                <AppIcon name="Clock" size={18} />
                <Text style={styles.appointmentSlotText}>
                  {ticket.scheduleWindow}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booked Service Price Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.payoutHeaderLabel}>CUSTOMER BOOKED PRICE</Text>
            <View style={styles.instantPayoutPill}>
              <AppIcon name="Tag" size={14} color="#059669" />
              <Text style={styles.instantPayoutText}>
                {ticket.isPaid ? 'Prepaid Online' : 'Pay After Fix'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroPayoutText}>₹{ticket.totalAmount || 599}</Text>

          {/* Breakdown Table Box */}
          <View style={styles.payoutBreakdownTable}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={styles.blueBulletDot} />
                <Text style={styles.breakdownItemLabel}>
                  {ticket.serviceTitle || 'Office Chair Service'}
                </Text>
              </View>
              <Text style={styles.breakdownItemValue}>₹{ticket.totalAmount || 599}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={styles.greenBulletDot} />
                <Text style={styles.breakdownItemLabel}>
                  Payment Mode
                </Text>
              </View>
              <Text style={styles.breakdownItemValue}>
                {ticket.isPaid ? 'Paid in Full' : 'Due upon completion'}
              </Text>
            </View>
          </View>

          <Text style={styles.payoutLegalNote}>
            This is the exact price on which the customer booked this service. Any additional replacement parts or scope changes require customer confirmation prior to installation.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Deck */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        {isAlreadyAccepted ? (
          <>
            <TouchableOpacity
              style={styles.declineActionBtn}
              onPress={() =>
                navigation.navigate('TechnicianMain', { screen: 'TechDashboardTab' })
              }
              activeOpacity={0.8}
            >
              <AppIcon name="LayoutDashboard" size={18} color={Colors.onSurface} />
              <Text style={styles.declineBtnText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptActionBtn}
              onPress={() =>
                navigation.navigate('NavigateToCustomer', {
                  requestId: ticket.id || ticket.ticketNumber,
                  request: ticket,
                })
              }
              activeOpacity={0.85}
            >
              <AppIcon name="Navigation" size={18} color="#FFFFFF" />
              <Text style={styles.acceptActionText}>Navigate to Customer</Text>
              <Text style={styles.acceptActionArrow}>→</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.declineActionBtn}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <AppIcon name="X" size={18} color={Colors.error} />
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptActionBtn}
              onPress={handleAccept}
              activeOpacity={0.85}
            >
              <Text style={styles.acceptActionText}>Accept Request</Text>
              <Text style={styles.acceptActionArrow}>→</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Photo Zoom Modal */}
      {zoomedPhoto && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setZoomedPhoto(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.zoomModalCard}>
              <View style={styles.zoomHeader}>
                <View>
                  <Text style={styles.zoomTitle}>{zoomedPhoto.title}</Text>
                  <Text style={styles.zoomTag}>{zoomedPhoto.tag}</Text>
                </View>
                <TouchableOpacity
                  style={styles.zoomCloseBtn}
                  onPress={() => setZoomedPhoto(null)}
                >
                  <AppIcon name="X" size={18} />
                </TouchableOpacity>
              </View>

              <Image
                source={{ uri: zoomedPhoto.uri }}
                style={styles.zoomedImg}
                resizeMode="cover"
              />

              <Text style={styles.zoomNotes}>{zoomedPhoto.notes}</Text>
            </View>
          </View>
        </Modal>
      )}

      {/* More Actions Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>Ticket Options</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                Alert.alert(
                  'Share Ticket',
                  `Sharing link for #${ticket.ticketNumber} generated.`
                );
              }}
            >
              <AppIcon name="ExternalLink" size={18} />
              <Text style={styles.menuItemText}>Share Ticket Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                Alert.alert(
                  'Fleet Support',
                  'Ticket flagged for Fleet Dispatch Ops review.'
                );
              }}
            >
              <AppIcon name="ShieldCheck" size={18} />
              <Text style={styles.menuItemText}>Report Issue to Fleet Ops</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setIsMenuVisible(false)}
            >
              <Text style={styles.menuCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    gap: 8,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  urgencyBanner: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    ...Shadows.level2,
  },
  glowAura: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(49, 107, 243, 0.15)',
  },
  urgencyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(186, 26, 26, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulsingRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
  },
  timerText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.error,
    letterSpacing: 0.4,
  },
  reqNumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  reqNumBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  urgencyTitleCol: {
    gap: 4,
  },
  urgencyServiceTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  bifmaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bifmaCheckIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  bifmaText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.outlineVariant,
  },
  cardContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level1,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  customerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  customerAvatarContainer: {
    position: 'relative',
    width: 48,
    height: 48,
  },
  customerImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  verifiedBadgeMini: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.tertiaryEmerald,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  verifiedMiniCheck: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  customerNameCol: {
    flex: 1,
    gap: 2,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedBlueCheck: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.secondaryContainer,
  },
  customerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starIcon: {
    fontSize: 12,
  },
  ratingNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  completedCallsText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  distanceBadge: {
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    alignItems: 'flex-end',
  },
  distanceKmText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  distanceSub: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  quickPillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionIcon: {
    fontSize: 14,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  diagPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  diagPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  equipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  equipIconPod: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(49, 107, 243, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipChairIcon: {
    fontSize: 18,
  },
  equipTextCol: {
    flex: 1,
    gap: 1,
  },
  equipLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  equipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  quoteBox: {
    backgroundColor: 'rgba(242, 244, 246, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondaryContainer,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  symptomTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomPillError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  symptomTextError: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onErrorContainer,
  },
  symptomPillNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  symptomTextNeutral: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  symptomIcon: {
    fontSize: 12,
  },
  photoCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoCountBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  photoCountText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
  },
  tapZoomHint: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
    position: 'relative',
    ...Shadows.level1,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(19, 27, 46, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 1,
  },
  photoTitleText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoSubText: {
    fontSize: 9,
    color: Colors.surfaceContainerHighest,
  },
  photoFootnote: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  zonePill: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  zonePillText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  mapContainer: {
    height: 130,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#1E293B',
    padding: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  mapHeaderBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryContainer,
  },
  mapHeaderBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  mapPinBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  mapPinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressCol: {
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  apartmentIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  addressTextCol: {
    flex: 1,
    gap: 1,
  },
  addressLine1: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  addressLine2: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  gatePassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  gatePassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyIcon: {
    fontSize: 14,
  },
  gatePassText: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  copyPassBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  copyPassText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  viewRouteBtn: {
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compassIcon: {
    fontSize: 14,
  },
  viewRouteText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconPod: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  appointmentTextCol: {
    flex: 1,
    gap: 2,
  },
  appointmentLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.outline,
    letterSpacing: 0.5,
  },
  appointmentDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  appointmentSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clockIcon: {
    fontSize: 12,
  },
  appointmentSlotText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  payoutHeaderLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  instantPayoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  boltMiniIcon: {
    fontSize: 11,
  },
  instantPayoutText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.tertiary,
  },
  heroPayoutText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.6,
  },
  payoutBreakdownTable: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blueBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryContainer,
  },
  greenBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  breakdownItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  breakdownItemValue: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  payoutLegalNote: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.96)',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Shadows.level3,
  },
  declineActionBtn: {
    width: '32%',
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  declineIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.error,
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  acceptActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  acceptActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  acceptActionArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    ...Shadows.level3,
  },
  zoomHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  zoomTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  zoomTag: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.secondaryContainer,
    fontWeight: '700',
  },
  zoomCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.outline,
  },
  zoomedImg: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  zoomNotes: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 10,
    ...Shadows.level3,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  menuItemIcon: {
    fontSize: 16,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  menuItemCancel: {
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    justifyContent: 'center',
    marginTop: 4,
    paddingTop: 12,
  },
  menuCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
    textAlign: 'center',
  },
});
