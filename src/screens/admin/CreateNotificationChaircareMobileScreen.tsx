import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import {
  adminApi,
  AudienceMember,
  NotificationAudiencesData,
} from '../../services/api/adminApi';
import { AdminHeaderAvatar } from '../../components/common/AdminHeaderAvatar';

export type AudienceType =
  | 'all_techs'
  | 'all_customers'
  | 'selected_users'
  | 'selected_techs'
  | 'admin_team';

export interface AudienceOption {
  id: AudienceType;
  title: string;
  subtitle: string;
  badge?: string;
  icon: string;
  isPrimary?: boolean;
}

const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: 'all_techs',
    title: 'All Technicians',
    subtitle: '86 Active certified field techs online',
    badge: 'Primary',
    icon: 'engineering',
    isPrimary: true,
  },
  {
    id: 'all_customers',
    title: 'All Customers',
    subtitle: '12,450 Registered corporate enterprise clients',
    icon: 'corporate_fare',
  },
  {
    id: 'selected_users',
    title: 'Selected Users',
    subtitle: 'Custom filtered customer cohort',
    icon: 'group_add',
  },
  {
    id: 'selected_techs',
    title: 'Selected Technicians',
    subtitle: 'Zone or Class-4 gas-lift certified only',
    icon: 'pin_drop',
  },
  {
    id: 'admin_team',
    title: 'Admin Team',
    subtitle: '8 Operations & Dispatch supervisors',
    icon: 'admin_panel_settings',
  },
];

const NOTIFICATION_TYPES = [
  'Service Alert (High Priority Banner)',
  'General Announcement',
  'Maintenance Notice',
  'Important Update',
  'Emergency Alert (Critical Override)',
];

interface CreateNotificationScreenProps {
  navigation?: any;
}

export const CreateNotificationChaircareMobileScreen: React.FC<
  CreateNotificationScreenProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Form State
  const [selectedAudience, setSelectedAudience] =
    useState<AudienceType>('all_techs');
  const [selectedType, setSelectedType] = useState<string>(
    'Service Alert (High Priority Banner)'
  );
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(
    'Service Area Update: Cyber City Expansion'
  );
  const [message, setMessage] = useState<string>(
    'Please review your updated service area before accepting new requests. New commercial buildings in Cyber City Phase 2 are now eligible for priority dispatch with bonus incentives.'
  );
  const [deliverySchedule, setDeliverySchedule] = useState<'now' | 'later'>('now');
  const [pushChannelEnabled, setPushChannelEnabled] = useState<boolean>(true);
  const [inboxChannelEnabled, setInboxChannelEnabled] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real backend audiences state
  const [audienceData, setAudienceData] =
    useState<NotificationAudiencesData | null>(null);
  const [isLoadingAudiences, setIsLoadingAudiences] = useState<boolean>(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  const loadAudiences = useCallback(async () => {
    try {
      setIsLoadingAudiences(true);
      const res = await adminApi.getNotificationAudiences();
      if (res.success && res.data) {
        setAudienceData(res.data);
      }
    } catch {
      // fallback
    } finally {
      setIsLoadingAudiences(false);
    }
  }, []);

  useEffect(() => {
    loadAudiences();
  }, [loadAudiences]);

  const dynamicAudienceOptions: AudienceOption[] = useMemo(() => [
    {
      id: 'all_techs',
      title: 'All Technicians',
      subtitle: `${audienceData?.counts.allTechs ?? 86} Verified field specialists (${audienceData?.counts.activeTechsOnline ?? 0} active online)`,
      badge: 'Fleet',
      icon: 'engineering',
      isPrimary: true,
    },
    {
      id: 'all_customers',
      title: 'All Customers',
      subtitle: `${audienceData?.counts.allCustomers ?? 12450} Registered enterprise & corporate clients`,
      icon: 'corporate_fare',
    },
    {
      id: 'selected_users',
      title: 'Selected Users',
      subtitle:
        selectedUserIds.length > 0
          ? `${selectedUserIds.length} customer account(s) chosen`
          : 'Filter and choose specific customer accounts',
      icon: 'group_add',
      badge: selectedUserIds.length > 0 ? `${selectedUserIds.length} Chosen` : undefined,
    },
    {
      id: 'selected_techs',
      title: 'Selected Technicians',
      subtitle:
        selectedTechIds.length > 0
          ? `${selectedTechIds.length} technician specialist(s) chosen`
          : 'Choose specific technicians by name/specialty',
      icon: 'pin_drop',
      badge: selectedTechIds.length > 0 ? `${selectedTechIds.length} Chosen` : undefined,
    },
    {
      id: 'admin_team',
      title: 'Admin Team',
      subtitle: `${audienceData?.counts.adminTeam ?? 8} Operations & dispatch supervisors`,
      icon: 'admin_panel_settings',
    },
  ], [audienceData, selectedUserIds, selectedTechIds]);

  const toggleSelectMember = (id: string) => {
    if (selectedAudience === 'selected_users') {
      setSelectedUserIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedTechIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAllMembers = () => {
    if (selectedAudience === 'selected_users') {
      const allIds = (audienceData?.members.customers || []).map((c) => c.id);
      setSelectedUserIds(allIds);
    } else {
      const allIds = (audienceData?.members.technicians || []).map((t) => t.id);
      setSelectedTechIds(allIds);
    }
  };

  const handleClearSelectedMembers = () => {
    if (selectedAudience === 'selected_users') {
      setSelectedUserIds([]);
    } else {
      setSelectedTechIds([]);
    }
  };

  const handleContinue = () => {
    if (!title.trim() || !message.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please provide both notification title and message.');
      } else {
        Alert.alert('Incomplete Form', 'Please provide both notification title and message.');
      }
      return;
    }

    if (selectedAudience === 'selected_users' && selectedUserIds.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Please select at least one customer account to receive this broadcast.');
      } else {
        Alert.alert('No Customers Selected', 'Please tap "Select Specific Customers" and choose at least one account.');
      }
      return;
    }

    if (selectedAudience === 'selected_techs' && selectedTechIds.length === 0) {
      if (Platform.OS === 'web') {
        window.alert('Please select at least one technician to receive this broadcast.');
      } else {
        Alert.alert('No Technicians Selected', 'Please tap "Select Specific Technicians" and choose at least one specialist.');
      }
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const targetRecipientCount =
      selectedAudience === 'all_techs'
        ? audienceData?.counts.allTechs ?? 86
        : selectedAudience === 'all_customers'
        ? audienceData?.counts.allCustomers ?? 12450
        : selectedAudience === 'admin_team'
        ? audienceData?.counts.adminTeam ?? 8
        : selectedAudience === 'selected_users'
        ? selectedUserIds.length
        : selectedTechIds.length;

    const notificationPayload = {
      id: `notif-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      audience: selectedAudience,
      audienceLabel:
        dynamicAudienceOptions.find((a) => a.id === selectedAudience)?.title ||
        'All Technicians',
      notificationType: selectedType,
      notificationTag: selectedType.split('(')[0].trim(),
      deliverySchedule,
      channels: {
        push: pushChannelEnabled,
        inbox: inboxChannelEnabled,
      },
      scheduledTime: deliverySchedule === 'later' ? 'Tomorrow, 09:00 AM' : 'Immediate',
      recipientCount: String(targetRecipientCount),
      targetCount: targetRecipientCount,
      selectedUserIds:
        selectedAudience === 'selected_users'
          ? selectedUserIds
          : selectedAudience === 'selected_techs'
          ? selectedTechIds
          : undefined,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(false);

    // Navigate to A41 — Notification Confirmation Sent
    if (navigation) {
      navigation.navigate('NotificationConfirmationSent', {
        notificationData: notificationPayload,
        notifId: notificationPayload.id,
      });
    }
  };

  const handleDiscard = () => {
    setTitle('');
    setMessage('');
    setSelectedAudience('all_techs');
    setSelectedUserIds([]);
    setSelectedTechIds([]);
    setDeliverySchedule('now');
    if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('Notifications');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Create Notification
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            accessibilityLabel="More actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <AdminHeaderAvatar size={34} />
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Banner */}
        <View style={styles.contextBanner}>
          <View style={styles.contextIconBox}>
            <AppIcon name="campaign" size={20} />
          </View>
          <View style={styles.contextTextGroup}>
            <Text style={styles.contextTitle}>Broadcast Control</Text>
            <Text style={styles.contextSubtitle}>
              Deploy targeted operational announcements, critical ergonomic
              recall notices, or instant field alerts.
            </Text>
          </View>
        </View>

        {/* Section 1: Target Audience Selection */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              Target Audience <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.cohortsBadge}>
              <Text style={styles.cohortsBadgeText}>5 Cohorts</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Define recipient segmentation for localized dispatching and priority
            queues.
          </Text>

          <View style={styles.audienceList}>
            {dynamicAudienceOptions.map((option) => {
              const isSelected = selectedAudience === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.audienceCard,
                    isSelected && styles.audienceCardSelected,
                  ]}
                  onPress={() => setSelectedAudience(option.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.audienceLeft}>
                    <View
                      style={[
                        styles.audienceIconBox,
                        isSelected
                          ? styles.audienceIconBoxSelected
                          : styles.audienceIconBoxNeutral,
                      ]}
                    >
                      <AppIcon
                        name={option.icon}
                        size={20}
                        color={isSelected ? Colors.secondary : Colors.onSurfaceVariant}
                        strokeWidth={1.8}
                      />
                    </View>
                    <View style={styles.audienceInfo}>
                      <View style={styles.audienceTitleRow}>
                        <Text style={styles.audienceTitle} numberOfLines={1}>
                          {option.title}
                        </Text>
                        {option.badge && (
                          <View style={styles.primaryPill}>
                            <Text style={styles.primaryPillText}>
                              {option.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.audienceSubtitle} numberOfLines={1}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.radioCheckCircle,
                      isSelected && styles.radioCheckCircleSelected,
                    ]}
                  >
                    {isSelected && (
                      <AppIcon name="check" size={20} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Manage Members CTA for Targeted Cohorts */}
            {(selectedAudience === 'selected_users' ||
              selectedAudience === 'selected_techs') && (
              <TouchableOpacity
                style={styles.manageMembersBtn}
                onPress={() => {
                  setMemberSearchQuery('');
                  setIsMemberModalOpen(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.manageMembersLeft}>
                  <View style={styles.manageMembersIconBox}>
                    <AppIcon name="person_search" size={20} color="#0051d5" />
                  </View>
                  <View>
                    <Text style={styles.manageMembersTitle}>
                      {selectedAudience === 'selected_users'
                        ? `Select Specific Customers (${selectedUserIds.length} selected)`
                        : `Select Specific Technicians (${selectedTechIds.length} selected)`}
                    </Text>
                    <Text style={styles.manageMembersSubtitle}>
                      Tap to search, filter, and pick exact target accounts
                    </Text>
                  </View>
                </View>
                <AppIcon name="chevron_right" size={20} color="#0051d5" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section 2: Notification Type Selector */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>
            Notification Type <Text style={styles.requiredAsterisk}>*</Text>
          </Text>

          <TouchableOpacity
            style={styles.dropdownSelector}
            onPress={() => setIsTypeDropdownOpen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.dropdownLeft}>
              <AppIcon name="warning" size={20} />
              <Text style={styles.dropdownSelectedText} numberOfLines={1}>
                {selectedType}
              </Text>
            </View>
            <AppIcon name="expand_more" size={20} />
          </TouchableOpacity>

          <View style={styles.typeInfoBanner}>
            <AppIcon name="info" size={20} />
            <Text style={styles.typeInfoText}>
              High-visibility tone with immediate status-bar alert chime.
            </Text>
          </View>
        </View>

        {/* Section 3: Message Content Inputs */}
        <View style={styles.contentCard}>
          <View style={styles.contentCardHeader}>
            <Text style={styles.contentCardTitle}>Message Content</Text>
            <View style={styles.draftBadge}>
              <Text style={styles.draftBadgeText}>DRAFT #204</Text>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>
                Notification Title <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Text style={styles.charCounter}>{title.length} / 60</Text>
            </View>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
              placeholder="e.g. Ergonomic Recall or Dispatch Notice"
              placeholderTextColor="#76777d"
            />
          </View>

          {/* Message Textarea */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Text style={styles.inputLabel}>
                Notification Message{' '}
                <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <Text style={styles.charCounterHighlight}>
                {message.length} / 250
              </Text>
            </View>
            <TextInput
              style={styles.textAreaInput}
              value={message}
              onChangeText={setMessage}
              maxLength={250}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Enter the broadcast body..."
              placeholderTextColor="#76777d"
            />
          </View>
        </View>

        {/* Visual Ergonomic Asset Spec Banner */}
        <View style={styles.assetBanner}>
          <View style={styles.assetImageWrapper}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1580481077197-73fa1380b62b?auto=format&fit=crop&w=300&q=80',
              }}
              style={styles.assetImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.assetInfo}>
            <View style={styles.assetBadgeRow}>
              <View style={styles.assetZoneBadge}>
                <Text style={styles.assetZoneBadgeText}>ZONE ASSET</Text>
              </View>
              <Text style={styles.assetSpecText}>Class-4 Hydr.</Text>
            </View>
            <Text style={styles.assetHubTitle} numberOfLines={1}>
              Cyber City Hub 02
            </Text>
            <Text style={styles.assetHubSub}>
              Automated route recalibration ready
            </Text>
          </View>
        </View>

        {/* Section 4: Delivery Schedule & Channels */}
        <View style={styles.contentCard}>
          <Text style={styles.contentCardTitle}>Delivery & Routing</Text>

          {/* Schedule Toggle Pills */}
          <View style={styles.schedulePillsGrid}>
            <TouchableOpacity
              style={[
                styles.schedulePill,
                deliverySchedule === 'now'
                  ? styles.schedulePillActive
                  : styles.schedulePillInactive,
              ]}
              onPress={() => setDeliverySchedule('now')}
              activeOpacity={0.8}
            >
              <View style={styles.schedulePillHeader}>
                <AppIcon name="bolt" size={20} />
                <Text
                  style={[
                    styles.schedulePillTitle,
                    deliverySchedule === 'now' && styles.schedulePillTitleActive,
                  ]}
                >
                  Send Now
                </Text>
              </View>
              <Text
                style={[
                  styles.schedulePillSub,
                  deliverySchedule === 'now' && styles.schedulePillSubActive,
                ]}
              >
                Immediate broadcast
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.schedulePill,
                deliverySchedule === 'later'
                  ? styles.schedulePillActive
                  : styles.schedulePillInactive,
              ]}
              onPress={() => setDeliverySchedule('later')}
              activeOpacity={0.8}
            >
              <View style={styles.schedulePillHeader}>
                <AppIcon name="schedule" size={20} />
                <Text
                  style={[
                    styles.schedulePillTitle,
                    deliverySchedule === 'later' &&
                      styles.schedulePillTitleActive,
                  ]}
                >
                  Schedule
                </Text>
              </View>
              <Text
                style={[
                  styles.schedulePillSub,
                  deliverySchedule === 'later' &&
                    styles.schedulePillSubActive,
                ]}
              >
                Tomorrow, 09:00 AM
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scheduled Time Pickers (Visible when 'later' is selected) */}
          {deliverySchedule === 'later' && (
            <View style={styles.scheduleTimeBox}>
              <View style={styles.scheduleTimeHeader}>
                <Text style={styles.scheduleTimeTitle}>
                  Scheduled Timestamp
                </Text>
                <Text style={styles.scheduleUtc}>UTC+02:00</Text>
              </View>
              <View style={styles.schedulePickersRow}>
                <View style={styles.pickerChip}>
                  <AppIcon name="calendar_today" size={20} />
                  <Text style={styles.pickerText}>Tomorrow, Oct 24</Text>
                </View>
                <View style={styles.pickerChip}>
                  <AppIcon name="alarm" size={20} />
                  <Text style={styles.pickerText}>09:00 AM</Text>
                </View>
              </View>
            </View>
          )}

          {/* Transmission Channels */}
          <View style={styles.channelsSection}>
            <Text style={styles.channelsHeading}>Transmission Channels</Text>
            <View style={styles.channelsList}>
              <TouchableOpacity
                style={styles.channelRow}
                onPress={() => setPushChannelEnabled(!pushChannelEnabled)}
                activeOpacity={0.7}
              >
                <View style={styles.channelLeft}>
                  <View style={styles.channelIconBoxBlue}>
                    <AppIcon name="notifications_active" size={20} />
                  </View>
                  <View>
                    <Text style={styles.channelTitle}>Push Notification</Text>
                    <Text style={styles.channelSubtitle}>
                      FCM & APNs High-Priority Push
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.channelCheckbox,
                    pushChannelEnabled && styles.channelCheckboxActive,
                  ]}
                >
                  {pushChannelEnabled && (
                    <AppIcon name="check" size={20} />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelRow}
                onPress={() => setInboxChannelEnabled(!inboxChannelEnabled)}
                activeOpacity={0.7}
              >
                <View style={styles.channelLeft}>
                  <View style={styles.channelIconBoxGreen}>
                    <AppIcon name="move_to_inbox" size={20} />
                  </View>
                  <View>
                    <Text style={styles.channelTitle}>In-App Inbox Alert</Text>
                    <Text style={styles.channelSubtitle}>
                      Persistent action card in Tech Portal
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.channelCheckbox,
                    inboxChannelEnabled && styles.channelCheckboxActive,
                  ]}
                >
                  {inboxChannelEnabled && (
                    <AppIcon name="check" size={20} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Section 5: Realistic Mobile Push Preview Card */}
        <View style={styles.previewSection}>
          <View style={styles.previewHeaderRow}>
            <View style={styles.previewHeaderLeft}>
              <AppIcon name="preview" size={20} />
              <Text style={styles.previewHeaderLabel}>
                LIVE NOTIFICATION PREVIEW
              </Text>
            </View>
            <View style={styles.mockTagBadge}>
              <Text style={styles.mockTagText}>iOS & Android Mock</Text>
            </View>
          </View>

          {/* Preview Capsule Card */}
          <View style={styles.previewFrame}>
            <View style={styles.lockScreenBar}>
              <Text style={styles.lockScreenLabel}>LOCK SCREEN DISPLAY</Text>
              <View style={styles.lockMeta}>
                <AppIcon name="lock" size={20} />
                <Text style={styles.lockText}>Preview</Text>
              </View>
            </View>

            <View style={styles.pushCapsule}>
              <View style={styles.pushCapsuleHeader}>
                <View style={styles.pushAppBrand}>
                  <View style={styles.chairCareIconBadge}>
                    <AppIcon name="chair" size={20} />
                  </View>
                  <Text style={styles.chairBrandText}>ChairCare</Text>
                  <View style={styles.capsuleDot} />
                  <Text style={styles.capsuleTag} numberOfLines={1}>
                    {selectedType.split('(')[0].trim()}
                  </Text>
                </View>
                <Text style={styles.pushTimeText}>Just now</Text>
              </View>

              <View style={styles.pushBodyGroup}>
                <Text style={styles.pushTitle} numberOfLines={1}>
                  {title.trim() || 'Notification Title'}
                </Text>
                <Text style={styles.pushSnippet} numberOfLines={2}>
                  {message.trim() ||
                    'Notification message preview appears here...'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.actionControls}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              isSubmitting && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.88}
            disabled={isSubmitting}
          >
            <Text style={styles.continueButtonText}>
              {isSubmitting ? 'Preparing Dispatch...' : 'Continue to Confirmation'}
            </Text>
            <AppIcon name="arrow_forward" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscard}
            activeOpacity={0.7}
          >
            <Text style={styles.discardButtonText}>Discard Draft</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Type Selector Modal */}
      <Modal
        visible={isTypeDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTypeDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsTypeDropdownOpen(false)}
        >
          <View style={styles.dropdownModalCard}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>
                Select Notification Type
              </Text>
              <TouchableOpacity onPress={() => setIsTypeDropdownOpen(false)}>
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.dropdownOptionsList}>
              {NOTIFICATION_TYPES.map((typeOption) => {
                const isSelected = selectedType === typeOption;
                return (
                  <TouchableOpacity
                    key={typeOption}
                    style={[
                      styles.typeOptionItem,
                      isSelected && styles.typeOptionItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedType(typeOption);
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.typeOptionText,
                        isSelected && styles.typeOptionTextSelected,
                      ]}
                    >
                      {typeOption}
                    </Text>
                    {isSelected && (
                      <Text style={styles.typeSelectedCheck}>check</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Member Selection Modal for Targeted Cohorts */}
      <Modal
        visible={isMemberModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsMemberModalOpen(false)}
      >
        <View style={styles.dropdownModalBackdrop}>
          <View style={[styles.dropdownModalCard, { maxHeight: '80%', minHeight: 400 }]}>
            <View style={styles.dropdownModalHeader}>
              <View>
                <Text style={styles.dropdownModalTitle}>
                  {selectedAudience === 'selected_users'
                    ? 'Target Customer Accounts'
                    : 'Target Technicians'}
                </Text>
                <Text style={styles.dropdownModalSubtitle}>
                  {selectedAudience === 'selected_users'
                    ? `${selectedUserIds.length} of ${audienceData?.members.customers.length ?? 0} selected`
                    : `${selectedTechIds.length} of ${audienceData?.members.technicians.length ?? 0} selected`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsMemberModalOpen(false)}>
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.modalSearchBox}>
              <AppIcon name="search" size={18} color="#565e74" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={
                  selectedAudience === 'selected_users'
                    ? 'Search customer name, phone, email...'
                    : 'Search technician name, phone, email...'
                }
                placeholderTextColor="#727782"
                value={memberSearchQuery}
                onChangeText={setMemberSearchQuery}
              />
              {memberSearchQuery ? (
                <TouchableOpacity onPress={() => setMemberSearchQuery('')}>
                  <AppIcon name="cancel" size={16} color="#727782" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Actions (Select All / Clear) */}
            <View style={styles.modalQuickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleSelectAllMembers}
              >
                <Text style={styles.quickActionBtnText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={handleClearSelectedMembers}
              >
                <Text style={styles.quickActionBtnText}>Clear Selection</Text>
              </TouchableOpacity>
            </View>

            {/* Member List */}
            <ScrollView style={{ flex: 1, marginVertical: 8 }} showsVerticalScrollIndicator={false}>
              {(() => {
                const rawList =
                  selectedAudience === 'selected_users'
                    ? audienceData?.members.customers || []
                    : audienceData?.members.technicians || [];
                const q = memberSearchQuery.toLowerCase().trim();
                const filtered = rawList.filter(
                  (m) =>
                    !q ||
                    m.name.toLowerCase().includes(q) ||
                    m.phone.toLowerCase().includes(q) ||
                    m.email.toLowerCase().includes(q)
                );

                if (filtered.length === 0) {
                  return (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'Inter-Medium', color: '#565e74' }}>
                        No members found matching "{memberSearchQuery}".
                      </Text>
                    </View>
                  );
                }

                return filtered.map((member) => {
                  const isChecked =
                    selectedAudience === 'selected_users'
                      ? selectedUserIds.includes(member.id)
                      : selectedTechIds.includes(member.id);

                  return (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberListItem,
                        isChecked && styles.memberListItemChecked,
                      ]}
                      onPress={() => toggleSelectMember(member.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.memberListItemLeft}>
                        <View
                          style={[
                            styles.memberCheckbox,
                            isChecked && styles.memberCheckboxActive,
                          ]}
                        >
                          {isChecked && <AppIcon name="check" size={16} color="#ffffff" />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.memberListName}>{member.name}</Text>
                            {member.isOnline ? (
                              <View style={styles.onlineBadgePill}>
                                <Text style={styles.onlineBadgePillText}>ONLINE</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.memberListMeta}>
                            {member.phone || member.email || member.id.substring(0, 8)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>

            {/* Done button */}
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setIsMemberModalOpen(false)}
            >
              <Text style={styles.modalDoneBtnText}>Done (Save Selection)</Text>
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
    backgroundColor: '#f7f9fb',
  },

  /* Header */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.94)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
    zIndex: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#45464d',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    ...Shadows.level1,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Scroll container */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 20,
  },
  scrollContentDesktop: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  /* Context Banner */
  contextBanner: {
    backgroundColor: '#f2f4f6',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    ...Shadows.level1,
  },
  contextIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#316bf3',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contextIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  contextTextGroup: {
    flex: 1,
  },
  contextTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  contextSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    marginTop: 2,
    lineHeight: 17,
  },

  /* Form Section */
  formSection: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  requiredAsterisk: {
    color: '#ba1a1a',
  },
  cohortsBadge: {
    backgroundColor: 'rgba(219, 225, 255, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cohortsBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#0051d5',
    textTransform: 'uppercase',
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    marginTop: -2,
    lineHeight: 16,
  },

  /* Audience List */
  audienceList: {
    gap: 8,
    marginTop: 4,
  },
  audienceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  audienceCardSelected: {
    backgroundColor: '#f2f4f6',
    borderColor: '#0051d5',
    borderWidth: 1.5,
  },
  audienceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  audienceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceIconBoxSelected: {
    backgroundColor: '#316bf3',
  },
  audienceIconBoxNeutral: {
    backgroundColor: '#e6e8ea',
  },
  audienceIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    includeFontPadding: false,
  },
  audienceIconSelected: {
    color: '#ffffff',
  },
  audienceIconNeutral: {
    color: '#45464d',
  },
  audienceInfo: {
    flex: 1,
  },
  audienceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audienceTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  primaryPill: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  primaryPillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    fontWeight: '700',
    color: '#00174b',
  },
  audienceSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
    marginTop: 1,
  },
  radioCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheckCircleSelected: {
    backgroundColor: '#0051d5',
  },
  checkIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Dropdown Selector */
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  dropdownWarningIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  dropdownSelectedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#191c1e',
    flex: 1,
  },
  dropdownChevronIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#76777d',
    includeFontPadding: false,
  },
  typeInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeInfoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  typeInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#003ea8',
    flex: 1,
  },

  /* Content Card */
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
    ...Shadows.level1,
  },
  contentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentCardTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  draftBadge: {
    backgroundColor: '#eceef0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  charCounter: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  charCounterHighlight: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
  },
  textInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textAreaInput: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    lineHeight: 19,
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  /* Visual Asset Banner */
  assetBanner: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    ...Shadows.level2,
  },
  assetImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e0e3e5',
  },
  assetImage: {
    width: '100%',
    height: '100%',
  },
  assetInfo: {
    flex: 1,
  },
  assetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assetZoneBadge: {
    backgroundColor: '#6ffbbe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  assetZoneBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    fontWeight: '700',
    color: '#002113',
  },
  assetSpecText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#dae2fd',
  },
  assetHubTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  assetHubSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#bec6e0',
  },

  /* Delivery Schedule */
  schedulePillsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  schedulePill: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  schedulePillActive: {
    backgroundColor: '#000000',
    ...Shadows.level1,
  },
  schedulePillInactive: {
    backgroundColor: '#eceef0',
  },
  schedulePillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  schedulePillIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  schedulePillIconActive: {
    color: '#ffffff',
  },
  schedulePillTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
  },
  schedulePillTitleActive: {
    color: '#ffffff',
  },
  schedulePillSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  schedulePillSubActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  /* Scheduled Time Box */
  scheduleTimeBox: {
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  scheduleTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTimeTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#191c1e',
  },
  scheduleUtc: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 10,
    color: '#0051d5',
  },
  schedulePickersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 6,
    ...Shadows.level1,
  },
  pickerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#76777d',
    includeFontPadding: false,
  },
  pickerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#191c1e',
  },

  /* Channels */
  channelsSection: {
    gap: 8,
    paddingTop: 4,
  },
  channelsHeading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  channelsList: {
    gap: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: 12,
    padding: 12,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  channelIconBoxBlue: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIconBlue: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#00174b',
    includeFontPadding: false,
  },
  channelIconBoxGreen: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6ffbbe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelIconGreen: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#002113',
    includeFontPadding: false,
  },
  channelTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    fontWeight: '600',
    color: '#191c1e',
  },
  channelSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  channelCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#e0e3e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelCheckboxActive: {
    backgroundColor: '#0051d5',
  },
  channelCheckIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Preview Section */
  previewSection: {
    gap: 8,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewHeaderIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },
  previewHeaderLabel: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#45464d',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mockTagBadge: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockTagText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#45464d',
  },
  previewFrame: {
    backgroundColor: 'rgba(230, 232, 234, 0.7)',
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lockScreenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockScreenLabel: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#76777d',
    letterSpacing: 0.5,
  },
  lockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#76777d',
    includeFontPadding: false,
  },
  lockText: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  pushCapsule: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 6,
    ...Shadows.level2,
  },
  pushCapsuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pushAppBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  chairCareIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chairIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
  },
  chairBrandText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1e',
  },
  capsuleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#76777d',
  },
  capsuleTag: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#0051d5',
    flex: 1,
  },
  pushTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#76777d',
  },
  pushBodyGroup: {
    gap: 2,
  },
  pushTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#191c1e',
    lineHeight: 18,
  },
  pushSnippet: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#45464d',
    lineHeight: 17,
  },

  /* Action Controls */
  actionControls: {
    gap: 10,
    paddingTop: 8,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButtonIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  discardButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#45464d',
  },

  /* Dropdown Modal */
  dropdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    maxWidth: 420,
    width: '100%',
    gap: 12,
    ...Shadows.level3,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  dropdownModalTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1e',
  },
  dropdownCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#76777d',
    includeFontPadding: false,
  },
  dropdownOptionsList: {
    gap: 4,
  },
  typeOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  typeOptionItemSelected: {
    backgroundColor: '#f2f4f6',
  },
  typeOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    flex: 1,
  },
  typeOptionTextSelected: {
    fontFamily: 'Inter-SemiBold',
    color: '#0051d5',
    fontWeight: '600',
  },
  typeSelectedCheck: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    includeFontPadding: false,
  },

  /* Manage Members Button */
  manageMembersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#edf0ff',
    borderWidth: 1,
    borderColor: '#c6d3f7',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  manageMembersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  manageMembersIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageMembersTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: '#0051d5',
  },
  manageMembersSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#565e74',
    marginTop: 1,
  },

  /* Member Selection Modal */
  dropdownModalSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#565e74',
    marginTop: 2,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#131b2e',
    padding: 0,
  },
  modalQuickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 6,
  },
  quickActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#e6eaf5',
  },
  quickActionBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#0051d5',
  },
  memberListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8ecf2',
  },
  memberListItemChecked: {
    borderColor: '#0051d5',
    backgroundColor: '#f3f6ff',
  },
  memberListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  memberCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#b4bac7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  memberCheckboxActive: {
    backgroundColor: '#0051d5',
    borderColor: '#0051d5',
  },
  memberListName: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
    color: '#131b2e',
  },
  onlineBadgePill: {
    backgroundColor: '#defbe6',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  onlineBadgePillText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 9,
    color: '#008736',
  },
  memberListMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6e7587',
    marginTop: 2,
  },
  modalDoneBtn: {
    backgroundColor: '#0051d5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalDoneBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
});
