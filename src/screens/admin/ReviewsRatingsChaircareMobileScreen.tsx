import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { adminApi } from '../../services/api/adminApi';
import { useAdminSync } from '../../services/adminSync';

interface ReviewsRatingsScreenProps {
  navigation?: any;
}

export type ReviewTab = 'all' | 'recent' | 'flagged' | 'reported';

export interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerInitials: string;
  reviewerLocation: string;
  initialsBg: string;
  initialsColor: string;
  rating: number;
  serviceTitle: string;
  serviceIcon: string;
  serviceCode: string;
  chairModel?: string;
  reviewText: string;
  technicianName: string;
  timeAgo: string;
  publishedDate?: string;
  isReported?: boolean;
  isFlagged?: boolean;
  flagId?: string;
  flagReason?: string;
  isPublic?: boolean;
  category: 'recent' | 'flagged' | 'reported' | 'standard';
}

const renderStars = (rating: number, size = 14, emptyColor = '#CBD5E1') => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((idx) => {
        const isFilled = idx <= Math.floor(rating);
        const isHalf = !isFilled && idx - 0.5 <= rating;
        if (isFilled) {
          return (
            <AppIcon
              key={idx}
              name="Star"
              size={size}
              color="#F59E0B"
              fill="#F59E0B"
            />
          );
        }
        if (isHalf) {
          return (
            <AppIcon
              key={idx}
              name="StarHalf"
              size={size}
              color="#F59E0B"
              fill="#F59E0B"
            />
          );
        }
        return (
          <AppIcon
            key={idx}
            name="Star"
            size={size}
            color={emptyColor}
            fill="none"
          />
        );
      })}
    </View>
  );
};

export const ReviewsRatingsChaircareMobileScreen: React.FC<
  ReviewsRatingsScreenProps
> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [metrics, setMetrics] = useState<{
    totalReviews: number;
    avgRating: number;
    starDistribution: {
      5: { count: number; percent: number };
      4: { count: number; percent: number };
      3: { count: number; percent: number };
      2: { count: number; percent: number };
      1: { count: number; percent: number };
    };
    newToday: number;
    flaggedCount: number;
    reportedCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [activeTab, setActiveTab] = useState<ReviewTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(false);

  const computedMetrics = useMemo(() => {
    if (metrics) return metrics;
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = total > 0 ? Number((sum / total).toFixed(1)) : 5.0;
    const countStars = (target: number) =>
      reviews.filter((r) => Math.round(r.rating) === target).length;

    const s5 = countStars(5);
    const s4 = countStars(4);
    const s3 = countStars(3);
    const s2 = countStars(2);
    const s1 = countStars(1);

    return {
      totalReviews: total,
      avgRating: avg,
      starDistribution: {
        5: { count: s5, percent: total > 0 ? Math.round((s5 / total) * 100) : 0 },
        4: { count: s4, percent: total > 0 ? Math.round((s4 / total) * 100) : 0 },
        3: { count: s3, percent: total > 0 ? Math.round((s3 / total) * 100) : 0 },
        2: { count: s2, percent: total > 0 ? Math.round((s2 / total) * 100) : 0 },
        1: { count: s1, percent: total > 0 ? Math.round((s1 / total) * 100) : 0 },
      },
      newToday: reviews.filter((r) => r.category === 'recent').length,
      flaggedCount: reviews.filter((r) => r.isFlagged).length,
      reportedCount: reviews.filter((r) => r.isReported).length,
    };
  }, [reviews, metrics]);

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getReviews();
      if (res.success && Array.isArray(res.data)) {
        if ((res as any).metrics) {
          setMetrics((res as any).metrics);
        }
        const mapped: ReviewItem[] = res.data.map((r: any) => {
          const initials = (r.customerName || 'CU')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          const isFlagged = Boolean(r.isModerated);
          const isReported = Number(r.rating) <= 2;
          const category: 'recent' | 'flagged' | 'reported' | 'standard' = isReported
            ? 'reported'
            : isFlagged
            ? 'flagged'
            : 'recent';

          let loc = 'Delhi NCR';
          if (r.customerAddress) {
            const parts = r.customerAddress.split(',').map((p: string) => p.trim());
            loc = parts.slice(-2).join(', ') || r.customerAddress;
          }

          return {
            id: r.id,
            reviewerName: r.customerName || 'Customer',
            reviewerInitials: initials,
            reviewerLocation: loc,
            initialsBg: '#dbeafe',
            initialsColor: '#1d4ed8',
            rating: Number(r.rating || 5.0),
            serviceTitle: r.serviceTitle || 'Chair Service',
            serviceIcon: 'build',
            serviceCode: r.trackingCode || `#CC-${r.id.substring(0, 5)}`,
            chairModel: r.chairModel || 'Ergonomic Chair',
            reviewText: r.comment || 'Service completed successfully.',
            technicianName: r.technicianName || 'Specialist',
            timeAgo: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
            publishedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
            isFlagged,
            isReported,
            flagId: `#MOD-${r.id.substring(0, 4).toUpperCase()}`,
            flagReason: isFlagged ? 'Refuted Warranty Claim' : undefined,
            category,
            isPublic: !isFlagged,
          };
        });
        setReviews(mapped);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useAdminSync(navigation, loadReviews);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((item) => {
      // Tab matching
      if (activeTab === 'recent' && item.category !== 'recent') return false;
      if (activeTab === 'flagged' && !item.isFlagged) return false;
      if (activeTab === 'reported' && !item.isReported) return false;

      // Search query matching
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.reviewerName.toLowerCase().includes(query);
        const matchTech = item.technicianName.toLowerCase().includes(query);
        const matchCode = item.serviceCode.toLowerCase().includes(query);
        const matchText = item.reviewText.toLowerCase().includes(query);
        const matchService = item.serviceTitle.toLowerCase().includes(query);
        if (
          !matchName &&
          !matchTech &&
          !matchCode &&
          !matchText &&
          !matchService
        ) {
          return false;
        }
      }

      return true;
    });
  }, [reviews, activeTab, searchQuery]);

  const handleSelectReview = (review: ReviewItem) => {
    if (navigation) {
      navigation.navigate('ReviewDetails', {
        reviewId: review.id,
        review,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Top Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={{ padding: 6, marginRight: 8, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('AdminMain');
              }
            }}
            activeOpacity={0.7}
          >
            <AppIcon name="ArrowLeft" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerSubtitleText}>
              SUPER ADMIN • CHAIRCARE
            </Text>
            <Text style={styles.headerTitleText}>Reviews &amp; Ratings</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setIsSearchVisible(!isSearchVisible)}
            activeOpacity={0.7}
            accessibilityLabel="Search Reviews"
          >
            <AppIcon name="search" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => {
              // Quick reset filter
              setActiveTab((prev) => (prev === 'all' ? 'flagged' : 'all'));
            }}
            activeOpacity={0.7}
            accessibilityLabel="Filter Options"
          >
            <AppIcon name="tune" size={20} />
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
            <View style={styles.onlineBadgeDot} />
          </View>
        </View>
      </View>

      {/* Expandable Search Input */}
      {isSearchVisible && (
        <View style={styles.searchBarContainer}>
          <AppIcon name="search" size={20} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search by customer, technician, service code..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <AppIcon name="close" size={20} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Main Content ScrollView */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Telemetry Ribbon */}
        <View style={styles.telemetryRibbon}>
          <View style={styles.telemetryLeft}>
            <Animated.View
              style={[styles.telemetryPulseDot, { opacity: pulseAnim }]}
            />
            <Text style={styles.telemetryTitle}>
              Governance & Trust Index
            </Text>
          </View>
          <View style={styles.verifiedBadge}>
            <AppIcon name="verified" size={16} color="#0284c7" />
            <Text style={styles.verifiedBadgeText}>{computedMetrics.totalReviews} VERIFIED</Text>
          </View>
        </View>

        {/* 3. Overall Rating Hero Card (Dark Navy) */}
        <View style={styles.heroRatingCard}>
          {/* Subtle Ambient Glow */}
          <View style={styles.ambientGlow} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroScoreLabel}>TOTAL AGGREGATE SCORE</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreValueText}>{computedMetrics.avgRating.toFixed(1)}</Text>
                {renderStars(computedMetrics.avgRating, 18, '#475569')}
              </View>
              <Text style={styles.heroSubtitle}>
                Platform Score based on{' '}
                <Text style={styles.heroHighlight}>
                  {computedMetrics.totalReviews} {computedMetrics.totalReviews === 1 ? 'review' : 'reviews'}
                </Text>
              </Text>
            </View>

            <View style={styles.trendingBadge}>
              <AppIcon name="trending_up" size={16} color="#10B981" />
              <Text style={styles.trendingText}>+0.2 MoM</Text>
            </View>
          </View>

          {/* Star Distribution Breakdown */}
          <View style={styles.distributionContainer}>
            {/* 5 Star */}
            <View style={styles.distRow}>
              <Text style={styles.distStarLabel}>5 Stars</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFillAmber, { width: `${computedMetrics.starDistribution[5].percent}%` }]} />
              </View>
              <Text style={styles.distPercentLabel}>{computedMetrics.starDistribution[5].percent}%</Text>
            </View>

            {/* 4 Star */}
            <View style={styles.distRow}>
              <Text style={styles.distStarLabel}>4 Stars</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFillAmber80, { width: `${computedMetrics.starDistribution[4].percent}%` }]} />
              </View>
              <Text style={styles.distPercentLabel}>{computedMetrics.starDistribution[4].percent}%</Text>
            </View>

            {/* 3 Star */}
            <View style={styles.distRow}>
              <Text style={styles.distStarLabel}>3 Stars</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFillSlate, { width: `${computedMetrics.starDistribution[3].percent}%` }]} />
              </View>
              <Text style={styles.distPercentLabel}>{computedMetrics.starDistribution[3].percent}%</Text>
            </View>

            {/* 2 Star */}
            <View style={styles.distRow}>
              <Text style={styles.distStarLabel}>2 Stars</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFillAmber600, { width: `${computedMetrics.starDistribution[2].percent}%` }]} />
              </View>
              <Text style={styles.distPercentLabel}>{computedMetrics.starDistribution[2].percent}%</Text>
            </View>

            {/* 1 Star */}
            <View style={styles.distRow}>
              <Text style={styles.distStarLabel}>1 Star</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFillRose, { width: `${computedMetrics.starDistribution[1].percent}%` }]} />
              </View>
              <Text style={styles.distPercentLabel}>{computedMetrics.starDistribution[1].percent}%</Text>
            </View>
          </View>
        </View>

        {/* 4. Metric Badges Row */}
        <View style={styles.metricBadgesRow}>
          <TouchableOpacity
            style={styles.metricCardWhite}
            onPress={() => setActiveTab('recent')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricLabelGray}>NEW REVIEWS</Text>
            <Text style={styles.metricValueBlue}>{computedMetrics.newToday}</Text>
            <Text style={styles.metricSubtext}>Today</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCardAmber}
            onPress={() => setActiveTab('flagged')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricLabelAmber}>FLAGGED</Text>
            <Text style={styles.metricValueAmber}>{computedMetrics.flaggedCount}</Text>
            <Text style={styles.metricSubtextAmber}>Needs Triage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCardRose}
            onPress={() => setActiveTab('reported')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricLabelRose}>REPORTED</Text>
            <Text style={styles.metricValueRose}>{computedMetrics.reportedCount}</Text>
            <Text style={styles.metricSubtextRose}>Escalated</Text>
          </TouchableOpacity>
        </View>

        {/* 5. Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContent}
        >
          {/* All */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === 'all' && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'all' && styles.filterTabTextActive,
              ]}
            >
              All
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'all' && styles.tabCountPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'all' && styles.tabCountTextActive,
                ]}
              >
                {computedMetrics.totalReviews}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recent */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              activeTab === 'recent' && styles.filterTabActive,
            ]}
            onPress={() => setActiveTab('recent')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'recent' && styles.filterTabTextActive,
              ]}
            >
              Recent
            </Text>
            <View
              style={[
                styles.tabCountPill,
                activeTab === 'recent' && styles.tabCountPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabCountText,
                  activeTab === 'recent' && styles.tabCountTextActive,
                ]}
              >
                {computedMetrics.newToday}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Flagged */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              styles.filterTabAmber,
              activeTab === 'flagged' && styles.filterTabActiveAmber,
            ]}
            onPress={() => setActiveTab('flagged')}
            activeOpacity={0.7}
          >
            <View style={styles.amberDot} />
            <Text style={styles.filterTabTextAmber}>Flagged</Text>
            <View style={styles.tabCountPillAmber}>
              <Text style={styles.tabCountTextAmber}>{computedMetrics.flaggedCount}</Text>
            </View>
          </TouchableOpacity>

          {/* Reported */}
          <TouchableOpacity
            style={[
              styles.filterTab,
              styles.filterTabRose,
              activeTab === 'reported' && styles.filterTabActiveRose,
            ]}
            onPress={() => setActiveTab('reported')}
            activeOpacity={0.7}
          >
            <View style={styles.roseDot} />
            <Text style={styles.filterTabTextRose}>Reported</Text>
            <View style={styles.tabCountPillRose}>
              <Text style={styles.tabCountTextRose}>{computedMetrics.reportedCount}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* 6. Review Cards List */}
        <View style={styles.reviewsList}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.secondaryCobalt} style={{ marginVertical: 32 }} />
          ) : filteredReviews.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <AppIcon name="rate_review" size={24} color={Colors.outline} />
              <Text style={styles.emptyStateTitle}>No reviews found</Text>
              <Text style={styles.emptyStateSubtitle}>
                No customer reviews exist in the database for this view yet.
              </Text>
            </View>
          ) : (
            filteredReviews.map((review) => {
              if (review.isReported) {
                // Reported / Incident Card Styling
                return (
                  <View key={review.id} style={styles.reportedCard}>
                    {/* Top Right Incident Badge */}
                    <View style={styles.incidentTopRibbon}>
                      <Animated.View
                        style={[styles.whitePulseDot, { opacity: pulseAnim }]}
                      />
                      <Text style={styles.incidentTopRibbonText}>
                        Reported Incident
                      </Text>
                    </View>

                    {/* Reviewer Header */}
                    <View style={styles.reviewerHeader}>
                      <View style={styles.reviewerLeft}>
                        <View
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: review.initialsBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.avatarText,
                              { color: review.initialsColor },
                            ]}
                          >
                            {review.reviewerInitials}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>
                            {review.reviewerName}
                          </Text>
                          <View style={styles.locationRow}>
                            <AppIcon name="location_on" size={20} />
                            <Text style={styles.locationText}>
                              {review.reviewerLocation}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Rating with Warning Indicator */}
                    <View style={styles.ratingWarningBox}>
                      <View style={styles.ratingStarsLeft}>
                        {renderStars(review.rating, 13, '#CBD5E1')}
                        <Text style={styles.ratingScoreNumber}>
                          {review.rating.toFixed(1)} / 5.0
                        </Text>
                      </View>

                      <View style={styles.flagModBadge}>
                        <Text style={styles.flagModBadgeText}>
                          Flagged {review.flagId}
                        </Text>
                      </View>
                    </View>

                    {/* Service Tags */}
                    <View style={styles.serviceTagsRow}>
                      <View style={styles.serviceTag}>
                        <AppIcon name={review.serviceIcon} size={20} />
                        <Text style={styles.serviceTagText}>
                          {review.serviceTitle}
                        </Text>
                      </View>
                      <View style={styles.serviceCodeTag}>
                        <Text style={styles.serviceCodeText}>
                          {review.serviceCode}
                        </Text>
                      </View>
                      {review.chairModel && (
                        <View style={styles.chairModelTag}>
                          <Text style={styles.chairModelText}>
                            {review.chairModel}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Quoted Review Content */}
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteText}>{review.reviewText}</Text>
                      <View style={styles.quoteMetaRow}>
                        <Text style={styles.quoteTimeText}>
                          Published: {review.publishedDate}
                        </Text>
                        <View style={styles.liveFeedTag}>
                          <View style={styles.liveFeedDot} />
                          <Text style={styles.liveFeedText}>
                            Live in Public Feed
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Tech Info & Moderate Button */}
                    <View style={styles.reportedCardFooter}>
                      <View>
                        <Text style={styles.techNameText}>
                          Tech: {review.technicianName}
                        </Text>
                        <Text style={styles.flagReasonText}>
                          Flag: {review.flagReason}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.moderateReviewBtn}
                        onPress={() => handleSelectReview(review)}
                        activeOpacity={0.85}
                      >
                        <AppIcon name="gavel" size={20} />
                        <Text style={styles.moderateBtnText}>
                          Moderate Review
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              // Standard Review Card
              return (
                <View key={review.id} style={styles.standardCard}>
                  {/* Reviewer Header */}
                  <View style={styles.reviewerHeader}>
                    <View style={styles.reviewerLeft}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: review.initialsBg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            { color: review.initialsColor },
                          ]}
                        >
                          {review.reviewerInitials}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.reviewerName}>
                          {review.reviewerName}
                        </Text>
                        <View style={styles.locationRow}>
                          <AppIcon name={review.id === 'rev-03'
                              ? 'apartment'
                              : 'location_on'} size={20} />
                          <Text style={styles.locationText}>
                            {review.reviewerLocation}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.starsRightGroup}>
                      {renderStars(review.rating, 13, '#CBD5E1')}
                      <Text style={styles.ratingScoreNumber}>
                        {review.rating.toFixed(1)} / 5.0
                      </Text>
                    </View>
                  </View>

                  {/* Service Tags */}
                  <View style={styles.serviceTagsRow}>
                    <View style={styles.serviceTag}>
                      <AppIcon name={review.serviceIcon} size={20} />
                      <Text style={styles.serviceTagText}>
                        {review.serviceTitle}
                      </Text>
                    </View>
                    <View style={styles.serviceCodeTag}>
                      <Text style={styles.serviceCodeText}>
                        {review.serviceCode}
                      </Text>
                    </View>
                  </View>

                  {/* Feedback Quote */}
                  <View style={styles.quoteBox}>
                    <Text style={styles.quoteText}>{review.reviewText}</Text>
                  </View>

                  {/* Footer */}
                  <View style={styles.standardCardFooter}>
                    <View style={styles.footerTechTimeRow}>
                      <Text style={styles.footerTechName}>
                        Tech: {review.technicianName}
                      </Text>
                      <Text style={styles.footerDot}>•</Text>
                      <Text style={styles.footerTime}>{review.timeAgo}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.viewReviewBtn}
                      onPress={() => handleSelectReview(review)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.viewReviewText}>View Review</Text>
                      <AppIcon name="chevron_right" size={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 7. Footer Status Sync Indicator */}
        <View style={styles.footerSyncContainer}>
          <AppIcon name="sync" size={20} />
          <Text style={styles.footerSyncText}>
            Real-time Reputation Index Active
          </Text>
        </View>
      </ScrollView>

      {/* 7. End of Reviews Screen */}
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
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    zIndex: 40,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  logoIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#ffffff',
    includeFontPadding: false,
  },
  headerTitleGroup: {
    justifyContent: 'center',
  },
  headerSubtitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    color: '#2563eb',
    letterSpacing: 0.8,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#475569',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginLeft: 2,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  /* Search Bar */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchBarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#94a3b8',
    includeFontPadding: false,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  clearSearchIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#94a3b8',
    includeFontPadding: false,
  },

  /* Scroll Content */
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  /* Telemetry Ribbon */
  telemetryRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 246, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(219, 234, 254, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  telemetryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  telemetryPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  telemetryTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(191, 219, 254, 0.7)',
  },
  verifiedShieldIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#1d4ed8',
    includeFontPadding: false,
  },
  verifiedBadgeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#1e3a8a',
  },

  /* Overall Rating Hero Card */
  heroRatingCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    gap: 14,
    ...Shadows.level2,
  },
  ambientGlow: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroScoreLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  scoreValueText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '800',
    color: '#ffffff',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  starFilled: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#fbbf24',
    includeFontPadding: false,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
  },
  heroHighlight: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontWeight: '600',
    color: '#ffffff',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#34d399',
    includeFontPadding: false,
  },
  trendingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },

  /* Star Distribution */
  distributionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
    gap: 6,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distStarLabel: {
    width: 28,
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#cbd5e1',
    textAlign: 'right',
  },
  distTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  distFillAmber: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 4,
  },
  distFillAmber80: {
    height: '100%',
    backgroundColor: 'rgba(251, 191, 36, 0.8)',
    borderRadius: 4,
  },
  distFillSlate: {
    height: '100%',
    backgroundColor: '#64748b',
    borderRadius: 4,
  },
  distFillAmber600: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 4,
  },
  distFillRose: {
    height: '100%',
    backgroundColor: '#f43f5e',
    borderRadius: 4,
  },
  distPercentLabel: {
    width: 32,
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },

  /* Metric Badges Row */
  metricBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCardWhite: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 2,
    ...Shadows.level1,
  },
  metricLabelGray: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricValueBlue: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  metricSubtext: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 9.5,
    color: '#94a3b8',
  },
  metricCardAmber: {
    flex: 1,
    backgroundColor: 'rgba(254, 243, 199, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(253, 230, 138, 0.8)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 2,
    ...Shadows.level1,
  },
  metricLabelAmber: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  metricValueAmber: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#b45309',
  },
  metricSubtextAmber: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 9.5,
    color: '#d97706',
  },
  metricCardRose: {
    flex: 1,
    backgroundColor: 'rgba(255, 228, 230, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(254, 205, 211, 0.8)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 2,
    ...Shadows.level1,
  },
  metricLabelRose: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#9f1239',
    letterSpacing: 0.5,
  },
  metricValueRose: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#be123c',
  },
  metricSubtextRose: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 9.5,
    color: '#e11d48',
  },

  /* Filter Tabs */
  filterTabsContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.level1,
  },
  filterTabActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterTabText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  filterTabTextActive: {
    color: '#ffffff',
  },
  tabCountPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: '#334155',
  },
  tabCountText: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 10,
    color: '#475569',
  },
  tabCountTextActive: {
    color: '#e2e8f0',
  },
  filterTabAmber: {
    borderColor: '#fde68a',
  },
  filterTabActiveAmber: {
    backgroundColor: '#fef3c7',
  },
  amberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  filterTabTextAmber: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  tabCountPillAmber: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountTextAmber: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#92400e',
  },
  filterTabRose: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  filterTabActiveRose: {
    backgroundColor: '#ffe4e6',
  },
  roseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f43f5e',
  },
  filterTabTextRose: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#be123c',
  },
  tabCountPillRose: {
    backgroundColor: '#fecdd3',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountTextRose: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 10,
    color: '#9f1239',
  },

  /* Reviews List */
  reviewsList: {
    gap: 12,
  },

  /* Standard Card */
  standardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    gap: 10,
    ...Shadows.level1,
  },
  reviewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reviewerName: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  locationIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 13,
    color: '#94a3b8',
    includeFontPadding: false,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#64748b',
  },
  starsRightGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  starsSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  starSmallFilled: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#fbbf24',
    includeFontPadding: false,
  },
  starSmallEmpty: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#cbd5e1',
    includeFontPadding: false,
  },
  ratingScoreNumber: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11,
    color: '#334155',
  },

  /* Service Tags */
  serviceTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTagIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 12,
    color: '#64748b',
    includeFontPadding: false,
  },
  serviceTagText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#334155',
  },
  serviceCodeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceCodeText: {
    fontFamily: 'JetBrainsMono-SemiBold',
    fontSize: 11,
    color: '#475569',
  },
  chairModelTag: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chairModelText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#f8fafc',
  },

  /* Quote Box */
  quoteBox: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  quoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 18,
    color: '#334155',
    fontStyle: 'italic',
  },
  quoteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  quoteTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#94a3b8',
  },
  liveFeedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveFeedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e11d48',
  },
  liveFeedText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10,
    color: '#e11d48',
  },

  /* Standard Card Footer */
  standardCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  footerTechTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerTechName: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11,
    color: '#334155',
  },
  footerDot: {
    color: '#94a3b8',
    fontSize: 10,
  },
  footerTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#64748b',
  },
  viewReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewReviewText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  chevronIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#2563eb',
    includeFontPadding: false,
  },

  /* Reported Card */
  reportedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fecdd3',
    position: 'relative',
    overflow: 'hidden',
    gap: 10,
    ...Shadows.level2,
  },
  incidentTopRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#f43f5e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  whitePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  incidentTopRibbonText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 9.5,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 241, 242, 0.6)',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  ratingStarsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flagModBadge: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  flagModBadgeText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#be123c',
  },
  reportedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  techNameText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 11,
    color: '#1e293b',
  },
  flagReasonText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 10,
    color: '#b45309',
  },
  moderateReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    ...Shadows.level1,
  },
  gavelIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
  },
  moderateBtnText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Empty State */
  emptyStateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    ...Shadows.level1,
  },
  emptyStateIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 40,
    color: '#94a3b8',
    includeFontPadding: false,
  },
  emptyStateTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyStateSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 240,
  },

  /* Footer Sync */
  footerSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  footerSyncIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 14,
    color: '#94a3b8',
    includeFontPadding: false,
  },
  footerSyncText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 11,
    color: '#94a3b8',
  },

  /* Bottom Navigation */
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    ...Shadows.level3,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  bottomNavTabActive: {},
  activeDotTop: {
    position: 'absolute',
    top: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  bottomNavIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#64748b',
    includeFontPadding: false,
  },
  bottomNavIconActive: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#2563eb',
    includeFontPadding: false,
  },
  bottomNavLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  bottomNavLabelActive: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
});
