import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  StyleSheet,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { StackScreenProps } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';
import { usePlayer, usePlayerBattles } from '@hooks/usePlayer';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import LoadingSpinner from '@components/LoadingSpinner';
import ErrorState from '@components/ErrorState';
import StatsCard from './components/StatsCard';
import CardCollection from './components/CardCollection';
import BattleLog from './components/BattleLog';

type Props = StackScreenProps<AppStackParamList, 'PlayerProfile'>;

export default function PlayerProfileScreen({ route, navigation }: Props) {
  const { tag } = route.params;
  const queryClient = useQueryClient();
  const { data: player, isLoading, isError, error, refetch, isFetching } = usePlayer(tag);
  const { data: battles = [] } = usePlayerBattles(tag);

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['player', tag] });
  };

  const onShare = async () => {
    await Share.share({ message: `royalestats://player/${tag}` });
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError || !player) {
    const msg = (error as { response?: { status?: number } })?.response?.status === 404
      ? `Player ${tag} not found.`
      : 'Failed to load player profile.';
    return <ErrorState message={msg} onRetry={refetch} />;
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onShare} style={styles.shareBtn}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <StatsCard player={player} />
        <SeasonSection player={player} />
        <BattleLog battles={battles} />
        <CardCollection cards={player.cards} />
      </ScrollView>
    </View>
  );
}

function SeasonSection({ player }: { player: NonNullable<ReturnType<typeof usePlayer>['data']> }) {
  return (
    <View style={styles.seasonSection}>
      <Text style={styles.sectionHeading}>Season</Text>
      <View style={styles.seasonRow}>
        <SeasonStat label="Current Trophies" value={String(player.currentSeason.trophies)} />
        <SeasonStat label="Season Best" value={String(player.currentSeason.bestTrophies)} />
        {player.currentSeason.rank != null && (
          <SeasonStat label="Rank" value={`#${player.currentSeason.rank}`} />
        )}
      </View>
      <Text style={styles.bestSeasonLabel}>
        All-time best: {player.bestSeason.trophies} 🏆 (Season {player.bestSeason.id})
      </Text>
    </View>
  );
}

function SeasonStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.seasonStat}>
      <Text style={styles.seasonStatValue}>{value}</Text>
      <Text style={styles.seasonStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backText: {
    color: colors.accent,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  shareBtn: { padding: spacing.xs },
  shareText: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  content: { paddingBottom: spacing.xxl },
  seasonSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  sectionHeading: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  seasonRow: { flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.xs },
  seasonStat: { alignItems: 'center' },
  seasonStatValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  seasonStatLabel: { color: colors.text.muted, fontSize: typography.sizes.xs },
  bestSeasonLabel: { color: colors.text.secondary, fontSize: typography.sizes.xs },
});
