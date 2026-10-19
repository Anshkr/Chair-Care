import React from 'react';
import { Image, ImageStyle, StyleProp, View, StyleSheet, ViewStyle } from 'react-native';

interface BrandLogoProps {
  size?: number;
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 28,
  rounded = true,
  style,
  containerStyle,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 6,
        },
        containerStyle,
      ]}
    >
      <Image
        source={require('../../../assets/chaircare-logo.png')}
        style={[
          {
            width: size,
            height: size,
            borderRadius: rounded ? size / 2 : 6,
          },
          style,
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
