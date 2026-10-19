import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { FadeIn } from './FadeIn';
import { AnimationDuration } from './animationConfig';

export interface StaggeredListProps {
  children: React.ReactNode[];
  baseDelay?: number;
  stepDelay?: number;
  maxStaggerIndex?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
}

/**
 * Orchestrates subtle staggered entrances for list cards, table rows, and grids.
 * Example: 0ms, 45ms, 90ms, 135ms...
 */
export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  baseDelay = 0,
  stepDelay = 45,
  maxStaggerIndex = 8,
  distance = 10,
  style,
  itemStyle,
}) => {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        const effectiveIndex = Math.min(index, maxStaggerIndex);
        const delay = baseDelay + effectiveIndex * stepDelay;

        return (
          <FadeIn
            key={index}
            delay={delay}
            distance={distance}
            duration={AnimationDuration.normal}
            style={itemStyle}
          >
            {child}
          </FadeIn>
        );
      })}
    </View>
  );
};
