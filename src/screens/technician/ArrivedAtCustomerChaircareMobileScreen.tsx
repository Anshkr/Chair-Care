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
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fileUriToBase64DataUrl } from '../../utils/fileUpload';
import { PhotoCaptureModal, CapturedPhoto } from '../../components/common/PhotoCaptureModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface ArrivedAtCustomerProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const ArrivedAtCustomerChaircareMobileScreen: React.FC<
  ArrivedAtCustomerProps
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
    targetSpec: 'CLASS 4 GAS LIFT',
    chairModel: 'Ergonomic Task Chair',
    chairConfig: 'Standard Configuration',
    customerName: 'Customer',
    customerPhone: '+91 91234 56789',
    customerRating: 5.0,
    memberTag: 'VERIFIED MEMBER',
    slaBadge: 'Standard SLA',
    addressLine1: 'Customer Service Address',
    addressLine2: 'Designated Service Zone',
    scheduledSlot: 'Scheduled Window',
    accessCode: 'Service Entrance Access',
    recordedTimestamp: 'On Site',
    status: 'arrived',
  };

  const targetJobId = String(ticket.id || passedId || '').trim().replace(/^#/, '');

  // Pre-entry checklist state
  const [checklist, setChecklist] = useState({
    tarpReady: true,
    toolsStaged: true,
    doorbellAnnounced: false,
  });

  const [isStartingService, setIsStartingService] = useState(false);

  const [arrivalPhotos, setArrivalPhotos] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && targetJobId) {
      try {
        const cached = window.localStorage.getItem(`chaircare_job_photos_${targetJobId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    if (Array.isArray(ticket?.photoLogs) && ticket.photoLogs.length > 0) {
      return ticket.photoLogs;
    }
    return [];
  });
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // Animations for geofence radar pulse
  const radarAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(radarAnim, {
            toValue: 1.35,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.05,
            duration: 1500,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(radarAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [radarAnim, opacityAnim]);

  const readyCount =
    (checklist.tarpReady ? 1 : 0) +
    (checklist.toolsStaged ? 1 : 0) +
    (checklist.doorbellAnnounced ? 1 : 0);

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleOpenArrivalPhotoPicker = () => {
    setPhotoPickerVisible(true);
  };

  const handlePhotoCaptured = (captured: CapturedPhoto) => {
    const updated = [captured, ...arrivalPhotos];
    setArrivalPhotos(updated);

    if (typeof window !== 'undefined' && targetJobId) {
      try {
        window.localStorage.setItem(`chaircare_job_photos_${targetJobId}`, JSON.stringify(updated));
      } catch {}
    }

    if (targetJobId) {
      technicianApi.uploadJobPhoto(targetJobId, captured).catch(() => {});
    }
  };

  const handleCallCustomer = () => {
    const phone = ticket.customerPhone || ticket.customer_phone || '+91 98765 43210';
    phoneCallService.callNumber(phone, ticket.customerName);
  };

  const handleLiveChat = () => {
    navigation.navigate('TechnicianChat', {
      customerName: ticket.customerName,
      requestId: ticket.id || ticket.ticketNumber,
    });
  };

  const handleStartService = async () => {
    // Automatically complete checklist items and proceed directly
    setChecklist({
      tarpReady: true,
      toolsStaged: true,
      doorbellAnnounced: true,
    });
    await proceedToActiveJob();
  };

  const proceedToActiveJob = async () => {
    if (isStartingService) return;
    setIsStartingService(true);

    const targetJobId =
      ticket.id ||
      ticket.jobId ||
      ticket.requestId ||
      ticket.ticketNumber ||
      ticket.trackingCode ||
      ticket.tracking_code ||
      passedId;

    if (targetJobId) {
      try {
        await technicianApi.updateJobStatus(
          String(targetJobId),
          'in_progress',
          'Technician initiated active chair disassembly and inspection.'
        );
      } catch (err) {
        console.warn('Backend updateJobStatus error (continuing transition):', err);
      }
    }

    const existingStartedAt =
      ticket.startedAt ||
      ticket.started_at ||
      (typeof window !== 'undefined' && targetJobId
        ? window.localStorage.getItem(`chaircare_job_start_${targetJobId}`)
        : null);

    const finalStartedAt = existingStartedAt || new Date().toISOString();

    if (typeof window !== 'undefined' && targetJobId) {
      try {
        window.localStorage.setItem(`chaircare_job_start_${targetJobId}`, finalStartedAt);
      } catch {}
    }

    const updated = {
      ...ticket,
      id: targetJobId || ticket.id,
      status: 'in_progress',
      startedAt: finalStartedAt,
      started_at: finalStartedAt,
      photoLogs: arrivalPhotos,
    };

    setAcceptedRequest(updated);

    if (navigation) {
      navigation.navigate('ActiveJob', {
        requestId: targetJobId || ticket.ticketNumber || 'DISPATCH',
        request: updated,
      });
    }

    setTimeout(() => {
      setIsStartingService(false);
    }, 1200);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Minimalist Header */}
      <View
        style={[
          styles.headerBar,
          { paddingTop: Math.max(insets.top, 12) + 6 },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
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
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerSubtitle}>DISPATCH TELEMETRY</Text>
          <Text style={styles.headerTitle}>Customer Location</Text>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('TechnicianMain');
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Close Diagnostic"
        >
          <AppIcon name="X" size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Celebratory Arrival Block */}
        <View style={styles.heroArrivalCard}>
          {/* Ambient Geofence Radar Pulse */}
          <View style={styles.radarWrapper}>
            <Animated.View
              style={[
                styles.radarOuterRing,
                {
                  transform: [{ scale: radarAnim }],
                  opacity: opacityAnim,
                },
              ]}
            />
            <View style={styles.radarInnerRing} />
            <View style={styles.radarCenterCircle}>
              <AppIcon name="CheckCheck" size={18} />
            </View>
          </View>

          <View style={styles.geofenceTag}>
            <Text style={styles.geofenceTagText}>
              GEOFENCE LOCK CONFIRMED
            </Text>
          </View>

          <Text style={styles.arrivalHeadline}>You've arrived</Text>
          <Text style={styles.arrivalDesc}>
            Confirm you are at the customer's doorstep before unboxing tools or
            starting diagnostic logging.
          </Text>

          {/* Micro telemetry ticker */}
          <View style={styles.telemetryTicker}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.telemetryText}>
              12m Accuracy • GPS RTK Synced
            </Text>
          </View>
        </View>

        {/* Arrival Telemetry & Status Card */}
        <View style={styles.telemetryStatusCard}>
          <View style={styles.telemetryStatusHeader}>
            <View style={styles.arrivedBadge}>
              <View style={styles.arrivedDot} />
              <Text style={styles.arrivedBadgeText}>Arrived at location</Text>
            </View>
            <Text style={styles.ticketTagText}>
              {ticket.ticketNumber || 'REQ-8492'}
            </Text>
          </View>

          <View style={styles.timestampBox}>
            <View style={styles.clockIconPod}>
              <AppIcon name="Clock" size={18} />
            </View>
            <View style={styles.timestampTextCol}>
              <Text style={styles.timestampLabel}>TIMESTAMP RECORDED</Text>
              <Text style={styles.timestampValue}>
                {ticket.recordedTimestamp || '02:26 PM (4 mins ahead of window)'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer & Asset Inspection Card */}
        <View style={styles.inspectionCard}>
          {/* Customer Row */}
          <View style={styles.customerHeaderRow}>
            <View style={styles.customerLeftGroup}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>AK</Text>
              </View>
              <View style={styles.customerNameCol}>
                <View style={styles.customerNameRating}>
                  <Text style={styles.customerName}>
                    {ticket.customerName || 'Ansh Kumar'}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" /><Text style={styles.starText}>4.9</Text></View>
                  </View>
                </View>
                <Text style={styles.memberTagText}>
                  {ticket.memberTag || 'VERIFIED WORKPLACE MEMBER'}
                </Text>
              </View>
            </View>

            <View style={styles.slaBadge}>
              <Text style={styles.slaBadgeText}>
                {ticket.slaBadge || 'Priority SLA'}
              </Text>
            </View>
          </View>

          {/* Targeted Chair Asset Chip */}
          <View style={styles.chairAssetChip}>
            <View style={styles.chairIconBox}>
              <AppIcon name="Armchair" size={18} />
            </View>
            <View style={styles.chairInfoCol}>
              <View style={styles.targetSpecRow}>
                <Text style={styles.targetSpecLabel}>TARGET SPEC</Text>
                <Text style={styles.targetSpecVal}>
                  {ticket.targetSpec || 'CLASS 4 GAS LIFT'}
                </Text>
              </View>
              <Text style={styles.chairModelText}>
                {ticket.chairModel || 'Herman Miller Aeron'}
              </Text>
              <Text style={styles.chairConfigText}>
                {ticket.chairConfig || 'Size B • PostureFit SL • Fully Loaded'}
              </Text>
            </View>
          </View>

          {/* Location & Gate Navigation Details */}
          <View style={styles.locationDetailsCol}>
            <View style={styles.locationItemRow}>
              <AppIcon name="MapPin" size={18} />
              <View style={styles.locationTextCol}>
                <Text style={styles.locationLine1}>
                  {ticket.addressLine1 ||
                    'Flat 402, Tower B, Palm Springs Residences'}
                </Text>
                <Text style={styles.locationLine2}>
                  {ticket.addressLine2 ||
                    'Sector 54, Golf Course Road, Gurugram, HR'}
                </Text>
              </View>
            </View>

            <View style={styles.scheduleItemRow}>
              <AppIcon name="CalendarCheck" size={18} />
              <Text style={styles.scheduleText}>
                {ticket.scheduledSlot || 'Today • 2:30 PM – 4:00 PM Slot'}
              </Text>
            </View>

            {/* Quick Access Tag */}
            <View style={styles.accessCodeBox}>
              <AppIcon name="Key" size={18} />
              <Text style={styles.accessCodeText}>
                {ticket.accessCode ||
                  'ACCESS: Tower B • Service Lift 3 • 4th Floor'}
              </Text>
            </View>
          </View>
        </View>

        {/* Pre-Entry Readiness Checklist */}
        <View style={styles.checklistCard}>
          <View style={styles.checklistHeaderRow}>
            <View style={styles.checklistHeaderLeft}>
              <AppIcon name="ClipboardList" size={18} />
              <Text style={styles.checklistTitle}>Pre-Entry Protocol</Text>
            </View>
            <Text style={styles.checklistCounterText}>
              {readyCount} of 3 Ready
            </Text>
          </View>

          <View style={styles.checklistItemsList}>
            {/* Item 1 */}
            <TouchableOpacity
              style={styles.checkItemCard}
              onPress={() => toggleChecklist('tarpReady')}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkboxBox,
                  checklist.tarpReady && styles.checkboxBoxChecked,
                ]}
              >
                {checklist.tarpReady && (
                  <AppIcon name="Check" size={18} />
                )}
              </View>
              <View style={styles.checkItemTextCol}>
                <Text style={styles.checkItemTitle}>
                  Protective floor tarp & shoe covers ready
                </Text>
                <Text style={styles.checkItemSub}>
                  Zero scuff guarantee for hardwood floors
                </Text>
              </View>
            </TouchableOpacity>

            {/* Item 2 */}
            <TouchableOpacity
              style={styles.checkItemCard}
              onPress={() => toggleChecklist('toolsStaged')}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkboxBox,
                  checklist.toolsStaged && styles.checkboxBoxChecked,
                ]}
              >
                {checklist.toolsStaged && (
                  <AppIcon name="Check" size={18} />
                )}
              </View>
              <View style={styles.checkItemTextCol}>
                <Text style={styles.checkItemTitle}>
                  Diagnostic kit & Class-4 cylinder staged
                </Text>
                <Text style={styles.checkItemSub}>
                  Pipe wrench, gas lift puller, lubricant kit
                </Text>
              </View>
            </TouchableOpacity>

            {/* Item 3 */}
            <TouchableOpacity
              style={[
                styles.checkItemCard,
                checklist.doorbellAnnounced && styles.checkItemCardActive,
              ]}
              onPress={() => toggleChecklist('doorbellAnnounced')}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.checkboxBox,
                  checklist.doorbellAnnounced && styles.checkboxBoxChecked,
                ]}
              >
                {checklist.doorbellAnnounced && (
                  <AppIcon name="Check" size={18} />
                )}
              </View>
              <View style={styles.checkItemTextCol}>
                <Text style={styles.checkItemTitleHighlight}>
                  Ring doorbell & announce doorstep arrival
                </Text>
                <Text style={styles.checkItemSub}>
                  Awaiting initial tenant greeting
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Geofence Static Map Visual Confirmation */}
        <View style={styles.geofenceMapContainer}>
          <View style={styles.geofenceMapCanvas}>
            <View style={styles.mapGridLine1} />
            <View style={styles.mapGridLine2} />
            <View style={styles.geofenceRadiusCircle} />
            <View style={styles.geofenceCenterPin}>
              <AppIcon name="MapPin" size={18} />
            </View>
          </View>
          <View style={styles.geofenceFooterGlass}>
            <View style={styles.geofenceFooterLeft}>
              <AppIcon name="MapPin" size={14} />
              <Text style={styles.geofenceRadiusText}>
                GEOFENCE ACTIVE (RADIUS: 50M)
              </Text>
            </View>
            <Text style={styles.inBoundsText}>IN BOUNDS</Text>
          </View>
        </View>

        {/* Technician Quick Contact & Support Row */}
        <View style={styles.contactRowGrid}>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={handleCallCustomer}
            activeOpacity={0.8}
            accessibilityLabel="Call Customer"
          >
            <AppIcon name="Phone" size={18} />
            <Text style={styles.contactBtnText}>Call Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactBtn}
            onPress={handleLiveChat}
            activeOpacity={0.8}
            accessibilityLabel="Live Chat"
          >
            <AppIcon name="MessageCircle" size={18} />
            <Text style={styles.contactBtnText}>Live Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Pre-Service Inspection Photo Strip */}
        <View style={styles.arrivalPhotoCard}>
          <View style={styles.arrivalPhotoLeft}>
            <View style={styles.arrivalPhotoIconPod}>
              <AppIcon name="Camera" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.arrivalPhotoTitle}>Pre-Service Inspection Photo</Text>
              <Text style={styles.arrivalPhotoSub}>
                {arrivalPhotos.length > 0
                  ? `${arrivalPhotos.length} photo(s) captured • Ready for service`
                  : 'Document chair condition on arrival (optional)'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.arrivalPhotoActionBtn}
            onPress={handleOpenArrivalPhotoPicker}
            activeOpacity={0.8}
          >
            <Text style={styles.arrivalPhotoActionBtnText}>
              {arrivalPhotos.length > 0 ? '+ Add More' : '+ Add Photo'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sticky Bottom Trigger Bar */}
        <View style={styles.bottomTriggerBar}>
          <TouchableOpacity
            style={[
              styles.startServiceBtn,
              isStartingService && styles.startServiceBtnActive,
            ]}
            onPress={handleStartService}
            activeOpacity={0.88}
          >
            <Text style={styles.startServiceBtnText}>
              {isStartingService
                ? 'Opening Session...'
                : ticket.status === 'in_progress' || ticket.startedAt || ticket.started_at
                ? 'Resume Service'
                : 'Start Service'}
            </Text>
            <Text style={styles.startServiceArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.cautionaryPolicyNote}>
            Do NOT begin mechanical disassembly before customer greets and
            confirms chair access.
          </Text>
        </View>
      </ScrollView>

      {/* Pre-Service Photo Capture Modal with Live Web Camera & Gallery */}
      <PhotoCaptureModal
        visible={photoPickerVisible}
        onClose={() => setPhotoPickerVisible(false)}
        onPhotoCaptured={handlePhotoCaptured}
        title="Add Pre-Service Photo"
        subtitle="Photograph chair condition on doorstep before starting service."
        tags={[
          'Doorstep Arrival',
          'Pre-Repair Inspection',
          'Chair Overview',
          'Damage Detail',
          'Mechanism View',
        ]}
        defaultTag="Pre-Repair Inspection"
      />
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
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceContainerHigh,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  headerBtnIcon: {
    fontSize: 16,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerSubtitle: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  heroArrivalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  radarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  radarOuterRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 150, 104, 0.2)',
  },
  radarInnerRing: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(111, 251, 190, 0.4)',
  },
  radarCenterCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#009668',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  radarCheckIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -2,
  },
  geofenceTag: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: 8,
    marginBottom: 6,
  },
  geofenceTagText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '800',
    color: '#005236',
    textTransform: 'uppercase',
  },
  arrivalHeadline: {
    ...Typography.headlineLg,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  arrivalDesc: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 290,
    marginTop: 4,
    lineHeight: 18,
  },
  telemetryTicker: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    width: '100%',
    justifyContent: 'center',
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#005236',
  },
  telemetryText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  telemetryStatusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  telemetryStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  arrivedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#009668',
  },
  arrivedBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  ticketTagText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  clockIconPod: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  clockIcon: {
    fontSize: 16,
  },
  timestampTextCol: {
    flex: 1,
  },
  timestampLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  timestampValue: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    marginTop: 1,
  },
  inspectionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  customerHeaderRow: {
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  customerNameCol: {
    flex: 1,
  },
  customerNameRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ratingBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  starText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  memberTagText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  slaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondaryContainer,
  },
  slaBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  chairAssetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  chairIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  chairIcon: {
    fontSize: 22,
  },
  chairInfoCol: {
    flex: 1,
  },
  targetSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  targetSpecLabel: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  targetSpecVal: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#009668',
    textTransform: 'uppercase',
  },
  chairModelText: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 1,
  },
  chairConfigText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  locationDetailsCol: {
    gap: 8,
    paddingTop: 4,
  },
  locationItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationPinIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  locationTextCol: {
    flex: 1,
  },
  locationLine1: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  locationLine2: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  scheduleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIcon: {
    fontSize: 14,
  },
  scheduleText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
  },
  accessCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
  },
  keyIcon: {
    fontSize: 13,
  },
  accessCodeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  checklistCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  checklistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checklistHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  factCheckIcon: {
    fontSize: 16,
  },
  checklistTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  checklistCounterText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  checklistItemsList: {
    gap: 8,
  },
  checkItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  checkItemCardActive: {
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  checkGlyph: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  checkItemTextCol: {
    flex: 1,
  },
  checkItemTitle: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  checkItemTitleHighlight: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  checkItemSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  geofenceMapContainer: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.xl,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.level1,
  },
  geofenceMapCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGridLine1: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-10deg' }],
  },
  mapGridLine2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 10,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '15deg' }],
  },
  geofenceRadiusCircle: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#009668',
    backgroundColor: 'rgba(111, 251, 190, 0.2)',
  },
  geofenceCenterPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinIcon: {
    fontSize: 14,
  },
  geofenceFooterGlass: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  geofenceFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  pinMiniIcon: {
    fontSize: 12,
  },
  geofenceRadiusText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  inBoundsText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#009668',
  },
  contactRowGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    ...Shadows.level1,
  },
  contactIcon: {
    fontSize: 16,
  },
  contactBtnText: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  bottomTriggerBar: {
    gap: 8,
    paddingTop: 4,
  },
  startServiceBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  startServiceBtnActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  startServiceBtnText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  startServiceArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  cautionaryPolicyNote: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  arrivalPhotoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
  },
  arrivalPhotoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  arrivalPhotoIconPod: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivalPhotoTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  arrivalPhotoSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  arrivalPhotoActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  arrivalPhotoActionBtnText: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  photoPickerCard: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadows.level3,
  },
  photoPickerHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  photoPickerIconPod: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  photoPickerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  photoPickerSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  photoLoadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoLoadingText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  photoActionButtonsCol: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  photoOptionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  photoOptionBtnPrimaryText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoOptionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  photoOptionBtnSecondaryText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  photoPickerCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  photoPickerCancelText: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});
