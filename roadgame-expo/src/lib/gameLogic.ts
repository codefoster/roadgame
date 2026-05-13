import { Region, Weather, REGION_POWERUP_WEIGHTS, DIFFICULTY_THRESHOLDS } from '../constants/game';

// ─── RNG helpers ─────────────────────────────────────────────────────────────

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function weightedPick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ─── Difficulty ───────────────────────────────────────────────────────────────

export function difficultyScore(score: number, lockedThresholds: number[]): number {
  // Returns effective score capped at the next locked threshold
  for (const t of DIFFICULTY_THRESHOLDS) {
    if (lockedThresholds.includes(t) && score >= t) continue;
    if (score >= t && !lockedThresholds.includes(t)) return t - 1;
  }
  return score;
}

export function bInterval(score: number, hasCentaur: boolean, centaurLevel: number): number {
  // Returns watch tick interval in ms
  let base: number;
  if (score >= 1000) base = 3000;
  else if (score >= 800) base = 2500;
  else if (score >= 500) base = 2000;
  else if (score >= 200) base = 1500;
  else base = 1000;

  if (hasCentaur) {
    const reduction = [0.3, 0.5, 0.7][centaurLevel - 1] ?? 0.3;
    base = Math.max(300, base - reduction * 1000);
  }
  return base;
}

export function cPenalty(score: number, hasSelkie: boolean, selkieLevel: number): number {
  let base: number;
  if (score >= 1000) base = 50;
  else if (score >= 800) base = 40;
  else if (score >= 500) base = 30;
  else base = 20;

  if (hasSelkie) {
    const reductionFactor = [0.5, 0.67, 0.75, 0.99][selkieLevel] ?? 0.5;
    base = Math.round(base * (1 - reductionFactor));
  }
  return base;
}

export function flashInterval(score: number, weather: Weather): [number, number] {
  // Returns [minMs, maxMs]
  if (weather === 'night') return [8000, 25000];
  if (weather === 'overcast') return [20000, 60000];
  if (score >= 800) return [15000, 45000];
  return [30000, 90000];
}

export function decayRate(score: number, region: Region): number {
  let rate = 0;
  if (score >= 500 && score < 800) rate = 1;
  else if (score >= 800) rate = 2;
  if (region === 'desert') rate += 1;
  return rate;
}

export function decayThreshold(score: number): number {
  if (score >= 1000) return 45;
  if (score >= 800) return 100;
  if (score >= 500) return 150;
  return Infinity;
}

// ─── Power-up generation ──────────────────────────────────────────────────────

export function generatePowerup(
  tier: 1 | 2 | 3,
  region: Region,
  forceBest: boolean,
  powerSurge: boolean
): string {
  let effectiveTier = tier;
  if (powerSurge && effectiveTier < 3) effectiveTier = (effectiveTier + 1) as 1 | 2 | 3;

  const weights = REGION_POWERUP_WEIGHTS[region];
  const subs = ['a', 'b', 'c', 'd', 'e'];
  const sub = forceBest ? 'e' : weightedPick(subs, weights);
  return `${effectiveTier}${sub}`;
}

export function watchTier(pendingCredits: number): 0 | 1 | 2 | 3 {
  if (pendingCredits >= 60) return 3;
  if (pendingCredits >= 30) return 2;
  if (pendingCredits >= 10) return 1;
  return 0;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

export function spotPoints(
  score: number,
  credits: number,
  category: 'nature' | 'manmade',
  weather: Weather,
  doublePoints: boolean,
  grassMode: boolean,
  grassOn: boolean,
  hitchhikerGeologist: boolean,
  hitchhikerDJ: boolean,
  hitchhikerBirdwatcher: boolean,
  activeBadges: string[],
  badgeLevels: Record<string, number>,
  spotCount: number
): { points: number; newCredits: number } {
  // Rainy penalty: 50% chance 0 pts (except grass override)
  if (weather === 'rainy' && !grassOn && Math.random() < 0.5) {
    return { points: 0, newCredits: credits - 1 };
  }
  // Overcast penalty: 25% chance 0 pts (reduced visibility)
  if (weather === 'overcast' && Math.random() < 0.25) {
    return { points: 0, newCredits: credits - 1 };
  }

  let pts = 1;

  // Grass mode: 3×
  if (grassMode && grassOn) pts *= 3;

  // Double points from power-up or DJ hitchhiker
  if (doublePoints || hitchhikerDJ) pts *= 2;

  // Geologist +1
  if (hitchhikerGeologist) pts += 1;

  // Birdwatcher: 30% chance of rare sighting (3×)
  if (hitchhikerBirdwatcher && Math.random() < 0.3) pts *= 3;

  // Thunderbird (rainy: +1–4)
  if (weather === 'rainy' && activeBadges.includes('thunderbird')) {
    const level = badgeLevels['thunderbird'] ?? 0;
    pts += randInt(1, 1 + level + 1);
  }

  // Kirin (every Nth spot: 3×)
  if (activeBadges.includes('kirin')) {
    const level = badgeLevels['kirin'] ?? 0;
    const nth = [10, 8, 6, 5][level] ?? 10;
    if ((spotCount + 1) % nth === 0) pts *= 3;
  }

  // Bigfoot: chance of rare encounter (3× pts) — 10/15/20/25% by level
  if (activeBadges.includes('bigfoot')) {
    const level = badgeLevels['bigfoot'] ?? 0;
    if (Math.random() < 0.10 + level * 0.05) pts *= 3;
  }

  // Griffin: chance of free spot (no credit cost) — 15/20/25/30% by level
  let creditCost = 1;
  if (activeBadges.includes('griffin')) {
    const level = badgeLevels['griffin'] ?? 0;
    if (Math.random() < 0.15 + level * 0.05) creditCost = 0;
  }

  return { points: pts, newCredits: credits - creditCost };
}

export function flashPenaltyMultiplier(
  activeBadges: string[],
  badgeLevels: Record<string, number>
): number {
  let mult = 1;
  if (activeBadges.includes('banshee')) {
    const level = badgeLevels['banshee'] ?? 0;
    mult *= 1 - ([0.3, 0.45, 0.6][level] ?? 0.3);
  }
  if (activeBadges.includes('dragon')) {
    const level = badgeLevels['dragon'] ?? 0;
    mult *= 1 - level * 0.1; // level 1: 10%, 2: 20%, 3: 30% extra reduction
  }
  return mult;
}

export function flashLooksPenalty(score: number): number {
  if (score >= 1000) return 40;
  if (score >= 800) return 30;
  if (score >= 500) return 25;
  if (score >= 200) return 15;
  return 10;
}

export function flashPtsPenalty(score: number): number {
  if (score >= 1000) return 50;
  if (score >= 800) return 40;
  if (score >= 500) return 40;
  if (score >= 200) return 30;
  return 25;
}

// ─── Bingo helpers ────────────────────────────────────────────────────────────

export function checkBingoLines(marked: boolean[]): number[] {
  // Returns list of newly completed line indices
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  return lines
    .map((line, i) => ({ i, complete: line.every(idx => marked[idx]) }))
    .filter(x => x.complete)
    .map(x => x.i);
}

// ─── Rival ───────────────────────────────────────────────────────────────────

export function rivalAction(
  rivalScore: number,
  playerScore: number,
  frozenTurns: number,
  hasKraken: boolean,
  krakenLevel = 0
): { newRivalScore: number; frozenTurns: number } {
  if (frozenTurns > 0) return { newRivalScore: rivalScore, frozenTurns: frozenTurns - 1 };

  const actions = ['bingo', 'steal', 'challenge', 'penalty'];
  const weights = playerScore > 500 ? [3, 2, 2, 3] : [4, 1, 2, 1];
  const action = weightedPick(actions, weights);

  let delta = 0;
  switch (action) {
    case 'bingo':    delta = randInt(3, 8);  break;
    case 'steal':    delta = randInt(2, 5);  break;
    case 'challenge':delta = randInt(5, 12); break;
    case 'penalty':  delta = -randInt(2, 6); break;
  }
  if (hasKraken) delta = Math.max(delta - (1 + krakenLevel), 0);
  return { newRivalScore: Math.max(0, rivalScore + delta), frozenTurns: 0 };
}

// ─── Patrol ──────────────────────────────────────────────────────────────────

const REGION_PATROL_CHANCE: Record<Region, number> = {
  city:         1.0,
  neighborhood: 0.55,
  mountains:    0.25,
  forest:       0.12,
  coast:        0.12,
  desert:       0.0,
};

export function checkPatrol(
  region: Region,
  aggressionLevel: number // 0–1 based on recent play
): boolean {
  const chance = REGION_PATROL_CHANCE[region] * aggressionLevel;
  return Math.random() < chance;
}
