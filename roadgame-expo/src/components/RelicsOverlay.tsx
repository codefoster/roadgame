import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RELICS, RELIC_UPGRADE_COSTS, RELIC_SYNERGIES, RELIC_SETS } from '../constants/game';
import { usePersistentStore } from '../stores/persistentStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function RelicsOverlay({ visible, onClose }: Props) {
  const { relicLevels, upgradeRelic, coins } = usePersistentStore();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Roadside Relics</Text>
          <Text style={styles.subtitle}>{coins} coins · Upgrade to boost passive effects</Text>

          <ScrollView>
            {RELICS.map(relic => {
              const level = relicLevels[relic.id] ?? 0;
              const nextCost = level < 2 ? RELIC_UPGRADE_COSTS[level] : null;
              const canUpgrade = nextCost !== null && coins >= nextCost;
              const desc = level >= 2 ? relic.tier2Desc : level >= 1 ? relic.tier1Desc : relic.description;

              return (
                <View key={relic.id} style={[styles.relic, level > 0 && styles.relicUpgraded]}>
                  <View style={styles.relicHeader}>
                    <Text style={styles.relicName}>{relic.emoji} {relic.name}</Text>
                    <Text style={styles.relicLevel}>L{level}</Text>
                  </View>
                  <Text style={styles.relicDesc}>{desc}</Text>
                  <Text style={styles.activateDesc}>Activate: {relic.activateDesc}</Text>
                  {nextCost !== null && (
                    <TouchableOpacity
                      style={[styles.upgradeBtn, !canUpgrade && styles.btnDisabled]}
                      onPress={() => upgradeRelic(relic.id)}
                      disabled={!canUpgrade}
                    >
                      <Text style={styles.btnText}>
                        Upgrade to L{level + 1} ({nextCost} coins)
                      </Text>
                    </TouchableOpacity>
                  )}
                  {nextCost === null && (
                    <Text style={styles.maxed}>★ Max Level</Text>
                  )}
                </View>
              );
            })}

            <Text style={styles.sectionHeader}>Relic Synergies</Text>
            {RELIC_SYNERGIES.map(syn => (
              <View key={syn.id} style={styles.synCard}>
                <Text style={styles.synName}>✨ {syn.name}</Text>
                <Text style={styles.synRelics}>{syn.relics.join(' + ')}</Text>
                <Text style={styles.synDesc}>{syn.desc}</Text>
              </View>
            ))}

            <Text style={styles.sectionHeader}>Relic Sets</Text>
            {RELIC_SETS.map(set => (
              <View key={set.id} style={styles.setCard}>
                <Text style={styles.setName}>🏆 {set.name}</Text>
                <Text style={styles.synRelics}>{set.relics.join(' + ')}</Text>
                <Text style={styles.synDesc}>{set.desc}</Text>
              </View>
            ))}
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
  sectionHeader: { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 6 },
  relic: {
    backgroundColor: '#0d0d1a', borderRadius: 8, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#334',
  },
  relicUpgraded: { borderColor: '#6644aa' },
  relicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  relicName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  relicLevel: { color: '#aa88ff', fontSize: 12, fontWeight: 'bold' },
  relicDesc: { color: '#aaa', fontSize: 12, marginTop: 2 },
  activateDesc: { color: '#ffd70088', fontSize: 11, marginTop: 3, fontStyle: 'italic' },
  upgradeBtn: { marginTop: 8, padding: 8, backgroundColor: '#1a2a4a', borderRadius: 6, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  maxed: { color: '#aa88ff', fontSize: 11, marginTop: 6, textAlign: 'right' },
  synCard: { backgroundColor: '#001a2a', borderRadius: 6, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#224' },
  setCard: { backgroundColor: '#1a1a00', borderRadius: 6, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: '#442' },
  synName: { color: '#aaccff', fontWeight: 'bold', fontSize: 13 },
  setName: { color: '#ffd700', fontWeight: 'bold', fontSize: 13 },
  synRelics: { color: '#666', fontSize: 11, marginTop: 2 },
  synDesc: { color: '#aaa', fontSize: 12, marginTop: 2 },
  closeBtn: { marginTop: 10, padding: 12, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
