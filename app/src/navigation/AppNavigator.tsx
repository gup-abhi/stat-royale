import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { AppTabParamList, AppStackParamList } from './types';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import PlayerProfileScreen from '@screens/PlayerProfile';
import ClanProfileScreen from '@screens/ClanProfile';
import SearchScreen from '@screens/Search';
import CardDatabaseScreen from '@screens/CardDatabase';

function Placeholder({ name }: { name: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.text}>{name}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator<AppTabParamList>();

function AppTabs() {
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
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="CardDatabase" component={CardDatabaseScreen} />
      <Tab.Screen name="Leaderboard" children={() => <Placeholder name="Leaderboard" />} />
      <Tab.Screen name="Settings" children={() => <Placeholder name="Settings" />} />
    </Tab.Navigator>
  );
}

const AppStack = createStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Tabs" component={AppTabs} />
      <AppStack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
      <AppStack.Screen name="ClanProfile" component={ClanProfileScreen} />
    </AppStack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: { color: colors.text.secondary, fontSize: typography.sizes.lg },
});
