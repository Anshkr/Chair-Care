import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface SpecializationItem {
  id: string;
  label: string;
  selected: boolean;
}

const INITIAL_SPECIALIZATIONS: SpecializationItem[] = [
  { id: 'install', label: 'Installation', selected: false },
  { id: 'repair', label: 'Repair', selected: false },
  { id: 'maintenance', label: 'Maintenance', selected: false },
  { id: 'wheels', label: 'Wheel Replacement', selected: false },
  { id: 'hydraulic', label: 'Hydraulic Replacement', selected: false },
  { id: 'armrest', label: 'Armrest Replacement', selected: false },
  { id: 'cleaning', label: 'Cleaning', selected: false },
  { id: 'inspection', label: 'Inspection', selected: false },
];

/**
 * Screen ID: T02
 * Title: Technician Onboarding / Verification
 * Reference: design-reference/technician/technician_onboarding_chaircare_mobile
 */
export const TechnicianOnboardingChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  // Multi-step flow: 1 = Basic Info & Specializations, 2 = Documents, 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [yearsExp, setYearsExp] = useState<number>(0);
  const [specializations, setSpecializations] = useState<SpecializationItem[]>(
    INITIAL_SPECIALIZATIONS
  );

  // Step 2 Document states
  const [aadhaarAttached, setAadhaarAttached] = useState<boolean>(false);
  const [bifmaAttached, setBifmaAttached] = useState<boolean>(false);
  const [toolingAttached, setToolingAttached] = useState<boolean>(false);

  // Micro-interaction button scale animation
  const btnScale = useRef(new Animated.Value(1)).current;

  const triggerBtnPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      callback();
    });
  };

  const toggleSpecialization = (id: string) => {
    setSpecializations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectedCount = specializations.filter((s) => s.selected).length;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) {
        Alert.alert('Required Field', 'Please enter your legal full name.');
        return;
      }
      if (selectedCount === 0) {
        Alert.alert(
          'Specializations Required',
          'Please select at least one service specialization domain.'
        );
        return;
      }
      triggerBtnPress(() => setCurrentStep(2));
    } else if (currentStep === 2) {
      triggerBtnPress(() => setCurrentStep(3));
    } else {
      triggerBtnPress(() => {
        navigation.navigate('TechnicianMain');
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('TechnicianMain');
      }
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Profile Photo',
      'Photo selection dialog opened. Using current verified technician portrait.'
    );
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Sticky Top Navigation Bar */}
      <View
        style={[
          styles.stickyHeader,
          { paddingTop: Math.max(insets.top, 12) + 4 },
        ]}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Technician Setup</Text>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step {currentStep} of 3</Text>
          </View>
        </View>

        {/* Progress Bar Track */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width:
                  currentStep === 1
                    ? '33.33%'
                    : currentStep === 2
                    ? '66.66%'
                    : '100%',
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && (
          <>
            {/* Title & Context Card */}
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monoCategoryTag}>
                  ERGONOMIC PRECISION FIELD FORCE
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Complete Your Technician Profile
              </Text>
              <Text style={styles.subHeadline}>
                Add your professional details so corporate facilities and
                home-office customers can review your verified engineering
                credentials.
              </Text>
            </View>

            {/* Verification Status Warning / Banner */}
            <View style={styles.verificationBanner}>
              <View style={styles.bannerLeftAccent} />
              <View style={styles.bannerContent}>
                <View style={styles.bannerTopRow}>
                  <View style={styles.bannerTitleGroup}>
                    <AppIcon name="Clock" size={18} />
                    <Text style={styles.bannerTitle}>
                      Verification Status: Pending
                    </Text>
                  </View>
                  <View style={styles.queuePill}>
                    <Text style={styles.queuePillText}>Queue #412</Text>
                  </View>
                </View>
                <Text style={styles.bannerBody}>
                  ChairCare verifies technical certifications and background
                  credentials prior to live dispatch authorization. Standard
                  audit turnaround is 24–48 hours.
                </Text>

                {/* Preview Mini Pills */}
                <View style={styles.miniPillsRow}>
                  <View style={styles.miniPill}>
                    <AppIcon name="Check" size={18} />
                    <Text style={styles.miniPillText}>Aadhaar / ID Card</Text>
                  </View>
                  <View style={styles.miniPill}>
                    <AppIcon name="Check" size={18} />
                    <Text style={styles.miniPillText}>BIFMA Level-3 Cert</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Form Section 1: Profile Photo Card */}
            <View style={styles.formCardCenter}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarRing}>
                  <BrandLogo size={100} rounded={true} />
                </View>
                <TouchableOpacity
                  style={styles.cameraFloatingBtn}
                  onPress={handleChangePhoto}
                  activeOpacity={0.8}
                  accessibilityLabel="Take photo"
                >
                  <AppIcon name="Camera" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.photoActionCol}>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={handleChangePhoto}
                  activeOpacity={0.7}
                >
                  <AppIcon name="Upload" size={18} />
                  <Text style={styles.changePhotoBtnText}>
                    Change Profile Photo
                  </Text>
                </TouchableOpacity>
                <View style={styles.photoNoteRow}>
                  <AppIcon name="Info" size={18} />
                  <Text style={styles.photoNoteText}>
                    Professional photo in clean technician attire
                  </Text>
                </View>
              </View>
            </View>

            {/* Form Section 2: Basic Details */}
            <View style={styles.formCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Basic Engineering Details</Text>
                <Text style={styles.sectionMonoTag}>SEC_01</Text>
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Name <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter your legal full name"
                    placeholderTextColor={Colors.outline}
                  />
                  <Text style={styles.inputEndIcon}>🪪</Text>
                </View>
              </View>

              {/* Phone Number with Verified Check Badge */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelBetween}>
                  <Text style={styles.inputLabel}>
                    Registered Mobile Number{' '}
                    <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <View style={styles.verifiedOtpPill}>
                    <AppIcon name="Check" size={18} />
                    <Text style={styles.verifiedOtpText}>OTP Verified</Text>
                  </View>
                </View>
                <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                  <TextInput
                    style={[styles.textInput, styles.readOnlyText]}
                    value={phone}
                    editable={false}
                  />
                  <View style={styles.verifiedSealBadge}>
                    <AppIcon name="Check" size={18} />
                  </View>
                </View>
              </View>

              {/* Professional Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Professional Email Address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="name@company.com"
                    placeholderTextColor={Colors.outline}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <AppIcon name="Mail" size={18} />
                </View>
              </View>

              {/* Years of Experience Stepper */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Years of Seating & Ergonomic Repair Experience
                </Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setYearsExp((prev) => Math.max(1, prev - 1))}
                    activeOpacity={0.7}
                    accessibilityLabel="Decrease experience"
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.stepperValueGroup}>
                    <Text style={styles.stepperNumber}>{yearsExp}</Text>
                    <Text style={styles.stepperLabel}>Years Active</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setYearsExp((prev) => Math.min(35, prev + 1))}
                    activeOpacity={0.7}
                    accessibilityLabel="Increase experience"
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Form Section 3: Service Specializations */}
            <View style={styles.formCard}>
              <View style={styles.specHeaderRow}>
                <View style={styles.specHeaderLeft}>
                  <Text style={styles.sectionTitle}>Service Specializations</Text>
                  <Text style={styles.specSub}>
                    Select all domains you are qualified to diagnose and repair.
                  </Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>
                    {selectedCount} Selected
                  </Text>
                </View>
              </View>

              {/* Selectable multi-choice chips */}
              <View style={styles.chipsWrap}>
                {specializations.map((spec) => {
                  const isSelected = spec.selected;
                  return (
                    <TouchableOpacity
                      key={spec.id}
                      style={[
                        styles.chipBtn,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                      onPress={() => toggleSpecialization(spec.id)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.chipIcon,
                          isSelected
                            ? styles.chipIconSelected
                            : styles.chipIconUnselected,
                        ]}
                      >
                        {isSelected ? '✓' : '+'}
                      </Text>
                      <Text
                        style={[
                          styles.chipLabel,
                          isSelected
                            ? styles.chipLabelSelected
                            : styles.chipLabelUnselected,
                        ]}
                      >
                        {spec.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Trust & Quality Micro-Metric Note */}
              <View style={styles.trustNoteCard}>
                <View style={styles.trustIconPod}>
                  <AppIcon name="ShieldCheck" size={18} />
                </View>
                <Text style={styles.trustNoteText}>
                  High accuracy profile info ensures priority algorithm routing
                  for premium enterprise Herman Miller & Steelcase warranty
                  tickets.
                </Text>
              </View>
            </View>
          </>
        )}

        {currentStep === 2 && (
          <>
            {/* Step 2: Document Verification */}
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monoCategoryTag}>
                  COMPLIANCE & ACCREDITATIONS
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Upload Engineering Documents
              </Text>
              <Text style={styles.subHeadline}>
                Provide proof of identity and technical accreditations for field
                dispatch authorization.
              </Text>
            </View>

            {/* Document 1: Aadhaar */}
            <View style={styles.formCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle}>Govt. ID Proof (Aadhaar / Passport)</Text>
                  <Text style={styles.docDesc}>
                    National identity verification with official address match.
                  </Text>
                </View>
                <View style={styles.docVerifiedPill}>
                  <Text style={styles.docVerifiedText}>VERIFIED</Text>
                </View>
              </View>
              <View style={styles.docFileRow}>
                <AppIcon name="FileText" size={18} />
                <View style={styles.fileNameCol}>
                  <Text style={styles.fileNameText}>aadhaar_verified_front_back.pdf</Text>
                  <Text style={styles.fileSizeText}>2.4 MB • Encrypted</Text>
                </View>
                <TouchableOpacity
                  style={styles.reuploadBtn}
                  onPress={() => Alert.alert('Document Updated', 'Aadhaar copy refreshed.')}
                >
                  <Text style={styles.reuploadText}>Replace</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document 2: BIFMA */}
            <View style={styles.formCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle}>BIFMA Level-3 Certification</Text>
                  <Text style={styles.docDesc}>
                    Ergonomic seating mechanics, pneumatic diagnostics & safety certification.
                  </Text>
                </View>
                <View style={styles.docActivePill}>
                  <Text style={styles.docActiveText}>ACTIVE</Text>
                </View>
              </View>
              <View style={styles.docFileRow}>
                <AppIcon name="Award" size={18} />
                <View style={styles.fileNameCol}>
                  <Text style={styles.fileNameText}>bifma_level3_cert_2024.pdf</Text>
                  <Text style={styles.fileSizeText}>1.8 MB • Certified</Text>
                </View>
                <TouchableOpacity
                  style={styles.reuploadBtn}
                  onPress={() => Alert.alert('Document Updated', 'BIFMA certificate refreshed.')}
                >
                  <Text style={styles.reuploadText}>Replace</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document 3: Field Tooling Kit */}
            <View style={styles.formCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle}>Tooling Kit & Torque Calibration</Text>
                  <Text style={styles.docDesc}>
                    Calibration log of torque wrenches and pneumatic extraction tools.
                  </Text>
                </View>
                <View style={styles.docPendingPill}>
                  <Text style={styles.docPendingText}>ATTACHED</Text>
                </View>
              </View>
              <View style={styles.docFileRow}>
                <AppIcon name="Settings" size={18} />
                <View style={styles.fileNameCol}>
                  <Text style={styles.fileNameText}>torque_calibration_sheet_q4.pdf</Text>
                  <Text style={styles.fileSizeText}>950 KB • Valid till 2027</Text>
                </View>
                <TouchableOpacity
                  style={styles.reuploadBtn}
                  onPress={() => Alert.alert('Document Updated', 'Calibration sheet re-attached.')}
                >
                  <Text style={styles.reuploadText}>Replace</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {currentStep === 3 && (
          <>
            {/* Step 3: Verification Review & Dispatch Authorization */}
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDotGreen} />
                <Text style={styles.monoCategoryTagGreen}>
                  DISPATCH AUDIT READY
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Profile Ready for Deployment
              </Text>
              <Text style={styles.subHeadline}>
                Your technician profile and BIFMA certifications are registered in the dispatch queue.
              </Text>
            </View>

            <View style={styles.formCardCenter}>
              <View style={styles.bigCheckPod}>
                <AppIcon name="ShieldCheck" size={28} />
              </View>
              <Text style={styles.auditStatusTitle}>Audit Queue #412</Text>
              <Text style={styles.auditStatusSub}>
                Authorized for Herman Miller, Steelcase & Haworth corporate warranty repairs.
              </Text>

              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Technician</Text>
                  <Text style={styles.summaryValue}>{fullName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mobile</Text>
                  <Text style={styles.summaryValue}>{phone}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Experience</Text>
                  <Text style={styles.summaryValue}>{yearsExp} Years Active</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Specializations</Text>
                  <Text style={styles.summaryValue}>{selectedCount} Domains</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom CTA Area */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>
              {currentStep === 1
                ? 'Continue to Documents (Step 2)'
                : currentStep === 2
                ? 'Submit Verification (Step 3)'
                : 'Go to Technician Dashboard'}
            </Text>
            <Text style={styles.continueBtnArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footerNoteRow}>
          <AppIcon name="Lock" size={18} />
          <Text style={styles.footerProtocolText}>
            ChairCare Pro Field Protocol v4.2
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 30,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.2,
  },
  stepBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryContainer,
    borderRadius: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  titleSection: {
    gap: 6,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondaryContainer,
  },
  pulsingDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tertiaryEmerald,
  },
  monoCategoryTag: {
    ...Typography.labelMono,
    color: Colors.secondaryContainer,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  monoCategoryTagGreen: {
    ...Typography.labelMono,
    color: Colors.tertiaryEmerald,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  mainHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subHeadline: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  verificationBanner: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.level1,
  },
  bannerLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: Colors.outlineVariant,
  },
  bannerContent: {
    padding: 16,
    paddingLeft: 18,
    gap: 8,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingIcon: {
    fontSize: 16,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  queuePill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  queuePillText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  bannerBody: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  miniPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 8,
    borderRadius: BorderRadius.lg,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  verifiedCheckIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  miniPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  formCardCenter: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    ...Shadows.level1,
  },
  avatarWrapper: {
    position: 'relative',
    marginTop: 4,
  },
  avatarRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 4,
    borderColor: Colors.surfaceContainerLowest,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level2,
  },
  cameraFloatingBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level2,
  },
  cameraIcon: {
    fontSize: 16,
  },
  photoActionCol: {
    alignItems: 'center',
    gap: 6,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  uploadIcon: {
    fontSize: 14,
  },
  changePhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  photoNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoIcon: {
    fontSize: 13,
  },
  photoNoteText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    gap: 16,
    ...Shadows.level1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  sectionMonoTag: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  inputLabelBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredStar: {
    color: Colors.error,
  },
  verifiedOtpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedCheckMark: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.tertiaryEmerald,
  },
  verifiedOtpText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.tertiaryEmerald,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  readOnlyInput: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '500',
  },
  readOnlyText: {
    color: Colors.onSurface,
    fontWeight: '600',
  },
  inputEndIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  verifiedSealBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.tertiaryEmerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealCheck: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 6,
    borderRadius: BorderRadius.lg,
  },
  stepperBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.level1,
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stepperValueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  stepperNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  specHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  specHeaderLeft: {
    flex: 1,
    gap: 2,
  },
  specSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  specBadge: {
    backgroundColor: Colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  specBadgeText: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: Colors.secondaryContainer,
    ...Shadows.level1,
  },
  chipUnselected: {
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: 'transparent',
  },
  chipIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  chipIconSelected: {
    color: '#FFFFFF',
  },
  chipIconUnselected: {
    color: Colors.outline,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
  chipLabelUnselected: {
    color: Colors.onSurface,
  },
  trustNoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
    marginTop: 4,
  },
  trustIconPod: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustShieldIcon: {
    fontSize: 16,
  },
  trustNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  docInfoCol: {
    flex: 1,
    gap: 2,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  docDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
  },
  docVerifiedPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  docVerifiedText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  docActivePill: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  docActiveText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  docPendingPill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  docPendingText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  docFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileNameCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  fileSizeText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  reuploadBtn: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    ...Shadows.level1,
  },
  reuploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryContainer,
  },
  bigCheckPod: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigCheckIcon: {
    fontSize: 32,
  },
  auditStatusTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  auditStatusSub: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryTable: {
    width: '100%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 40,
    ...Shadows.level3,
  },
  continueBtn: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.primaryContainer,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  continueBtnArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
  },
  lockIcon: {
    fontSize: 11,
  },
  footerProtocolText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
});
