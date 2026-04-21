import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  CardDatabase: undefined;
  Leaderboard: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  Tabs: undefined;
  PlayerProfile: { tag: string };
  ClanProfile: { tag: string };
};

export type AuthNavigationProp<T extends keyof AuthStackParamList> =
  StackNavigationProp<AuthStackParamList, T>;

export type AuthRouteProp<T extends keyof AuthStackParamList> =
  RouteProp<AuthStackParamList, T>;

export type AppStackNavigationProp<T extends keyof AppStackParamList> =
  StackNavigationProp<AppStackParamList, T>;

export type AppStackRouteProp<T extends keyof AppStackParamList> =
  RouteProp<AppStackParamList, T>;
