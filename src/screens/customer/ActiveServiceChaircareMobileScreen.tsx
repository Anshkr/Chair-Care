import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';

/**
 * Screen ID: C13
 * Title: Active Service Execution Checklist
 * Reference: design-reference/customer/active_service_chaircare_mobile
 */
export const ActiveServiceChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const [elapsedMinutes, setElapsedMinutes] = useState<number>(19);
  const [isSpecModalVisible, setIsSpecModalVisible] = useState<boolean>(false);
  const [isContactPopoverVisible, setIsContactPopoverVisible] = useState<boolean>(false);

  const technician = {
    name: 'Certified Partner Specialist',
    rating: 4.95,
    completedJobsCount: 140,
    phone: '+91 800 555 0199',
  };

  const serviceTitle = draft?.serviceTitle || 'Office Chair Repair & Overhaul';
  const servicePrice = draft?.estimatedTotal ? `₹${draft.estimatedTotal}` : '₹599';
  const serviceLocation =
    draft?.unitOrFloor && draft?.serviceAddress
      ? `${draft.unitOrFloor}, ${draft.serviceAddress}`
      : draft?.serviceAddress || 'Workstation #4, 2nd Floor, Cyber Park, Gurugram';

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedMinutes((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCall = () => {
    Alert.alert(
      `Call ${technician.name}`,
      `Dial masked carrier connection to ${technician.name} (${technician.phone})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => {} },
      ]
    );
  };

  const handleMessage = () => {
    setIsContactPopoverVisible(false);
    navigation.navigate('ChatWithTechnician', {
      recipientName: technician.name,
    });
  };

  const handleCompleteService = () => {
    setIsSpecModalVisible(false);
    navigation.navigate('ServiceCompleted');
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Service Execution Checklist
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.activePill}>
            <View style={styles.activePulseDot} />
            <Text style={styles.activePillText}>ACTIVE</Text>
          </View>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfileTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner & Live Telemetry */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <View style={styles.statusCardHeader}>
              <View style={styles.serviceLiveBadge}>
                <View style={styles.serviceLiveDot} />
                <Text style={styles.serviceLiveText}>SERVICE LIVE</Text>
              </View>
              <Text style={styles.requestNumText}>REQ #CC-8492</Text>
            </View>

            <View style={styles.statusTitleGroup}>
              <Text style={styles.statusHeading}>
                Your chair service is in progress
              </Text>
              <Text style={styles.statusSub}>
                Your technician is currently inspecting and servicing your
                ergonomic chair on-site.
              </Text>
            </View>

            {/* Live Elapsed Telemetry Widget */}
            <View style={styles.telemetryWidget}>
              <View style={styles.telemetryWidgetLeft}>
                <AppIcon name="Clock" size={18} />
                <View style={styles.timerTextGroup}>
                  <Text style={styles.timerLabel}>Elapsed / Total Est.</Text>
                  <Text style={styles.timerValue}>
                    {elapsedMinutes} mins{' '}
                    <Text style={styles.timerSubValue}>• Started 03:35 PM</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.telemetryWidgetRight}>
                <Text style={styles.estDurationText}>Est: 35–45 mins</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Technician Card */}
        <View style={styles.techSection}>
          <View style={styles.techCard}>
            <View style={styles.techLeftRow}>
              <View style={styles.techAvatarContainer}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                  }}
                  style={styles.techAvatar}
                />
                <View style={styles.techVerifiedBadge}>
                  <AppIcon name="Check" size={18} />
                </View>
              </View>

              <View style={styles.techInfo}>
                <View style={styles.techNameRow}>
                  <Text style={styles.techNameText}>{technician.name}</Text>
                  <View style={styles.certifiedChip}>
                    <Text style={styles.certifiedChipText}>Certified</Text>
                  </View>
                </View>
                <View style={styles.ratingRow}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingValue}>{technician.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingRole}>• Ergonomic Specialist</Text>
                </View>
                <Text style={styles.specialtyText}>
                  Specialty: Office Chair Calibration
                </Text>
              </View>
            </View>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.actionRoundBtn}
                onPress={handleCall}
                activeOpacity={0.8}
                accessibilityLabel="Call technician"
              >
                <AppIcon name="Phone" size={18} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionRoundBtn, styles.actionRoundBtnChat]}
                onPress={handleMessage}
                activeOpacity={0.8}
                accessibilityLabel="Chat with technician"
              >
                <AppIcon name="MessageCircle" size={18} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Service Progress Stepper (Diagnostic Pipeline) */}
        <View style={styles.pipelineSection}>
          <View style={styles.pipelineCard}>
            <View style={styles.pipelineHeader}>
              <Text style={styles.pipelineTitle}>Diagnostic Pipeline</Text>
              <Text style={styles.pipelineStageTag}>STAGE 3 OF 5</Text>
            </View>

            <View style={styles.stepsTimeline}>
              {/* Step 1 - Completed */}
              <View style={styles.stepItemRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                    <AppIcon name="Check" size={18} />
                  </View>
                  <View style={[styles.stepLine, styles.stepLineCompleted]} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Technician arrived on-site</Text>
                  <Text style={styles.stepMeta}>03:32 PM • Verified entrance pass</Text>
                </View>
              </View>

              {/* Step 2 - Completed */}
              <View style={styles.stepItemRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
                    <AppIcon name="Check" size={18} />
                  </View>
                  <View style={[styles.stepLine, styles.stepLineActive]} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Chair 14-point mechanical audit</Text>
                  <Text style={styles.stepMeta}>
                    03:38 PM • Pneumatic & structural baseline checked
                  </Text>
                </View>
              </View>

              {/* Step 3 - In Progress */}
              <View style={styles.stepItemRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={[styles.stepCircle, styles.stepCircleActive]}>
                    <View style={styles.stepActiveCore} />
                  </View>
                  <View style={styles.stepLine} />
                </View>
                <View style={styles.stepActiveBox}>
                  <View style={styles.stepActiveHeader}>
                    <Text style={styles.stepActiveLabel}>ACTIVE OPERATION</Text>
                    <Text style={styles.stepActiveStepCount}>STEP 3/5</Text>
                  </View>
                  <Text style={styles.stepActiveTitle}>
                    Synchron-tilt disassembly & hydraulic valve calibration
                  </Text>
                  <Text style={styles.stepActiveDesc}>
                    Re-aligning tilt fulcrum and restoring nitrogen hydraulic spring compression.
                  </Text>
                </View>
              </View>

              {/* Step 4 - Upcoming */}
              <View style={styles.stepItemRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={styles.stepCircle}>
                    <View style={styles.stepPendingCore} />
                  </View>
                  <View style={styles.stepLine} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitleUpcoming}>
                    Final sit-test & mechanical load verification
                  </Text>
                  <Text style={styles.stepMetaUpcoming}>
                    Dynamic 110kg posture weight testing
                  </Text>
                </View>
              </View>

              {/* Step 5 - Upcoming */}
              <View style={styles.stepItemRow}>
                <View style={styles.stepIndicatorColumn}>
                  <View style={styles.stepCircle}>
                    <View style={styles.stepPendingCore} />
                  </View>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitleUpcoming}>
                    Service handover & digital guarantee certificate
                  </Text>
                  <Text style={styles.stepMetaUpcoming}>
                    90-day mechanical warranty activation
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Live Visual Inspection Snapshot */}
        <View style={styles.focusAreaSection}>
          <View style={styles.focusAreaCard}>
            <View style={styles.focusAreaHeader}>
              <Text style={styles.focusAreaTitle}>Mechanical Focus Area</Text>
              <View style={styles.focusAreaChip}>
                <Text style={styles.focusAreaChipText}>Synchron Tilt Hub</Text>
              </View>
            </View>

            <View style={styles.focusImageWrap}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
                }}
                style={styles.focusImage}
              />
              <View style={styles.focusImageOverlay}>
                <View style={styles.focusLiveTag}>
                  <View style={styles.focusPulseDot} />
                  <Text style={styles.focusLiveTagText}>
                    Live Diagnostics: Pressure Valve Seal Class-4 OK
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Current Work Checklist */}
        <View style={styles.checklistSection}>
          <View style={styles.checklistCard}>
            <View style={styles.checklistHeader}>
              <View>
                <Text style={styles.checklistTitle}>Current Work Checklist</Text>
                <Text style={styles.checklistSubtitle}>
                  Real-time breakdown of service tasks
                </Text>
              </View>
              <AppIcon name="ClipboardList" size={18} />
            </View>

            <View style={styles.checklistItemsList}>
              {/* Item 1 */}
              <View style={styles.checkRow}>
                <AppIcon name="Check" size={18} />
                <View style={styles.checkTextGroup}>
                  <Text style={styles.checkItemTitle}>
                    Chair mechanism & base frame integrity
                  </Text>
                  <Text style={styles.checkItemDesc}>
                    Inspected: Cast aluminum star base structural rigidity intact
                  </Text>
                </View>
              </View>

              {/* Item 2 */}
              <View style={styles.checkRow}>
                <AppIcon name="Check" size={18} />
                <View style={styles.checkTextGroup}>
                  <Text style={styles.checkItemTitle}>
                    Hydraulic cylinder & gas-lift pressure seal
                  </Text>
                  <Text style={styles.checkItemDesc}>
                    Inspected: Nitrogen chamber holds full height lock without drift
                  </Text>
                </View>
              </View>

              {/* Item 3 - Active */}
              <View style={[styles.checkRow, styles.checkRowActive]}>
                <AppIcon name="Settings" size={18} />
                <View style={styles.checkTextGroup}>
                  <View style={styles.checkActiveTitleRow}>
                    <Text style={styles.checkItemTitleActive}>
                      Servicing tilt lock mechanism
                    </Text>
                    <View style={styles.activeMiniBadge}>
                      <Text style={styles.activeMiniBadgeText}>ACTIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.checkItemDescActive}>
                    Applying synthetic PTFE lube to friction teeth and spring pivot
                  </Text>
                </View>
              </View>

              {/* Item 4 */}
              <View style={[styles.checkRow, styles.checkRowUpcoming]}>
                <Text style={styles.checkPendingIcon}>○</Text>
                <View style={styles.checkTextGroup}>
                  <Text style={styles.checkItemTitleUpcoming}>
                    Casters, 4D armrest brackets & torque calibration
                  </Text>
                  <Text style={styles.checkItemDescUpcoming}>
                    Upcoming: 12-bolt hex torque recalibration
                  </Text>
                </View>
              </View>

              {/* Item 5 */}
              <View style={[styles.checkRow, styles.checkRowUpcoming]}>
                <Text style={styles.checkPendingIcon}>○</Text>
                <View style={styles.checkTextGroup}>
                  <Text style={styles.checkItemTitleUpcoming}>
                    Biomechanics & ergonomic load testing
                  </Text>
                  <Text style={styles.checkItemDescUpcoming}>
                    Upcoming: Lumbar depth and spinal support angle test
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 100% Price Transparency Guarantee Card (Additional Work Rule) */}
        <View style={styles.guaranteeSection}>
          <View style={styles.guaranteeCard}>
            <View style={styles.guaranteeHeader}>
              <View style={styles.gavelIconBox}>
                <AppIcon name="Scale" size={16} color={Colors.onSurfaceVariant} />
              </View>
              <View style={styles.guaranteeTitleGroup}>
                <Text style={styles.guaranteeTitle}>
                  100% Price Transparency Guarantee
                </Text>
                <Text style={styles.guaranteeSub}>NO HIDDEN SURPRISES</Text>
              </View>
            </View>
            <Text style={styles.guaranteeBody}>
              No additional work will be charged without your explicit mobile
              confirmation. If replacement parts (e.g. gas cylinder or caster kit)
              are recommended during repair, you will receive an in-app estimate to
              review and approve before any installation takes place.
            </Text>
          </View>
        </View>

        {/* Booking Summary Snapshot */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardHeader}>
              <Text style={styles.summaryHeading}>Booking Summary</Text>
              <Text style={styles.summaryIdText}>ID: #CC-8492</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>SERVICE TYPE</Text>
                <Text style={styles.summaryCellValue}>{serviceTitle}</Text>
                <Text style={styles.summaryCellSub}>Multi-point tuning</Text>
              </View>

              <View style={styles.summaryCell}>
                <Text style={styles.summaryCellLabel}>BASE ESTIMATE</Text>
                <Text style={styles.summaryPriceValue}>{servicePrice}</Text>
                <Text style={styles.summaryPriceSub}>Includes labor & lube</Text>
              </View>
            </View>

            <View style={styles.locationFooterRow}>
              <AppIcon name="MapPin" size={18} />
              <Text style={styles.locationFooterText} numberOfLines={1}>
                {serviceLocation}
              </Text>
            </View>
          </View>
        </View>

        {/* Dev / Staging Direct Transition */}
        <View style={styles.simulateSection}>
          <TouchableOpacity
            style={styles.simulateBtn}
            onPress={handleCompleteService}
            activeOpacity={0.8}
          >
            <Text style={styles.simulateBtnText}>
              Simulate Service Completion (C14) →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Action Footer */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <View style={styles.footerButtonsRow}>
          <TouchableOpacity
            style={styles.viewSpecBtn}
            onPress={() => setIsSpecModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewSpecBtnText}>View Full Spec Sheet</Text>
            <Text style={styles.viewSpecBtnArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.assistanceBtn}
            onPress={() => setIsContactPopoverVisible(true)}
            activeOpacity={0.85}
          >
            <AppIcon name="Headphones" size={16} color={Colors.secondary} />
            <Text style={styles.assistanceText}>Assistance</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Micro Spec Sheet Modal */}
      <Modal
        visible={isSpecModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSpecModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <AppIcon name="Settings" size={18} />
                <Text style={styles.modalTitle}>Ergonomic Spec Sheet</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsSpecModalVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSpecsList}>
              <View style={styles.specCard}>
                <Text style={styles.specCardLabel}>CYLINDER SPEC</Text>
                <Text style={styles.specCardTitle}>
                  Heavy Duty Class 4 (Stroke 120mm)
                </Text>
                <View style={styles.specProgressBar}>
                  <View style={styles.specProgressFill} />
                </View>
                <Text style={styles.specCardMeta}>
                  Pressure Retention: 98% Normal
                </Text>
              </View>

              <View style={styles.specCard}>
                <Text style={styles.specCardLabel}>TILT TENSION RESISTANCE</Text>
                <Text style={styles.specCardTitle}>
                  Calibrated to 68 kg body mass dynamic recline
                </Text>
                <Text style={styles.specCardStatus}>Status: Calibrated</Text>
              </View>

              <View style={styles.specCard}>
                <Text style={styles.specCardLabel}>CASTER HUBS</Text>
                <Text style={styles.specCardTitle}>
                  60mm Polyurethane Soft-Tread
                </Text>
                <Text style={styles.specCardMeta}>
                  Rotational Friction: Optimal
                </Text>
              </View>
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setIsSpecModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDoneBtnText}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCompleteBtn}
                onPress={handleCompleteService}
                activeOpacity={0.85}
              >
                <Text style={styles.modalCompleteBtnText}>
                  Complete Service (C14) →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quick Connect Popover Modal */}
      <Modal
        visible={isContactPopoverVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsContactPopoverVisible(false)}
      >
        <TouchableOpacity
          style={styles.popoverBackdrop}
          activeOpacity={1}
          onPress={() => setIsContactPopoverVisible(false)}
        >
          <View style={styles.popoverCard}>
            <View style={styles.popoverHeader}>
              <Text style={styles.popoverTitle}>Quick Connect</Text>
              <TouchableOpacity
                onPress={() => setIsContactPopoverVisible(false)}
              >
                <AppIcon name="X" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={styles.popoverDesc}>
              Need to update access instructions or ask Rahul a quick question?
            </Text>
            <View style={styles.popoverActions}>
              <TouchableOpacity
                style={styles.popoverCallBtn}
                onPress={() => {
                  setIsContactPopoverVisible(false);
                  handleCall();
                }}
              >
                <AppIcon name="Phone" size={18} />
                <Text style={styles.popoverCallText}>Direct Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.popoverChatBtn}
                onPress={handleMessage}
              >
                <AppIcon name="MessageCircle" size={18} />
                <Text style={styles.popoverChatText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    gap: 12,
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
    gap: 8,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.5,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  statusSection: {},
  statusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  serviceLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  serviceLiveText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.6,
  },
  requestNumText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  statusTitleGroup: {
    gap: 4,
  },
  statusHeading: {
    ...Typography.headlineMd,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statusSub: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  telemetryWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
  },
  telemetryWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerIcon: {
    fontSize: 18,
  },
  timerTextGroup: {
    gap: 1,
  },
  timerLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  timerValue: {
    ...Typography.labelMono,
    fontSize: 12,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  timerSubValue: {
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
  },
  telemetryWidgetRight: {
    alignItems: 'flex-end',
  },
  estDurationText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  techSection: {},
  techCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  techLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  techAvatarContainer: {
    position: 'relative',
  },
  techAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  techVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techVerifiedCheck: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.tertiaryContainer,
  },
  techInfo: {
    flex: 1,
    gap: 2,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techNameText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  certifiedChip: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  certifiedChipText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingStar: {
    fontSize: 11,
  },
  ratingValue: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  ratingRole: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  specialtyText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRoundBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRoundBtnChat: {
    backgroundColor: Colors.secondaryFixed,
  },
  actionRoundIcon: {
    fontSize: 16,
  },
  pipelineSection: {},
  pipelineCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pipelineTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  pipelineStageTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.6,
  },
  stepsTimeline: {
    gap: 4,
    paddingLeft: 4,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIndicatorColumn: {
    alignItems: 'center',
    width: 24,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.tertiaryFixed,
  },
  stepCircleActive: {
    backgroundColor: Colors.secondaryCobalt,
  },
  stepCheckmark: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.tertiaryContainer,
  },
  stepActiveCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onPrimary,
  },
  stepPendingCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.outlineVariant,
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: Colors.surfaceContainer,
    marginVertical: -2,
  },
  stepLineCompleted: {
    backgroundColor: Colors.tertiaryFixed,
  },
  stepLineActive: {
    backgroundColor: Colors.secondaryFixed,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
    gap: 2,
  },
  stepTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stepMeta: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  stepActiveBox: {
    flex: 1,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 4,
    marginBottom: 16,
  },
  stepActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepActiveLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.6,
  },
  stepActiveStepCount: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  stepActiveTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stepActiveDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 15,
  },
  stepTitleUpcoming: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
  },
  stepMetaUpcoming: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  focusAreaSection: {},
  focusAreaCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  focusAreaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  focusAreaTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  focusAreaChip: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  focusAreaChipText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  focusImageWrap: {
    height: 130,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainer,
  },
  focusImage: {
    width: '100%',
    height: '100%',
  },
  focusImageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  focusLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  focusPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryFixedDim,
  },
  focusLiveTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  checklistSection: {},
  checklistCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checklistTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  checklistSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  checklistIcon: {
    fontSize: 18,
  },
  checklistItemsList: {
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  checkRowActive: {
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    borderWidth: 1,
    borderColor: Colors.secondaryFixedDim,
  },
  checkRowUpcoming: {
    opacity: 0.7,
  },
  checkDoneIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onTertiaryContainer,
    marginTop: 1,
  },
  checkActiveSpinIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  checkPendingIcon: {
    fontSize: 13,
    color: Colors.outline,
    marginTop: 1,
  },
  checkTextGroup: {
    flex: 1,
    gap: 2,
  },
  checkItemTitle: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  checkItemDesc: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    lineHeight: 14,
  },
  checkActiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkItemTitleActive: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  activeMiniBadge: {
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  activeMiniBadgeText: {
    ...Typography.labelMono,
    fontSize: 8,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  checkItemDescActive: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    lineHeight: 14,
  },
  checkItemTitleUpcoming: {
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurface,
  },
  checkItemDescUpcoming: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  guaranteeSection: {},
  guaranteeCard: {
    backgroundColor: 'rgba(219, 225, 255, 0.35)',
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.secondaryFixed,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gavelIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gavelIcon: {
    fontSize: 16,
  },
  guaranteeTitleGroup: {
    flex: 1,
    gap: 1,
  },
  guaranteeTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  guaranteeSub: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
  },
  guaranteeBody: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  summarySection: {},
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  summaryHeading: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  summaryIdText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCell: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 2,
  },
  summaryCellLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  summaryCellValue: {
    ...Typography.bodyMd,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  summaryCellSub: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  summaryPriceValue: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  summaryPriceSub: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.tertiaryContainer,
    fontWeight: '600',
  },
  locationFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 4,
  },
  locationPinIcon: {
    fontSize: 13,
  },
  locationFooterText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  simulateSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  simulateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  simulateBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    ...Shadows.level3,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewSpecBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  viewSpecBtnText: {
    ...Typography.bodyMd,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  viewSpecBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  assistanceBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  assistanceIcon: {
    fontSize: 16,
  },
  assistanceText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    padding: 20,
    gap: 14,
    maxHeight: '80%',
    ...Shadows.level3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderIcon: {
    fontSize: 18,
  },
  modalTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalSpecsList: {
    gap: 10,
  },
  specCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 4,
  },
  specCardLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.6,
  },
  specCardTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  specProgressBar: {
    height: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 3,
    marginVertical: 4,
    overflow: 'hidden',
  },
  specProgressFill: {
    width: '80%',
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
  },
  specCardMeta: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  specCardStatus: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onTertiaryContainer,
  },
  modalActionButtons: {
    gap: 8,
    marginTop: 6,
  },
  modalDoneBtn: {
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  modalCompleteBtn: {
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  modalCompleteBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  popoverBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 16,
  },
  popoverCard: {
    width: 280,
    backgroundColor: Colors.inverseSurface,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    ...Shadows.level3,
  },
  popoverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popoverTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.inverseOnSurface,
  },
  popoverClose: {
    fontSize: 14,
    color: Colors.inverseOnSurface,
  },
  popoverDesc: {
    ...Typography.bodySm,
    fontSize: 11,
    color: 'rgba(239, 241, 243, 0.8)',
    lineHeight: 15,
  },
  popoverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  popoverCallBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  popoverChatBtn: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  popoverBtnIcon: {
    fontSize: 12,
  },
  popoverCallText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  popoverChatText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.inverseSurface,
  },
});
