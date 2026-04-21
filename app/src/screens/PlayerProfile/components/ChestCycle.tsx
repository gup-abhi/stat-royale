import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { UpcomingChest } from '../../../../../shared/types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';

const CHEST_EMOJI: Record<string, string> = {
  'Silver Chest': '🥈',
  'Golden Chest': '🥇',
  'Giant Chest': '📦',
  'Magical Chest': '✨',
  'Epic Chest': '💜',
  'Legendary Chest': '🌟',
  'Mega Lightning Chest': '⚡',
  'Crown Chest': '👑',
  'Clan War Chest': '⚔️',
};

function chestEmoji(name: string): string {
  return CHEST_EMOJI[name] ?? '📦';
}

interface Props {
  chests: UpcomingChest[];
}

export default function ChestCycle({ chests }: Props) {
  const visible = chests.slice(0, 12);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Upcoming Chests</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {visible.map((chest) => (
          <View key={chest.index} style={styles.tile}>
            <Text style={styles.emoji}>{chestEmoji(chest.name)}</Text>
            <Text style={styles.name} numberOfLines={2}>{chest.name.replace(' Chest', '')}</Text>
            <Text style={styles.position}>+{chest.index}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.md },
  heading: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.md,
  },
  row: { paddingHorizontal: spacing.md, gap: spacing.sm },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    width: 64,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emoji: { fontSize: 28 },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
  position: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
