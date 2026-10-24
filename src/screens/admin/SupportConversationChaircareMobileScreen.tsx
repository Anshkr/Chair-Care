import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../components/common/AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { chatApi, SupportMessageItem } from '../../services/api/chatApi';
import { useAdminSync } from '../../services/adminSync';
import { fileUriToBase64DataUrl } from '../../utils/fileUpload';

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

export const SupportConversationChaircareMobileScreen: React.FC<
  SupportConversationScreenProps
> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || (currentUser?.role as string) === 'superadmin';

  const passedTicket = route?.params?.ticket;
  const rawTicketId = route?.params?.ticketId || passedTicket?.id || 'sup-10482';

  const [ticketDetails, setTicketDetails] = useState<any>(passedTicket || null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMacrosModal, setShowMacrosModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageCaption, setSelectedImageCaption] = useState<string>('Attached Photo');

  // Selected ticket context with graceful fallback
  const ticketData = {
    id: ticketDetails?.id || passedTicket?.id || rawTicketId,
    code: ticketDetails?.ticketCode || passedTicket?.code || 'SUP-10482',
    priority: ticketDetails?.priority || passedTicket?.priority || 'high',
    priorityLabel: passedTicket?.priorityLabel || 'High Priority',
    status: ticketDetails?.status || passedTicket?.status || 'Open',
    customerName: ticketDetails?.customerName || passedTicket?.customerName || 'Customer',
    serviceTitle: passedTicket?.chairModel || passedTicket?.serviceTitle || 'Chair Service Claim',
    assignedTo: passedTicket?.assignedTo || 'Super Admin',
  };

  // Pulse animation for high-priority live beacon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchLiveMessages = useCallback(async () => {
    if (!rawTicketId) return;
    try {
      const res = await chatApi.getSupportMessages(rawTicketId);
      if (res.success && res.data) {
        if ((res as any).ticket && !ticketDetails) {
          setTicketDetails((res as any).ticket);
        }
        const mapped: ChatMessageItem[] = res.data.map((m: SupportMessageItem) => {
          const isFromAdmin = m.senderRole === 'admin';
          const isFromSystem = m.senderRole === 'system';
          const sender: 'customer' | 'admin' | 'system' = isFromSystem
            ? 'system'
            : isFromAdmin
            ? 'admin'
            : 'customer';

          const rawDate = m.createdAt ? new Date(m.createdAt) : new Date();
          const hours = rawDate.getHours().toString().padStart(2, '0');
          const minutes = rawDate.getMinutes().toString().padStart(2, '0');
          const timestamp = `${hours}:${minutes}`;

          const initials = (m.senderName || (isFromAdmin ? 'SA' : 'CU'))
            .split(' ')
            .map((p) => p[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

          return {
            id: m.id,
            sender,
            senderName: isFromAdmin
              ? isAdmin
                ? 'Super Admin (You)'
                : 'ChairCare Support'
              : !isAdmin
              ? 'You'
              : m.senderName || ticketData.customerName,
            senderRole: isFromAdmin ? 'Admin Support' : 'Customer',
            senderInitials: initials,
            text: m.message,
            timestamp,
            hasReadReceipt: true,
            mediaAttachment: m.imageUrl
              ? {
                  filename: 'Attached Photo',
                  filesize: 'Image',
                  imageUri: m.imageUrl,
                }
              : undefined,
          };
        });
        setMessages(mapped);
      }
    } catch {
      // network fallback
    } finally {
      setIsLoading(false);
    }
  }, [rawTicketId, isAdmin, ticketDetails, ticketData.customerName]);

  useEffect(() => {
    fetchLiveMessages();
    const interval = setInterval(fetchLiveMessages, 2500);
    return () => clearInterval(interval);
  }, [fetchLiveMessages]);

  useAdminSync(navigation, fetchLiveMessages);

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
      text: 'I have booked a free priority re-dispatch for tomorrow. You will receive live GPS tracking once the technician departs.',
    },
    {
      id: 'refund',
      label: 'Start Refund',
      icon: 'payments',
      colorType: 'red',
      text: 'Initiated an immediate review for full refund to your primary payment method.',
    },
    {
      id: 'contact_tech',
      label: 'Contact Technician',
      icon: 'support_agent',
      colorType: 'gray',
      text: 'Our operations team has reached out directly to the specialist to verify replacement parts.',
    },
    {
      id: 'more_details',
      label: 'Request More Details',
      icon: 'assignment',
      colorType: 'gray',
      text: 'Could you please verify the chair manufacturer model number located on the underside tag?',
    },
    {
      id: 'request_photo',
      label: 'Request Photo',
      icon: 'add_a_photo',
      colorType: 'gray',
      text: 'Please snap a photo of the mechanism or defective part so we bring the exact replacement.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: isAdmin ? 'admin' : 'customer',
      senderName: isAdmin ? 'Super Admin (You)' : 'You',
      text,
      timestamp: timeStr,
      hasReadReceipt: false,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await chatApi.sendSupportMessage(ticketData.id, text);
      fetchLiveMessages();
    } catch {
      // optimistic state retained
    }
  };

  const handleAttachFile = () => {
    Alert.alert(
      'Attach Photo',
      'Choose an option to share a photo in support chat',
      [
        {
          text: 'Take Photo',
          onPress: handleCameraCapture,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleGalleryPick,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        await processAndSendImage(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Unable to capture photo.');
    }
  };

  const handleGalleryPick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Gallery access is required to select photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        await processAndSendImage(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Unable to select photo.');
    }
  };

  const processAndSendImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const imageUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : await fileUriToBase64DataUrl(asset.uri);

      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}`;

      const newMsg: ChatMessageItem = {
        id: `msg-${Date.now()}`,
        sender: isAdmin ? 'admin' : 'customer',
        senderName: isAdmin ? 'Super Admin (You)' : 'You',
        text: '',
        timestamp: timeStr,
        mediaAttachment: {
          filename: 'Photo Attachment',
          filesize: 'JPEG',
          imageUri,
        },
        hasReadReceipt: false,
      };

      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      await chatApi.sendSupportMessage(ticketData.id, '', imageUri);
      fetchLiveMessages();
    } catch {
      Alert.alert('Upload Error', 'Failed to send image attachment.');
    }
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
            {isAdmin ? `Support: ${ticketData.customerName}` : 'Support Desk'}
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
          {/* Date Divider */}
          <View style={styles.dateDividerWrapper}>
            <View style={styles.dateDividerPill}>
              <Text style={styles.dateDividerText}>Support Session • Active</Text>
            </View>
          </View>

          {/* Empty state or Chat Messages */}
          {messages.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <AppIcon name="support_agent" size={28} color="#0051D5" />
              </View>
              <Text style={{ ...Typography.h3, color: Colors.onSurface, marginBottom: 6, textAlign: 'center' }}>
                Live Support Chat
              </Text>
              <Text style={{ ...Typography.bodySmall, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 }}>
                Direct real-time communication between customer and support.
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
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

              const isOutgoing = isAdmin
                ? msg.sender === 'admin'
                : msg.sender === 'customer';

              if (!isOutgoing) {
                // Incoming Message (Left Aligned)
                return (
                  <View key={msg.id} style={styles.customerMsgRow}>
                    <View style={styles.customerAvatar}>
                      <Text style={styles.customerAvatarText}>
                        {msg.senderInitials || (isAdmin ? 'CU' : 'SA')}
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
                        <Text style={styles.customerRoleText}>
                          • {msg.senderRole || (isAdmin ? 'Customer' : 'Admin Support')}
                        </Text>
                        <Text style={styles.customerTimestamp}>
                          {msg.timestamp}
                        </Text>
                      </View>

                      <View style={styles.customerBubble}>
                        {!!msg.text && <Text style={styles.customerMsgText}>{msg.text}</Text>}

                        {/* Attached Media Card */}
                        {msg.mediaAttachment && (
                          <TouchableOpacity
                            style={[styles.mediaCard, { marginTop: msg.text ? 8 : 0 }]}
                            onPress={() => {
                              setSelectedImageUri(msg.mediaAttachment!.imageUri);
                              setSelectedImageCaption(msg.mediaAttachment!.filename || 'Attached Photo');
                              setShowImageViewer(true);
                            }}
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

              // Outgoing Messages (Right Aligned)
              return (
                <View key={msg.id} style={styles.adminMsgRow}>
                  <View style={styles.adminMsgMetaRow}>
                    <Text style={styles.adminSenderName}>{msg.senderName}</Text>
                    <Text style={styles.adminTimestamp}>{msg.timestamp}</Text>
                  </View>

                  <View style={styles.adminBubble}>
                    {!!msg.text && <Text style={styles.adminMsgText}>{msg.text}</Text>}

                    {/* Attached Media Card for Outgoing */}
                    {msg.mediaAttachment && (
                      <TouchableOpacity
                        style={[styles.mediaCard, { marginTop: msg.text ? 8 : 0 }]}
                        onPress={() => {
                          setSelectedImageUri(msg.mediaAttachment!.imageUri);
                          setSelectedImageCaption(msg.mediaAttachment!.filename || 'Attached Photo');
                          setShowImageViewer(true);
                        }}
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
            })
          )}
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
          {selectedImageUri ? (
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : null}
          <Text style={styles.imageViewerCaption}>
            {selectedImageCaption}
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
