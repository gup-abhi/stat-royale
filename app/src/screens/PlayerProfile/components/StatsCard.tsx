import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Player } from '../../../../../shared/types';
import { AppStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import TrophyBadge from '@components/TrophyBadge';
import { formatNumber } from '@utils/format-number';

interface Props {
  player: Player;
}

function WinRateRing({ pct }: { pct: number }) {
  const percent = Math.round(Math.min(100, Math.max(0, pct)));
  const ringColor = percent >= 50 ? colors.success : colors.error;
  return (
    <View style={[styles.ring, { borderColor: ringColor }]}>
      <Text style={styles.ringPct}>{percent}%</Text>
      <Text style={styles.ringLabel}>Win</Text>
    </View>
  );
}

export default function StatsCard({ player }: Props) {
  const navigation = useNavigation<StackNavigationProp<AppStackParamList>>();
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name}>{player.name}</Text>
        {player.clan && (
          <TouchableOpacity onPress={() => navigation.push('ClanProfile', { tag: player.clan!.tag })}>
            <Text style={styles.clan}>{player.clan.name}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.trophyRow}>
          <TrophyBadge trophies={player.trophies} />
        </View>
        <Text style={styles.best}>Best: {formatNumber(player.bestTrophies)} 🏆</Text>
        <Text style={styles.arena}>{player.arena.name}</Text>
      </View>
      <View style={styles.right}>
        <WinRateRing pct={player.winRate * 100} />
        <View style={styles.statRow}>
          <StatPill label="Battles" value={formatNumber(player.battleCount)} />
          <StatPill label="3-Crown" value={formatNumber(player.threeCrownWins)} />
        </View>
        <Text style={styles.level}>King Lvl {player.level}</Text>
      </View>
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  left: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  right: { alignItems: 'center', gap: spacing.sm },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  clan: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  trophyRow: { flexDirection: 'row' },
  best: { color: colors.text.secondary, fontSize: typography.sizes.xs },
  arena: { color: colors.text.muted, fontSize: typography.sizes.xs },
  ring: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  ringLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  pill: { alignItems: 'center' },
  pillValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  pillLabel: { color: colors.text.muted, fontSize: typography.sizes.xs },
  level: { color: colors.text.secondary, fontSize: typography.sizes.xs },
});
