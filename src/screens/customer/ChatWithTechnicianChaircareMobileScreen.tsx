import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';
import { Typography } from '../../constants/typography';

import { chatApi, ChatMessageItem } from '../../services/api';
import { useAdminSync } from '../../services/adminSync';
import { VoiceCallModal } from '../../components/common/VoiceCallModal';
import { phoneCallService } from '../../services/phone/phoneCallService';

interface ChatMessage {
  id: string;
  sender: 'technician' | 'customer';
  text: string;
  timestamp: string;
  isDelivered?: boolean;
  specCard?: {
    title: string;
    subtitle: string;
  };
}

const QUICK_REPLIES = [
  "I'm at the location",
  '⏱️ How long will it take?',
  'Please call upon arrival',
  'Chair is ready for inspection',
];

/**
 * Screen ID: C18
 * Title: Chat With Technician
 * Reference: design-reference/customer/chat_with_technician_chaircare_mobile
 */
export const ChatWithTechnicianChaircareMobileScreen: React.FC<{
  navigation: any;
  route?: any;
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const rawRequestId = route?.params?.requestId || route?.params?.request?.id || route?.params?.trackingCode || 'ACTIVE';
  const recipientName = route?.params?.recipientName || route?.params?.technicianName || 'Assigned Specialist';
  const technicianPhone = route?.params?.technicianPhone || route?.params?.phone || '+91 98765 43210';
  const trackingCode = route?.params?.trackingCode || route?.params?.ticketNumber || 'ACTIVE';

  const [messages, setMessages] = useState<ChatMessage[]>(route?.params?.messages || []);
  const [inputText, setInputText] = useState<string>('');
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);

  const formatCurrentTime = (dateInput?: string | Date): string => {
    const now = dateInput ? new Date(dateInput) : new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return `${hoursStr}:${minutes} ${ampm}`;
  };

  const fetchLiveMessages = React.useCallback(async () => {
    if (!rawRequestId) return;
    try {
      const res = await chatApi.getMessages(rawRequestId);
      if (res.success && res.data && res.data.length > 0) {
        const mapped: ChatMessage[] = res.data.map((m: ChatMessageItem) => ({
          id: m.id,
          sender: m.senderRole === 'customer' ? 'customer' : 'technician',
          text: m.message,
          timestamp: formatCurrentTime(m.createdAt),
          isDelivered: true,
        }));
        setMessages(mapped);
      }
    } catch {
      // fallback
    }
  }, [rawRequestId]);

  useEffect(() => {
    fetchLiveMessages();
    const timer = setInterval(fetchLiveMessages, 2500);
    return () => clearInterval(timer);
  }, [fetchLiveMessages]);

  useAdminSync(navigation, fetchLiveMessages);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      text,
      timestamp: formatCurrentTime(),
      isDelivered: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    if (!textToSend) {
      setInputText('');
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await chatApi.sendMessage(rawRequestId, text, 'customer');
    } catch {
      // optimistic message already added
    }
  };

  const handleCall = () => {
    phoneCallService.callNumber(technicianPhone, recipientName);
  };

  const handleAttach = () => {
    Alert.alert('Attach File', 'Attach photo of chair or voice memo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Photo of Chair',
        onPress: () => {
          handleSendMessage('Attached photo of chair mechanism');
        },
      },
    ]);
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
              Chat With Technician
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleCall}
            activeOpacity={0.7}
            accessibilityLabel="Call technician"
          >
            <AppIcon name="Phone" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => {}}
            activeOpacity={0.7}
            accessibilityLabel="More options"
          >
            <Text style={styles.moreIcon}>⋮</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('CustomerProfileTab')}
            activeOpacity={0.7}
          >
            <AppIcon name="User" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Dynamic Status & Dispatch Telemetry Card */}
          <View style={styles.telemetryCard}>
            <View style={styles.telemetryTopRow}>
              <View style={styles.telemetryStatusGroup}>
                <View style={styles.pulseDot} />
                <Text style={styles.telemetryStatusText}>
                  ACTIVE DISPATCH ROUTE
                </Text>
              </View>
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>ETA ~18 MIN</Text>
              </View>
            </View>

            <View style={styles.telemetryBottomRow}>
              <View style={styles.toolingGroup}>
                <AppIcon name="Settings" size={18} />
                <Text style={styles.toolingText} numberOfLines={1}>
                  Tooling: Calibration & Hardware Kit
                </Text>
              </View>
              <Text style={styles.workOrderText}>
                {trackingCode.startsWith('#') ? trackingCode : `#${trackingCode}`}
              </Text>
            </View>
          </View>

          {/* Date Separator Pill */}
          <View style={styles.dateSeparatorRow}>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>Direct Dispatch Channel</Text>
            </View>
          </View>

          {/* Messages Stream */}
          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: Colors.primaryContainer,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <AppIcon name="MessageSquare" size={24} color={Colors.primary} />
                </View>
                <Text style={{ ...Typography.h3, color: Colors.onSurface, marginBottom: 6, textAlign: 'center' }}>
                  Direct Technician Channel
                </Text>
                <Text style={{ ...Typography.bodySmall, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 }}>
                  Send a message to your assigned specialist regarding arrival, building entry, or chair inspection.
                </Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isTech = msg.sender === 'technician';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isTech ? styles.messageRowTech : styles.messageRowCustomer,
                  ]}
                >
                  {isTech && (
                    <Image
                      source={{
                        uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                      }}
                      style={styles.techAvatarMini}
                    />
                  )}

                  <View
                    style={[
                      styles.messageBubbleWrapper,
                      isTech ? styles.bubbleWrapTech : styles.bubbleWrapCustomer,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isTech ? styles.bubbleTech : styles.bubbleCustomer,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isTech
                            ? styles.messageTextTech
                            : styles.messageTextCustomer,
                        ]}
                      >
                        {msg.text}
                      </Text>

                      {/* Micro Spec Preview Card if present */}
                      {msg.specCard && (
                        <View style={styles.specCardInside}>
                          <View style={styles.specIconBox}>
                            <AppIcon name="Wrench" size={18} />
                          </View>
                          <View style={styles.specTextGroup}>
                            <Text
                              style={styles.specTitle}
                              numberOfLines={1}
                            >
                              {msg.specCard.title}
                            </Text>
                            <Text
                              style={styles.specSubtitle}
                              numberOfLines={1}
                            >
                              {msg.specCard.subtitle}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    <View style={styles.timestampRow}>
                      <Text style={styles.timestampText}>{msg.timestamp}</Text>
                      {!isTech && (
                        <AppIcon name="CheckCheck" size={18} />
                      )}
                    </View>
                  </View>
                </View>
              );
            }))}
          </View>
        </ScrollView>

        {/* Quick Action Reply Chips */}
        <View style={styles.quickRepliesBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesScroll}
          >
            {QUICK_REPLIES.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyChip}
                onPress={() => handleSendMessage(reply)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Message Composer */}
        <View
          style={[
            styles.composerBar,
            { paddingBottom: Math.max(insets.bottom, 10) + 4 },
          ]}
        >
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={handleAttach}
            activeOpacity={0.7}
            accessibilityLabel="Attach photo or spec"
          >
            <AppIcon name="Paperclip" size={20} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message..."
              placeholderTextColor={Colors.outline}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() => {}}
              activeOpacity={0.7}
              accessibilityLabel="Voice input"
            >
              <AppIcon name="Mic" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim()}
            activeOpacity={0.85}
            accessibilityLabel="Send message"
          >
            <AppIcon name="Navigation" size={18} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <VoiceCallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        contactName={recipientName}
        contactRole="Certified Specialist"
        phoneNumber={technicianPhone}
      />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerLow,
  },
  headerActionIcon: {
    fontSize: 16,
  },
  moreIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
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
    gap: 12,
  },
  telemetryCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  telemetryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.tertiaryFixedDim,
  },
  telemetryStatusText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onTertiaryContainer,
    letterSpacing: 0.6,
  },
  etaBadge: {
    backgroundColor: Colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  etaText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.secondaryCobalt,
  },
  telemetryBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
  },
  toolingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  toolingIcon: {
    fontSize: 13,
  },
  toolingText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  workOrderText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
  dateSeparatorRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  datePill: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    ...Shadows.level1,
  },
  datePillText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  messagesContainer: {
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: '86%',
  },
  messageRowTech: {
    alignSelf: 'flex-start',
  },
  messageRowCustomer: {
    alignSelf: 'flex-end',
  },
  techAvatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceContainerHigh,
    marginBottom: 16,
  },
  messageBubbleWrapper: {
    gap: 3,
  },
  bubbleWrapTech: {
    alignItems: 'flex-start',
  },
  bubbleWrapCustomer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    ...Shadows.level1,
  },
  bubbleTech: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
  },
  bubbleCustomer: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    ...Typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextTech: {
    color: Colors.onSurface,
  },
  messageTextCustomer: {
    color: Colors.onPrimary,
  },
  specCardInside: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceContainerLow,
    padding: 8,
    borderRadius: BorderRadius.lg,
    marginTop: 8,
  },
  specIconBox: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 81, 213, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specIcon: {
    fontSize: 13,
  },
  specTextGroup: {
    flex: 1,
    gap: 1,
  },
  specTitle: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  specSubtitle: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  timestampText: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
  },
  checkDoneIcon: {
    fontSize: 9,
    color: Colors.secondaryCobalt,
    fontWeight: '800',
  },
  quickRepliesBar: {
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  quickRepliesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyChip: {
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  quickReplyText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurface,
  },
  composerBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineHairline,
    paddingHorizontal: 12,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Shadows.level3,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 20,
    color: Colors.onSurfaceVariant,
  },
  inputContainer: {
    flex: 1,
    minHeight: 40,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    ...Shadows.level1,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.onSurface,
    paddingVertical: 6,
    paddingRight: 6,
  },
  micBtn: {
    padding: 4,
  },
  micIcon: {
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondaryCobalt,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.surfaceContainerHigh,
    opacity: 0.6,
  },
  sendIcon: {
    fontSize: 14,
    color: Colors.onPrimary,
    marginLeft: 2,
  },
});
