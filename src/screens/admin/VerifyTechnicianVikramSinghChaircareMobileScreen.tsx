import { AppIcon } from '../../components/common/AppIcon';
import { useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { sanitizeUserErrorMessage } from '../../services/api/apiClient';
import { phoneCallService } from '../../services/phone/phoneCallService';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';

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
  const targetId = passedId || passedTech?.id;

  const [techData, setTechData] = useState<any>(passedTech || null);
  const [isLoading, setIsLoading] = useState<boolean>(!passedTech);

  // Always refresh technician details from database on screen focus
  useFocusEffect(
    useCallback(() => {
      if (targetId) {
        adminApi.getTechnicianDetails(targetId)
          .then((res) => {
            if (res.success && res.data) {
              setTechData(res.data);
            }
          })
          .catch((err) => console.warn('Could not load technician details:', err))
          .finally(() => setIsLoading(false));
      }
    }, [targetId])
  );

  // Real technician attributes from database with no dummy fallbacks
  const techName = techData?.name || passedTech?.name || 'Technician Applicant';
  const techIdTag = techData?.id
    ? `#TK-${techData.id.substring(0, 5).toUpperCase()}`
    : passedTech?.code || '#TK-NEW';
  const phone = techData?.phone || passedTech?.phone || 'Not provided';
  const email = techData?.email || passedTech?.email || 'Not provided';
  const avatarUrl = techData?.avatarUrl || passedTech?.avatarUrl || '';
  const idProofType = techData?.idProofType || passedTech?.idProofType || 'Aadhaar / Govt ID';
  const idProofNumber = techData?.idProofNumber || passedTech?.idProofNumber || 'Not provided';
  const idProofDocUrl = techData?.idProofDocumentUrl || passedTech?.idProofDocumentUrl || '';
  const verificationStatus = techData?.verificationStatus || passedTech?.verificationStatus || 'pending';
  const rejectionReason = techData?.rejectionReason || passedTech?.rejectionReason;
  const reuploadNotes = techData?.reuploadNotes || passedTech?.reuploadNotes;
  const appliedDate = techData?.createdAt
    ? new Date(techData.createdAt).toLocaleDateString()
    : 'Recently';

  const [auditNotes, setAuditNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleCall = () => {
    phoneCallService.callNumber(phone, techName);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Email', `Composing email to ${email}`);
    });
  };

  const currentTargetId = techData?.id || passedId || passedTech?.id;

  const handleApprove = async () => {
    if (!currentTargetId) {
      Alert.alert('Error', 'No technician ID available to approve.');
      return;
    }
    try {
      const res = await adminApi.verifyTechnician(currentTargetId, 'verified');
      if (res.error) {
        Alert.alert('Verification Error', res.error || 'Failed to update technician verification status.');
        return;
      }
      if (navigation) {
        navigation.navigate('TechnicianActionConfirmed', {
          actionType: 'approve',
          actionTitle: 'Technician Verified & Onboarded',
          technicianId: currentTargetId,
          technician: {
            ...passedTech,
            id: currentTargetId,
            name: techName,
            status: 'online',
            isVerified: true,
            verifiedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Action Failed', sanitizeUserErrorMessage(err) || 'Unable to verify technician right now. Please try again.');
    }
  };

  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [isReuploadModalVisible, setIsReuploadModalVisible] = useState(false);
  const [isDocPreviewVisible, setIsDocPreviewVisible] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState('Invalid or illegible ID/Aadhaar/PAN proof');
  const [customRejectReason, setCustomRejectReason] = useState('');
  const [selectedReuploadReason, setSelectedReuploadReason] = useState('Uploaded document image is blurry or illegible');
  const [customReuploadNote, setCustomReuploadNote] = useState('');

  const REJECT_REASONS = [
    'Invalid or illegible ID/Aadhaar/PAN proof',
    'Address proof mismatch or unverifiable address',
    'Age verification requirement not met (minimum 18 years)',
    'Incomplete documentation or missing certification',
    'Service domain credentials not verified',
    'Other (specified below)',
  ];

  const REUPLOAD_REASONS = [
    'Uploaded document image is blurry or illegible',
    'Document number does not match submitted ID photo',
    'Document is expired or unverified',
    'Uploaded wrong document type',
    'Corners or crucial identity details are cut off',
    'Other specific requirement (specified below)',
  ];

  const handleRejectPrompt = () => {
    setIsRejectModalVisible(true);
  };

  const confirmRejection = async () => {
    if (!currentTargetId) {
      Alert.alert('Error', 'No technician ID available to reject.');
      return;
    }
    const finalReason =
      selectedRejectReason.includes('Other') && customRejectReason.trim()
        ? customRejectReason.trim()
        : selectedRejectReason;

    setIsRejectModalVisible(false);
    try {
      const res = await adminApi.verifyTechnician(currentTargetId, 'rejected', finalReason);
      if (res.error) {
        Alert.alert('Rejection Issue', sanitizeUserErrorMessage(res.error) || 'Failed to update technician status.');
        return;
      }
      if (navigation) {
        navigation.navigate('TechnicianActionConfirmed', {
          actionType: 'reject',
          actionTitle: 'Technician Application Rejected',
          technicianId: currentTargetId,
          technician: {
            ...passedTech,
            id: currentTargetId,
            name: techName,
            status: 'rejected',
            isVerified: false,
            rejectionReason: finalReason,
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Action Failed', sanitizeUserErrorMessage(err) || 'Unable to reject technician right now. Please try again.');
    }
  };

  const confirmReuploadRequest = async () => {
    if (!currentTargetId) {
      Alert.alert('Error', 'No technician ID available.');
      return;
    }
    const finalNote =
      selectedReuploadReason.includes('Other') && customReuploadNote.trim()
        ? customReuploadNote.trim()
        : selectedReuploadReason + (customReuploadNote.trim() ? ` - ${customReuploadNote.trim()}` : '');

    setIsReuploadModalVisible(false);
    try {
      const res = await adminApi.verifyTechnician(
        currentTargetId,
        'reupload_requested',
        undefined,
        undefined,
        finalNote
      );
      if (res.error) {
        Alert.alert('Request Issue', sanitizeUserErrorMessage(res.error) || 'Failed to send re-upload request.');
        return;
      }
      showToast(`Re-upload request sent to ${techName}.`);
      if (navigation?.canGoBack()) {
        navigation.goBack();
      } else if (navigation) {
        navigation.navigate('Technicians');
      }
    } catch (err: any) {
      Alert.alert('Action Failed', sanitizeUserErrorMessage(err) || 'Unable to send re-upload request right now. Please try again.');
    }
  };

  const handleReject = () => {
    handleRejectPrompt();
  };

  const handleRequestInfo = () => {
    setIsReuploadModalVisible(true);
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

          <AdminHeaderAvatar size={34} />
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
        {/* Verification Status Banner */}
        {verificationStatus === 'pending' && (
          <View style={[styles.statusBanner, { backgroundColor: '#fffbeb', borderColor: '#f59e0b' }]}>
            <AppIcon name="Clock" size={20} color="#d97706" />
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerTitle, { color: '#b45309' }]}>
                Application Awaiting Review
              </Text>
              <Text style={styles.statusBannerSub}>
                Review the submitted identification document below and approve, reject, or request a re-upload.
              </Text>
            </View>
          </View>
        )}

        {verificationStatus === 'reupload_requested' && (
          <View style={[styles.statusBanner, { backgroundColor: '#eff6ff', borderColor: Colors.secondaryCobalt }]}>
            <AppIcon name="UploadCloud" size={20} color={Colors.secondaryCobalt} />
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerTitle, { color: Colors.secondaryCobalt }]}>
                Re-upload Requested
              </Text>
              <Text style={styles.statusBannerSub}>
                {reuploadNotes ? `Notice sent: "${reuploadNotes}"` : 'Technician was notified to upload an updated document.'}
              </Text>
            </View>
          </View>
        )}

        {verificationStatus === 'rejected' && (
          <View style={[styles.statusBanner, { backgroundColor: '#fef2f2', borderColor: '#ba1a1a' }]}>
            <AppIcon name="AlertTriangle" size={20} color="#ba1a1a" />
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerTitle, { color: '#ba1a1a' }]}>
                Application Rejected
              </Text>
              <Text style={styles.statusBannerSub}>
                {rejectionReason ? `Reason: "${rejectionReason}"` : 'This technician application was rejected.'}
              </Text>
            </View>
          </View>
        )}

        {verificationStatus === 'verified' && (
          <View style={[styles.statusBanner, { backgroundColor: '#f0fdf4', borderColor: '#005236' }]}>
            <AppIcon name="CheckCircle" size={20} color="#005236" />
            <View style={styles.statusBannerContent}>
              <Text style={[styles.statusBannerTitle, { color: '#005236' }]}>
                Technician Verified & Active
              </Text>
              <Text style={styles.statusBannerSub}>
                Applicant credentials validated. This technician can receive dispatched customer bookings.
              </Text>
            </View>
          </View>
        )}

        {/* 1. Applicant Summary Card */}
        <View style={styles.card}>
          <View style={styles.applicantTopRow}>
            <View style={styles.applicantProfileLeft}>
              <View style={styles.applicantAvatarBox}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarInitialsBox}>
                    <Text style={styles.avatarInitialsText}>
                      {(techName || 'TC')
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.applicantNameCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.applicantNameTitle}>{techName}</Text>
                  {verificationStatus === 'verified' && (
                    <AppIcon name="CheckCircle" size={18} color="#005236" />
                  )}
                </View>
                <View style={styles.subMetaRow}>
                  <Text style={styles.techIdMono}>ID: {techIdTag}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.expText}>Role: Service Technician</Text>
                </View>
              </View>
            </View>

            <View style={[
              styles.pendingAuditBadge,
              verificationStatus === 'verified'
                ? { backgroundColor: 'rgba(0, 82, 54, 0.1)', borderColor: '#005236' }
                : verificationStatus === 'rejected'
                ? { backgroundColor: 'rgba(186, 26, 26, 0.1)', borderColor: '#ba1a1a' }
                : verificationStatus === 'reupload_requested'
                ? { backgroundColor: 'rgba(2, 132, 199, 0.1)', borderColor: Colors.secondaryCobalt }
                : { backgroundColor: 'rgba(217, 119, 6, 0.12)', borderColor: '#d97706' }
            ]}>
              <Text style={[
                styles.pendingAuditText,
                verificationStatus === 'verified'
                  ? { color: '#005236' }
                  : verificationStatus === 'rejected'
                  ? { color: '#ba1a1a' }
                  : verificationStatus === 'reupload_requested'
                  ? { color: Colors.secondaryCobalt }
                  : { color: '#b45309' }
              ]}>
                {verificationStatus === 'verified'
                  ? 'Verified'
                  : verificationStatus === 'rejected'
                  ? 'Rejected'
                  : verificationStatus === 'reupload_requested'
                  ? 'Re-upload Req.'
                  : 'Pending Review'}
              </Text>
            </View>
          </View>

          {/* Registration Date & Service Zone */}
          <View style={styles.quickMetricsStrip}>
            <View style={styles.metricItemCol}>
              <Text style={styles.metricLabelMono}>REGISTERED ON</Text>
              <Text style={styles.metricValueBold}>{appliedDate}</Text>
            </View>
            <View style={styles.metricItemCol}>
              <Text style={styles.metricLabelMono}>OPERATIONAL ZONE</Text>
              <Text style={styles.metricValueBold} numberOfLines={1}>
                {techData?.zone || 'Delhi NCR'}
              </Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactListCol}>
            <TouchableOpacity style={styles.contactTriggerItem} onPress={handleCall} activeOpacity={0.7}>
              <View style={styles.contactItemLeft}>
                <View style={styles.contactIconRoundBlue}>
                  <AppIcon name="Phone" size={18} />
                </View>
                <View>
                  <Text style={styles.contactTriggerLabel}>PHONE NUMBER</Text>
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
          </View>
        </View>

        {/* 2. Submitted Government ID Document Card (REAL DATA ONLY) */}
        <View style={styles.documentsBlock}>
          <View style={styles.docHeaderRow}>
            <View>
              <Text style={styles.sectionHeadline}>Submitted Identity Document</Text>
              <Text style={styles.docSubtitle}>
                Official identity proof uploaded by technician during registration
              </Text>
            </View>
            <View style={[
              styles.compliantBadge,
              { backgroundColor: idProofDocUrl ? 'rgba(0, 82, 54, 0.1)' : 'rgba(186, 26, 26, 0.1)' }
            ]}>
              <Text style={[
                styles.compliantBadgeText,
                { color: idProofDocUrl ? '#005236' : '#ba1a1a' }
              ]}>
                {idProofDocUrl ? 'DOCUMENT ATTACHED' : 'MISSING ATTACHMENT'}
              </Text>
            </View>
          </View>

          <View style={styles.docCard}>
            <View style={styles.docCardInner}>
              {idProofDocUrl ? (
                <TouchableOpacity
                  style={styles.docThumbnail}
                  onPress={() => setIsDocPreviewVisible(true)}
                  activeOpacity={0.8}
                >
                  {idProofDocUrl.startsWith('data:application/pdf') || idProofDocUrl.toLowerCase().endsWith('.pdf') ? (
                    <View style={styles.pdfThumbnailBox}>
                      <AppIcon name="FileText" size={28} color={Colors.secondaryCobalt} />
                      <Text style={styles.pdfThumbnailLabel}>PDF</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: idProofDocUrl }}
                      style={styles.docThumbImg}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.docBadgeOverlay}>
                    <AppIcon name="Award" size={14} color="#ffffff" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.docThumbnail, styles.noDocThumbnail]}>
                  <AppIcon name="AlertCircle" size={24} color={Colors.outline} />
                </View>
              )}

              <View style={styles.docMetaCol}>
                <View style={styles.docTitleRow}>
                  <Text style={styles.docTitleText}>{idProofType || 'Government ID'}</Text>
                  {idProofDocUrl ? (
                    <AppIcon name="CheckCircle" size={18} color="#005236" />
                  ) : (
                    <AppIcon name="AlertTriangle" size={18} color="#ba1a1a" />
                  )}
                </View>

                <View style={styles.ocrTagRow}>
                  <View style={styles.ocrPill}>
                    <View style={styles.blueMiniDot} />
                    <Text style={styles.ocrText}>ID NUMBER</Text>
                  </View>
                  <Text style={styles.docIdNumber}>{idProofNumber || 'Not provided'}</Text>
                </View>

                <Text style={styles.docDescriptionText}>
                  Applicant uploaded this credential for identity and address verification.
                </Text>

                {idProofDocUrl ? (
                  <View style={styles.docFooterRow}>
                    <TouchableOpacity
                      onPress={() => setIsDocPreviewVisible(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewDocLink}>View Document ↗</Text>
                    </TouchableOpacity>
                    <Text style={styles.docFileSize}>Attached Document</Text>
                  </View>
                ) : (
                  <Text style={styles.missingDocWarning}>
                    No document file uploaded. You can request a re-upload below.
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 3. Administrative Review Notes */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.noteTitleRow}>
              <AppIcon name="FileText" size={18} />
              <Text style={styles.sectionHeadline}>Admin Review Notes</Text>
            </View>
            <Text style={styles.internalUseText}>INTERNAL USE ONLY</Text>
          </View>

          <Text style={styles.auditorLabel}>OPERATIONAL / VERIFICATION REMARKS</Text>
          <TextInput
            style={styles.auditorTextarea}
            placeholder="Add specific operational notes, field allocation remarks, or dispatch priority tags..."
            placeholderTextColor={Colors.outline}
            value={auditNotes}
            onChangeText={setAuditNotes}
            multiline
            numberOfLines={3}
          />
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

      {/* Reject Application Modal with Reason Selection */}
      <Modal
        visible={isRejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalAlertBadge}>
                <AppIcon name="AlertTriangle" size={20} color="#ba1a1a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Reject Application</Text>
                <Text style={styles.modalSubtitle}>
                  Select reason for rejecting {techName}'s application
                </Text>
              </View>
            </View>

            <ScrollView style={styles.reasonListScroll} showsVerticalScrollIndicator={false}>
              {REJECT_REASONS.map((reason) => {
                const isSelected = selectedRejectReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOptionBtn,
                      isSelected && styles.reasonOptionBtnSelected,
                    ]}
                    onPress={() => setSelectedRejectReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text
                      style={[
                        styles.reasonOptionText,
                        isSelected && styles.reasonOptionTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {selectedRejectReason.includes('Other') && (
                <TextInput
                  style={styles.customReasonInput}
                  placeholder="Specify custom rejection reason..."
                  placeholderTextColor={Colors.outline}
                  value={customRejectReason}
                  onChangeText={setCustomRejectReason}
                  multiline
                  numberOfLines={2}
                />
              )}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsRejectModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmRejectBtn}
                onPress={confirmRejection}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmRejectText}>Confirm Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Re-upload Document Request Modal */}
      <Modal
        visible={isReuploadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReuploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalAlertBadge, { backgroundColor: '#eff6ff' }]}>
                <AppIcon name="UploadCloud" size={20} color={Colors.secondaryCobalt} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Request Document Re-upload</Text>
                <Text style={styles.modalSubtitle}>
                  Specify why {techName} needs to re-upload their document
                </Text>
              </View>
            </View>

            <ScrollView style={styles.reasonListScroll} showsVerticalScrollIndicator={false}>
              {REUPLOAD_REASONS.map((reason) => {
                const isSelected = selectedReuploadReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonOptionBtn,
                      isSelected && styles.reasonOptionBtnSelected,
                    ]}
                    onPress={() => setSelectedReuploadReason(reason)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text
                      style={[
                        styles.reasonOptionText,
                        isSelected && styles.reasonOptionTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TextInput
                style={styles.customReasonInput}
                placeholder="Additional instructions or notes for technician..."
                placeholderTextColor={Colors.outline}
                value={customReuploadNote}
                onChangeText={setCustomReuploadNote}
                multiline
                numberOfLines={2}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsReuploadModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmRejectBtn, { backgroundColor: Colors.secondaryCobalt }]}
                onPress={confirmReuploadRequest}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmRejectText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Document Image Preview Modal */}
      <Modal
        visible={isDocPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDocPreviewVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalAlertBadge, { backgroundColor: 'rgba(0, 82, 54, 0.1)' }]}>
                <AppIcon name="ShieldCheck" size={20} color="#005236" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{idProofType}</Text>
                <Text style={styles.modalSubtitle}>Document No: {idProofNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDocPreviewVisible(false)} style={{ padding: 4 }}>
                <AppIcon name="X" size={20} color={Colors.onSurface} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, minHeight: 280, maxHeight: 460, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
              {idProofDocUrl && (idProofDocUrl.startsWith('data:application/pdf') || idProofDocUrl.toLowerCase().endsWith('.pdf')) ? (
                <View style={{ alignItems: 'center', padding: 24 }}>
                  <AppIcon name="FileText" size={54} color={Colors.secondaryCobalt} />
                  <Text style={{ ...Typography.titleMedium, fontWeight: '700', color: Colors.secondaryCobalt, marginTop: 12 }}>
                    PDF Document Attached
                  </Text>
                  <Text style={{ ...Typography.bodySm, color: Colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                    {idProofType}: {idProofNumber}
                  </Text>
                </View>
              ) : idProofDocUrl ? (
                <Image
                  source={{ uri: idProofDocUrl }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ ...Typography.bodyMedium, color: Colors.outline }}>
                  No document attached
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.modalConfirmRejectBtn, { backgroundColor: Colors.primary, marginTop: 14 }]}
              onPress={() => setIsDocPreviewVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalConfirmRejectText}>Close Document Preview</Text>
            </TouchableOpacity>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    ...Shadows.level3,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalAlertBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  reasonListScroll: {
    maxHeight: 250,
    marginVertical: 8,
  },
  reasonOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 6,
    backgroundColor: Colors.surfaceContainer,
  },
  reasonOptionBtnSelected: {
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderWidth: 1,
    borderColor: '#ba1a1a',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#ba1a1a',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ba1a1a',
  },
  reasonOptionText: {
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    flex: 1,
  },
  reasonOptionTextSelected: {
    fontWeight: '700',
    color: '#ba1a1a',
  },
  customReasonInput: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.md,
    padding: 12,
    ...Typography.bodyMedium,
    color: Colors.onSurface,
    marginTop: 8,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    ...Typography.labelLarge,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  modalConfirmRejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: '#ba1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmRejectText: {
    ...Typography.labelLarge,
    fontWeight: '700',
    color: '#ffffff',
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    ...Shadows.level1,
  },
  statusBannerContent: {
    flex: 1,
  },
  statusBannerTitle: {
    ...Typography.titleMedium,
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  statusBannerSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
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
  avatarInitialsBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    ...Typography.titleMedium,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
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
  pdfThumbnailBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: BorderRadius.md,
  },
  pdfThumbnailLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    marginTop: 2,
  },
  noDocThumbnail: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingDocWarning: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '600',
    color: '#ba1a1a',
    marginTop: 4,
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
