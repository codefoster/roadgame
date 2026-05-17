# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `w` for web.

## Architecture

- `app/` — Expo Router screens (`index.tsx` = start screen, `game.tsx` = main game, `lobby.tsx` = multiplayer)
- `src/components/` — Reusable overlay components (modals, banners)
- `src/stores/` — Zustand state:
  - `persistentStore.ts` — cross-game data (coins, badges, prestige) backed by AsyncStorage
  - `gameStore.ts` — per-game ephemeral state (scores, effects, power-ups)
- `src/lib/` — Pure game logic helpers (`gameLogic.ts`, `dailyChallenges.ts`, `relay.ts`)
- `src/constants/game.ts` — All game data (badges, relics, bosses, regions, etc.)

## Deployment target

- iOS and Android via EAS Build
- Package: `com.codefoster.roadgame`
- Config lives in `app.json`

## Building

```bash
npm install -g eas-cli
eas build --platform android   # or ios
```
