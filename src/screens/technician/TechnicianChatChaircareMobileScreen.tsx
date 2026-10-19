import { AppIcon } from '../../components/common/AppIcon';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useTechnician } from '../../context/TechnicianContext';

import { chatApi, ChatMessageItem } from '../../services/api';
import { useAdminSync } from '../../services/adminSync';
import { VoiceCallModal } from '../../components/common/VoiceCallModal';

interface Message {
  id: string;
  sender: 'operative' | 'client';
  senderName: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

interface QuickResponse {
  id: string;
  label: string;
  icon: string;
}

const QUICK_RESPONSES: QuickResponse[] = [
  { id: 'q1', label: "I'm on my way", icon: 'Car' },
  { id: 'q2', label: 'Arrived at location', icon: 'MapPin' },
  { id: 'q3', label: 'Testing chair mechanism', icon: 'Settings' },
  { id: 'q4', label: 'Service completed', icon: 'Check' },
];

const INITIAL_MESSAGES: Message[] = [];

export const TechnicianChatChaircareMobileScreen: React.FC<{
  navigation?: any;
  route?: {
    params?: {
      requestId?: string;
      request?: any;
      customerName?: string;
      customerPhone?: string;
    };
  };
}> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { acceptedRequest } = useTechnician();
  const scrollViewRef = useRef<ScrollView>(null);

  const passedRequest = route?.params?.request || acceptedRequest;
  const rawRequestId = route?.params?.requestId || passedRequest?.id || passedRequest?.ticketNumber || passedRequest?.trackingCode || 'DEFAULT';
  const customerName = route?.params?.customerName || passedRequest?.customerName || 'Customer';
  const customerPhone = route?.params?.customerPhone || passedRequest?.customerPhone || '+91 91234 56789';
  const trackingCode =
    passedRequest?.ticketNumber || passedRequest?.trackingCode || 'WO #CC-8492';
  const serviceTitle = passedRequest?.serviceTitle || 'Office Chair Repair';
  const address = passedRequest?.address || 'Flat 402 • Skyline Residency';

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [callModalVisible, setCallModalVisible] = useState<boolean>(false);

  const formatCurrentTime = (dateInput?: string | Date) => {
    const now = dateInput ? new Date(dateInput) : new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = hours.toString().padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  };

  const fetchLiveMessages = React.useCallback(async () => {
    if (!rawRequestId) return;
    try {
      const res = await chatApi.getMessages(rawRequestId);
      if (res.success && res.data && res.data.length > 0) {
        const mapped: Message[] = res.data.map((m: ChatMessageItem) => ({
          id: m.id,
          sender: m.senderRole === 'technician' ? 'operative' : 'client',
          senderName: m.senderName || (m.senderRole === 'technician' ? 'Operative (You)' : customerName),
          text: m.message,
          timestamp: formatCurrentTime(m.createdAt),
          status: 'delivered',
        }));
        setMessages(mapped);
      }
    } catch {
      // silent fallback
    }
  }, [rawRequestId, customerName]);

  useEffect(() => {
    fetchLiveMessages();
    const timer = setInterval(fetchLiveMessages, 2500);
    return () => clearInterval(timer);
  }, [fetchLiveMessages]);

  useAdminSync(navigation, fetchLiveMessages);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent) return;

    const optimistic: Message = {
      id: `msg-${Date.now()}`,
      sender: 'operative',
      senderName: 'Operative (You)',
      text: messageContent,
      timestamp: formatCurrentTime(),
      status: 'sent',
    };

    setMessages((prev) => [...prev, optimistic]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await chatApi.sendMessage(rawRequestId, messageContent, 'technician');
    } catch {
      // already added optimistically
    }
  };

  const handleQuickResponse = (qr: QuickResponse) => {
    handleSendMessage(qr.label);
  };

  const handleVoiceCall = () => {
    setCallModalVisible(true);
  };

  const handleSpecSheet = () => {
    Alert.alert(
      'Job Specifications',
      `Asset: Herman Miller Aeron (Size B)\nService: ${serviceTitle}\nTicket: ${trackingCode}\nAddress: ${address}`,
      [{ text: 'Close' }]
    );
  };

  const handleAttachment = () => {
    Alert.alert(
      'Attach Media',
      'Upload diagnostic photo or mechanical calibration snapshot for customer verification.',
      [
        { text: 'Camera', onPress: () => Alert.alert('Camera Opened', 'Diagnostic snapshot captured.') },
        { text: 'Gallery', onPress: () => Alert.alert('Gallery Selected', 'Photo attached.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMic = () => {
    Alert.alert(
      'Voice Note',
      'Hold to record high-fidelity voice memo for customer.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation?.canGoBack() ? navigation.goBack() : navigation?.navigate('TechnicianMain'))}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Technician Chat</Text>
        </View>

        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() => navigation?.navigate?.('TechProfileTab')}
          activeOpacity={0.8}
        >
          <AppIcon name="User" size={18} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {/* Main Scrollable Chat Stream */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Service Order Context Banner */}
          <View style={styles.contextBannerCard}>
            <View style={styles.contextBannerTopRow}>
              <View style={styles.woTagGroup}>
                <View style={styles.blueDot} />
                <Text style={styles.woTagText} numberOfLines={1}>
                  {trackingCode} • {serviceTitle}
                </Text>
              </View>
              <View style={styles.finalizedBadge}>
                <Text style={styles.finalizedBadgeText}>Service Finalized</Text>
              </View>
            </View>

            {/* Nested Customer Micro Bar */}
            <View style={styles.customerQuickBar}>
              <View style={styles.customerProfileLeft}>
                <View style={styles.avatarWrap}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    }}
                    style={styles.customerImg}
                  />
                  <View style={styles.onlineStatusDot} />
                </View>
                <View style={styles.customerMetaCol}>
                  <View style={styles.customerNameRow}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {customerName}
                    </Text>
                    <View style={styles.onlinePill}>
                      <View style={styles.greenPulse} />
                      <Text style={styles.onlineText}>Online</Text>
                    </View>
                  </View>
                  <Text style={styles.addressLine} numberOfLines={1}>
                    {address}
                  </Text>
                </View>
              </View>

              <View style={styles.quickActionsGroup}>
                <TouchableOpacity
                  style={styles.quickCallBtn}
                  onPress={handleVoiceCall}
                  activeOpacity={0.8}
                >
                  <AppIcon name="Phone" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSpecBtn}
                  onPress={handleSpecSheet}
                  activeOpacity={0.8}
                >
                  <AppIcon name="Settings" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Date Divider */}
          <View style={styles.dateDividerRow}>
            <View style={styles.dateDividerPill}>
              <Text style={styles.dateDividerText}>TODAY</Text>
            </View>
          </View>

          {/* Messages Stream */}
          <View style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
                <AppIcon name="MessageSquare" size={32} color={Colors.outline} />
                <Text style={{ ...Typography.titleSmall, color: Colors.onSurface, marginTop: 12, textAlign: 'center' }}>
                  No messages yet
                </Text>
                <Text style={{ ...Typography.bodySmall, color: Colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                  Communicate directly with {customerName} regarding access, parking, or job updates.
                </Text>
              </View>
            ) : (
              messages.map((msg) => renderMessage(msg))
            )}
          </View>
        </ScrollView>

        {/* Bottom Interaction Panel */}
        <View style={[styles.bottomInteractionPanel, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {/* Quick Response Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickChipsScroll}
          >
            {QUICK_RESPONSES.map((qr) => (
              <TouchableOpacity
                key={qr.id}
                style={styles.quickChipBtn}
                onPress={() => handleQuickResponse(qr)}
                activeOpacity={0.8}
              >
                <AppIcon
                  name={qr.icon}
                  size={14}
                  color={Colors.onSurfaceVariant}
                  strokeWidth={1.8}
                />
                <Text style={styles.quickChipLabel}>{qr.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Message Composer Form */}
          <View style={styles.composerBox}>
            <TouchableOpacity
              style={styles.composerAuxBtn}
              onPress={handleAttachment}
              activeOpacity={0.7}
            >
              <Text style={styles.composerAuxIcon}>＋</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.composerInput}
              placeholder="Type a message..."
              placeholderTextColor={Colors.outline}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={styles.composerAuxBtn}
              onPress={handleMic}
              activeOpacity={0.7}
            >
              <AppIcon name="Mic" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.composerSendBtn}
              onPress={() => handleSendMessage()}
              activeOpacity={0.85}
            >
              <AppIcon name="Navigation" size={18} />
            </TouchableOpacity>
          </View>

          {/* Micro Operational Indicator Footer */}
          <View style={styles.operationalFooter}>
            <View style={styles.encryptedChannelGroup}>
              <View style={styles.greenPulseMini} />
              <Text style={styles.footerLabelMono}>Encrypted Dispatch Channel #8492</Text>
            </View>
            <Text style={styles.footerLabelMono}>GPS Telemetry Synced</Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      <VoiceCallModal
        visible={callModalVisible}
        onClose={() => setCallModalVisible(false)}
        contactName={customerName}
        contactRole="Customer"
        phoneNumber={customerPhone}
      />
    </View>
  );

  function renderMessage(msg: Message) {
    const isOperative = msg.sender === 'operative';
    return (
      <View
        key={msg.id}
        style={[
          styles.messageRow,
          isOperative ? styles.messageRowOperative : styles.messageRowClient,
        ]}
      >
        <Text style={styles.messageSenderTag}>{msg.senderName}</Text>
        <View
          style={[
            styles.messageBubble,
            isOperative ? styles.bubbleOperative : styles.bubbleClient,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOperative ? styles.messageTextOperative : styles.messageTextClient,
            ]}
          >
            {msg.text}
          </Text>
        </View>
        <View style={styles.messageFooterRow}>
          <Text style={styles.messageTimeText}>{msg.timestamp}</Text>
          {isOperative && <AppIcon name="CheckCheck" size={18} />}
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
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
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: Colors.onSurface,
    fontWeight: '700',
  },
  headerTitle: {
    ...Typography.headlineSm,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: -0.3,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 14,
    color: Colors.onPrimary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 12,
  },
  contextBannerCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.xl,
    padding: 10,
    gap: 8,
    ...Shadows.level1,
  },
  contextBannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  woTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondaryCobalt,
  },
  woTagText: {
    ...Typography.labelMono,
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  finalizedBadge: {
    backgroundColor: 'rgba(219, 225, 255, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  finalizedBadgeText: {
    ...Typography.labelMd,
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.secondaryCobalt,
  },
  customerQuickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  customerProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
    width: 28,
    height: 28,
  },
  customerImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00875a',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  customerMetaCol: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    ...Typography.titleLg,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  greenPulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00875a',
  },
  onlineText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#00875a',
  },
  addressLine: {
    ...Typography.bodySm,
    fontSize: 10.5,
    color: Colors.onSurfaceVariant,
    marginTop: 0.5,
  },
  quickActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickCallBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(219, 225, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCallIcon: {
    fontSize: 13,
  },
  quickSpecBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSpecIcon: {
    fontSize: 13,
  },
  dateDividerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dateDividerPill: {
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  dateDividerText: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.8,
  },
  messagesContainer: {
    gap: 12,
  },
  messageRow: {
    maxWidth: '85%',
  },
  messageRowOperative: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  messageRowClient: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageSenderTag: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    marginBottom: 3,
    paddingHorizontal: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  bubbleOperative: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 2,
  },
  bubbleClient: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: 2,
  },
  messageText: {
    ...Typography.bodyMd,
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextOperative: {
    color: Colors.onPrimary,
  },
  messageTextClient: {
    color: Colors.onSurface,
  },
  messageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 4,
  },
  messageTimeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
  },
  doubleCheckmark: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.secondaryCobalt,
  },
  eventMarkerCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.lg,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.level1,
  },
  eventMarkerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  eventIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventIconText: {
    fontSize: 14,
  },
  eventMetaCol: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventTitle: {
    ...Typography.titleLg,
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  passedPill: {
    backgroundColor: 'rgba(0, 135, 90, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 3,
  },
  passedPillText: {
    ...Typography.labelMono,
    fontSize: 9,
    fontWeight: '700',
    color: '#00875a',
  },
  eventSubText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  eventTimeText: {
    ...Typography.labelMono,
    fontSize: 9.5,
    color: Colors.onSurfaceVariant,
    marginLeft: 6,
  },
  bottomInteractionPanel: {
    backgroundColor: 'rgba(247, 249, 251, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    gap: 6,
  },
  quickChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 4,
  },
  quickChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  quickChipIcon: {
    fontSize: 11,
  },
  quickChipLabel: {
    ...Typography.labelMd,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  composerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 4,
    ...Shadows.level1,
  },
  composerAuxBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAuxIcon: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  composerInput: {
    flex: 1,
    ...Typography.bodyMd,
    fontSize: 13,
    color: Colors.onSurface,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  composerSendBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrowIcon: {
    fontSize: 14,
    color: Colors.onPrimary,
    fontWeight: '700',
  },
  operationalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  encryptedChannelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greenPulseMini: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00875a',
  },
  footerLabelMono: {
    ...Typography.labelMono,
    fontSize: 9,
    color: Colors.outline,
  },
});
