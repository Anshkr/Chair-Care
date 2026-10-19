import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';
import { Typography } from '../../constants/typography';

interface MonoMetricProps {
  label?: string;
  value: string | number;
  unit?: string;
  style?: StyleProp<ViewStyle>;
  highlight?: boolean;
}

export const MonoMetric: React.FC<MonoMetricProps> = ({
  label,
  value,
  unit,
  style,
  highlight = false,
}) => {
  return (
    <View style={[styles.container, highlight && styles.highlightContainer, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.valueRow}>
        <Text style={[styles.value, highlight && styles.highlightValue]}>
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.outlineHairline,
    alignSelf: 'flex-start',
  },
  highlightContainer: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  label: {
    ...Typography.labelMono,
    color: Colors.onSurfaceVariant,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    ...Typography.labelMono,
    fontWeight: '700',
    color: Colors.onSurface,
    fontSize: 13,
  },
  highlightValue: {
    color: Colors.tertiaryFixed,
  },
  unit: {
    ...Typography.labelMono,
    fontSize: 10,
    color: Colors.outline,
  },
});
