import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { ClanMember } from '../../../../shared/types';
import { AppStackParamList } from '@navigation/types';
import { useClan } from '@hooks/useClan';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import LoadingSpinner from '@components/LoadingSpinner';
import ErrorState from '@components/ErrorState';
import TrophyBadge from '@components/TrophyBadge';
import { timeAgo } from '@utils/time-ago';
import { formatNumber } from '@utils/format-number';

type Props = StackScreenProps<AppStackParamList, 'ClanProfile'>;

type SortKey = 'trophies' | 'donations' | 'lastSeen';

const ROLE_ORDER: Record<ClanMember['role'], number> = {
  leader: 0,
  coLeader: 1,
  elder: 2,
  member: 3,
};

export default function ClanProfileScreen({ route, navigation }: Props) {
  const { tag } = route.params;
  const queryClient = useQueryClient();
  const { data: clan, isLoading, isError, refetch, isFetching } = useClan(tag);
  const [sortKey, setSortKey] = useState<SortKey>('trophies');

  const sortedMembers = useMemo(() => {
    if (!clan) return [];
    return [...clan.members].sort((a, b) => {
      if (sortKey === 'trophies') return b.trophies - a.trophies;
      if (sortKey === 'donations') return b.donations - a.donations;
      // lastSeen: most recent first
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });
  }, [clan, sortKey]);

  const onRefresh = () => queryClient.invalidateQueries({ queryKey: ['clan', tag] });

  if (isLoading) return <LoadingSpinner />;

  if (isError || !clan) {
    return (
      <ErrorState
        message={`Clan ${tag} not found.`}
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'‹ Back'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedMembers}
        keyExtractor={(m) => m.tag}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <ClanHeader
            clan={clan}
            sortKey={sortKey}
            onSort={setSortKey}
          />
        }
        renderItem={({ item, index }) => (
          <MemberRow
            member={item}
            rank={index + 1}
            onPress={() => navigation.push('PlayerProfile', { tag: item.tag })}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function ClanHeader({
  clan,
  sortKey,
  onSort,
}: {
  clan: NonNullable<ReturnType<typeof useClan>['data']>;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
}) {
  return (
    <View>
      <View style={styles.clanHeader}>
        <Text style={styles.clanBadge}>🏰</Text>
        <View style={styles.clanInfo}>
          <Text style={styles.clanName}>{clan.name}</Text>
          <Text style={styles.clanTag}>{clan.tag}</Text>
          {clan.description ? (
            <Text style={styles.clanDesc} numberOfLines={2}>{clan.description}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatChip label="Score" value={formatNumber(clan.clanScore)} />
        <StatChip label="War Trophies" value={formatNumber(clan.clanWarTrophies)} />
        <StatChip label="Members" value={`${clan.memberCount}/50`} />
        <StatChip label="Required" value={`${formatNumber(clan.requiredTrophies)} 🏆`} />
      </View>

      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['trophies', 'donations', 'lastSeen'] as SortKey[]).map((k) => (
          <TouchableOpacity
            key={k}
            style={[styles.sortBtn, sortKey === k && styles.sortBtnActive]}
            onPress={() => onSort(k)}
          >
            <Text style={[styles.sortBtnText, sortKey === k && styles.sortBtnTextActive]}>
              {k === 'lastSeen' ? 'Last Seen' : k.charAt(0).toUpperCase() + k.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.memberHeading}>
        <Text style={styles.memberHeadingText}>Members ({clan.memberCount})</Text>
      </View>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function MemberRow({
  member,
  rank,
  onPress,
}: {
  member: ClanMember;
  rank: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.memberRow} onPress={onPress}>
      <Text style={styles.rank}>#{rank}</Text>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{formatRole(member.role)}</Text>
      </View>
      <View style={styles.memberStats}>
        <TrophyBadge trophies={member.trophies} size="sm" />
        <Text style={styles.donations}>↑{formatNumber(member.donations)}</Text>
        <Text style={styles.lastSeen}>{timeAgo(member.lastSeen)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatRole(role: ClanMember['role']): string {
  switch (role) {
    case 'leader': return '👑 Leader';
    case 'coLeader': return '⭐ Co-Leader';
    case 'elder': return '🔹 Elder';
    default: return 'Member';
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  backBtn: { padding: spacing.xs, alignSelf: 'flex-start' },
  backText: {
    color: colors.accent,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  list: { paddingBottom: spacing.xxl },
  clanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  clanBadge: { fontSize: 52 },
  clanInfo: { flex: 1, gap: spacing.xs },
  clanName: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  clanTag: { color: colors.text.muted, fontSize: typography.sizes.sm },
  clanDesc: { color: colors.text.secondary, fontSize: typography.sizes.sm },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  chipValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  chipLabel: { color: colors.text.muted, fontSize: typography.sizes.xs },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sortLabel: { color: colors.text.muted, fontSize: typography.sizes.xs },
  sortBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  sortBtnActive: { backgroundColor: colors.accent },
  sortBtnText: { color: colors.text.muted, fontSize: typography.sizes.xs },
  sortBtnTextActive: {
    color: colors.text.primary,
    fontWeight: typography.weights.semibold,
  },
  memberHeading: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  memberHeadingText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rank: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    width: 28,
    textAlign: 'right',
  },
  memberInfo: { flex: 1, gap: 2 },
  memberName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  memberRole: { color: colors.text.secondary, fontSize: typography.sizes.xs },
  memberStats: { alignItems: 'flex-end', gap: 2 },
  donations: { color: colors.success, fontSize: typography.sizes.xs },
  lastSeen: { color: colors.text.muted, fontSize: typography.sizes.xs },
});
