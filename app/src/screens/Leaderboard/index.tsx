import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LeaderboardPlayer } from '../../../../shared/types';
import { AppStackParamList } from '@navigation/types';
import { useLeaderboard } from '@hooks/useLeaderboard';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import LoadingSpinner from '@components/LoadingSpinner';
import ErrorState from '@components/ErrorState';
import TrophyBadge from '@components/TrophyBadge';

type NavProp = StackNavigationProp<AppStackParamList>;

// Supercell location IDs for popular regions
const REGIONS: { label: string; id: string }[] = [
  { label: '🌐 Global', id: 'global' },
  { label: '🇺🇸 USA', id: '57000094' },
  { label: '🇧🇷 Brazil', id: '57000049' },
  { label: '🇩🇪 Germany', id: '57000094' },
  { label: '🇫🇷 France', id: '57000064' },
  { label: '🇬🇧 UK', id: '57000034' },
  { label: '🇨🇳 China', id: '57000058' },
  { label: '🇯🇵 Japan', id: '57000077' },
  { label: '🇰🇷 Korea', id: '57000080' },
  { label: '🇷🇺 Russia', id: '57000085' },
  { label: '🇲🇽 Mexico', id: '57000081' },
  { label: '🇮🇳 India', id: '57000071' },
  { label: '🇹🇷 Turkey', id: '57000033' },
  { label: '🇦🇷 Argentina', id: '57000044' },
  { label: '🇨🇦 Canada', id: '57000057' },
];

export default function LeaderboardScreen() {
  const navigation = useNavigation<NavProp>();
  const [location, setLocation] = useState('global');
  const [pickerVisible, setPickerVisible] = useState(false);

  const { data: players = [], isLoading, isError, refetch, isFetching } = useLeaderboard(location);

  const activeRegion = REGIONS.find((r) => r.id === location) ?? REGIONS[0];

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Failed to load leaderboard." onRetry={refetch} />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity style={styles.regionBtn} onPress={() => setPickerVisible(true)}>
          <Text style={styles.regionBtnText}>{activeRegion.label} ▾</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={players}
        keyExtractor={(p) => p.tag}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
        renderItem={({ item }) => (
          <PlayerRow
            player={item}
            onPress={() => navigation.push('PlayerProfile', { tag: item.tag })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No data available.</Text>}
      />

      <RegionPicker
        visible={pickerVisible}
        current={location}
        onSelect={(id) => { setLocation(id); setPickerVisible(false); }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

function PlayerRow({ player, onPress }: { player: LeaderboardPlayer; onPress: () => void }) {
  const isTop3 = player.rank <= 3;
  const rankEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : null;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rankBox}>
        {rankEmoji
          ? <Text style={styles.rankEmoji}>{rankEmoji}</Text>
          : <Text style={[styles.rank, isTop3 && styles.rankTop]}>{player.rank}</Text>}
      </View>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{player.name}</Text>
        {player.clan && (
          <Text style={styles.clanName}>{player.clan.name}</Text>
        )}
        <Text style={styles.arena}>{player.arena.name}</Text>
      </View>
      <TrophyBadge trophies={player.trophies} size="sm" />
    </TouchableOpacity>
  );
}

function RegionPicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.picker}>
          <Text style={styles.pickerTitle}>Select Region</Text>
          <ScrollView>
            {REGIONS.map((r) => (
              <TouchableOpacity
                key={r.id + r.label}
                style={[styles.pickerRow, r.id === current && styles.pickerRowActive]}
                onPress={() => onSelect(r.id)}
              >
                <Text style={[styles.pickerRowText, r.id === current && styles.pickerRowTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
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
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  regionBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionBtnText: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  list: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  rankBox: { width: 36, alignItems: 'center' },
  rankEmoji: { fontSize: typography.sizes.xl },
  rank: {
    color: colors.text.muted,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  rankTop: { color: colors.warning, fontWeight: typography.weights.bold },
  playerInfo: { flex: 1, gap: 2 },
  playerName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  clanName: { color: colors.accent, fontSize: typography.sizes.xs },
  arena: { color: colors.text.muted, fontSize: typography.sizes.xs },
  empty: {
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: typography.sizes.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  picker: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: '60%',
  },
  pickerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  pickerRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerRowActive: { borderBottomColor: colors.accent },
  pickerRowText: { color: colors.text.secondary, fontSize: typography.sizes.md },
  pickerRowTextActive: {
    color: colors.accent,
    fontWeight: typography.weights.bold,
  },
});
