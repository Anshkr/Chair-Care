import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { AppIcon } from './AppIcon';
import { Colors } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface AdminHeaderAvatarProps {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  showBadge?: boolean;
  accessibilityLabel?: string;
  borderRadius?: number;
}

const DEFAULT_ADMIN_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

export const AdminHeaderAvatar: React.FC<AdminHeaderAvatarProps> = ({
  onPress,
  size = 34,
  style,
  showBadge = true,
  accessibilityLabel = 'Super Admin Profile',
  borderRadius,
}) => {
  const { currentUser } = useAuth();
  const navigation = useNavigation<any>();
  const [imageError, setImageError] = useState(false);

  const adminInitials = useMemo(() => {
    if (currentUser?.name) {
      const parts = currentUser.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (parts.length === 1 && parts[0].length > 0) {
        return parts[0][0].toUpperCase();
      }
    }
    return 'SA';
  }, [currentUser?.name]);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    try {
      if (navigation?.navigate) {
        navigation.navigate('AdminProfileSystemStatus');
      }
    } catch {
      try {
        navigation.navigate('AdminSettingsTab');
      } catch {
        // fallback
      }
    }
  };

  const avatarUri = currentUser?.avatarUrl || DEFAULT_ADMIN_AVATAR;
  const computedRadius = borderRadius !== undefined ? borderRadius : size / 2;

  return (
    <TouchableOpacity
      style={[
        styles.touchable,
        {
          width: size,
          height: size,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: computedRadius,
          },
        ]}
      >
        {avatarUri && !imageError ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImg}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.fallbackCircle}>
            <Text
              style={[
                styles.initialText,
                { fontSize: Math.max(11, Math.round(size * 0.38)) },
              ]}
            >
              {adminInitials}
            </Text>
          </View>
        )}
      </View>

      {showBadge && (
        <View
          style={[
            styles.statusDot,
            {
              width: Math.max(8, Math.round(size * 0.26)),
              height: Math.max(8, Math.round(size * 0.26)),
              borderRadius: Math.max(8, Math.round(size * 0.26)) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    backgroundColor: '#1E293B',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  fallbackCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#134699',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    ...Typography.labelMono,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    backgroundColor: '#10B981', // Emerald active badge
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
