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
  { id: 'shuck',       name: 'Black Shuck', description: 'Patrol pull-over chance −20/30/40/55% by level' },
  { id: 'kitsune',     name: 'Kitsune',     description: 'Steal flash: 25/40/55/70% chance to block theft by level' },
  { id: 'thunderbird', name: 'Thunderbird', description: 'Rainy: +2/4/5/7 pts per spot by level' },
  { id: 'nessie',      name: 'Nessie',      description: '+1/2/3/4 pts each time Watch is committed' },
  { id: 'ifrit',       name: 'Ifrit',       description: 'Watch commit: 10/20/30/40% of pending credits added as pts by level' },
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

export interface BundleDef {
  id: string;
  name: string;
  itemIds: [string, string];
  cost: number;
  tagline: string;
}

export const SHOP_BUNDLES: BundleDef[] = [
  { id: 'scout_kit',   name: 'Scout Kit',   itemIds: ['spare_tire', 'credit_boost'], cost: 16, tagline: 'Stay fueled, stay rolling'         },
  { id: 'road_boss',   name: 'Road Boss',   itemIds: ['hunters_kit', 'rival_chill'], cost: 30, tagline: 'Dominate bosses and rivals'         },
  { id: 'broadcaster', name: 'Broadcaster', itemIds: ['cb_radio', 'rival_decoy'],    cost: 30, tagline: 'Command the airwaves and the road'  },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'head_start',   name: 'Head Start',    description: '+50 pts at game start',                         baseCost: 5  },
  { id: 'credit_boost', name: 'Credit Boost',  description: '+25 credits at game start',                     baseCost: 10 },
  { id: 'rival_chill',  name: 'Rival Chill',   description: 'Rival skips first 5 actions',                   baseCost: 15 },
  { id: 'golden_touch', name: 'Golden Touch',  description: '2 pre-marked golden bingo squares',             baseCost: 20 },
  { id: 'hunters_kit',  name: "Hunter's Kit",  description: 'Boss fights: raises win chance to 55–45%',      baseCost: 25 },
  { id: 'power_relic',  name: 'Power Relic',   description: 'Boss fights: raises win chance to 80–65%',      baseCost: 40 },
  { id: 'cb_radio',     name: 'CB Radio',      description: 'Random chatter with real effects. Deceive rivals in MP. Lasts 3 games.', baseCost: 20 },
  { id: 'spare_tire',   name: 'Spare Tire',    description: 'Once per game: credits bottom out at 1 instead of 0',  baseCost: 12 },
  { id: 'rival_decoy',  name: 'Rival Decoy',   description: 'Rival starts at −30 pts',                             baseCost: 18 },
];

// ─── Bosses ──────────────────────────────────────────────────────────────────

export interface BossDeal {
  label: string;
  type: 'powerup' | 'coins' | 'credits';
  cost: number;
  pts: number; // bonus pts awarded on deal
}

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
  bareHandsDouble: boolean;
  weakness: { type: 'badge' | 'relic'; id: string; name: string; };
  curse: { id: string; desc: string; } | null;
  deal: BossDeal | null;
}

export const BOSSES: BossDef[] = [
  {
    id: 'road_goblin', name: 'Road Goblin',
    description: "A sneaky goblin darts across your path, eyeing your coins!",
    powerName: 'Pickpocket', powerDesc: 'Lose: also lose 5 coins',
    bareHandsChance: 0.20, kitChance: 0.65, relicChance: 0.88,
    winPts: 20, winCoins: 8, losePts: 8, loseCoins: 5, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
    weakness: { type: 'badge', id: 'kitsune', name: 'Kitsune' },
    curse: null,
    deal: { label: 'Sacrifice a power-up', type: 'powerup', cost: 0, pts: 0 },
  },
  {
    id: 'swamp_witch', name: 'Swamp Witch',
    description: 'A cackling witch casts a hex, clouding your fighting instincts!',
    powerName: 'Hex', powerDesc: 'Bare hands win chance greatly reduced',
    bareHandsChance: 0.09, kitChance: 0.52, relicChance: 0.80,
    winPts: 28, winCoins: 10, losePts: 15, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
    weakness: { type: 'badge', id: 'ifrit', name: 'Ifrit' },
    curse: { id: 'cursed_powerups', desc: 'Next 3 power-ups forced to tier 1' },
    deal: { label: 'Pay 10 coins to break hex', type: 'coins', cost: 10, pts: 0 },
  },
  {
    id: 'forest_troll', name: 'Forest Troll',
    description: 'A massive troll blocks the road. It will chase you if you run!',
    powerName: 'Stubborn', powerDesc: 'Fleeing costs 15 coins',
    bareHandsChance: 0.13, kitChance: 0.55, relicChance: 0.78,
    winPts: 35, winCoins: 12, losePts: 22, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 15, bareHandsDouble: false,
    weakness: { type: 'relic', id: 'route_sign', name: 'Route 66 Sign' },
    curse: null,
    deal: null,
  },
  {
    id: 'stone_gargoyle', name: 'Stone Gargoyle',
    description: 'A living statue descends from a bridge, impervious to basic weapons!',
    powerName: 'Armored', powerDesc: "Hunter's Kit has no effect",
    bareHandsChance: 0.10, kitChance: 0.25, relicChance: 0.72,
    winPts: 38, winCoins: 14, losePts: 25, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
    weakness: { type: 'badge', id: 'thunderbird', name: 'Thunderbird' },
    curse: { id: 'stone_touch', desc: 'Every 5th Spot scores 0 pts' },
    deal: null,
  },
  {
    id: 'sand_serpent', name: 'Sand Serpent',
    description: 'A massive serpent erupts from the road! Its venom drains your energy.',
    powerName: 'Venomous', powerDesc: 'Lose: also lose 15 credits',
    bareHandsChance: 0.09, kitChance: 0.48, relicChance: 0.72,
    winPts: 45, winCoins: 16, losePts: 28, loseCoins: 0, loseCredits: 15,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
    weakness: { type: 'badge', id: 'griffin', name: 'Griffin' },
    curse: { id: 'venom', desc: 'Each Spot costs +1 extra credit' },
    deal: { label: 'Feed it — 20 credits', type: 'credits', cost: 20, pts: 0 },
  },
  {
    id: 'mountain_giant', name: 'Mountain Giant',
    description: 'A thundering giant shakes the earth! Bare-handed victory earns glory!',
    powerName: 'Brute Challenge', powerDesc: 'Win bare-handed: 2× pts',
    bareHandsChance: 0.07, kitChance: 0.45, relicChance: 0.70,
    winPts: 55, winCoins: 20, losePts: 35, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: true,
    weakness: { type: 'badge', id: 'centaur', name: 'Centaur' },
    curse: null,
    deal: null,
  },
  {
    id: 'frost_wraith', name: 'Frost Wraith',
    description: 'A spectral horror freezes the air. You feel rooted to the spot!',
    powerName: 'Frozen', powerDesc: 'Cannot flee',
    bareHandsChance: 0.05, kitChance: 0.42, relicChance: 0.68,
    winPts: 60, winCoins: 22, losePts: 40, loseCoins: 0, loseCredits: 0,
    noFlee: true, fleeCoins: 0, bareHandsDouble: false,
    weakness: { type: 'badge', id: 'phoenix', name: 'Phoenix' },
    curse: { id: 'frozen_watch', desc: 'Watch ticks 25% slower' },
    deal: null,
  },
  {
    id: 'shadow_drake', name: 'Shadow Drake',
    description: 'A drake made of pure shadow. Ancient magic dissolves in its presence!',
    powerName: 'Shadow Veil', powerDesc: 'Power Relic is less effective',
    bareHandsChance: 0.04, kitChance: 0.40, relicChance: 0.55,
    winPts: 65, winCoins: 25, losePts: 45, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
    weakness: { type: 'badge', id: 'dragon', name: 'Dragon' },
    curse: null,
    deal: { label: 'Pay tribute — 8 coins', type: 'coins', cost: 8, pts: 10 },
  },
  {
    id: 'void_wraith', name: 'Void Wraith',
    description: 'A horror from the void phases in and out of reality.',
    powerName: 'Phase Shift', powerDesc: 'All win chances reduced by 10%',
    bareHandsChance: 0.03, kitChance: 0.32, relicChance: 0.58,
    winPts: 80, winCoins: 35, losePts: 55, loseCoins: 0, loseCredits: 0,
    noFlee: false, fleeCoins: 5, bareHandsDouble: false,
    weakness: { type: 'relic', id: 'compass', name: 'Broken Compass' },
    curse: { id: 'void_phase', desc: 'Every 8th Spot scores 0 pts' },
    deal: null,
  },
  {
    id: 'ancient_titan', name: 'Ancient Titan',
    description: 'An unstoppable force of nature. There is no escape. There is no mercy.',
    powerName: 'Colossus', powerDesc: 'Cannot flee. Maximum risk and reward.',
    bareHandsChance: 0.02, kitChance: 0.28, relicChance: 0.52,
    winPts: 120, winCoins: 50, losePts: 80, loseCoins: 0, loseCredits: 0,
    noFlee: true, fleeCoins: 0, bareHandsDouble: false,
    weakness: { type: 'relic', id: 'atlas', name: 'Road Atlas' },
    curse: null,
    deal: null,
  },
];

// ─── Relics ──────────────────────────────────────────────────────────────────

export interface RelicDef {
  id: string;
  name: string;
  emoji: string;
  description: string;  // L0 passive
  tier1Desc: string;    // L1 passive
  tier2Desc: string;    // L2 passive
  activateDesc: string; // one-time per-game active ability
}

export const RELICS: RelicDef[] = [
  { id: 'rabbit_foot', name: "Rabbit's Foot",  emoji: '🐾',
    description:   '20% chance each Spot gives +2 bonus pts',
    tier1Desc:     '30% chance each Spot gives +3 bonus pts',
    tier2Desc:     '30% chance each Spot gives +5 bonus pts',
    activateDesc:  'Next 3 Spots each give +5 bonus pts' },
  { id: 'thermos',     name: 'Coffee Thermos', emoji: '☕',
    description:   'Watch ticks 15% faster',
    tier1Desc:     'Watch ticks 25% faster',
    tier2Desc:     'Watch ticks 25% faster; Watch commits also give +1 credit',
    activateDesc:  'Watch interval halved for 20s' },
  { id: 'route_sign',  name: 'Route 66 Sign',  emoji: '🛤️',
    description:   '+1 pt on every Spot',
    tier1Desc:     '+2 pts on every Spot',
    tier2Desc:     '+2 pts/Spot; rival earns 10% fewer pts (stacks)',
    activateDesc:  'Next 15 Spots each give +3 bonus pts' },
  { id: 'atlas',       name: 'Road Atlas',      emoji: '🗺️',
    description:   '+1 credit each time you earn a power-up',
    tier1Desc:     '+2 credits each time you earn a power-up',
    tier2Desc:     '+2 credits on power-up; 10% chance tier bumped up',
    activateDesc:  'Next power-up earned is forced L3' },
  { id: 'lucky_coin',  name: 'Lucky Coin',      emoji: '🪙',
    description:   '10% chance each Spot costs 0 credits',
    tier1Desc:     '15% chance each Spot costs 0 credits',
    tier2Desc:     '15% free-spot chance; free Spots also give +1 bonus pt',
    activateDesc:  'Next 3 Spots cost no credits' },
  { id: 'trucker_die', name: "Trucker's Die",   emoji: '🎲',
    description:   '+5 pts on every Watch commit',
    tier1Desc:     '+8 pts on every Watch commit',
    tier2Desc:     '+8 pts on every Watch commit; also +1 credit per commit',
    activateDesc:  'Immediately +25 pts' },
  { id: 'compass',     name: 'Broken Compass',  emoji: '🧭',
    description:   'Rival earns 20% fewer pts per action',
    tier1Desc:     'Rival earns 30% fewer pts per action',
    tier2Desc:     'Rival earns 40% fewer pts per action',
    activateDesc:  'Rival score drops by 25 pts immediately' },
  { id: 'bottle_cap',  name: 'Bottle Cap',      emoji: '🔩',
    description:   'Earn +1 extra coin per coin reward',
    tier1Desc:     '+1 extra coin; coin threshold −5 pts',
    tier2Desc:     'Earn +2 extra coins per coin reward',
    activateDesc:  'Convert 10 credits → 5 coins immediately' },
  { id: 'change_jar',  name: 'Change Jar',      emoji: '🫙',
    description:   'Earn 5 coins when Patrol pulls you over',
    tier1Desc:     'Earn 8 coins when Patrol pulls you over',
    tier2Desc:     'Earn 8 coins on Patrol; also +5 pts on patrol stop',
    activateDesc:  '+20 coins immediately' },
];

export const RELIC_UPGRADE_COSTS = [300, 600] as const;

export const RELIC_SYNERGIES = [
  { relics: ['thermos',    'trucker_die'] as [string,string], id: 'road_diner',   name: 'Road Diner',   desc: 'Watch commits also give +1 credit' },
  { relics: ['compass',    'atlas']       as [string,string], id: 'navigator',    name: 'Navigator',    desc: 'First power-up each game is forced L2+' },
  { relics: ['rabbit_foot','lucky_coin']  as [string,string], id: 'lucky_streak', name: 'Lucky Streak', desc: 'Free-spot chance raised to 30%' },
  { relics: ['bottle_cap', 'change_jar']  as [string,string], id: 'loose_change', name: 'Loose Change', desc: 'Coin threshold capped at 20 pts' },
  { relics: ['route_sign', 'compass']     as [string,string], id: 'road_warrior', name: 'Road Warrior', desc: 'Rival earns 30% fewer pts (total)' },
];

export const RELIC_SETS = [
  { id: 'truckers_pride',  name: "Trucker's Pride",  relics: ['thermos', 'trucker_die', 'compass'],       desc: 'Watch commits +2 pts; rival earns 30% fewer pts' },
  { id: 'wanderers_cache', name: "Wanderer's Cache", relics: ['rabbit_foot', 'route_sign', 'atlas'],       desc: 'Each power-up earned also gives +1 pt' },
  { id: 'lucky_haul',      name: 'Lucky Haul',       relics: ['lucky_coin', 'bottle_cap', 'change_jar'],  desc: 'Coin threshold 1/20 pts; Patrol gives +10 coins' },
];

// ─── Crew Members ────────────────────────────────────────────────────────────

export const RELIC_CRAFT_COST = 100;

export interface CrewMember {
  id: string;
  name: string;
  emoji: string;
  title: string;
  passive: string;
  activeDesc: string;
  shopCost: number;
}

export const CREW_MEMBERS: CrewMember[] = [
  {
    id: 'navigator', name: 'Emily', emoji: '🗺️',
    title: 'Navigator',
    passive: 'First power-up each game is forced L2+',
    activeDesc: 'Immediately find a free relic',
    shopCost: 80,
  },
  {
    id: 'mechanic', name: 'Dale', emoji: '🔧',
    title: 'Mechanic',
    passive: 'Patrol stops last 8s instead of 15s',
    activeDesc: 'End the current patrol stop immediately',
    shopCost: 100,
  },
  {
    id: 'scout', name: 'Alex', emoji: '🔭',
    title: 'Scout',
    passive: '+1 pt per Spot when streak is 3+',
    activeDesc: 'Add 5 to your current spot streak',
    shopCost: 90,
  },
  {
    id: 'dj', name: 'Trina', emoji: '🎵',
    title: 'DJ',
    passive: 'Watch ticks 15% faster while a road event is active',
    activeDesc: 'Trigger a random positive road event immediately',
    shopCost: 110,
  },
  {
    id: 'trucker', name: 'Mac', emoji: '🚛',
    title: 'Trucker',
    passive: '+2 credits per Watch commit',
    activeDesc: 'Double your current pending Watch credits',
    shopCost: 120,
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
  { id: 'traffic_jam',    name: 'Traffic Jam',      desc: 'Watch tick paused for 45s — stuck in gridlock!',        duration: 45, color: '#cc4400' },
  { id: 'speed_trap',     name: 'Speed Trap!',      desc: 'Patrol risk doubled for 60s — easy on the gas.',        duration: 60, color: '#dd0000' },
  { id: 'open_road',      name: 'Open Road!',       desc: '+1 pt per spot for 30s — clear skies ahead!',           duration: 30, color: '#00aa44' },
  { id: 'gas_station',    name: 'Gas Station',      desc: 'Spend 10 credits for +25 pts, or drive past.',          duration: 0,  color: '#ccaa00' },
  { id: 'shortcut',       name: 'Shortcut!',        desc: 'Spend 8 coins for +30 pts, or stay on the road.',       duration: 0,  color: '#0099cc' },
  { id: 'market',         name: 'Roadside Market',  desc: 'Trade 20 credits for 8 coins, or drive past.',          duration: 0,  color: '#aa8800' },
  { id: 'mountain_pass',  name: 'Mountain Pass',    desc: 'Spend 5 coins for a guaranteed L3 power-up, or pass.',  duration: 0,  color: '#8844aa' },
];

// ─── Badge Synergies ──────────────────────────────────────────────────────────

export const BADGE_SYNERGIES = [
  { id: 'dragon_phoenix',     badges: ['dragon', 'phoenix']     as [string,string], name: 'Inferno',        desc: 'Streak milestone bonuses give 2× pts' },
  { id: 'kraken_nessie',      badges: ['kraken', 'nessie']      as [string,string], name: 'Deep Waters',    desc: 'Watch commit also gives +3 credits' },
  { id: 'kitsune_bigfoot',    badges: ['kitsune', 'bigfoot']    as [string,string], name: 'Forest Spirits', desc: 'Steal flashes always blocked' },
  { id: 'unicorn_leprechaun', badges: ['unicorn', 'leprechaun'] as [string,string], name: 'Lucky Hoard',    desc: 'Coin rate: 1 per 15 pts' },
  { id: 'sphinx_griffin',     badges: ['sphinx', 'griffin']     as [string,string], name: 'Noble Wings',    desc: 'Power-up activation gives +1 free credit' },
  { id: 'thunderbird_ifrit',  badges: ['thunderbird', 'ifrit']  as [string,string], name: 'Storm & Flame',  desc: 'Thunderbird bonus applies in all weather' },
];

// ─── Badge Rivalries ─────────────────────────────────────────────────────────

export const BADGE_RIVALRIES: [string, string][] = [
  ['dragon',     'phoenix'],
  ['kitsune',    'bigfoot'],
  ['kraken',     'nessie'],
  ['thunderbird','yeti'],
  ['manticore',  'sphinx'],
];

// ─── Badge Trials ─────────────────────────────────────────────────────────────

export const BADGE_TRIALS: Record<string, { desc: string; target: number; effectDesc: string; }> = {
  dragon:     { desc: 'Exhaust Dragon\'s full 5-event flash shield in one game',    target: 5,   effectDesc: 'Flash events appear 20% less often' },
  kitsune:    { desc: 'Block 8 steal attempts in one game with Kitsune active',     target: 8,   effectDesc: 'Blocked steal: 30% chance to gain a power-up' },
  nessie:     { desc: 'Trigger Nessie\'s rare sighting event with Nessie active',   target: 1,   effectDesc: '+5 pts on every Watch commit' },
  sphinx:     { desc: 'Activate 10 L2+ power-ups in one game',                      target: 10,  effectDesc: 'Power-up activation gives +3 extra pts' },
  griffin:    { desc: 'Get 20 free spots from Griffin in one game',                  target: 20,  effectDesc: 'Extra 20% free credit chance' },
  bigfoot:    { desc: 'Trigger 2 Bigfoot encounter events with Bigfoot active',      target: 2,   effectDesc: '5% chance of +5 bonus pts per Spot' },
  valkyrie:   { desc: 'Win 5 boss fights with Valkyrie active',                     target: 5,   effectDesc: '+10 pts per boss win while active' },
  thunderbird:{ desc: 'Score 300 pts from rainy-weather spots with Thunderbird active', target: 300, effectDesc: '+1 pt per Spot in any weather while active' },
  unicorn:    { desc: 'Earn 30 coins from spot scoring with Unicorn active',         target: 30,  effectDesc: 'Coin threshold −3 while active' },
  kraken:     { desc: 'Freeze the rival 3 times with Kraken active',                 target: 3,   effectDesc: '+1 credit per Watch commit while active' },
  phoenix:    { desc: 'Earn 50 coins in one game with Phoenix active',               target: 50,  effectDesc: 'Coin floor +3 while active' },
  yeti:       { desc: 'Commit Watch with 60+ pending credits once',                  target: 1,   effectDesc: '+4 credits per Watch commit while active' },
  manticore:  { desc: 'Complete 3 flash challenges with Manticore active',           target: 3,   effectDesc: '+5 pts per flash challenge started while active' },
  mermaid:    { desc: 'Earn 10 patience bonuses in one game with Mermaid active',    target: 10,  effectDesc: 'Patience bonus at 8+ pending credits while active' },
  centaur:    { desc: 'Accumulate 250 Watch credits in one game with Centaur active', target: 250, effectDesc: '+2 credits per Watch commit while active' },
  leprechaun: { desc: 'Earn 40 coins from spot scoring with Leprechaun active',      target: 40,  effectDesc: 'Shop coin discount +2 while active' },
  wendigo:    { desc: 'Complete 3 bingo boards in one game with Wendigo active',     target: 3,   effectDesc: '+5 pts per bingo line while active' },
  shuck:      { desc: 'Tap aggressively 30× without triggering patrol, Black Shuck active', target: 30, effectDesc: 'Patrol chance −10% extra while active' },
  kirin:      { desc: 'Trigger Kirin multiplier 15 times in one game',              target: 15,  effectDesc: '+10 pts when Kirin multiplier fires' },
  ifrit:      { desc: 'Convert 300 pending credits across commits with Ifrit active', target: 300, effectDesc: '+5% of pending added as bonus pts while active' },
};

export const BADGE_MASTERY_THRESHOLD = 10;

// ─── Badge Prestige ───────────────────────────────────────────────────────────
// Permanent cross-game passives unlocked by prestiging (mastered + trial done)

export const BADGE_PRESTIGE_PASSIVES: Record<string, string> = {
  dragon:      'Flash events 10% less frequent in all games',
  kitsune:     '15% steal-block chance in all games',
  nessie:      '+1 pt on every Watch commit in all games',
  sphinx:      '+1 pt when activating any power-up in all games',
  griffin:     '5% free-spot chance in all games',
  bigfoot:     '2% chance of +3 bonus pts per Spot in all games',
  valkyrie:    '+5 pts on every boss fight win',
  thunderbird: '+1 pt per Spot in all weather',
  unicorn:     'Coin threshold −3 in all games',
  kraken:      'Rival grows 15% slower in all games',
  phoenix:     'Coin floor stays at 3 in all games',
  yeti:        'Credits decay 20% slower in all games',
  manticore:   'Flash challenge windows 10% longer in all games',
  mermaid:     'Patience bonus at 9+ pending credits in all games',
  centaur:     'Watch ticks 150ms faster in all games',
  leprechaun:  'All shop items −1 coin in all games',
  wendigo:     '+5 pts per bingo line in all games',
  shuck:       'Patrol chance −10% in all games',
  kirin:       '+5 pts every 12th Spot in all games',
  ifrit:       '+2% of pending credits as bonus pts on Watch commit',
};

// ─── Badge Challenges ─────────────────────────────────────────────────────────

export type BadgeChallengeType = 'flash_block' | 'steal_block' | 'commit_big' | 'powerup_use' | 'boss_win' | 'pts_total' | 'spot_count';

export interface BadgeChallengeDef {
  badgeId: string;
  desc: string;
  type: BadgeChallengeType;
  target: number;   // progress needed (for commit_big: 1 = once; threshold field sets min pending)
  reward: number;   // coins on completion
  threshold?: number; // for commit_big: minimum pending credits required
}

export const BADGE_CHALLENGES: BadgeChallengeDef[] = [
  { badgeId: 'dragon',      desc: 'Block 3 flash events',                   type: 'flash_block', target: 3,   reward: 15 },
  { badgeId: 'kitsune',     desc: 'Block 3 steal attempts',                 type: 'steal_block', target: 3,   reward: 20 },
  { badgeId: 'nessie',      desc: 'Commit Watch with 30+ pending credits',  type: 'commit_big',  target: 1,   threshold: 30, reward: 15 },
  { badgeId: 'sphinx',      desc: 'Activate 4 power-ups',                   type: 'powerup_use', target: 4,   reward: 15 },
  { badgeId: 'griffin',     desc: 'Score 80 pts from spots',                type: 'pts_total',   target: 80,  reward: 12 },
  { badgeId: 'bigfoot',     desc: 'Spot 25 times',                          type: 'spot_count',  target: 25,  reward: 18 },
  { badgeId: 'valkyrie',    desc: 'Win a boss fight',                       type: 'boss_win',    target: 1,   reward: 20 },
  { badgeId: 'thunderbird', desc: 'Score 50 pts from spots',                type: 'pts_total',   target: 50,  reward: 12 },
  { badgeId: 'unicorn',     desc: 'Spot 20 times',                          type: 'spot_count',  target: 20,  reward: 10 },
  { badgeId: 'kraken',      desc: 'Activate 3 power-ups',                   type: 'powerup_use', target: 3,   reward: 12 },
  { badgeId: 'phoenix',     desc: 'Score 60 pts from spots',                type: 'pts_total',   target: 60,  reward: 12 },
  { badgeId: 'yeti',        desc: 'Spot 30 times',                          type: 'spot_count',  target: 30,  reward: 15 },
  { badgeId: 'manticore',   desc: 'Score 100 pts from spots',               type: 'pts_total',   target: 100, reward: 18 },
  { badgeId: 'mermaid',     desc: 'Commit Watch with 20+ pending credits',  type: 'commit_big',  target: 1,   threshold: 20, reward: 12 },
  { badgeId: 'centaur',     desc: 'Spot 35 times',                          type: 'spot_count',  target: 35,  reward: 15 },
  { badgeId: 'leprechaun',  desc: 'Score 70 pts from spots',                type: 'pts_total',   target: 70,  reward: 12 },
  { badgeId: 'wendigo',     desc: 'Activate 5 power-ups',                   type: 'powerup_use', target: 5,   reward: 15 },
  { badgeId: 'shuck',       desc: 'Score 40 pts from spots',                type: 'pts_total',   target: 40,  reward: 10 },
  { badgeId: 'kirin',       desc: 'Spot 40 times',                          type: 'spot_count',  target: 40,  reward: 18 },
  { badgeId: 'ifrit',       desc: 'Activate 3 power-ups',                   type: 'powerup_use', target: 3,   reward: 12 },
];
