import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon } from './AppIcon';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Typography } from '../../constants/typography';
import { fileUriToBase64DataUrl } from '../../utils/fileUpload';

export interface CapturedPhoto {
  id: string;
  uri: string;
  tag?: string;
  label?: string;
  timestamp?: string;
  notes?: string;
}

interface PhotoCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoCaptured: (photo: CapturedPhoto) => void;
  tags?: string[];
  defaultTag?: string;
  title?: string;
  subtitle?: string;
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  visible,
  onClose,
  onPhotoCaptured,
  tags = [
    'Pre-Repair Inspection',
    'Wear Evidence',
    'Defective Part',
    'Component Spec',
    'Completed Assembly',
  ],
  defaultTag = 'Pre-Repair Inspection',
  title = 'Add Photo Evidence',
  subtitle = 'Capture live photo with camera or choose from gallery.',
}) => {
  const [selectedTag, setSelectedTag] = useState(defaultTag);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isWebCameraOpen, setIsWebCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Web camera refs
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!visible) {
      stopWebCamera();
      setIsWebCameraOpen(false);
      setCameraError(null);
    }
  }, [visible]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopWebCamera();
    };
  }, []);

  const stopWebCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      streamRef.current = null;
    }
    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }
  };

  const startWebCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setIsWebCameraOpen(true);
    setCameraError(null);

    // Stop existing stream first
    stopWebCamera();

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Mount or attach video element to DOM container
      if (videoContainerRef.current) {
        if (!videoElementRef.current) {
          const video = document.createElement('video');
          video.autoplay = true;
          video.playsInline = true;
          video.muted = true;
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.borderRadius = '16px';
          videoContainerRef.current.innerHTML = '';
          videoContainerRef.current.appendChild(video);
          videoElementRef.current = video;
        }
        videoElementRef.current.srcObject = stream;
        await videoElementRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Web live camera error:', err);
      setCameraError('Unable to access live webcam. Please ensure camera permission is granted or upload from gallery.');
    }
  };

  const handleCaptureWebSnapshot = () => {
    if (!videoElementRef.current) return;

    try {
      const video = videoElementRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // If mirrored front camera, flip horizontally
      if (cameraFacing === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg', 0.88);

      stopWebCamera();
      setIsWebCameraOpen(false);

      const captured: CapturedPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        uri: dataUri,
        tag: selectedTag,
        label: selectedTag,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      onPhotoCaptured(captured);
      onClose();
    } catch (snapErr: any) {
      console.error('Failed to capture snapshot:', snapErr);
      setCameraError('Could not capture frame. Please try again or choose from gallery.');
    }
  };

  const handleSwitchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startWebCamera(nextFacing);
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      startWebCamera('environment');
      return;
    }

    try {
      setIsCapturing(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Denied',
          'Camera access is required to capture photos. Please grant permission in device settings.'
        );
        setIsCapturing(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        let dataUri = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
        if (!dataUri.startsWith('data:') && asset.uri) {
          dataUri = await fileUriToBase64DataUrl(asset.uri, mime);
        }

        const captured: CapturedPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          uri: dataUri,
          tag: selectedTag,
          label: selectedTag,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        onPhotoCaptured(captured);
        onClose();
      }
    } catch (err: any) {
      console.warn('Native camera error:', err);
      Alert.alert('Camera Error', 'Could not access device camera. Please choose from gallery.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      setIsCapturing(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Storage permission is required to choose photos.');
        setIsCapturing(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mime = asset.mimeType || 'image/jpeg';
        let dataUri = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
        if (!dataUri.startsWith('data:') && asset.uri) {
          dataUri = await fileUriToBase64DataUrl(asset.uri, mime);
        }

        const captured: CapturedPhoto = {
          id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          uri: dataUri,
          tag: selectedTag,
          label: selectedTag,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        onPhotoCaptured(captured);
        onClose();
      }
    } catch (err: any) {
      console.warn('Gallery pick error:', err);
      Alert.alert('Gallery Error', 'Could not select photo from gallery.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        stopWebCamera();
        onClose();
      }}
    >
      <View style={styles.modalBackdrop}>
        {/* Web Live Camera Viewfinder */}
        {isWebCameraOpen ? (
          <View style={styles.cameraViewfinderCard}>
            <View style={styles.viewfinderHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.viewfinderTitle}>Live Camera Viewfinder</Text>
                <Text style={styles.viewfinderSub}>Frame the chair component and tap capture</Text>
              </View>
              <TouchableOpacity
                style={styles.viewfinderCloseBtn}
                onPress={() => {
                  stopWebCamera();
                  setIsWebCameraOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.viewfinderCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Video Canvas Container */}
            <View style={styles.videoStreamWrapper}>
              {cameraError ? (
                <View style={styles.cameraErrorBox}>
                  <AppIcon name="AlertCircle" size={28} color="#DC2626" />
                  <Text style={styles.cameraErrorText}>{cameraError}</Text>
                  <TouchableOpacity
                    style={styles.fallbackGalleryBtn}
                    onPress={handleChooseFromGallery}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.fallbackGalleryText}>Choose from Gallery Instead</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <div
                  ref={videoContainerRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#020617',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                />
              )}

              {/* Viewfinder Target Reticle */}
              {!cameraError && (
                <View style={styles.reticleOverlay} pointerEvents="none">
                  <View style={styles.reticleCornerTL} />
                  <View style={styles.reticleCornerTR} />
                  <View style={styles.reticleCornerBL} />
                  <View style={styles.reticleCornerBR} />
                </View>
              )}
            </View>

            {/* Viewfinder Bottom Controls */}
            {!cameraError && (
              <View style={styles.viewfinderControlsRow}>
                <TouchableOpacity
                  style={styles.switchCamBtn}
                  onPress={handleSwitchCameraFacing}
                  activeOpacity={0.8}
                  accessibilityLabel="Switch Camera"
                >
                  <AppIcon name="RotateCw" size={20} color="#FFFFFF" />
                  <Text style={styles.switchCamText}>Flip</Text>
                </TouchableOpacity>

                {/* Big Round Shutter Button */}
                <TouchableOpacity
                  style={styles.shutterBtnOuter}
                  onPress={handleCaptureWebSnapshot}
                  activeOpacity={0.7}
                >
                  <View style={styles.shutterBtnInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.galleryShortcutBtn}
                  onPress={() => {
                    stopWebCamera();
                    setIsWebCameraOpen(false);
                    handleChooseFromGallery();
                  }}
                  activeOpacity={0.8}
                >
                  <AppIcon name="Folder" size={20} color="#FFFFFF" />
                  <Text style={styles.switchCamText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          /* Standard Action Picker Card */
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <View style={styles.iconPod}>
                <AppIcon name="Camera" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.pickerTitle}>{title}</Text>
              <Text style={styles.pickerSubtitle}>{subtitle}</Text>
            </View>

            {/* Category Tag Pills */}
            <Text style={styles.tagLabel}>CATEGORY / EVIDENCE TAG</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScrollView}
              contentContainerStyle={styles.tagsContainer}
            >
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPill,
                    selectedTag === tag && styles.tagPillActive,
                  ]}
                  onPress={() => setSelectedTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tagText,
                      selectedTag === tag && styles.tagTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {isCapturing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Opening photo interface...</Text>
              </View>
            ) : (
              <View style={styles.actionButtonsCol}>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleTakePhoto}
                  activeOpacity={0.85}
                >
                  <AppIcon name="Camera" size={20} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>Take Photo with Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={handleChooseFromGallery}
                  activeOpacity={0.85}
                >
                  <AppIcon name="Folder" size={20} color={Colors.primary} />
                  <Text style={styles.btnSecondaryText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                stopWebCamera();
                onClose();
              }}
              disabled={isCapturing}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    ...Shadows.level3,
  },
  pickerHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconPod: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  pickerTitle: {
    ...Typography.titleLg,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.onSurface,
  },
  pickerSubtitle: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
  },
  tagLabel: {
    ...Typography.labelMono,
    fontSize: 10,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagsScrollView: {
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    gap: 6,
    paddingVertical: 2,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
  },
  tagPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tagText: {
    ...Typography.bodySm,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  tagTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionButtonsCol: {
    gap: 10,
    marginBottom: Spacing.md,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.level1,
  },
  btnPrimaryText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.surfaceContainerHigh,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  btnSecondaryText: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...Typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },

  // Live Web Camera Viewfinder Styles
  cameraViewfinderCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...Shadows.level3,
  },
  viewfinderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewfinderTitle: {
    ...Typography.titleLg,
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewfinderSub: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  viewfinderCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderCloseIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  videoStreamWrapper: {
    width: '100%',
    height: 320,
    backgroundColor: '#020617',
    position: 'relative',
  },
  cameraErrorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: 12,
  },
  cameraErrorText: {
    ...Typography.bodySm,
    fontSize: 12,
    color: '#F87171',
    textAlign: 'center',
  },
  fallbackGalleryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  fallbackGalleryText: {
    ...Typography.bodySm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reticleOverlay: {
    position: 'absolute',
    top: 30,
    bottom: 30,
    left: 30,
    right: 30,
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  viewfinderControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    backgroundColor: '#0F172A',
  },
  shutterBtnOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  shutterBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
  },
  switchCamBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 60,
  },
  switchCamText: {
    ...Typography.labelMono,
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  galleryShortcutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 60,
  },
});
