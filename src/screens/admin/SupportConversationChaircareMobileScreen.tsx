import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface SupportConversationScreenProps {
  navigation?: any;
  route?: {
    params?: {
      ticketId?: string;
      ticket?: any;
    };
  };
}

export interface ChatMessageItem {
  id: string;
  sender: 'customer' | 'admin' | 'system';
  senderName: string;
  senderRole?: string;
  senderInitials?: string;
  text: string;
  timestamp: string;
  readReceiptTime?: string;
  hasReadReceipt?: boolean;
  mediaAttachment?: {
    filename: string;
    filesize: string;
    imageUri: string;
  };
}

const INITIAL_MESSAGES: ChatMessageItem[] = [
  {
    id: 'msg-1',
    sender: 'customer',
    senderName: 'Rahul Mehta',
    senderRole: 'Customer',
    senderInitials: 'RM',
    text: 'The technician came but the repair was not completed. He said he had to get another part from his van and then drove off.',
    timestamp: '05:20 PM',
  },
  {
    id: 'msg-2',
    sender: 'admin',
    senderName: 'Super Admin (You)',
    text: 'Thanks for reporting this, Rahul. I’m checking the service details and GPS dispatch logs right now with technician Rahul Sharma.',
    timestamp: '05:22 PM',
  },
  {
    id: 'msg-3',
    sender: 'customer',
    senderName: 'Rahul Mehta',
    senderRole: 'Customer',
    senderInitials: 'RM',
    text: 'I also have photos of the chair after the technician left. The cylinder is completely unfastened.',
    timestamp: '05:24 PM',
    mediaAttachment: {
      filename: 'IMG_9042_cylinder.jpg',
      filesize: '2.4 MB',
      imageUri:
        'https://images.unsplash.com/photo-1580481077195-c3a8a04295c0?auto=format&fit=crop&w=600&q=80',
    },
  },
  {
    id: 'msg-4',
    sender: 'system',
    senderName: 'System',
    text: 'Admin S. Raman flagged ticket for Tier-2 supervisory dispatch inspection • 05:26 PM',
    timestamp: '05:26 PM',
  },
  {
    id: 'msg-5',
    sender: 'admin',
    senderName: 'Super Admin (You)',
    text: 'I see the photo clearly. I have placed the escrow on hold so no funds will be released until this is completely resolved. Would you prefer a free priority re-dispatch tomorrow or an instant refund?',
    timestamp: '05:30 PM',
    hasReadReceipt: true,
    readReceiptTime: '05:31 PM',
  },
  {
    id: 'msg-6',
    sender: 'customer',
    senderName: 'Rahul Mehta',
    senderRole: 'Customer',
    senderInitials: 'RM',
    text: 'A re-dispatch tomorrow morning between 10 AM - 12 PM would be great if possible. I really need this chair for work.',
    timestamp: '05:33 PM',
  },
];

export const SupportConversationChaircareMobileScreen: React.FC<
  SupportConversationScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const passedTicket = route?.params?.ticket;

  // Selected ticket context with graceful fallback
  const ticketData = {
    id: passedTicket?.id || 'sup-10482',
    code: passedTicket?.code || 'SUP-10482',
    priority: passedTicket?.priority || 'high',
    priorityLabel: passedTicket?.priorityLabel || 'High Priority',
    status: passedTicket?.status || 'Open',
    customerName: passedTicket?.customerName || passedTicket?.userName || 'Rahul Mehta',
    serviceTitle: 'Office Chair Repair',
    assignedTo: passedTicket?.assignedTo || 'Priya Sharma',
  };

  // Pulse animation for high-priority live beacon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Chat state
  const [messages, setMessages] = useState<ChatMessageItem[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMacrosModal, setShowMacrosModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

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

  // Quick Action Templates
  const quickTemplates = [
    {
      id: 'reschedule',
      label: 'Offer Reschedule',
      icon: 'calendar_today',
      colorType: 'blue',
      text: 'I have booked a free priority re-dispatch for tomorrow, 10:00 AM – 12:00 PM with Senior Specialist Marcus Cole. You will receive live GPS tracking once he departs.',
    },
    {
      id: 'refund',
      label: 'Start Refund',
      icon: 'payments',
      colorType: 'red',
      text: 'Initiated an immediate 100% full refund of ₹1,850 to your primary payment method. Transaction Ref: RF-92817.',
    },
    {
      id: 'contact_tech',
      label: 'Contact Technician',
      icon: 'support_agent',
      colorType: 'gray',
      text: 'Technician Rahul Sharma is currently on audio bridge with Tier-2 dispatch ops to verify replacement cylinder specs.',
    },
    {
      id: 'more_details',
      label: 'Request More Details',
      icon: 'assignment',
      colorType: 'gray',
      text: 'Could you please verify the chair manufacturer model number located on the underside barcode tag?',
    },
    {
      id: 'request_photo',
      label: 'Request Photo',
      icon: 'add_a_photo',
      colorType: 'gray',
      text: 'Please snap a photo of the base star-caster sockets so we bring the exact retaining clips.',
    },
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'admin',
      senderName: 'Super Admin (You)',
      text,
      timestamp: timeStr,
      hasReadReceipt: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleAttachFile = () => {
    const attachText =
      'Attaching Ergonomic Diagnostic Telemetry Sheet SUP-10482_revA.pdf (420 KB)';
    handleSendMessage(attachText);
  };

  const handleResolveTicket = () => {
    setShowMoreMenu(false);
    if (navigation) {
      navigation.navigate('TicketResolvedSup10482', {
        ticketId: ticketData.id,
        ticket: ticketData,
      });
    }
  };

  return (
    <View style={styles.screenContainer}>
      {/* 1. Header Bar */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation?.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('Support');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <AppIcon name="arrow_back" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText} numberOfLines={1}>
            Support Conversation
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => setShowMoreMenu(true)}
            activeOpacity={0.7}
            accessibilityLabel="More ticket actions"
          >
            <AppIcon name="more_vert" size={20} />
          </TouchableOpacity>
          <View style={styles.headerAvatarContainer}>
            <AppIcon name="person" size={20} />
          </View>
        </View>
      </View>

      {/* 1. Support Ticket Context Bar (Pinned top sub-header) */}
      <View style={styles.ticketContextBar}>
        <View style={styles.contextLeft}>
          <Animated.View
            style={[styles.contextPulseDot, { opacity: pulseAnim }]}
          />
          <Text style={styles.contextTicketCode}>{ticketData.code}</Text>
          <Text style={styles.contextDot}>•</Text>
          <Text style={styles.contextServiceTitle} numberOfLines={1}>
            {ticketData.serviceTitle}
          </Text>
        </View>

        <View style={styles.contextRightBadges}>
          <View style={styles.highPriorityPill}>
            <Text style={styles.highPriorityPillText}>High Priority</Text>
          </View>
          <View style={styles.statusOpenPill}>
            <Text style={styles.statusOpenPillText}>{ticketData.status}</Text>
          </View>
        </View>
      </View>

      {/* Chat Stream & Composer in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Scroll Canvas */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScrollView}
          contentContainerStyle={styles.chatContentContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* 2. Date Divider */}
          <View style={styles.dateDividerWrapper}>
            <View style={styles.dateDividerPill}>
              <Text style={styles.dateDividerText}>Today, October 5</Text>
            </View>
          </View>

          {/* Chat Messages */}
          {messages.map((msg) => {
            if (msg.sender === 'system') {
              return (
                <View key={msg.id} style={styles.systemNoticeRow}>
                  <View style={styles.systemNoticePill}>
                    <AppIcon name="verified_user" size={20} />
                    <Text style={styles.systemNoticeText}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            if (msg.sender === 'customer') {
              return (
                <View key={msg.id} style={styles.customerMsgRow}>
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {msg.senderInitials || 'RM'}
                    </Text>
                  </View>
                  <View style={styles.customerMsgCol}>
                    <View style={styles.customerMsgMetaRow}>
                      <Text
                        style={styles.customerSenderName}
                        numberOfLines={1}
                      >
                        {msg.senderName}
                      </Text>
                      <Text style={styles.customerRoleText}>• Customer</Text>
                      <Text style={styles.customerTimestamp}>
                        {msg.timestamp}
                      </Text>
                    </View>

                    <View style={styles.customerBubble}>
                      <Text style={styles.customerMsgText}>{msg.text}</Text>

                      {/* Attached Media Card */}
                      {msg.mediaAttachment && (
                        <TouchableOpacity
                          style={styles.mediaCard}
                          onPress={() => setShowImageViewer(true)}
                          activeOpacity={0.9}
                        >
                          <View style={styles.mediaImageWrapper}>
                            <Image
                              source={{ uri: msg.mediaAttachment.imageUri }}
                              style={styles.mediaImage}
                            />
                            <View style={styles.zoomOverlay}>
                              <AppIcon name="zoom_in" size={20} />
                            </View>
                          </View>
                          <View style={styles.mediaInfoStrip}>
                            <View style={styles.mediaNameGroup}>
                              <AppIcon name="image" size={20} />
                              <Text
                                style={styles.mediaFilename}
                                numberOfLines={1}
                              >
                                {msg.mediaAttachment.filename}
                              </Text>
                            </View>
                            <Text style={styles.mediaFilesize}>
                              {msg.mediaAttachment.filesize}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }

            // Admin Messages (Right Aligned)
            return (
              <View key={msg.id} style={styles.adminMsgRow}>
                <View style={styles.adminMsgMetaRow}>
                  <Text style={styles.adminSenderName}>{msg.senderName}</Text>
                  <Text style={styles.adminTimestamp}>{msg.timestamp}</Text>
                </View>

                <View style={styles.adminBubble}>
                  <Text style={styles.adminMsgText}>{msg.text}</Text>
                </View>

                {msg.hasReadReceipt ? (
                  <View style={styles.readReceiptRow}>
                    <Text style={styles.readReceiptTime}>
                      {msg.readReceiptTime || msg.timestamp}
                    </Text>
                    <AppIcon name="done_all" size={20} />
                  </View>
                ) : (
                  <View style={styles.readReceiptRow}>
                    <Text style={styles.readReceiptTime}>{msg.timestamp}</Text>
                    <AppIcon name="done" size={20} />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* 4. Quick Action Chips (Horizontal Scrollable) */}
        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
          >
            {quickTemplates.map((item) => {
              const isBlue = item.colorType === 'blue';
              const isRed = item.colorType === 'red';

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.quickActionChip,
                    isBlue && styles.quickActionChipBlue,
                    isRed && styles.quickActionChipRed,
                  ]}
                  onPress={() => setInputText(item.text)}
                  activeOpacity={0.8}
                >
                  <AppIcon
                    name={item.icon}
                    size={16}
                    color={isBlue ? '#0051D5' : isRed ? '#BA1A1A' : Colors.onSurfaceVariant}
                    strokeWidth={1.8}
                  />
                  <Text
                    style={[
                      styles.quickActionText,
                      isBlue && styles.quickActionTextBlue,
                      isRed && styles.quickActionTextRed,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 5. Native Chat Message Composer */}
        <View
          style={[
            styles.composerContainer,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          {/* Media/Attachment Trigger */}
          <TouchableOpacity
            style={styles.composerIconButton}
            onPress={handleAttachFile}
            activeOpacity={0.7}
            accessibilityLabel="Attach documents or photos"
          >
            <AppIcon name="attach_file" size={20} />
          </TouchableOpacity>

          {/* Macro/Snippet Trigger */}
          <TouchableOpacity
            style={styles.composerIconButton}
            onPress={() => setShowMacrosModal(true)}
            activeOpacity={0.7}
            accessibilityLabel="Preset macros"
          >
            <AppIcon name="bolt" size={20} />
          </TouchableOpacity>

          {/* Message Input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.messageTextInput}
              placeholder="Type a reply to customer..."
              placeholderTextColor="#76777d"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSendMessage()}
            activeOpacity={0.8}
            accessibilityLabel="Send message"
          >
            <AppIcon name="send" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* More Menu Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View
            style={[
              styles.menuCard,
              { top: Math.max(insets.top, 12) + 48 },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                if (navigation) {
                  navigation.navigate('SupportTicketDetailsSup10482', {
                    ticketId: ticketData.id,
                  });
                }
              }}
            >
              <AppIcon name="info" size={20} />
              <Text style={styles.menuItemText}>View Ticket Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMoreMenu(false);
                if (navigation) {
                  navigation.navigate('AssignSupportTicketSup10482', {
                    ticketId: ticketData.id,
                  });
                }
              }}
            >
              <AppIcon name="person_add" size={20} />
              <Text style={styles.menuItemText}>Reassign Ticket</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleResolveTicket}
            >
              <AppIcon name="task_alt" size={20} color="#009668" />
              <Text style={[styles.menuItemText, { color: '#009668' }]}>
                Resolve Ticket (A28)
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Preset Macros Modal */}
      <Modal
        visible={showMacrosModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMacrosModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.macrosModalCard}>
            <View style={styles.macrosHead}>
              <View style={styles.macrosTitleGroup}>
                <AppIcon name="bolt" size={20} />
                <Text style={styles.macrosTitle}>
                  12 Support Ops Macros
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMacrosModal(false)}
                style={styles.modalCloseBtn}
              >
                <AppIcon name="close" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.macrosList} showsVerticalScrollIndicator={false}>
              {[
                'Technician dispatched with replacement Class-4 pneumatic cylinder.',
                'Escrow payment held under security review pending service completion.',
                'Customer confirmed available for morning re-dispatch (10 AM - 12 PM).',
                'Supervisory audit flag resolved with Tier-2 Master Technician.',
              ].map((macro, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.macroRow}
                  onPress={() => {
                    setInputText(macro);
                    setShowMacrosModal(false);
                  }}
                >
                  <Text style={styles.macroText}>{macro}</Text>
                  <AppIcon name="add" size={20} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            onPress={() => setShowImageViewer(false)}
          >
            <AppIcon name="close" size={20} />
          </TouchableOpacity>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1580481077195-c3a8a04295c0?auto=format&fit=crop&w=1200&q=90',
            }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <Text style={styles.imageViewerCaption}>
            IMG_9042_cylinder.jpg • 2.4 MB • Unseated Hydraulic Cylinder
          </Text>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },

  /* 1. Header Bar */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eceef0',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerTitleText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#191c1e',
    letterSpacing: -0.2,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 22,
    color: '#191c1e',
    includeFontPadding: false,
  },
  headerAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  headerAvatarIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* Pinned Context Bar */
  ticketContextBar: {
    backgroundColor: 'rgba(236, 238, 240, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e3e5',
    ...Shadows.level1,
  },
  contextLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  contextPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ba1a1a',
  },
  contextTicketCode: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 11.5,
    fontWeight: '700',
    color: '#191c1e',
  },
  contextDot: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#76777d',
  },
  contextServiceTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 11.5,
    color: '#45464d',
    flex: 1,
  },
  contextRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  highPriorityPill: {
    backgroundColor: '#ffdad6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  highPriorityPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#93000a',
    textTransform: 'uppercase',
  },
  statusOpenPill: {
    backgroundColor: '#e0e3e5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusOpenPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    fontWeight: '600',
    color: '#191c1e',
  },

  /* Keyboard & Chat Stream */
  keyboardContainer: {
    flex: 1,
  },
  chatScrollView: {
    flex: 1,
  },
  chatContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
  },

  /* Date Divider */
  dateDividerWrapper: {
    alignItems: 'center',
    marginVertical: 4,
  },
  dateDividerPill: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dateDividerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#45464d',
  },

  /* Customer Message (Left) */
  customerMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '88%',
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dbe1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  customerAvatarText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    fontWeight: '700',
    color: '#00174b',
  },
  customerMsgCol: {
    flex: 1,
    gap: 4,
  },
  customerMsgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  customerSenderName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    fontWeight: '600',
    color: '#191c1e',
  },
  customerRoleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#45464d',
  },
  customerTimestamp: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
    marginLeft: 'auto',
  },
  customerBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 12,
    gap: 8,
    ...Shadows.level1,
  },
  customerMsgText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#191c1e',
  },

  /* Media Attachment Card */
  mediaCard: {
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  mediaImageWrapper: {
    height: 140,
    backgroundColor: '#e6e8ea',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  zoomOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#ffffff',
    includeFontPadding: false,
  },
  mediaInfoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eceef0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mediaNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  mediaIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 16,
    color: '#0051d5',
    includeFontPadding: false,
  },
  mediaFilename: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#191c1e',
    flex: 1,
  },
  mediaFilesize: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },

  /* System Notice (Centered) */
  systemNoticeRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemNoticePill: {
    backgroundColor: '#dbe1ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '90%',
  },
  systemVerifiedIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  systemNoticeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#00174b',
    flex: 1,
  },

  /* Admin Message (Right) */
  adminMsgRow: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    gap: 3,
  },
  adminMsgMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 4,
  },
  adminSenderName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  adminTimestamp: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  adminBubble: {
    backgroundColor: '#000000',
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 12,
    ...Shadows.level1,
  },
  adminMsgText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#ffffff',
  },
  readReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 4,
  },
  readReceiptTime: {
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    color: '#76777d',
  },
  doneAllIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#0051d5',
    includeFontPadding: false,
  },
  doneSingleIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#76777d',
    includeFontPadding: false,
  },

  /* 4. Quick Action Chips */
  quickActionsContainer: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eceef0',
    paddingVertical: 8,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#e6e8ea',
  },
  quickActionChipBlue: {
    backgroundColor: '#dbe1ff',
  },
  quickActionChipRed: {
    backgroundColor: '#ffdad6',
  },
  quickActionIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 15,
    color: '#191c1e',
    includeFontPadding: false,
  },
  quickActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#191c1e',
  },
  quickActionTextBlue: {
    color: '#00174b',
  },
  quickActionTextRed: {
    color: '#93000a',
  },

  /* 5. Message Composer */
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eceef0',
    gap: 8,
  },
  composerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e6e8ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#191c1e',
    includeFontPadding: false,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 38,
    maxHeight: 90,
    backgroundColor: '#eceef0',
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  messageTextInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#191c1e',
    paddingVertical: 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0051d5',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.level1,
  },
  sendIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 19,
    color: '#ffffff',
    includeFontPadding: false,
  },

  /* More Menu Modal */
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuCard: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 190,
    ...Shadows.level2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#191c1e',
    includeFontPadding: false,
  },
  menuItemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#191c1e',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eceef0',
    marginVertical: 4,
  },

  /* Macros Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  macrosModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '60%',
    gap: 12,
  },
  macrosHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  macrosTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macrosBoltIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#0051d5',
    includeFontPadding: false,
  },
  macrosTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1e',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 20,
    color: '#76777d',
    includeFontPadding: false,
  },
  macrosList: {
    gap: 8,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  macroText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#191c1e',
    flex: 1,
  },
  macroApplyIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 18,
    color: '#0051d5',
    marginLeft: 8,
    includeFontPadding: false,
  },

  /* Image Viewer Modal */
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  imageViewerCloseIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 28,
    color: '#ffffff',
    includeFontPadding: false,
  },
  fullScreenImage: {
    width: '100%',
    height: '70%',
  },
  imageViewerCaption: {
    fontFamily: 'JetBrainsMono-Medium',
    fontSize: 11,
    color: '#bec6e0',
    marginTop: 12,
    textAlign: 'center',
  },
});
