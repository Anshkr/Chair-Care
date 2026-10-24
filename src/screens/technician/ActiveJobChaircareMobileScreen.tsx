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
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { useTechnician } from '../../context/TechnicianContext';
import { technicianApi } from '../../services/api/technicianApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface ActiveJobProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const ActiveJobChaircareMobileScreen: React.FC<ActiveJobProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest, setAcceptedRequest } = useTechnician();

  const passedRequest = route?.params?.request || acceptedRequest;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Selected request data
  const ticket = passedRequest || {
    id: passedId || '',
    ticketNumber: passedId || 'DISPATCH',
    customerName: 'Customer',
    customerRating: 5.0,
    serviceTitle: 'Office Chair Repair',
    dispatchType: 'Direct Dispatch',
    chairModel: 'Ergonomic Task Chair',
    chairSize: 'Standard',
    chairConfig: 'Precision Overhaul',
    locationShort: 'Customer Site Location',
    status: 'in_progress',
  };

  const targetJobId = String(ticket.id || passedId || '').trim().replace(/^#/, '');

  // Persistent service start timestamp resolution
  const resolvedStartedAt =
    ticket?.startedAt ||
    ticket?.started_at ||
    acceptedRequest?.startedAt ||
    acceptedRequest?.started_at ||
    (typeof window !== 'undefined' && targetJobId
      ? window.localStorage.getItem(`chaircare_job_start_${targetJobId}`)
      : null);

  const calculateCurrentSeconds = (startTime?: string | null) => {
    if (!startTime) return 0;
    const ms = Date.now() - new Date(startTime).getTime();
    return isNaN(ms) ? 0 : Math.max(0, Math.floor(ms / 1000));
  };

  const [serviceStartTime, setServiceStartTime] = useState<string | null>(resolvedStartedAt || null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => calculateCurrentSeconds(resolvedStartedAt));

  // Initialize and persist service start timestamp
  useEffect(() => {
    if (!serviceStartTime) {
      const nowIso = new Date().toISOString();
      setServiceStartTime(nowIso);
      setElapsedSeconds(0);
      if (typeof window !== 'undefined' && targetJobId) {
        try {
          window.localStorage.setItem(`chaircare_job_start_${targetJobId}`, nowIso);
        } catch {}
      }
    } else if (typeof window !== 'undefined' && targetJobId) {
      try {
        window.localStorage.setItem(`chaircare_job_start_${targetJobId}`, serviceStartTime);
      } catch {}
    }
  }, [serviceStartTime, targetJobId]);

  // Sync latest authoritative startedAt from server
  useEffect(() => {
    if (targetJobId) {
      technicianApi.getJobDetails(targetJobId).then((res) => {
        if (res.success && res.data) {
          const serverStart = res.data.startedAt || res.data.started_at;
          if (serverStart) {
            setServiceStartTime(serverStart);
            setElapsedSeconds(calculateCurrentSeconds(serverStart));
            if (typeof window !== 'undefined') {
              try {
                window.localStorage.setItem(`chaircare_job_start_${targetJobId}`, serverStart);
              } catch {}
            }
          }
        }
      }).catch(() => {});
    }
  }, [targetJobId]);

  // Live Timer: runs every second calculating actual elapsed time against serviceStartTime
  useEffect(() => {
    if (!serviceStartTime) return;

    const timerInterval = setInterval(() => {
      setElapsedSeconds(calculateCurrentSeconds(serviceStartTime));
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [serviceStartTime]);

  const formatTimer = (totalSec: number) => {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Milestone Task state
  const [stabilityTestCompleted, setStabilityTestCompleted] = useState(false);

  // Security PIN Verification state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [securityPinInput, setSecurityPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Equalizer wave animations
  const waveAnim1 = useRef(new Animated.Value(6)).current;
  const waveAnim2 = useRef(new Animated.Value(14)).current;
  const waveAnim3 = useRef(new Animated.Value(10)).current;
  const waveAnim4 = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const createLoop = (anim: Animated.Value, minH: number, maxH: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxH,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minH,
            duration,
            useNativeDriver: false,
          }),
        ])
      );
    };

    const l1 = createLoop(waveAnim1, 4, 14, 600);
    const l2 = createLoop(waveAnim2, 8, 20, 800);
    const l3 = createLoop(waveAnim3, 4, 12, 500);
    const l4 = createLoop(waveAnim4, 6, 22, 900);

    l1.start();
    l2.start();
    l3.start();
    l4.start();

    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
      l4.stop();
    };
  }, [waveAnim1, waveAnim2, waveAnim3, waveAnim4]);

  const handleCallCustomer = () => {
    const phone = ticket.customerPhone || ticket.customer_phone || '+91 98765 43210';
    phoneCallService.callNumber(phone, ticket.customerName);
  };

  const handleChatCustomer = () => {
    navigation.navigate('TechnicianChat', {
      customerName: ticket.customerName,
      requestId: ticket.id || ticket.ticketNumber,
    });
  };

  const handleAddPartWork = () => {
    navigation.navigate('AdditionalWorkApproval', {
      requestId: ticket.id || ticket.ticketNumber,
      request: ticket,
    });
  };

  const handleMarkComplete = () => {
    setPinError(null);
    setSecurityPinInput('');
    setPinModalVisible(true);
  };

  const handleVerifyPinAndComplete = async () => {
    if (!securityPinInput || securityPinInput.trim().length !== 4) {
      setPinError('Please enter the 4-digit PIN provided by the customer.');
      return;
    }

    try {
      setIsVerifyingPin(true);
      setPinError(null);
      const targetJobId =
        ticket.id ||
        ticket.jobId ||
        ticket.requestId ||
        ticket.ticketNumber ||
        ticket.trackingCode ||
        ticket.tracking_code ||
        passedId;

      if (!targetJobId) {
        setPinError('Unable to identify active service request. Please retry.');
        setIsVerifyingPin(false);
        return;
      }

      const res = await technicianApi.updateJobStatus(
        String(targetJobId),
        'completed',
        'Service inspection and repair completed successfully.',
        securityPinInput.trim()
      );

      if (!res.success) {
        setPinError(res.error || 'Incorrect Security PIN. Please obtain the 4-digit PIN from the customer.');
        setIsVerifyingPin(false);
        return;
      }

      setPinModalVisible(false);
      const updated = {
        ...ticket,
        id: targetJobId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
      };

      setAcceptedRequest(updated);

      navigation.navigate('JobCompleted', {
        requestId: targetJobId || ticket.ticketNumber,
        request: updated,
      });
    } catch (err: any) {
      setPinError(sanitizeUserErrorMessage(err) || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleAddPhotoLog = () => {
    Alert.alert(
      'Diagnostic Photo Log',
      'Select photo source to document repair milestones:',
      [
        { text: 'Take New Photo', onPress: () => Alert.alert('Photo Log Added', 'Pre-repair inspection photo saved to ticket log.') },
        { text: 'Choose from Library', onPress: () => Alert.alert('Photo Log Added', 'Diagnostic attachment saved.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Fixed Header Bar */}
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
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Active Job
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
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Strip / Quick Telemetry */}
        <View style={styles.telemetryStrip}>
          <View style={styles.ticketRefGroup}>
            <Text style={styles.ticketRefLabel}>Ticket Ref</Text>
            <View style={styles.ticketRefBadge}>
              <Text style={styles.ticketRefText}>
                {ticket.ticketNumber || 'REQ-8492'}
              </Text>
            </View>
          </View>

          <View style={styles.liveDispatchBadge}>
            <View style={styles.livePingDot} />
            <Text style={styles.liveDispatchText}>Live Dispatch</Text>
          </View>
        </View>

        {/* Customer & Order Header Card */}
        <View style={styles.customerOrderCard}>
          {/* Ambient decorative gradient bar */}
          <View style={styles.ambientTopGradient} />

          <View style={styles.customerHeaderRow}>
            <View style={styles.customerInfoCol}>
              <View style={styles.customerNameRating}>
                <Text style={styles.customerName}>
                  {ticket.customerName || 'Ansh Kumar'}
                </Text>
                <View style={styles.ratingBadge}>
                  <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingValue}>
                    {ticket.customerRating ? ticket.customerRating.toFixed(1) : '4.9'}
                  </Text>
                </View>
              </View>
              <Text style={styles.serviceSubtitle}>
                {ticket.serviceTitle || 'Office Chair Repair'} • {ticket.dispatchType || 'Standard Dispatch'}
              </Text>
            </View>

            {/* Quick Action Icons */}
            <View style={styles.quickActionGroup}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCallCustomer}
                activeOpacity={0.8}
                accessibilityLabel="Call Customer"
              >
                <AppIcon name="Phone" size={18} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleChatCustomer}
                activeOpacity={0.8}
                accessibilityLabel="Chat with Customer"
              >
                <AppIcon name="MessageCircle" size={18} />
                <View style={styles.chatUnreadPip} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Asset Pill Spec Sheet Details */}
          <View style={styles.assetPillSheet}>
            <View style={styles.chairTitleRow}>
              <AppIcon name="Armchair" size={18} />
              <Text style={styles.chairNameText}>
                {ticket.chairModel || 'Herman Miller Aeron'}
              </Text>
              <View style={styles.chairSizeBadge}>
                <Text style={styles.chairSizeText}>
                  {ticket.chairSize || 'Size B'}
                </Text>
              </View>
            </View>

            <View style={styles.chairSpecRow}>
              <AppIcon name="Settings" size={18} />
              <Text style={styles.chairSpecText} numberOfLines={1}>
                {ticket.chairConfig || 'Classic Pellicle Graphite • Fully Loaded Tilt'}
              </Text>
            </View>
          </View>

          {/* Location Pin */}
          <View style={styles.locationRow}>
            <AppIcon name="MapPin" size={18} />
            <Text style={styles.locationText} numberOfLines={1}>
              {ticket.locationShort || 'Flat 402, Palm Springs Residences, Sector 54'}
            </Text>
          </View>

          {/* Booked Service Price Banner */}
          <View style={styles.bookedPriceStrip}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="Tag" size={15} color="#15803D" />
              <Text style={styles.bookedPriceLabel}>BOOKED SERVICE PRICE:</Text>
              <Text style={styles.bookedPriceValue}>₹{ticket.totalAmount || (ticket as any).total || 599}</Text>
            </View>
            <View style={styles.paymentMethodPill}>
              <Text style={styles.paymentMethodText}>
                {ticket.isPaid ? 'Prepaid Online' : 'Pay After Fix'}
              </Text>
            </View>
          </View>
        </View>

        {/* Live Service Timer Card (Digital Precision) */}
        <View style={styles.liveTimerCard}>
          <View style={styles.timerHeaderRow}>
            <View style={styles.timerTitleGroup}>
              <View style={styles.pulsingGreenDot} />
              <Text style={styles.timerHeaderTitle}>
                Service Time Elapsed
              </Text>
            </View>
            <View style={styles.slaBadge}>
              <Text style={styles.slaBadgeText}>SLA: 45-60 MIN</Text>
            </View>
          </View>

          <View style={styles.timerMainRow}>
            <Text style={styles.digitalTimerNumber}>
              {formatTimer(elapsedSeconds)}
            </Text>
            <Text style={styles.activeLogTag}>ACTIVE LOG</Text>
          </View>

          {/* Wave / Pulse Precision Telemetry Bar */}
          <View style={styles.telemetryBarRow}>
            <View style={styles.equalizerPod}>
              <Animated.View style={[styles.eqBar, { height: waveAnim1, backgroundColor: Colors.secondaryCobalt }]} />
              <Animated.View style={[styles.eqBar, { height: waveAnim2, backgroundColor: Colors.secondaryContainer }]} />
              <Animated.View style={[styles.eqBar, { height: waveAnim3, backgroundColor: Colors.secondaryCobalt }]} />
              <Animated.View style={[styles.eqBar, { height: waveAnim4, backgroundColor: Colors.tertiaryFixed }]} />
              <Animated.View style={[styles.eqBar, { height: waveAnim2, backgroundColor: Colors.secondaryCobalt }]} />
              <Animated.View style={[styles.eqBar, { height: waveAnim1, backgroundColor: Colors.secondaryContainer }]} />
            </View>
            <Text style={styles.telemetryStreamText}>
              Mechanic telemetry stream active • Pace on schedule
            </Text>
          </View>
        </View>

        {/* Job Progress Stepper (Execution Workflow) */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperHeaderRow}>
            <Text style={styles.stepperTitle}>Execution Workflow</Text>
            <Text style={styles.stageTag}>Stage 3 of 5</Text>
          </View>

          {/* Stepper Progression Track */}
          <View style={styles.stepperTrack}>
            <View style={styles.stepperLineBase} />
            <View style={styles.stepperLineActive} />

            {/* Node 1: Arrived */}
            <View style={styles.stepNode}>
              <View style={styles.nodeCircleCompleted}>
                <AppIcon name="Check" size={18} />
              </View>
              <Text style={styles.nodeLabelBold}>Arrived</Text>
              <Text style={styles.nodeTime}>02:26 PM</Text>
            </View>

            {/* Node 2: Inspect */}
            <View style={styles.stepNode}>
              <View style={styles.nodeCircleCompleted}>
                <AppIcon name="Check" size={18} />
              </View>
              <Text style={styles.nodeLabelBold}>Inspect</Text>
              <Text style={styles.nodeTime}>02:35 PM</Text>
            </View>

            {/* Node 3: Repair (Current Active) */}
            <View style={styles.stepNode}>
              <View style={styles.nodeCircleActive}>
                <View style={styles.nodeActiveInnerDot} />
              </View>
              <Text style={styles.nodeLabelActive}>Repair</Text>
              <Text style={styles.nodeTimeActive}>In Progress</Text>
            </View>

            {/* Node 4: Testing */}
            <View style={styles.stepNode}>
              <View style={styles.nodeCirclePending}>
                <View style={styles.nodePendingDot} />
              </View>
              <Text style={styles.nodeLabelPending}>Testing</Text>
              <Text style={styles.nodeTimePending}>Pending</Text>
            </View>

            {/* Node 5: Complete */}
            <View style={styles.stepNode}>
              <View style={styles.nodeCirclePending}>
                <View style={styles.nodePendingDot} />
              </View>
              <Text style={styles.nodeLabelPending}>Complete</Text>
              <Text style={styles.nodeTimePending}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Current Milestone Checklist Card */}
        <View style={styles.milestoneCard}>
          <View style={styles.milestoneHeaderRow}>
            <View>
              <Text style={styles.milestoneTag}>CURRENT MILESTONE</Text>
              <Text style={styles.milestoneTitle}>
                Synchron-Tilt & Cylinder Rebuild
              </Text>
            </View>
            <AppIcon name="Wrench" size={18} />
          </View>

          <View style={styles.milestoneTasksList}>
            {/* Task 1: Done */}
            <View style={styles.taskItemDone}>
              <View style={styles.taskCheckBadgeDone}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.taskTextCol}>
                <Text style={styles.taskTitleDone}>
                  Inspect synchron-tilt mechanism & casing
                </Text>
                <Text style={styles.taskDescDone}>
                  Tension dial checked, outer housing cleared of friction debris.
                </Text>
              </View>
            </View>

            {/* Task 2: Done */}
            <View style={styles.taskItemDone}>
              <View style={styles.taskCheckBadgeDone}>
                <AppIcon name="Check" size={18} />
              </View>
              <View style={styles.taskTextCol}>
                <Text style={styles.taskTitleDone}>Identify root issue</Text>
                <Text style={styles.taskDescDone}>
                  Worn tilt clutch plate & internal pneumatic seal drop confirmed.
                </Text>
              </View>
            </View>

            {/* Task 3: Active Highlight */}
            <View style={styles.taskItemActive}>
              <View style={styles.taskPulseBadgeActive}>
                <View style={styles.taskActiveDot} />
              </View>
              <View style={styles.taskTextCol}>
                <View style={styles.taskActiveHeader}>
                  <Text style={styles.taskTitleActive}>
                    Replace & calibrate damaged parts
                  </Text>
                  <View style={styles.activeBadgePill}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.taskDescActive}>
                  Aligning dual-action tilt lock fulcrum and resetting retaining clips.
                </Text>
              </View>
            </View>

            {/* Task 4: Toggleable */}
            <TouchableOpacity
              style={[
                styles.taskItemPending,
                stabilityTestCompleted && styles.taskItemDone,
              ]}
              onPress={() => setStabilityTestCompleted(!stabilityTestCompleted)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.taskCheckBadgePending,
                  stabilityTestCompleted && styles.taskCheckBadgeDone,
                ]}
              >
                <Text style={styles.taskCheckGlyph}>
                  <AppIcon name={stabilityTestCompleted ? 'Check' : 'Clock'} size={14} color={stabilityTestCompleted ? '#059669' : Colors.onSurfaceVariant} />
                </Text>
              </View>
              <View style={styles.taskTextCol}>
                <Text
                  style={[
                    styles.taskTitlePending,
                    stabilityTestCompleted && styles.taskTitleDone,
                  ]}
                >
                  110kg Dynamic Load & Tilt Stability Test
                </Text>
                <Text style={styles.taskDescPending}>
                  Multi-angle lock engagement check under simulated weight load.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Diagnostic Visual Attachment / Spec Verification Tile */}
        <View style={styles.diagnosticsCard}>
          <View style={styles.diagnosticsHeaderRow}>
            <Text style={styles.diagnosticsTitle}>Mechanical Diagnostics</Text>
            <View style={styles.verifiedSpecGroup}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.verifiedSpecText}>Class 4 Cylinder</Text>
            </View>
          </View>

          <View style={styles.diagPhotoGrid}>
            <View style={styles.diagPhotoTile}>
              <View style={styles.diagPhotoPlaceholder}>
                <AppIcon name="Wrench" size={18} />
                <Text style={styles.diagPhotoSub}>Pneumatic Housing</Text>
              </View>
              <View style={styles.diagPhotoTag}>
                <Text style={styles.diagTagText}>Pre-Repair</Text>
              </View>
            </View>

            <View style={styles.diagPhotoTile}>
              <View style={styles.diagPhotoPlaceholder}>
                <AppIcon name="Settings" size={18} />
                <Text style={styles.diagPhotoSub}>Fulcrum Calibration</Text>
              </View>
              <View style={styles.diagPhotoTag}>
                <Text style={styles.diagTagText}>Live Replacement</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Parts or Work Approval Section */}
        <View style={styles.additionalWorkCard}>
          <View style={styles.additionalHeaderRow}>
            <View style={styles.additionalLeftHeader}>
              <View style={styles.cartIconPod}>
                <AppIcon name="ShoppingCart" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.additionalTitle}>Additional Parts or Work</Text>
                <Text style={styles.scopeTag}>Scope Authorization Required</Text>
              </View>
            </View>
            <View style={styles.itemsCountBadge}>
              <Text style={styles.itemsCountText}>0 items</Text>
            </View>
          </View>

          <View style={styles.additionalNoticeBox}>
            <AppIcon name="Info" size={18} />
            <Text style={styles.additionalNoticeText}>
              Customer approval is required before charging for additional work or
              installing non-standard replacement parts.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addWorkBtn}
            onPress={handleAddPartWork}
            activeOpacity={0.8}
          >
            <Text style={styles.addWorkPlusIcon}>⊕</Text>
            <Text style={styles.addWorkBtnText}>Add Part / Work Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryCompleteBtn}
          onPress={handleMarkComplete}
          activeOpacity={0.88}
        >
          <Text style={styles.completeBtnText}>Mark Service Complete</Text>
          <Text style={styles.completeBtnArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={styles.secondarySubBtn}
            onPress={handleCallCustomer}
            activeOpacity={0.8}
          >
            <AppIcon name="Phone" size={18} />
            <Text style={styles.subBtnText}>Contact Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondarySubBtn}
            onPress={handleAddPhotoLog}
            activeOpacity={0.8}
          >
            <AppIcon name="Camera" size={18} />
            <Text style={styles.subBtnText}>Add Photo Log</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Work Completion Security PIN Verification Modal */}
      <Modal
        visible={pinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pinModalCard}>
            <View style={styles.pinModalHeader}>
              <View style={styles.pinShieldBadge}>
                <AppIcon name="ShieldCheck" size={24} color="#15803D" />
              </View>
              <Text style={styles.pinModalTitle}>Verify Customer PIN</Text>
              <Text style={styles.pinModalSubtitle}>
                Ask customer for their 4-digit Security PIN displayed on their dashboard to complete this service.
              </Text>
            </View>

            <View style={styles.pinInputWrapper}>
              <TextInput
                style={[
                  styles.pinTextInput,
                  pinError ? { borderColor: '#DC2626', backgroundColor: '#FEF2F2' } : null,
                ]}
                value={securityPinInput}
                onChangeText={(text) => {
                  setSecurityPinInput(text.replace(/[^0-9]/g, '').slice(0, 4));
                  if (pinError) setPinError(null);
                }}
                placeholder="••••"
                placeholderTextColor={Colors.onSurfaceVariant}
                keyboardType="numeric"
                maxLength={4}
                autoFocus
              />
            </View>

            {pinError ? (
              <View style={styles.pinErrorBanner}>
                <AppIcon name="AlertCircle" size={16} color="#DC2626" />
                <Text style={styles.pinErrorText}>{pinError}</Text>
              </View>
            ) : (
              <View style={styles.pinSecurityNotice}>
                <AppIcon name="Lock" size={13} color="#64748B" />
                <Text style={styles.pinSecurityNoticeText}>
                  Completion locked: Service cannot be completed without customer's matching PIN.
                </Text>
              </View>
            )}

            <View style={styles.pinModalActions}>
              <TouchableOpacity
                style={styles.pinCancelBtn}
                onPress={() => {
                  setPinModalVisible(false);
                  setPinError(null);
                }}
                disabled={isVerifyingPin}
              >
                <Text style={styles.pinCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pinConfirmBtn,
                  (isVerifyingPin || securityPinInput.trim().length !== 4) && {
                    opacity: 0.45,
                    backgroundColor: '#94A3B8',
                  },
                ]}
                onPress={handleVerifyPinAndComplete}
                disabled={isVerifyingPin || securityPinInput.trim().length !== 4}
              >
                <Text style={styles.pinConfirmText}>
                  {isVerifyingPin ? 'Verifying...' : 'Verify & Complete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
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
  backBtnIcon: {
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 12,
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  ticketRefGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketRefLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ticketRefBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ticketRefText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  liveDispatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  livePingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  liveDispatchText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textTransform: 'uppercase',
  },
  customerOrderCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  ambientTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  customerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  customerInfoCol: {
    flex: 1,
  },
  customerNameRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  starIcon: {
    fontSize: 9,
  },
  ratingValue: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  serviceSubtitle: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  quickActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  chatUnreadPip: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.secondaryCobalt,
  },
  assetPillSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 6,
  },
  chairTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chairIcon: {
    fontSize: 16,
  },
  chairNameText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairSizeBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  chairSizeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairSpecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tuneIcon: {
    fontSize: 13,
  },
  chairSpecText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 2,
  },
  pinIcon: {
    fontSize: 14,
  },
  locationText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
    flex: 1,
  },
  liveTimerCard: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    ...Shadows.level2,
  },
  timerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerHeaderTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  slaBadge: {
    backgroundColor: 'rgba(0, 33, 19, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  slaBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.tertiaryFixed,
  },
  timerMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginVertical: 4,
  },
  digitalTimerNumber: {
    ...Typography.headlineLg,
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  activeLogTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
  },
  telemetryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  equalizerPod: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 22,
    gap: 3,
  },
  eqBar: {
    width: 3.5,
    borderRadius: 2,
  },
  telemetryStreamText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onPrimaryContainer,
    flex: 1,
  },
  stepperCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stageTag: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  stepperTrack: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  stepperLineBase: {
    position: 'absolute',
    top: 17,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  stepperLineActive: {
    position: 'absolute',
    top: 17,
    left: 20,
    width: '50%',
    height: 2,
    backgroundColor: Colors.secondaryCobalt,
  },
  stepNode: {
    alignItems: 'center',
    zIndex: 10,
    width: 58,
  },
  nodeCircleCompleted: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.level1,
  },
  nodeCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  nodeCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.secondaryCobalt,
    borderWidth: 3,
    borderColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Shadows.level1,
  },
  nodeActiveInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  nodeCirclePending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  nodePendingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.outline,
  },
  nodeLabelBold: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  nodeTime: {
    ...Typography.labelMono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
  },
  nodeLabelActive: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  nodeTimeActive: {
    ...Typography.labelMono,
    fontSize: 8.5,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  nodeLabelPending: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  nodeTimePending: {
    ...Typography.labelMono,
    fontSize: 8.5,
    color: Colors.outline,
  },
  milestoneCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  milestoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  milestoneTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  milestoneTitle: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    marginTop: 2,
  },
  toolIconHeader: {
    fontSize: 20,
  },
  milestoneTasksList: {
    gap: 8,
  },
  taskItemDone: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
  },
  taskCheckBadgeDone: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskCheckGlyph: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitleDone: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurface,
    textDecorationLine: 'line-through',
    opacity: 0.75,
  },
  taskDescDone: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
    opacity: 0.8,
  },
  taskItemActive: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
  },
  taskPulseBadgeActive: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  taskActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskTitleActive: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.onSurface,
    flex: 1,
  },
  activeBadgePill: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeBadgeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskDescActive: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 15,
  },
  taskItemPending: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    opacity: 0.75,
  },
  taskCheckBadgePending: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskTitlePending: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  taskDescPending: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  diagnosticsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  diagnosticsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diagnosticsTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  verifiedSpecGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedCheck: {
    fontSize: 12,
    color: '#009668',
    fontWeight: '900',
  },
  verifiedSpecText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#009668',
  },
  diagPhotoGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  diagPhotoTile: {
    flex: 1,
    height: 100,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  diagPhotoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  diagPhotoIcon: {
    fontSize: 24,
  },
  diagPhotoSub: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  diagPhotoTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diagTagText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  additionalWorkCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 10,
    ...Shadows.level1,
  },
  additionalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  additionalLeftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cartIconPod: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 16,
  },
  additionalTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  scopeTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.outline,
  },
  itemsCountBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  itemsCountText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  additionalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  infoIcon: {
    fontSize: 13,
    marginTop: 1,
  },
  additionalNoticeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 15,
  },
  addWorkBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLowest,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.level1,
  },
  addWorkPlusIcon: {
    fontSize: 16,
    color: Colors.secondaryCobalt,
    fontWeight: '800',
  },
  addWorkBtnText: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceContainerHigh,
    ...Shadows.level3,
  },
  primaryCompleteBtn: {
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
  completeBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  completeBtnArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondarySubBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainer,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  subBtnIcon: {
    fontSize: 14,
  },
  subBtnText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  pinModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.level3,
  },
  pinModalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pinShieldBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  pinModalTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  pinModalSubtitle: {
    ...Typography.bodySm,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  pinInputWrapper: {
    marginBottom: Spacing.md,
  },
  pinTextInput: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 6,
    color: Colors.onSurface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  pinErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  pinErrorText: {
    ...Typography.bodySm,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  pinSecurityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  pinSecurityNoticeText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    flex: 1,
  },
  pinModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  pinCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCancelText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  pinConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  pinConfirmText: {
    ...Typography.bodyMedium,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bookedPriceStrip: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookedPriceLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  bookedPriceValue: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  paymentMethodPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  paymentMethodText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
});
