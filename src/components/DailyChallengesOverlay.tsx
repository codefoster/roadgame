import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePersistentStore } from '../stores/persistentStore';
import { getDailyChallenges, DailyChallenge } from '../lib/dailyChallenges';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DailyChallengesOverlay({ visible, onClose }: Props) {
  const persist = usePersistentStore();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    if (visible) {
      const today = persist.resetDailyIfNeeded();
      setDateStr(today);
      setChallenges(getDailyChallenges(today));
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Daily Challenges</Text>
          <Text style={styles.date}>{dateStr}</Text>

          <ScrollView>
            {challenges.map((ch, idx) => {
              const done = persist.dailyCompleted.includes(idx);
              return (
                <View key={idx} style={[styles.item, done && styles.itemDone]}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemDesc}>{ch.desc}</Text>
                    <Text style={[styles.reward, done && styles.rewardDone]}>
                      {done ? '✓' : `+${ch.reward}¢`}
                    </Text>
                  </View>
                  {done && <Text style={styles.completedLabel}>Completed!</Text>}
                </View>
              );
            })}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Complete challenges by hitting their targets in a single game. Rewards are automatically awarded when you return to the menu.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#001a0d', borderRadius: 12, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#00cc66' },
  title: { color: '#00cc66', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  date: { color: '#007744', fontSize: 12, textAlign: 'center', marginBottom: 16 },

  item: {
    backgroundColor: '#002a11', borderRadius: 8,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#004422',
  },
  itemDone: { backgroundColor: '#003322', borderColor: '#00cc66' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDesc: { color: '#ccc', fontSize: 14, flex: 1, marginRight: 8 },
  reward: { color: '#00cc66', fontWeight: 'bold', fontSize: 15 },
  rewardDone: { color: '#88ff88' },
  completedLabel: { color: '#00cc66', fontSize: 11, marginTop: 4 },

  infoBox: { backgroundColor: '#001a0d', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#004422' },
  infoText: { color: '#557755', fontSize: 12, lineHeight: 18 },

  closeBtn: { marginTop: 12, padding: 12, backgroundColor: '#003322', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#00cc66' },
  closeText: { color: '#00cc66', fontWeight: 'bold', fontSize: 16 },
});
