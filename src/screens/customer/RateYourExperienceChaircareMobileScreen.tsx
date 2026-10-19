import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useBooking } from '../../context/BookingContext';
import { PressableScale } from '../../animations/PressableScale';
import { FadeIn } from '../../animations/FadeIn';

const FEEDBACK_CHIP_OPTIONS = [
  'Professional',
  'On Time',
  'Good Quality',
  'Clean Work',
  'Friendly',
  'Fast Service',
  'Explained Clearly',
];

const SAMPLE_CHAIR_PHOTOS = [
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=400&auto=format&fit=crop&q=80',
];

import { customerApi } from '../../services/api/customerApi';

/**
 * Screen ID: C17
 * Title: Rate Your Experience
 * Reference: design-reference/customer/rate_your_experience_chaircare_mobile
 */
export const RateYourExperienceChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { draft } = useBooking();

  const [rating, setRating] = useState<number>(5);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const technician = {
    name: route?.params?.technicianName || 'Certified Partner Specialist',
    rating: route?.params?.technicianRating ? Number(route.params.technicianRating) : 4.95,
    completedJobsCount: route?.params?.completedJobsCount || 140,
    phone: route?.params?.technicianPhone || '+91 800 555 0199',
    avatarUrl:
      route?.params?.technicianAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  };

  const serviceTitle = route?.params?.serviceTitle || draft?.serviceTitle || 'Office Chair Repair';
  const visitDate = route?.params?.visitDate || draft?.visitDate || 'Recent Visit';
  const techFirstName = technician.name.split(' ')[0] || 'Technician';

  const sentiments: Record<number, string> = {
    1: "Needs improvement. Let's make it right.",
    2: "Below expectations. We're listening.",
    3: 'Satisfactory. Average repair quality.',
    4: 'Great job! Very pleased with the fix.',
    5: `Excellent! ${techFirstName} went above and beyond.`,
  };

  const toggleChip = (chip: string) => {
    if (selectedChips.includes(chip)) {
      setSelectedChips(selectedChips.filter((c) => c !== chip));
    } else {
      setSelectedChips([...selectedChips, chip]);
    }
  };

  const handleAddPhoto = () => {
    if (photos.length >= 3) return;
    const nextPhoto = SAMPLE_CHAIR_PHOTOS[photos.length % SAMPLE_CHAIR_PHOTOS.length];
    setPhotos([...photos, nextPhoto]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const requestId = route?.params?.requestId || (draft as any)?.id;
    if (requestId) {
      try {
        const res = await customerApi.submitReview({
          requestId,
          rating,
          comment: reviewText.trim() || selectedChips.join(', '),
        });
        if (!res.success && res.error) {
          Alert.alert('Review Submission Note', res.error);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Could not record review.');
      }
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        navigation.navigate('CustomerMain');
      }, 1000);
    }, 400);
  };

  const handleSkip = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('CustomerMain');
    }
  };

  return (
    <ScreenContainer hasPadding={false}>
      {/* Fixed Header Bar */}
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
          <View style={styles.headerTitleGroup}>
            <Text style={styles.brandSubtitle}>ErgoFix Pro</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Rate Experience
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('CustomerProfileTab')}
          activeOpacity={0.7}
        >
          <AppIcon name="User" size={18} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Ergonomic Summary Card */}
          <View style={styles.summaryCard}>
            {/* Ambient decorative glow */}
            <View style={[styles.glowCornerRight, { pointerEvents: 'none' }]} />
            <View style={[styles.glowCornerLeft, { pointerEvents: 'none' }]} />

            {/* Technician Avatar with Verified Badge */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarImageContainer}>
                <Image
                  source={{
                    uri: technician.avatarUrl,
                  }}
                  style={styles.techAvatar}
                />
              </View>
              <View style={styles.verifiedBadge}>
                <AppIcon name="Check" size={18} />
              </View>
            </View>

            {/* Profile Details */}
            <Text style={styles.techNameText}>{technician.name}</Text>

            {/* Micro Metrics Pills */}
            <View style={styles.metricsPillsRow}>
              <View style={styles.metricPill}>
                <AppIcon name="Check" size={18} />
                <Text style={styles.metricPillText}>Verified Technician</Text>
              </View>
              <View style={styles.metricPill}>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.metricPillText}>
                  {technician.rating.toFixed(1)} • {technician.completedJobsCount}+ fixes
                </Text>
              </View>
            </View>

            {/* Service Metadata Badge */}
            <View style={styles.serviceMetaBadge}>
              <AppIcon name="Armchair" size={18} />
              <Text style={styles.serviceMetaText}>
                {serviceTitle} • {visitDate}
              </Text>
            </View>
          </View>

          {/* Rating Delight Section */}
          <View style={styles.ratingSectionCard}>
            <Text style={styles.ratingSectionTitle}>How was your service?</Text>
            <Text style={styles.ratingSectionSub}>
              Your feedback helps us maintain high-quality service and rewards skilled
              technicians.
            </Text>

            {/* 5-Star Interactive Rating */}
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((starVal) => {
                const isFilled = starVal <= rating;
                return (
                  <PressableScale
                    key={starVal}
                    activeScale={1.12}
                    style={styles.starBtn}
                    onPress={() => setRating(starVal)}
                    accessibilityLabel={`${starVal} star${starVal > 1 ? 's' : ''}`}
                  >
                    <AppIcon
                      name="Star"
                      size={28}
                      color={isFilled ? '#F59E0B' : Colors.outlineVariant}
                      fill={isFilled ? '#F59E0B' : 'transparent'}
                    />
                  </PressableScale>
                );
              })}
            </View>

            {/* Dynamic Sentiment Subtitle */}
            <Text style={styles.sentimentText}>{sentiments[rating]}</Text>
          </View>

          {/* Quick Feedback Chips Section */}
          <View style={styles.feedbackChipsCard}>
            <View style={styles.chipsHeaderRow}>
              <Text style={styles.chipsSectionTitle}>What went especially well?</Text>
              <Text style={styles.multiSelectTag}>MULTI-SELECT</Text>
            </View>
            <Text style={styles.chipsSectionSub}>
              Select attributes that stood out during the repair.
            </Text>

            <View style={styles.chipsCloud}>
              {FEEDBACK_CHIP_OPTIONS.map((chip, idx) => {
                const isSelected = selectedChips.includes(chip);
                return (
                  <PressableScale
                    key={idx}
                    activeScale={0.96}
                    style={[
                      styles.feedbackChip,
                      isSelected && styles.feedbackChipActive,
                    ]}
                    onPress={() => toggleChip(chip)}
                  >
                    {isSelected && <AppIcon name="Check" size={18} />}
                    <Text
                      style={[
                        styles.feedbackChipText,
                        isSelected && styles.feedbackChipTextActive,
                      ]}
                    >
                      {chip}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>

          {/* Written Review Text Area */}
          <View style={styles.reviewTextCard}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.reviewSectionTitle}>
                Tell us about your experience
              </Text>
              <Text style={styles.optionalTag}>OPTIONAL</Text>
            </View>
            <Text style={styles.reviewSectionSub}>
              Describe technician punctuality, chair stability, or parts used.
            </Text>

            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.reviewTextInput}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="e.g., Rahul fixed the tilt mechanism in 30 minutes, very polite and neat with floor protection!"
                placeholderTextColor={Colors.outline}
                multiline
                numberOfLines={4}
                maxLength={300}
                textAlignVertical="top"
              />
              <View style={styles.charCounterRow}>
                <Text style={styles.charCounterText}>
                  {reviewText.length} / 300
                </Text>
              </View>
            </View>
          </View>

          {/* Photo Upload Section */}
          <View style={styles.photosCard}>
            <View style={styles.photosHeaderRow}>
              <Text style={styles.photosSectionTitle}>
                Add photos of the repaired chair
              </Text>
              <Text style={styles.optionalTag}>OPTIONAL</Text>
            </View>
            <Text style={styles.photosSectionSub}>
              Show the restored base, lumbar support, or smooth caster roll.
            </Text>

            {/* Photos Grid */}
            <View style={styles.photosGrid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoItemWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemovePhoto(idx)}
                    activeOpacity={0.8}
                    accessibilityLabel="Remove photo"
                  >
                    <AppIcon name="X" size={18} />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 3 && (
                <TouchableOpacity
                  style={styles.addPhotoTrigger}
                  onPress={handleAddPhoto}
                  activeOpacity={0.8}
                  accessibilityLabel="Add Photo"
                >
                  <AppIcon name="Camera" size={18} />
                  <Text style={styles.addPhotoTitle}>+ Add Photos</Text>
                  <Text style={styles.maxPhotosText}>Max 3</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Action Area */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.submitBtn,
            isSubmitted && styles.submitBtnSubmitted,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || isSubmitted}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <View style={styles.buttonInnerRow}>
              <ActivityIndicator size="small" color={Colors.onPrimary} />
              <Text style={styles.submitBtnText}>Publishing Review...</Text>
            </View>
          ) : isSubmitted ? (
            <View style={styles.buttonInnerRow}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.submitBtnText}>Thank You! Review Recorded</Text>
            </View>
          ) : (
            <View style={styles.buttonInnerRow}>
              <Text style={styles.submitBtnText}>Submit Review</Text>
              <Text style={styles.submitBtnArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipBtnText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  headerBar: {
    height: 58,
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
    gap: 10,
    flex: 1,
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
  headerTitleGroup: {
    flex: 1,
  },
  brandSubtitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  glowCornerRight: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(219, 225, 255, 0.4)',
  },
  glowCornerLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(78, 222, 163, 0.15)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImageContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerHigh,
    ...Shadows.level2,
  },
  techAvatar: {
    width: '100%',
    height: '100%',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceContainerLowest,
  },
  verifiedCheckIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  techNameText: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 6,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  metricCheckIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onTertiaryContainer,
  },
  starIconSmall: {
    fontSize: 10,
  },
  metricPillText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  serviceMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  chairIcon: {
    fontSize: 13,
  },
  serviceMetaText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  ratingSectionCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  ratingSectionTitle: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
    marginBottom: 4,
  },
  ratingSectionSub: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starBtn: {
    padding: 4,
  },
  starGlyph: {
    fontSize: 38,
  },
  starGlyphFilled: {
    color: '#F59E0B',
  },
  starGlyphEmpty: {
    color: Colors.outlineVariant,
  },
  sentimentText: {
    ...Typography.bodyMd,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
    textAlign: 'center',
    marginTop: 2,
  },
  feedbackChipsCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 8,
    ...Shadows.level1,
  },
  chipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipsSectionTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  multiSelectTag: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  chipsSectionSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  chipsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feedbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  feedbackChipActive: {
    backgroundColor: Colors.secondaryCobalt,
    ...Shadows.level1,
  },
  chipCheckIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  feedbackChipText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  feedbackChipTextActive: {
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  reviewTextCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 6,
    ...Shadows.level1,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewSectionTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  optionalTag: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
  },
  reviewSectionSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  textAreaContainer: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.lg,
    padding: 10,
    gap: 4,
  },
  reviewTextInput: {
    minHeight: 80,
    fontSize: 13,
    color: Colors.onSurface,
    lineHeight: 18,
  },
  charCounterRow: {
    alignItems: 'flex-end',
  },
  charCounterText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  photosCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 6,
    ...Shadows.level1,
  },
  photosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photosSectionTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  photosSectionSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginBottom: 6,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  photoItemWrap: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceContainer,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(25, 28, 30, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoIcon: {
    fontSize: 10,
    color: Colors.surfaceContainerLowest,
    fontWeight: '800',
  },
  addPhotoTrigger: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.outlineVariant,
    gap: 2,
  },
  cameraIcon: {
    fontSize: 18,
  },
  addPhotoTitle: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  maxPhotosText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
  },
  stickyBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 4,
    alignItems: 'center',
    ...Shadows.level3,
  },
  submitBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
  submitBtnSubmitted: {
    backgroundColor: Colors.secondaryCobalt,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  submitBtnArrow: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  checkDoneIcon: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.onPrimary,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
