import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { AppTabParamList } from './types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

// Placeholder screens — replaced in MVP-021+
function Placeholder({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontSize: typography.sizes.xs },
      }}
    >
      <Tab.Screen name="Home" children={() => <Placeholder name="Home" />} />
      <Tab.Screen name="Search" children={() => <Placeholder name="Search" />} />
      <Tab.Screen name="CardDatabase" children={() => <Placeholder name="Cards" />} />
      <Tab.Screen name="Leaderboard" children={() => <Placeholder name="Leaderboard" />} />
      <Tab.Screen name="Settings" children={() => <Placeholder name="Settings" />} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  text: { color: colors.text.secondary, fontSize: typography.sizes.lg },
});
