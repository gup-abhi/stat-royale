import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';
import { useSavedPlayersStore } from '@store/savedPlayers.store';
import { useAuthStore } from '@store/auth.store';
import { SavedPlayer } from '../../../../shared/types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';

type Nav = StackNavigationProp<AppStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { accessToken } = useAuthStore();
  const { saved, isLoading, fetch } = useSavedPlayersStore();

  useEffect(() => {
    if (accessToken) {
      fetch();
    }
  }, [accessToken]);

  const onRefresh = () => {
    if (accessToken) fetch();
  };

  const onPressPlayer = (tag: string) => {
    navigation.navigate('PlayerProfile', { tag: `#${tag}` });
  };

  if (!accessToken) {
    return (
      <View style={styles.screen}>
        <View style={styles.loginPrompt}>
          <Text style={styles.promptTitle}>Welcome to RoyaleStats</Text>
          <Text style={styles.promptBody}>
            Sign in to save your favourite players and access them quickly from here.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('Tabs')}
          >
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Players</Text>
      </View>

      {isLoading && saved.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : saved.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🤍</Text>
          <Text style={styles.emptyTitle}>No saved players yet</Text>
          <Text style={styles.emptyBody}>
            Search for a player and tap ❤️ to save them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.playerTag}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => (
            <SavedPlayerCard item={item} onPress={onPressPlayer} />
          )}
        />
      )}
    </View>
  );
}

function SavedPlayerCard({
  item,
  onPress,
}: {
  item: SavedPlayer;
  onPress: (tag: string) => void;
}) {
  const displayName = item.nickname ?? item.playerTag;
  const savedDate = new Date(item.savedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item.playerTag)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>⚔️</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {displayName}
        </Text>
        {item.nickname && (
          <Text style={styles.cardTag}>#{item.playerTag}</Text>
        )}
        <Text style={styles.cardDate}>Saved {savedDate}</Text>
      </View>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  promptTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  promptBody: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  loginBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  loginBtnText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardLeft: { marginRight: spacing.md },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  cardTag: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  cardDate: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  cardChevron: {
    color: colors.text.muted,
    fontSize: typography.sizes.xl,
    marginLeft: spacing.sm,
  },
});
