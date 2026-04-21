import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { PlayerCard } from '../../../../../shared/types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import CardImage from '@components/CardImage';

interface Props {
  cards: PlayerCard[];
}

const CARD_SIZE = 52;
const COLS = 6;

export default function CardCollection({ cards }: Props) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? cards : cards.slice(0, COLS * 4);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Cards ({cards.length})</Text>
      <View style={styles.grid}>
        {visible.map((card) => (
          <CardTile key={card.id} card={card} />
        ))}
      </View>
      {cards.length > COLS * 4 && (
        <TouchableOpacity style={styles.toggle} onPress={() => setExpanded(!expanded)}>
          <Text style={styles.toggleText}>
            {expanded ? 'Show less' : `Show all ${cards.length} cards`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CardTile({ card }: { card: PlayerCard }) {
  const atMax = card.level >= card.maxLevel;
  return (
    <View style={styles.tile}>
      <CardImage iconUrl={card.iconUrl} size={CARD_SIZE} />
      <View style={[styles.levelBadge, atMax && styles.levelBadgeMax]}>
        <Text style={styles.levelText}>{card.level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  heading: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tile: {
    position: 'relative',
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  levelBadgeMax: { backgroundColor: colors.warning },
  levelText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  toggle: {
    marginTop: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  toggleText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
