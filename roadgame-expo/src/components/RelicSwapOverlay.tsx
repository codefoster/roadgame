import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RELICS } from '../constants/game';

interface Props {
  visible: boolean;
  currentRelics: string[];
  newRelicId: string;
  onSwap: (swapOutId: string) => void;
  onKeep: () => void;
}

export default function RelicSwapOverlay({ visible, currentRelics, newRelicId, onSwap, onKeep }: Props) {
  const newRelic = RELICS.find(r => r.id === newRelicId);
  if (!newRelic) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Relic Found!</Text>
          <View style={styles.newRelic}>
            <Text style={styles.newEmoji}>{newRelic.emoji}</Text>
            <Text style={styles.newName}>{newRelic.name}</Text>
            <Text style={styles.newDesc}>{newRelic.description}</Text>
          </View>

          <Text style={styles.sub}>Your bag is full. Swap one out?</Text>

          {currentRelics.map(id => {
            const r = RELICS.find(x => x.id === id);
            if (!r) return null;
            return (
              <TouchableOpacity key={id} style={styles.swapBtn} onPress={() => onSwap(id)}>
                <Text style={styles.swapEmoji}>{r.emoji}</Text>
                <View style={styles.swapInfo}>
                  <Text style={styles.swapName}>{r.name}</Text>
                  <Text style={styles.swapDesc}>{r.description}</Text>
                </View>
                <Text style={styles.swapArrow}>↔</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.keepBtn} onPress={onKeep}>
            <Text style={styles.keepText}>Keep Current Relics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', padding: 24,
  },
  card: {
    backgroundColor: '#1a1a2e', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#ffd700',
  },
  title: {
    color: '#ffd700', fontSize: 22, fontWeight: 'bold',
    textAlign: 'center', marginBottom: 14,
  },
  newRelic: {
    backgroundColor: '#0d2a0d', borderRadius: 10, padding: 14,
    alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#4caf50',
  },
  newEmoji: { fontSize: 32, marginBottom: 4 },
  newName: { color: '#4caf50', fontSize: 16, fontWeight: 'bold' },
  newDesc: { color: '#aaa', fontSize: 13, textAlign: 'center', marginTop: 4 },
  sub: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  swapBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0d0d1a', borderRadius: 8, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#334',
  },
  swapEmoji: { fontSize: 22, marginRight: 10 },
  swapInfo: { flex: 1 },
  swapName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  swapDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  swapArrow: { color: '#ffd700', fontSize: 20, marginLeft: 8 },
  keepBtn: {
    marginTop: 6, padding: 12, backgroundColor: '#2a2a3a',
    borderRadius: 8, alignItems: 'center',
  },
  keepText: { color: '#aaa', fontWeight: 'bold', fontSize: 15 },
});
