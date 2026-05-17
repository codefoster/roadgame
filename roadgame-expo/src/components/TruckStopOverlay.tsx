import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePersistentStore } from '../stores/persistentStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  scoreA: number;
  onFuelUp: () => void;
  onScoreBoost: () => void;
  onRestStop: () => void;
}

export default function TruckStopOverlay({ visible, onClose, scoreA, onFuelUp, onScoreBoost, onRestStop }: Props) {
  const { coins } = usePersistentStore();

  const [fuelBought, setFuelBought] = useState(false);
  const [boostBought, setBoostBought] = useState(false);
  const [restBought, setRestBought] = useState(false);

  const items = [
    {
      key: 'fuel',
      name: 'Fuel Up',
      desc: '+30 credits to your Watch balance',
      cost: 10,
      bought: fuelBought,
      onBuy: () => { setFuelBought(true); onFuelUp(); },
    },
    {
      key: 'boost',
      name: 'Score Boost',
      desc: '+40 pts (sightings) immediately',
      cost: 15,
      bought: boostBought,
      onBuy: () => { setBoostBought(true); onScoreBoost(); },
    },
    {
      key: 'rest',
      name: 'Rest Stop',
      desc: 'No credit decay for 90 seconds',
      cost: 8,
      bought: restBought,
      onBuy: () => { setRestBought(true); onRestStop(); },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Truck Stop</Text>
          <Text style={styles.subtitle}>Mile marker {scoreA} — take a break?</Text>
          <Text style={styles.coins}>{coins} coins</Text>

          <ScrollView>
            {items.map(item => {
              const canAfford = coins >= item.cost;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.item,
                    item.bought && styles.itemBought,
                    !canAfford && !item.bought && styles.itemDisabled,
                  ]}
                  onPress={() => {
                    if (!item.bought && canAfford) item.onBuy();
                  }}
                  disabled={item.bought || !canAfford}
                >
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={[styles.itemCost, !canAfford && !item.bought && styles.costInsufficient]}>
                      {item.bought ? '✓' : `${item.cost}¢`}
                    </Text>
                  </View>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Back on the Road</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1a1200', borderRadius: 12, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: '#ff9900' },
  title: { color: '#ff9900', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { color: '#cc7700', fontSize: 13, textAlign: 'center', marginBottom: 4 },
  coins: { color: '#fff', textAlign: 'center', marginBottom: 16 },

  item: {
    backgroundColor: '#2a1a00', borderRadius: 8,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#553300',
  },
  itemBought: { backgroundColor: '#1a2a00', borderColor: '#88cc00' },
  itemDisabled: { opacity: 0.4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  itemCost: { color: '#ff9900', fontWeight: 'bold', fontSize: 15 },
  costInsufficient: { color: '#f44' },
  itemDesc: { color: '#aaa', marginTop: 4, fontSize: 13 },

  closeBtn: { marginTop: 12, padding: 12, backgroundColor: '#332200', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff9900' },
  closeText: { color: '#ff9900', fontWeight: 'bold', fontSize: 16 },
});
