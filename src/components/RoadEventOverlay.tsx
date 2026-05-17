import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../stores/gameStore';

interface Props {
  onGasStation: (stop: boolean) => void;
  onShortcut: (take: boolean) => void;
  onMarket: (trade: boolean) => void;
  onMountainPass: (take: boolean) => void;
  coins: number;
  credits: number;
}

export default function RoadEventOverlay({ onGasStation, onShortcut, onMarket, onMountainPass, coins, credits }: Props) {
  const { roadEventId } = useGameStore();

  if (roadEventId === 'gas_station') {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>⛽</Text>
            <Text style={styles.title}>Gas Station</Text>
            <Text style={styles.desc}>Fill up and stretch your legs?</Text>
            <TouchableOpacity style={[styles.btn, styles.yesBtn]} onPress={() => onGasStation(true)}>
              <Text style={styles.btnText}>Stop (−10 credits, +25 pts)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={() => onGasStation(false)}>
              <Text style={styles.btnText}>Drive Past</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (roadEventId === 'shortcut') {
    const canAfford = coins >= 8;
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>🗺️</Text>
            <Text style={styles.title}>Shortcut!</Text>
            <Text style={styles.desc}>A faster route branches off ahead.</Text>
            <TouchableOpacity
              style={[styles.btn, styles.yesBtn, !canAfford && styles.disabled]}
              onPress={() => canAfford && onShortcut(true)}
            >
              <Text style={styles.btnText}>Take it (−8 coins, +30 pts){!canAfford ? ' — need 8 coins' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={() => onShortcut(false)}>
              <Text style={styles.btnText}>Stay on Road</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (roadEventId === 'market') {
    const canTrade = credits >= 20;
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>🏪</Text>
            <Text style={styles.title}>Roadside Market</Text>
            <Text style={styles.desc}>A vendor waves you down — trades credits for coins.</Text>
            <TouchableOpacity
              style={[styles.btn, styles.yesBtn, !canTrade && styles.disabled]}
              onPress={() => canTrade && onMarket(true)}
            >
              <Text style={styles.btnText}>Trade (−20 credits, +8 coins){!canTrade ? ' — need 20 credits' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={() => onMarket(false)}>
              <Text style={styles.btnText}>Drive Past</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (roadEventId === 'mountain_pass') {
    const canAfford = coins >= 5;
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.emoji}>⛰️</Text>
            <Text style={styles.title}>Mountain Pass</Text>
            <Text style={styles.desc}>A high road with remarkable sightings — if you can navigate it.</Text>
            <TouchableOpacity
              style={[styles.btn, styles.yesBtn, !canAfford && styles.disabled]}
              onPress={() => canAfford && onMountainPass(true)}
            >
              <Text style={styles.btnText}>Take the Pass (−5 coins, L3 power-up){!canAfford ? ' — need 5 coins' : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.noBtn]} onPress={() => onMountainPass(false)}>
              <Text style={styles.btnText}>Stay on Road</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 32 },
  card:      { backgroundColor: '#1e2a3a', borderRadius: 12, padding: 20, alignItems: 'center' },
  emoji:     { fontSize: 36, marginBottom: 6 },
  title:     { color: '#ffd700', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  desc:      { color: '#aaa', marginBottom: 16, textAlign: 'center' },
  btn:       { width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  yesBtn:    { backgroundColor: '#2d6a2d' },
  noBtn:     { backgroundColor: '#444' },
  disabled:  { opacity: 0.4 },
  btnText:   { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
