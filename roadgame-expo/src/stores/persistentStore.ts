import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PersistentState {
  coins: number;
  coinFloor: number;
  badges: string[];
  badgeCooldowns: Record<string, number>;
  badgeLevels: Record<string, number>;

  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  setCoinFloor: (n: number) => void;
  earnBadge: (id: string) => void;
  upgradeBadge: (id: string) => boolean; // returns false if can't afford
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
    }),
    {
      name: 'roadgame-save',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
