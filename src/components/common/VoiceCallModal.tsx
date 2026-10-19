import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  Linking,
} from 'react-native';
import { AppIcon } from './AppIcon';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface VoiceCallModalProps {
  visible: boolean;
  onClose: () => void;
  contactName: string;
  contactRole?: string;
  phoneNumber?: string;
  bookingNumber?: string;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  visible,
  onClose,
  contactName,
  contactRole = 'Contact',
  phoneNumber = '+91 91234 56789',
  bookingNumber,
}) => {
  const [callState, setCallState] = useState<'calling' | 'ringing' | 'connected'>('calling');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(true);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for avatar ring
  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [visible, pulseAnim]);

  // Call connection simulation
  useEffect(() => {
    if (!visible) {
      setCallState('calling');
      setSecondsElapsed(0);
      setIsMuted(false);
      return;
    }

    // Attempt system native dialer in background if supported
    if (phoneNumber) {
      const clean = phoneNumber.replace(/[^0-9+]/g, '');
      if (Platform.OS === 'web') {
        try {
          window.location.href = `tel:${clean}`;
        } catch {
          // ignore
        }
      } else {
        Linking.openURL(`tel:${clean}`).catch(() => {});
      }
    }

    const t1 = setTimeout(() => {
      setCallState('ringing');
    }, 1200);

    const t2 = setTimeout(() => {
      setCallState('connected');
    }, 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible, phoneNumber]);

  // Connected call duration timer
  useEffect(() => {
    let interval: any;
    if (visible && callState === 'connected') {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [visible, callState]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDialDirect = () => {
    const clean = (phoneNumber || '').replace(/[^0-9+]/g, '');
    if (Platform.OS === 'web') {
      try {
        window.location.href = `tel:${clean}`;
      } catch {
        window.open(`tel:${clean}`);
      }
    } else {
      Linking.openURL(`tel:${clean}`).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header pill */}
          <View style={styles.encryptionBadge}>
            <AppIcon name="Shield" size={13} color="#10B981" />
            <Text style={styles.encryptionText}>ChairCare Verified Secure Call</Text>
          </View>

          {/* Callee Info */}
          <View style={styles.calleeInfo}>
            <View style={styles.avatarWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: callState === 'connected' ? 0.3 : 0.6,
                  },
                ]}
              />
              <View style={styles.avatarBox}>
                <AppIcon name="User" size={38} color="#FFFFFF" />
              </View>
            </View>

            {bookingNumber ? (
              <View style={styles.bookingNumberBadge}>
                <AppIcon name="Tag" size={12} color="#60A5FA" />
                <Text style={styles.bookingNumberBadgeText}>
                  Booking Ref: #{bookingNumber.replace(/^#/, '')}
                </Text>
              </View>
            ) : null}

            <Text style={styles.calleeName} numberOfLines={1}>
              {contactName || 'ChairCare Specialist'}
            </Text>
            <Text style={styles.calleeRole}>{contactRole}</Text>
            
            <TouchableOpacity
              style={styles.calleePhoneRow}
              onPress={handleDialDirect}
              activeOpacity={0.7}
            >
              <AppIcon name="PhoneCall" size={14} color="#38BDF8" />
              <Text style={styles.calleePhone}>{phoneNumber}</Text>
            </TouchableOpacity>

            <View style={styles.statusRow}>
              {callState === 'connected' ? (
                <View style={styles.connectedRow}>
                  <View style={styles.connectedDot} />
                  <Text style={styles.timerText}>{formatTimer(secondsElapsed)}</Text>
                </View>
              ) : (
                <Text style={styles.callingText}>
                  {callState === 'calling' ? 'Calling...' : 'Ringing...'}
                </Text>
              )}
            </View>
          </View>

          {/* Direct dial CTA button */}
          <TouchableOpacity
            style={styles.directDialBtn}
            onPress={handleDialDirect}
            activeOpacity={0.8}
          >
            <AppIcon name="PhoneOutgoing" size={15} color="#FFFFFF" />
            <Text style={styles.directDialBtnText}>Open Native Phone Dialer ({phoneNumber})</Text>
          </TouchableOpacity>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            {/* Mute */}
            <TouchableOpacity
              style={[styles.toolBtn, isMuted && styles.toolBtnActive]}
              onPress={() => setIsMuted(!isMuted)}
              activeOpacity={0.7}
            >
              <AppIcon
                name={isMuted ? 'MicOff' : 'Mic'}
                size={22}
                color={isMuted ? '#EF4444' : Colors.onSurface}
              />
              <Text style={styles.toolBtnLabel}>{isMuted ? 'Muted' : 'Mute'}</Text>
            </TouchableOpacity>

            {/* End Call (Red) */}
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <AppIcon name="PhoneOff" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Speaker */}
            <TouchableOpacity
              style={[styles.toolBtn, isSpeaker && styles.toolBtnActive]}
              onPress={() => setIsSpeaker(!isSpeaker)}
              activeOpacity={0.7}
            >
              <AppIcon
                name={isSpeaker ? 'Volume2' : 'VolumeX'}
                size={22}
                color={isSpeaker ? Colors.secondaryCobalt : Colors.onSurface}
              />
              <Text style={styles.toolBtnLabel}>{isSpeaker ? 'Speaker' : 'Earpiece'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 29, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.level3,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    marginBottom: 28,
  },
  encryptionText: {
    ...Typography.caption,
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  calleeInfo: {
    alignItems: 'center',
    marginBottom: 36,
  },
  avatarWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pulseRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.secondaryCobalt,
  },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadows.level2,
  },
  calleeName: {
    ...Typography.heading2,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  calleeRole: {
    ...Typography.caption,
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bookingNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  bookingNumberBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  calleePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  calleePhone: {
    ...Typography.caption,
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statusRow: {
    marginTop: 4,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  timerText: {
    ...Typography.bodyMedium,
    color: '#10B981',
    fontWeight: '700',
    fontSize: 16,
  },
  callingText: {
    ...Typography.bodyMedium,
    color: '#94A3B8',
    fontStyle: 'italic',
    fontSize: 15,
  },
  directDialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: Colors.secondaryCobalt,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    marginBottom: 24,
    ...Shadows.level1,
  },
  directDialBtnText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toolBtnLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level2,
  },
});
