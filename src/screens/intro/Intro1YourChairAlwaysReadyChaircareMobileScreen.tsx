import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line, Defs, Pattern } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useIntro } from '../../context/IntroContext';

/**
 * Precision Ergonomic Task Chair SVG Illustration for Intro 1
 */
const Intro1ChairIllustration: React.FC = () => {
  return (
    <Svg width={220} height={200} viewBox="0 0 220 200">
      <Defs>
        <Pattern id="techGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <Path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(37, 99, 235, 0.08)" strokeWidth="1" />
        </Pattern>
      </Defs>

      {/* Ambient Engineering Grid Background */}
      <Rect x="0" y="0" width="220" height="200" fill="url(#techGrid)" rx="16" />

      {/* Subtle Laser Measurement Calibration Line */}
      <Line
        x1="20"
        y1="92"
        x2="200"
        y2="92"
        stroke="rgba(37, 99, 235, 0.25)"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
      <Circle cx="20" cy="92" r="2.5" fill="#2563EB" opacity={0.6} />
      <Circle cx="200" cy="92" r="2.5" fill="#2563EB" opacity={0.6} />

      {/* Holographic Height Coordinate Marks */}
      <Line x1="180" y1="30" x2="180" y2="160" stroke="rgba(100, 116, 139, 0.2)" strokeWidth="1" strokeDasharray="3,3" />
      <Line x1="176" y1="36" x2="184" y2="36" stroke="#2563EB" strokeWidth="1.5" />
      <Line x1="176" y1="92" x2="184" y2="92" stroke="#2563EB" strokeWidth="1.5" />
      <Line x1="176" y1="148" x2="184" y2="148" stroke="#2563EB" strokeWidth="1.5" />

      {/* ----------------- CHAIR ARTWORK ----------------- */}
      {/* Headrest */}
      <Rect x="90" y="16" width="40" height="16" rx="8" fill="#0F172A" />
      <Rect x="92" y="18" width="36" height="4" rx="2" fill="#1E293B" />
      <Rect x="107" y="32" width="6" height="8" fill="#64748B" />

      {/* Backrest Outer Frame */}
      <Rect
        x="74"
        y="38"
        width="72"
        height="62"
        rx="16"
        fill="none"
        stroke="#0F172A"
        strokeWidth="4.5"
      />
      {/* Backrest Mesh Inner */}
      <Rect
        x="78"
        y="42"
        width="64"
        height="54"
        rx="12"
        fill="#EEF4FF"
      />

      {/* Horizontal Mesh Texture / Spine Ribs */}
      <Line x1="86" y1="52" x2="134" y2="52" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="84" y1="64" x2="136" y2="64" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
      {/* BioSync Active Lumbar Support Band */}
      <Line x1="82" y1="76" x2="138" y2="76" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
      <Line x1="86" y1="88" x2="134" y2="88" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Armrests */}
      {/* Left Armrest */}
      <Path
        d="M 64 62 L 73 62 L 73 78 L 78 78"
        stroke="#0F172A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="60" y="59" width="16" height="6" rx="3" fill="#0F172A" />

      {/* Right Armrest */}
      <Path
        d="M 156 62 L 147 62 L 147 78 L 142 78"
        stroke="#0F172A"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="144" y="59" width="16" height="6" rx="3" fill="#0F172A" />

      {/* Seat Cushion */}
      <Rect x="68" y="98" width="84" height="15" rx="7" fill="#0F172A" />
      <Rect x="72" y="100" width="76" height="4" rx="2" fill="#1E293B" />

      {/* Under-Seat Mechanism Enclosure */}
      <Rect x="98" y="113" width="24" height="8" rx="2" fill="#334155" />

      {/* Hydraulic Nitrogen Cylinder (Class-4) */}
      <Rect x="105" y="121" width="10" height="24" fill="#64748B" />
      <Rect x="103" y="121" width="14" height="5" rx="1.5" fill="#2563EB" />

      {/* 5-Star Heavy Duty Aluminum Base */}
      <Path
        d="M 110 145 L 68 165 M 110 145 L 86 172 M 110 145 L 110 176 M 110 145 L 134 172 M 110 145 L 152 165"
        stroke="#0F172A"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* 5 Dual-Wheel Silent Casters */}
      <Circle cx="68" cy="167" r="4.5" fill="#334155" />
      <Circle cx="86" cy="174" r="4.5" fill="#334155" />
      <Circle cx="110" cy="178" r="4.5" fill="#334155" />
      <Circle cx="134" cy="174" r="4.5" fill="#334155" />
      <Circle cx="152" cy="167" r="4.5" fill="#334155" />
    </Svg>
  );
};

/**
 * Screen ID: I02
 * Title: Your Chair, Always Ready
 * Reference: design-reference/intro/intro_1_your_chair_always_ready_chaircare_mobile
 */
export const Intro1YourChairAlwaysReadyChaircareMobileScreen: React.FC<{
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

    // Gentle floating idle animation on chair visual
    const idleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
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
      navigation.navigate('Intro2');
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
          {/* Hero Visual Stage with Precision SVG Illustration */}
          <Animated.View
            style={[
              styles.heroVisualCard,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            {/* Ambient Background Gradient Grid */}
            <View style={[styles.gridOverlay, { pointerEvents: 'none' }]} />

            {/* Ergonomic Task Chair Artwork with Idle Floating Motion */}
            <Animated.View
              style={[
                styles.chairImageContainer,
                { transform: [{ translateY: floatAnim }] },
              ]}
            >
              <Intro1ChairIllustration />
            </Animated.View>

            {/* Floating Metric Tag: 45-min Dispatch */}
            <View style={styles.dispatchPill}>
              <View style={styles.bluePulseDot} />
              <Text style={styles.dispatchPillText}>Fast 45-min Dispatch</Text>
            </View>

            {/* Telemetry Sensor Badge */}
            <View style={styles.bioSyncBadge}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.bioSyncText}>BioSync™ Ready</Text>
            </View>
          </Animated.View>

          {/* Narrative / Content Section */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.stepBadgePill}>
              <Text style={styles.stepBadgeText}>STEP 01 / 04</Text>
            </View>

            <Text style={styles.headlineTitle}>Your Chair, Always Ready</Text>

            <Text style={styles.descriptionText}>
              Get professional office-chair services whenever you need them.
              Rapid diagnosis, certified mechanics, and seamless ergonomics.
            </Text>

            {/* Micro-Feature Chips */}
            <Animated.View style={[styles.chipsRow, { opacity: chipsOpacity }]}>
              <View style={styles.featureChip}>
                <AppIcon name="Zap" size={18} />
                <Text style={styles.featureChipText}>Same-Day Repair</Text>
              </View>

              <View style={styles.featureChip}>
                <AppIcon name="ShieldCheck" size={18} />
                <Text style={styles.featureChipText}>90-Day Warranty</Text>
              </View>

              <View style={styles.featureChip}>
                <AppIcon name="Building2" size={18} />
                <Text style={styles.featureChipText}>At Your Workplace</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Control Bar */}
        <Animated.View
          style={[
            styles.bottomControlBar,
            {
              opacity: bottomBarOpacity,
            },
          ]}
        >
          {/* Stepper Dots (1 of 4 Active) */}
          <View style={styles.stepperDotsRow}>
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsCol}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.primaryNextBtn}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryNextBtnText}>Next</Text>
                <Text style={styles.primaryNextArrow}>→</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.skipWalkthroughBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipWalkthroughText}>Skip Walkthrough</Text>
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
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipBtnText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  scrollBody: {
    paddingVertical: 4,
    gap: 12,
  },
  heroVisualCard: {
    height: 250,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xxl,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(37, 99, 235, 0.02)',
  },
  chairImageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dispatchPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadows.level1,
  },
  bluePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  dispatchPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  bioSyncBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
    ...Shadows.level1,
  },
  greenCheck: {
    fontSize: 11,
    color: Colors.tertiaryEmerald,
    fontWeight: '900',
  },
  bioSyncText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  contentSection: {
    gap: 8,
    marginTop: 4,
  },
  stepBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stepBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.8,
  },
  headlineTitle: {
    ...Typography.headlineLg,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.4,
  },
  descriptionText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    gap: 5,
    ...Shadows.level1,
  },
  featureIcon: {
    fontSize: 12,
  },
  featureChipText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  bottomControlBar: {
    gap: 14,
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
  actionButtonsCol: {
    gap: 4,
  },
  primaryNextBtn: {
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  primaryNextBtnText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onPrimary,
  },
  primaryNextArrow: {
    fontSize: 18,
    color: Colors.onPrimary,
    fontWeight: '800',
  },
  skipWalkthroughBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipWalkthroughText: {
    ...Typography.labelMd,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
