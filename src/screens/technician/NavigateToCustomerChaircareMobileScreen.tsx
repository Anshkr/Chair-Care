import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';

interface NavigateToCustomerProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const NavigateToCustomerChaircareMobileScreen: React.FC<
  NavigateToCustomerProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest, setAcceptedRequest } = useTechnician();

  const passedRequest = route?.params?.request || acceptedRequest;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Selected request data
  const ticket = passedRequest || {
    id: passedId || '',
    ticketNumber: passedId || 'DISPATCH',
    serviceTitle: 'Office Chair Repair',
    categoryTag: 'Precision Field Service',
    customerName: 'Customer',
    customerPhone: '+91 91234 56789',
    customerRating: 5.0,
    isVerifiedCustomer: true,
    addressLine1: 'Customer Service Address',
    addressLine2: 'Assigned Site Location',
    gatePass: 'Check building security reception',
    chairModel: 'Ergonomic Task Chair',
    chairIssue: 'Repair inspection and component servicing',
    technicianNote: 'Standard diagnostic protocol',
    distance: 'Direct route',
    etaMinutes: '15',
    routeSummary: 'Optimal navigation route',
    status: 'assigned',
  };

  const destinationAddress =
    ticket.fullAddress ||
    ticket.address ||
    (ticket.addressLine1
      ? `${ticket.addressLine1}${ticket.addressLine2 ? ', ' + ticket.addressLine2 : ''}`
      : '') ||
    ticket.locationArea ||
    'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon';

  const destinationShort =
    ticket.unitFloor ||
    (ticket.customerName && ticket.customerName !== 'Customer'
      ? `${ticket.customerName}'s Location`
      : '') ||
    'Cyber Heights, Sector 62';

  const displayAddressLine1 =
    ticket.fullAddress ||
    ticket.address ||
    ticket.addressLine1 ||
    'Tower 4, Apt 1102, Cyber Heights, Sector 62, Gurgaon';

  const displayAddressLine2 =
    ticket.unitFloor
      ? `Unit / Floor: ${ticket.unitFloor} • Landmark: Cyber City Corridor`
      : ticket.addressLine2 || 'Sector 62, Gurugram, Haryana 122002';

  // State
  const [isNavigating, setIsNavigating] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(true);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0.4)).current;
  const pinBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for technician location marker
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(radarAnim, {
            toValue: 0.05,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(radarAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );

    // Destination Pin Bounce
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pinBounceAnim, {
          toValue: -6,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pinBounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    pulseLoop.start();
    bounceLoop.start();

    return () => {
      pulseLoop.stop();
      bounceLoop.stop();
    };
  }, [pulseAnim, radarAnim, pinBounceAnim]);

  const openExternalMap = async (address: string) => {
    const hasCoords = typeof ticket?.latitude === 'number' && typeof ticket?.longitude === 'number';
    const dest = hasCoords
      ? `${ticket.latitude},${ticket.longitude}`
      : encodeURIComponent(address.trim());
    const googleMapsDirUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    const appleMapsUrl = hasCoords
      ? `maps://?daddr=${ticket.latitude},${ticket.longitude}`
      : `maps://?daddr=${encodeURIComponent(address.trim())}`;
    const androidGeoUrl = hasCoords
      ? `geo:${ticket.latitude},${ticket.longitude}?q=${ticket.latitude},${ticket.longitude}(${encodeURIComponent(ticket.customerName || 'Customer Doorstep')})`
      : `geo:0,0?q=${encodeURIComponent(address.trim())}`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(googleMapsDirUrl, '_blank');
      }
      return;
    }

    if (Platform.OS === 'ios') {
      try {
        const canOpen = await Linking.canOpenURL(appleMapsUrl);
        if (canOpen) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      } catch {}
    } else if (Platform.OS === 'android') {
      try {
        const canOpen = await Linking.canOpenURL(androidGeoUrl);
        if (canOpen) {
          await Linking.openURL(androidGeoUrl);
          return;
        }
      } catch {}
    }

    // Default fallback to Google Maps URL
    try {
      await Linking.openURL(googleMapsDirUrl);
    } catch {
      Alert.alert('Map Navigation', `Opening navigation to:\n${address}`);
    }
  };

  const handleToggleNavigation = async () => {
    setIsNavigating(true);

    if (ticket.id) {
      try {
        await technicianApi.updateJobStatus(ticket.id, 'in_route', 'Technician is en route.');
        setAcceptedRequest({ ...ticket, status: 'in_route' });
      } catch {
        // continue
      }
    }

    // Open default device map application or Google Maps with customer location
    await openExternalMap(destinationAddress);
  };

  const handleMarkArrived = async () => {
    if (ticket.id) {
      try {
        await technicianApi.updateJobStatus(ticket.id, 'arrived', 'Technician has arrived at customer location.');
      } catch {
        // continue
      }
    }
    const updated = { ...ticket, status: 'arrived' };
    setAcceptedRequest(updated);
    navigation.navigate('ArrivedAtCustomer', {
      requestId: ticket.id || ticket.ticketNumber,
      request: updated,
    });
  };

  const handleCallCustomer = () => {
    const phone = ticket.customerPhone || '+91 91234 56789';
    if (Platform.OS === 'web') {
      window.open(`tel:${phone}`);
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenChat = () => {
    setHasUnreadMessage(false);
    navigation.navigate('TechnicianChat', {
      customerName: ticket.customerName,
      requestId: ticket.id || ticket.ticketNumber,
    });
  };

  const handleRecenter = () => {
    Alert.alert('Map Re-centered', 'Centered on your current vehicle GPS position.');
  };

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Top Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12) + 6 },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('TechnicianMain');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrowIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Navigate To Customer
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.activePill}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.activePillText}>ACTIVE</Text>
          </View>
          <TechnicianHeaderAvatar size={34} style={{ marginLeft: 6 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Simulated Navigation Map Section */}
        <View style={styles.mapSectionContainer}>
          {/* Simulated Map Canvas Background */}
          <View style={styles.mapCanvas}>
            {/* Grid Arterial Road Lines */}
            <View style={styles.arterialRoad1} />
            <View style={styles.arterialRoad2} />
            <View style={styles.arterialRoadDiagonal} />

            {/* Simulated Route Polyline */}
            <View style={styles.routeTrackUnderlay} />
            <View style={styles.routeTrackMain} />
            <View style={styles.routeTrackCongestion} />

            {/* Turn-by-Turn Telemetry HUD Overlay */}
            <View style={styles.hudOverlay}>
              <View style={styles.hudCard}>
                <View style={styles.hudLeft}>
                  <View style={styles.turnIconPod}>
                    <Text style={styles.turnArrowIcon}>↱</Text>
                  </View>
                  <View style={styles.hudTextCol}>
                    <View style={styles.hudDistanceRow}>
                      <Text style={styles.hudDistanceText}>400m</Text>
                      <View style={styles.laneBadge}>
                        <Text style={styles.laneBadgeText}>Lane 2</Text>
                      </View>
                    </View>
                    <Text style={styles.hudInstructionText} numberOfLines={1}>
                      Turn right onto Golf Course Rd
                    </Text>
                  </View>
                </View>

                {/* Speed Limit Indicator */}
                <View style={styles.speedLimitCircle}>
                  <Text style={styles.speedLabel}>SPEED</Text>
                  <Text style={styles.speedValue}>50</Text>
                </View>
              </View>
            </View>

            {/* Destination Pin Anchor (Customer) */}
            <Animated.View
              style={[
                styles.destinationPinAnchor,
                { transform: [{ translateY: pinBounceAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.destinationPillTag}
                onPress={() => openExternalMap(destinationAddress)}
                activeOpacity={0.8}
              >
                <AppIcon name="Building2" size={18} />
                <Text style={styles.destinationPillText}>{destinationShort}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.destinationMarkerCircle}
                onPress={() => openExternalMap(destinationAddress)}
                activeOpacity={0.8}
              >
                <AppIcon name="MapPin" size={18} />
              </TouchableOpacity>
            </Animated.View>

            {/* Technician GPS Marker with Animated Radar Pulse */}
            <View style={styles.techGpsAnchor}>
              <Animated.View
                style={[
                  styles.radarPulseOuter,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: radarAnim,
                  },
                ]}
              />
              <View style={styles.radarPulseInner} />
              <View style={styles.techMarkerCircle}>
                <AppIcon name="Navigation" size={18} />
              </View>
            </View>

            {/* Floating Quick Map Utilities (Right Rail) */}
            <View style={styles.rightMapRail}>
              <TouchableOpacity
                style={styles.mapUtilBtn}
                onPress={() => openExternalMap(destinationAddress)}
                activeOpacity={0.8}
                accessibilityLabel="Open in Google Maps"
              >
                <AppIcon name="Compass" size={18} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapUtilBtn}
                onPress={handleRecenter}
                activeOpacity={0.8}
                accessibilityLabel="Re-center map"
              >
                <AppIcon name="Target" size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mapUtilBtn}
                onPress={() => setIsVoiceActive(!isVoiceActive)}
                activeOpacity={0.8}
                accessibilityLabel="Toggle voice guidance"
              >
                <Text style={styles.utilIcon}>
                  {isVoiceActive ? 'VOICE ON' : 'VOICE OFF'}
                </Text>
              </TouchableOpacity>

              <View style={styles.zoomControlsPod}>
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.zoomBtnText}>+</Text>
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity
                  style={styles.zoomBtn}
                  onPress={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  activeOpacity={0.7}
                >
                  <Text style={styles.zoomBtnText}>−</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Traffic Chip Floating Badge */}
            <View style={styles.trafficChip}>
              <View style={styles.pulsingGreenDot} />
              <Text style={styles.trafficChipText}>TRAFFIC OPTIMAL</Text>
            </View>
          </View>
        </View>

        {/* Bottom Floating ETA & Dispatch Sheet */}
        <View style={styles.bottomDispatchSheet}>
          {/* Draggable Pill Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.dragPill} />
          </View>

          {/* Customer & Ticket Context Row */}
          <View style={styles.customerContextRow}>
            <View style={styles.customerLeftGroup}>
              <View style={styles.avatarWrapper}>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {ticket.customerName
                      ? ticket.customerName
                          .split(' ')
                          .map((p: string) => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'AS'}
                  </Text>
                </View>
                <View style={styles.avatarCheckBadge}>
                  <AppIcon name="Check" size={14} />
                </View>
              </View>

              <View style={styles.customerNameBlock}>
                <View style={styles.customerNameRow}>
                  <Text style={styles.customerName}>
                    {ticket.customerName || 'Ananya Sharma'}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {ticket.customerRating ? Number(ticket.customerRating).toFixed(1) : '4.9'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ticketServiceMono}>
                  {ticket.serviceTitle || ticket.categoryTag || 'Office Chair Repair'} • #{ticket.ticketNumber || 'CC-8942'}
                </Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.quickActionButtons}>
              <TouchableOpacity
                style={styles.quickCallBtn}
                onPress={handleCallCustomer}
                activeOpacity={0.8}
                accessibilityLabel="Call Customer"
              >
                <AppIcon name="Phone" size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickChatBtn}
                onPress={handleOpenChat}
                activeOpacity={0.8}
                accessibilityLabel="Message Customer"
              >
                <AppIcon name="MessageCircle" size={18} />
                {hasUnreadMessage && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* ETA Big Metric Bar */}
          <View style={styles.etaMetricBar}>
            <View style={styles.etaTextCol}>
              <View style={styles.etaHeroRow}>
                <Text style={styles.etaHeroNumber}>
                  {ticket.etaMinutes || '18'}
                </Text>
                <Text style={styles.etaHeroUnit}>min</Text>
              </View>
              <Text style={styles.etaSubDetail}>
                {ticket.distance || '2.4 km'} away • {ticket.routeSummary || 'Fast route via Golf Course Rd'}
              </Text>
            </View>

            {/* Booked Price Pill */}
            <View style={styles.gatePassCol}>
              <View style={[styles.gatePassBadge, { backgroundColor: '#DCFCE7' }]}>
                <AppIcon name="Tag" size={14} color="#15803D" />
                <Text style={[styles.gatePassText, { color: '#15803D', fontWeight: '800' }]}>
                  ₹{ticket.totalAmount || (ticket as any).total || 599}
                </Text>
              </View>
              <Text style={styles.gatePassSub}>
                {ticket.isPaid ? 'Prepaid Online' : 'Pay After Fix'}
              </Text>
            </View>
          </View>

          {/* Address & Diagnostic Note Box */}
          <View style={styles.addressDiagnosticCard}>
            <TouchableOpacity
              style={styles.addressRow}
              onPress={() => openExternalMap(destinationAddress)}
              activeOpacity={0.7}
            >
              <View style={styles.buildingIconPod}>
                <AppIcon name="Building2" size={14} color={Colors.primary} />
              </View>
              <View style={styles.addressTextCol}>
                <Text style={styles.addressTitle}>
                  {displayAddressLine1}
                </Text>
                <Text style={styles.addressSubtitle}>
                  {displayAddressLine2}
                </Text>
              </View>
              <AppIcon name="ExternalLink" size={16} color={Colors.primary} />
            </TouchableOpacity>

            {/* Customer Note Highlight */}
            <View style={styles.technicianNoteBox}>
              <AppIcon name="FileText" size={18} />
              <Text style={styles.technicianNoteText}>
                <Text style={styles.noteBold}>Technician Note: </Text>
                {ticket.technicianNote ||
                  'Ring bell twice. Herman Miller Aeron is located in the home study immediately right of the foyer.'}
              </Text>
            </View>
          </View>

          {/* Chair Asset Preview Card */}
          <View style={styles.chairAssetCard}>
            <View style={styles.chairAssetLeft}>
              <View style={styles.chairIconBox}>
                <AppIcon name="Armchair" size={18} />
              </View>
              <View style={styles.chairDetailsCol}>
                <Text style={styles.chairModelName}>
                  {ticket.chairModel || 'Herman Miller Aeron (Size B)'}
                </Text>
                <Text style={styles.chairIssueTag}>
                  {ticket.chairIssue || 'Issue: Cylinder Sinking • Caster Drag'}
                </Text>
              </View>
            </View>
            <View style={styles.partsLoadedTag}>
              <Text style={styles.partsLoadedText}>Parts Loaded</Text>
            </View>
          </View>

          {/* Navigation Action CTA Buttons */}
          <View style={styles.ctaButtonsGroup}>
            {/* Primary CTA */}
            <TouchableOpacity
              style={[
                styles.primaryNavBtn,
                isNavigating && styles.primaryNavBtnActive,
              ]}
              onPress={handleToggleNavigation}
              activeOpacity={0.88}
            >
              <Text style={styles.navArrowIcon}>
                {isNavigating ? 'NAV' : '↗'}
              </Text>
              <Text style={styles.primaryNavText}>
                {isNavigating
                  ? 'Navigating • Open Google Maps ↗'
                  : 'Start In-App Navigation (Google Maps ↗)'}
              </Text>
            </TouchableOpacity>

            {/* Secondary CTA: Mark as Arrived */}
            <TouchableOpacity
              style={styles.secondaryArriveBtn}
              onPress={handleMarkArrived}
              activeOpacity={0.85}
            >
              <AppIcon name="Check" size={18} />
              <Text style={styles.secondaryArriveText}>
                Mark as Arrived at Gate
              </Text>
            </TouchableOpacity>
          </View>
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
  headerBar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: 'rgba(247, 249, 251, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  backArrowIcon: {
    fontSize: 18,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.2,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#E6F7F0',
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#005236',
  },
  activePillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#005236',
    letterSpacing: 0.5,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarIcon: {
    fontSize: 15,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mapSectionContainer: {
    width: '100%',
    height: 340,
    backgroundColor: '#E8ECF0',
    position: 'relative',
    overflow: 'hidden',
  },
  mapCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  arterialRoad1: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-8deg' }],
  },
  arterialRoad2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '42%',
    width: 16,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '18deg' }],
  },
  arterialRoadDiagonal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '25%',
    width: 12,
    backgroundColor: '#F8FAFC',
    transform: [{ rotate: '-25deg' }],
  },
  routeTrackUnderlay: {
    position: 'absolute',
    top: 90,
    left: 90,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: 'rgba(37, 99, 235, 0.25)',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '25deg' }],
  },
  routeTrackMain: {
    position: 'absolute',
    top: 92,
    left: 92,
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 5,
    borderColor: Colors.secondaryCobalt,
    borderStyle: 'dashed',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '25deg' }],
  },
  routeTrackCongestion: {
    position: 'absolute',
    top: 140,
    left: 175,
    width: 50,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.error,
    transform: [{ rotate: '-35deg' }],
  },
  hudOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
  },
  hudCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level2,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  hudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  turnIconPod: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  turnArrowIcon: {
    fontSize: 22,
    color: Colors.onSecondary,
    fontWeight: '900',
  },
  hudTextCol: {
    flex: 1,
  },
  hudDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudDistanceText: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  laneBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  laneBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  hudInstructionText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  speedLimitCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  speedLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    lineHeight: 8,
  },
  speedValue: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.error,
    lineHeight: 14,
  },
  destinationPinAnchor: {
    position: 'absolute',
    top: 75,
    right: 48,
    alignItems: 'center',
    zIndex: 10,
  },
  destinationPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
    ...Shadows.level2,
  },
  buildingIcon: {
    fontSize: 10,
  },
  destinationPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
  destinationMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level3,
  },
  pinMarkerIcon: {
    fontSize: 16,
  },
  techGpsAnchor: {
    position: 'absolute',
    bottom: 45,
    left: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  radarPulseOuter: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  radarPulseInner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
  },
  techMarkerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.level2,
  },
  techNavArrow: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    transform: [{ rotate: '-45deg' }],
  },
  rightMapRail: {
    position: 'absolute',
    right: 12,
    bottom: 16,
    zIndex: 20,
    gap: 8,
    alignItems: 'center',
  },
  mapUtilBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  utilIcon: {
    fontSize: 16,
  },
  zoomControlsPod: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.full,
    ...Shadows.level2,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  trafficChip: {
    position: 'absolute',
    left: 12,
    bottom: 16,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...Shadows.level1,
  },
  trafficChipText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  bottomDispatchSheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    paddingBottom: Spacing.lg,
    gap: 12,
    ...Shadows.level3,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    zIndex: 30,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dragPill: {
    width: 44,
    height: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  customerContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarText: {
    ...Typography.labelMono,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLowest,
  },
  checkIconMini: {
    fontSize: 9,
    fontWeight: '900',
    color: '#002113',
  },
  customerNameBlock: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  starIcon: {
    fontSize: 9,
  },
  ratingText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ticketServiceMono: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  quickActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  quickChatBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  quickActionIcon: {
    fontSize: 17,
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  etaMetricBar: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.surfaceContainer,
  },
  etaTextCol: {
    flex: 1,
  },
  etaHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  etaHeroNumber: {
    ...Typography.headlineLg,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  etaHeroUnit: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  etaSubDetail: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  gatePassCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  gatePassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(111, 251, 190, 0.4)',
  },
  badgeIcon: {
    fontSize: 10,
  },
  gatePassText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#002113',
    textTransform: 'uppercase',
  },
  gatePassSub: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  addressDiagnosticCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    ...Shadows.level1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  buildingIconPod: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  buildingIconMini: {
    fontSize: 14,
  },
  addressTextCol: {
    flex: 1,
  },
  addressTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  addressSubtitle: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  technicianNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(219, 225, 255, 0.35)',
  },
  noteIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  technicianNoteText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  noteBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairAssetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  chairAssetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chairIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontSize: 20,
  },
  chairDetailsCol: {
    flex: 1,
  },
  chairModelName: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairIssueTag: {
    ...Typography.labelMono,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  partsLoadedTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  partsLoadedText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  ctaButtonsGroup: {
    gap: 8,
    paddingTop: 4,
  },
  primaryNavBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryNavBtnActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  navArrowIcon: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  primaryNavText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  secondaryArriveBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  arriveCheckIcon: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  secondaryArriveText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
});
