import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BOSSES } from '../constants/game';

interface Props {
  visible: boolean;
  bossId: string | null;
  purchases: string[];
  hunterActive: boolean;
  valkyrieBonus: number;
  activeBadges: string[];
  currentRelics: string[];
  coins: number;
  topPowerup: string | null;
  scoreB: number;
  scoreA: number;
  isRematch: boolean;
  onResult: (fled: boolean, won: boolean, winPts: number, winCoins: number, curse: string | null) => void;
  onDeal: () => void;
}

function bossScaleMultiplier(score: number): number {
  if (score >= 1000) return 2.0;
  if (score >= 800)  return 1.75;
  if (score >= 500)  return 1.5;
  if (score >= 200)  return 1.25;
  return 1.0;
}

export default function BossFightOverlay({
  visible, bossId, purchases, hunterActive, valkyrieBonus,
  activeBadges, currentRelics, coins, topPowerup, scoreB, scoreA, isRematch,
  onResult, onDeal,
}: Props) {
  const [result, setResult] = useState<{ won: boolean; winPts: number; winCoins: number } | null>(null);

  const boss = BOSSES.find(b => b.id === bossId);
  if (!boss) return null;

  const scale = bossScaleMultiplier(scoreA);

  // Weakness
  const hasWeakness = boss.weakness.type === 'badge'
    ? activeBadges.includes(boss.weakness.id)
    : currentRelics.includes(boss.weakness.id);
  const weaknessBonus = hasWeakness ? 0.25 : 0;

  const bonus = (hunterActive ? 0.20 : 0) + valkyrieBonus + weaknessBonus;
  const bareChance  = Math.min(0.95, boss.bareHandsChance + bonus);
  const kitChance   = Math.min(0.95, boss.kitChance + bonus);
  const relicChance = Math.min(0.95, boss.relicChance + bonus);

  const hasKit   = purchases.includes('hunters_kit');
  const hasRelic = purchases.includes('power_relic');
  const kitDelta = boss.kitChance - boss.bareHandsChance;
  const bothChance = Math.min(0.95, relicChance + kitDelta);

  const scaledWinPts   = Math.round(boss.winPts * scale);
  const scaledWinCoins = Math.round(boss.winCoins * scale);
  const scaledLosePts  = Math.round(boss.losePts * scale);
  const scaledLoseCoins = Math.round(boss.loseCoins * scale);
  const scaledLoseCredits = Math.round(boss.loseCredits * scale);
  const scaledFleeCost = Math.round((boss.fleeCoins ?? 5) * scale);

  // Deal affordability
  const deal = boss.deal;
  const canAffordDeal = deal
    ? deal.type === 'powerup' ? !!topPowerup
    : deal.type === 'coins'   ? coins >= deal.cost
    : scoreB >= deal.cost
    : false;

  function fight(chance: number, isBarehands: boolean) {
    const won = Math.random() < chance;
    const rawPts = won ? (isBarehands && boss!.bareHandsDouble ? boss!.winPts * 2 : boss!.winPts) : 0;
    const pts = Math.round(rawPts * scale);
    setResult({ won, winPts: pts, winCoins: won ? scaledWinCoins : 0 });
  }

  function dismiss() {
    if (!result) return;
    const curse = !result.won ? (boss!.curse?.id ?? null) : null;
    setResult(null);
    onResult(false, result.won, result.winPts, result.winCoins, curse);
  }

  function flee() {
    setResult(null);
    onResult(true, false, 0, 0, null);
  }

  if (result !== null) {
    const curse = !result.won ? boss.curse : null;
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={result.won ? styles.winTitle : styles.loseTitle}>
              {result.won ? '⚔️ VICTORY!' : '💀 DEFEATED!'}
            </Text>
            <Text style={styles.bossName}>{boss.name}</Text>
            {result.won ? (
              <>
                <Text style={styles.rewardLine}>+{result.winPts} pts</Text>
                <Text style={styles.rewardLine}>+{result.winCoins} coins</Text>
                {boss.bareHandsDouble && result.winPts > scaledWinPts && (
                  <Text style={styles.bonusLine}>⚡ Bare-handed glory bonus!</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.penaltyLine}>−{scaledLosePts} pts</Text>
                {scaledLoseCoins > 0 && <Text style={styles.penaltyLine}>−{scaledLoseCoins} coins</Text>}
                {scaledLoseCredits > 0 && <Text style={styles.penaltyLine}>−{scaledLoseCredits} credits</Text>}
                {curse && (
                  <View style={styles.curseResult}>
                    <Text style={styles.curseResultTitle}>☠️ Cursed!</Text>
                    <Text style={styles.curseResultDesc}>{curse.desc}</Text>
                  </View>
                )}
              </>
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
        <ScrollView contentContainerStyle={styles.card}>
          <Text style={styles.title}>⚔️ {isRematch ? 'REMATCH!' : 'BOSS ENCOUNTER'}</Text>
          {isRematch && <Text style={styles.rematchLine}>This boss is hunting you — spawn rate was doubled!</Text>}
          <Text style={styles.bossName}>{boss.name}</Text>
          <Text style={styles.bossDesc}>{boss.description}</Text>

          <View style={styles.powerBadge}>
            <Text style={styles.powerName}>{boss.powerName}</Text>
            <Text style={styles.powerDesc}>{boss.powerDesc}</Text>
          </View>

          {/* Weakness */}
          <View style={[styles.weaknessRow, hasWeakness && styles.weaknessActive]}>
            <Text style={styles.weaknessLabel}>Weakness:</Text>
            <Text style={[styles.weaknessName, hasWeakness && styles.weaknessHave]}>
              {boss.weakness.name} {hasWeakness ? '✓ +25%' : '✗'}
            </Text>
          </View>

          {/* Curse warning */}
          {boss.curse && (
            <View style={styles.curseWarning}>
              <Text style={styles.curseWarningText}>☠️ Lose curse: {boss.curse.desc}</Text>
            </View>
          )}

          {/* Bonuses row */}
          {(hunterActive || valkyrieBonus > 0 || hasWeakness) && (
            <View style={styles.bonusRow}>
              {hunterActive && <Text style={styles.bonusChip}>🏹 Hunter +20%</Text>}
              {valkyrieBonus > 0 && <Text style={styles.bonusChip}>⚔️ Valkyrie +{Math.round(valkyrieBonus * 100)}%</Text>}
              {hasWeakness && <Text style={styles.bonusChip}>💥 Weakness +25%</Text>}
            </View>
          )}

          {scale > 1 && (
            <Text style={styles.scaleLine}>⚡ Score-scaled ×{scale.toFixed(2)} — higher risk &amp; reward</Text>
          )}
          <View style={styles.rewardRow}>
            <Text style={styles.rewardLine}>
              Win: +{scaledWinPts} pts · +{scaledWinCoins} coins
              {boss.bareHandsDouble ? ' (2× bare-handed)' : ''}
            </Text>
            <Text style={styles.penaltyLine}>
              Lose: −{scaledLosePts} pts
              {scaledLoseCoins > 0 ? ` · −${scaledLoseCoins} coins` : ''}
              {scaledLoseCredits > 0 ? ` · −${scaledLoseCredits} credits` : ''}
            </Text>
            {!boss.noFlee && <Text style={styles.fleeLine}>Flee: −{scaledFleeCost} coins</Text>}
          </View>

          <TouchableOpacity style={styles.bareBtn} onPress={() => fight(bareChance, true)}>
            <Text style={styles.btnText}>Fight Bare Hands — {Math.round(bareChance * 100)}%</Text>
          </TouchableOpacity>

          {hasKit && !hasRelic && (
            <TouchableOpacity
              style={[styles.kitBtn, boss.kitChance === boss.bareHandsChance && styles.btnDisabled]}
              onPress={() => fight(kitChance, false)}
            >
              <Text style={styles.btnText}>
                Hunter's Kit — {Math.round(kitChance * 100)}%
                {boss.kitChance === boss.bareHandsChance ? ' (no effect)' : ''}
              </Text>
            </TouchableOpacity>
          )}

          {hasRelic && !hasKit && (
            <TouchableOpacity style={styles.relicBtn} onPress={() => fight(relicChance, false)}>
              <Text style={styles.btnText}>Power Relic — {Math.round(relicChance * 100)}%</Text>
            </TouchableOpacity>
          )}

          {hasKit && hasRelic && (
            <>
              <TouchableOpacity style={styles.kitBtn} onPress={() => fight(kitChance, false)}>
                <Text style={styles.btnText}>
                  Hunter's Kit — {Math.round(kitChance * 100)}%
                  {boss.kitChance === boss.bareHandsChance ? ' (no effect)' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.relicBtn} onPress={() => fight(relicChance, false)}>
                <Text style={styles.btnText}>Power Relic — {Math.round(relicChance * 100)}%</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bothBtn} onPress={() => fight(bothChance, false)}>
                <Text style={styles.btnText}>Both Together — {Math.round(bothChance * 100)}% ⚡</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Deal */}
          {deal && (
            <TouchableOpacity
              style={[styles.dealBtn, !canAffordDeal && styles.btnDisabled]}
              onPress={canAffordDeal ? onDeal : undefined}
              disabled={!canAffordDeal}
            >
              <Text style={styles.dealBtnText}>
                🤝 {deal.label}{!canAffordDeal ? ' (can\'t afford)' : ''}
              </Text>
              {deal.pts > 0 && <Text style={styles.dealSub}>+{deal.pts} pts</Text>}
            </TouchableOpacity>
          )}

          {!boss.noFlee && (
            <TouchableOpacity style={styles.fleeBtn} onPress={flee}>
              <Text style={styles.fleeBtnText}>Flee (−{boss.fleeCoins} coins)</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1a0a00', borderRadius: 14, padding: 20, borderWidth: 2, borderColor: '#8b0000' },
  title: { color: '#ff4400', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  bossName: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  bossDesc: { color: '#ccc', fontSize: 12, textAlign: 'center', marginBottom: 10 },
  powerBadge: { backgroundColor: '#2a0a0a', borderRadius: 8, padding: 8, marginBottom: 8, alignItems: 'center' },
  powerName: { color: '#ff8844', fontWeight: 'bold', fontSize: 13 },
  powerDesc: { color: '#ffaa88', fontSize: 11, marginTop: 2 },
  weaknessRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1a1a', borderRadius: 8, padding: 7, marginBottom: 6,
    borderWidth: 1, borderColor: '#333',
  },
  weaknessActive: { backgroundColor: '#0a2a0a', borderColor: '#4caf50' },
  weaknessLabel: { color: '#888', fontSize: 12, marginRight: 6 },
  weaknessName: { color: '#888', fontSize: 12, fontWeight: 'bold' },
  weaknessHave: { color: '#4caf50' },
  curseWarning: { backgroundColor: '#2a0a0a', borderRadius: 8, padding: 7, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#8b0000' },
  curseWarningText: { color: '#ff7777', fontSize: 11 },
  bonusRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  bonusChip: { color: '#88ff88', fontSize: 11, backgroundColor: '#0a2a0a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  rewardRow: { alignItems: 'center', marginBottom: 12 },
  rewardLine: { color: '#ffd700', fontSize: 12, marginBottom: 2 },
  penaltyLine: { color: '#ff7777', fontSize: 12 },
  fleeLine: { color: '#ffaa44', fontSize: 11, marginTop: 2 },
  bonusLine: { color: '#ffdd44', fontSize: 12, marginTop: 4 },
  scaleLine: { color: '#ff8800', fontSize: 11, textAlign: 'center', marginBottom: 6 },
  rematchLine: { color: '#ff8800', fontSize: 11, textAlign: 'center', marginBottom: 4 },
  winTitle: { color: '#ffd700', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  loseTitle: { color: '#ff3333', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  curseResult: { marginTop: 10, backgroundColor: '#2a0000', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#8b0000' },
  curseResultTitle: { color: '#ff4444', fontWeight: 'bold', fontSize: 14, marginBottom: 3 },
  curseResultDesc: { color: '#ff9999', fontSize: 12, textAlign: 'center' },
  bareBtn:  { padding: 13, borderRadius: 8, backgroundColor: '#3a1a00', marginBottom: 8, alignItems: 'center' },
  kitBtn:   { padding: 13, borderRadius: 8, backgroundColor: '#1a3a00', marginBottom: 8, alignItems: 'center' },
  relicBtn: { padding: 13, borderRadius: 8, backgroundColor: '#1a004a', marginBottom: 8, alignItems: 'center' },
  bothBtn:  { padding: 13, borderRadius: 8, backgroundColor: '#4a2a00', marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ffd700' },
  dealBtn:  { padding: 11, borderRadius: 8, backgroundColor: '#002a1a', marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4caf50' },
  dealBtnText: { color: '#aaffaa', fontWeight: 'bold', fontSize: 13 },
  dealSub:  { color: '#ffd700', fontSize: 11, marginTop: 2 },
  fleeBtn:  { padding: 9, borderRadius: 8, backgroundColor: '#222', marginTop: 2, alignItems: 'center' },
  continueBtn: { padding: 13, borderRadius: 8, backgroundColor: '#333', marginTop: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fleeBtnText: { color: '#777', fontSize: 12 },
});
