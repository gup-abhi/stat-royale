import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import { formatNumber } from '@utils/format-number';

interface Props {
  trophies: number;
  size?: 'sm' | 'md';
}

export default function TrophyBadge({ trophies, size = 'md' }: Props) {
  const isSmall = size === 'sm';
  return (
    <View style={styles.row}>
      <Text style={isSmall ? styles.iconSm : styles.icon}>🏆</Text>
      <Text style={[styles.value, isSmall && styles.valueSm]}>
        {formatNumber(trophies)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: { fontSize: typography.sizes.lg },
  iconSm: { fontSize: typography.sizes.sm },
  value: {
    color: colors.warning,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  valueSm: { fontSize: typography.sizes.sm },
});
