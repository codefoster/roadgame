import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHOP_ITEMS } from '../constants/game';
import { usePersistentStore } from '../stores/persistentStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  purchases: string[];
  onPurchase: (id: string) => void;
}

export default function ShopOverlay({ visible, onClose, purchases, onPurchase }: Props) {
  const { coins, spendCoins, badges, badgeLevels, cbRadioGamesLeft, purchaseCbRadio } = usePersistentStore();
  const hasLeprechaun = badges.includes('leprechaun');
  const lepLevel = badgeLevels['leprechaun'] ?? 0;
  const lepDiscount = hasLeprechaun ? 3 + lepLevel * 2 : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Shop</Text>
          <Text style={styles.coins}>{coins} coins</Text>
          {hasLeprechaun && <Text style={styles.discount}>Leprechaun: −3 coins on all items</Text>}

          <ScrollView>
            {SHOP_ITEMS.map(item => {
              const cost = Math.max(0, item.baseCost - lepDiscount);
              const bought = purchases.includes(item.id);
              const isCbRadio = item.id === 'cb_radio';
              const cbActive = isCbRadio && cbRadioGamesLeft > 0;
              const effectiveBought = bought || cbActive;
              const canAfford = coins >= cost;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.item, effectiveBought && styles.itemBought, !canAfford && !effectiveBought && styles.itemDisabled]}
                  onPress={() => {
                    if (!effectiveBought && canAfford) {
                      if (spendCoins(cost)) {
                        if (isCbRadio) purchaseCbRadio();
                        onPurchase(item.id);
                      }
                    }
                  }}
                  disabled={effectiveBought || !canAfford}
                >
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={[styles.itemCost, !canAfford && styles.costInsufficient]}>
                      {cbActive ? `✓ (${cbRadioGamesLeft} games)` : effectiveBought ? '✓' : `${cost}¢`}
                    </Text>
                  </View>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </TouchableOpacity>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20, maxHeight: '80%' },
  title: { color: '#ffd700', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  coins: { color: '#fff', textAlign: 'center', marginBottom: 4 },
  discount: { color: '#4caf50', fontSize: 12, textAlign: 'center', marginBottom: 12 },
  item: {
    backgroundColor: '#0d1a2e', borderRadius: 8,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#334',
  },
  itemBought: { backgroundColor: '#0d2e0d', borderColor: '#4caf50' },
  itemDisabled: { opacity: 0.4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  itemCost: { color: '#ffd700', fontWeight: 'bold', fontSize: 15 },
  costInsufficient: { color: '#f44' },
  itemDesc: { color: '#aaa', marginTop: 4, fontSize: 13 },
  closeBtn: { marginTop: 12, padding: 12, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
