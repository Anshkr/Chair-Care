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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { authApi } from '../../services/api/authApi';
import { useAuth } from '../../context/AuthContext';

interface SpecializationItem {
  id: string;
  label: string;
  selected: boolean;
}

const INITIAL_SPECIALIZATIONS: SpecializationItem[] = [
  { id: 'install', label: 'Installation', selected: true },
  { id: 'repair', label: 'Mechanical Repair', selected: true },
  { id: 'maintenance', label: 'Preventive Maintenance', selected: true },
  { id: 'wheels', label: 'Caster & Wheel Replacement', selected: false },
  { id: 'hydraulic', label: 'Hydraulic Gas Cylinder Strut', selected: true },
  { id: 'armrest', label: 'Armrest & Mechanism Assembly', selected: false },
  { id: 'cleaning', label: 'Upholstery Foam & Sanitization', selected: false },
  { id: 'inspection', label: 'Ergonomic Calibration & Audit', selected: false },
];

const SERVICE_ZONES = [
  'South Mumbai & Colaba',
  'Bandra & BKC Corporate Corridor',
  'Andheri & Western Suburbs',
  'Powai & Central Suburbs',
  'Navi Mumbai & Thane',
  'Gurugram Cyber City & NCR',
  'Bengaluru Tech Hubs',
];

const ID_PROOF_TYPES = [
  { id: 'Aadhaar Card', label: 'Aadhaar Card (UIDAI)', hint: '12-digit number e.g. 5421 8904 1234' },
  { id: 'PAN Card', label: 'PAN Card (Income Tax Dept)', hint: '10-character alphanumeric e.g. ABCDE1234F' },
  { id: 'Driving License', label: 'Driving License', hint: 'DL Number with valid expiry' },
  { id: 'Passport', label: 'Passport', hint: 'Valid Indian / International Passport' },
];

const ADDRESS_PROOF_TYPES = [
  'Aadhaar Card (Address on reverse)',
  'Electricity / Utility Bill (Past 3 mos)',
  'Registered Rent Agreement',
  'Voter ID Card',
];

const VEHICLE_TYPES = [
  { id: 'Motorcycle / Scooter', label: 'Motorcycle / Scooter (Quick Dispatch)', icon: 'Truck' },
  { id: 'Service Van / Car', label: 'Service Van / Car (Heavy Parts Kit)', icon: 'Box' },
  { id: 'Public Transit', label: 'Metro / Public Transit', icon: 'Radio' },
];

/**
 * Screen ID: T02
 * Title: Technician Onboarding & KYC Application
 * Submits technician credentials and documents for mandatory Admin Panel approval.
 */
export const TechnicianOnboardingChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setRole } = useAuth();

  // Multi-step flow: 1 = Basic Info & Specializations, 2 = KYC & Documents, 3 = Review & Submit, 4 = Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Personal & Account Details
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [currentZone, setCurrentZone] = useState<string>(SERVICE_ZONES[1]);
  const [yearsExp, setYearsExp] = useState<number>(3);
  const [specializations, setSpecializations] = useState<SpecializationItem[]>(
    INITIAL_SPECIALIZATIONS
  );

  // Step 2: KYC & Compliance Documents (Proof of Age & Address)
  const [idProofType, setIdProofType] = useState<string>('Aadhaar Card');
  const [idProofNumber, setIdProofNumber] = useState<string>('');
  const [idProofFileName, setIdProofFileName] = useState<string>('aadhaar_card_scanned_front_back.pdf');
  const [addressProofType, setAddressProofType] = useState<string>('Aadhaar Card (Address on reverse)');
  const [addressProofFileName, setAddressProofFileName] = useState<string>('utility_address_proof_verified.pdf');
  const [vehicleInfo, setVehicleInfo] = useState<string>('Motorcycle / Scooter');

  // Animation
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

  const selectedSpecializations = specializations
    .filter((s) => s.selected)
    .map((s) => s.label);

  const selectedCount = selectedSpecializations.length;

  const handleNext = () => {
    if (currentStep === 1) {
      if (!fullName.trim()) {
        Alert.alert('Required Field', 'Please enter your legal full name.');
        return;
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        Alert.alert('Invalid Mobile', 'Please provide a valid 10-digit mobile number for dispatch alerts.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        Alert.alert('Invalid Email', 'Please provide a valid professional email address.');
        return;
      }
      if (!password || password.length < 6) {
        Alert.alert('Password Requirement', 'Password must be at least 6 characters long.');
        return;
      }
      if (selectedCount === 0) {
        Alert.alert(
          'Specializations Required',
          'Please select at least one chair service specialization.'
        );
        return;
      }
      triggerBtnPress(() => setCurrentStep(2));
    } else if (currentStep === 2) {
      if (!idProofNumber.trim()) {
        Alert.alert(
          'KYC Document Number Required',
          `Please enter your official ${idProofType} number (e.g. 12-digit Aadhaar UID or 10-digit PAN).`
        );
        return;
      }
      triggerBtnPress(() => setCurrentStep(3));
    } else if (currentStep === 3) {
      handleSubmitApplication();
    }
  };

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);

      const res = await authApi.register({
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: 'technician',
        idProofType: idProofType,
        idProofNumber: idProofNumber.trim(),
        idProofDocumentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
        addressProofDocumentUrl: 'https://images.unsplash.com/photo-1554415707-9e4c019a0a03?q=80&w=600&auto=format&fit=crop',
        ageProofDocumentUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600&auto=format&fit=crop',
        experienceYears: yearsExp,
        specializations: selectedSpecializations,
        currentZone: currentZone,
        vehicleInfo: vehicleInfo,
      });

      setIsSubmitting(false);

      if (res.error) {
        Alert.alert('Submission Error', res.error || 'Failed to submit registration application.');
        return;
      }

      // Transition to success state
      setIsSubmittedSuccess(true);
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Connection Error', err.message || 'Unable to connect to registration server.');
    }
  };

  const handleBack = () => {
    if (isSubmittedSuccess) {
      navigation.navigate('TechnicianLogin');
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('TechnicianLogin');
      }
    }
  };

  // SUCCESS STATE AFTER SUBMITTING KYC FOR ADMIN APPROVAL
  if (isSubmittedSuccess) {
    return (
      <ScreenContainer hasPadding={false}>
        <View style={[styles.stickyHeader, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('TechnicianLogin')}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Application Status</Text>
            <View style={[styles.stepBadge, { backgroundColor: '#e6f4ea' }]}>
              <Text style={[styles.stepBadgeText, { color: '#137333' }]}>DISPATCHED</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successCardCenter}>
            <View style={styles.successIconBubble}>
              <AppIcon name="Clock" size={36} color="#005236" />
            </View>

            <View style={styles.pendingTagBadge}>
              <View style={styles.pulsingDotYellow} />
              <Text style={styles.pendingTagText}>PENDING ADMIN APPROVAL</Text>
            </View>

            <Text style={styles.successMainTitle}>Application Submitted</Text>
            <Text style={styles.successSubTitle}>
              Thank you, <Text style={{ fontWeight: '700', color: Colors.onSurface }}>{fullName}</Text>! Your technician application and KYC documents have been securely transmitted to the ChairCare Admin Panel.
            </Text>

            <View style={styles.adminReviewNoticeBox}>
              <View style={styles.noticeHeaderRow}>
                <AppIcon name="ShieldCheck" size={20} color={Colors.primary} />
                <Text style={styles.noticeHeaderTitle}>Why is admin approval required?</Text>
              </View>
              <Text style={styles.noticeBodyText}>
                As part of ChairCare's trust and safety protocol, an administrator will manually inspect your:
              </Text>
              <View style={styles.noticeBulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>Proof of Age & Identity ({idProofType}: {idProofNumber})</Text>
              </View>
              <View style={styles.noticeBulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>Proof of Address ({addressProofType})</Text>
              </View>
              <View style={styles.noticeBulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>Seating repair experience & service corridor ({currentZone})</Text>
              </View>
              <Text style={[styles.noticeBodyText, { marginTop: 10, fontWeight: '600', color: Colors.primary }]}>
                Turnaround Time: Applications are reviewed by the admin within 24 hours. You cannot enter the Technician Dashboard until verified.
              </Text>
            </View>

            <View style={styles.credentialSummaryCard}>
              <Text style={styles.credSummaryTitle}>Your Registered Credentials</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mobile Phone</Text>
                <Text style={styles.summaryValue}>{phone}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email</Text>
                <Text style={styles.summaryValue}>{email}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Assigned Zone</Text>
                <Text style={styles.summaryValue}>{currentZone}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Document Verified</Text>
                <Text style={styles.summaryValue}>{idProofType}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.actionPrimaryBtn}
              onPress={() => navigation.navigate('TechnicianLogin')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionPrimaryBtnText}>Go to Technician Sign In</Text>
              <Text style={styles.actionBtnArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSecondaryBtn}
              onPress={() => setRole('customer')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionSecondaryBtnText}>Switch to Customer Portal</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

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

          <Text style={styles.headerTitle}>Technician Registration</Text>

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
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= STEP 1: Basic Info & Specializations ================= */}
        {currentStep === 1 && (
          <>
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monoCategoryTag}>
                  FIELD TECHNICIAN ONBOARDING
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Create Technician Account
              </Text>
              <Text style={styles.subHeadline}>
                Join ChairCare's verified field force. Accounts require administrative approval of age and address verification documents before dashboard activation.
              </Text>
            </View>

            {/* Approval Notice Banner */}
            <View style={styles.verificationBanner}>
              <View style={styles.bannerLeftAccent} />
              <View style={styles.bannerContent}>
                <View style={styles.bannerTopRow}>
                  <View style={styles.bannerTitleGroup}>
                    <AppIcon name="ShieldCheck" size={18} color={Colors.primary} />
                    <Text style={styles.bannerTitle}>
                      Admin Approval Process
                    </Text>
                  </View>
                  <View style={styles.queuePill}>
                    <Text style={styles.queuePillText}>Mandatory KYC</Text>
                  </View>
                </View>
                <Text style={styles.bannerBody}>
                  Technician accounts are NOT directly activated. In Step 2, you will submit Aadhaar or PAN card proof of age and address for Admin verification.
                </Text>
              </View>
            </View>

            {/* Profile Avatar Block */}
            <View style={styles.formCardCenter}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarRing}>
                  <BrandLogo size={90} rounded={true} />
                </View>
              </View>
              <Text style={styles.avatarNoteText}>
                Registered Field Technician Profile
              </Text>
            </View>

            {/* Personal Details Form */}
            <View style={styles.formCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Profile & Login Credentials</Text>
                <Text style={styles.sectionMonoTag}>SEC_01</Text>
              </View>

              {/* Full Legal Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Legal Name (as on ID proof) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor={Colors.outline}
                  />
                  <AppIcon name="User" size={18} color={Colors.onSurfaceVariant} />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Mobile Number (Dispatch & OTP) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={Colors.outline}
                    keyboardType="phone-pad"
                  />
                  <AppIcon name="Phone" size={18} color={Colors.onSurfaceVariant} />
                </View>
              </View>

              {/* Professional Email Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Email Address <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="technician@domain.com"
                    placeholderTextColor={Colors.outline}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <AppIcon name="Mail" size={18} color={Colors.onSurfaceVariant} />
                </View>
              </View>

              {/* Account Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Create Password (min 6 characters) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter secure password"
                    placeholderTextColor={Colors.outline}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <AppIcon
                      name={showPassword ? 'EyeOff' : 'Eye'}
                      size={18}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Service Zone */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary Dispatch Corridor</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll}>
                  {SERVICE_ZONES.map((zone) => {
                    const isSelected = currentZone === zone;
                    return (
                      <TouchableOpacity
                        key={zone}
                        style={[
                          styles.zoneChip,
                          isSelected && styles.zoneChipSelected,
                        ]}
                        onPress={() => setCurrentZone(zone)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.zoneChipText,
                            isSelected && styles.zoneChipTextSelected,
                          ]}
                        >
                          {zone}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Years of Experience Stepper */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Years of Seating & Ergonomic Repair Experience
                </Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setYearsExp((prev) => Math.max(0, prev - 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.stepperValueGroup}>
                    <Text style={styles.stepperNumber}>{yearsExp}</Text>
                    <Text style={styles.stepperLabel}>Years Active</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setYearsExp((prev) => Math.min(30, prev + 1))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Specializations Card */}
            <View style={styles.formCard}>
              <View style={styles.specHeaderRow}>
                <View style={styles.specHeaderLeft}>
                  <Text style={styles.sectionTitle}>Service Specializations</Text>
                  <Text style={styles.specSub}>
                    Select all chair mechanical tasks you are qualified to perform.
                  </Text>
                </View>
                <View style={styles.specBadge}>
                  <Text style={styles.specBadgeText}>
                    {selectedCount} Selected
                  </Text>
                </View>
              </View>

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
            </View>
          </>
        )}

        {/* ================= STEP 2: KYC & Compliance Documents ================= */}
        {currentStep === 2 && (
          <>
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monoCategoryTag}>
                  MANDATORY KYC & AGE VERIFICATION
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Upload Proof of Age & Address
              </Text>
              <Text style={styles.subHeadline}>
                Please provide government-issued identity (Aadhaar or PAN) and proof of address. The ChairCare Admin Panel will examine these before authorizing live dispatch.
              </Text>
            </View>

            {/* Document 1: Proof of Identity & Age */}
            <View style={styles.formCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle}>1. Proof of Identity & Age</Text>
                  <Text style={styles.docDesc}>
                    Valid Govt. ID proving age (min 18 yrs) and legal identity.
                  </Text>
                </View>
                <View style={styles.docVerifiedPill}>
                  <Text style={styles.docVerifiedText}>REQUIRED</Text>
                </View>
              </View>

              {/* ID Proof Type Selector Chips */}
              <Text style={styles.subFieldLabel}>Select Identity Document Type:</Text>
              <View style={styles.typeSelectorRow}>
                {ID_PROOF_TYPES.map((typeObj) => {
                  const isSelected = idProofType === typeObj.id;
                  return (
                    <TouchableOpacity
                      key={typeObj.id}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipSelected,
                      ]}
                      onPress={() => setIdProofType(typeObj.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          isSelected && styles.typeChipTextSelected,
                        ]}
                      >
                        {typeObj.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Document Number Input */}
              <View style={[styles.inputGroup, { marginTop: 12 }]}>
                <Text style={styles.inputLabel}>
                  {idProofType} Number <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={idProofNumber}
                    onChangeText={setIdProofNumber}
                    placeholder={
                      idProofType === 'Aadhaar Card'
                        ? 'Enter 12-digit Aadhaar UID (e.g. 5421 8904 1234)'
                        : idProofType === 'PAN Card'
                        ? 'Enter 10-char PAN (e.g. ABCDE1234F)'
                        : `Enter ${idProofType} Number`
                    }
                    placeholderTextColor={Colors.outline}
                    autoCapitalize="characters"
                  />
                  <AppIcon name="ShieldCheck" size={18} color={Colors.primary} />
                </View>
              </View>

              {/* File Attachment Card */}
              <View style={styles.docFileRow}>
                <AppIcon name="FileText" size={20} color={Colors.primary} />
                <View style={styles.fileNameCol}>
                  <Text style={styles.fileNameText}>{idProofFileName}</Text>
                  <Text style={styles.fileSizeText}>Scanned Front & Back • 2.4 MB</Text>
                </View>
                <TouchableOpacity
                  style={styles.reuploadBtn}
                  onPress={() => Alert.alert('Document Attached', 'Default scanned KYC file verified.')}
                >
                  <Text style={styles.reuploadText}>Attached ✓</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Document 2: Proof of Address */}
            <View style={styles.formCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle}>2. Proof of Address</Text>
                  <Text style={styles.docDesc}>
                    Valid official document verifying residential address in service zone.
                  </Text>
                </View>
                <View style={styles.docActivePill}>
                  <Text style={styles.docActiveText}>REQUIRED</Text>
                </View>
              </View>

              <Text style={styles.subFieldLabel}>Select Address Document Type:</Text>
              <View style={styles.typeSelectorRow}>
                {ADDRESS_PROOF_TYPES.map((type) => {
                  const isSelected = addressProofType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipSelected,
                      ]}
                      onPress={() => setAddressProofType(type)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          isSelected && styles.typeChipTextSelected,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.docFileRow}>
                <AppIcon name="MapPin" size={20} color={Colors.secondary} />
                <View style={styles.fileNameCol}>
                  <Text style={styles.fileNameText}>{addressProofFileName}</Text>
                  <Text style={styles.fileSizeText}>Utility / Residence Proof • 1.8 MB</Text>
                </View>
                <TouchableOpacity
                  style={styles.reuploadBtn}
                  onPress={() => Alert.alert('Address Proof', 'Address document attached.')}
                >
                  <Text style={styles.reuploadText}>Attached ✓</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mobility / Vehicle Info */}
            <View style={styles.formCard}>
              <Text style={styles.docTitle}>3. Mode of Field Transit</Text>
              <Text style={styles.docDesc}>
                Select how you will travel to customer locations for chair servicing.
              </Text>
              <View style={{ gap: 8, marginTop: 10 }}>
                {VEHICLE_TYPES.map((veh) => {
                  const isSelected = vehicleInfo === veh.id;
                  return (
                    <TouchableOpacity
                      key={veh.id}
                      style={[
                        styles.vehicleSelectRow,
                        isSelected && styles.vehicleSelectRowSelected,
                      ]}
                      onPress={() => setVehicleInfo(veh.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={[styles.vehicleLabel, isSelected && styles.vehicleLabelSelected]}>
                        {veh.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ================= STEP 3: Review & Submit to Admin Panel ================= */}
        {currentStep === 3 && (
          <>
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monoCategoryTag}>
                  FINAL VERIFICATION REVIEW
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Review & Submit to Admin
              </Text>
              <Text style={styles.subHeadline}>
                Confirm your application details before sending to the ChairCare Operations Administrator for review.
              </Text>
            </View>

            {/* Critical Admin Review Mandate Warning */}
            <View style={styles.mandateWarningCard}>
              <View style={styles.mandateHeaderRow}>
                <AppIcon name="AlertTriangle" size={22} color="#ba1a1a" />
                <Text style={styles.mandateTitle}>Admin Approval Policy</Text>
              </View>
              <Text style={styles.mandateBody}>
                Your technician account will <Text style={{ fontWeight: '700' }}>NOT</Text> be activated automatically. The ChairCare Admin Panel will review your Aadhaar/PAN, age proof, and address details. You will only be granted access to the Technician Dashboard after admin approval.
              </Text>
            </View>

            {/* Summary Details */}
            <View style={styles.formCardCenter}>
              <View style={styles.bigCheckPod}>
                <AppIcon name="ShieldCheck" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.auditStatusTitle}>Application Summary</Text>
              <Text style={styles.auditStatusSub}>
                Ready for administrative audit & background check.
              </Text>

              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Technician Name</Text>
                  <Text style={styles.summaryValue}>{fullName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mobile Number</Text>
                  <Text style={styles.summaryValue}>{phone}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Email</Text>
                  <Text style={styles.summaryValue}>{email}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service Zone</Text>
                  <Text style={styles.summaryValue}>{currentZone}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Experience</Text>
                  <Text style={styles.summaryValue}>{yearsExp} Years</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ID / Age Proof</Text>
                  <Text style={styles.summaryValue}>{idProofType}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>ID Number</Text>
                  <Text style={styles.summaryValue}>{idProofNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Address Proof</Text>
                  <Text style={styles.summaryValue}>{addressProofType}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Transit Mode</Text>
                  <Text style={styles.summaryValue}>{vehicleInfo}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Specializations</Text>
                  <Text style={styles.summaryValue}>{selectedCount} Selected</Text>
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
            style={[styles.continueBtn, isSubmitting && { opacity: 0.7 }]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
            ) : null}
            <Text style={styles.continueBtnText}>
              {currentStep === 1
                ? 'Continue to KYC Documents (Step 2)'
                : currentStep === 2
                ? 'Review Application (Step 3)'
                : isSubmitting
                ? 'Submitting to Admin Panel...'
                : 'Submit Application for Admin Review'}
            </Text>
            {!isSubmitting && <Text style={styles.continueBtnArrow}>→</Text>}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footerNoteRow}>
          <AppIcon name="Lock" size={16} color={Colors.onSurfaceVariant} />
          <Text style={styles.footerProtocolText}>
            ChairCare Enterprise Technician Compliance Protocol v4.2
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
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.primary,
  },
  pulsingDotYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b06000',
  },
  monoCategoryTag: {
    ...Typography.labelMono,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  mainHeadline: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  subHeadline: {
    ...Typography.bodyMedium,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  verificationBanner: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  bannerLeftAccent: {
    width: 6,
    backgroundColor: Colors.primary,
  },
  bannerContent: {
    flex: 1,
    padding: 14,
    gap: 6,
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
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  queuePill: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  queuePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  bannerBody: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  formCardCenter: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarNoteText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  sectionMonoTag: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  requiredStar: {
    color: '#ba1a1a',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.onSurface,
  },
  zoneScroll: {
    marginTop: 4,
  },
  zoneChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainer,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  zoneChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  zoneChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  stepperValueGroup: {
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  stepperLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  specHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  specHeaderLeft: {
    flex: 1,
  },
  specSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  specBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  specBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  chipUnselected: {
    backgroundColor: Colors.surfaceContainer,
    borderColor: Colors.outlineHairline,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipIconUnselected: {
    color: Colors.onSurfaceVariant,
  },
  chipIconSelected: {
    color: '#ffffff',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelUnselected: {
    color: Colors.onSurface,
  },
  chipLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docInfoCol: {
    flex: 1,
  },
  docTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  docDesc: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  docVerifiedPill: {
    backgroundColor: 'rgba(0, 82, 54, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  docVerifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  docActivePill: {
    backgroundColor: 'rgba(0, 82, 54, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  docActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  subFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginTop: 8,
    marginBottom: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  typeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  typeChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  docFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 12,
    marginTop: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  fileNameCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  fileSizeText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  reuploadBtn: {
    backgroundColor: Colors.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  reuploadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  vehicleSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  vehicleSelectRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(0, 82, 54, 0.05)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: Colors.primary,
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  vehicleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  vehicleLabelSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
  mandateWarningCard: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.25)',
    gap: 8,
  },
  mandateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mandateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ba1a1a',
  },
  mandateBody: {
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 19,
  },
  bigCheckPod: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 82, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  auditStatusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  auditStatusSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  summaryTable: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    maxWidth: '60%',
    textAlign: 'right',
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
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    ...Shadows.level2,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  continueBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerProtocolText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '500',
  },

  // Success Screen Styles
  successCardCenter: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level2,
    gap: 12,
  },
  successIconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 82, 54, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  pendingTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(176, 96, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  pendingTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b06000',
    letterSpacing: 0.5,
  },
  successMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.onSurface,
    textAlign: 'center',
  },
  successSubTitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  adminReviewNoticeBox: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    padding: 14,
    width: '100%',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    marginTop: 4,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  noticeHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  noticeBodyText: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },
  noticeBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4,
  },
  bulletSymbol: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 12,
    color: Colors.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  credentialSummaryCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: 14,
    width: '100%',
    gap: 6,
  },
  credSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    width: '100%',
    marginTop: 6,
    ...Shadows.level1,
  },
  actionPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  actionSecondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  actionSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
});
