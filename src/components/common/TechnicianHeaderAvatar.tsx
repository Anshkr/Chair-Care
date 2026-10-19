import React, { useMemo } from 'react';
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

interface TechnicianHeaderAvatarProps {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  showBadge?: boolean;
  accessibilityLabel?: string;
  borderRadius?: number;
}

export const TechnicianHeaderAvatar: React.FC<TechnicianHeaderAvatarProps> = ({
  onPress,
  size = 38,
  style,
  showBadge = false,
  accessibilityLabel = 'Technician Profile',
  borderRadius,
}) => {
  const { currentUser } = useAuth();
  const navigation = useNavigation<any>();

  const techInitials = useMemo(() => {
    if (currentUser?.name) {
      const parts = currentUser.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (parts.length === 1 && parts[0].length > 0) {
        return parts[0][0].toUpperCase();
      }
    }
    return 'RK';
  }, [currentUser?.name]);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    try {
      if (typeof navigation.jumpTo === 'function') {
        navigation.jumpTo('TechProfileTab');
      } else if (navigation?.navigate) {
        navigation.navigate('TechProfileTab');
      }
    } catch {
      try {
        navigation.navigate('TechnicianMain', { screen: 'TechProfileTab' });
      } catch {
        // fallback
      }
    }
  };

  const avatarUri = currentUser?.avatarUrl;
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
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatarImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.fallbackCircle}>
            <Text
              style={[
                styles.initialText,
                { fontSize: Math.max(11, Math.round(size * 0.38)) },
              ]}
            >
              {techInitials}
            </Text>
          </View>
        )}
      </View>

      {showBadge && (
        <View
          style={[
            styles.checkBadge,
            {
              width: Math.max(14, Math.round(size * 0.34)),
              height: Math.max(14, Math.round(size * 0.34)),
              borderRadius: Math.max(14, Math.round(size * 0.34)) / 2,
              bottom: -1,
              right: -1,
            },
          ]}
        >
          <AppIcon
            name="Check"
            size={Math.max(8, Math.round(size * 0.22))}
            color="#FFFFFF"
            strokeWidth={3}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#0F172A',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  fallbackCircle: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialText: {
    ...Typography.labelMono,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkBadge: {
    position: 'absolute',
    backgroundColor: Colors.tertiaryEmerald,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
