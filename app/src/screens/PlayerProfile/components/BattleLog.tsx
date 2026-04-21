import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Battle, BattleType } from '../../../../../shared/types';
import { AppStackParamList } from '@navigation/types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import CardImage from '@components/CardImage';
import { timeAgo } from '@utils/time-ago';

type NavProp = StackNavigationProp<AppStackParamList, 'PlayerProfile'>;

type FilterTab = 'All' | 'Ladder' | 'Challenge' | 'War';

const FILTER_MAP: Record<FilterTab, BattleType[] | null> = {
  All: null,
  Ladder: ['pathOfLegend'],
  Challenge: ['challenge'],
  War: ['clanWar'],
};

interface Props {
  battles: Battle[];
}

export default function BattleLog({ battles }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const navigation = useNavigation<NavProp>();

  const filtered =
    FILTER_MAP[activeTab] === null
      ? battles
      : battles.filter((b) => FILTER_MAP[activeTab]!.includes(b.battleType));

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Battle Log</Text>

      <View style={styles.tabs}>
        {(Object.keys(FILTER_MAP) as FilterTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>No battles found.</Text>
      ) : (
        filtered.map((battle) => (
          <BattleRow
            key={battle.id}
            battle={battle}
            onOpponentPress={() =>
              battle.opponent.tag
                ? navigation.push('PlayerProfile', { tag: battle.opponent.tag })
                : undefined
            }
          />
        ))
      )}
    </View>
  );
}

function BattleRow({
  battle,
  onOpponentPress,
}: {
  battle: Battle;
  onOpponentPress: () => void;
}) {
  const won = battle.playerWon;
  return (
    <View style={[styles.row, won ? styles.rowWin : styles.rowLoss]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.result, won ? styles.win : styles.loss]}>
          {won ? 'WIN' : 'LOSS'}
        </Text>
        <Text style={styles.crowns}>
          {battle.playerCrowns}–{battle.opponentCrowns} 👑
        </Text>
        <Text style={styles.time}>{timeAgo(battle.battleTime)}</Text>
        <Text style={styles.battleType}>{formatType(battle.battleType)}</Text>
      </View>

      <View style={styles.decks}>
        <DeckStrip cards={battle.playerDeck} />
        <Text style={styles.vs}>vs</Text>
        <TouchableOpacity onPress={onOpponentPress} disabled={!battle.opponent.tag}>
          <Text style={styles.opponentName}>{battle.opponent.name}</Text>
          <DeckStrip cards={battle.opponent.deck} />
        </TouchableOpacity>
      </View>

      {battle.trophyChange != null && (
        <Text style={[styles.trophyChange, battle.trophyChange >= 0 ? styles.win : styles.loss]}>
          {battle.trophyChange >= 0 ? '+' : ''}{battle.trophyChange}
        </Text>
      )}
    </View>
  );
}

function DeckStrip({ cards }: { cards: Battle['playerDeck'] }) {
  return (
    <View style={styles.deckStrip}>
      {cards.slice(0, 8).map((c) => (
        <CardImage key={c.id} iconUrl={c.iconUrl} size={28} />
      ))}
    </View>
  );
}

function formatType(type: BattleType): string {
  switch (type) {
    case 'pathOfLegend': return 'Ladder';
    case 'clanWar': return 'Clan War';
    case 'challenge': return 'Challenge';
    case 'friendly': return 'Friendly';
    default: return 'Battle';
  }
}

const styles = StyleSheet.create({
  section: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  heading: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.text.muted, fontSize: typography.sizes.xs },
  tabTextActive: { color: colors.text.primary, fontWeight: typography.weights.semibold },
  empty: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 4,
  },
  rowWin: { borderLeftColor: colors.success },
  rowLoss: { borderLeftColor: colors.error },
  rowLeft: { width: 60, marginRight: spacing.sm },
  result: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
  win: { color: colors.success },
  loss: { color: colors.error },
  crowns: { color: colors.text.primary, fontSize: typography.sizes.xs, marginTop: 2 },
  time: { color: colors.text.muted, fontSize: typography.sizes.xs, marginTop: 2 },
  battleType: { color: colors.text.muted, fontSize: typography.sizes.xs },
  decks: { flex: 1, gap: spacing.xs },
  vs: { color: colors.text.muted, fontSize: typography.sizes.xs, textAlign: 'center' },
  opponentName: { color: colors.accent, fontSize: typography.sizes.xs, marginBottom: 2 },
  deckStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  trophyChange: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.xs,
  },
});
