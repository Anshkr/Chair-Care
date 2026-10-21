import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AppIcon } from '../../components/common/AppIcon';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { technicianApi } from '../../services/api/technicianApi';

const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Driving License (DL)',
  'Electricity Bill',
  'Bank Statement',
  'Other Valid Govt ID',
];

interface AttachedDoc {
  uri: string;
  name: string;
  type: string;
  sizeBytes?: number;
}

export const TechnicianAccountStatusScreen: React.FC<{
  onApproved?: () => void;
}> = ({ onApproved }) => {
  const insets = useSafeAreaInsets();
  const { logout, currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);

  // Re-upload form state
  const [selectedDocType, setSelectedDocType] = useState<string>('Aadhaar Card');
  const [docNumber, setDocNumber] = useState<string>('');
  const [attachedDoc, setAttachedDoc] = useState<AttachedDoc | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string>('');

  const loadStatus = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      const res = await technicianApi.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        if (res.data.idProofType) {
          setSelectedDocType(res.data.idProofType);
        }
        if (res.data.idProofNumber) {
          setDocNumber(res.data.idProofNumber);
        }
        // If status became verified, notify parent
        if (res.data.verificationStatus === 'verified' && onApproved) {
          onApproved();
        }
      }
    } catch (err: any) {
      console.warn('Failed to load technician verification status:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [onApproved]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadStatus(false);
  };

  // Image & Document Pickers for Re-upload
  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Storage access is required to attach your ID document.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setAttachedDoc({
          uri: dataUri,
          name: asset.fileName || `document_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          sizeBytes: asset.fileSize,
        });
      }
    } catch (err: any) {
      Alert.alert('Attachment Error', err.message || 'Could not pick photo.');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to photograph your document.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
        setAttachedDoc({
          uri: dataUri,
          name: asset.fileName || `camera_id_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          sizeBytes: asset.fileSize,
        });
      }
    } catch (err: any) {
      Alert.alert('Attachment Error', err.message || 'Could not launch camera.');
    }
  };

  const pickDocument = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,application/pdf';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent: any) => {
              setAttachedDoc({
                uri: uploadEvent.target.result,
                name: file.name,
                type: file.type || 'application/pdf',
                sizeBytes: file.size,
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachedDoc({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf',
          sizeBytes: asset.size,
        });
      }
    } catch (err: any) {
      Alert.alert('Attachment Error', err.message || 'Could not select document.');
    }
  };

  const handleReuploadSubmit = async () => {
    if (!docNumber.trim()) {
      Alert.alert('Missing Field', 'Please enter your document ID number.');
      return;
    }
    if (!attachedDoc?.uri) {
      Alert.alert('Missing File', 'Please select or capture a clear photo/PDF of your document.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await technicianApi.updateProfile({
        idProofType: selectedDocType,
        idProofNumber: docNumber.trim(),
        idProofDocumentUrl: attachedDoc.uri,
      });

      if (!res.success) {
        Alert.alert('Submission Failed', res.error || 'Could not upload document.');
        return;
      }

      setSuccessToast('Document submitted successfully! Admin will review your file.');
      await loadStatus(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error occurred while submitting document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+918005550199').catch(() => {
      Alert.alert('Helpline', 'Call ChairCare Customer Support directly at +91 800 555 0199');
    });
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@chaircare.in?subject=Technician%20Application%20Inquiry').catch(() => {
      Alert.alert('Email Support', 'Please write to support@chaircare.in');
    });
  };

  const verificationStatus = profile?.verificationStatus || 'pending';
  const techName = profile?.name || currentUser?.name || 'Partner Specialist';
  const techPhone = profile?.phone || currentUser?.phone || '';
  const techEmail = profile?.email || currentUser?.email || '';

  if (isLoading) {
    return (
      <View style={[styles.centeredContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Syncing account verification status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {/* Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <BrandLogo size={32} containerStyle={{ marginRight: 8 }} />
          <View>
            <Text style={styles.brandTitle}>ChairCare Partner</Text>
            <Text style={styles.brandSubtitle}>Operations & Verification</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.75}>
          <AppIcon name="LogOut" size={16} color="#ba1a1a" />
          <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {successToast !== '' && (
          <View style={styles.toastBanner}>
            <AppIcon name="CheckCircle" size={18} color="#005236" />
            <Text style={styles.toastBannerText}>{successToast}</Text>
          </View>
        )}

        {/* 1. STATE: PENDING AUDIT */}
        {verificationStatus === 'pending' && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconBadge, { backgroundColor: '#eff6ff' }]}>
                <AppIcon name="Clock" size={26} color={Colors.secondaryCobalt} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.badgeRow}>
                  <View style={styles.pulsingBlueDot} />
                  <Text style={styles.statusBadgeTextBlue}>APPLICATION UNDER REVIEW</Text>
                </View>
                <Text style={styles.statusHeroTitle}>Welcome, {techName}!</Text>
              </View>
            </View>

            <Text style={styles.statusBodyText}>
              Your partner registration request has been submitted and is currently being audited by
              the ChairCare Operations Administration.
            </Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Audit Stage:</Text>
                <Text style={styles.infoValue}>Document & ID Verification</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Time:</Text>
                <Text style={styles.infoValue}>2 to 24 Business Hours</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Submitted ID:</Text>
                <Text style={styles.infoValue}>{profile?.idProofType || 'Aadhaar / Govt ID'}</Text>
              </View>
              {Boolean(profile?.idProofNumber) && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>ID Number:</Text>
                  <Text style={styles.infoValue}>{profile.idProofNumber}</Text>
                </View>
              )}
            </View>

            <View style={styles.noticeCallout}>
              <AppIcon name="ShieldCheck" size={18} color="#005236" />
              <Text style={styles.noticeCalloutText}>
                Once an administrator approves your profile, this screen will automatically unlock
                your Technician Dashboard, live job dispatch queue, and earnings tracker.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={handleManualRefresh}
              activeOpacity={0.85}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="RefreshCw" size={16} color="#FFFFFF" />
                  <Text style={styles.refreshBtnText}>Check Approval Status Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* 2. STATE: REJECTED */}
        {verificationStatus === 'rejected' && (
          <View style={[styles.statusCard, { borderColor: 'rgba(186, 26, 26, 0.25)' }]}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconBadge, { backgroundColor: 'rgba(186, 26, 26, 0.1)' }]}>
                <AppIcon name="AlertTriangle" size={26} color="#ba1a1a" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={[styles.badgeRow, { backgroundColor: 'rgba(186, 26, 26, 0.1)' }]}>
                  <Text style={[styles.statusBadgeTextBlue, { color: '#ba1a1a' }]}>APPLICATION REJECTED</Text>
                </View>
                <Text style={styles.statusHeroTitle}>Application Not Approved</Text>
              </View>
            </View>

            <Text style={styles.statusBodyText}>
              The ChairCare Admin Team has reviewed your submitted partner request and has rejected your application.
            </Text>

            {/* Rejection Reason Card */}
            <View style={styles.rejectionReasonBox}>
              <View style={styles.rejectionReasonHeader}>
                <AppIcon name="FileText" size={16} color="#ba1a1a" />
                <Text style={styles.rejectionReasonTitle}>Admin Rejection Reason:</Text>
              </View>
              <Text style={styles.rejectionReasonContent}>
                {profile?.rejectionReason || 'Document verification criteria not met or illegible proof.'}
              </Text>
            </View>

            <View style={[styles.noticeCallout, { backgroundColor: '#fef2f2', borderColor: '#fee2e2' }]}>
              <AppIcon name="Info" size={18} color="#ba1a1a" />
              <Text style={[styles.noticeCalloutText, { color: '#7f1d1d' }]}>
                If you believe this decision was made in error or wish to appeal and continue your onboarding, please contact Customer Care directly.
              </Text>
            </View>

            {/* Contact Actions */}
            <TouchableOpacity style={styles.callSupportBtn} onPress={handleCallSupport} activeOpacity={0.85}>
              <AppIcon name="Phone" size={18} color="#FFFFFF" />
              <Text style={styles.callSupportBtnText}>Call Customer Care (+91 800 555 0199)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailSupportBtn} onPress={handleEmailSupport} activeOpacity={0.8}>
              <AppIcon name="Mail" size={16} color={Colors.onSurface} />
              <Text style={styles.emailSupportBtnText}>Email Partner Support Desk</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. STATE: RE-UPLOAD REQUESTED */}
        {verificationStatus === 'reupload_requested' && (
          <View style={[styles.statusCard, { borderColor: 'rgba(13, 71, 161, 0.25)' }]}>
            <View style={styles.statusHeaderRow}>
              <View style={[styles.statusIconBadge, { backgroundColor: '#eff6ff' }]}>
                <AppIcon name="UploadCloud" size={26} color={Colors.secondaryCobalt} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={[styles.badgeRow, { backgroundColor: '#dbeafe' }]}>
                  <Text style={[styles.statusBadgeTextBlue, { color: Colors.secondaryCobalt }]}>
                    DOCUMENT RE-UPLOAD REQUIRED
                  </Text>
                </View>
                <Text style={styles.statusHeroTitle}>Action Required</Text>
              </View>
            </View>

            <Text style={styles.statusBodyText}>
              The Admin Team reviewed your application and requested an updated or clearer copy of your document before approval.
            </Text>

            {/* Admin Note */}
            <View style={styles.adminNoteBox}>
              <View style={styles.adminNoteHeader}>
                <AppIcon name="Info" size={16} color={Colors.secondaryCobalt} />
                <Text style={styles.adminNoteTitle}>Admin Instruction:</Text>
              </View>
              <Text style={styles.adminNoteBody}>
                {profile?.reuploadNotes || 'Please upload a clear, legible photo or PDF of your valid document.'}
              </Text>
            </View>

            {/* Document Selection & Upload Form */}
            <Text style={styles.formSectionTitle}>1. Select Valid Government ID Type</Text>
            <View style={styles.chipsContainer}>
              {DOCUMENT_TYPES.map((type) => {
                const isSelected = selectedDocType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedDocType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.formSectionTitle}>2. Document / Registration Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 5482 1928 0192 or DL-1420110012"
              placeholderTextColor={Colors.outline}
              value={docNumber}
              onChangeText={setDocNumber}
            />

            <Text style={styles.formSectionTitle}>3. Attach Clear Image or PDF</Text>
            <View style={styles.pickerButtonsRow}>
              <TouchableOpacity style={styles.pickerBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                <AppIcon name="Image" size={18} color={Colors.secondaryCobalt} />
                <Text style={styles.pickerBtnText}>Gallery / Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto} activeOpacity={0.8}>
                <AppIcon name="Camera" size={18} color={Colors.secondaryCobalt} />
                <Text style={styles.pickerBtnText}>Use Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument} activeOpacity={0.8}>
                <AppIcon name="FileText" size={18} color={Colors.secondaryCobalt} />
                <Text style={styles.pickerBtnText}>PDF / File</Text>
              </TouchableOpacity>
            </View>

            {/* Attached preview */}
            {attachedDoc && (
              <View style={styles.previewBox}>
                {attachedDoc.type.includes('image') ? (
                  <Image source={{ uri: attachedDoc.uri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.pdfPlaceholder}>
                    <AppIcon name="FileText" size={28} color={Colors.secondaryCobalt} />
                    <Text style={styles.pdfBadgeText}>PDF Document</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.previewName} numberOfLines={1}>{attachedDoc.name}</Text>
                  <Text style={styles.previewSize}>
                    {attachedDoc.sizeBytes ? `${(attachedDoc.sizeBytes / 1024).toFixed(1)} KB` : 'Ready to upload'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAttachedDoc(null)} style={{ padding: 6 }}>
                  <AppIcon name="X" size={18} color="#ba1a1a" />
                </TouchableOpacity>
              </View>
            )}

            {/* Submit Re-uploaded Document */}
            <TouchableOpacity
              style={styles.submitReuploadBtn}
              onPress={handleReuploadSubmit}
              activeOpacity={0.88}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="Send" size={18} color="#FFFFFF" />
                  <Text style={styles.submitReuploadBtnText}>Submit Document for Review</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.outline,
    fontWeight: '500',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  brandSubtitle: {
    fontSize: 11,
    color: Colors.outline,
    fontWeight: '500',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    gap: 4,
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  scrollContent: {
    padding: 16,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  toastBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#065f46',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  pulsingBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  statusBadgeTextBlue: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.5,
  },
  statusHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  statusBodyText: {
    fontSize: 13.5,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.outline,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12.5,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  noticeCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 82, 54, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 82, 54, 0.15)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    gap: 8,
  },
  noticeCalloutText: {
    flex: 1,
    fontSize: 12,
    color: '#005236',
    lineHeight: 18,
    fontWeight: '500',
  },
  refreshBtn: {
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  refreshBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  rejectionReasonBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  rejectionReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  rejectionReasonTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ba1a1a',
  },
  rejectionReasonContent: {
    fontSize: 13,
    color: '#881337',
    lineHeight: 18,
    fontWeight: '500',
  },
  callSupportBtn: {
    backgroundColor: '#ba1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  callSupportBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  emailSupportBtn: {
    backgroundColor: Colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  emailSupportBtnText: {
    color: Colors.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },
  adminNoteBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  adminNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  adminNoteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  adminNoteBody: {
    fontSize: 13,
    color: '#1e3a8a',
    lineHeight: 18,
    fontWeight: '500',
  },
  formSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
    marginTop: 6,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  chipSelected: {
    backgroundColor: Colors.secondaryCobalt,
    borderColor: Colors.secondaryCobalt,
  },
  chipText: {
    fontSize: 11.5,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: Colors.onSurface,
    marginBottom: 14,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pickerBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
  },
  previewImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  pdfPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  previewName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  previewSize: {
    fontSize: 11,
    color: Colors.outline,
    marginTop: 2,
  },
  submitReuploadBtn: {
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 10,
    gap: 8,
    marginTop: 6,
  },
  submitReuploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
