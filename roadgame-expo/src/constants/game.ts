export const REGIONS = ['forest', 'desert', 'mountains', 'city', 'coast', 'neighborhood', 'highway'] as const;
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
  highway: 'sunny',
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
  { id: 'coyote',      name: 'Coyote',      description: 'Steal flash: 25/40/55/70% chance to block theft by level' },
  { id: 'thunderbird', name: 'Thunderbird', description: 'Rainy: +2/4/5/7 pts per spot by level' },
  { id: 'nessie',      name: 'Nessie',      description: '+1/2/3/4 pts each time Watch is committed' },
  { id: 'salamander',  name: 'Salamander',  description: 'Watch commit: 10/20/30/40% of pending credits added as pts by level' },
  { id: 'kirin',       name: 'Kirin',       description: 'Every 10/8/6/5th spot: 3× pts by level' },
  { id: 'manticore',   name: 'Manticore',   description: 'Challenge windows ×1.3/1.5/1.7/2.0 by level' },
  { id: 'wendigo',     name: 'Wendigo',     description: 'Bingo: +20/25/30/40 pts by level' },
  { id: 'valkyrie',   name: 'Valkyrie',    description: 'Boss fight win chance +10/15/20/25% by level' },
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
  { code: '1d', name: 'Energy Drink',             description: 'Instantly adds +25 credits',                  tier: 1 },
  { code: '1e', name: 'Hold Boost',              description: "Next Spot press won't reset Watch timer",    tier: 1 },
  { code: '2a', name: 'Infinite Credits (10s)',  description: 'Floods credits for 10s, then resets',        tier: 2 },
  { code: '2b', name: 'Double Points (10s)',     description: '2× pts on every Spot for 10s',               tier: 2 },
  { code: '2c', name: 'Jackpot Hold',            description: 'Next hold converts looks to 2× points',      tier: 2 },
  { code: '2d', name: 'Grass Vision (5s)',        description: 'Grass toggle: if on, A gives 3× for 5s',    tier: 2 },
  { code: '2e', name: 'Power Surge',             description: 'Next earned power-up bumped up one tier',    tier: 2 },
  { code: '3a', name: 'Full Throttle',            description: 'Instantly gain +40 pts (sightings)',          tier: 3 },
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
  highway:      [2, 3, 2, 2, 1],
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
  highway:      ['Overpass', 'RV', 'Car hauler', 'Construction zone', 'Runaway truck ramp', 'Convoy', 'Hitchhiker', 'Broken down car', 'Road gator', 'Tow truck', 'Welcome sign', 'Digital speed sign', 'Emergency vehicle', 'Lane closure', 'Median wildflowers'],
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
  { id: 'geologist',   name: 'Geologist',           effect: 'spot_bonus',    duration: 30,  description: '+1 pt per spot for 30s' },
  { id: 'birdwatcher', name: 'Birdwatcher',          effect: 'rare_3x',       duration: 30,  description: 'Rare encounters 3× for 30s' },
  { id: 'trucker',     name: 'Trucker',              effect: 'no_decay',      duration: 45,  description: 'No credit decay for 45s' },
  { id: 'dj',          name: 'DJ',                   effect: 'double_points', duration: 25,  description: '2× points for 25s' },
  { id: 'navigator',   name: 'Navigator',            effect: 'bingo_auto',    duration: 0,   description: 'Auto-marks 2 bingo cells' },
  { id: 'foodie',      name: 'Foodie',               effect: 'foodie',        duration: 0,   description: '−15 credits, +20 pts' },
  { id: 'sleeper',     name: 'Sleeper',              effect: 'none',          duration: 0,   description: 'No effect' },
  { id: 'conspiracy',  name: 'Conspiracy Theorist',  effect: 'watch_2x',      duration: 20,  description: 'Credits tick 2× faster for 20s' },
  { id: 'hunter',      name: 'Hunter',               effect: 'boss_boost',    duration: 120, description: '+20% boss fight win chance for 2 min' },
];

// ─── Shop ─────────────────────────────────────────────────────────────────────

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  baseCost: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'head_start',   name: 'Head Start',    description: '+50 pts at game start',                         baseCost: 5  },
  { id: 'credit_boost', name: 'Credit Boost',  description: '+25 credits at game start',                     baseCost: 10 },
  { id: 'rival_chill',  name: 'Rival Chill',   description: 'Rival skips first 5 actions',                   baseCost: 15 },
  { id: 'golden_touch', name: 'Golden Touch',  description: '2 pre-marked golden bingo squares',             baseCost: 20 },
  { id: 'hunters_kit',  name: "Hunter's Kit",  description: 'Boss fights: raises win chance to 55–45%',      baseCost: 25 },
  { id: 'power_relic',  name: 'Power Relic',   description: 'Boss fights: raises win chance to 80–65%',      baseCost: 40 },
  { id: 'cb_radio',     name: 'CB Radio',      description: 'Patrol warning, more hitchhikers, next badge preview', baseCost: 20 },
  { id: 'spare_tire',   name: 'Spare Tire',    description: 'Once per game: credits bottom out at 1 instead of 0',  baseCost: 12 },
  { id: 'rival_decoy',  name: 'Rival Decoy',   description: 'Rival starts at −30 pts',                             baseCost: 18 },
];

// ─── Bosses ──────────────────────────────────────────────────────────────────

export interface BossDef {
  id: string;
  name: string;
  description: string;
  powerName: string;
  powerDesc: string;
  bareHandsChance: number;
  kitChance: number;
  relicChance: number;
  winPts: number;
  winCoins: number;
  losePts: number;
  loseCoins: number;
  loseCredits: number;
  noFlee: boolean;
  fleeCoins: number;
  bareHandsDouble: boolean; // win bare-handed gives 2× pts
}

export const BOSSES: BossDef[] = [
  {
    id: 'road_goblin', name: 'Road Goblin',
    description: "A sneaky goblin darts across your path, eyeing your coins!",
    powerName: 'Pickpocket', powerDesc: 'Lose: also lose 5 coins',
    bareHandsChance: 0.40, kitChance: 0.65, relicChance: 0.88,
    winPts: 20, winCoins: 8, losePts: 8, loseCoins: 5, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
  },
  {
    id: 'swamp_witch', name: 'Swamp Witch',
    description: 'A cackling witch casts a hex, clouding your fighting instincts!',
    powerName: 'Hex', powerDesc: 'Bare hands win chance greatly reduced',
    bareHandsChance: 0.18, kitChance: 0.52, relicChance: 0.80,
    winPts: 28, winCoins: 10, losePts: 15, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
  },
  {
    id: 'forest_troll', name: 'Forest Troll',
    description: 'A massive troll blocks the road. It will chase you if you run!',
    powerName: 'Stubborn', powerDesc: 'Fleeing costs 15 coins',
    bareHandsChance: 0.28, kitChance: 0.55, relicChance: 0.78,
    winPts: 35, winCoins: 12, losePts: 22, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 15, bareHandsDouble: false,
  },
  {
    id: 'stone_gargoyle', name: 'Stone Gargoyle',
    description: 'A living statue descends from a bridge, impervious to basic weapons!',
    powerName: 'Armored', powerDesc: "Hunter's Kit has no effect",
    bareHandsChance: 0.25, kitChance: 0.25, relicChance: 0.72,
    winPts: 38, winCoins: 14, losePts: 25, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
  },
  {
    id: 'sand_serpent', name: 'Sand Serpent',
    description: 'A massive serpent erupts from the road! Its venom drains your energy.',
    powerName: 'Venomous', powerDesc: 'Lose: also lose 15 credits',
    bareHandsChance: 0.22, kitChance: 0.48, relicChance: 0.72,
    winPts: 45, winCoins: 16, losePts: 28, loseCoins: 0, loseCredits: 15,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
  },
  {
    id: 'mountain_giant', name: 'Mountain Giant',
    description: 'A thundering giant shakes the earth! Bare-handed victory earns glory!',
    powerName: 'Brute Challenge', powerDesc: 'Win bare-handed: 2× pts',
    bareHandsChance: 0.18, kitChance: 0.45, relicChance: 0.70,
    winPts: 55, winCoins: 20, losePts: 35, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: true,
  },
  {
    id: 'frost_wraith', name: 'Frost Wraith',
    description: 'A spectral horror freezes the air. You feel rooted to the spot!',
    powerName: 'Frozen', powerDesc: 'Cannot flee',
    bareHandsChance: 0.15, kitChance: 0.42, relicChance: 0.68,
    winPts: 60, winCoins: 22, losePts: 40, loseCoins: 0, loseCredits: 0,
    noFlee: true, fleeCoins: 0, bareHandsDouble: false,
  },
  {
    id: 'shadow_drake', name: 'Shadow Drake',
    description: 'A drake made of pure shadow. Ancient magic dissolves in its presence!',
    powerName: 'Shadow Veil', powerDesc: 'Power Relic is less effective',
    bareHandsChance: 0.12, kitChance: 0.40, relicChance: 0.55,
    winPts: 65, winCoins: 25, losePts: 45, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
  },
  {
    id: 'void_wraith', name: 'Void Wraith',
    description: 'A horror from the void phases in and out of reality.',
    powerName: 'Phase Shift', powerDesc: 'All win chances reduced by 10%',
    bareHandsChance: 0.08, kitChance: 0.32, relicChance: 0.58,
    winPts: 80, winCoins: 35, losePts: 55, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
  },
  {
    id: 'ancient_titan', name: 'Ancient Titan',
    description: 'An unstoppable force of nature. There is no escape. There is no mercy.',
    powerName: 'Colossus', powerDesc: 'Cannot flee. Maximum risk and reward.',
    bareHandsChance: 0.05, kitChance: 0.28, relicChance: 0.52,
    winPts: 120, winCoins: 50, losePts: 80, loseCoins: 0, loseCredits: 0,
    noFlee: true, fleeCoins: 0, bareHandsDouble: false,
  },
];

// ─── Road Events ─────────────────────────────────────────────────────────────

export interface RoadEventDef {
  id: string;
  name: string;
  desc: string;
  duration: number; // seconds; 0 = interactive (player must choose)
  color: string;
}

export const ROAD_EVENTS: RoadEventDef[] = [
  { id: 'traffic_jam', name: 'Traffic Jam',  desc: 'Watch tick paused for 45s — stuck in gridlock!',  duration: 45, color: '#cc4400' },
  { id: 'speed_trap',  name: 'Speed Trap!',  desc: 'Patrol risk doubled for 60s — easy on the gas.',  duration: 60, color: '#dd0000' },
  { id: 'open_road',   name: 'Open Road!',   desc: '+1 pt per spot for 30s — clear skies ahead!',     duration: 30, color: '#00aa44' },
  { id: 'gas_station', name: 'Gas Station',  desc: 'Spend 10 credits for +25 pts, or drive past.',    duration: 0,  color: '#ccaa00' },
  { id: 'shortcut',    name: 'Shortcut!',    desc: 'Spend 8 coins for +30 pts, or stay on the road.', duration: 0,  color: '#0099cc' },
];
