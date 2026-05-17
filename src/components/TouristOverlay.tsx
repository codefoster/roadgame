import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TOURISTS } from '../constants/game';
import { randInt } from '../lib/gameLogic';
import { useGameStore } from '../stores/gameStore';

interface Props {
  onResult: (pts: number) => void;
}

export default function TouristOverlay({ onResult }: Props) {
  const { touristVisible, touristId, setTourist } = useGameStore();

  if (!touristVisible || !touristId) return null;

  const tourist = TOURISTS.find(t => t.id === touristId);
  if (!tourist) return null;

  function choose(action: 'guide' | 'ignore' | 'scam') {
    let pts = 0;
    if (action === 'guide')  pts = tourist!.guideReward;
    if (action === 'ignore') pts = tourist!.ignoreReward;
    if (action === 'scam')   pts = Math.random() < 0.4 ? tourist!.scamGood : tourist!.scamBad;
    setTourist(null);
    onResult(pts);
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Tourist!</Text>
          <Text style={styles.name}>{tourist.name}</Text>
          <Text style={styles.desc}>They need your help.</Text>

          <TouchableOpacity style={[styles.btn, styles.guideBtn]} onPress={() => choose('guide')}>
            <Text style={styles.btnText}>Guide (+{tourist.guideReward} pts)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.ignoreBtn]} onPress={() => choose('ignore')}>
            <Text style={styles.btnText}>Ignore (+{tourist.ignoreReward} pts)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.scamBtn]} onPress={() => choose('scam')}>
            <Text style={styles.btnText}>Scam (risky!)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#1e2a3a', borderRadius: 12, padding: 20, alignItems: 'center' },
  title: { color: '#ffd700', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  name: { color: '#fff', fontSize: 18, marginBottom: 6 },
  desc: { color: '#aaa', marginBottom: 16 },
  btn: { width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  guideBtn: { backgroundColor: '#2d6a2d' },
  ignoreBtn: { backgroundColor: '#444' },
  scamBtn: { backgroundColor: '#7a3000' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
