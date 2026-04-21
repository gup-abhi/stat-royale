import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

interface Props {
  tag: string;
}

export default function PlayerTag({ tag }: Props) {
  return <Text style={styles.tag}>{tag.startsWith('#') ? tag : `#${tag}`}</Text>;
}

const styles = StyleSheet.create({
  tag: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
