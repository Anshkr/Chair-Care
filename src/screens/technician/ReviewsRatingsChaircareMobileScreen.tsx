import { AppIcon } from '../../components/common/AppIcon';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { technicianApi } from '../../services/api/technicianApi';

interface ReviewsRatingsProps {
  navigation?: any;
}

type FilterType = 'all' | '5star' | 'photos' | 'critical';

interface ReviewItem {
  id: string;
  initials: string;
  avatarBg: string;
  customerName: string;
  isVerified: boolean;
  rating: number;
  timeAgo: string;
  serviceTitle: string;
  chairModel: string;
  comment: string;
  compliments: string[];
  photoUrl?: string;
  hasPhoto?: boolean;
}

export const ReviewsRatingsChaircareMobileScreen: React.FC<ReviewsRatingsProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        const res = await technicianApi.getReviews();
        if (res.success && Array.isArray(res.data) && isMounted) {
          const bgColors = ['#0f172a', '#312e81', '#064e3b', '#7c2d12', '#4c1d95'];
          const mapped: ReviewItem[] = res.data.map((r: any, idx: number) => {
            const rawName = r.customerName || 'Customer';
            const parts = rawName.trim().split(/\s+/);
            const initials =
              parts.length >= 2
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : rawName.slice(0, 2).toUpperCase();

            return {
              id: String(r.id),
              initials,
              avatarBg: bgColors[idx % bgColors.length],
              customerName: rawName,
              isVerified: true,
              rating: Number(r.rating) || 5,
              timeAgo: r.createdAt
                ? new Date(r.createdAt).toLocaleDateString()
                : 'Recent',
              serviceTitle: r.serviceTitle || 'Chair Service',
              chairModel: r.chairModel || 'Ergonomic Task Chair',
              comment: r.comment || 'Client left rating without additional comment.',
              compliments: ['Verified Service'],
            };
          });
          setReviews(mapped);
        }
      } catch (err) {
        // silent
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalReviewsCount = reviews.length;
  const avgRating = React.useMemo(() => {
    if (totalReviewsCount === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / totalReviewsCount).toFixed(1);
  }, [reviews, totalReviewsCount]);

  const starCounts = React.useMemo(() => {
    return {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };
  }, [reviews]);

  const filteredReviews = React.useMemo(() => {
    switch (selectedFilter) {
      case '5star':
        return reviews.filter((r) => r.rating === 5);
      case 'photos':
        return reviews.filter((r) => r.hasPhoto);
      case 'critical':
        return reviews.filter((r) => r.rating < 4);
      case 'all':
      default:
        return reviews;
    }
  }, [selectedFilter, reviews]);

  const renderStars = (rating: number, size: number = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <AppIcon name="Star" size={18} color="#F59E0B" fill="#F59E0B" />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  return (
    <View style={styles.screenContainer}>
      {/* Top Sticky Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('TechnicianMain'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => Alert.alert('Sort & Filter', 'Filter reviews by star rating, service category, or photo attachment.')}
          activeOpacity={0.7}
        >
          <AppIcon name="Sliders" size={18} />
        </TouchableOpacity>
      </View>

      {/* Main Scrollable Body */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Rating Performance Score Card */}
        <View style={styles.heroRatingCard}>
          <View style={styles.heroTopRow}>
            {/* Big Score Column */}
            <View style={styles.scoreCol}>
              <Text style={styles.bigScoreText}>{avgRating}</Text>
              <View style={styles.heroStarsRow}>{renderStars(Math.round(Number(avgRating)), 16)}</View>
              <Text style={styles.verifiedCountText}>{totalReviewsCount} verified</Text>
            </View>

            {/* Breakdown Histogram Progress Bars */}
            <View style={styles.histogramCol}>
              {/* 5 Star */}
              <View style={styles.histRow}>
                <Text style={styles.histStarNum}>5</Text>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      {
                        width: totalReviewsCount > 0 ? `${(starCounts[5] / totalReviewsCount) * 100}%` : '0%',
                        backgroundColor: '#10b981',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histCountText}>{starCounts[5]}</Text>
              </View>

              {/* 4 Star */}
              <View style={styles.histRow}>
                <Text style={styles.histStarNum}>4</Text>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      {
                        width: totalReviewsCount > 0 ? `${(starCounts[4] / totalReviewsCount) * 100}%` : '0%',
                        backgroundColor: '#10b981',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histCountText}>{starCounts[4]}</Text>
              </View>

              {/* 3 Star */}
              <View style={styles.histRow}>
                <Text style={styles.histStarNum}>3</Text>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      {
                        width: totalReviewsCount > 0 ? `${(starCounts[3] / totalReviewsCount) * 100}%` : '0%',
                        backgroundColor: '#34d399',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histCountText}>{starCounts[3]}</Text>
              </View>

              {/* 2 Star */}
              <View style={styles.histRow}>
                <Text style={styles.histStarNum}>2</Text>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      {
                        width: totalReviewsCount > 0 ? `${(starCounts[2] / totalReviewsCount) * 100}%` : '0%',
                        backgroundColor: '#fbbf24',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histCountText}>{starCounts[2]}</Text>
              </View>

              {/* 1 Star */}
              <View style={styles.histRow}>
                <Text style={styles.histStarNum}>1</Text>
                <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
                <View style={styles.histTrack}>
                  <View
                    style={[
                      styles.histFill,
                      {
                        width: totalReviewsCount > 0 ? `${(starCounts[1] / totalReviewsCount) * 100}%` : '0%',
                        backgroundColor: '#fb7185',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.histCountText}>{starCounts[1]}</Text>
              </View>
            </View>
          </View>

          {/* Footer note */}
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>
              Based on <Text style={styles.heroFooterBold}>{totalReviewsCount} verified</Text> client evaluations
            </Text>
          </View>
        </View>

        {/* Performance Highlights (3 Cards Grid) */}
        <View style={styles.highlightsGrid}>
          {/* Card 1 */}
          <View style={styles.highlightCard}>
            <View style={styles.highlightIconEmerald}>
              <AppIcon name="Clock" size={18} />
            </View>
            <Text style={styles.highlightVal}>99.2%</Text>
            <Text style={styles.highlightLabel}>On-Time Arrival</Text>
          </View>

          {/* Card 2 */}
          <View style={styles.highlightCard}>
            <View style={styles.highlightIconEmerald}>
              <AppIcon name="Target" size={18} />
            </View>
            <Text style={styles.highlightVal}>100%</Text>
            <Text style={styles.highlightLabel}>Diagnostic Accuracy</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.highlightCard}>
            <View style={styles.highlightIconIndigo}>
              <AppIcon name="Award" size={18} />
            </View>
            <Text style={styles.highlightVal}>Master</Text>
            <Text style={styles.highlightLabel}>Tech Standing</Text>
          </View>
        </View>

        {/* Filter Carousel Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollRow}
        >
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'all' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('all')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'all' && styles.filterPillTextActive,
              ]}
            >
              All Reviews ({totalReviewsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === '5star' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('5star')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === '5star' && styles.filterPillTextActive,
              ]}
            >
              5 Stars ({starCounts[5]})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'photos' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('photos')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'photos' && styles.filterPillTextActive,
              ]}
            >
              With Photos ({reviews.filter((r) => r.hasPhoto).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === 'critical' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('critical')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'critical' && styles.filterPillTextActive,
              ]}
            >
              Critical ({reviews.filter((r) => r.rating < 4).length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Client Feedback Reviews List */}
        <View style={styles.reviewsListCol}>
          {filteredReviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <AppIcon name="Star" size={18} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.emptyTitle}>No reviews found in this filter</Text>
              <Text style={styles.emptySubtitle}>
                Select "All Reviews" to inspect your verified performance reviews.
              </Text>
            </View>
          ) : (
            filteredReviews.map((item) => (
              <View key={item.id} style={styles.reviewCard}>
                {/* Header */}
                <View style={styles.reviewCardHeader}>
                  <View style={styles.reviewCustomerRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                      <Text style={styles.avatarInitials}>{item.initials}</Text>
                    </View>
                    <View style={styles.customerMetaCol}>
                      <View style={styles.customerNameLine}>
                        <Text style={styles.customerName}>{item.customerName}</Text>
                        {item.isVerified && <AppIcon name="Check" size={18} />}
                      </View>
                      <View style={styles.ratingTimeRow}>
                        {renderStars(item.rating, 12)}
                        <Text style={styles.timeAgoText}>• {item.timeAgo}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Service Label Tag */}
                <View style={styles.serviceTagContainer}>
                  <Text style={styles.serviceTagText}>
                    {item.serviceTitle} • {item.chairModel}
                  </Text>
                </View>

                {/* Comment */}
                <Text style={styles.commentBody}>{item.comment}</Text>

                {/* Attached Photo if available */}
                {item.hasPhoto && item.photoUrl && (
                  <View style={styles.photoContainer}>
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={styles.attachedImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.photoLabel}>
                      Verified repair image attached by client
                    </Text>
                  </View>
                )}

                {/* Compliments Badges */}
                {item.compliments && item.compliments.length > 0 && (
                  <View style={styles.complimentsRow}>
                    {item.compliments.map((badge, idx) => (
                      <View key={idx} style={styles.complimentPill}>
                        <Text style={styles.complimentText}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Incentive Banner ("Dispatch Incentive Status") */}
        <View style={styles.incentiveCard}>
          <View style={styles.incentiveGlowCircle} />
          <View style={styles.incentiveContentRow}>
            <View style={styles.incentiveIconBox}>
              <AppIcon name="Zap" size={18} />
            </View>
            <View style={styles.incentiveTextCol}>
              <View style={styles.incentiveTitleRow}>
                <Text style={styles.incentiveTitle}>PRIORITY CORRIDOR ACTIVE</Text>
                <View style={styles.pulseDot} />
              </View>
              <Text style={styles.incentiveDesc}>
                Score <Text style={styles.whiteBold}>4.9</Text> &gt; 4.8 threshold unlocks
                priority ticket dispatch across{' '}
                <Text style={styles.whiteMed}>Cyber City</Text> and{' '}
                <Text style={styles.whiteMed}>Sector 54</Text> hubs.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
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
    color: '#0f172a',
    fontWeight: '700',
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    gap: 14,
  },
  heroRatingCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...Shadows.level1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  bigScoreText: {
    ...Typography.displayHero,
    fontSize: 44,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 46,
    letterSpacing: -1,
  },
  heroStarsRow: {
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedCountText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 6,
  },
  histogramCol: {
    flex: 1,
    gap: 4,
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  histStarNum: {
    width: 12,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'right',
  },
  histStarMini: {
    fontSize: 10,
    color: '#f59e0b',
    marginLeft: 2,
    marginRight: 6,
  },
  histTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#f1f5f9',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  histFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  histCountText: {
    width: 26,
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'right',
  },
  heroFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  heroFooterText: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  heroFooterBold: {
    fontWeight: '700',
    color: '#1e293b',
  },
  highlightsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  highlightCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    minHeight: 88,
    ...Shadows.level1,
  },
  highlightIconEmerald: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconSymbolEmerald: {
    fontSize: 14,
  },
  highlightIconIndigo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconSymbolIndigo: {
    fontSize: 14,
  },
  highlightVal: {
    ...Typography.headlineSm,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  highlightLabel: {
    ...Typography.bodySm,
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  filterScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterPillText: {
    ...Typography.labelMd,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  reviewsListCol: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...Shadows.level1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  customerMetaCol: {
    flex: 1,
  },
  customerNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  customerName: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  verifiedCheck: {
    fontSize: 12,
    fontWeight: '900',
    color: '#3b82f6',
  },
  ratingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timeAgoText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  serviceTagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 8,
  },
  serviceTagText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  commentBody: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginTop: 8,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: BorderRadius.md,
  },
  attachedImage: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#e2e8f0',
  },
  photoLabel: {
    ...Typography.bodySm,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  complimentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  complimentPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: 'rgba(167, 243, 208, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  complimentText: {
    ...Typography.labelMd,
    fontSize: 10,
    fontWeight: '700',
    color: '#065f46',
  },
  emptyCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyTitle: {
    ...Typography.titleLg,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  incentiveCard: {
    backgroundColor: '#0f172a',
    borderRadius: BorderRadius.xl,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level2,
  },
  incentiveGlowCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  incentiveContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  incentiveIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  incentiveIcon: {
    fontSize: 18,
  },
  incentiveTextCol: {
    flex: 1,
  },
  incentiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  incentiveTitle: {
    ...Typography.labelMono,
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
    letterSpacing: 0.8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  incentiveDesc: {
    ...Typography.bodySm,
    fontSize: 11.5,
    color: '#cbd5e1',
    lineHeight: 17,
    marginTop: 4,
  },
  whiteBold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  whiteMed: {
    fontWeight: '600',
    color: '#ffffff',
  },
});
