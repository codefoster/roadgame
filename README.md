# Road Game

A road trip spotting game for iOS and Android built with React Native and Expo. Players watch for things out the window, rack up credits by holding the Watch button, spend those credits to score Sightings, and unlock a deep meta-game of badges, relics, power-ups, bosses, and bingo.

## Running Locally

```bash
cd roadgame-expo
npm install
npx expo start
```

Scan the QR code with the Expo Go app, or press `w` for web.

---

## Core Loop

### Spot (A)
Press when you see something out the window — an animal, building, sign, anything except the sky and the road itself. Costs **1 Credit** and scores **Sighting points**. Points depend on your region, weather, active badges, and equipped relics.

### Watch (B)
Lock eyes on a target and hold Watch to accumulate **Credits**. The longer you watch, the more credits stack up — and the higher the tier of power-up you earn when you commit (by pressing A or stopping Watch). Credits are committed and converted to a power-up automatically.

| Credits held | Power-up tier |
|---|---|
| 10+ | Level 1 |
| 30+ | Level 2 |
| 60+ | Level 3 |

### Mode toggle
Flips Watch between **hold-to-accumulate** and **tap-to-toggle** mode.

---

## Difficulty Scaling

The Watch timer slows as your score climbs. Credits also decay passively at high scores.

| Score | Watch speed |
|---|---|
| 0–199 | fast |
| 200–499 | ×1.25 slower |
| 500–799 | ×1.5 slower |
| 800–999 | ×1.75 slower |
| 1000+ | ×2.0 slower |

A **Level Up** flash appears when crossing each threshold.

---

## Power-ups

Power-ups queue up as you commit Watch holds. Tap one to activate it immediately.

**Level 1** — Infinite Credits (5s), Double Points (5s), Lucky Roll, Next Spot free, Double next hold  
**Level 2** — Infinite Credits (10s), Double Points (10s), Hold 2× pts on looks, Grass bonus (3×, 5s), Next power-up is L+1  
**Level 3** — Flip Switch, 2× pending now, Re-roll top, Spot = looks × pts, Jackpot hold

### Crafting & Fusion

- **Craft** — Spend 12 coins to upgrade an L1 power-up to L2, or 20 coins to upgrade L2 to L3
- **Fuse** — Combine 3 power-ups of the same tier into 1 power-up of the next tier (free)

---

## Flash Events

Random events fire periodically and require a response or deal a penalty:

| Event | Effect |
|---|---|
| Power-up stolen | Removes your top power-up (Kitsune badge can block) |
| Challenge: Spot 3 | Spot 3 times within a time window for bonus pts |
| Challenge: Watch X | Accumulate X credits within a time window |
| Challenge: Earn L2+ | Earn a level 2+ power-up within the time window |

Flash frequency increases above 800 pts.

---

## Badges

Equip up to 2 badges before each game. Each badge has 4 levels (upgrade with coins), a cooldown between uses, and a **mastery** count.

| Badge | Effect |
|---|---|
| Bigfoot | Chance of 3× Spot (rare encounter event) |
| Phoenix | Coin balance never drops below a floor |
| Unicorn | Earn 1 coin per N pts scored |
| Kraken | Reduces rival score gain; 20% chance to freeze rival 2 turns |
| Yeti | Credits never decay |
| Dragon | Blocks every other flash event (1st, 3rd, 5th of first 5) |
| Leprechaun | Shop items cost fewer coins |
| Mermaid | Patience bonus pts when Watch commits with many pending credits |
| Sphinx | Bonus pts each time a power-up is activated |
| Centaur | Watch ticks faster |
| Griffin | Chance of a free Spot (no credit cost) |
| Black Shuck | Reduces patrol pull-over chance |
| Kitsune | Chance to block steal flashes |
| Thunderbird | Bonus pts per Spot in rainy weather |
| Nessie | Bonus pts on every Watch commit |
| Ifrit | Bonus pts equal to a percentage of pending credits on commit |
| Kirin | Every Nth Spot scores 3× |
| Manticore | Flash challenge time windows are longer |
| Wendigo | Bonus pts per bingo line completed |
| Valkyrie | Increased boss fight win chance; sees harder/better bosses |

### Badge Levels & Mastery

Each badge can be upgraded to level 3 by spending coins. Using a badge counts toward **mastery** (10 uses). Higher levels reduce cooldowns and increase the effect.

### Prestige

A mastered, level-3 badge can be **prestiged** once a unique trial is completed in-game. Prestige unlocks a permanent passive that applies to every future game, even without equipping the badge.

---

## Relics

Relics are found during play (1/40 chance per Spot) and slot into up to 3 equipment slots. Each relic has passive effects, and certain pairs create **synergy bonuses**. Some sets of 3 create powerful **set bonuses**.

Relics can be leveled up by finding duplicates in the field.

---

## Shop

Spend coins before or during a game on permanent upgrades:

- **Hunter's Kit** — Raises boss fight win chance
- **Power Relic** — Greatly raises boss fight win chance
- **Spare Tire** — Saves you once when credits hit 0
- **CB Radio** — Previews the next badge you'd earn from a Double Golden Bingo; warns of patrol stops
- **Rival Chill** — Freezes the rival for 5 turns at game start
- **Rival Decoy** — Starts the rival at −30 pts
- And more

A **Flash Sale** (33% chance on shop open) discounts one random item by 40%. One random **Bundle Deal** is shown each visit, grouping related items at a discount.

---

## Bingo

A 3×3 bingo card is generated each game from road trip items. Mark cells by tapping during play — but every mark costs a credit.

- **Bingo** (complete a line) — Coins + pts
- **Golden Bingo** (line contains a golden tile) — More coins + pts
- **Double Golden Bingo** (line contains 2 golden tiles) — Even more, plus a random badge earned
- **Reset Card** — Available for −30 pts

---

## Bosses

Bosses appear randomly during play (1/150 chance per Spot, or 1/75 if a rematch is pending). Each boss has unique powers, win chances, loss penalties, and an optional deal.

### Fighting
Choose bare hands, Hunter's Kit, Power Relic, or both. Having the boss's specific **weakness badge or relic** adds +25% win chance. Win to earn pts and coins; lose to take a pts penalty and possibly a **curse**.

### Boss Scaling
Boss rewards and penalties scale with your current score: ×1.25 at 200, ×1.5 at 500, ×1.75 at 800, ×2.0 at 1000 pts.

### Rematch System
Fleeing a boss sets it as a **rematch target** — it spawns at twice the normal rate until you face it. The encounter screen labels it a REMATCH and shows a doubled-spawn warning.

### Curses
Losing to certain bosses applies a curse for the rest of the game (e.g. every 5th Spot scores 0, Watch ticks 25% slower, each Spot costs +1 extra credit).

---

## Rival

A rival AI scores in the background every 5 seconds. If the rival reaches your score, the game gets harder. Kraken reduces the rival's score gain per turn and has a 20% chance to freeze the rival for 2 turns.

---

## Patrol

Tapping aggressively (4+ presses per second) risks a **highway patrol stop** — a 15-second freeze during which Watch is paused. CB Radio gives advance warning. Black Shuck badge reduces patrol chance significantly.

---

## Road Events

Passive road events appear during play and modify game conditions for a duration:

- **Open Road** — +1 pt per Spot
- **Speed Trap** — Doubles patrol aggression calculation
- And others

---

## Multiplayer

A timed competitive mode where two players score simultaneously. A zap mechanic can briefly freeze your opponent. The higher score at time's end wins.

---

## Building for Android / iOS

```bash
cd roadgame-expo
npx expo build:android   # or :ios
```

Or use EAS Build:

```bash
npm install -g eas-cli
eas build --platform android
```
