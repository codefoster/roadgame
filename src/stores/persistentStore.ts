import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGE_MASTERY_THRESHOLD, RELIC_UPGRADE_COSTS, RELIC_CRAFT_COST } from '../constants/game';

interface PersistentState {
  coins: number;
  coinFloor: number;
  badges: string[];
  badgeCooldowns: Record<string, number>;
  badgeLevels: Record<string, number>;
  cbRadioGamesLeft: number;
  badgeUseCounts: Record<string, number>;
  masteredBadges: string[];
  completedTrials: string[];
  relicLevels: Record<string, number>;
  prestigedBadges: string[];
  ownedRelics: Record<string, number>;
  unlockedCrew: string[];

  // Feature 7: Daily Challenges
  dailyDate: string;
  dailyCompleted: number[];

  // Feature 10: Prestige
  lifetimeScore: number;
  prestigeMilestone: boolean;
  prestigeStars: number;
  prestigeLegend: boolean;
  prestigeCoins: number;
  prestigeShopItems: string[];

  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  setCoinFloor: (n: number) => void;
  earnBadge: (id: string) => void;
  purchaseCbRadio: () => void;
  tickCbRadio: () => void;
  recordBadgeUse: (ids: string[]) => void;
  completeTrial: (id: string) => void;
  upgradeBadge: (id: string) => boolean;
  upgradeRelic: (id: string) => boolean;
  prestigeBadge: (id: string) => void;
  addOwnedRelic: (id: string) => void;
  craftRelic: (id: string) => boolean;
  unlockCrew: (id: string) => void;
  setBadgeCooldown: (id: string, games: number) => void;
  tickCooldowns: () => void;

  // Feature 7: Daily Challenges actions
  completeDailyChallenge: (idx: number) => void;
  resetDailyIfNeeded: () => string;

  // Feature 10: Prestige actions
  addLifetimeScore: (n: number) => void;
  addPrestigeStar: () => void;
  setPrestigeLegend: () => void;
  addPrestigeCoins: (n: number) => void;
  spendPrestigeCoins: (n: number) => boolean;
  buyPrestigeShopItem: (key: string) => void;
}

export const usePersistentStore = create<PersistentState>()(
  persist(
    (set, get) => ({
      coins: 0,
      coinFloor: 0,
      badges: [],
      badgeCooldowns: {},
      badgeLevels: {},
      cbRadioGamesLeft: 0,
      badgeUseCounts: {},
      masteredBadges: [],
      completedTrials: [],
      relicLevels: {},
      prestigedBadges: [],
      ownedRelics: {},
      unlockedCrew: [],
      dailyDate: '',
      dailyCompleted: [],
      lifetimeScore: 0,
      prestigeMilestone: false,
      prestigeStars: 0,
      prestigeLegend: false,
      prestigeCoins: 0,
      prestigeShopItems: [],

      addCoins: (n) => set((s) => ({ coins: s.coins + n })),

      spendCoins: (n) => {
        const { coins, coinFloor } = get();
        if (coins < n) return false;
        if (coins - n < coinFloor) return false;
        set((s) => ({ coins: s.coins - n }));
        return true;
      },

      setCoinFloor: (n) => set({ coinFloor: n }),

      earnBadge: (id) =>
        set((s) => ({
          badges: s.badges.includes(id) ? s.badges : [...s.badges, id],
        })),

      upgradeBadge: (id) => {
        const { badgeLevels, coins, spendCoins } = get();
        const currentLevel = badgeLevels[id] ?? 0;
        if (currentLevel >= 3) return false;
        const costs = [500, 750, 1000];
        const cost = costs[currentLevel];
        if (coins < cost) return false;
        spendCoins(cost);
        set((s) => ({ badgeLevels: { ...s.badgeLevels, [id]: currentLevel + 1 } }));
        return true;
      },

      setBadgeCooldown: (id, games) =>
        set((s) => ({ badgeCooldowns: { ...s.badgeCooldowns, [id]: games } })),

      tickCooldowns: () =>
        set((s) => {
          const updated = { ...s.badgeCooldowns };
          for (const id of Object.keys(updated)) {
            updated[id] = Math.max(0, updated[id] - 1);
          }
          return { badgeCooldowns: updated };
        }),

      purchaseCbRadio: () => set({ cbRadioGamesLeft: 3 }),
      tickCbRadio: () => set((s) => ({ cbRadioGamesLeft: Math.max(0, s.cbRadioGamesLeft - 1) })),

      recordBadgeUse: (ids) => set((s) => {
        const counts = { ...s.badgeUseCounts };
        const mastered = [...s.masteredBadges];
        for (const id of ids) {
          counts[id] = (counts[id] ?? 0) + 1;
          if (counts[id] >= BADGE_MASTERY_THRESHOLD && !mastered.includes(id)) mastered.push(id);
        }
        return { badgeUseCounts: counts, masteredBadges: mastered };
      }),

      completeTrial: (id) => set((s) => ({
        completedTrials: s.completedTrials.includes(id) ? s.completedTrials : [...s.completedTrials, id],
      })),

      prestigeBadge: (id) => set((s) => ({
        prestigedBadges: s.prestigedBadges.includes(id) ? s.prestigedBadges : [...s.prestigedBadges, id],
        badgeUseCounts: { ...s.badgeUseCounts, [id]: 0 },
        masteredBadges: s.masteredBadges.filter(b => b !== id),
      })),

      upgradeRelic: (id) => {
        const { relicLevels, coins, spendCoins } = get();
        const currentLevel = relicLevels[id] ?? 0;
        if (currentLevel >= 2) return false;
        const cost = RELIC_UPGRADE_COSTS[currentLevel];
        if (coins < cost) return false;
        spendCoins(cost);
        set((s) => ({ relicLevels: { ...s.relicLevels, [id]: currentLevel + 1 } }));
        return true;
      },

      addOwnedRelic: (id) => set((s) => ({
        ownedRelics: { ...s.ownedRelics, [id]: (s.ownedRelics[id] ?? 0) + 1 },
      })),

      craftRelic: (id) => {
        const { ownedRelics, relicLevels, spendCoins } = get();
        const owned = ownedRelics[id] ?? 0;
        const level = relicLevels[id] ?? 0;
        if (owned < 2 || level >= 2) return false;
        if (!spendCoins(RELIC_CRAFT_COST)) return false;
        set((s) => ({
          ownedRelics: { ...s.ownedRelics, [id]: (s.ownedRelics[id] ?? 0) - 2 },
          relicLevels: { ...s.relicLevels, [id]: level + 1 },
        }));
        return true;
      },

      unlockCrew: (id) => set((s) => ({
        unlockedCrew: s.unlockedCrew.includes(id) ? s.unlockedCrew : [...s.unlockedCrew, id],
      })),

      completeDailyChallenge: (idx) => set((s) => ({
        dailyCompleted: s.dailyCompleted.includes(idx) ? s.dailyCompleted : [...s.dailyCompleted, idx],
      })),

      resetDailyIfNeeded: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { dailyDate } = get();
        if (dailyDate !== today) {
          set({ dailyDate: today, dailyCompleted: [] });
        }
        return today;
      },

      addLifetimeScore: (n) => set((s) => {
        const newTotal = s.lifetimeScore + n;
        return {
          lifetimeScore: newTotal,
          prestigeMilestone: s.prestigeMilestone || newTotal >= 50000,
        };
      }),

      addPrestigeStar: () => set((s) => ({
        prestigeStars: s.prestigeStars < 5 ? s.prestigeStars + 1 : s.prestigeStars,
      })),

      setPrestigeLegend: () => set({ prestigeLegend: true }),

      addPrestigeCoins: (n) => set((s) => ({ prestigeCoins: s.prestigeCoins + n })),

      spendPrestigeCoins: (n) => {
        const { prestigeCoins } = get();
        if (prestigeCoins < n) return false;
        set((s) => ({ prestigeCoins: s.prestigeCoins - n }));
        return true;
      },

      buyPrestigeShopItem: (key) => set((s) => ({
        prestigeShopItems: s.prestigeShopItems.includes(key) ? s.prestigeShopItems : [...s.prestigeShopItems, key],
      })),
    }),
    {
      name: 'roadgame-save',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
