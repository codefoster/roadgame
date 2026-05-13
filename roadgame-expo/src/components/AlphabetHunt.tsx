import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../stores/gameStore';
import { usePersistentStore } from '../stores/persistentStore';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AlphabetHunt({ visible, onClose }: Props) {
  const { alphaFound, setAlphaFound, setAlphaVisible, addScoreA } = useGameStore();
  const addCoins = usePersistentStore((s) => s.addCoins);

  const nextIdx = alphaFound.findIndex(v => !v);
  const allDone = alphaFound.every(Boolean);

  function handleFound() {
    if (nextIdx === -1) return;
    setAlphaFound(nextIdx);
    if (nextIdx === 25) {
      // completed full alphabet
      addScoreA(50);
      addCoins(10);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Alphabet Hunt</Text>
          {nextIdx !== -1 && !allDone && (
            <Text style={styles.target}>
              Find something starting with: <Text style={styles.letter}>{ALPHABET[nextIdx]}</Text>
            </Text>
          )}
          {allDone && <Text style={styles.complete}>All 26 found! +50 pts, +10 coins</Text>}

          <View style={styles.grid}>
            {ALPHABET.map((letter, idx) => (
              <View key={letter} style={[styles.letterBox, alphaFound[idx] && styles.foundBox]}>
                <Text style={[styles.letterText, alphaFound[idx] && styles.foundText]}>{letter}</Text>
              </View>
            ))}
          </View>

          {!allDone && nextIdx !== -1 && (
            <TouchableOpacity style={styles.foundBtn} onPress={handleFound}>
              <Text style={styles.foundBtnText}>Found it!</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  target: { color: '#ccc', fontSize: 16, marginBottom: 12, textAlign: 'center' },
  letter: { color: '#4a9eff', fontWeight: 'bold', fontSize: 22 },
  complete: { color: '#ffd700', fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 },
  letterBox: {
    width: 32, height: 32, borderRadius: 4,
    borderWidth: 1, borderColor: '#555',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#111',
  },
  foundBox: { backgroundColor: '#2d6a2d', borderColor: '#4caf50' },
  letterText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  foundText: { color: '#fff' },
  foundBtn: {
    marginTop: 16, backgroundColor: '#4a9eff',
    padding: 12, borderRadius: 8, alignItems: 'center',
  },
  foundBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { marginTop: 10, padding: 10, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: 'bold' },
});
