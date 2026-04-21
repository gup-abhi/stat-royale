import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Card, CardRarity, CardType } from '../../../../shared/types';
import { useCards } from '@hooks/useCards';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import CardImage from '@components/CardImage';
import LoadingSpinner from '@components/LoadingSpinner';
import ErrorState from '@components/ErrorState';

const RARITIES: CardRarity[] = ['common', 'rare', 'epic', 'legendary', 'champion'];
const TYPES: CardType[] = ['troop', 'spell', 'building'];
const ELIXIR_COSTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const RARITY_COLOR: Record<CardRarity, string> = {
  common: '#aaaaaa',
  rare: '#f59e0b',
  epic: '#a855f7',
  legendary: '#f97316',
  champion: '#ef4444',
};

export default function CardDatabaseScreen() {
  const { data: cards = [], isLoading, isError, refetch } = useCards();
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<CardRarity | null>(null);
  const [type, setType] = useState<CardType | null>(null);
  const [elixir, setElixir] = useState<number | null>(null);
  const [selected, setSelected] = useState<Card | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cards.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (rarity && c.rarity !== rarity) return false;
      if (type && c.cardType !== type) return false;
      if (elixir !== null && c.elixirCost !== elixir) return false;
      return true;
    });
  }, [cards, search, rarity, type, elixir]);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Failed to load cards." onRetry={refetch} />;

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Cards ({filtered.length})</Text>

      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search cards…"
        placeholderTextColor={colors.text.muted}
        autoCorrect={false}
      />

      {/* Rarity filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <FilterChip label="All" active={rarity === null} onPress={() => setRarity(null)} />
        {RARITIES.map((r) => (
          <FilterChip
            key={r}
            label={r.charAt(0).toUpperCase() + r.slice(1)}
            active={rarity === r}
            onPress={() => setRarity(rarity === r ? null : r)}
            color={RARITY_COLOR[r]}
          />
        ))}
      </ScrollView>

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <FilterChip label="All types" active={type === null} onPress={() => setType(null)} />
        {TYPES.map((t) => (
          <FilterChip
            key={t}
            label={t.charAt(0).toUpperCase() + t.slice(1)}
            active={type === t}
            onPress={() => setType(type === t ? null : t)}
          />
        ))}
      </ScrollView>

      {/* Elixir filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <FilterChip label="Any ♦" active={elixir === null} onPress={() => setElixir(null)} />
        {ELIXIR_COSTS.map((e) => (
          <FilterChip
            key={e}
            label={`${e}♦`}
            active={elixir === e}
            onPress={() => setElixir(elixir === e ? null : e)}
            color={colors.accent}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(c) => String(c.id)}
        numColumns={5}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cardTile} onPress={() => setSelected(item)}>
            <CardImage iconUrl={item.iconUrl} size={56} />
            <Text style={styles.cardElixir}>{item.elixirCost ?? '?'}♦</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={
          <Text style={styles.empty}>No cards match your filters.</Text>
        }
      />

      {selected && (
        <CardDetailModal card={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: color ?? colors.accent }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function CardDetailModal({ card, onClose }: { card: Card; onClose: () => void }) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal}>
          <View style={styles.modalHeader}>
            <CardImage iconUrl={card.iconUrl} size={72} />
            <View style={styles.modalTitleBlock}>
              <Text style={styles.modalName}>{card.name}</Text>
              <Text style={[styles.modalRarity, { color: RARITY_COLOR[card.rarity] }]}>
                {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.modalStats}>
            <StatRow label="Type" value={card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1)} />
            <StatRow label="Elixir Cost" value={card.elixirCost != null ? `${card.elixirCost} ♦` : '—'} />
            <StatRow label="Max Level" value={String(card.maxLevel)} />
            <StatRow label="Arena Unlock" value={card.arena > 0 ? `Arena ${card.arena}` : 'Starter'} />
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: { color: colors.text.muted, fontSize: typography.sizes.xs },
  chipTextActive: { color: colors.text.primary, fontWeight: typography.weights.semibold },
  grid: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl },
  cardTile: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xs,
    gap: 2,
  },
  cardElixir: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  empty: {
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xxl,
    fontSize: typography.sizes.md,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '85%',
    gap: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  modalTitleBlock: { flex: 1, gap: spacing.xs },
  modalName: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  modalRarity: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  modalStats: { gap: spacing.xs },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statLabel: { color: colors.text.secondary, fontSize: typography.sizes.sm },
  statValue: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  closeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
});
