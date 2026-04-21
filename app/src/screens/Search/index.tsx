import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { ClanSearchResult } from '../../../../shared/types';
import { AppStackParamList } from '@navigation/types';
import { searchClansApi } from '@api/clans.api';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import { formatTag } from '@utils/format-tag';
import { formatNumber } from '@utils/format-number';

type Tab = 'Players' | 'Clans';
type NavProp = StackNavigationProp<AppStackParamList>;

export default function SearchScreen() {
  const [tab, setTab] = useState<Tab>('Players');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [tagError, setTagError] = useState('');
  const navigation = useNavigation<NavProp>();

  const handleChangeText = (text: string) => {
    setInput(text);
    setTagError('');
    if (tab === 'Clans' && query) setQuery('');
  };

  const handleSubmit = () => {
    if (tab === 'Players') {
      const trimmed = input.trim();
      if (!trimmed) return;
      navigation.push('PlayerProfile', { tag: trimmed });
      setInput('');
    } else {
      const trimmed = input.trim();
      if (trimmed.length < 3) {
        setTagError('Enter at least 3 characters to search.');
        return;
      }
      setQuery(trimmed);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Search</Text>

      <View style={styles.tabs}>
        {(['Players', 'Clans'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => { setTab(t); setInput(''); setQuery(''); setTagError(''); }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleChangeText}
          onSubmitEditing={handleSubmit}
          placeholder={tab === 'Players' ? 'Enter player tag (e.g. #ABC123)' : 'Enter clan name…'}
          placeholderTextColor={colors.text.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSubmit}>
          <Text style={styles.searchBtnText}>
            {tab === 'Players' ? 'Go' : 'Search'}
          </Text>
        </TouchableOpacity>
      </View>

      {tagError ? <Text style={styles.error}>{tagError}</Text> : null}

      {tab === 'Players' ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>Enter a player tag to view their profile.</Text>
        </View>
      ) : (
        <ClanResults query={query} navigation={navigation} />
      )}
    </KeyboardAvoidingView>
  );
}

function ClanResults({
  query,
  navigation,
}: {
  query: string;
  navigation: NavProp;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['clans', 'search', query],
    queryFn: () => searchClansApi(query),
    enabled: query.length >= 3,
    staleTime: 60 * 1000,
  });

  if (!query) return null;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (isError) {
    return <Text style={styles.error}>Search failed. Try again.</Text>;
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>No clans found for "{query}".</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(c) => c.tag}
      renderItem={({ item }) => (
        <ClanRow
          clan={item}
          onPress={() => navigation.push('ClanProfile', { tag: item.tag })}
        />
      )}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.results}
    />
  );
}

function ClanRow({ clan, onPress }: { clan: ClanSearchResult; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.clanRow} onPress={onPress}>
      <Text style={styles.clanBadge}>🏰</Text>
      <View style={styles.clanInfo}>
        <Text style={styles.clanName}>{clan.name}</Text>
        <Text style={styles.clanTag}>{clan.tag}</Text>
        {clan.location && (
          <Text style={styles.clanLocation}>{clan.location.name}</Text>
        )}
      </View>
      <View style={styles.clanStats}>
        <Text style={styles.clanScore}>{formatNumber(clan.clanScore)} 🏆</Text>
        <Text style={styles.clanMembers}>{clan.memberCount}/50</Text>
        <Text style={styles.clanRequired}>≥{formatNumber(clan.requiredTrophies)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.text.muted, fontWeight: typography.weights.medium },
  tabTextActive: { color: colors.text.primary, fontWeight: typography.weights.bold },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: colors.text.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.md,
  },
  error: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  hint: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  hintText: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  empty: {
    color: colors.text.muted,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  results: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  clanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  clanBadge: { fontSize: 32 },
  clanInfo: { flex: 1, gap: 2 },
  clanName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  clanTag: { color: colors.text.muted, fontSize: typography.sizes.xs },
  clanLocation: { color: colors.text.secondary, fontSize: typography.sizes.xs },
  clanStats: { alignItems: 'flex-end', gap: 2 },
  clanScore: {
    color: colors.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  clanMembers: { color: colors.text.secondary, fontSize: typography.sizes.xs },
  clanRequired: { color: colors.text.muted, fontSize: typography.sizes.xs },
});
