import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useIntro } from '../../context/IntroContext';

/**
 * Screen ID: I03
 * Title: Trusted Technicians
 * Reference: design-reference/intro/intro_2_trusted_technicians_chaircare_mobile
 */
export const Intro2TrustedTechniciansChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { onFinishIntro: contextFinishIntro } = useIntro();
  const onFinishIntro = route?.params?.onFinishIntro || contextFinishIntro;

  // Animation values
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslateY = useRef(new Animated.Value(14)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;
  const chipsOpacity = useRef(new Animated.Value(0)).current;
  const bottomBarOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Hero visual entrance (50ms)
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.back(0.8)),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // 2. Narrative content entrance (180ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 180);

    // 3. Feature chips entrance (320ms)
    setTimeout(() => {
      Animated.timing(chipsOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 320);

    // 4. Bottom bar entrance (450ms)
    setTimeout(() => {
      Animated.timing(bottomBarOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 450);

    // Gentle floating idle animation on technician showcase
    const idleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    idleLoop.start();

    return () => idleLoop.stop();
  }, []);

  const handleNext = () => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      navigation.navigate('Intro3');
    });
  };

  const handleSkip = () => {
    if (onFinishIntro) {
      onFinishIntro();
    } else {
      navigation.navigate('Intro4');
    }
  };

  return (
    <ScreenContainer hasPadding={false}>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16) + 6,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <BrandLogo size={24} containerStyle={{ marginRight: 8 }} />
            <Text style={styles.brandName}>
              Chair<Text style={styles.brandHighlight}>Care</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Upper Visual Showcase: Interactive Precision Card */}
          <Animated.View
            style={[
              styles.heroVisualCard,
              {
                opacity: heroOpacity,
                transform: [
                  { translateY: heroTranslateY },
                  { translateY: floatAnim },
                ],
              },
            ]}
          >
            {/* Ambient Overlay Grid */}
            <View style={[styles.gridOverlay, { pointerEvents: 'none' }]} />

            {/* Technician Image Canvas */}
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
              }}
              style={styles.techImage}
              resizeMode="cover"
            />

            {/* Overlay: Rating Shield */}
            <View style={styles.ratingBadge}>
              <AppIcon name="Star" size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingScore}>4.9</Text>
              <Text style={styles.ratingMax}>/5.0</Text>
            </View>

            {/* Overlay: Status Pill */}
            <View style={styles.dispatchPill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.dispatchPillText}>DISPATCH READY</Text>
            </View>

            {/* Bottom Floating Assurance Stack */}
            <View style={styles.bottomBadgeStack}>
              <View style={styles.bifmaBadge}>
                <AppIcon name="Check" size={18} />
                <Text style={styles.bifmaText}>BIFMA LEVEL 3</Text>
              </View>

              <View style={styles.vettedBadge}>
                <AppIcon name="ShieldCheck" size={18} />
                <Text style={styles.vettedText}>100% VETTED</Text>
              </View>
            </View>
          </Animated.View>

          {/* Live Telemetry Ticker Strip */}
          <Animated.View
            style={[
              styles.telemetryTickerRow,
              {
                opacity: contentOpacity,
              },
            ]}
          >
            <View style={styles.telemetryTickerLeft}>
              <AppIcon name="Settings" size={18} />
              <Text style={styles.tickerText}>
                CALIBRATION TOLERANCE: ±0.05 Nm
              </Text>
            </View>
            <Text style={styles.stageIndicator}>STAGE 02/04</Text>
          </Animated.View>

          {/* Middle Content Section */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.protocolBadgeRow}>
              <View style={styles.workforceBadge}>
                <Text style={styles.workforceBadgeText}>
                  PRECISION WORKFORCE
                </Text>
              </View>
              <Text style={styles.isoProtocolText}>PROTOCOL ISO-9001</Text>
            </View>

            <Text style={styles.headlineTitle}>Trusted Technicians</Text>

            <Text style={styles.descriptionText}>
              Connect with verified technicians for reliable chair installation,
              repair, and pneumatic biomechanical recalibration at your workspace.
            </Text>

            {/* Trust Badges Cluster */}
            <Animated.View style={[styles.chipsRow, { opacity: chipsOpacity }]}>
              <View style={styles.trustChip}>
                <AppIcon name="Check" size={18} />
                <Text style={styles.trustChipText}>
                  Verified Background Check
                </Text>
              </View>

              <View style={styles.trustChip}>
                <AppIcon name="Settings" size={18} />
                <Text style={styles.trustChipText}>OEM Parts Only</Text>
              </View>

              <View style={styles.trustChip}>
                <AppIcon name="Star" size={18} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.trustChipText}>Certified Ergo Masters</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Controls & Progression */}
        <Animated.View
          style={[styles.bottomControlBar, { opacity: bottomBarOpacity }]}
        >
          {/* Stepper Dots (2 of 4 Active) */}
          <View style={styles.stepperDotsRow}>
            <View style={styles.inactiveDot} />
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsColumn}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.primaryContinueBtn}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryContinueBtnText}>Continue</Text>
                <Text style={styles.nextArrowIcon}>→</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.secondaryTextBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryText}>
                Already have a service appointment? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandLogoIcon: {
    fontSize: 22,
  },
  brandName: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  brandHighlight: {
    color: Colors.secondaryCobalt,
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
  },
  skipBtnText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  scrollBody: {
    paddingVertical: 4,
    gap: 12,
  },
  heroVisualCard: {
    height: 230,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xxl,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 81, 213, 0.04)',
  },
  techImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    gap: 4,
    ...Shadows.level1,
  },
  ratingStar: {
    fontSize: 11,
  },
  ratingScore: {
    ...Typography.headlineSm,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  ratingMax: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  dispatchPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
    ...Shadows.level1,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  dispatchPillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  bottomBadgeStack: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  bifmaBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  bifmaIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.tertiaryFixed,
  },
  bifmaText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  vettedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondaryCobalt,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  vettedIcon: {
    fontSize: 10,
  },
  vettedText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  telemetryTickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  telemetryTickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tickerIcon: {
    fontSize: 12,
  },
  tickerText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  stageIndicator: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.tertiaryEmerald,
  },
  contentSection: {
    gap: 8,
  },
  protocolBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workforceBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  workforceBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
    letterSpacing: 0.6,
  },
  isoProtocolText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
    fontWeight: '600',
  },
  headlineTitle: {
    ...Typography.headlineLg,
    fontSize: 26,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  descriptionText: {
    ...Typography.bodyMd,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    lineHeight: 21,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    gap: 5,
  },
  trustChipIcon: {
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '800',
  },
  trustChipText: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  bottomControlBar: {
    gap: 12,
    paddingTop: 8,
  },
  stepperDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeDot: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceVariant,
  },
  actionsColumn: {
    gap: 4,
  },
  primaryContinueBtn: {
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryContinueBtnText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  nextArrowIcon: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  secondaryTextBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.outline,
    fontWeight: '600',
  },
});
