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
import { useAuth } from '../../context/AuthContext';
import { Typography } from '../../constants/typography';

interface CustomerHeaderAvatarProps {
  onPress?: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const CustomerHeaderAvatar: React.FC<CustomerHeaderAvatarProps> = ({
  onPress,
  size = 38,
  style,
  accessibilityLabel = 'Customer Profile',
}) => {
  const { currentUser } = useAuth();

  const userInitial = useMemo(() => {
    if (currentUser?.name) {
      const parts = currentUser.name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      if (parts.length === 1 && parts[0].length > 0) {
        return parts[0][0].toUpperCase();
      }
    }
    return 'U';
  }, [currentUser?.name]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel}
    >
      {currentUser?.avatarUrl ? (
        <Image
          source={{ uri: currentUser.avatarUrl }}
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
            {userInitial}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
});
