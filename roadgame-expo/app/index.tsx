import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { REGIONS, WEATHER, Region, Weather, BADGE_RIVALRIES } from '../src/constants/game';
import { usePersistentStore } from '../src/stores/persistentStore';
import ShopOverlay from '../src/components/ShopOverlay';
import BadgesOverlay from '../src/components/BadgesOverlay';
import RelicsOverlay from '../src/components/RelicsOverlay';

export default function StartScreen() {
  const router = useRouter();
  const { badges, badgeCooldowns, cbRadioGamesLeft } = usePersistentStore();

  const [weather, setWeather] = useState<Weather>('sunny');
  const [region, setRegion] = useState<Region>('forest');
  const [activeBadges, setActiveBadges] = useState<string[]>([]);
  const [purchases, setPurchases] = useState<string[]>([]);
  const [shopVisible, setShopVisible] = useState(false);
  const [badgesVisible, setBadgesVisible] = useState(false);
  const [relicsVisible, setRelicsVisible] = useState(false);

  function toggleBadge(id: string) {
    setActiveBadges(prev => {
      if (prev.includes(id)) return prev.filter(b => b !== id);
      if (prev.length >= 5) return prev;
      if ((badgeCooldowns[id] ?? 0) > 0) return prev;
      const rival = BADGE_RIVALRIES.find(pair => pair.includes(id));
      if (rival && prev.some(b => rival.includes(b) && b !== id)) return prev;
      return [...prev, id];
    });
  }

  function startGame() {
    const allPurchases = [...purchases];
    if (cbRadioGamesLeft > 0 && !allPurchases.includes('cb_radio')) {
      allPurchases.push('cb_radio');
    }
    router.push({
      pathname: '/game',
      params: {
        weather,
        region,
        activeBadges: activeBadges.join(','),
        purchases: allPurchases.join(','),
      },
    });
  }

  function startOnline() {
    router.push('/lobby');
  }

  return (
    <ScrollView style={styles.outer} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Road Game</Text>
      <Text style={styles.subtitle}>Spot things. Earn points. Survive.</Text>

      {/* Region selector */}
      <Text style={styles.label}>Region</Text>
      <View style={styles.selectorRow}>
        {REGIONS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.chip, region === r && styles.chipActive]}
            onPress={() => setRegion(r)}
          >
            <Text style={[styles.chipText, region === r && styles.chipTextActive]}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weather selector */}
      <Text style={styles.label}>Weather</Text>
      <View style={styles.selectorRow}>
        {WEATHER.map(w => (
          <TouchableOpacity
            key={w}
            style={[styles.chip, weather === w && styles.chipActive]}
            onPress={() => setWeather(w)}
          >
            <Text style={[styles.chipText, weather === w && styles.chipTextActive]}>
              {w.charAt(0).toUpperCase() + w.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active badges summary */}
      {activeBadges.length > 0 && (
        <Text style={styles.badgeSummary}>
          Badges: {activeBadges.join(', ')}
        </Text>
      )}

      {/* Main buttons */}
      <TouchableOpacity style={[styles.btn, styles.playBtn]} onPress={startGame}>
        <Text style={styles.btnText}>Play</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.onlineBtn]} onPress={startOnline}>
        <Text style={styles.btnText}>Online Play</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.shopBtn, { flex: 1, marginRight: 6 }]} onPress={() => setShopVisible(true)}>
          <Text style={styles.btnText}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.badgesBtn, { flex: 1, marginLeft: 6 }]}
          onPress={() => setBadgesVisible(true)}
          disabled={badges.length === 0}
        >
          <Text style={[styles.btnText, badges.length === 0 && { opacity: 0.4 }]}>Badges</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.btn, styles.relicsBtn]} onPress={() => setRelicsVisible(true)}>
        <Text style={styles.btnText}>Relics</Text>
      </TouchableOpacity>

      <ShopOverlay
        visible={shopVisible}
        onClose={() => setShopVisible(false)}
        purchases={purchases}
        onPurchase={(id) => setPurchases(prev => [...prev, id])}
      />

      <BadgesOverlay
        visible={badgesVisible}
        onClose={() => setBadgesVisible(false)}
        activeBadges={activeBadges}
        onToggle={toggleBadge}
      />

      <RelicsOverlay
        visible={relicsVisible}
        onClose={() => setRelicsVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: '#0d0d1a' },
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: '#4a9eff', fontSize: 42, fontWeight: 'bold',
    textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    color: '#666', fontSize: 14, textAlign: 'center', marginBottom: 32,
  },
  label: { color: '#888', fontSize: 12, marginBottom: 6 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 8 },
  selectorContent: { alignItems: 'center', paddingRight: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#334',
    marginRight: 8, backgroundColor: '#111',
  },
  chipActive: { backgroundColor: '#4a9eff', borderColor: '#4a9eff' },
  chipText: { color: '#888', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  badgeSummary: { color: '#ffd700', fontSize: 12, textAlign: 'center', marginBottom: 12 },
  btn: {
    padding: 16, borderRadius: 10,
    alignItems: 'center', marginBottom: 12,
  },
  playBtn: { backgroundColor: '#1a4a1a' },
  onlineBtn: { backgroundColor: '#1a1a4a' },
  shopBtn: { backgroundColor: '#4a3a00' },
  badgesBtn: { backgroundColor: '#3a004a' },
  relicsBtn: { backgroundColor: '#1a3a3a' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  row: { flexDirection: 'row' },
});
