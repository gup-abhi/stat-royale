import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { colors } from '@theme/colors';

interface Props {
  iconUrl: string;
  size?: number;
}

export default function CardImage({ iconUrl, size = 40 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.15 }]}>
      <Image
        source={{ uri: iconUrl }}
        style={{ width: size, height: size, borderRadius: size * 0.15 }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
