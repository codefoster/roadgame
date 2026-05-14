import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BADGE_MASTERY_THRESHOLD, RELIC_UPGRADE_COSTS } from '../constants/game';

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
  setBadgeCooldown: (id: string, games: number) => void;
  tickCooldowns: () => void;
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
    }),
    {
      name: 'roadgame-save',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
