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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { authApi } from '../../services/api/authApi';
import { useAuth } from '../../context/AuthContext';

const KYC_DOCUMENT_TYPES = [
  { id: 'Aadhaar Card', label: 'Aadhaar Card', placeholder: 'Enter 12-digit Aadhaar UID (e.g. 5421 8904 1234)' },
  { id: 'PAN Card', label: 'PAN Card', placeholder: 'Enter 10-char PAN (e.g. ABCDE1234F)' },
  { id: 'Driving License', label: 'Driving License (DL)', placeholder: 'Enter DL Number (e.g. DL-0420110012345)' },
  { id: 'Electricity Bill', label: 'Electricity Bill', placeholder: 'Enter Consumer / CA / Account Number' },
  { id: 'Bank Statement', label: 'Bank Statement', placeholder: 'Enter Account / Reference Number' },
  { id: 'Other Valid ID', label: 'Other Valid Govt ID', placeholder: 'Enter Document ID Number' },
];

/**
 * Screen ID: T02
 * Title: Technician Onboarding & KYC Application
 * Submits technician credentials and valid document proofs for mandatory Admin Panel review.
 */
export const TechnicianOnboardingChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setRole } = useAuth();

  // Multi-step flow: 1 = Basic Info, 2 = Document Verification (Real Image/PDF), 3 = Review & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Personal & Account Credentials (Only essential fields)
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Step 2: Document Verification
  const [selectedDocType, setSelectedDocType] = useState<string>('Aadhaar Card');
  const [docNumber, setDocNumber] = useState<string>('');
  const [docUri, setDocUri] = useState<string | null>(null);
  const [docDataUrl, setDocDataUrl] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);
  const [docMime, setDocMime] = useState<string | null>(null);
  const [docSize, setDocSize] = useState<string | null>(null);
  const [isPickingFile, setIsPickingFile] = useState<boolean>(false);

  // Animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const webFileInputRef = useRef<any>(null);

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

  // Pick image from device gallery (JPEG, PNG, JPG)
  const handlePickFromGallery = async () => {
    try {
      setIsPickingFile(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        const dataUrl = asset.base64
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri;

        setDocUri(asset.uri);
        setDocDataUrl(dataUrl);
        setDocName(asset.fileName || `${selectedDocType.toLowerCase().replace(/\s+/g, '_')}_document.jpg`);
        setDocMime(mime);
        setDocSize(asset.fileSize ? `${(asset.fileSize / 1024).toFixed(0)} KB` : 'Image Attached');
      }
    } catch (err: any) {
      setIsPickingFile(false);
      Alert.alert('Gallery Error', err.message || 'Unable to open device image gallery.');
    }
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission', 'Camera permission is needed to capture your document.');
        return;
      }
      setIsPickingFile(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        const dataUrl = asset.base64
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri;

        setDocUri(asset.uri);
        setDocDataUrl(dataUrl);
        setDocName(`camera_document_${Date.now()}.jpg`);
        setDocMime(mime);
        setDocSize('Photo Captured');
      }
    } catch (err: any) {
      setIsPickingFile(false);
      Alert.alert('Camera Error', err.message || 'Unable to access device camera.');
    }
  };

  // Pick PDF or file from storage
  const handlePickDocument = async () => {
    try {
      setIsPickingFile(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      setIsPickingFile(false);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const isPdf = asset.name?.toLowerCase().endsWith('.pdf') || asset.mimeType?.includes('pdf');
        const mime = asset.mimeType || (isPdf ? 'application/pdf' : 'image/jpeg');

        setDocUri(asset.uri);
        setDocDataUrl(asset.uri);
        setDocName(asset.name || 'document.pdf');
        setDocMime(mime);
        setDocSize(asset.size ? `${(asset.size / 1024).toFixed(0)} KB` : 'Document Attached');
      }
    } catch (err: any) {
      setIsPickingFile(false);
      Alert.alert('File Picker Error', err.message || 'Unable to access document storage.');
    }
  };

  // HTML Web File Input Change Handler (Web platform fallback)
  const handleWebFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const resultStr = loadEvent.target?.result as string;
        setDocUri(resultStr);
        setDocDataUrl(resultStr);
        setDocName(file.name);
        setDocMime(file.type || 'image/jpeg');
        setDocSize(`${(file.size / 1024).toFixed(0)} KB`);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachedDocument = () => {
    setDocUri(null);
    setDocDataUrl(null);
    setDocName(null);
    setDocMime(null);
    setDocSize(null);
  };

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
      triggerBtnPress(() => setCurrentStep(2));
    } else if (currentStep === 2) {
      if (!docNumber.trim()) {
        Alert.alert(
          'Document Number Required',
          `Please enter your official ${selectedDocType} number or reference.`
        );
        return;
      }
      if (!docDataUrl && !docUri) {
        Alert.alert(
          'Document Image/PDF Required',
          'Please attach an image or PDF of your valid ID (Aadhaar, PAN, DL, Electricity Bill, or Bank Statement).'
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

      const finalDocumentUrl = docDataUrl || docUri || '';

      const res = await authApi.register({
        name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: 'technician',
        idProofType: selectedDocType,
        idProofNumber: docNumber.trim(),
        idProofDocumentUrl: finalDocumentUrl,
        addressProofDocumentUrl: finalDocumentUrl,
        ageProofDocumentUrl: finalDocumentUrl,
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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('CustomerMain');
      }
      return;
    }
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('CustomerMain');
      }
    }
  };

  const selectedTypeObj = KYC_DOCUMENT_TYPES.find((d) => d.id === selectedDocType) || KYC_DOCUMENT_TYPES[0];
  const isDocPdf = docMime?.includes('pdf') || docName?.toLowerCase().endsWith('.pdf');

  // SUCCESS STATE AFTER SUBMITTING KYC FOR ADMIN APPROVAL
  if (isSubmittedSuccess) {
    return (
      <ScreenContainer hasPadding={false}>
        <View style={[styles.stickyHeader, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('CustomerMain'))}
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
              Thank you, <Text style={{ fontWeight: '700', color: Colors.onSurface }}>{fullName}</Text>! Your technician application and valid ID document have been securely transmitted to the ChairCare Admin Panel.
            </Text>

            <View style={styles.adminReviewNoticeBox}>
              <View style={styles.noticeHeaderRow}>
                <AppIcon name="ShieldCheck" size={20} color={Colors.primary} />
                <Text style={styles.noticeHeaderTitle}>Administrative Review in Progress</Text>
              </View>
              <Text style={styles.noticeBodyText}>
                The operations desk will verify your submitted document before account activation:
              </Text>
              <View style={styles.noticeBulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>Document: {selectedDocType} ({docNumber})</Text>
              </View>
              <View style={styles.noticeBulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletText}>File Uploaded: {docName || 'Valid ID Document'}</Text>
              </View>
              <Text style={[styles.noticeBodyText, { marginTop: 10, fontWeight: '600', color: Colors.primary }]}>
                Turnaround Time: Applications are reviewed by the admin within 24 hours. You will receive access to the Technician Dashboard upon approval.
              </Text>
            </View>

            <View style={styles.credentialSummaryCard}>
              <Text style={styles.credSummaryTitle}>Your Registered Details</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Full Name</Text>
                <Text style={styles.summaryValue}>{fullName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Mobile Phone</Text>
                <Text style={styles.summaryValue}>{phone}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email</Text>
                <Text style={styles.summaryValue}>{email}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Document Verified</Text>
                <Text style={styles.summaryValue}>{selectedDocType}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={styles.actionPrimaryBtn}
              onPress={() => navigation.navigate('AuthenticationGate')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionPrimaryBtnText}>Go to Sign In</Text>
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
        {/* ================= STEP 1: Basic Account Credentials ================= */}
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
                Enter your basic details to register. Technician accounts require administrative document review before live access is granted.
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
                      Admin Approval Mandate
                    </Text>
                  </View>
                  <View style={styles.queuePill}>
                    <Text style={styles.queuePillText}>Mandatory Review</Text>
                  </View>
                </View>
                <Text style={styles.bannerBody}>
                  Technician accounts are NOT directly activated. In Step 2, you will upload an image or PDF of a valid ID (Aadhaar, PAN, DL, Utility Bill, Bank Statement) for Admin verification.
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
                ChairCare Technician Partner Network
              </Text>
            </View>

            {/* Personal Details Form */}
            <View style={styles.formCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Account Information</Text>
                <Text style={styles.sectionMonoTag}>SEC_01</Text>
              </View>

              {/* Full Legal Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Full Legal Name (as on Govt. ID) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Vikram Singh"
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
                    placeholder="technician@chaircare.in"
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
            </View>
          </>
        )}

        {/* ================= STEP 2: Document Verification (Real Image / PDF) ================= */}
        {currentStep === 2 && (
          <>
            <View style={styles.titleSection}>
              <View style={styles.pulseHeaderRow}>
                <View style={styles.pulsingDot} />
                <Text style={styles.monoCategoryTag}>
                  DOCUMENT VERIFICATION
                </Text>
              </View>
              <Text style={styles.mainHeadline}>
                Upload Valid ID Document
              </Text>
              <Text style={styles.subHeadline}>
                Select your document type, enter the number, and upload an image (JPEG, JPG, PNG) or PDF. The Admin will review this document to accept or reject your application.
              </Text>
            </View>

            {/* Hidden HTML input for Web platform */}
            {Platform.OS === 'web' && (
              <input
                type="file"
                ref={webFileInputRef}
                style={{ display: 'none' }}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleWebFileChange}
              />
            )}

            <View style={styles.formCard}>
              <View style={styles.docHeaderRow}>
                <View style={styles.docInfoCol}>
                  <Text style={styles.docTitle}>Valid Proof of Identity & Address</Text>
                  <Text style={styles.docDesc}>
                    Select from Aadhaar, PAN, DL, Electricity Bill, Bank Statement, or Other ID.
                  </Text>
                </View>
                <View style={styles.docVerifiedPill}>
                  <Text style={styles.docVerifiedText}>REQUIRED</Text>
                </View>
              </View>

              {/* Document Type Selector Chips */}
              <Text style={styles.subFieldLabel}>1. Select Document Type:</Text>
              <View style={styles.typeSelectorRow}>
                {KYC_DOCUMENT_TYPES.map((typeObj) => {
                  const isSelected = selectedDocType === typeObj.id;
                  return (
                    <TouchableOpacity
                      key={typeObj.id}
                      style={[
                        styles.typeChip,
                        isSelected && styles.typeChipSelected,
                      ]}
                      onPress={() => setSelectedDocType(typeObj.id)}
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
              <View style={[styles.inputGroup, { marginTop: 10 }]}>
                <Text style={styles.inputLabel}>
                  2. {selectedDocType} Number / ID <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={docNumber}
                    onChangeText={setDocNumber}
                    placeholder={selectedTypeObj.placeholder}
                    placeholderTextColor={Colors.outline}
                    autoCapitalize="characters"
                  />
                  <AppIcon name="ShieldCheck" size={18} color={Colors.primary} />
                </View>
              </View>

              {/* Document Upload Area */}
              <View style={{ marginTop: 10 }}>
                <Text style={styles.inputLabel}>
                  3. Upload Document (JPEG, JPG, PNG, or PDF) <Text style={styles.requiredStar}>*</Text>
                </Text>

                {docUri ? (
                  /* Attached Document Preview Card */
                  <View style={styles.uploadedDocCard}>
                    <View style={styles.docPreviewRow}>
                      {isDocPdf ? (
                        <View style={styles.pdfBadge}>
                          <AppIcon name="FileText" size={26} color="#ba1a1a" />
                          <Text style={styles.pdfLabelText}>PDF</Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: docUri }}
                          style={styles.docThumbnailImg}
                          resizeMode="cover"
                        />
                      )}

                      <View style={styles.docMetaCol}>
                        <View style={styles.docSuccessRow}>
                          <AppIcon name="Check" size={16} color="#005236" />
                          <Text style={styles.docAttachedTitle}>Document Attached</Text>
                        </View>
                        <Text style={styles.docNameText} numberOfLines={1}>
                          {docName || `${selectedDocType} File`}
                        </Text>
                        <Text style={styles.docSizeText}>
                          {docSize || 'File Loaded'} • {isDocPdf ? 'PDF Document' : 'Image File'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.docActionButtonsRow}>
                      <TouchableOpacity
                        style={styles.replaceDocBtn}
                        onPress={handlePickFromGallery}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="Upload" size={14} color={Colors.primary} />
                        <Text style={styles.replaceDocText}>Change Image</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.removeDocBtn}
                        onPress={removeAttachedDocument}
                        activeOpacity={0.7}
                      >
                        <AppIcon name="X" size={14} color="#ba1a1a" />
                        <Text style={styles.removeDocText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Upload Picker Trigger Box */
                  <View style={styles.uploadDropZone}>
                    <View style={styles.uploadIconPod}>
                      {isPickingFile ? (
                        <ActivityIndicator color={Colors.primary} size="small" />
                      ) : (
                        <AppIcon name="Upload" size={26} color={Colors.primary} />
                      )}
                    </View>

                    <Text style={styles.uploadPromptTitle}>Attach Document Image or PDF</Text>
                    <Text style={styles.uploadPromptSub}>
                      Accepts JPEG, JPG, PNG or PDF up to 15 MB
                    </Text>

                    <View style={styles.uploadActionsRow}>
                      <TouchableOpacity
                        style={styles.uploadOptionBtn}
                        onPress={handlePickFromGallery}
                        activeOpacity={0.8}
                        disabled={isPickingFile}
                      >
                        <AppIcon name="Image" size={16} color={Colors.primary} />
                        <Text style={styles.uploadOptionText}>Gallery / Photos</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.uploadOptionBtn}
                        onPress={handleTakePhoto}
                        activeOpacity={0.8}
                        disabled={isPickingFile}
                      >
                        <AppIcon name="Camera" size={16} color={Colors.primary} />
                        <Text style={styles.uploadOptionText}>Use Camera</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.uploadOptionBtn}
                        onPress={() => {
                          if (Platform.OS === 'web' && webFileInputRef.current) {
                            webFileInputRef.current.click();
                          } else {
                            handlePickDocument();
                          }
                        }}
                        activeOpacity={0.8}
                        disabled={isPickingFile}
                      >
                        <AppIcon name="FileText" size={16} color={Colors.primary} />
                        <Text style={styles.uploadOptionText}>Select PDF / File</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
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
                Your technician account will <Text style={{ fontWeight: '700' }}>NOT</Text> be activated automatically. The Admin Panel will review your uploaded <Text style={{ fontWeight: '700' }}>{selectedDocType}</Text> and identity number. You will only be granted access to the Technician Dashboard after an administrator accepts your application.
              </Text>
            </View>

            {/* Summary Details */}
            <View style={styles.formCardCenter}>
              <View style={styles.bigCheckPod}>
                <AppIcon name="ShieldCheck" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.auditStatusTitle}>Application Summary</Text>
              <Text style={styles.auditStatusSub}>
                Ready for administrative audit & document verification.
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
                  <Text style={styles.summaryLabel}>Document Type</Text>
                  <Text style={styles.summaryValue}>{selectedDocType}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Document Number</Text>
                  <Text style={styles.summaryValue}>{docNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Attached Document</Text>
                  <Text style={[styles.summaryValue, { color: '#005236' }]}>
                    {docName || 'Valid ID Document Attached'} ✓
                  </Text>
                </View>
              </View>

              {/* Document Image Thumbnail in Summary */}
              {docUri && !isDocPdf && (
                <View style={styles.summaryDocPreviewWrapper}>
                  <Text style={styles.summaryPreviewTitle}>Attached ID Preview:</Text>
                  <Image
                    source={{ uri: docUri }}
                    style={styles.summaryThumbImage}
                    resizeMode="cover"
                  />
                </View>
              )}
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
                ? 'Continue to Document Verification (Step 2)'
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
  uploadDropZone: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.outline,
    borderStyle: 'dashed',
    marginTop: 6,
    gap: 8,
  },
  uploadIconPod: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0, 82, 54, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    width: '100%',
  },
  uploadOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  uploadOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  uploadedDocCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    marginTop: 6,
    gap: 12,
  },
  docPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docThumbnailImg: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  pdfBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  pdfLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ba1a1a',
  },
  docMetaCol: {
    flex: 1,
    gap: 2,
  },
  docSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  docAttachedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005236',
  },
  docNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  docSizeText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  docActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingTop: 10,
  },
  replaceDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
  },
  replaceDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  removeDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: BorderRadius.full,
  },
  removeDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ba1a1a',
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
  summaryDocPreviewWrapper: {
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  summaryPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  summaryThumbImage: {
    width: '100%',
    height: 140,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHighest,
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
