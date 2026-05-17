import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CREW_MEMBERS } from '../constants/game';
import { usePersistentStore } from '../stores/persistentStore';

interface Props {
  visible: boolean;
  equippedCrew: string | null;
  onEquip: (id: string | null) => void;
  onClose: () => void;
}

export default function CrewOverlay({ visible, equippedCrew, onEquip, onClose }: Props) {
  const { coins, unlockedCrew, unlockCrew, spendCoins } = usePersistentStore();

  function handleUnlock(id: string, cost: number) {
    if (spendCoins(cost)) unlockCrew(id);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Road Crew</Text>
          <Text style={styles.subtitle}>{coins} coins · Equip one crew member per game</Text>

          <ScrollView>
            {CREW_MEMBERS.map(member => {
              const unlocked = unlockedCrew.includes(member.id);
              const equipped = equippedCrew === member.id;
              return (
                <View key={member.id} style={[styles.memberCard, equipped && styles.memberEquipped]}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberEmoji}>{member.emoji}</Text>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberTitle}>{member.title}</Text>
                    </View>
                    {equipped && <Text style={styles.equippedBadge}>EQUIPPED</Text>}
                    {!unlocked && <Text style={styles.lockedBadge}>LOCKED</Text>}
                  </View>

                  <View style={styles.effectRow}>
                    <Text style={styles.effectLabel}>Passive</Text>
                    <Text style={styles.effectDesc}>{member.passive}</Text>
                  </View>
                  <View style={styles.effectRow}>
                    <Text style={styles.effectLabel}>Activate</Text>
                    <Text style={styles.effectDesc}>{member.activeDesc}</Text>
                  </View>

                  {unlocked ? (
                    <TouchableOpacity
                      style={[styles.equipBtn, equipped && styles.unequipBtn]}
                      onPress={() => onEquip(equipped ? null : member.id)}
                    >
                      <Text style={styles.btnText}>{equipped ? 'Unequip' : 'Equip'}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.unlockBtn, coins < member.shopCost && styles.btnDisabled]}
                      onPress={() => handleUnlock(member.id, member.shopCost)}
                      disabled={coins < member.shopCost}
                    >
                      <Text style={styles.btnText}>Unlock — {member.shopCost} coins</Text>
                    </TouchableOpacity>
                  )}
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
  card: { backgroundColor: '#0d1a0d', borderRadius: 12, padding: 16, maxHeight: '90%' },
  title: { color: '#88ff88', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { color: '#aaa', textAlign: 'center', marginBottom: 12 },
  memberCard: {
    backgroundColor: '#0a1a0a', borderRadius: 8, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: '#2a4a2a',
  },
  memberEquipped: { borderColor: '#4caf50', backgroundColor: '#0a2a0a' },
  memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  memberEmoji: { fontSize: 28, marginRight: 10 },
  memberInfo: { flex: 1 },
  memberName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  memberTitle: { color: '#88aa88', fontSize: 12 },
  equippedBadge: { color: '#4caf50', fontSize: 10, fontWeight: 'bold', borderWidth: 1, borderColor: '#4caf50', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  lockedBadge: { color: '#666', fontSize: 10, fontWeight: 'bold', borderWidth: 1, borderColor: '#444', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  effectRow: { flexDirection: 'row', marginBottom: 4 },
  effectLabel: { color: '#666', fontSize: 11, width: 54, fontWeight: '600' },
  effectDesc: { color: '#aaa', fontSize: 11, flex: 1 },
  equipBtn: { marginTop: 8, padding: 9, backgroundColor: '#1a4a1a', borderRadius: 6, alignItems: 'center' },
  unequipBtn: { backgroundColor: '#2a2a2a' },
  unlockBtn: { marginTop: 8, padding: 9, backgroundColor: '#2a3a2a', borderRadius: 6, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  closeBtn: { marginTop: 10, padding: 12, backgroundColor: '#1a3a1a', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
