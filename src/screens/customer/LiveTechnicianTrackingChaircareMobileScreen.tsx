import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { CustomerHeaderAvatar } from '../../components/common/CustomerHeaderAvatar';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { customerApi } from '../../services/api';
import { useAdminSync } from '../../services/adminSync';
import { phoneCallService } from '../../services/phone/phoneCallService';

/**
 * Screen ID: C11
 * Title: Live Technician Tracking (GPS Map)
 * Reference: design-reference/customer/live_technician_tracking_chaircare_mobile
 */
export const LiveTechnicianTrackingChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();
  const requestId = route?.params?.requestId;

  const [liveRequest, setLiveRequest] = useState<any>(null);

  const fetchRequestDetails = async () => {
    try {
      if (requestId) {
        const res = await customerApi.getRequestById(requestId);
        if (res.success && res.data) {
          setLiveRequest(res.data);
          if (res.data.status === 'arrived') {
            // Auto transition to arrival screen or show prominent CTA
          }
        }
      } else {
        const res = await customerApi.getMyRequests();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.find(
            (r: any) => ['in_route', 'arrived', 'in_progress', 'assigned'].includes(r.status)
          );
          if (active) setLiveRequest(active);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchRequestDetails();
    const interval = setInterval(fetchRequestDetails, 3500);
    return () => clearInterval(interval);
  }, [requestId]);

  useAdminSync(navigation, fetchRequestDetails);

  const isArrived = liveRequest?.status === 'arrived';

  const technician = {
    name:
      liveRequest?.technician_name ||
      liveRequest?.technicianName ||
      liveRequest?.technician?.name ||
      'Certified Partner Specialist',
    rating: Number(liveRequest?.technician?.rating || 4.95),
    completedJobsCount: 140,
    phone:
      liveRequest?.technician_phone ||
      liveRequest?.technicianPhone ||
      liveRequest?.technician?.phone ||
      '+91 800 555 0199',
  };

  const serviceTitle =
    liveRequest?.service_title ||
    liveRequest?.serviceTitle ||
    liveRequest?.service?.title ||
    draft?.serviceTitle ||
    'Office Chair Calibration & Cylinder Replacement';
  const getDynamicDateFallback = () => {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `Today, ${now.getDate()} ${months[now.getMonth()]}`;
  };
  const visitDate = liveRequest?.visit_date || draft?.visitDate || getDynamicDateFallback();
  const timeSlot = liveRequest?.time_slot
    ? liveRequest.time_slot.split('–')[0].trim()
    : draft?.timeSlot
    ? draft.timeSlot.split('–')[0].trim()
    : '03:30 PM';
  const serviceLocation =
    liveRequest?.address ||
    (draft?.unitOrFloor && draft?.serviceAddress
      ? `${draft.unitOrFloor}, ${draft.serviceAddress.split(',')[0]}`
      : draft?.serviceAddress || 'Customer Service Location');

  // Pulse animation for marker
  const pingAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 0.4,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pingAnim]);

  const handleMessage = () => {
    navigation.navigate('ChatWithTechnician', {
      requestId: liveRequest?.id || liveRequest?.tracking_code || requestId,
      recipientName: technician.name,
      technicianPhone: technician.phone,
    });
  };

  const handleCall = () => {
    phoneCallService.callNumber(technician.phone, technician.name);
  };

  const handleSimulateArrival = () => {
    navigation.navigate('TechnicianArrived', {
      requestId: liveRequest?.id || liveRequest?.tracking_code || requestId,
      technicianName: technician.name,
      technicianPhone: technician.phone,
    });
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
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
          <Text style={styles.headerTitle}>Live Technician Tracking</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.activePill}>
            <View style={styles.activePulseDot} />
            <Text style={styles.activePillText}>Active</Text>
          </View>
          <CustomerHeaderAvatar
            onPress={() => navigation.navigate('CustomerProfileTab')}
            size={36}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Live Map Viewport */}
        <View style={styles.mapViewport}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.mapBackground}
            imageStyle={styles.mapImage}
          >
            {/* Soft Glass Scrim */}
            <View style={styles.mapScrim} />

            {/* Map Floating Telemetry Chip (Top Left) */}
            <View style={styles.telemetryChip}>
              <View style={styles.telemetryPingDot} />
              <Text style={styles.telemetryChipText}>
                LIVE GPS • UPDATED 5S AGO
              </Text>
            </View>

            {/* Floating Map Controls (Top Right) */}
            <View style={styles.mapControls}>
              <TouchableOpacity style={styles.controlBtn} activeOpacity={0.8}>
                <AppIcon name="MapPin" size={18} />
              </TouchableOpacity>
              <View style={styles.zoomControlGroup}>
                <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.7}>
                  <Text style={styles.zoomIcon}>+</Text>
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity style={styles.zoomBtn} activeOpacity={0.7}>
                  <Text style={styles.zoomIcon}>−</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Technician Route Marker (Origin Point) */}
            <View style={styles.techMarkerContainer}>
              <View style={styles.etaCalloutBubble}>
                <View style={styles.etaDot} />
                <Text style={styles.etaBubbleText}>
                  {technician.name} • 25 min
                </Text>
              </View>

              <View style={styles.avatarMarkerBox}>
                <Animated.View
                  style={[
                    styles.avatarRippleRing,
                    { transform: [{ scale: pingAnim }], opacity: pingAnim },
                  ]}
                />
                <View style={styles.avatarInnerBox}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    }}
                    style={styles.techAvatarMap}
                  />
                  <View style={styles.vanBadge}>
                    <AppIcon name="Car" size={20} color={Colors.primary} />
                  </View>
                </View>
              </View>
            </View>

            {/* Customer Location Pin (Destination) */}
            <View style={styles.customerPinContainer}>
              <View style={styles.customerPinOuter}>
                <View style={styles.customerPinCircle}>
                  <AppIcon name="MapPin" size={18} />
                </View>
              </View>
              <View style={styles.customerLabelPill}>
                <Text style={styles.customerLabelTitle}>Your Location</Text>
                <Text style={styles.customerLabelSub} numberOfLines={1}>
                  {draft?.unitOrFloor || 'Flat 402, Tower B'}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Bottom Floating Operations Sheet */}
        <View style={styles.operationsSheet}>
          <View style={styles.pullHandle} />

          {/* Live Status Header */}
          <View style={styles.statusHeader}>
            <View style={styles.statusTitleRow}>
              <View
                style={[
                  styles.livePulseDot,
                  isArrived && { backgroundColor: '#16A34A' },
                ]}
              />
              <Text style={styles.statusHeading}>
                {isArrived ? 'Technician has arrived!' : 'Technician on the way'}
              </Text>
            </View>
            <View
              style={[
                styles.enRouteBadge,
                isArrived && { backgroundColor: '#DCFCE7' },
              ]}
            >
              <Text
                style={[
                  styles.enRouteBadgeText,
                  isArrived && { color: '#15803D' },
                ]}
              >
                {isArrived ? 'ARRIVED' : 'EN ROUTE'}
              </Text>
            </View>
          </View>

          {/* Arrived Prompt Banner */}
          {isArrived && (
            <TouchableOpacity
              style={styles.arrivedAlertBanner}
              onPress={handleSimulateArrival}
              activeOpacity={0.85}
            >
              <View style={styles.arrivedAlertLeft}>
                <AppIcon name="MapPin" size={18} color="#FFFFFF" />
                <View>
                  <Text style={styles.arrivedAlertTitle}>Technician has arrived!</Text>
                  <Text style={styles.arrivedAlertSub}>Tap to view Arrival Details & Checklist</Text>
                </View>
              </View>
              <Text style={styles.arrivedAlertArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Technician Information Card */}
          <View style={styles.techInfoCard}>
            <View style={styles.techInfoTopRow}>
              <View style={styles.techAvatarGroup}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                  }}
                  style={styles.techCardAvatar}
                />
                <View style={styles.techNameGroup}>
                  <View style={styles.techNameVerified}>
                    <Text style={styles.techCardName}>{technician.name}</Text>
                    <AppIcon name="Check" size={18} />
                  </View>
                  <View style={styles.ratingRow}>
                    <Text style={styles.starText}>⭐ 4.9</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.completedCountText}>
                      {technician.completedJobsCount}+ fixes completed
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.arrivalStatGroup}>
                <Text style={styles.arrivalMinutes}>
                  25 <Text style={styles.arrivalUnit}>min</Text>
                </Text>
                <Text style={styles.arrivalDistance}>2.4 km away</Text>
              </View>
            </View>

            {/* Van telemetry badge */}
            <View style={styles.vanTelemetryStrip}>
              <View style={styles.vanInfoRow}>
                <AppIcon name="Car" size={16} color="#FFFFFF" />
                <Text style={styles.vanPlateText}>
                  Mobile Repair Van #DL-04-ERGO
                </Text>
              </View>
              <View style={styles.fastestRouteBadge}>
                <Text style={styles.fastestRouteText}>Fastest Route</Text>
              </View>
            </View>
          </View>

          {/* Journey Progress Tracker */}
          <View style={styles.journeyTrackerSection}>
            <View style={styles.journeyStepsRow}>
              {/* Progress Line */}
              <View style={styles.journeyLineTrack}>
                <View style={[styles.journeyLineFill, { width: '50%' }]} />
              </View>

              {/* Step 1: Dispatched */}
              <View style={styles.journeyStepItem}>
                <View style={styles.journeyStepDoneCircle}>
                  <AppIcon name="Check" size={18} />
                </View>
                <Text style={styles.stepLabel}>Dispatched</Text>
                <Text style={styles.stepTime}>03:10 PM</Text>
              </View>

              {/* Step 2: On The Way (Active) */}
              <View style={styles.journeyStepItem}>
                <View style={styles.journeyStepActiveCircle}>
                  <View style={styles.activeInnerDot} />
                </View>
                <Text style={styles.stepLabelActive}>On the way</Text>
                <Text style={styles.stepTimeActive}>In transit</Text>
              </View>

              {/* Step 3: Arrived */}
              <View style={styles.journeyStepItem}>
                <View style={styles.journeyStepPendingCircle}>
                  <View style={styles.pendingInnerDot} />
                </View>
                <Text style={styles.stepLabelPending}>Arrived</Text>
                <Text style={styles.stepTimePending}>Est. 03:45 PM</Text>
              </View>
            </View>

            {/* Traffic Route Context Message */}
            <View style={styles.trafficMessageStrip}>
              <AppIcon name="Navigation" size={16} color="#059669" />
              <Text style={styles.trafficText} numberOfLines={1}>
                Via Golf Course Rd • Moderate Traffic conditions
              </Text>
            </View>
          </View>

          {/* Communication Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <AppIcon name="Phone" size={18} />
              <Text style={styles.callButtonText}>Call Technician</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
              activeOpacity={0.8}
            >
              <AppIcon name="MessageCircle" size={18} />
              <Text style={styles.messageButtonText}>
                Message {technician.name.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Compact Appointment Specs Panel */}
          <View style={styles.appointmentSpecsCard}>
            <View style={styles.specsTopRow}>
              <View style={styles.specsIconBox}>
                <AppIcon name="Wrench" size={18} />
              </View>
              <View style={styles.specsTitleGroup}>
                <Text style={styles.specsTitleText} numberOfLines={1}>
                  {serviceTitle}
                </Text>
                <Text style={styles.specsSubText}>
                  Class-4 Gas Lift Pneumatic Service
                </Text>
              </View>
              <Text style={styles.specsChevron}>›</Text>
            </View>

            <View style={styles.specsDetailsGrid}>
              <View style={styles.specsGridItem}>
                <AppIcon name="CalendarCheck" size={18} />
                <Text style={styles.specsItemText}>
                  {visitDate} • {timeSlot}
                </Text>
              </View>
              <View style={styles.specsGridItem}>
                <AppIcon name="Building2" size={18} />
                <Text style={styles.specsItemText} numberOfLines={1}>
                  {serviceLocation}
                </Text>
              </View>
            </View>
          </View>

          {/* Simulate Arrival CTA for Development / Flow testing */}
          <PrecisionButton
            title="Simulate Technician Arrival (C12) →"
            size="md"
            variant="outline"
            onPress={handleSimulateArrival}
            style={styles.simulateArrivalBtn}
          />
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
    gap: 12,
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
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  activePillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSecondaryFixed,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 15,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapViewport: {
    width: '100%',
    height: 360,
    backgroundColor: Colors.surfaceContainer,
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    padding: 14,
  },
  mapImage: {
    resizeMode: 'cover',
  },
  mapScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(247, 249, 251, 0.25)',
  },
  telemetryChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  telemetryPingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  telemetryChipText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurface,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapControls: {
    position: 'absolute',
    top: 14,
    right: 14,
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  controlIcon: {
    fontSize: 16,
  },
  zoomControlGroup: {
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    overflow: 'hidden',
    ...Shadows.level1,
  },
  zoomBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: {
    fontSize: 16,
    color: Colors.onSurface,
    fontWeight: 'bold',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: Colors.outlineHairline,
  },
  techMarkerContainer: {
    position: 'absolute',
    left: 40,
    top: 90,
    alignItems: 'center',
  },
  etaCalloutBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 6,
    ...Shadows.level2,
  },
  etaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  etaBubbleText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  avatarMarkerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarRippleRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  avatarInnerBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 2,
    ...Shadows.level2,
  },
  techAvatarMap: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  vanBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vanIcon: {
    fontSize: 10,
  },
  customerPinContainer: {
    position: 'absolute',
    right: 30,
    bottom: 30,
    alignItems: 'center',
  },
  customerPinOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  homePinIcon: {
    fontSize: 16,
  },
  customerLabelPill: {
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.level1,
  },
  customerLabelTitle: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  customerLabelSub: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  operationsSheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 14,
    ...Shadows.level3,
  },
  pullHandle: {
    width: 44,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: Colors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryCobalt,
  },
  statusHeading: {
    ...Typography.headlineSm,
    fontSize: 17,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  enRouteBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  enRouteBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.6,
  },
  arrivedAlertBanner: {
    backgroundColor: '#059669',
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level2,
  },
  arrivedAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  arrivedAlertTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  arrivedAlertSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#D1FAE5',
    fontWeight: '500',
  },
  arrivedAlertArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  techInfoCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
  },
  techInfoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techAvatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  techCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  techNameGroup: {
    flex: 1,
    gap: 2,
  },
  techNameVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  techCardName: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  verifiedIcon: {
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  dotSeparator: {
    fontSize: 10,
    color: Colors.outline,
  },
  completedCountText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  arrivalStatGroup: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  arrivalMinutes: {
    ...Typography.headlineMd,
    fontSize: 22,
    color: Colors.secondaryCobalt,
    fontWeight: '800',
  },
  arrivalUnit: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.onSurfaceVariant,
  },
  arrivalDistance: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  vanTelemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  vanInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vanIconSmall: {
    fontSize: 13,
  },
  vanPlateText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  fastestRouteBadge: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  fastestRouteText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
  },
  journeyTrackerSection: {
    paddingHorizontal: 4,
    gap: 10,
  },
  journeyStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  journeyLineTrack: {
    position: 'absolute',
    top: 11,
    left: 24,
    right: 24,
    height: 3,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  journeyLineFill: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
  },
  journeyStepItem: {
    alignItems: 'center',
    zIndex: 10,
    gap: 2,
  },
  journeyStepDoneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDoneCheck: {
    fontSize: 11,
    color: Colors.onSecondary,
    fontWeight: '800',
  },
  stepLabel: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '600',
  },
  stepTime: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  journeyStepActiveCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryContainer,
    borderWidth: 3,
    borderColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  stepLabelActive: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  stepTimeActive: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  journeyStepPendingCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outlineVariant,
  },
  stepLabelPending: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.outline,
  },
  stepTimePending: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
  },
  trafficMessageStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  trafficIcon: {
    fontSize: 13,
  },
  trafficText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callButton: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  callButtonText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  messageButton: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  messageButtonText: {
    ...Typography.labelMd,
    fontSize: 13,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  actionIcon: {
    fontSize: 14,
  },
  appointmentSpecsCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 12,
    gap: 10,
  },
  specsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  specsIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsIcon: {
    fontSize: 16,
  },
  specsTitleGroup: {
    flex: 1,
    gap: 1,
  },
  specsTitleText: {
    ...Typography.titleLg,
    fontSize: 13,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  specsSubText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  specsChevron: {
    fontSize: 16,
    color: Colors.outline,
    fontWeight: 'bold',
  },
  specsDetailsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  specsGridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specsItemIcon: {
    fontSize: 12,
  },
  specsItemText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  simulateArrivalBtn: {
    marginTop: 4,
    marginBottom: 8,
  },
});
