import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { AppIcon } from '../common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { customerApi } from '../../services/api/customerApi';

export interface DisputeTicketModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (ticketData: any) => void;
  requestId: string;
  trackingCode?: string;
  chairModel?: string;
  technicianName?: string;
  technicianAvatar?: string;
}

const DISPUTE_CATEGORIES = [
  {
    id: 'quality',
    title: 'Workmanship / Repair Quality',
    icon: 'Wrench',
    sub: 'Chair still wobbles, sinking piston, improper parts',
  },
  {
    id: 'behavior',
    title: 'Technician Misconduct',
    icon: 'UserX',
    sub: 'Unprofessional behavior, no-show, or tardiness',
  },
  {
    id: 'billing',
    title: 'Billing / Overcharging',
    icon: 'CreditCard',
    sub: 'Charged extra fees, invoice mismatch, cash dispute',
  },
  {
    id: 'damage',
    title: 'Property or Chair Damage',
    icon: 'AlertTriangle',
    sub: 'Damaged casters, torn fabric, scratched flooring',
  },
];

const PRIORITIES: { id: 'medium' | 'high' | 'urgent'; label: string; color: string }[] = [
  { id: 'medium', label: 'Medium Priority', color: Colors.secondaryCobalt },
  { id: 'high', label: 'High Priority (Grievance)', color: '#d97706' },
  { id: 'urgent', label: 'Urgent (Safety / Damage)', color: '#ba1a1a' },
];

export const DisputeTicketModal: React.FC<DisputeTicketModalProps> = ({
  visible,
  onClose,
  onSuccess,
  requestId,
  trackingCode,
  chairModel,
  technicianName,
  technicianAvatar,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(DISPUTE_CATEGORIES[0].id);
  const [selectedPriority, setSelectedPriority] = useState<'medium' | 'high' | 'urgent'>('high');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<{
    ticketCode: string;
    disputeId: string;
  } | null>(null);

  const handleResetAndClose = () => {
    setReason('');
    setErrorMessage(null);
    setCreatedTicket(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMessage('Please describe the issue in at least 5 characters.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const activeCat = DISPUTE_CATEGORIES.find((c) => c.id === selectedCategory);
      const res = await customerApi.raiseDispute({
        requestId,
        subject: activeCat?.title || 'Customer Service Dispute',
        category: selectedCategory,
        reason: reason.trim(),
        priority: selectedPriority,
      });

      if (res.success && res.data) {
        setCreatedTicket({
          ticketCode: res.data.ticketCode || 'TKT-8941',
          disputeId: res.data.disputeId || 'DSP-01',
        });
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        setErrorMessage(res.error || 'Failed to submit dispute ticket. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while filing dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleResetAndClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={handleResetAndClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          {createdTicket ? (
            /* Success confirmation card */
            <View style={styles.successContainer}>
              <View style={styles.successIconBubble}>
                <AppIcon name="ShieldCheck" size={40} color="#059669" />
              </View>
              <Text style={styles.successTitle}>Dispute Ticket Registered</Text>
              <Text style={styles.successSubtitle}>
                Your complaint has been submitted to the ChairCare Administration grievance desk.
              </Text>

              <View style={styles.ticketSummaryBox}>
                <View style={styles.ticketSummaryRow}>
                  <Text style={styles.ticketSummaryLabel}>Support Ticket ID:</Text>
                  <Text style={styles.ticketSummaryVal}>{createdTicket.ticketCode}</Text>
                </View>
                <View style={styles.ticketSummaryRow}>
                  <Text style={styles.ticketSummaryLabel}>Dispute Ledger Ref:</Text>
                  <Text style={styles.ticketSummaryVal}>
                    DSP-{createdTicket.disputeId.slice(0, 5).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ticketSummaryRow}>
                  <Text style={styles.ticketSummaryLabel}>Escrow Status:</Text>
                  <View style={styles.frozenTag}>
                    <Text style={styles.frozenTagText}>Escrow Frozen</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.successNote}>
                An administrator will review the technician’s activity history and inspect job telemetry
                within 2-4 business hours.
              </Text>

              <TouchableOpacity style={styles.doneBtn} onPress={handleResetAndClose} activeOpacity={0.88}>
                <Text style={styles.doneBtnText}>Return to Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Dispute Intake Form */
            <View style={styles.formContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.disputeIconBox}>
                    <AppIcon name="AlertTriangle" size={18} color="#ba1a1a" />
                  </View>
                  <View>
                    <Text style={styles.modalHeading}>Raise Issue / Dispute</Text>
                    <Text style={styles.modalSubheading}>
                      Ref #{trackingCode || 'SERVICE'} • {chairModel || 'Office Ergonomic Chair'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={handleResetAndClose} activeOpacity={0.7}>
                  <AppIcon name="X" size={18} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollInner}
                showsVerticalScrollIndicator={false}
              >
                {/* Specialist Info Strip */}
                {technicianName && (
                  <View style={styles.techInfoStrip}>
                    <Image
                      source={{
                        uri:
                          technicianAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                      }}
                      style={styles.techThumb}
                    />
                    <View style={styles.techInfoText}>
                      <Text style={styles.techNameLabel}>Assigned Specialist</Text>
                      <Text style={styles.techNameVal}>{technicianName}</Text>
                    </View>
                    <View style={styles.arbBadge}>
                      <Text style={styles.arbBadgeText}>Arbitration Protected</Text>
                    </View>
                  </View>
                )}

                {/* Dispute Category Picker */}
                <Text style={styles.sectionLabel}>Select Issue Category</Text>
                <View style={styles.categoryGrid}>
                  {DISPUTE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                        onPress={() => setSelectedCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.categoryCardHeader}>
                          <AppIcon
                            name={cat.icon}
                            size={16}
                            color={isSelected ? Colors.secondaryCobalt : Colors.onSurfaceVariant}
                          />
                          <Text
                            style={[
                              styles.categoryTitle,
                              isSelected && styles.categoryTitleSelected,
                            ]}
                          >
                            {cat.title}
                          </Text>
                        </View>
                        <Text style={styles.categorySub}>{cat.sub}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Priority Selector */}
                <Text style={styles.sectionLabel}>Severity Level</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map((p) => {
                    const isSelected = selectedPriority === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          styles.priorityPill,
                          isSelected && { borderColor: p.color, backgroundColor: `${p.color}15` },
                        ]}
                        onPress={() => setSelectedPriority(p.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                        <Text
                          style={[
                            styles.priorityPillText,
                            isSelected && { color: p.color, fontWeight: '700' },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Description Textarea */}
                <Text style={styles.sectionLabel}>Describe the Dispute in Detail</Text>
                <View style={styles.textareaWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Provide specific details of what went wrong, technician conduct, damages, or discrepancies..."
                    placeholderTextColor={Colors.outline}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                  />
                  <Text style={styles.charCount}>{reason.length}/500</Text>
                </View>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <AppIcon name="AlertCircle" size={14} color="#ba1a1a" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Escrow Guarantee Notice */}
                <View style={styles.guaranteeBox}>
                  <AppIcon name="ShieldAlert" size={18} color={Colors.secondaryCobalt} />
                  <Text style={styles.guaranteeText}>
                    Submitting creates a live claim in the ChairCare Administrator portal. Payment payouts to
                    the technician are placed on hold until an administrative officer reviews this case.
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleResetAndClose}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.88}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <AppIcon name="Send" size={15} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Submit Dispute Ticket</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.level3,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    maxHeight: '90%',
  },
  formContent: {
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLow,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  disputeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeading: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalSubheading: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollInner: {
    padding: 18,
    gap: 12,
  },
  techInfoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  techThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  techInfoText: {
    flex: 1,
  },
  techNameLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  techNameVal: {
    ...Typography.titleMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  arbBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  arbBadgeText: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  sectionLabel: {
    ...Typography.labelLg,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 4,
  },
  categoryGrid: {
    gap: 8,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 4,
  },
  categoryCardSelected: {
    borderColor: Colors.secondaryCobalt,
    backgroundColor: '#eff6ff',
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  categoryTitleSelected: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  categorySub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    paddingLeft: 24,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  priorityPillText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  textareaWrapper: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    padding: 10,
    minHeight: 100,
  },
  textInput: {
    fontSize: 13,
    color: Colors.onSurface,
    minHeight: 70,
    lineHeight: 18,
  },
  charCount: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: 12,
    color: '#ba1a1a',
    fontWeight: '600',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.md,
  },
  guaranteeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  cancelBtnText: {
    ...Typography.labelLg,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ba1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    ...Typography.labelLg,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },
  successIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  successTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  successSubtitle: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  ticketSummaryBox: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 8,
    marginVertical: 6,
  },
  ticketSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketSummaryLabel: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  ticketSummaryVal: {
    ...Typography.titleMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  frozenTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  frozenTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  successNote: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    ...Typography.titleMd,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
});
