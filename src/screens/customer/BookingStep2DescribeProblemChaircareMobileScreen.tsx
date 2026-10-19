import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { PrecisionButton } from '../../components/common/PrecisionButton';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';

interface IssueChip {
  id: string;
  label: string;
  icon: string;
}

const ISSUE_OPTIONS: IssueChip[] = [
  { id: 'broken-mechanism', label: 'Broken Mechanism', icon: 'Settings' },
  { id: 'tilt-problem', label: 'Tilt Problem', icon: 'RefreshCw' },
  { id: 'height-adjust', label: 'Height Adjustment', icon: 'ArrowUpDown' },
  { id: 'loose-wobble', label: 'Loose Parts / Wobble', icon: 'Settings' },
  { id: 'wheel-damage', label: 'Wheel Damage', icon: 'Disc' },
  { id: 'unusual-squeaks', label: 'Unusual Squeaks / Noise', icon: 'Volume2' },
  { id: 'armrest-damage', label: 'Armrest Damage', icon: 'Armchair' },
  { id: 'other-issue', label: 'Other Issue', icon: 'Plus' },
];

interface PhotoItem {
  id: string;
  label: string;
  uri: string;
}

/**
 * Screen ID: C05
 * Title: Booking Step 2: Ergonomic Diagnostics & Photos
 * Reference: design-reference/customer/booking_step_2_describe_problem_chaircare_mobile
 */
export const BookingStep2DescribeProblemChaircareMobileScreen: React.FC<{
  navigation: any;
}> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isCustomerAuthorized, setPendingReturnRoute } = useAuth();
  const { draft, updateDraft } = useBooking();

  // Initialize selected issues from context - clean empty default
  const [selectedIssues, setSelectedIssues] = useState<string[]>(() => {
    if (draft?.symptoms && draft.symptoms.length > 0) {
      // Map symptom names or IDs if present
      const matched = ISSUE_OPTIONS.filter((opt) =>
        draft.symptoms?.some((s) => s.toLowerCase().includes(opt.label.toLowerCase()) || opt.label.toLowerCase().includes(s.toLowerCase()))
      ).map((opt) => opt.id);
      if (matched.length > 0) return matched;
    }
    return [];
  });

  const [chairModel, setChairModel] = useState<string>(
    draft?.chairType || 'Herman Miller Aeron'
  );

  const [description, setDescription] = useState<string>(
    draft?.problemDescription || ''
  );

  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    if (draft?.photoUris && draft.photoUris.length > 0) {
      return draft.photoUris.map((uri, index) => ({
        id: `p-${index}-${Date.now()}`,
        label: `Photo ${index + 1}`,
        uri,
      }));
    }
    return [];
  });

  const currentServiceTitle = draft?.serviceTitle || 'Office Chair Repair';

  const toggleIssue = (issueId: string) => {
    setSelectedIssues((prev) =>
      prev.includes(issueId)
        ? prev.filter((id) => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleAddPhoto = () => {
    if (photos.length >= 4) return;
    const newId = `p${Date.now()}`;
    setPhotos((prev) => [
      ...prev,
      {
        id: newId,
        label: `Photo ${prev.length + 1}`,
        uri: 'https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=500&auto=format&fit=crop&q=60',
      },
    ]);
  };

  const handleContinue = () => {
    const selectedLabels = ISSUE_OPTIONS.filter((opt) =>
      selectedIssues.includes(opt.id)
    ).map((opt) => opt.label);

    updateDraft({
      chairType: chairModel.trim() || 'Office Ergonomic Chair',
      symptoms: selectedLabels,
      problemDescription: description,
      photoUris: photos.map((p) => p.uri),
    });

    if (!isCustomerAuthorized) {
      setPendingReturnRoute('BookingStep3');
      navigation.navigate('AuthenticationGate', {
        returnTo: 'BookingStep3',
        serviceId: draft?.serviceId,
        serviceTitle: draft?.serviceTitle,
        estimatedPrice: draft?.estimatedTotal,
        serviceCode: draft?.serviceCode,
      });
      return;
    }

    navigation.navigate('BookingStep3');
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.flowLabel}>CHAIRCARE FLOW</Text>
            <Text style={styles.headerTitle}>Ergonomic Diagnostics</Text>
          </View>
        </View>

        {isAuthenticated && (
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfileTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step & Progress Tracker */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.stepCounterText}>STEP 2 OF 5</Text>
            <Text style={styles.percentText}>40% Complete</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
        </View>

        {/* Current Service Context Reminder Pill */}
        <TouchableOpacity
          style={styles.currentServicePill}
          onPress={() => navigation.navigate('BookingStep1')}
          activeOpacity={0.8}
        >
          <View style={styles.servicePillLeft}>
            <View style={styles.servicePillIconBox}>
              <AppIcon name="Wrench" size={18} />
            </View>
            <View style={styles.servicePillInfo}>
              <Text style={styles.currentServiceTag}>CURRENT SERVICE</Text>
              <Text style={styles.currentServiceTitle} numberOfLines={1}>
                {currentServiceTitle}
              </Text>
            </View>
          </View>
          <View style={styles.servicePillRight}>
            <Text style={styles.changeLinkText}>Change</Text>
            <Text style={styles.changeArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Title & Subtitle Intro */}
        <View style={styles.introSection}>
          <Text style={styles.introHeading}>Tell us what's wrong</Text>
          <Text style={styles.introSub}>
            Give us a few details so we can send the right certified technician with
            exact components.
          </Text>
        </View>

        {/* Section 0: Chair Model & Brand */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Text style={styles.sectionTitle}>Chair Model & Brand</Text>
              <View style={styles.titleBlueDot} />
            </View>
            <Text style={styles.selectionCountLabel}>Customizable</Text>
          </View>

          <View style={styles.chairInputBox}>
            <AppIcon name="Armchair" size={18} color={Colors.secondaryCobalt} />
            <TextInput
              style={styles.chairTextInput}
              value={chairModel}
              onChangeText={setChairModel}
              placeholder="e.g. Herman Miller Aeron / Steelcase / Godrej"
              placeholderTextColor={Colors.outline}
            />
          </View>

          {/* Quick Preset Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetScroll}
          >
            {[
              'Herman Miller Aeron',
              'Steelcase Gesture',
              'Godrej Interio',
              'Green Soul Monster',
              'Featherlite Helix',
              'Wakefit High Back',
              'Standard Mesh Chair',
            ].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetPill,
                  chairModel === preset && styles.presetPillActive,
                ]}
                onPress={() => setChairModel(preset)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.presetPillText,
                    chairModel === preset && styles.presetPillTextActive,
                  ]}
                >
                  {preset}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section 1: Common Issues */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Text style={styles.sectionTitle}>Common Issues</Text>
              <View style={styles.titleBlueDot} />
            </View>
            <Text style={styles.selectionCountLabel}>
              {selectedIssues.length} selected
            </Text>
          </View>

          {/* Chips Matrix */}
          <View style={styles.chipsMatrix}>
            {ISSUE_OPTIONS.map((chip) => {
              const isSelected = selectedIssues.includes(chip.id);

              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.chipItem,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
                  ]}
                  onPress={() => toggleIssue(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.chipIcon}>
                    <AppIcon name={isSelected ? 'Check' : (chip.icon || 'Wrench')} size={16} color={isSelected ? '#FFFFFF' : Colors.onSurfaceVariant} />
                  </Text>
                  <Text
                    style={[
                      styles.chipLabel,
                      isSelected ? styles.chipLabelSelected : styles.chipLabelUnselected,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Problem Description */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Describe the issue in detail</Text>
            <Text style={styles.charCounterText}>
              {description.length} / 500 characters
            </Text>
          </View>

          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textInputArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe symptoms, strange noises, or loose parts..."
              placeholderTextColor={Colors.outline}
              multiline
              maxLength={500}
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Diagnostic Helper Ribbon */}
            <View style={styles.technicianTipRibbon}>
              <AppIcon name="ShieldCheck" size={18} />
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Technician Tip: </Text>
                Be as specific as possible so our technician brings exact OEM
                replacement parts and calibrated tools.
              </Text>
            </View>
          </View>
        </View>

        {/* Section 3: Add Photos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.photoHeaderLeft}>
              <Text style={styles.sectionTitle}>Chair & Damage Photos</Text>
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>Recommended</Text>
              </View>
            </View>
          </View>
          <Text style={styles.photoSubtext}>
            Clear photos help us pre-diagnose cylinder, gas spring, and tilt cassette
            integrity.
          </Text>

          {/* Upload Horizontal Scroll Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photosCarousel}
          >
            {/* Uploaded Photo Thumbnails */}
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                <View style={styles.photoGradientOverlay} />
                <Text style={styles.photoTagText}>{photo.label}</Text>
                <TouchableOpacity
                  style={styles.photoRemoveBtn}
                  onPress={() => handleRemovePhoto(photo.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Remove ${photo.label} photo`}
                >
                  <AppIcon name="X" size={18} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add Photos Upload Tile */}
            {photos.length < 4 && (
              <TouchableOpacity
                style={styles.addPhotoCard}
                onPress={handleAddPhoto}
                activeOpacity={0.8}
              >
                <View style={styles.addPhotoIconCircle}>
                  <AppIcon name="Camera" size={18} />
                </View>
                <Text style={styles.addPhotoTitle}>+ Add Photos</Text>
                <Text style={styles.addPhotoSub}>
                  Max 4 ({4 - photos.length} left)
                </Text>
              </TouchableOpacity>
            )}

            {/* Photo Guide Tip Tile */}
            <View style={styles.photoGuideCard}>
              <View style={styles.guideHeader}>
                <AppIcon name="Lightbulb" size={16} color="#D97706" />
                <Text style={styles.guideTag}>PHOTO GUIDE</Text>
              </View>
              <Text style={styles.guideDesc}>
                Snap underside stickers with serial numbers for guaranteed OEM part
                matching.
              </Text>
              <Text style={styles.guideFooter}>BIFMA X5.1 Specs</Text>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomDrawer,
          { paddingBottom: Math.max(insets.bottom, 14) + 6 },
        ]}
      >
        <View style={styles.bottomSummaryRow}>
          <View style={styles.summaryMetaRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.summaryMetaText}>
              {selectedIssues.length} issue{selectedIssues.length === 1 ? '' : 's'}{' '}
              tagged • {photos.length} photo{photos.length === 1 ? '' : 's'} attached
            </Text>
          </View>
          <View style={styles.slaBadge}>
            <Text style={styles.slaBadgeText}>Standard SLA</Text>
          </View>
        </View>

        <PrecisionButton
          title="Continue to Location →"
          size="lg"
          variant="primary"
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineHairline,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  flowLabel: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...Typography.titleLg,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  profileBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130,
    gap: 18,
  },
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCounterText: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  percentText: {
    ...Typography.labelMono,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 3,
  },
  currentServicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Shadows.level1,
  },
  servicePillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  servicePillIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  servicePillIcon: {
    fontSize: 16,
  },
  servicePillInfo: {
    flex: 1,
    gap: 1,
  },
  currentServiceTag: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  currentServiceTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  servicePillRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8,
  },
  changeLinkText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  changeArrow: {
    fontSize: 16,
    color: Colors.secondaryCobalt,
    fontWeight: 'bold',
  },
  introSection: {
    gap: 4,
  },
  introHeading: {
    ...Typography.headlineMd,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  introSub: {
    ...Typography.bodyMd,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  titleBlueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  selectionCountLabel: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  chipsMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    gap: 6,
    ...Shadows.level1,
  },
  chipSelected: {
    backgroundColor: Colors.secondaryCobalt,
  },
  chipUnselected: {
    backgroundColor: Colors.surfaceContainer,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    ...Typography.labelMd,
    fontSize: 12,
  },
  chipLabelSelected: {
    color: Colors.onSecondary,
    fontWeight: '700',
  },
  chipLabelUnselected: {
    color: Colors.onSurface,
    fontWeight: '500',
  },
  charCounterText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
  },
  textAreaCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  textInputArea: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    minHeight: 80,
    lineHeight: 20,
  },
  technicianTipRibbon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  tipIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  tipText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },
  tipBold: {
    fontWeight: '700',
    color: Colors.onSurface,
  },
  photoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendedBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  recommendedBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  photoSubtext: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    lineHeight: 16,
    marginTop: -4,
  },
  photosCarousel: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  photoCard: {
    width: 105,
    height: 105,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
    position: 'relative',
    ...Shadows.level1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
  },
  photoTagText: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveIcon: {
    fontSize: 10,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  addPhotoCard: {
    width: 105,
    height: 105,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 3,
    ...Shadows.level1,
  },
  addPhotoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoIcon: {
    fontSize: 16,
  },
  addPhotoTitle: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  addPhotoSub: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  photoGuideCard: {
    width: 140,
    height: 105,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideIcon: {
    fontSize: 12,
  },
  guideTag: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guideDesc: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    lineHeight: 13,
  },
  guideFooter: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    gap: 8,
    ...Shadows.level3,
  },
  bottomSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  summaryMetaText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  slaBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  slaBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  continueBtn: {
    marginTop: 2,
  },
  chairInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    ...Shadows.level1,
  },
  chairTextInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.onSurface,
    fontSize: 14,
  },
  presetScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  presetPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetPillText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontSize: 12,
  },
  presetPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
