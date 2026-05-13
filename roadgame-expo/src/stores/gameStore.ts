import { create } from 'zustand';
import { Region, Weather, BINGO_STANDARD, BINGO_REGIONS } from '../constants/game';
import { pickRandom, randInt } from '../lib/gameLogic';

export interface FlashChallenge {
  type: 'spot3' | 'watch_credits' | 'earn_l2';
  target: number;
  progress: number;
  deadline: number; // Date.now() + duration ms
}

export interface GameState {
  // Core
  scoreA: number;       // sightings
  scoreB: number;       // credits
  pendingB: number;     // credits accumulating during watch
  stackHoldCount: number;

  // Buttons
  bWatching: boolean;
  toggleMode: 'hold' | 'tap';

  // Power-ups list (earned, not yet used)
  powerups: string[];

  // Active effects
  doublePoints: boolean;
  doublePointsExpiry: number;
  grassVisible: boolean;
  grassOn: boolean;
  grassExpiry: number;
  nextACKeepB: boolean;
  nextAAllIn: boolean;
  jackpotHold: boolean;
  stackHold: boolean;
  luckyRoll: boolean;
  powerSurge: boolean;
  infiniteCredits: boolean;
  infiniteExpiry: number;

  // Flash system
  flashVisible: boolean;
  flashText: string;
  flashColor: string;
  flashChallenge: FlashChallenge | null;
  // Bingo
  bingoCard: string[];
  bingoMarked: boolean[];
  goldenTiles: number[]; // 1-3 indices that are golden
  bingoDone: boolean;

  // Alphabet hunt
  alphaFound: boolean[]; // 26 letters
  alphaVisible: boolean;

  // Tourist
  touristVisible: boolean;
  touristId: string | null;

  // Hitchhiker
  hitchhikerVisible: boolean;
  hitchhikerId: string | null;
  hGeologist: boolean;
  hBirdwatcher: boolean;
  hTrucker: boolean;
  hDJ: boolean;
  hWatchDouble: boolean;
  hHunter: boolean;
  hitchhikerExpiry: number;

  // Boss
  bossVisible: boolean;
  bossId: string | null;

  // CB Radio
  nextBadgeId: string | null;

  // Rival
  rivalScore: number;
  rivalFrozenTurns: number;
  rivalSkipCount: number; // remaining rival-chill actions to skip

  // Patrol
  patrolVisible: boolean;

  // Meta
  weather: Weather;
  region: Region;
  activeBadges: string[];
  spotCount: number;
  dragonFlashesUsed: number;
  lockedThresholds: number[];
  aggressionLog: number[]; // timestamps of aggressive presses

  // Multiplayer
  mpOpponentScore: number;
  mpTimeLeft: number;       // seconds remaining in timed match; 0 when not active
  mpResult: 'win' | 'lose' | 'tie' | null;
  mpZapped: boolean;        // opponent zapped us; can't spot for 5s

  // Shop one-time flags
  spareTireUsed: boolean;

  // Road events
  roadEventId: string | null;
  roadEventExpiry: number; // ms timestamp; 0 for interactive events

  // Shop bonuses applied at game start
  headStart: boolean;
  creditBoost: boolean;
}

type GameActions = {
  initGame: (opts: {
    weather: Weather;
    region: Region;
    activeBadges: string[];
    purchases: string[];
  }) => void;
  setScoreA: (n: number) => void;
  addScoreA: (n: number) => void;
  setScoreB: (n: number) => void;
  addScoreB: (n: number) => void;
  setPendingB: (n: number) => void;
  addPendingB: (n: number) => void;
  commitPendingB: () => void;
  setBWatching: (v: boolean) => void;
  setToggleMode: (m: 'hold' | 'tap') => void;
  addPowerup: (code: string) => void;
  removePowerup: (code: string) => void;
  rerollTopPowerup: (region: Region) => void;
  setEffect: (effect: Partial<Pick<GameState,
    'doublePoints' | 'doublePointsExpiry' | 'grassVisible' | 'grassOn' | 'grassExpiry' |
    'nextACKeepB' | 'nextAAllIn' | 'jackpotHold' |
    'stackHold' | 'luckyRoll' | 'powerSurge' | 'infiniteCredits' | 'infiniteExpiry' |
    'stackHoldCount'
  >>) => void;
  setFlash: (text: string, color: string) => void;
  clearFlash: () => void;
  setFlashChallenge: (c: FlashChallenge | null) => void;
  updateChallengeProgress: (delta: number) => void;
  markBingo: (idx: number) => void;
  resetBingo: () => void;
  setAlphaFound: (idx: number) => void;
  setAlphaVisible: (v: boolean) => void;
  setTourist: (id: string | null) => void;
  setHitchhiker: (id: string | null, expiry?: number) => void;
  clearHitchhikerEffects: () => void;
  setBoss: (id: string | null) => void;
  setNextBadge: (id: string | null) => void;
  setRivalScore: (n: number) => void;
  setRivalFrozenTurns: (n: number) => void;
  decrementRivalSkip: () => void;
  setPatrolVisible: (v: boolean) => void;
  setMpOpponentScore: (n: number) => void;
  setMpTimeLeft: (n: number) => void;
  setMpResult: (r: 'win' | 'lose' | 'tie' | null) => void;
  setMpZapped: (v: boolean) => void;
  logAggression: () => void;
  markFlashBlockUsed: () => void;
  addLockedThreshold: (t: number) => void;
  setRoadEvent: (id: string | null, expiry?: number) => void;
  useSpareTire: () => void;
};

function makeBingoCard(region: Region): string[] {
  const pool = [...BINGO_REGIONS[region]];
  const standard = [...BINGO_STANDARD];
  // shuffle and pick 9 from a mixed pool
  const combined = [...pool, ...standard];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.slice(0, 9);
}

function pickGoldenTiles(): number[] {
  const count = 1 + Math.floor(Math.random() * 3); // 1, 2, or 3
  const indices = Array.from({ length: 9 }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, count);
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // ── initial state ──
  scoreA: 0, scoreB: 0, pendingB: 0, stackHoldCount: 0,
  bWatching: false, toggleMode: 'tap',
  powerups: [],
  doublePoints: false, doublePointsExpiry: 0,
  grassVisible: false, grassOn: false, grassExpiry: 0,
  nextACKeepB: false,
  nextAAllIn: false, jackpotHold: false, stackHold: false,
  luckyRoll: false, powerSurge: false,
  infiniteCredits: false, infiniteExpiry: 0,
  flashVisible: false, flashText: '', flashColor: '#fff',
  flashChallenge: null,
  bingoCard: [], bingoMarked: new Array(9).fill(false),
  goldenTiles: [], bingoDone: false,
  alphaFound: new Array(26).fill(false), alphaVisible: false,
  touristVisible: false, touristId: null,
  hitchhikerVisible: false, hitchhikerId: null,
  hGeologist: false, hBirdwatcher: false, hTrucker: false,
  hDJ: false, hWatchDouble: false, hHunter: false, hitchhikerExpiry: 0,
  bossVisible: false, bossId: null,
  nextBadgeId: null,
  rivalScore: 0, rivalFrozenTurns: 0, rivalSkipCount: 0,
  patrolVisible: false,
  weather: 'sunny', region: 'forest', activeBadges: [],
  spotCount: 0, dragonFlashesUsed: 0, lockedThresholds: [],
  aggressionLog: [], mpOpponentScore: 0, mpTimeLeft: 0, mpResult: null, mpZapped: false,
  spareTireUsed: false,
  roadEventId: null, roadEventExpiry: 0,
  headStart: false, creditBoost: false,

  // ── actions ──
  initGame: ({ weather, region, activeBadges, purchases }) => {
    const bingoCard = makeBingoCard(region);
    const goldenTiles = pickGoldenTiles();
    const scoreA = purchases.includes('head_start') ? 50 : 0;
    const scoreB = purchases.includes('credit_boost') ? 25 : 0;
    const rivalSkipCount = purchases.includes('rival_chill') ? 5 : 0;

    const bingoMarked = new Array(9).fill(false) as boolean[];
    if (purchases.includes('golden_touch')) {
      goldenTiles.slice(0, 2).forEach(idx => { bingoMarked[idx] = true; });
    }

    set({
      scoreA, scoreB, pendingB: 0, stackHoldCount: 0,
      bWatching: false, toggleMode: 'tap',
      powerups: [],
      doublePoints: false, doublePointsExpiry: 0,
      grassVisible: false, grassOn: false, grassExpiry: 0,
      nextACKeepB: false,
      nextAAllIn: false, jackpotHold: false, stackHold: false,
      luckyRoll: false, powerSurge: false,
      infiniteCredits: false, infiniteExpiry: 0,
      flashVisible: false, flashText: '', flashColor: '#fff',
      flashChallenge: null,
      bingoCard, bingoMarked,
      goldenTiles, bingoDone: false,
      alphaFound: new Array(26).fill(false), alphaVisible: false,
      touristVisible: false, touristId: null,
      hitchhikerVisible: false, hitchhikerId: null,
      hGeologist: false, hBirdwatcher: false, hTrucker: false,
      hDJ: false, hWatchDouble: false, hitchhikerExpiry: 0,
      rivalScore: purchases.includes('rival_decoy') ? -30 : 0, rivalFrozenTurns: 0, rivalSkipCount,
      patrolVisible: false,
      weather, region, activeBadges,
      spotCount: 0, dragonFlashesUsed: 0, lockedThresholds: [],
      aggressionLog: [], mpOpponentScore: 0, mpTimeLeft: 0, mpResult: null, mpZapped: false,
      spareTireUsed: false,
      roadEventId: null, roadEventExpiry: 0,
      nextBadgeId: null,
      headStart: purchases.includes('head_start'),
      creditBoost: purchases.includes('credit_boost'),
    });
  },

  setScoreA: (n) => set({ scoreA: n }),
  addScoreA: (n) => set((s) => ({ scoreA: Math.max(0, s.scoreA + n) })),
  setScoreB: (n) => set({ scoreB: Math.max(0, n) }),
  addScoreB: (n) => set((s) => ({ scoreB: Math.max(0, s.scoreB + n) })),
  setPendingB: (n) => set({ pendingB: n }),
  addPendingB: (n) => set((s) => ({ pendingB: s.pendingB + n })),

  commitPendingB: () => set((s) => ({
    scoreB: s.scoreB + s.pendingB,
    pendingB: 0,
    stackHoldCount: 0,
  })),

  setBWatching: (v) => set({ bWatching: v }),
  setToggleMode: (m) => set({ toggleMode: m }),

  addPowerup: (code) => set((s) => ({ powerups: [...s.powerups, code] })),
  removePowerup: (code) => set((s) => {
    const idx = s.powerups.indexOf(code);
    if (idx === -1) return {};
    const p = [...s.powerups];
    p.splice(idx, 1);
    return { powerups: p };
  }),
  rerollTopPowerup: (region) => set((s) => {
    if (s.powerups.length === 0) return {};
    const top = s.powerups[0];
    const tier = parseInt(top[0]) as 1 | 2 | 3;
    const subs = ['a','b','c','d','e'];
    const newSub = pickRandom(subs);
    const newCode = `${tier}${newSub}`;
    return { powerups: [newCode, ...s.powerups.slice(1)] };
  }),

  setEffect: (effect) => set(effect),

  setFlash: (text, color) => set({ flashVisible: true, flashText: text, flashColor: color }),
  clearFlash: () => set({ flashVisible: false, flashText: '', flashChallenge: null }),
  setFlashChallenge: (c) => set({ flashChallenge: c }),
  updateChallengeProgress: (delta) => set((s) => {
    if (!s.flashChallenge) return {};
    return { flashChallenge: { ...s.flashChallenge, progress: s.flashChallenge.progress + delta } };
  }),
  markBingo: (idx) => set((s) => {
    const marked = [...s.bingoMarked];
    marked[idx] = true;
    return { bingoMarked: marked };
  }),
  resetBingo: () => set((s) => ({
    bingoCard: makeBingoCard(s.region),
    bingoMarked: new Array(9).fill(false),
    goldenTiles: pickGoldenTiles(),
    bingoDone: false,
  })),

  setAlphaFound: (idx) => set((s) => {
    const found = [...s.alphaFound];
    found[idx] = true;
    return { alphaFound: found };
  }),
  setAlphaVisible: (v) => set({ alphaVisible: v }),

  setTourist: (id) => set({ touristVisible: id !== null, touristId: id }),

  setHitchhiker: (id, expiry = 0) => {
    if (!id) {
      set({ hitchhikerVisible: false, hitchhikerId: null });
      return;
    }
    set({
      hitchhikerVisible: true,
      hitchhikerId: id,
      hitchhikerExpiry: expiry,
      hGeologist: id === 'geologist',
      hBirdwatcher: id === 'birdwatcher',
      hTrucker: id === 'trucker',
      hDJ: id === 'dj',
      hWatchDouble: id === 'conspiracy',
      hHunter: id === 'hunter',
    });
  },
  clearHitchhikerEffects: () => set({
    hGeologist: false, hBirdwatcher: false,
    hTrucker: false, hDJ: false, hWatchDouble: false, hHunter: false,
  }),
  setBoss: (id) => set({ bossVisible: id !== null, bossId: id }),
  setNextBadge: (id) => set({ nextBadgeId: id }),

  setRivalScore: (n) => set({ rivalScore: n }),
  setRivalFrozenTurns: (n) => set({ rivalFrozenTurns: n }),
  decrementRivalSkip: () => set((s) => ({ rivalSkipCount: Math.max(0, s.rivalSkipCount - 1) })),

  setPatrolVisible: (v) => set({ patrolVisible: v }),
  setMpOpponentScore: (n) => set({ mpOpponentScore: n }),
  setMpTimeLeft: (n) => set({ mpTimeLeft: n }),
  setMpResult: (r) => set({ mpResult: r }),
  setMpZapped: (v) => set({ mpZapped: v }),

  logAggression: () => set((s) => {
    const now = Date.now();
    const recent = s.aggressionLog.filter(t => now - t < 30000);
    return { aggressionLog: [...recent, now] };
  }),

  markFlashBlockUsed: () => set((s) => ({ dragonFlashesUsed: s.dragonFlashesUsed + 1 })),
  addLockedThreshold: (t) => set((s) => ({
    lockedThresholds: s.lockedThresholds.includes(t)
      ? s.lockedThresholds
      : [...s.lockedThresholds, t],
  })),
  setRoadEvent: (id, expiry = 0) => set({ roadEventId: id, roadEventExpiry: expiry }),
  useSpareTire: () => set({ spareTireUsed: true }),
}));
