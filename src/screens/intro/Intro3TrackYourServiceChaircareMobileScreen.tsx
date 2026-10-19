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
 * Screen ID: I04
 * Title: Track Your Service
 * Reference: design-reference/intro/intro_3_track_your_service_chaircare_mobile
 */
export const Intro3TrackYourServiceChaircareMobileScreen: React.FC<{
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
  const listOpacity = useRef(new Animated.Value(0)).current;
  const bottomBarOpacity = useRef(new Animated.Value(0)).current;
  const pulseRadar = useRef(new Animated.Value(1)).current;
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

    // 3. Feature list entrance (320ms)
    setTimeout(() => {
      Animated.timing(listOpacity, {
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

    // Gentle pulsating radar animation
    const radarLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRadar, {
          toValue: 1.25,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseRadar, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    radarLoop.start();

    return () => radarLoop.stop();
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
      navigation.navigate('Intro4');
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
          {/* Hero Visual Stage: Stylized Live Tracking Telemetry */}
          <Animated.View
            style={[
              styles.heroVisualCard,
              {
                opacity: heroOpacity,
                transform: [{ translateY: heroTranslateY }],
              },
            ]}
          >
            {/* Top Overlay: Live Status & ETA */}
            <View style={styles.topMapHeader}>
              <View style={styles.liveRadarBadge}>
                <View style={styles.radarPulseDot} />
                <Text style={styles.liveRadarText}>LIVE RADAR</Text>
              </View>

              <View style={styles.etaBadge}>
                <AppIcon name="Clock" size={18} />
                <Text style={styles.etaText}>Arriving in 12 min</Text>
              </View>
            </View>

            {/* Stylized Transit Graphic Box */}
            <View style={styles.mapGraphicStage}>
              {/* Grid Background */}
              <View style={styles.mapGridPattern} />

              {/* Transit Path Overlay */}
              <View style={styles.transitPathLine} />

              {/* Technician Origin Marker with Radar Wave */}
              <View style={styles.originMarkerWrapper}>
                <Animated.View
                  style={[
                    styles.radarWaveOuter,
                    { transform: [{ scale: pulseRadar }] },
                  ]}
                />
                <View style={styles.radarWaveInner} />
                <AppIcon name="Truck" size={18} />
              </View>

              {/* Destination Office Marker Pin */}
              <View style={styles.destPinWrapper}>
                <AppIcon name="MapPin" size={18} />
              </View>
            </View>

            {/* Bottom Floating Technician Status Sheet */}
            <View style={styles.floatingTechSheet}>
              <View style={styles.techSheetLeft}>
                <View style={styles.techAvatarContainer}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
                    }}
                    style={styles.techAvatar}
                  />
                  <View style={styles.onlineDot} />
                </View>

                <View style={styles.techMetaCol}>
                  <View style={styles.techNameRow}>
                    <Text style={styles.techNameText}>Amit Verma</Text>
                    <View style={styles.proPill}>
                      <Text style={styles.proPillText}>PRO</Text>
                    </View>
                  </View>
                  <Text style={styles.enRouteSubtext}>
                    ● En Route • Mobile Lab 04
                  </Text>
                </View>
              </View>

              <View style={styles.techActionBtns}>
                <View style={styles.techSmallIconBtn}>
                  <AppIcon name="Phone" size={18} />
                </View>
                <View style={[styles.techSmallIconBtn, styles.chatIconBtn]}>
                  <AppIcon name="MessageCircle" size={18} />
                </View>
              </View>
            </View>
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
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>
                STAGE 03 / REAL-TIME DISPATCH
              </Text>
            </View>

            <Text style={styles.headlineTitle}>Track Your Service</Text>

            <Text style={styles.descriptionText}>
              Know when your technician is arriving and follow your precision
              ergonomic tuning in real time.
            </Text>

            {/* Feature List */}
            <Animated.View style={[styles.featureList, { opacity: listOpacity }]}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, styles.featureIconBlue]}>
                  <AppIcon name="MapPin" size={18} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Live GPS Tracking</Text>
                  <Text style={styles.featureItemSub}>
                    Watch your dedicated mobile service van on live route map
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, styles.featureIconDark]}>
                  <AppIcon name="Clock" size={18} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Exact Arrival ETA</Text>
                  <Text style={styles.featureItemSub}>
                    Dynamic traffic calculations with zero guesswork
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, styles.featureIconGreen]}>
                  <AppIcon name="MessageCircle" size={18} />
                </View>
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Direct Tech Chat</Text>
                  <Text style={styles.featureItemSub}>
                    Send building gate codes or parking instructions instantly
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation & Pagination Controls */}
        <Animated.View
          style={[styles.bottomControlBar, { opacity: bottomBarOpacity }]}
        >
          {/* Stepper Dots (3 of 4 Active) */}
          <View style={styles.stepperDotsRow}>
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
            <View style={styles.activeDot} />
            <View style={styles.inactiveDot} />
          </View>

          {/* Actions Container */}
          <View style={styles.actionsColumn}>
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                style={styles.primaryNextBtn}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryNextBtnText}>Next</Text>
                <Text style={styles.nextArrowIcon}>→</Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.skipIntroBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipIntroText}>Skip intro</Text>
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
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xxl,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  topMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveRadarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryCobalt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  radarPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiaryFixed,
  },
  liveRadarText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSecondary,
    letterSpacing: 0.6,
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 5,
    ...Shadows.level1,
  },
  scheduleIcon: {
    fontSize: 11,
  },
  etaText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  mapGraphicStage: {
    height: 120,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  mapGridPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(49, 107, 243, 0.03)',
  },
  transitPathLine: {
    position: 'absolute',
    left: 40,
    top: 60,
    right: 50,
    height: 3,
    backgroundColor: Colors.secondaryContainer,
    borderRadius: 1.5,
  },
  originMarkerWrapper: {
    position: 'absolute',
    left: 30,
    top: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarWaveOuter: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(49, 107, 243, 0.15)',
  },
  radarWaveInner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(49, 107, 243, 0.3)',
  },
  vanIcon: {
    fontSize: 16,
  },
  destPinWrapper: {
    position: 'absolute',
    right: 35,
    top: 42,
  },
  officePinIcon: {
    fontSize: 22,
  },
  floatingTechSheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: BorderRadius.xl,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  techSheetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  techAvatarContainer: {
    position: 'relative',
  },
  techAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.tertiaryEmerald,
    borderWidth: 1.5,
    borderColor: Colors.surfaceContainerLowest,
  },
  techMetaCol: {
    flex: 1,
    gap: 1,
  },
  techNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  techNameText: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  proPill: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  proPillText: {
    ...Typography.labelMono,
    fontSize: 8,
    fontWeight: '800',
    color: Colors.onSecondaryFixed,
  },
  enRouteSubtext: {
    ...Typography.bodySm,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  techActionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  techSmallIconBtn: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIconBtn: {
    backgroundColor: Colors.secondaryContainer,
  },
  techSmallBtnText: {
    fontSize: 13,
  },
  contentSection: {
    gap: 8,
  },
  stagePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 81, 213, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  stagePillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '800',
    color: Colors.secondaryCobalt,
    letterSpacing: 0.6,
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
  featureList: {
    gap: 8,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    padding: 10,
    borderRadius: BorderRadius.lg,
    gap: 10,
  },
  featureIconBox: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconBlue: {
    backgroundColor: Colors.secondaryFixed,
  },
  featureIconDark: {
    backgroundColor: Colors.surfaceContainerHigh,
  },
  featureIconGreen: {
    backgroundColor: 'rgba(111, 251, 190, 0.3)',
  },
  featureIconEmoji: {
    fontSize: 15,
  },
  featureTextCol: {
    flex: 1,
    gap: 1,
  },
  featureItemTitle: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  featureItemSub: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
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
  nextArrowIcon: {
    fontSize: 16,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  skipIntroBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipIntroText: {
    ...Typography.labelMd,
    fontSize: 12,
    color: Colors.outline,
    fontWeight: '600',
  },
});
