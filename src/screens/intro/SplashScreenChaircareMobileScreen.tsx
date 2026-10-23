import { AppIcon } from '../../components/common/AppIcon';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useIntro } from '../../context/IntroContext';

const STEPS = [
  { progress: 0.25, label: 'Connecting field telemetry...' },
  { progress: 0.65, label: 'Syncing certified technician roster...' },
  { progress: 0.9, label: 'Calibrating workspace profile...' },
  { progress: 1.0, label: 'ErgoFix services ready' },
];

/**
 * Screen ID: I01
 * Title: Splash Screen
 * Reference: design-reference/intro/splash_screen_chaircare_mobile
 */
export const SplashScreenChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { onFinishIntro: contextFinishIntro } = useIntro();
  const onFinishIntro = route?.params?.onFinishIntro || contextFinishIntro;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Entrance animation values
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const artTranslateY = useRef(new Animated.Value(14)).current;
  const artOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.2)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  // -------------------------------------------------------------
  // Dynamic Continuous Chair Maintenance Animation Loop
  // 1. Chair settles (0.0s - 0.5s)
  // 2. Brush sweeps & dust clears (0.5s - 1.2s)
  // 3. Wrench rotates & tightens mechanism (1.2s - 1.8s)
  // 4. Luminous shine glides across chair (1.8s - 2.3s)
  // 5. Loop repeats seamlessly
  // -------------------------------------------------------------
  const chairSettleAnim = useRef(new Animated.Value(0)).current;
  const dustOpacityAnim = useRef(new Animated.Value(0.9)).current;
  const dustScaleAnim = useRef(new Animated.Value(1)).current;

  const brushOpacityAnim = useRef(new Animated.Value(0)).current;
  const brushTranslateX = useRef(new Animated.Value(-30)).current;
  const brushRotateAnim = useRef(new Animated.Value(0)).current;

  const wrenchOpacityAnim = useRef(new Animated.Value(0)).current;
  const wrenchRotateAnim = useRef(new Animated.Value(0)).current;
  const wrenchScaleAnim = useRef(new Animated.Value(0.6)).current;

  const shineOpacityAnim = useRef(new Animated.Value(0)).current;
  const shineTranslateX = useRef(new Animated.Value(-30)).current;
  const shineScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Staggered entrance animation
  useEffect(() => {
    // 1. Background fade (0ms)
    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    // 2. Logo fade + scale (150ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 150);

    // 3. Main visual artwork slide/fade (350ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(artOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(artTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1)),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 350);

    // 4. Text fade (500ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }, 500);

    // 5. CTA / Progress fade (650ms)
    setTimeout(() => {
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    }, 650);

    // Gentle idle floating loop for the logo pod
    const idleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
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

    // -----------------------------------------------------------------
    // Continuous Chair Maintenance Animation Sequence
    // -----------------------------------------------------------------
    const maintenanceLoop = Animated.loop(
      Animated.sequence([
        // Phase 1: Chair settles (0.0s - 0.5s)
        Animated.parallel([
          Animated.timing(chairSettleAnim, {
            toValue: -2.5,
            duration: 260,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dustOpacityAnim, {
            toValue: 0.9,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dustScaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.timing(chairSettleAnim, {
          toValue: 0,
          duration: 240,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),

        // Phase 2: Brush enters and sweeps across mechanism (0.5s - 1.2s)
        Animated.parallel([
          Animated.timing(brushOpacityAnim, {
            toValue: 1,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(brushTranslateX, {
            toValue: 0,
            duration: 340,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(brushRotateAnim, {
            toValue: 1,
            duration: 340,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          // Dust disappears as brush sweeps over
          Animated.timing(dustOpacityAnim, {
            toValue: 0,
            duration: 260,
            delay: 100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dustScaleAnim, {
            toValue: 0.4,
            duration: 260,
            delay: 100,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(brushTranslateX, {
            toValue: 28,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(brushRotateAnim, {
            toValue: 2,
            duration: 320,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(brushOpacityAnim, {
            toValue: 0,
            duration: 180,
            delay: 140,
            easing: Easing.in(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),

        // Phase 3: Repair wrench enters & tightens mechanism (1.2s - 1.8s)
        Animated.parallel([
          Animated.timing(wrenchOpacityAnim, {
            toValue: 1,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.spring(wrenchScaleAnim, {
            toValue: 1,
            friction: 5,
            tension: 50,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.sequence([
          Animated.timing(wrenchRotateAnim, {
            toValue: 1, // +22deg
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(wrenchRotateAnim, {
            toValue: 2, // -16deg
            duration: 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(wrenchRotateAnim, {
            toValue: 0, // 0deg
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(wrenchOpacityAnim, {
            toValue: 0,
            duration: 180,
            easing: Easing.in(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(wrenchScaleAnim, {
            toValue: 0.6,
            duration: 180,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),

        // Phase 4: Subtle shine glides across chair (1.8s - 2.3s)
        Animated.parallel([
          Animated.timing(shineOpacityAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shineTranslateX, {
            toValue: 26,
            duration: 440,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shineScaleAnim, {
            toValue: 1.2,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
        Animated.parallel([
          Animated.timing(shineOpacityAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shineScaleAnim, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),

        // Phase 5: Settle & reset before next loop (2.3s - 2.8s)
        Animated.parallel([
          Animated.timing(brushTranslateX, {
            toValue: -30,
            duration: 50,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(brushRotateAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(wrenchRotateAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(shineTranslateX, {
            toValue: -30,
            duration: 50,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.delay(400),
        ]),
      ])
    );
    maintenanceLoop.start();

    return () => {
      idleLoop.stop();
      maintenanceLoop.stop();
    };
  }, []);

  // Step progress bar animation
  useEffect(() => {
    let step = 0;
    const interval = setInterval(() => {
      if (step < STEPS.length - 1) {
        step += 1;
        setCurrentStepIndex(step);
        Animated.timing(progressAnim, {
          toValue: STEPS[step].progress,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start();
      } else {
        clearInterval(interval);
        setIsReady(true);
      }
    }, 600);

    return () => clearInterval(interval);
  }, []);

  const handleAdvance = () => {
    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 90,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      if (onFinishIntro) {
        onFinishIntro();
      } else if (navigation?.canGoBack()) {
        navigation.goBack();
      } else if (navigation) {
        navigation.navigate('CustomerMain');
      }
    });
  };

  // Interpolations for tool rotation
  const brushRotation = brushRotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['-25deg', '10deg', '-15deg'],
  });

  const wrenchRotation = wrenchRotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '22deg', '-16deg'],
  });

  return (
    <ScreenContainer hasPadding={false}>
      {/* Top Ambient Glow Layers */}
      <Animated.View
        style={[styles.ambientGlowContainer, { opacity: bgOpacity, pointerEvents: 'none' }]}
      >
        <View style={styles.ambientGlowLarge} />
        <View style={styles.ambientGlowSmall} />
      </Animated.View>

      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        {/* Subtle Top System Diagnostic Pill */}
        <Animated.View
          style={[
            styles.topPillWrapper,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.diagnosticPill}>
            <View style={styles.greenPulseDot} />
            <Text style={styles.diagnosticPillText}>Sys.Core v2.4 Active</Text>
          </View>
        </Animated.View>

        {/* Central Brand & Identity Pod with Visible Continuous Maintenance Animation */}
        <View style={styles.centerBrandSection}>
          <Animated.View
            style={[
              styles.brandIconPodWrapper,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }, { translateY: floatAnim }],
              },
            ]}
          >
            <View style={styles.iconPodAura} />

            {/* Central Animated Maintenance Pod */}
            <View style={styles.brandIconPod}>
              {/* Layer 1: Base Precision Ergonomic Chair Visual */}
              <Animated.View
                style={[
                  styles.chairContainer,
                  {
                    transform: [{ translateY: chairSettleAnim }],
                  },
                ]}
              >
                <Svg width={90} height={105} viewBox="0 0 100 125">
                  {/* Headrest */}
                  <Rect
                    x="36"
                    y="6"
                    width="28"
                    height="12"
                    rx="6"
                    fill="#131B2E"
                  />
                  {/* Headrest stem */}
                  <Rect
                    x="47"
                    y="18"
                    width="6"
                    height="6"
                    fill="#76777D"
                  />

                  {/* Backrest outer frame */}
                  <Rect
                    x="24"
                    y="24"
                    width="52"
                    height="44"
                    rx="12"
                    fill="none"
                    stroke="#131B2E"
                    strokeWidth="3.5"
                  />
                  {/* Backrest mesh inner */}
                  <Rect
                    x="27"
                    y="27"
                    width="46"
                    height="38"
                    rx="9"
                    fill="#EEF4FF"
                  />

                  {/* Horizontal spine ribs */}
                  <Line
                    x1="32"
                    y1="35"
                    x2="68"
                    y2="35"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Active ergonomic lumbar support band */}
                  <Line
                    x1="30"
                    y1="45"
                    x2="70"
                    y2="45"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <Line
                    x1="32"
                    y1="55"
                    x2="68"
                    y2="55"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Armrests */}
                  {/* Left arm */}
                  <Path
                    d="M 16 42 L 23 42 L 23 54 L 26 54"
                    stroke="#131B2E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Rect
                    x="13"
                    y="40"
                    width="12"
                    height="4.5"
                    rx="2"
                    fill="#131B2E"
                  />

                  {/* Right arm */}
                  <Path
                    d="M 84 42 L 77 42 L 77 54 L 74 54"
                    stroke="#131B2E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Rect
                    x="75"
                    y="40"
                    width="12"
                    height="4.5"
                    rx="2"
                    fill="#131B2E"
                  />

                  {/* Seat Cushion */}
                  <Rect
                    x="20"
                    y="68"
                    width="60"
                    height="11"
                    rx="5"
                    fill="#131B2E"
                  />

                  {/* Mechanism Box under seat */}
                  <Rect
                    x="42"
                    y="79"
                    width="16"
                    height="6"
                    rx="1.5"
                    fill="#475569"
                  />

                  {/* Hydraulic Nitrogen Gas Lift Cylinder */}
                  <Rect
                    x="46"
                    y="85"
                    width="8"
                    height="17"
                    fill="#64748B"
                  />
                  <Rect
                    x="44.5"
                    y="85"
                    width="11"
                    height="4"
                    rx="1"
                    fill="#2563EB"
                  />

                  {/* 5-Star Caster Base Legs */}
                  <Path
                    d="M 50 102 L 18 116 M 50 102 L 32 120 M 50 102 L 50 122 M 50 102 L 68 120 M 50 102 L 82 116"
                    stroke="#131B2E"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* 5 Casters Wheels */}
                  <Circle cx="18" cy="118" r="3.5" fill="#334155" />
                  <Circle cx="32" cy="122" r="3.5" fill="#334155" />
                  <Circle cx="50" cy="124" r="3.5" fill="#334155" />
                  <Circle cx="68" cy="122" r="3.5" fill="#334155" />
                  <Circle cx="82" cy="118" r="3.5" fill="#334155" />
                </Svg>
              </Animated.View>

              {/* Layer 2: Animated Dust Specks (Fade out during cleaning) */}
              <Animated.View
                style={[
                  styles.dustParticlesLayer,
                  {
                    opacity: dustOpacityAnim,
                    transform: [{ scale: dustScaleAnim }],
                    pointerEvents: 'none',
                  },
                ]}
              >
                <View style={[styles.dustDot, { top: 68, left: 34 }]} />
                <View style={[styles.dustDot, { top: 74, left: 62, width: 4, height: 4 }]} />
                <View style={[styles.dustDot, { top: 82, left: 38 }]} />
                <View style={[styles.dustDot, { top: 86, left: 56, width: 3, height: 3 }]} />
              </Animated.View>

              {/* Layer 3: Animated Cleaning Brush (Moves horizontally across mechanism) */}
              <Animated.View
                style={[
                  styles.brushOverlay,
                  {
                    opacity: brushOpacityAnim,
                    transform: [
                      { translateX: brushTranslateX },
                      { rotate: brushRotation },
                    ],
                    pointerEvents: 'none',
                  },
                ]}
              >
                <View style={styles.brushWrapper}>
                  <AppIcon name="Sparkles" size={18} />
                </View>
              </Animated.View>

              {/* Layer 4: Animated Repair Wrench (Tightens mechanism with rotation) */}
              <Animated.View
                style={[
                  styles.wrenchOverlay,
                  {
                    opacity: wrenchOpacityAnim,
                    transform: [
                      { scale: wrenchScaleAnim },
                      { rotate: wrenchRotation },
                    ],
                    pointerEvents: 'none',
                  },
                ]}
              >
                <View style={styles.wrenchBox}>
                  <AppIcon name="Wrench" size={18} />
                </View>
              </Animated.View>

              {/* Layer 5: Animated Luminous Shine (Travels across backrest) */}
              <Animated.View
                style={[
                  styles.shineOverlay,
                  {
                    opacity: shineOpacityAnim,
                    transform: [
                      { translateX: shineTranslateX },
                      { scale: shineScaleAnim },
                    ],
                    pointerEvents: 'none',
                  },
                ]}
              >
                <AppIcon name="Sparkles" size={18} />
              </Animated.View>
            </View>

            {/* ISO Quality Badge */}
            <View style={styles.isoBadge}>
              <AppIcon name="Check" size={18} />
              <Text style={styles.isoBadgeText}>ISO:9241</Text>
            </View>
          </Animated.View>

          {/* App Identity */}
          <Animated.View
            style={[
              styles.brandTitleSection,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            <View style={styles.ergoFixPill}>
              <AppIcon name="Settings" size={18} />
              <Text style={styles.ergoFixPillText}>ErgoFix Precision</Text>
            </View>

            <Text style={styles.mainBrandHeading}>
              Chair<Text style={styles.brandHighlight}>Care</Text>
            </Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.taglineText,
              {
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              },
            ]}
          >
            Professional Office Chair Services, On Demand
          </Animated.Text>

          {/* Calibration Spark Micro Graphic */}
          <Animated.View
            style={[
              styles.sparkChipsBar,
              {
                opacity: artOpacity,
                transform: [{ translateY: artTranslateY }],
              },
            ]}
          >
            <View style={styles.sparkChip}>
              <AppIcon name="Armchair" size={18} />
              <Text style={styles.sparkText}>Hydraulics</Text>
            </View>
            <View style={styles.sparkDot} />
            <View style={styles.sparkChip}>
              <AppIcon name="Settings" size={18} />
              <Text style={styles.sparkText}>Kinematics</Text>
            </View>
            <View style={styles.sparkDot} />
            <View style={styles.sparkChip}>
              <AppIcon name="Wrench" size={18} />
              <Text style={styles.sparkText}>Class-4</Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Interactive Status, Progress & Advance Prompt */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: ctaOpacity,
            },
          ]}
        >
          {/* Progress Indicator Bar */}
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Loading Feedback Pill */}
          <View style={styles.feedbackPill}>
            <View style={styles.bluePulseDot} />
            <Text style={styles.feedbackPillText}>
              {STEPS[currentStepIndex].label}
            </Text>
          </View>

          {/* Advance Prompt */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={styles.advanceBtn}
              onPress={handleAdvance}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.advanceBtnText,
                  isReady && styles.advanceBtnTextReady,
                ]}
              >
                Tap or wait to proceed
              </Text>
              <Text
                style={[
                  styles.advanceArrow,
                  isReady && styles.advanceArrowReady,
                ]}
              >
                →
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {onFinishIntro && (
            <TouchableOpacity
              style={styles.skipWalkthroughBtn}
              onPress={onFinishIntro}
              activeOpacity={0.7}
            >
              <Text style={styles.skipWalkthroughText}>Skip Walkthrough & Explore →</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ambientGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlowLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(219, 225, 255, 0.45)',
  },
  ambientGlowSmall: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(49, 107, 243, 0.08)',
  },
  topPillWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  diagnosticPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadows.level1,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryEmerald,
  },
  diagnosticPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  centerBrandSection: {
    alignItems: 'center',
    maxWidth: 290,
    gap: 12,
  },
  brandIconPodWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  iconPodAura: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 36,
    backgroundColor: 'rgba(49, 107, 243, 0.15)',
  },
  brandIconPod: {
    width: 136,
    height: 146,
    borderRadius: 28,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.level2,
  },
  chairContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dustParticlesLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dustDot: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  brushOverlay: {
    position: 'absolute',
    top: 65,
    alignSelf: 'center',
    zIndex: 10,
  },
  brushWrapper: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brushIconText: {
    fontSize: 22,
  },
  wrenchOverlay: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    zIndex: 12,
  },
  wrenchBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    ...Shadows.level1,
  },
  wrenchIconText: {
    fontSize: 20,
  },
  shineOverlay: {
    position: 'absolute',
    top: 32,
    alignSelf: 'center',
    zIndex: 15,
  },
  shineSparkleText: {
    fontSize: 22,
  },
  isoBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
    zIndex: 20,
    ...Shadows.level1,
  },
  isoBadgeCheck: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.tertiaryFixed,
  },
  isoBadgeText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.onPrimary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  brandTitleSection: {
    alignItems: 'center',
    gap: 4,
  },
  ergoFixPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  precisionGearIcon: {
    fontSize: 11,
  },
  ergoFixPillText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSecondaryFixed,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mainBrandHeading: {
    ...Typography.displayHero,
    fontSize: 34,
    fontWeight: '800',
    color: Colors.onSurface,
    letterSpacing: -0.5,
  },
  brandHighlight: {
    color: Colors.secondaryCobalt,
  },
  taglineText: {
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  sparkChipsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(236, 238, 240, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.xl,
    gap: 8,
    marginTop: 4,
  },
  sparkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparkIcon: {
    fontSize: 12,
  },
  sparkText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '600',
    color: Colors.tertiaryEmerald,
  },
  sparkDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.outlineVariant,
  },
  bottomSection: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    gap: 12,
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.secondaryCobalt,
    borderRadius: 2,
  },
  feedbackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    gap: 8,
    ...Shadows.level1,
  },
  bluePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  feedbackPillText: {
    ...Typography.labelMono,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontWeight: '600',
  },
  advanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  advanceBtnText: {
    ...Typography.labelMd,
    fontSize: 11,
    color: Colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  advanceBtnTextReady: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  advanceArrow: {
    fontSize: 13,
    color: Colors.outline,
  },
  advanceArrowReady: {
    color: Colors.secondaryCobalt,
    fontWeight: '700',
  },
  skipWalkthroughBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipWalkthroughText: {
    ...Typography.labelSm,
    fontSize: 11,
    color: Colors.secondaryCobalt,
    fontWeight: '600',
  },
});
