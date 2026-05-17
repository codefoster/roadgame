export interface DailyChallenge {
  type: 'score' | 'spots' | 'powerups' | 'bingo' | 'weather_score';
  target: number;
  weather?: string;
  desc: string;
  reward: number;
}

const CHALLENGE_POOL: DailyChallenge[] = [
  { type: 'score',         target: 500, desc: 'Score 500 pts in one game',               reward: 5 },
  { type: 'score',         target: 800, desc: 'Score 800 pts in one game',               reward: 8 },
  { type: 'score',         target: 350, desc: 'Score 350 pts in one game',               reward: 4 },
  { type: 'spots',         target: 30,  desc: 'Make 30 Spots in one game',               reward: 4 },
  { type: 'spots',         target: 50,  desc: 'Make 50 Spots in one game',               reward: 7 },
  { type: 'powerups',      target: 6,   desc: 'Activate 6 power-ups in one game',        reward: 4 },
  { type: 'powerups',      target: 10,  desc: 'Activate 10 power-ups in one game',       reward: 7 },
  { type: 'bingo',         target: 1,   desc: 'Complete a bingo line in one game',       reward: 5 },
  { type: 'weather_score', target: 350, weather: 'rainy',  desc: 'Score 350 pts in Rainy weather',  reward: 6 },
  { type: 'weather_score', target: 300, weather: 'foggy',  desc: 'Score 300 pts in Foggy weather',  reward: 6 },
  { type: 'weather_score', target: 350, weather: 'night',  desc: 'Score 350 pts in Night weather',  reward: 6 },
];

// Seeded shuffle using date string as seed (simple LCG)
export function getDailyChallenges(dateStr?: string): DailyChallenge[] {
  const seed = dateStr ?? new Date().toISOString().slice(0, 10);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  const rng = () => {
    h = Math.imul(h ^ (h >>> 13), 0x9d2c5680) | 0;
    h = Math.imul(h ^ (h >>> 15), 0xefc8249d) | 0;
    return (h >>> 0) / 0x100000000;
  };
  const pool = [...CHALLENGE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
