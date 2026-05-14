import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BADGES, BADGE_UPGRADE_COSTS, BADGE_RIVALRIES, BADGE_TRIALS, BADGE_PRESTIGE_PASSIVES } from '../constants/game';
import { usePersistentStore } from '../stores/persistentStore';
import { useGameStore } from '../stores/gameStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  activeBadges: string[];
  onToggle: (id: string) => void;
}

const MAX_ACTIVE = 5;

export default function BadgesOverlay({ visible, onClose, activeBadges, onToggle }: Props) {
  const { badges, badgeLevels, badgeCooldowns, upgradeBadge, prestigeBadge, coins, badgeUseCounts, masteredBadges, completedTrials, prestigedBadges } = usePersistentStore();
  const trialProgress = useGameStore(s => s.trialProgress);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Badges</Text>
          <Text style={styles.subtitle}>
            {activeBadges.length}/{MAX_ACTIVE} active · {coins} coins
          </Text>

          <ScrollView>
            {badges.length === 0 && (
              <Text style={styles.empty}>No badges yet. Complete double golden bingo to earn one!</Text>
            )}
            {BADGES.filter(b => badges.includes(b.id)).map(badge => {
              const level = badgeLevels[badge.id] ?? 0;
              const cooldown = badgeCooldowns[badge.id] ?? 0;
              const isActive = activeBadges.includes(badge.id);
              const isMastered = masteredBadges.includes(badge.id);
              const useCount = badgeUseCounts[badge.id] ?? 0;
              const nextCost = level < 3 ? BADGE_UPGRADE_COSTS[level] : null;
              const canUpgrade = nextCost !== null && coins >= nextCost;
              const trial = BADGE_TRIALS[badge.id] ?? null;
              const trialDone = completedTrials.includes(badge.id);
              const trialProg = trialProgress[badge.id] ?? 0;
              const isPrestiged = prestigedBadges.includes(badge.id);
              const prestigePassive = BADGE_PRESTIGE_PASSIVES[badge.id] ?? null;
              const canPrestige = isMastered && level >= 3 && trialDone && !isPrestiged && !!prestigePassive;

              // Rivalry check
              const rival = BADGE_RIVALRIES.find(pair => pair.includes(badge.id));
              const rivalBlocked = rival
                ? activeBadges.some(b => rival.includes(b) && b !== badge.id)
                : false;
              const rivalName = rival
                ? BADGES.find(b => b.id === rival.find(r => r !== badge.id))?.name
                : null;

              const canActivate = isActive || (activeBadges.length < MAX_ACTIVE && cooldown === 0 && !rivalBlocked);

              return (
                <View key={badge.id} style={[styles.badge, isActive && styles.badgeActive]}>
                  <View style={styles.badgeHeader}>
                    <Text style={styles.badgeName}>
                      {isMastered ? '★ ' : ''}{badge.name}
                    </Text>
                    <Text style={styles.badgeLevel}>Lv {level} · {useCount} uses</Text>
                  </View>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>

                  {cooldown > 0 && (
                    <Text style={styles.cooldown}>Cooldown: {cooldown} game{cooldown !== 1 ? 's' : ''}</Text>
                  )}
                  {rivalBlocked && rivalName && (
                    <Text style={styles.rivalWarning}>⚔ Can't pair with {rivalName}</Text>
                  )}

                  {trial && (
                    <View style={styles.trialBox}>
                      {trialDone ? (
                        <Text style={styles.trialDone}>✓ Trial complete: {trial.effectDesc}</Text>
                      ) : (
                        <>
                          <Text style={styles.trialDesc}>Trial: {trial.desc}</Text>
                          <Text style={styles.trialProgress}>{trialProg}/{trial.target}</Text>
                        </>
                      )}
                    </View>
                  )}

                  {isPrestiged && prestigePassive && (
                    <Text style={styles.prestigePassive}>★ Prestige: {prestigePassive}</Text>
                  )}

                  <View style={styles.badgeActions}>
                    <TouchableOpacity
                      style={[styles.selectBtn, !canActivate && styles.btnDisabled, isActive && styles.selectActive]}
                      onPress={() => onToggle(badge.id)}
                      disabled={!canActivate}
                    >
                      <Text style={styles.btnText}>{isActive ? 'Deselect' : 'Select'}</Text>
                    </TouchableOpacity>
                    {nextCost !== null && (
                      <TouchableOpacity
                        style={[styles.upgradeBtn, !canUpgrade && styles.btnDisabled]}
                        onPress={() => upgradeBadge(badge.id)}
                        disabled={!canUpgrade}
                      >
                        <Text style={styles.btnText}>Upgrade ({nextCost}¢)</Text>
                      </TouchableOpacity>
                    )}
                    {canPrestige && (
                      <TouchableOpacity
                        style={styles.prestigeBtn}
                        onPress={() => prestigeBadge(badge.id)}
                      >
                        <Text style={styles.btnText}>Prestige</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, maxHeight: '90%' },
  title: { color: '#ffd700', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#aaa', textAlign: 'center', marginBottom: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 20 },
  badge: {
    backgroundColor: '#0d0d1a', borderRadius: 8,
    padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#334',
  },
  badgeActive: { borderColor: '#ffd700', backgroundColor: '#1a1500' },
  badgeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  badgeLevel: { color: '#ffd700', fontSize: 12 },
  badgeDesc: { color: '#aaa', fontSize: 12, marginTop: 3 },
  cooldown: { color: '#f44', fontSize: 11, marginTop: 3 },
  rivalWarning: { color: '#f80', fontSize: 11, marginTop: 3 },
  trialBox: { marginTop: 6, padding: 6, backgroundColor: '#0a1a0a', borderRadius: 4 },
  trialDesc: { color: '#8d8', fontSize: 11 },
  trialProgress: { color: '#5f5', fontWeight: 'bold', fontSize: 11, marginTop: 2 },
  trialDone: { color: '#5f5', fontSize: 11 },
  badgeActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  selectBtn: { flex: 1, padding: 8, backgroundColor: '#2a4a2a', borderRadius: 6, alignItems: 'center' },
  selectActive: { backgroundColor: '#7a6000' },
  upgradeBtn: { flex: 1, padding: 8, backgroundColor: '#1a2a4a', borderRadius: 6, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  closeBtn: { marginTop: 10, padding: 12, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  prestigePassive: { color: '#ffcc44', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  prestigeBtn: { flex: 1, padding: 8, backgroundColor: '#2a0040', borderRadius: 6, alignItems: 'center' },
});
