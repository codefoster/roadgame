import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BOSSES } from '../constants/game';

interface Props {
  visible: boolean;
  bossId: string | null;
  purchases: string[];
  hunterActive: boolean;
  onResult: (won: boolean, pts: number, coins: number) => void;
}

export default function BossFightOverlay({ visible, bossId, purchases, hunterActive, onResult }: Props) {
  const [result, setResult] = useState<'win' | 'lose' | null>(null);

  const boss = BOSSES.find(b => b.id === bossId);
  if (!boss) return null;

  const hunterBonus = hunterActive ? 0.20 : 0;
  const bareChance  = Math.min(0.95, boss.bareHandsChance + hunterBonus);
  const kitChance   = Math.min(0.95, boss.kitChance + hunterBonus);
  const relicChance = Math.min(0.95, boss.relicChance + hunterBonus);

  const hasKit   = purchases.includes('hunters_kit');
  const hasRelic = purchases.includes('power_relic');

  function fight(chance: number) {
    setResult(Math.random() < chance ? 'win' : 'lose');
  }

  function dismiss() {
    const won = result === 'win';
    setResult(null);
    onResult(won, won ? boss.winPts : 0, won ? boss.winCoins : 0);
  }

  function flee() {
    setResult(null);
    onResult(false, 0, 0);
  }

  if (result !== null) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={result === 'win' ? styles.winTitle : styles.loseTitle}>
              {result === 'win' ? '⚔️ VICTORY!' : '💀 DEFEATED!'}
            </Text>
            <Text style={styles.bossName}>{boss.name}</Text>
            {result === 'win' ? (
              <>
                <Text style={styles.rewardText}>+{boss.winPts} pts</Text>
                <Text style={styles.rewardText}>+{boss.winCoins} coins</Text>
              </>
            ) : (
              <Text style={styles.penaltyText}>−{boss.losePts} pts</Text>
            )}
            <TouchableOpacity style={styles.continueBtn} onPress={dismiss}>
              <Text style={styles.btnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>⚔️ BOSS ENCOUNTER</Text>
          <Text style={styles.bossName}>{boss.name}</Text>
          <Text style={styles.bossDesc}>{boss.description}</Text>

          {hunterActive && (
            <Text style={styles.hunterBadge}>🏹 Hunter: +20% win chance</Text>
          )}

          <View style={styles.rewards}>
            <Text style={styles.rewardText}>Win: +{boss.winPts} pts · +{boss.winCoins} coins</Text>
            <Text style={styles.penaltyText}>Lose: −{boss.losePts} pts</Text>
          </View>

          <TouchableOpacity style={styles.bareBtn} onPress={() => fight(bareChance)}>
            <Text style={styles.btnText}>Fight Bare Hands — {Math.round(bareChance * 100)}% win</Text>
          </TouchableOpacity>

          {hasKit && (
            <TouchableOpacity style={styles.kitBtn} onPress={() => fight(kitChance)}>
              <Text style={styles.btnText}>Use Hunter's Kit — {Math.round(kitChance * 100)}% win</Text>
            </TouchableOpacity>
          )}

          {hasRelic && (
            <TouchableOpacity style={styles.relicBtn} onPress={() => fight(relicChance)}>
              <Text style={styles.btnText}>Use Power Relic — {Math.round(relicChance * 100)}% win</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.fleeBtn} onPress={flee}>
            <Text style={styles.fleeBtnText}>Flee (−5 pts)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', padding: 20,
  },
  card: {
    backgroundColor: '#1a0a00', borderRadius: 14, padding: 20,
    borderWidth: 2, borderColor: '#8b0000',
  },
  title: { color: '#ff4400', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  bossName: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  bossDesc: { color: '#ccc', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  hunterBadge: { color: '#88ff88', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  rewards: { marginBottom: 16, alignItems: 'center' },
  rewardText: { color: '#ffd700', fontSize: 13, marginBottom: 2 },
  penaltyText: { color: '#ff6666', fontSize: 13 },
  winTitle: { color: '#ffd700', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  loseTitle: { color: '#ff3333', fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  bareBtn:  { padding: 14, borderRadius: 8, backgroundColor: '#3a1a00', marginBottom: 8, alignItems: 'center' },
  kitBtn:   { padding: 14, borderRadius: 8, backgroundColor: '#1a3a00', marginBottom: 8, alignItems: 'center' },
  relicBtn: { padding: 14, borderRadius: 8, backgroundColor: '#1a004a', marginBottom: 8, alignItems: 'center' },
  fleeBtn:  { padding: 10, borderRadius: 8, backgroundColor: '#222', marginTop: 4, alignItems: 'center' },
  continueBtn: { padding: 14, borderRadius: 8, backgroundColor: '#333', marginTop: 16, alignItems: 'center' },
  btnText:  { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fleeBtnText: { color: '#888', fontSize: 13 },
});
