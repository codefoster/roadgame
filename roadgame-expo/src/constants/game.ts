export const REGIONS = ['forest', 'desert', 'mountains', 'city', 'coast', 'neighborhood'] as const;
export type Region = typeof REGIONS[number];

export const WEATHER = ['sunny', 'rainy', 'foggy', 'overcast', 'night'] as const;
export type Weather = typeof WEATHER[number];

// Weather hint per region (default suggestion)
export const REGION_WEATHER_HINT: Record<Region, Weather> = {
  forest: 'rainy',
  desert: 'sunny',
  mountains: 'foggy',
  city: 'sunny',
  coast: 'sunny',
  neighborhood: 'sunny',
};

export const DIFFICULTY_THRESHOLDS = [200, 500, 800, 1000] as const;

// ─── Badges ──────────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'bigfoot',     name: 'Bigfoot',     description: '10–25% chance per spot of 3× pts (rare encounter)' },
  { id: 'phoenix',     name: 'Phoenix',     description: 'Coin balance never drops below 5/10/15/20 by level' },
  { id: 'unicorn',     name: 'Unicorn',     description: '1 coin per 15/12/9/6 pts by level' },
  { id: 'kraken',      name: 'Kraken',      description: 'Rival −2/3/5/5 pts per turn by level' },
  { id: 'yeti',        name: 'Yeti',        description: 'Credits never decay' },
  { id: 'dragon',      name: 'Dragon',      description: 'Blocks every other flash for 5 flashes (1st, 3rd, 5th)' },
  { id: 'leprechaun',  name: 'Leprechaun',  description: 'Shop items −3/5/7/9 coins by level' },
  { id: 'mermaid',     name: 'Mermaid',     description: 'Patience bonus +10/15/20/25 pts by level' },
  { id: 'sphinx',      name: 'Sphinx',      description: 'Activating a power-up grants +5/8/12/15 pts by level' },
  { id: 'centaur',     name: 'Centaur',     description: 'Watch tick: 0.3/0.5/0.7s faster by level' },
  { id: 'griffin',     name: 'Griffin',     description: '15–30% chance per spot of free credit' },
  { id: 'basilisk',    name: 'Basilisk',    description: 'Freeze rival 20/25/30/35 turns at game start' },
  { id: 'selkie',      name: 'Selkie',      description: 'Switch penalty −10/20/35/50% by level' },
  { id: 'thunderbird', name: 'Thunderbird', description: 'Rainy: +2/4/5/7 pts per spot by level' },
  { id: 'nessie',      name: 'Nessie',      description: '+1/2/3/4 pts each time Watch is committed' },
  { id: 'banshee',     name: 'Banshee',     description: 'Flash penalties −20/30/40/50% by level' },
  { id: 'kirin',       name: 'Kirin',       description: 'Every 10/8/6/5th spot: 3× pts by level' },
  { id: 'manticore',   name: 'Manticore',   description: 'Challenge windows ×1.3/1.5/1.7/2.0 by level' },
  { id: 'wendigo',     name: 'Wendigo',     description: 'Bingo: +20/25/30/40 pts by level' },
  { id: 'pegasus',     name: 'Pegasus',     description: 'Watch tick: +1/2/3/4 credits by level' },
];

export const BADGE_UPGRADE_COSTS = [500, 750, 1000] as const; // costs for levels 1, 2, 3

// ─── Power-ups ───────────────────────────────────────────────────────────────

export interface PowerupDef {
  code: string;
  name: string;
  description: string;
  tier: 1 | 2 | 3;
}

export const POWERUPS: PowerupDef[] = [
  { code: '1a', name: 'Infinite Credits (5s)',  description: 'Floods credits, then resets',                 tier: 1 },
  { code: '1b', name: 'Double Points (5s)',      description: '2× pts on every Spot for 5s',                tier: 1 },
  { code: '1c', name: 'Lucky Roll',              description: 'Next power-up earned is best variant',       tier: 1 },
  { code: '1d', name: 'Free Switch',             description: 'Next Switch press has no penalty',           tier: 1 },
  { code: '1e', name: 'Hold Boost',              description: "Next A/C press won't reset Watch timer",     tier: 1 },
  { code: '2a', name: 'Infinite Credits (10s)',  description: 'Floods credits for 10s, then resets',        tier: 2 },
  { code: '2b', name: 'Double Points (10s)',     description: '2× pts on every Spot for 10s',               tier: 2 },
  { code: '2c', name: 'Jackpot Hold',            description: 'Next hold converts looks to 2× points',      tier: 2 },
  { code: '2d', name: 'Grass Vision (5s)',        description: 'Grass toggle: if on, A gives 3× for 5s',    tier: 2 },
  { code: '2e', name: 'Power Surge',             description: 'Next earned power-up bumped up one tier',    tier: 2 },
  { code: '3a', name: 'Switch Flip',             description: 'Next C gives +20 instead of penalty',        tier: 3 },
  { code: '3b', name: 'Double Down',             description: 'Doubles current pending credits immediately', tier: 3 },
  { code: '3c', name: 'Reroll',                  description: 'Re-rolls top power-up in list',              tier: 3 },
  { code: '3d', name: 'All In',                  description: 'Next Spot scores full Credit balance & clears it', tier: 3 },
  { code: '3e', name: 'Stack Hold',              description: 'Next hold awards triangular sequence per tick', tier: 3 },
];

// Sub-letter weights [a,b,c,d,e] per region
export const REGION_POWERUP_WEIGHTS: Record<Region, number[]> = {
  forest:       [3, 2, 2, 2, 1],
  desert:       [1, 2, 3, 3, 1],
  mountains:    [2, 3, 2, 1, 2],
  city:         [2, 2, 2, 2, 2],
  coast:        [2, 2, 1, 3, 2],
  neighborhood: [2, 2, 3, 1, 2],
};

// ─── Bingo ───────────────────────────────────────────────────────────────────

export const BINGO_STANDARD = [
  'Bridge', 'Tunnel', 'Cow', 'Truck stop', 'Billboard',
  'Water tower', 'Church', 'School bus', 'Semi truck', 'Rest area',
  'State line', 'Weigh station', 'Farm', 'Lake', 'Railroad crossing',
  'Train', 'Wind turbine', 'Solar farm', 'Barn', 'Silo',
  'Covered bridge', 'Dam', 'Toll booth', 'Diner', 'Lighthouse',
];

export const BINGO_GOLDEN = [
  'Bald eagle', 'Hot air balloon', 'Moose', 'Steam locomotive', 'Double rainbow',
  'Albino deer', 'Meteor shower', 'Whale spout', 'Peregrine falcon', 'Northern lights',
  'Tornado (distant)', 'Wolf pack', 'Wild mustangs', 'Ancient petroglyphs', 'Natural arch',
  'Geyser', 'Comet', 'Fire rainbow', 'Sun pillar', 'Ball lightning',
];

export const BINGO_REGIONS: Record<Region, string[]> = {
  forest:       ['Squirrel', 'Creek', 'Deer', 'Mushrooms', 'Owl', 'Pine cone', 'Fox', 'Bear track', 'Hawk', 'Wild turkey', 'Log cabin', 'Mossy rock', 'Waterfall', 'Trout stream', 'Tree stump'],
  desert:       ['Cactus', 'Rock formation', 'Sand dunes', 'Roadrunner', 'Tumbleweed', 'Mesa', 'Dust devil', 'Scorpion', 'Rattlesnake', 'Joshua tree', 'Petroglyphs', 'Ghost town', 'Dry riverbed', 'Vulture', 'Windmill'],
  mountains:    ['Snow peak', 'Cliff', 'Tunnel', 'Waterfall', 'Mountain goat', 'Ski resort', 'Gondola', 'Alpine lake', 'Rockslide', 'Pine forest', 'Ibex', 'Summit sign', 'Glacier', 'Switchback', 'Eagle nest'],
  city:         ['Police car', 'Skyscraper', 'Graffiti', 'Food truck', 'Bike lane', 'Subway entrance', 'Rooftop garden', 'Fire hydrant', 'Busker', 'City park', 'Taxi', 'Street market', 'Public art', 'Bus stop', 'Parking garage'],
  coast:        ['Beach', 'Seagull', 'Waves', 'Lighthouse', 'Pier', 'Surfer', 'Pelican', 'Crab', 'Sailboat', 'Sea cave', 'Tide pool', 'Dune grass', 'Sea stack', 'Ferry', 'Boardwalk'],
  neighborhood: ['Dog walker', 'Garage sale', 'Trampoline', 'Sprinkler', 'Ice cream truck', 'Lemonade stand', 'Tree swing', 'Garden gnome', 'Basketball hoop', 'Mailbox', 'Fire pit', 'Hammock', 'Bird bath', 'Flower garden', 'Riding mower'],
};

// Bingo line patterns (indices in 3×3 grid)
export const BINGO_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
];

// ─── Tourists ────────────────────────────────────────────────────────────────

export interface TouristType {
  id: string;
  name: string;
  guideReward: number;
  ignoreReward: number;
  scamBad: number;
  scamGood: number;
}

export const TOURISTS: TouristType[] = [
  { id: 'lost_family',    name: 'Lost Family',        guideReward: 15, ignoreReward: 3, scamBad: -5,  scamGood: 20 },
  { id: 'camera_trekker', name: 'Camera Trekker',     guideReward: 15, ignoreReward: 3, scamBad: -5,  scamGood: 20 },
  { id: 'elderly_couple', name: 'Elderly Couple',     guideReward: 15, ignoreReward: 3, scamBad: -10, scamGood: 10 },
  { id: 'backpacker',     name: 'Backpacker',         guideReward: 15, ignoreReward: 3, scamBad: -5,  scamGood: 25 },
  { id: 'bus_tour',       name: 'Bus Tour Group',     guideReward: 15, ignoreReward: 3, scamBad: -15, scamGood: 30 },
  { id: 'selfie_seeker',  name: 'Selfie Seeker',      guideReward: 15, ignoreReward: 3, scamBad: -3,  scamGood: 15 },
  { id: 'first_timer',    name: 'First-Timer',        guideReward: 15, ignoreReward: 3, scamBad: -5,  scamGood: 20 },
  { id: 'bird_watcher',   name: 'Bird Watcher',       guideReward: 15, ignoreReward: 3, scamBad: -5,  scamGood: 20 },
];

// ─── Hitchhikers ─────────────────────────────────────────────────────────────

export interface HitchhikerType {
  id: string;
  name: string;
  effect: string;
  duration: number; // seconds; 0 = instant one-time effect
  description: string;
}

export const HITCHHIKERS: HitchhikerType[] = [
  { id: 'geologist',   name: 'Geologist',           effect: 'spot_bonus',    duration: 30, description: '+1 pt per spot for 30s' },
  { id: 'birdwatcher', name: 'Birdwatcher',          effect: 'rare_3x',       duration: 30, description: 'Rare encounters 3× for 30s' },
  { id: 'trucker',     name: 'Trucker',              effect: 'no_decay',      duration: 45, description: 'No credit decay for 45s' },
  { id: 'dj',          name: 'DJ',                   effect: 'double_points', duration: 25, description: '2× points for 25s' },
  { id: 'navigator',   name: 'Navigator',            effect: 'bingo_auto',    duration: 0,  description: 'Auto-marks 2 bingo cells' },
  { id: 'foodie',      name: 'Foodie',               effect: 'foodie',        duration: 0,  description: '−15 credits, +20 pts' },
  { id: 'sleeper',     name: 'Sleeper',              effect: 'none',          duration: 0,  description: 'No effect' },
  { id: 'conspiracy',  name: 'Conspiracy Theorist',  effect: 'watch_2x',      duration: 20, description: 'Credits tick 2× faster for 20s' },
];

// ─── Shop ─────────────────────────────────────────────────────────────────────

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  baseCost: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'head_start',   name: 'Head Start',   description: '+50 pts at game start',              baseCost: 5  },
  { id: 'credit_boost', name: 'Credit Boost', description: '+25 credits at game start',          baseCost: 10 },
  { id: 'rival_chill',  name: 'Rival Chill',  description: 'Rival skips first 5 actions',        baseCost: 15 },
  { id: 'golden_touch', name: 'Golden Touch', description: '2 pre-marked golden bingo squares',  baseCost: 20 },
];
