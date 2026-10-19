import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { TechnicianHeaderAvatar } from '../../components/common/TechnicianHeaderAvatar';
import { useTechnician } from '../../context/TechnicianContext';

interface AdditionalWorkApprovalProps {
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      jobId?: string;
      request?: any;
    };
  };
}

export const AdditionalWorkApprovalChaircareMobileScreen: React.FC<
  AdditionalWorkApprovalProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest, setAcceptedRequest } = useTechnician();

  const passedRequest = route?.params?.request || acceptedRequest;
  const passedId = route?.params?.requestId || route?.params?.jobId;

  // Selected request context
  const ticket = passedRequest || {
    id: passedId || 'ticket-8492',
    ticketNumber: passedId?.includes('REQ') ? passedId : 'REQ-8492',
    jobCode: 'CC-84920',
    serviceTitle: 'Office Chair Repair',
    baseRate: 499,
    status: 'in_progress',
  };

  const baseRate = ticket.baseRate || 499;

  // Form State
  const [partName, setPartName] = useState(
    'Class-4 Hydraulic Gas Lift Cylinder (Heavy Duty OEM)'
  );
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState('250');
  const [techNotes, setTechNotes] = useState(
    'The existing hydraulic cylinder has an internal nitrogen seal puncture causing slow sink under normal body weight. Replacing with BIFMA Class-4 OEM cylinder is essential to restore height lock.'
  );

  // Photos State
  const [photos, setPhotos] = useState<
    Array<{ id: string; tag: string; label: string; icon: string }>
  >([
    { id: '1', tag: 'SEAL_FAIL', label: 'Degraded Piston Gasket', icon: 'Search' },
    { id: '2', tag: 'SPEC_OEM', label: 'BIFMA Class-4 Stamp', icon: 'Settings' },
  ]);

  // Submission / Approval State: 'idle' | 'transmitting' | 'sent'
  const [submitState, setSubmitState] = useState<'idle' | 'transmitting' | 'sent'>('idle');
  const [showToast, setShowToast] = useState(false);

  // Cost calculations
  const parsedUnitCost = parseFloat(unitCost) || 0;
  const additionalPartsCost = parsedUnitCost * quantity;
  const newTotalEstimate = baseRate + additionalPartsCost;

  const handleDecreaseQty = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  const handleIncreaseQty = () => {
    setQuantity((q) => q + 1);
  };

  const handleAddProof = () => {
    Alert.alert(
      'Attach Diagnostic Evidence',
      'Choose image source for technician scope authorization:',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            const newPhoto = {
              id: `photo-${Date.now()}`,
              tag: 'DIAG_PROOF',
              label: 'Wear Evidence',
              icon: 'Camera',
            };
            setPhotos((prev) => [...prev, newPhoto]);
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            const newPhoto = {
              id: `photo-${Date.now()}`,
              tag: 'DIAG_PROOF',
              label: 'Component Spec',
              icon: 'Image',
            };
            setPhotos((prev) => [...prev, newPhoto]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSendApproval = () => {
    if (!partName.trim()) {
      Alert.alert('Required Field', 'Please specify the part or service name.');
      return;
    }
    if (additionalPartsCost <= 0) {
      Alert.alert('Required Field', 'Please enter a valid estimated cost.');
      return;
    }

    setSubmitState('transmitting');

    setTimeout(() => {
      setSubmitState('sent');
      setShowToast(true);

      // Record additional work item in request state as pending approval
      const additionalWorkItem = {
        partName,
        quantity,
        unitCost: parsedUnitCost,
        totalCost: additionalPartsCost,
        reason: techNotes,
        status: 'pending_approval',
        requestedAt: new Date().toISOString(),
      };

      const updatedRequest = {
        ...ticket,
        additionalWork: additionalWorkItem,
        estimatedTotal: newTotalEstimate,
      };

      setAcceptedRequest(updatedRequest);

      // Auto dismiss toast after 3s and return to active job
      setTimeout(() => {
        setShowToast(false);
        Alert.alert(
          'Approval Sent',
          'Authorization request dispatched to customer. You will be notified immediately when customer approves.',
          [
            {
              text: 'Return to Job',
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('ActiveJob', {
                    requestId: ticket.id,
                    request: updatedRequest,
                  });
                }
              },
            },
          ]
        );
      }, 1200);
    }, 1000);
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
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
                navigation.navigate('ActiveJob');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Additional Work Approval
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
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Context Bar */}
        <View style={styles.jobContextBar}>
          <View style={styles.jobIdGroup}>
            <AppIcon name="ShieldCheck" size={18} />
            <Text style={styles.jobIdText}>
              JOB ID #{ticket.jobCode || 'CC-84920'}
            </Text>
          </View>
          <View style={styles.approvalRequiredBadge}>
            <AppIcon name="Clock" size={18} />
            <Text style={styles.approvalRequiredText}>Approval Required</Text>
          </View>
        </View>

        {/* Technician Protocol Hero Card */}
        <View style={styles.protocolHeroCard}>
          <View style={styles.protocolIconPod}>
            <AppIcon name="Wrench" size={18} />
          </View>
          <View style={styles.protocolTextCol}>
            <View style={styles.protocolTagRow}>
              <AppIcon name="Zap" size={18} />
              <Text style={styles.protocolTagText}>Technician Protocol</Text>
            </View>
            <Text style={styles.protocolHeadline}>Additional work required?</Text>
            <Text style={styles.protocolDesc}>
              Add the required part or work and request customer approval before
              proceeding. The customer will receive an instant in-app prompt to
              authorize or decline.
            </Text>
          </View>
        </View>

        {/* Diagnosis & Component Form */}
        <View style={styles.formCard}>
          <View style={styles.formHeaderRow}>
            <Text style={styles.formHeaderTitle}>
              Diagnosis & Component Form
            </Text>
            <Text style={styles.bifmaTag}>BIFMA Standard</Text>
          </View>

          {/* Part or Service Name */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Part or Service Name <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.labelSubtag}>OEM Grade</Text>
            </View>
            <TextInput
              style={styles.textInputField}
              value={partName}
              onChangeText={setPartName}
              placeholder="e.g. Class-4 Hydraulic Gas Lift Cylinder"
              placeholderTextColor={Colors.onSurfaceVariant}
            />
          </View>

          {/* Quantity & Est Cost Grid */}
          <View style={styles.qtyCostGrid}>
            {/* Quantity */}
            <View style={styles.qtyCol}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <View style={styles.qtyControlBox}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={handleDecreaseQty}
                  activeOpacity={0.7}
                  accessibilityLabel="Decrease quantity"
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValueText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={handleIncreaseQty}
                  activeOpacity={0.7}
                  accessibilityLabel="Increase quantity"
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Est Cost */}
            <View style={styles.costCol}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Est. Cost (₹)</Text>
                <Text style={styles.fixedRateTag}>Fixed Rate</Text>
              </View>
              <View style={styles.currencyInputBox}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.currencyInputField}
                  value={unitCost}
                  onChangeText={setUnitCost}
                  keyboardType="numeric"
                  placeholder="250"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
              </View>
            </View>
          </View>

          {/* Reason / Diagnostics Notes */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Why is this required? <Text style={styles.requiredStar}>*</Text>
              </Text>
              <Text style={styles.labelSubtag}>Diagnostics</Text>
            </View>
            <TextInput
              style={styles.textAreaField}
              value={techNotes}
              onChangeText={setTechNotes}
              placeholder="State diagnostic reason clearly for customer verification..."
              placeholderTextColor={Colors.onSurfaceVariant}
              multiline={true}
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Photo Evidence Attachment */}
          <View style={styles.photoSectionCol}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Photo Evidence Attachment</Text>
              <Text style={styles.labelSubtag}>
                {photos.length} Uploaded
              </Text>
            </View>

            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosScrollRow}
            >
              {photos.map((p) => (
                <View key={p.id} style={styles.photoThumbTile}>
                  <View style={styles.photoThumbPlaceholder}>
                    <AppIcon name={p.icon} size={20} color={Colors.primary} strokeWidth={1.8} />
                    <Text style={styles.photoThumbLabel} numberOfLines={1}>
                      {p.label}
                    </Text>
                  </View>
                  <View style={styles.photoTagBadge}>
                    <Text style={styles.photoTagText}>{p.tag}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.addProofBtn}
                onPress={handleAddProof}
                activeOpacity={0.8}
              >
                <View style={styles.addProofIconPod}>
                  <AppIcon name="Camera" size={18} />
                </View>
                <Text style={styles.addProofBtnText}>Add Proof</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        {/* Cost Calculation Breakdown Card */}
        <View style={styles.costBreakdownCard}>
          <View style={styles.breakdownHeaderRow}>
            <Text style={styles.breakdownHeaderLabel}>
              Additional Component Cost
            </Text>
            <Text style={styles.additionalCostNumber}>
              ₹{additionalPartsCost}
            </Text>
          </View>

          <View style={styles.progressTrackBase}>
            <View style={styles.progressTrackFill} />
          </View>

          <View style={styles.totalRow}>
            <View style={styles.totalLabelGroup}>
              <AppIcon name="Receipt" size={18} color={Colors.onSurfaceVariant} />
              <Text style={styles.newTotalLabel}>New Total Estimate:</Text>
            </View>
            <View style={styles.totalValueGroup}>
              <Text style={styles.grandTotalNumber}>₹{newTotalEstimate}</Text>
              <Text style={styles.basePartsFormula}>
                (Base ₹{baseRate} + Parts ₹{additionalPartsCost})
              </Text>
            </View>
          </View>
        </View>

        {/* Fleet Guarantee Notice Card */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeHeaderRow}>
            <View style={styles.readyPill}>
              <View style={styles.readyPingDot} />
              <Text style={styles.readyPillText}>Ready to Request Approval</Text>
            </View>
            <Text style={styles.fleetStepText}>Fleet Step 2/3</Text>
          </View>
          <Text style={styles.guaranteeBody}>
            <Text style={styles.guaranteeBold}>
              Strict ChairCare Fleet Guarantee:{' '}
            </Text>
            You cannot charge the customer or fit these replacement parts until
            the customer taps ‘Approve’ on their device. Zero unexpected charges
            policy.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity
            style={[
              styles.sendApprovalBtn,
              submitState === 'transmitting' && styles.sendApprovalBtnTransmitting,
              submitState === 'sent' && styles.sendApprovalBtnSent,
            ]}
            onPress={handleSendApproval}
            disabled={submitState !== 'idle'}
            activeOpacity={0.88}
          >
            {submitState === 'idle' && (
              <>
                <Text style={styles.sendApprovalText}>
                  Send for Customer Approval
                </Text>
                <Text style={styles.sendApprovalArrow}>→</Text>
              </>
            )}

            {submitState === 'transmitting' && (
              <View style={styles.transmittingRow}>
                <ActivityIndicator size="small" color={Colors.onPrimary} />
                <Text style={styles.sendApprovalText}>
                  Transmitting Request...
                </Text>
              </View>
            )}

            {submitState === 'sent' && (
              <View style={styles.transmittingRow}>
                <AppIcon name="Check" size={18} />
                <Text style={styles.sendApprovalText}>
                  Request Sent to Client
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelReturnBtn}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('ActiveJob');
              }
            }}
            activeOpacity={0.8}
          >
            <AppIcon name="X" size={18} />
            <Text style={styles.cancelReturnText}>Cancel & Return to Job</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Push Notification Toast */}
      {showToast && (
        <View style={styles.floatingToast}>
          <AppIcon name="Upload" size={18} />
          <Text style={styles.toastText}>
            Approval push notification dispatched to client!
          </Text>
        </View>
      )}
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
    fontSize: 17,
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
  jobContextBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  jobIdGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldIcon: {
    fontSize: 14,
  },
  jobIdText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  approvalRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFDAD6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  pendingActionIcon: {
    fontSize: 10,
  },
  approvalRequiredText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#93000A',
  },
  protocolHeroCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  protocolIconPod: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handymanIcon: {
    fontSize: 22,
  },
  protocolTextCol: {
    flex: 1,
  },
  protocolTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  protocolAlertIcon: {
    fontSize: 12,
  },
  protocolTagText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textTransform: 'uppercase',
  },
  protocolHeadline: {
    ...Typography.headlineSm,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  protocolDesc: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 17,
    marginTop: 3,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 12,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  formHeaderTitle: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bifmaTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    ...Typography.labelMono,
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  requiredStar: {
    color: Colors.error,
  },
  labelSubtag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  textInputField: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
  },
  qtyCostGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  qtyCol: {
    flex: 1,
    gap: 6,
  },
  qtyControlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 6,
    height: 44,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  qtyValueText: {
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  costCol: {
    flex: 1,
    gap: 6,
  },
  fixedRateTag: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#009668',
  },
  currencyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginRight: 4,
  },
  currencyInputField: {
    flex: 1,
    ...Typography.headlineSm,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
    padding: 0,
  },
  textAreaField: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
    minHeight: 70,
    lineHeight: 17,
  },
  photoSectionCol: {
    gap: 8,
    paddingTop: 2,
  },
  photosScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  photoThumbTile: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  photoThumbPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    gap: 2,
  },
  photoThumbIcon: {
    fontSize: 22,
  },
  photoThumbLabel: {
    ...Typography.labelMono,
    fontSize: 8.5,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  photoTagBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  photoTagText: {
    ...Typography.labelMono,
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addProofBtn: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.secondaryCobalt,
  },
  addProofIconPod: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProofCameraIcon: {
    fontSize: 16,
  },
  addProofBtnText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  costBreakdownCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 8,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownHeaderLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  additionalCostNumber: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
  },
  progressTrackBase: {
    height: 4,
    width: '100%',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
    width: '35%',
    backgroundColor: Colors.secondaryCobalt,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptIcon: {
    fontSize: 16,
  },
  newTotalLabel: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  totalValueGroup: {
    alignItems: 'flex-end',
  },
  grandTotalNumber: {
    ...Typography.headlineSm,
    fontSize: 19,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  basePartsFormula: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  guaranteeCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 8,
    ...Shadows.level1,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  guaranteeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  readyPingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  readyPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  fleetStepText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  guaranteeBody: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  guaranteeBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  actionButtonsGroup: {
    gap: 8,
    paddingTop: 4,
  },
  sendApprovalBtn: {
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
  sendApprovalBtnTransmitting: {
    opacity: 0.8,
  },
  sendApprovalBtnSent: {
    backgroundColor: '#002113',
  },
  sendApprovalText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  sendApprovalArrow: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  transmittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentCheckIcon: {
    fontSize: 16,
    color: Colors.tertiaryFixed,
    fontWeight: '800',
  },
  cancelReturnBtn: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 11,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelCrossIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cancelReturnText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  floatingToast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level3,
    zIndex: 100,
  },
  toastSendIcon: {
    fontSize: 14,
  },
  toastText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
});
