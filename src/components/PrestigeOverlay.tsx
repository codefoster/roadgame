import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePersistentStore } from '../stores/persistentStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const STAR_PASSIVES = [
  '+5 starting credits each game',
  'Watch ticks 10% faster',
  '+3 bonus coins at end of each game',
  'Flash events 20% less frequent',
  'Timed power-up effects last 25% longer',
];

const PRESTIGE_SHOP = [
  { key: 'iron_grip',  name: 'Iron Grip',  cost: 3,  desc: 'Credits can never drop below 5 via decay' },
  { key: 'long_haul',  name: 'Long Haul',  cost: 5,  desc: 'Decay starts at 1500 pts instead of 1000' },
  { key: 'scouts_eye', name: "Scout's Eye", cost: 7,  desc: 'Every Spot awards +1 extra pt' },
  { key: 'ace_driver', name: 'Ace Driver', cost: 10, desc: 'Start every game with a random L2 power-up already in queue' },
];

export default function PrestigeOverlay({ visible, onClose }: Props) {
  const persist = usePersistentStore();

  const {
    lifetimeScore, prestigeMilestone, prestigeStars,
    prestigeLegend, prestigeCoins, prestigeShopItems,
    spendPrestigeCoins, buyPrestigeShopItem,
  } = persist;

  function buyShopItem(key: string, cost: number) {
    if (prestigeShopItems.includes(key)) return;
    if (!spendPrestigeCoins(cost)) return;
    buyPrestigeShopItem(key);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Prestige</Text>
          <Text style={styles.subtitle}>Permanent cross-game upgrades</Text>

          <ScrollView>
            {/* Track 1: Lifetime Score */}
            <View style={styles.track}>
              <Text style={styles.trackTitle}>Track 1 — Lifetime Score</Text>
              <Text style={styles.trackProgress}>
                {lifetimeScore.toLocaleString()} / 50,000 pts
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (lifetimeScore / 50000) * 100)}%` }]} />
              </View>
              <Text style={[styles.trackReward, prestigeMilestone && styles.trackRewardDone]}>
                {prestigeMilestone ? '✓ Unlocked:' : 'Reward:'} +10% to all Spot point awards
              </Text>
            </View>

            {/* Track 2: High Score Stars */}
            <View style={styles.track}>
              <Text style={styles.trackTitle}>Track 2 — High Score Stars</Text>
              <Text style={styles.trackProgress}>
                {prestigeStars} / 5 stars (score 1500+ in a single game)
              </Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Text key={i} style={[styles.star, i < prestigeStars && styles.starEarned]}>★</Text>
                ))}
              </View>
              {STAR_PASSIVES.map((passive, i) => (
                <Text key={i} style={[styles.starPassive, i < prestigeStars && styles.starPassiveActive]}>
                  {i < prestigeStars ? '✓' : `★${i + 1}`} {passive}
                </Text>
              ))}
            </View>

            {/* Track 3: Full Legend */}
            <View style={styles.track}>
              <Text style={styles.trackTitle}>Track 3 — Full Legend</Text>
              <Text style={styles.trackProgress}>
                Earn all 20 badges and upgrade each to level 3
              </Text>
              <Text style={[styles.trackReward, prestigeLegend && styles.trackRewardDone]}>
                {prestigeLegend ? '✓ Unlocked:' : 'Reward:'} Legend Badge — +1 pt per Spot (always active)
              </Text>
            </View>

            {/* Track 4: Prestige Economy */}
            <View style={styles.track}>
              <Text style={styles.trackTitle}>Track 4 — Prestige Economy</Text>
              <Text style={styles.trackProgress}>
                {prestigeCoins} Prestige Coins (earn 1 by scoring 700+ pts in a game)
              </Text>
              <Text style={styles.shopLabel}>Prestige Shop</Text>
              {PRESTIGE_SHOP.map(item => {
                const bought = prestigeShopItems.includes(item.key);
                const canAfford = prestigeCoins >= item.cost;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.shopItem,
                      bought && styles.shopItemBought,
                      !canAfford && !bought && styles.shopItemDisabled,
                    ]}
                    onPress={() => buyShopItem(item.key, item.cost)}
                    disabled={bought || !canAfford}
                  >
                    <View style={styles.shopItemRow}>
                      <Text style={styles.shopItemName}>{item.name}</Text>
                      <Text style={[styles.shopItemCost, !canAfford && !bought && styles.costInsufficient]}>
                        {bought ? '✓' : `${item.cost}P`}
                      </Text>
                    </View>
                    <Text style={styles.shopItemDesc}>{item.desc}</Text>
                  </TouchableOpacity>
                );
              })}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#0d0020', borderRadius: 12, padding: 20, maxHeight: '90%', borderWidth: 1, borderColor: '#8833ff' },
  title: { color: '#8833ff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  subtitle: { color: '#5522aa', fontSize: 12, textAlign: 'center', marginBottom: 16 },

  track: {
    backgroundColor: '#130028', borderRadius: 8,
    padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#331166',
  },
  trackTitle: { color: '#aa66ff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  trackProgress: { color: '#888', fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: '#220044', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#8833ff', borderRadius: 3 },
  trackReward: { color: '#666', fontSize: 13 },
  trackRewardDone: { color: '#bb88ff' },

  starsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  star: { color: '#333', fontSize: 22 },
  starEarned: { color: '#8833ff' },
  starPassive: { color: '#555', fontSize: 12, marginBottom: 2 },
  starPassiveActive: { color: '#aa66ff' },

  shopLabel: { color: '#8833ff', fontWeight: 'bold', fontSize: 13, marginTop: 4, marginBottom: 8 },
  shopItem: {
    backgroundColor: '#1a0033', borderRadius: 8,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#441188',
  },
  shopItemBought: { backgroundColor: '#0d1a00', borderColor: '#88cc00' },
  shopItemDisabled: { opacity: 0.4 },
  shopItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopItemName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  shopItemCost: { color: '#8833ff', fontWeight: 'bold', fontSize: 14 },
  costInsufficient: { color: '#f44' },
  shopItemDesc: { color: '#888', fontSize: 12, marginTop: 4 },

  closeBtn: { marginTop: 12, padding: 12, backgroundColor: '#1a0033', borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#8833ff' },
  closeText: { color: '#8833ff', fontWeight: 'bold', fontSize: 16 },
});
