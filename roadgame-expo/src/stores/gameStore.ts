import { create } from 'zustand';
import { Region, Weather, BINGO_STANDARD, BINGO_REGIONS, BadgeChallengeType } from '../constants/game';
import { pickRandom, randInt } from '../lib/gameLogic';

export interface BadgeChallengeState {
  badgeId: string;
  desc: string;
  type: BadgeChallengeType;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  threshold?: number;
}

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
  spotStreak: number;

  // Buttons
  bWatching: boolean;
  toggleMode: 'hold' | 'tap';

  // Power-ups list (earned, not yet used)
  powerups: string[];
  powerupsCrafted: boolean[]; // parallel array: true if this slot was crafted this game

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
  rematchBossId: string | null;

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

  // CB Radio
  cbNextSpotBonus: number;
  mpOpponentHasCbRadio: boolean;

  // Relics
  relics: string[];
  pendingRelic: string | null;

  // Boss curses
  activeCurses: string[];
  cursedPowerupsLeft: number;

  // Badge trials (per-game progress)
  trialProgress: Record<string, number>;
  bigfootEventActive: boolean;

  // Badge challenge (one per game)
  badgeChallenge: BadgeChallengeState | null;

  // Relic activation state (per-game)
  relicActUsed: string[];
  relicFreeSpots: number;
  relicRouteBonusSpots: number;
  relicRabbitBonusSpots: number;
  relicForceL3: boolean;
  relicNavFirst: boolean; // navigator synergy: first powerup forced L2+
  relicWatchBoostExpiry: number;
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
  incrementStreak: () => void;
  resetStreak: () => void;
  addPowerup: (code: string) => void;
  removePowerup: (code: string) => void;
  rerollTopPowerup: (region: Region) => void;
  craftPowerup: (idx: number, newCode: string) => void;
  fusePowerups: (tier: 1 | 2, newCode: string) => void;
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
  setRematchBossId: (id: string | null) => void;
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
  setCbNextSpotBonus: (n: number) => void;
  setMpOpponentHasCbRadio: (v: boolean) => void;
  addRelic: (id: string) => void;
  removeRelic: (id: string) => void;
  setPendingRelic: (id: string | null) => void;
  addCurse: (id: string) => void;
  setCursedPowerupsLeft: (n: number) => void;
  updateTrialProgress: (badgeId: string, delta: number) => void;
  setBigfootEventActive: (v: boolean) => void;

  setBadgeChallenge: (c: BadgeChallengeState | null) => void;
  updateBadgeChallengeProgress: (delta: number) => void;
  completeBadgeChallenge: () => void;

  activateRelic: (id: string) => void;
  setRelicFreeSpots: (n: number) => void;
  setRelicRouteBonusSpots: (n: number) => void;
  setRelicRabbitBonusSpots: (n: number) => void;
  setRelicForceL3: (v: boolean) => void;
  setRelicNavFirst: (v: boolean) => void;
  setRelicWatchBoostExpiry: (t: number) => void;
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
  scoreA: 0, scoreB: 0, pendingB: 0, stackHoldCount: 0, spotStreak: 0,
  bWatching: false, toggleMode: 'tap',
  powerups: [], powerupsCrafted: [],
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
  bossVisible: false, bossId: null, rematchBossId: null,
  nextBadgeId: null,
  rivalScore: 0, rivalFrozenTurns: 0, rivalSkipCount: 0,
  patrolVisible: false,
  weather: 'sunny', region: 'forest', activeBadges: [],
  spotCount: 0, dragonFlashesUsed: 0, lockedThresholds: [],
  aggressionLog: [], mpOpponentScore: 0, mpTimeLeft: 0, mpResult: null, mpZapped: false,
  spareTireUsed: false,
  roadEventId: null, roadEventExpiry: 0,
  headStart: false, creditBoost: false,
  cbNextSpotBonus: 0, mpOpponentHasCbRadio: false,
  relics: [], pendingRelic: null,
  activeCurses: [], cursedPowerupsLeft: 0,
  trialProgress: {}, bigfootEventActive: false,
  badgeChallenge: null,
  relicActUsed: [], relicFreeSpots: 0, relicRouteBonusSpots: 0, relicRabbitBonusSpots: 0,
  relicForceL3: false, relicNavFirst: true, relicWatchBoostExpiry: 0,

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
      powerups: [], powerupsCrafted: [],
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
      cbNextSpotBonus: 0, mpOpponentHasCbRadio: false,
      relics: [], pendingRelic: null,
      activeCurses: [], cursedPowerupsLeft: 0,
      trialProgress: {}, bigfootEventActive: false,
      badgeChallenge: null,
      relicActUsed: [], relicFreeSpots: 0, relicRouteBonusSpots: 0, relicRabbitBonusSpots: 0,
      relicForceL3: false, relicNavFirst: true, relicWatchBoostExpiry: 0,
      rematchBossId: null,
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

  incrementStreak: () => set((s) => ({ spotStreak: s.spotStreak + 1 })),
  resetStreak: () => set({ spotStreak: 0 }),
  setBWatching: (v) => set({ bWatching: v }),
  setToggleMode: (m) => set({ toggleMode: m }),

  addPowerup: (code) => set((s) => ({
    powerups: [...s.powerups, code],
    powerupsCrafted: [...s.powerupsCrafted, false],
  })),
  removePowerup: (code) => set((s) => {
    const idx = s.powerups.indexOf(code);
    if (idx === -1) return {};
    const p = [...s.powerups];
    const c = [...s.powerupsCrafted];
    p.splice(idx, 1);
    c.splice(idx, 1);
    return { powerups: p, powerupsCrafted: c };
  }),
  rerollTopPowerup: (region) => set((s) => {
    if (s.powerups.length === 0) return {};
    const top = s.powerups[0];
    const tier = parseInt(top[0]) as 1 | 2 | 3;
    const subs = ['a','b','c','d','e'];
    const newSub = pickRandom(subs);
    const newCode = `${tier}${newSub}`;
    const c = [...s.powerupsCrafted];
    c[0] = false;
    return { powerups: [newCode, ...s.powerups.slice(1)], powerupsCrafted: c };
  }),
  craftPowerup: (idx, newCode) => set((s) => {
    if (idx < 0 || idx >= s.powerups.length) return {};
    const p = [...s.powerups];
    const c = [...s.powerupsCrafted];
    p[idx] = newCode;
    c[idx] = true;
    return { powerups: p, powerupsCrafted: c };
  }),
  fusePowerups: (tier, newCode) => set((s) => {
    const tierStr = String(tier);
    const toRemove: number[] = [];
    for (let i = 0; i < s.powerups.length && toRemove.length < 3; i++) {
      if (s.powerups[i][0] === tierStr) toRemove.push(i);
    }
    if (toRemove.length < 3) return {};
    const p = s.powerups.filter((_, i) => !toRemove.includes(i));
    const c = s.powerupsCrafted.filter((_, i) => !toRemove.includes(i));
    return { powerups: [...p, newCode], powerupsCrafted: [...c, false] };
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
  setRematchBossId: (id) => set({ rematchBossId: id }),

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
  setCbNextSpotBonus: (n) => set({ cbNextSpotBonus: n }),
  setMpOpponentHasCbRadio: (v) => set({ mpOpponentHasCbRadio: v }),
  addRelic: (id) => set((s) => ({ relics: s.relics.length < 3 ? [...s.relics, id] : s.relics })),
  removeRelic: (id) => set((s) => ({ relics: s.relics.filter(r => r !== id) })),
  setPendingRelic: (id) => set({ pendingRelic: id }),
  addCurse: (id) => set((s) => ({ activeCurses: s.activeCurses.includes(id) ? s.activeCurses : [...s.activeCurses, id] })),
  setCursedPowerupsLeft: (n) => set({ cursedPowerupsLeft: n }),
  updateTrialProgress: (badgeId, delta) => set((s) => ({
    trialProgress: { ...s.trialProgress, [badgeId]: (s.trialProgress[badgeId] ?? 0) + delta },
  })),
  setBigfootEventActive: (v) => set({ bigfootEventActive: v }),

  setBadgeChallenge: (c) => set({ badgeChallenge: c }),
  updateBadgeChallengeProgress: (delta) => set((s) => {
    if (!s.badgeChallenge || s.badgeChallenge.completed) return {};
    return { badgeChallenge: { ...s.badgeChallenge, progress: s.badgeChallenge.progress + delta } };
  }),
  completeBadgeChallenge: () => set((s) => {
    if (!s.badgeChallenge) return {};
    return { badgeChallenge: { ...s.badgeChallenge, completed: true, progress: s.badgeChallenge.target } };
  }),

  activateRelic: (id) => set((s) => ({ relicActUsed: s.relicActUsed.includes(id) ? s.relicActUsed : [...s.relicActUsed, id] })),
  setRelicFreeSpots: (n) => set({ relicFreeSpots: n }),
  setRelicRouteBonusSpots: (n) => set({ relicRouteBonusSpots: n }),
  setRelicRabbitBonusSpots: (n) => set({ relicRabbitBonusSpots: n }),
  setRelicForceL3: (v) => set({ relicForceL3: v }),
  setRelicNavFirst: (v) => set({ relicNavFirst: v }),
  setRelicWatchBoostExpiry: (t) => set({ relicWatchBoostExpiry: t }),
}));
