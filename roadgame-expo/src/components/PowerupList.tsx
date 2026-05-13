import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { POWERUPS } from '../constants/game';

interface Props {
  powerups: string[];
  onActivate: (code: string) => void;
}

const TIER_COLORS: Record<number, string> = { 1: '#4a9eff', 2: '#a855f7', 3: '#f59e0b' };

export default function PowerupList({ powerups, onActivate }: Props) {
  if (powerups.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Power-ups</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {powerups.map((code, idx) => {
          const def = POWERUPS.find(p => p.code === code);
          if (!def) return null;
          const color = TIER_COLORS[def.tier] ?? '#fff';
          return (
            <TouchableOpacity key={`${code}-${idx}`} style={[styles.item, { borderColor: color }]} onPress={() => onActivate(code)}>
              <Text style={[styles.name, { color }]}>{def.name}</Text>
              <Text style={styles.desc} numberOfLines={1}>{def.description}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 200 },
  header: { color: '#999', fontSize: 12, marginBottom: 4 },
  list: {},
  item: {
    borderWidth: 1, borderRadius: 6,
    padding: 8, marginBottom: 4,
    backgroundColor: '#0d0d1a',
  },
  name: { fontWeight: 'bold', fontSize: 13 },
  desc: { color: '#888', fontSize: 11, marginTop: 2 },
});
