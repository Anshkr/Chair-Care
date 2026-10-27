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
import { AppIcon } from './AppIcon';
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
          <AppIcon
            name="User"
            size={Math.max(16, Math.round(size * 0.5))}
            color="#FFFFFF"
            strokeWidth={2}
          />
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
