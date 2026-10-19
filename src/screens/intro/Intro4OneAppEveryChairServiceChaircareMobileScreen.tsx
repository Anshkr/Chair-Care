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
  AccessibilityInfo,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useIntro } from '../../context/IntroContext';

/**
 * Precision Ergonomic Chair SVG Artwork for Intro 4 Centerpiece
 */
const Intro4CenterChairIllustration: React.FC = () => {
  return (
    <Svg width={110} height={118} viewBox="0 0 110 120">
      {/* Headrest */}
      <Rect x="42" y="6" width="26" height="11" rx="5.5" fill="#0F172A" />
      <Rect x="44" y="8" width="22" height="3" rx="1.5" fill="#1E293B" />
      <Rect x="52.5" y="17" width="5" height="6" fill="#64748B" />

      {/* Backrest Outer Frame */}
      <Rect
        x="30"
        y="22"
        width="50"
        height="44"
        rx="11"
        fill="none"
        stroke="#0F172A"
        strokeWidth="3.5"
      />
      {/* Backrest Mesh Inner */}
      <Rect
        x="33"
        y="25"
        width="44"
        height="38"
        rx="8"
        fill="#EEF4FF"
      />

      {/* Horizontal Mesh Ribs */}
      <Line x1="38" y1="33" x2="72" y2="33" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <Line x1="36" y1="42" x2="74" y2="42" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      {/* Blue Active Lumbar Support Band */}
      <Line x1="35" y1="51" x2="75" y2="51" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />

      {/* Armrests */}
      {/* Left Armrest */}
      <Path
        d="M 23 40 L 29 40 L 29 52 L 33 52"
        stroke="#0F172A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="20" y="38" width="11" height="4" rx="2" fill="#0F172A" />

      {/* Right Armrest */}
      <Path
        d="M 87 40 L 81 40 L 81 52 L 77 52"
        stroke="#0F172A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="79" y="38" width="11" height="4" rx="2" fill="#0F172A" />

      {/* Seat Cushion */}
      <Rect x="26" y="65" width="58" height="11" rx="5" fill="#0F172A" />
      <Rect x="29" y="66.5" width="52" height="3" rx="1.5" fill="#1E293B" />

      {/* Under-Seat Mechanism Box */}
      <Rect x="47" y="76" width="16" height="6" rx="1.5" fill="#334155" />

      {/* Class-4 Gas Lift Cylinder */}
      <Rect x="51.5" y="82" width="7" height="16" fill="#64748B" />
      <Rect x="50" y="82" width="10" height="4" rx="1" fill="#2563EB" />

      {/* 5-Star Base Legs */}
      <Path
        d="M 55 98 L 24 110 M 55 98 L 38 114 M 55 98 L 55 116 M 55 98 L 72 114 M 55 98 L 86 110"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* 5 Casters */}
      <Circle cx="24" cy="111.5" r="3.5" fill="#334155" />
      <Circle cx="38" cy="115.5" r="3.5" fill="#334155" />
      <Circle cx="55" cy="117.5" r="3.5" fill="#334155" />
      <Circle cx="72" cy="115.5" r="3.5" fill="#334155" />
      <Circle cx="86" cy="111.5" r="3.5" fill="#334155" />
    </Svg>
  );
};

/**
 * Screen ID: I05
 * Title: One App. Every Chair Service.
 * Reference: design-reference/intro/intro_4_one_app._every_chair_service_chaircare_mobile
 */
export const Intro4OneAppEveryChairServiceChaircareMobileScreen: React.FC<{
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
  const bentoOpacity = useRef(new Animated.Value(0)).current;
  const bentoTranslateY = useRef(new Animated.Value(10)).current;
  const bottomBarOpacity = useRef(new Animated.Value(0)).current;
  const bottomBarTranslateY = useRef(new Animated.Value(10)).current;

  // Interactive button scale
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Idle floating animation on central chair card
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((reducedMotion) => {
      if (!isMounted) return;

      if (reducedMotion) {
        heroOpacity.setValue(1);
        heroTranslateY.setValue(0);
        contentOpacity.setValue(1);
        contentTranslateY.setValue(0);
        bentoOpacity.setValue(1);
        bentoTranslateY.setValue(0);
        bottomBarOpacity.setValue(1);
        bottomBarTranslateY.setValue(0);
        return;
      }

      // Smooth staggered entrance
      Animated.stagger(120, [
        Animated.parallel([
          Animated.timing(heroOpacity, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(heroTranslateY, {
            toValue: 0,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(contentTranslateY, {
            toValue: 0,
            duration: 360,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(bentoOpacity, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(bentoTranslateY, {
            toValue: 0,
            duration: 340,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(bottomBarOpacity, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(bottomBarTranslateY, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ]).start();

      // Subtle continuous floating loop on center chair card (0 -> -4 -> 0)
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -4,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      ).start();
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: Platform.OS !== 'web',
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      tension: 50,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handleGetStarted = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.96,
        duration: 80,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(buttonScale, {
        toValue: 1.0,
        duration: 90,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      if (onFinishIntro) {
        onFinishIntro();
      } else {
        navigation.navigate('CustomerMain');
      }
    });
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

          <View style={styles.stepBadge}>
            <View style={styles.blueDot} />
            <Text style={styles.stepBadgeText}>STEP 04/04</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
        >
          {/* Upper Visual Section: The Complete Precision Chair Diagnostic Ecosystem */}
          <Animated.View
            style={[
              styles.heroVisualCard,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            {/* Centerpiece: Premium Ergonomic Chair Asset Card with subtle floating idle animation */}
            <Animated.View
              style={[
                styles.centerChairCard,
                {
                  transform: [{ translateY: floatAnim }],
                },
              ]}
            >
              <View style={styles.calibratedTag}>
                <AppIcon name="Check" size={18} />
                <Text style={styles.calibratedText}>CALIBRATED</Text>
              </View>

              {/* Centerpiece Chair SVG Artwork */}
              <View style={styles.chairAssetBox}>
                <Intro4CenterChairIllustration />
              </View>

              <View style={styles.chairModelBar}>
                <Text style={styles.chairModelName}>SERIES-X PRO</Text>
                <Text style={styles.chairModelSpec}>100% SPEC</Text>
              </View>
            </Animated.View>

            {/* Floating Component Node 1: Silent-Glide Casters (Top-Left) */}
            <View style={[styles.floatingNode, styles.nodeTopLeft]}>
              <View style={styles.nodeIconCircle}>
                <AppIcon name="Settings" size={18} />
              </View>
              <View style={styles.nodeTextCol}>
                <Text style={styles.nodeTitle}>60mm Casters</Text>
                <Text style={styles.nodeSub}>Silent-Glide TPU</Text>
              </View>
            </View>

            {/* Floating Component Node 2: Class-4 Gas Lift (Top-Right) */}
            <View style={[styles.floatingNode, styles.nodeTopRight]}>
              <View style={[styles.nodeIconCircle, styles.darkIconCircle]}>
                <AppIcon name="Wrench" size={18} />
              </View>
              <View style={styles.nodeTextCol}>
                <Text style={styles.nodeTitle}>Class-4 Gas Lift</Text>
                <Text style={styles.nodeSub}>BIFMA Rated</Text>
              </View>
            </View>

            {/* Floating Component Node 3: 4D Armrest (Bottom-Left) */}
            <View style={[styles.floatingNode, styles.nodeBottomLeft]}>
              <View style={styles.nodeIconCircle}>
                <AppIcon name="Armchair" size={18} />
              </View>
              <View style={styles.nodeTextCol}>
                <Text style={styles.nodeTitle}>4D Armrest</Text>
                <Text style={styles.nodeSub}>Pivot & Lock</Text>
              </View>
            </View>

            {/* Floating Component Node 4: Tilt Tension (Bottom-Right) */}
            <View style={[styles.floatingNode, styles.nodeBottomRight]}>
              <View style={[styles.nodeIconCircle, styles.blueIconCircle]}>
                <AppIcon name="SlidersHorizontal" size={18} />
              </View>
              <View style={styles.nodeTextCol}>
                <Text style={styles.nodeTitle}>Tilt Tension</Text>
                <Text style={styles.nodeSub}>Dynamic Spring</Text>
              </View>
            </View>

            {/* Accent Micro Gauge Badge */}
            <View style={styles.precisionGaugeBadge}>
              <AppIcon name="Clock" size={18} />
              <Text style={styles.gaugeText}>PRECISION CERTIFIED</Text>
            </View>
          </Animated.View>

          {/* Middle Section: Typography & Concrete Service Pillars */}
          <Animated.View
            style={[
              styles.contentSection,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <View style={styles.lifeCyclePill}>
              <AppIcon name="Wrench" size={18} />
              <Text style={styles.lifeCyclePillText}>
                COMPLETE LIFE-CYCLE CARE
              </Text>
            </View>

            <Text style={styles.headlineTitle}>
              One App. Every Chair Service.
            </Text>

            <Text style={styles.descriptionText}>
              From wheels to hydraulics, certified ergonomic technicians handle
              every repair directly at your doorstep.
            </Text>

            {/* Visual Service Highlights Bento Trio */}
            <Animated.View
              style={[
                styles.bentoGrid,
                {
                  opacity: bentoOpacity,
                  transform: [{ translateY: bentoTranslateY }],
                },
              ]}
            >
              <View style={styles.bentoCard}>
                <View style={styles.bentoIconBox}>
                  <AppIcon name="Wrench" size={18} />
                </View>
                <Text style={styles.bentoTitle}>Repairs & Overhauls</Text>
                <Text style={styles.bentoSub}>Cylinders & Base</Text>
              </View>

              <View style={styles.bentoCard}>
                <View style={styles.bentoIconBox}>
                  <AppIcon name="Package" size={18} />
                </View>
                <Text style={styles.bentoTitle}>Unbox & Assembly</Text>
                <Text style={styles.bentoSub}>Zero-Stress Setup</Text>
              </View>

              <View style={styles.bentoCard}>
                <View style={styles.bentoIconBox}>
                  <AppIcon name="Sparkles" size={18} color="#059669" />
                </View>
                <Text style={styles.bentoTitle}>Clean & Lubricate</Text>
                <Text style={styles.bentoSub}>Mesh Steam & Cast</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Section: Carousel Pagination & Primary Get Started Action */}
        <Animated.View
          style={[
            styles.bottomControlBar,
            {
              opacity: bottomBarOpacity,
              transform: [{ translateY: bottomBarTranslateY }],
            },
          ]}
        >
          {/* Stepper Dots (4 of 4 Active) */}
          <View style={styles.stepperDotsRow}>
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.activeDot} />
          </View>

          {/* Full-Width High-Contrast Get Started CTA with interactive scale */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.getStartedBtn}
              onPress={handleGetStarted}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.88}
            >
              <Text style={styles.getStartedBtnText}>Get Started</Text>
              <Text style={styles.getStartedArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>
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
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  stepBadgeText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  scrollBody: {
    paddingVertical: 4,
    gap: 12,
  },
  heroVisualCard: {
    height: 260,
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
  centerChairCard: {
    width: 150,
    height: 180,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    position: 'relative',
    ...Shadows.level2,
  },
  calibratedTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
    zIndex: 10,
  },
  calibratedCheck: {
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '900',
  },
  calibratedText: {
    ...Typography.labelMono,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  chairAssetBox: {
    width: '100%',
    height: '75%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  chairModelBar: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(236, 238, 240, 0.9)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  chairModelName: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  chairModelSpec: {
    ...Typography.labelMono,
    fontSize: 8,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  floatingNode: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadows.level1,
  },
  nodeTopLeft: {
    top: 10,
    left: 8,
  },
  nodeTopRight: {
    top: 10,
    right: 8,
  },
  nodeBottomLeft: {
    bottom: 12,
    left: 8,
  },
  nodeBottomRight: {
    bottom: 12,
    right: 8,
  },
  nodeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkIconCircle: {
    backgroundColor: Colors.primaryContainer,
  },
  blueIconCircle: {
    backgroundColor: Colors.secondaryFixed,
  },
  nodeIconText: {
    fontSize: 12,
  },
  nodeTextCol: {
    gap: 1,
  },
  nodeTitle: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  nodeSub: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.onSurfaceVariant,
  },
  precisionGaugeBadge: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
    ...Shadows.level2,
  },
  gaugeIcon: {
    fontSize: 10,
  },
  gaugeText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onPrimary,
    letterSpacing: 0.6,
  },
  contentSection: {
    gap: 8,
    alignItems: 'center',
    textAlign: 'center',
  },
  lifeCyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  wrenchIcon: {
    fontSize: 10,
  },
  lifeCyclePillText: {
    ...Typography.labelMd,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.6,
  },
  headlineTitle: {
    ...Typography.headlineLg,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.onSurface,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  descriptionText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  bentoCard: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: BorderRadius.xl,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  bentoIconBox: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bentoIcon: {
    fontSize: 13,
  },
  bentoTitle: {
    ...Typography.titleLg,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
    lineHeight: 14,
  },
  bentoSub: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    lineHeight: 13,
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
  getStartedBtn: {
    height: 54,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.secondaryCobalt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.level2,
  },
  getStartedBtnText: {
    ...Typography.titleLg,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSecondary,
  },
  getStartedArrow: {
    fontSize: 18,
    color: Colors.onSecondary,
    fontWeight: '800',
  },
});
