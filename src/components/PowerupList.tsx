import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { POWERUPS } from '../constants/game';

interface Props {
  powerups: string[];
  powerupsCrafted: boolean[];
  coins: number;
  onActivate: (code: string) => void;
  onCraft: (idx: number) => void;
  onFuse: (tier: 1 | 2) => void;
}

const TIER_COLORS: Record<number, string> = { 1: '#4a9eff', 2: '#a855f7', 3: '#f59e0b' };
const CRAFT_COST: Record<number, number> = { 1: 12, 2: 20 };

export default function PowerupList({ powerups, powerupsCrafted, coins, onActivate, onCraft, onFuse }: Props) {
  if (powerups.length === 0) return null;

  const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
  for (const code of powerups) {
    const t = parseInt(code[0]);
    if (t >= 1 && t <= 3) tierCounts[t]++;
  }
  const canFuse1 = tierCounts[1] >= 3;
  const canFuse2 = tierCounts[2] >= 3;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Power-ups</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {powerups.map((code, idx) => {
          const def = POWERUPS.find(p => p.code === code);
          if (!def) return null;
          const color = TIER_COLORS[def.tier] ?? '#fff';
          const alreadyCrafted = powerupsCrafted[idx] ?? false;
          const canCraft = !alreadyCrafted && def.tier < 3;
          const craftCost = CRAFT_COST[def.tier] ?? 0;
          const canAffordCraft = coins >= craftCost;
          return (
            <View key={`${code}-${idx}`} style={[styles.item, { borderColor: color }]}>
              <TouchableOpacity style={styles.itemMain} onPress={() => onActivate(code)}>
                <Text style={[styles.name, { color }]}>{def.name}</Text>
                <Text style={styles.desc} numberOfLines={1}>{def.description}</Text>
              </TouchableOpacity>
              {canCraft && (
                <TouchableOpacity
                  style={[styles.craftBtn, !canAffordCraft && styles.craftBtnDisabled]}
                  onPress={() => onCraft(idx)}
                  disabled={!canAffordCraft}
                >
                  <Text style={styles.craftText}>⬆ {craftCost}¢</Text>
                </TouchableOpacity>
              )}
              {alreadyCrafted && (
                <Text style={styles.craftedBadge}>★</Text>
              )}
            </View>
          );
        })}

        {(canFuse1 || canFuse2) && (
          <View style={styles.fuseRow}>
            {canFuse1 && (
              <TouchableOpacity style={styles.fuseBtn} onPress={() => onFuse(1)}>
                <Text style={styles.fuseText}>✨ Fuse 3×L1 → L2</Text>
              </TouchableOpacity>
            )}
            {canFuse2 && (
              <TouchableOpacity style={[styles.fuseBtn, styles.fuseBtnL2]} onPress={() => onFuse(2)}>
                <Text style={[styles.fuseText, { color: '#f59e0b' }]}>✨ Fuse 3×L2 → L3</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxHeight: 220 },
  header: { color: '#999', fontSize: 12, marginBottom: 4 },
  list: {},
  item: {
    borderWidth: 1, borderRadius: 6,
    paddingVertical: 6, paddingLeft: 8, paddingRight: 4,
    marginBottom: 4,
    backgroundColor: '#0d0d1a',
    flexDirection: 'row', alignItems: 'center',
  },
  itemMain: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 13 },
  desc: { color: '#888', fontSize: 11, marginTop: 2 },
  craftBtn: {
    backgroundColor: '#1a0040', borderRadius: 4,
    paddingHorizontal: 7, paddingVertical: 4, marginLeft: 6,
  },
  craftBtnDisabled: { opacity: 0.35 },
  craftText: { color: '#a855f7', fontSize: 11, fontWeight: 'bold' },
  craftedBadge: { color: '#f59e0b', fontSize: 13, marginLeft: 6, fontWeight: 'bold' },
  fuseRow: { flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 2 },
  fuseBtn: {
    flex: 1, backgroundColor: '#0d1a00', borderRadius: 6,
    borderWidth: 1, borderColor: '#a855f7',
    paddingVertical: 6, alignItems: 'center',
  },
  fuseBtnL2: { borderColor: '#f59e0b', backgroundColor: '#1a1000' },
  fuseText: { color: '#a855f7', fontSize: 12, fontWeight: 'bold' },
});
