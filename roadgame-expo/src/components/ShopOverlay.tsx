import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHOP_ITEMS, SHOP_BUNDLES } from '../constants/game';
import { usePersistentStore } from '../stores/persistentStore';

interface Props {
  visible: boolean;
  onClose: () => void;
  purchases: string[];
  onPurchase: (id: string) => void;
}

export default function ShopOverlay({ visible, onClose, purchases, onPurchase }: Props) {
  const { coins, spendCoins, badges, badgeLevels, cbRadioGamesLeft, purchaseCbRadio, completedTrials, prestigedBadges } = usePersistentStore();
  const hasLeprechaun = badges.includes('leprechaun');
  const lepLevel = badgeLevels['leprechaun'] ?? 0;
  const lepBase = hasLeprechaun ? 3 + lepLevel * 2 + (completedTrials.includes('leprechaun') ? 2 : 0) : 0;
  const lepDiscount = lepBase + (prestigedBadges.includes('leprechaun') ? 1 : 0);

  const [flashSaleId, setFlashSaleId] = useState<string | null>(null);
  const [bundleIdx, setBundleIdx] = useState(0);
  const wasVisible = useRef(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      // Roll flash sale on open (33% chance)
      if (Math.random() < 0.33) {
        const eligible = SHOP_ITEMS.filter(i => i.id !== 'cb_radio' && !purchases.includes(i.id));
        if (eligible.length > 0) {
          setFlashSaleId(eligible[Math.floor(Math.random() * eligible.length)].id);
        } else {
          setFlashSaleId(null);
        }
      } else {
        setFlashSaleId(null);
      }
      // Pick random bundle to show
      setBundleIdx(Math.floor(Math.random() * SHOP_BUNDLES.length));
    }
    if (!visible) setFlashSaleId(null);
    wasVisible.current = visible;
  }, [visible]);

  function buyCbRadio(cost: number) {
    if (spendCoins(cost)) {
      purchaseCbRadio();
      onPurchase('cb_radio');
    }
  }

  function buyBundle(idx: number) {
    const bundle = SHOP_BUNDLES[idx];
    const cost = Math.max(0, bundle.cost - (hasLeprechaun ? 2 : 0));
    if (coins < cost) return;
    if (!spendCoins(cost)) return;
    for (const id of bundle.itemIds) {
      if (!purchases.includes(id)) {
        if (id === 'cb_radio') purchaseCbRadio();
        onPurchase(id);
      }
    }
  }

  const bundle = SHOP_BUNDLES[bundleIdx];
  const bundleCost = Math.max(0, bundle.cost - (hasLeprechaun ? 2 : 0));
  const bundleAlreadyOwned = bundle.itemIds.every(id =>
    purchases.includes(id) || (id === 'cb_radio' && cbRadioGamesLeft > 0)
  );
  const canAffordBundle = coins >= bundleCost;
  const bundleItems = bundle.itemIds.map(id => SHOP_ITEMS.find(i => i.id === id)!).filter(Boolean);
  const bundleSavings = bundleItems.reduce((sum, i) => sum + Math.max(0, i.baseCost - lepDiscount), 0) - bundleCost;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Shop</Text>
          <Text style={styles.coins}>{coins} coins</Text>
          {hasLeprechaun && <Text style={styles.discount}>Leprechaun: −{lepDiscount} coins on all items</Text>}

          <ScrollView>
            {/* Flash sale banner */}
            {flashSaleId && (() => {
              const flashItem = SHOP_ITEMS.find(i => i.id === flashSaleId)!;
              const baseCost = Math.max(0, flashItem.baseCost - lepDiscount);
              const flashCost = Math.max(1, Math.floor(baseCost * 0.60));
              const bought = purchases.includes(flashSaleId);
              const canAfford = coins >= flashCost;
              return (
                <TouchableOpacity
                  key="flash"
                  style={[styles.flashCard, bought && styles.itemBought, !canAfford && !bought && styles.itemDisabled]}
                  onPress={() => {
                    if (!bought && canAfford && spendCoins(flashCost)) {
                      onPurchase(flashSaleId);
                    }
                  }}
                  disabled={bought || !canAfford}
                >
                  <View style={styles.flashBadge}>
                    <Text style={styles.flashBadgeText}>⚡ FLASH SALE · 40% OFF</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemName}>{flashItem.name}</Text>
                    <View style={styles.flashPriceRow}>
                      <Text style={styles.flashOldPrice}>{baseCost}¢</Text>
                      <Text style={[styles.itemCost, { color: '#ffdd00' }]}>
                        {bought ? '✓' : `${flashCost}¢`}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemDesc}>{flashItem.description}</Text>
                </TouchableOpacity>
              );
            })()}

            {/* Regular items */}
            {SHOP_ITEMS.map(item => {
              if (item.id === flashSaleId) return null; // shown above
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
                      if (isCbRadio) buyCbRadio(cost);
                      else if (spendCoins(cost)) onPurchase(item.id);
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

            {/* Bundle deal */}
            <View style={styles.bundleCard}>
              <View style={styles.bundleHeader}>
                <Text style={styles.bundleLabel}>BUNDLE DEAL</Text>
                <Text style={styles.bundleSavings}>Save {bundleSavings > 0 ? bundleSavings : 0} coins</Text>
              </View>
              <Text style={styles.bundleName}>{bundle.name}</Text>
              <Text style={styles.bundleTagline}>{bundle.tagline}</Text>
              <View style={styles.bundleItems}>
                {bundleItems.map(bi => (
                  <Text key={bi.id} style={[styles.bundleItemText, purchases.includes(bi.id) && styles.bundleItemOwned]}>
                    {purchases.includes(bi.id) || (bi.id === 'cb_radio' && cbRadioGamesLeft > 0) ? '✓ ' : '· '}{bi.name}
                  </Text>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.bundleBtn, (bundleAlreadyOwned || !canAffordBundle) && styles.itemDisabled]}
                onPress={() => buyBundle(bundleIdx)}
                disabled={bundleAlreadyOwned || !canAffordBundle}
              >
                <Text style={styles.bundleBtnText}>
                  {bundleAlreadyOwned ? 'Already owned' : `Buy Bundle — ${bundleCost} coins`}
                </Text>
              </TouchableOpacity>
            </View>
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
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 20, maxHeight: '85%' },
  title: { color: '#ffd700', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  coins: { color: '#fff', textAlign: 'center', marginBottom: 4 },
  discount: { color: '#4caf50', fontSize: 12, textAlign: 'center', marginBottom: 12 },

  flashCard: {
    backgroundColor: '#1a1400', borderRadius: 8,
    padding: 14, marginBottom: 10,
    borderWidth: 2, borderColor: '#ffdd00',
  },
  flashBadge: {
    backgroundColor: '#ffdd00', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  flashBadgeText: { color: '#000', fontWeight: 'bold', fontSize: 11 },
  flashPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flashOldPrice: { color: '#888', fontSize: 13, textDecorationLine: 'line-through' },

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

  bundleCard: {
    backgroundColor: '#0d1a30', borderRadius: 8,
    padding: 14, marginTop: 4, marginBottom: 10,
    borderWidth: 1, borderColor: '#4488cc',
  },
  bundleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bundleLabel: { color: '#4488cc', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  bundleSavings: { color: '#4caf50', fontSize: 11, fontWeight: 'bold' },
  bundleName: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  bundleTagline: { color: '#888', fontSize: 12, marginBottom: 8 },
  bundleItems: { marginBottom: 10 },
  bundleItemText: { color: '#cce', fontSize: 13, marginBottom: 2 },
  bundleItemOwned: { color: '#4caf50' },
  bundleBtn: {
    backgroundColor: '#1a3a6a', padding: 10,
    borderRadius: 6, alignItems: 'center',
  },
  bundleBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  closeBtn: { marginTop: 12, padding: 12, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
