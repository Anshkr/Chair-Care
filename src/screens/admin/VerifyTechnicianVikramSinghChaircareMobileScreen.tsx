import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';

interface VerifyTechnicianProps {
  navigation?: any;
  route?: {
    params?: {
      technicianId?: string;
      technician?: any;
    };
  };
}

export const VerifyTechnicianVikramSinghChaircareMobileScreen: React.FC<VerifyTechnicianProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const passedTech = route?.params?.technician;
  const passedId = route?.params?.technicianId;

  // Selected technician details with fallback to canonical Vikram Singh Stitch reference
  const techName = passedTech?.name || 'Vikram Singh';
  const techIdTag = passedTech?.code || '#TK-8820';
  const experienceYears = passedTech?.experienceYears || 4;
  const phone = passedTech?.phone || '+91 98765 43210';
  const email = passedTech?.email || 'vikram.singh@ergomech.in';
  const corridor = passedTech?.corridorLocation || 'Gurugram • Faridabad';
  const avatarUrl =
    passedTech?.avatarUrl ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop';

  const [auditNotes, setAuditNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {
      Alert.alert('Phone Call', `Dialing ${phone}`);
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Email', `Composing email to ${email}`);
    });
  };

  const handleApprove = async () => {
    const targetId = passedId || passedTech?.id || 'tech-03';
    try {
      const res = await adminApi.verifyTechnician(targetId, 'verified');
      if (res.error) {
        Alert.alert('Verification Error', res.error || 'Failed to update technician verification status.');
        return;
      }
      if (navigation) {
        navigation.navigate('TechnicianActionConfirmed', {
          actionType: 'approve',
          actionTitle: 'Technician Verified & Onboarded',
          technicianId: targetId,
          technician: {
            ...passedTech,
            id: targetId,
            name: techName,
            status: 'online',
            isVerified: true,
            verifiedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Connection Error', err.message || 'Unable to communicate with verification backend.');
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Reject Application?',
      `Are you sure you want to reject ${techName}'s application? This action will notify the candidate.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Application',
          style: 'destructive',
          onPress: async () => {
            const targetId = passedId || passedTech?.id || 'tech-03';
            try {
              const res = await adminApi.verifyTechnician(targetId, 'rejected', 'Verification rejected by administrator');
              if (res.error) {
                Alert.alert('Rejection Error', res.error || 'Failed to update technician status.');
                return;
              }
              if (navigation) {
                navigation.navigate('TechnicianActionConfirmed', {
                  actionType: 'reject',
                  actionTitle: 'Technician Application Rejected',
                  technicianId: targetId,
                  technician: {
                    ...passedTech,
                    id: targetId,
                    name: techName,
                    status: 'rejected',
                    isVerified: false,
                  },
                });
              }
            } catch (err: any) {
              Alert.alert('Connection Error', err.message || 'Unable to communicate with backend.');
            }
          },
        },
      ]
    );
  };

  const handleRequestInfo = () => {
    showToast(`SMS request sent to ${techName} to supply document clarification.`);
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('Technicians'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Technician Verification</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => Alert.alert('Audit Tools', 'Download full document bundle (ZIP) or request background check report.')}
            activeOpacity={0.7}
          >
            <AppIcon name="MoreVertical" size={20} />
          </TouchableOpacity>

          <View style={styles.profileAvatarTop}>
            <AppIcon name="User" size={18} />
          </View>
        </View>
      </View>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <AppIcon name="Check" size={18} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Applicant Summary Card */}
        <View style={styles.card}>
          <View style={styles.applicantTopRow}>
            <View style={styles.applicantProfileLeft}>
              <View style={styles.applicantAvatarBox}>
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
              </View>

              <View style={styles.applicantNameCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.applicantNameTitle}>{techName}</Text>
                  <AppIcon name="ShieldCheck" size={18} />
                </View>
                <View style={styles.subMetaRow}>
                  <Text style={styles.techIdMono}>Tech ID: {techIdTag}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.expText}>{experienceYears} yrs exp</Text>
                </View>
              </View>
            </View>

            <View style={styles.pendingAuditBadge}>
              <View style={styles.pulsingBlueDot} />
              <Text style={styles.pendingAuditText}>Pending Audit</Text>
            </View>
          </View>

          {/* Quick Metrics Strip */}
          <View style={styles.quickMetricsStrip}>
            <View style={styles.metricItemCol}>
              <Text style={styles.metricLabelMono}>APPLICATION QUEUE</Text>
              <Text style={styles.metricValueBold}>Applied 2 hrs ago</Text>
            </View>
            <View style={styles.metricItemCol}>
              <Text style={styles.metricLabelMono}>SERVICE CORRIDOR</Text>
              <Text style={styles.metricValueBold} numberOfLines={1}>
                {corridor}
              </Text>
            </View>
          </View>

          {/* Contact & Coverage Triggers */}
          <View style={styles.contactListCol}>
            <TouchableOpacity style={styles.contactTriggerItem} onPress={handleCall} activeOpacity={0.7}>
              <View style={styles.contactItemLeft}>
                <View style={styles.contactIconRoundBlue}>
                  <AppIcon name="Phone" size={18} />
                </View>
                <View>
                  <Text style={styles.contactTriggerLabel}>DIRECT CONTACT</Text>
                  <Text style={styles.contactTriggerValue}>{phone}</Text>
                </View>
              </View>
              <AppIcon name="ChevronRight" size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactTriggerItem} onPress={handleEmail} activeOpacity={0.7}>
              <View style={styles.contactItemLeft}>
                <View style={styles.contactIconRoundGray}>
                  <AppIcon name="Mail" size={18} />
                </View>
                <View>
                  <Text style={styles.contactTriggerLabel}>EMAIL CREDENTIAL</Text>
                  <Text style={styles.contactTriggerValue}>{email}</Text>
                </View>
              </View>
              <AppIcon name="ChevronRight" size={20} />
            </TouchableOpacity>

            <View style={styles.radiusItem}>
              <View style={styles.contactIconRoundBlue}>
                <AppIcon name="Radio" size={18} />
              </View>
              <View>
                <Text style={styles.contactTriggerLabel}>OPERATIONAL RADIUS</Text>
                <Text style={styles.contactTriggerValue}>12 km dispatch zone coverage</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Declared Ergonomic Competencies Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.sectionHeadline}>Declared Specializations</Text>
            <View style={styles.skillCountPill}>
              <Text style={styles.skillCountText}>5 AUDITED SKILLS</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Validated mechanical focus areas for field servicing & hydraulic repairs.
          </Text>

          <View style={styles.skillsPillsWrap}>
            <View style={styles.skillPill}>
              <AppIcon name="Wrench" size={18} />
              <Text style={styles.skillPillText}>Repair</Text>
            </View>
            <View style={styles.skillPill}>
              <AppIcon name="Settings" size={18} />
              <Text style={styles.skillPillText}>Maintenance</Text>
            </View>
            <View style={styles.skillPill}>
              <AppIcon name="Wrench" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.skillPillText}>Installation</Text>
            </View>
            <View style={styles.skillPill}>
              <AppIcon name="Disc" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.skillPillText}>Wheel & Base Replacement</Text>
            </View>
            <View style={styles.skillPill}>
              <AppIcon name="Wrench" size={14} color={Colors.onSurfaceVariant} />
              <Text style={styles.skillPillText}>Pneumatic Gas Struts</Text>
            </View>
          </View>
        </View>

        {/* 4. Audited Compliance Documents */}
        <View style={styles.documentsBlock}>
          <View style={styles.docHeaderRow}>
            <View>
              <Text style={styles.sectionHeadline}>Audited Documents</Text>
              <Text style={styles.docSubtitle}>
                All uploads parsed with optical character validation
              </Text>
            </View>
            <View style={styles.compliantBadge}>
              <Text style={styles.compliantBadgeText}>3 / 3 COMPLIANT</Text>
            </View>
          </View>

          {/* Doc 1: Aadhaar / National ID */}
          <View style={styles.docCard}>
            <View style={styles.docCardInner}>
              <View style={styles.docThumbnail}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=300&auto=format&fit=crop',
                  }}
                  style={styles.docThumbImg}
                  resizeMode="cover"
                />
                <View style={styles.docBadgeOverlay}>
                  <AppIcon name="Award" size={18} />
                </View>
              </View>

              <View style={styles.docMetaCol}>
                <View style={styles.docTitleRow}>
                  <Text style={styles.docTitleText}>National Identity (Aadhaar)</Text>
                  <AppIcon name="Check" size={18} />
                </View>
                <View style={styles.ocrTagRow}>
                  <View style={styles.ocrPill}>
                    <View style={styles.blueMiniDot} />
                    <Text style={styles.ocrText}>OCR SCANNED</Text>
                  </View>
                  <Text style={styles.docIdNumber}>UID: •••• •••• 4912</Text>
                </View>
                <Text style={styles.docDescriptionText} numberOfLines={1}>
                  Name and facial biometric matched against National Portal database.
                </Text>

                <View style={styles.docFooterRow}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Aadhaar Document', 'Biometric & OCR scan audit valid: UID 4912.')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDocLink}>View Document ↗</Text>
                  </TouchableOpacity>
                  <Text style={styles.docFileSize}>PDF • 1.8 MB</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Doc 2: Address Proof */}
          <View style={styles.docCard}>
            <View style={styles.docCardInner}>
              <View style={styles.docThumbnail}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1554415707-9e4c019a0a03?q=80&w=300&auto=format&fit=crop',
                  }}
                  style={styles.docThumbImg}
                  resizeMode="cover"
                />
                <View style={styles.docBadgeOverlay}>
                  <AppIcon name="Receipt" size={14} color={Colors.secondary} />
                </View>
              </View>

              <View style={styles.docMetaCol}>
                <View style={styles.docTitleRow}>
                  <Text style={styles.docTitleText}>Address Proof (Utility Bill)</Text>
                  <AppIcon name="Check" size={18} />
                </View>
                <View style={styles.ocrTagRow}>
                  <View style={styles.ocrPill}>
                    <View style={styles.blueMiniDot} />
                    <Text style={styles.ocrText}>GEO MATCHED</Text>
                  </View>
                  <Text style={styles.docIdNumber}>DHBVN • JUL 2024</Text>
                </View>
                <Text style={styles.docAddressMatched} numberOfLines={1}>
                  Sector 14, Gurugram, Haryana 122001
                </Text>

                <View style={styles.docFooterRow}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Address Proof', 'Utility bill address matched to Gurugram corridor.')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDocLink}>View Document ↗</Text>
                  </TouchableOpacity>
                  <Text style={styles.docFileSize}>JPG • 3.2 MB</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Doc 3: BIFMA Certification */}
          <View style={styles.docCard}>
            <View style={styles.docCardInner}>
              <View style={styles.docThumbnail}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&auto=format&fit=crop',
                  }}
                  style={styles.docThumbImg}
                  resizeMode="cover"
                />
                <View style={styles.docBadgeOverlay}>
                  <AppIcon name="Award" size={18} />
                </View>
              </View>

              <View style={styles.docMetaCol}>
                <View style={styles.docTitleRow}>
                  <Text style={styles.docTitleText}>BIFMA Level-2 Mechanic</Text>
                  <AppIcon name="Check" size={18} />
                </View>
                <View style={styles.ocrTagRow}>
                  <View style={styles.validThruPill}>
                    <Text style={styles.validThruText}>VALID THROUGH 2026</Text>
                  </View>
                  <Text style={styles.docIdNumber}>#CERT-ERGO-9941</Text>
                </View>
                <Text style={styles.docDescriptionText} numberOfLines={1}>
                  Office Ergonomics Seating Standards & Safety Calibration.
                </Text>

                <View style={styles.docFooterRow}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('BIFMA Certificate', 'Level 2 Mechanic certification valid until Dec 2026.')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewDocLink}>View Certificate ↗</Text>
                  </TouchableOpacity>
                  <Text style={styles.docFileSize}>PDF • 890 KB</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Administrative Audit Notes Section */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.noteTitleRow}>
              <AppIcon name="FileText" size={18} />
              <Text style={styles.sectionHeadline}>Verification Notes</Text>
            </View>
            <Text style={styles.internalUseText}>INTERNAL USE ONLY</Text>
          </View>

          {/* Automated Pre-Check Passed Box */}
          <View style={styles.preCheckBox}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.preCheckText}>
              <Text style={styles.boldText}>Automated Pre-Check Passed:</Text> Criminal background verified clear via ThirdWatch API. Previous employment verified with ErgoFit Systems (2020–2023).
            </Text>
          </View>

          <Text style={styles.auditorLabel}>AUDITOR LOG / DISCRETIONARY NOTES</Text>
          <TextInput
            style={styles.auditorTextarea}
            placeholder="Add specific operational notes, field kit allocation notes, or dispatch priority tags..."
            placeholderTextColor={Colors.outline}
            value={auditNotes}
            onChangeText={setAuditNotes}
            multiline
            numberOfLines={3}
          />
          <View style={styles.auditorFooter}>
            <Text style={styles.auditorSignature}>Auditor: S. Raman (Lead Ops)</Text>
            <Text style={styles.autoSavingText}>Auto-saving</Text>
          </View>
        </View>
      </ScrollView>

      {/* 6. Sticky Bottom Decision Hub */}
      <View style={[styles.stickyDecisionBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.decisionButtonsRow}>
          {/* Reject */}
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
            <AppIcon name="X" size={18} />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>

          {/* Approve */}
          <TouchableOpacity style={styles.approveBtn} onPress={handleApprove} activeOpacity={0.88}>
            <AppIcon name="Check" size={18} />
            <Text style={styles.approveBtnText}>Approve Technician</Text>
            <Text style={styles.approveArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.requestInfoLink} onPress={handleRequestInfo} activeOpacity={0.7}>
          <Text style={styles.requestInfoLinkText}>
            Request Additional Info or Re-upload Document ↗
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  profileAvatarTop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  toastContainer: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  toastIcon: {
    fontSize: 13,
    color: '#6ffbbe',
    fontWeight: '900',
  },
  toastText: {
    ...Typography.labelMd,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onPrimary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    ...Shadows.level1,
  },
  applicantTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  applicantProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  applicantAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainer,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  applicantNameCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applicantNameTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  verifiedShieldIcon: {
    fontSize: 14,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  techIdMono: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.outline,
  },
  expText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  pendingAuditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pulsingBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  pendingAuditText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  quickMetricsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    marginBottom: 10,
  },
  metricItemCol: {
    flex: 1,
  },
  metricLabelMono: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  metricValueBold: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  contactListCol: {
    gap: 6,
  },
  contactTriggerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  contactIconRoundBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIconRoundGray: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIconText: {
    fontSize: 14,
  },
  contactTriggerLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  contactTriggerValue: {
    ...Typography.bodyMd,
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  chevronIcon: {
    fontSize: 16,
    color: Colors.outline,
    paddingRight: 4,
  },
  radiusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionHeadline: {
    ...Typography.titleLg,
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  skillCountPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  skillCountText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  sectionDescription: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    marginBottom: 8,
  },
  skillsPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  skillIcon: {
    fontSize: 12,
  },
  skillPillText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  documentsBlock: {
    gap: 8,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  docSubtitle: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  compliantBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  compliantBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: '#002113',
  },
  docCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 12,
    ...Shadows.level1,
  },
  docCardInner: {
    flexDirection: 'row',
    gap: 10,
  },
  docThumbnail: {
    width: 60,
    height: 76,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  docThumbImg: {
    width: '100%',
    height: '100%',
  },
  docBadgeOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
  },
  docBadgeIcon: {
    fontSize: 11,
  },
  docMetaCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  docTitleText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.onSurface,
    flex: 1,
  },
  docCheckIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  ocrTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  ocrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.xs,
  },
  validThruPill: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.xs,
  },
  validThruText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: '#002113',
  },
  blueMiniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondaryCobalt,
  },
  ocrText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  docIdNumber: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  docDescriptionText: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
  },
  docAddressMatched: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  docFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  viewDocLink: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  docFileSize: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteIcon: {
    fontSize: 14,
  },
  internalUseText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  preCheckBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 8,
    marginBottom: 8,
  },
  preCheckIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
    marginTop: 1,
  },
  preCheckText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurface,
    lineHeight: 15,
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
  },
  auditorLabel: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  auditorTextarea: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 8,
    ...Typography.bodyMd,
    fontSize: 12,
    color: Colors.onSurface,
    minHeight: 54,
    textAlignVertical: 'top',
  },
  auditorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  auditorSignature: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.outline,
  },
  autoSavingText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.outline,
  },
  stickyDecisionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    gap: 6,
    ...Shadows.level2,
    ...Platform.select({
      web: {
        zIndex: 40,
      },
    }),
  },
  decisionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    width: '30%',
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#ffdad6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rejectIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: '#93000a',
  },
  rejectBtnText: {
    ...Typography.titleLg,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#93000a',
  },
  approveBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.level2,
  },
  approveIcon: {
    fontSize: 15,
    fontWeight: '900',
    color: '#6ffbbe',
  },
  approveBtnText: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  approveArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  requestInfoLink: {
    alignItems: 'center',
    paddingVertical: 2,
  },
  requestInfoLinkText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});
