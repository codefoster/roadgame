import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Region, Weather, TOURISTS, HITCHHIKERS, BOSSES, BADGES, ROAD_EVENTS, RELICS, POWERUPS, BADGE_SYNERGIES, BADGE_TRIALS, RELIC_SYNERGIES, RELIC_SETS, BADGE_CHALLENGES, BADGE_PRESTIGE_PASSIVES, BadgeChallengeType } from '../src/constants/game';
import {
  bInterval, decayRate, decayThreshold,
  flashInterval, generatePowerup, spotPoints, watchTier,
  rivalAction, checkPatrol, randInt, pickRandom,
} from '../src/lib/gameLogic';
import { RelayClient } from '../src/lib/relay';
import { useGameStore } from '../src/stores/gameStore';
import { usePersistentStore } from '../src/stores/persistentStore';

import FlashOverlay from '../src/components/FlashOverlay';
import BingoCard from '../src/components/BingoCard';
import AlphabetHunt from '../src/components/AlphabetHunt';
import TouristOverlay from '../src/components/TouristOverlay';
import PowerupList from '../src/components/PowerupList';
import HitchhikerBanner from '../src/components/HitchhikerBanner';
import BossFightOverlay from '../src/components/BossFightOverlay';
import RoadEventBanner from '../src/components/RoadEventBanner';
import RoadEventOverlay from '../src/components/RoadEventOverlay';
import RelicSwapOverlay from '../src/components/RelicSwapOverlay';

// ─── helpers ──────────────────────────────────────────────────────────────────

function hasBadge(activeBadges: string[], id: string) {
  return activeBadges.includes(id);
}
function badgeLevel(badgeLevels: Record<string, number>, id: string) {
  return badgeLevels[id] ?? 0;
}
function hasSynergy(activeBadges: string[], synId: string) {
  const syn = BADGE_SYNERGIES.find(s => s.id === synId);
  return syn ? syn.badges.every(b => activeBadges.includes(b)) : false;
}
function hasRelicSynergy(relics: string[], synId: string) {
  const syn = RELIC_SYNERGIES.find(s => s.id === synId);
  return syn ? syn.relics.every(r => relics.includes(r)) : false;
}
function hasRelicSet(relics: string[], setId: string) {
  const s = RELIC_SETS.find(s => s.id === setId);
  return s ? s.relics.every(r => relics.includes(r)) : false;
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    weather: Weather; region: Region;
    activeBadges: string; purchases: string;
    roomCode?: string; mpRole?: 'host' | 'guest';
  }>();

  const store = useGameStore();
  const persist = usePersistentStore();

  // Parse params
  const weather  = params.weather  ?? 'sunny';
  const region   = params.region   ?? 'forest';
  const activeBadges = params.activeBadges ? params.activeBadges.split(',').filter(Boolean) : [];
  const purchases    = params.purchases    ? params.purchases.split(',').filter(Boolean) : [];
  const mpActive = !!params.roomCode;
  const mpRole   = params.mpRole ?? 'host';

  // Timer handles
  const bTimerRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const decayTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const touristTimerRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const rivalTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const patrolTimerRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const mpSyncRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const mpCountdownRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const mpZapRef        = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const relayRef        = useRef<RelayClient | null>(null);
  const MP_DURATION     = 180; // seconds
  const infiniteRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const doubleRef       = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const grassRef        = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const patrolBlockRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const roadEventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cbChatterRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const coinAccRef      = useRef(0); // accumulated points toward next coin
  const patrolPausedWatch = useRef(false);

  const [bingoVisible, setBingoVisible] = useState(false);
  const [alphaVisible, setAlphaVisible] = useState(false);
  const [hitchhikerPopup, setHitchhikerPopup] = useState<{ name: string; description: string; duration: number } | null>(null);
  const [roadEventBanner, setRoadEventBanner] = useState<{ name: string; desc: string; color: string; duration: number } | null>(null);

  // ── init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    store.initGame({ weather, region, activeBadges, purchases });

    // Badge challenge: pick one at random from active badges that have a defined challenge
    const eligibleChallenges = BADGE_CHALLENGES.filter(c => activeBadges.includes(c.badgeId));
    if (eligibleChallenges.length > 0) {
      const def = pickRandom(eligibleChallenges);
      store.setBadgeChallenge({
        badgeId: def.badgeId,
        desc: def.desc,
        type: def.type,
        target: def.target,
        progress: 0,
        reward: def.reward,
        completed: false,
        threshold: def.threshold,
      });
    }

    // Phoenix: set coin floor for this game
    if (activeBadges.includes('phoenix')) {
      const level = badgeLevel(persist.badgeLevels, 'phoenix');
      const trialBonus = persist.completedTrials.includes('phoenix') ? 3 : 0;
      persist.setCoinFloor(5 + level * 5 + trialBonus);
    } else if (persist.prestigedBadges.includes('phoenix')) {
      persist.setCoinFloor(3);
    }

    // CB Radio: pre-pick next badge reward
    if (purchases.includes('cb_radio') && Math.random() < 0.12) {
      const unowned = BADGES.map(b => b.id).filter(id => !persist.badges.includes(id));
      if (unowned.length > 0) store.setNextBadge(pickRandom(unowned));
    }

    scheduleFlash();
    startDecay();
    scheduleTourist();
    scheduleRival();
    scheduleRoadEvent();
    if (purchases.includes('cb_radio')) scheduleChatter();

    if (mpActive) setupMultiplayer();

    return () => clearAllTimers();
  }, []);

  function clearAllTimers() {
    [bTimerRef, decayTimerRef, rivalTimerRef, mpSyncRef, mpCountdownRef].forEach(r => r.current && clearInterval(r.current));
    if (mpZapRef.current) clearTimeout(mpZapRef.current);
    [flashTimerRef, touristTimerRef, patrolTimerRef, infiniteRef, doubleRef, grassRef, patrolBlockRef, roadEventTimerRef, cbChatterRef]
      .forEach(r => r.current && clearTimeout(r.current));
    relayRef.current?.stop();
  }

  // ── multiplayer ─────────────────────────────────────────────────────────────

  function setupMultiplayer() {
    const startTime = Date.now();

    const client = new RelayClient(params.roomCode!, (msg) => {
      if (msg.type === 'sync' && msg.payload) {
        store.setMpOpponentScore(msg.payload.score as number ?? 0);
        if (msg.payload.hasCbRadio !== undefined) {
          store.setMpOpponentHasCbRadio(!!msg.payload.hasCbRadio);
        }
      }
      if (msg.type === 'zap') {
        store.setMpZapped(true);
        doFlash('⚡ Zapped by opponent!', '#ffff00');
        if (mpZapRef.current) clearTimeout(mpZapRef.current);
        mpZapRef.current = setTimeout(() => store.setMpZapped(false), 5000);
      }
      if (msg.type === 'chatter' && msg.payload) {
        doFlash(msg.payload.text as string ?? '📻 Radio chatter…', msg.payload.color as string ?? '#ff8800');
      }
    });
    client.start();
    relayRef.current = client;

    store.setMpTimeLeft(MP_DURATION);

    mpSyncRef.current = setInterval(() => {
      client.send('sync', {
        score: useGameStore.getState().scoreA,
        hasCbRadio: purchases.includes('cb_radio'),
      });
    }, 2000);

    mpCountdownRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, MP_DURATION - elapsed);
      store.setMpTimeLeft(left);
      if (left === 0) {
        clearInterval(mpCountdownRef.current!);
        clearInterval(mpSyncRef.current!);
        const gs = useGameStore.getState();
        if (gs.scoreA > gs.mpOpponentScore) store.setMpResult('win');
        else if (gs.scoreA < gs.mpOpponentScore) store.setMpResult('lose');
        else store.setMpResult('tie');
      }
    }, 1000);
  }

  function pressZap() {
    const s = useGameStore.getState();
    if (s.scoreB < 15 || !relayRef.current) return;
    store.addScoreB(-15);
    relayRef.current.send('zap', {});
    doFlash('⚡ Zapped opponent!', '#ff8800');
  }

  function pressDeceive() {
    const s = useGameStore.getState();
    if (s.scoreB < 10 || !relayRef.current) return;
    store.addScoreB(-10);
    const fakeMessages = [
      { text: '📻 Bear in the air, back it down!', color: '#ffaa00' },
      { text: '📻 Breaker — hot spot ahead!', color: '#ff8800' },
      { text: '📻 Easy miles out here! +20 credits', color: '#00ccff' },
      { text: '📻 Good hunting! +15 pts', color: '#aaffaa' },
    ];
    const fake = pickRandom(fakeMessages);
    relayRef.current.send('chatter', { text: fake.text, color: fake.color });
    doFlash('📻 Sent false chatter!', '#aa44ff');
  }

  // ── B: watch ────────────────────────────────────────────────────────────────

  function startWatch() {
    if (bTimerRef.current) return;
    store.setBWatching(true);
    const interval = bInterval(
      store.scoreA, hasBadge(activeBadges, 'centaur'),
      badgeLevel(persist.badgeLevels, 'centaur')
    );
    let actualInterval = store.hWatchDouble ? interval / 2 : interval;
    if (persist.prestigedBadges.includes('centaur')) actualInterval = Math.max(200, actualInterval - 150);
    const gs0 = useGameStore.getState();
    if (gs0.relics.includes('thermos')) {
      const rl_thermos = persist.relicLevels?.['thermos'] ?? 0;
      actualInterval = Math.floor(actualInterval * (rl_thermos >= 1 ? 0.75 : 0.85));
    }
    if (Date.now() < gs0.relicWatchBoostExpiry) actualInterval = Math.floor(actualInterval * 0.5);
    if (gs0.activeCurses.includes('frozen_watch')) actualInterval = Math.floor(actualInterval * 1.25);
    bTimerRef.current = setInterval(onBTick, actualInterval);
  }

  function stopWatch() {
    if (!bTimerRef.current) return;
    clearInterval(bTimerRef.current);
    bTimerRef.current = null;
    store.setBWatching(false);
    commitWatch();
  }

  function onBTick() {
    const s = useGameStore.getState();
    if (s.roadEventId === 'traffic_jam' && Date.now() < s.roadEventExpiry) return;

    let credit = 1;
    if (weather === 'rainy') credit += 1;
    if (store.stackHold) {
      const newCount = store.stackHoldCount + 1;
      store.setEffect({ stackHoldCount: newCount });
      store.addPendingB(newCount);
    } else if (store.jackpotHold) {
      store.addPendingB(credit * 2);
    } else {
      store.addPendingB(credit);
    }

    // Challenge progress: watch_credits type
    if (store.flashChallenge?.type === 'watch_credits') {
      store.updateChallengeProgress(credit);
    }
  }

  function streakBonus(streak: number): number {
    if (streak >= 15) return 10;
    if (streak >= 10) return 5;
    if (streak >= 5) return 2;
    return 0;
  }

  function commitWatch() {
    store.resetStreak();
    const pending = store.pendingB;
    if (pending <= 0) return;

    const tier = watchTier(pending);
    if (tier > 0) {
      const gs = useGameStore.getState();
      const relicsNow = gs.relics;
      const rl_atlas = relicsNow.includes('atlas') ? (persist.relicLevels?.['atlas'] ?? 0) : -1;

      // Compute effective tier
      const atlasBump = rl_atlas >= 2 && Math.random() < 0.10;
      let adjustedTier = atlasBump ? Math.min(3, tier + 1) as 1|2|3 : tier as 1|2|3;
      const navSyn = hasRelicSynergy(relicsNow, 'navigator') && gs.relicNavFirst;
      if (navSyn) { adjustedTier = Math.max(2, adjustedTier) as 1|2|3; store.setRelicNavFirst(false); }

      const forcedTier = gs.cursedPowerupsLeft > 0 ? 1 : gs.relicForceL3 ? 3 : adjustedTier;
      if (gs.cursedPowerupsLeft > 0) store.setCursedPowerupsLeft(gs.cursedPowerupsLeft - 1);
      if (gs.relicForceL3) store.setRelicForceL3(false);

      const code = generatePowerup(forcedTier, region, store.luckyRoll, store.powerSurge);
      store.addPowerup(code);
      if (store.luckyRoll) store.setEffect({ luckyRoll: false });
      if (store.powerSurge) store.setEffect({ powerSurge: false });

      // Atlas: credits on powerup earn
      if (rl_atlas >= 0) store.addScoreB(rl_atlas >= 1 ? 2 : 1);

      // Road Diner synergy: +1 credit on commit
      if (hasRelicSynergy(relicsNow, 'road_diner')) store.addScoreB(1);

      // Wanderer's Cache set: +1 pt per powerup earned
      if (hasRelicSet(relicsNow, 'wanderers_cache')) store.addScoreA(1);

      // Challenge: earn l2+
      if (store.flashChallenge?.type === 'earn_l2' && tier >= 2) {
        store.updateChallengeProgress(1);
        // Manticore trial: earn_l2 target is 1, so this always completes the challenge
        if (hasBadge(activeBadges, 'manticore')) {
          const prevMant = useGameStore.getState().trialProgress['manticore'] ?? 0;
          if (prevMant < (BADGE_TRIALS['manticore']?.target ?? 3)) {
            store.updateTrialProgress('manticore', 1);
            if (!persist.completedTrials.includes('manticore') && prevMant + 1 >= (BADGE_TRIALS['manticore']?.target ?? 3)) {
              persist.completeTrial('manticore');
              doFlash('Manticore Trial complete!', '#ff4488');
            }
          }
        }
      }
    }

    // Nessie patience bonus every 20s
    if (hasBadge(activeBadges, 'nessie')) {
      const level = badgeLevel(persist.badgeLevels, 'nessie');
      store.addScoreA(1 + level);
      // Nessie trial done: +5 pts on every Watch commit
      if (persist.completedTrials.includes('nessie')) store.addScoreA(5);
    } else {
      // Mermaid patience bonus (prestige: trigger at 9+; trial done: trigger at 8+)
      const mermaidThreshold = hasBadge(activeBadges, 'mermaid') && persist.completedTrials.includes('mermaid') ? 8
        : persist.prestigedBadges.includes('mermaid') ? 9
        : 10;
      if (pending >= mermaidThreshold) {
        const mermaidBonus = hasBadge(activeBadges, 'mermaid')
          ? 10 + badgeLevel(persist.badgeLevels, 'mermaid') * 5
          : 5;
        store.addScoreA(mermaidBonus);
        // Mermaid trial: earn 10 patience bonuses in one game
        if (hasBadge(activeBadges, 'mermaid')) {
          const prevMer = useGameStore.getState().trialProgress['mermaid'] ?? 0;
          if (prevMer < (BADGE_TRIALS['mermaid']?.target ?? 10)) {
            store.updateTrialProgress('mermaid', 1);
            if (!persist.completedTrials.includes('mermaid') && prevMer + 1 >= (BADGE_TRIALS['mermaid']?.target ?? 10)) {
              persist.completeTrial('mermaid');
              doFlash('Mermaid Trial complete!', '#00ccff');
            }
          }
        }
      }
    }

    // Yeti trial: commit Watch with 60+ pending credits once
    if (hasBadge(activeBadges, 'yeti') && pending >= 60) {
      const prev = useGameStore.getState().trialProgress['yeti'] ?? 0;
      if (prev < (BADGE_TRIALS['yeti']?.target ?? 1)) {
        store.updateTrialProgress('yeti', 1);
        if (!persist.completedTrials.includes('yeti') && prev + 1 >= (BADGE_TRIALS['yeti']?.target ?? 1)) {
          persist.completeTrial('yeti');
          doFlash('Yeti Trial complete!', '#aaffff');
        }
      }
    }
    // Yeti trial done: +4 credits per Watch commit
    if (hasBadge(activeBadges, 'yeti') && persist.completedTrials.includes('yeti')) store.addScoreB(4);

    // Kraken trial done: +1 credit per Watch commit
    if (hasBadge(activeBadges, 'kraken') && persist.completedTrials.includes('kraken')) store.addScoreB(1);

    // Centaur trial: accumulate 250 Watch credits in one game
    if (hasBadge(activeBadges, 'centaur')) {
      const prevCe = useGameStore.getState().trialProgress['centaur'] ?? 0;
      if (prevCe < (BADGE_TRIALS['centaur']?.target ?? 250)) {
        store.updateTrialProgress('centaur', pending);
        if (!persist.completedTrials.includes('centaur') && prevCe + pending >= (BADGE_TRIALS['centaur']?.target ?? 250)) {
          persist.completeTrial('centaur');
          doFlash('Centaur Trial complete!', '#ffdd44');
        }
      }
    }
    // Centaur trial done: +2 credits per Watch commit
    if (hasBadge(activeBadges, 'centaur') && persist.completedTrials.includes('centaur')) store.addScoreB(2);

    // Ifrit trial: accumulate 150 pending credits across commits
    if (hasBadge(activeBadges, 'ifrit')) {
      const prev = useGameStore.getState().trialProgress['ifrit'] ?? 0;
      if (prev < (BADGE_TRIALS['ifrit']?.target ?? 300)) {
        store.updateTrialProgress('ifrit', pending);
        if (!persist.completedTrials.includes('ifrit') && prev + pending >= (BADGE_TRIALS['ifrit']?.target ?? 300)) {
          persist.completeTrial('ifrit');
          doFlash('Ifrit Trial complete!', '#ff8844');
        }
      }
      // Ifrit trial done: +5% of pending as bonus pts
      if (persist.completedTrials.includes('ifrit')) {
        const extra = Math.floor(pending * 0.05);
        if (extra > 0) store.addScoreA(extra);
      }
    }
    // Ifrit prestige: +2% of pending as bonus pts globally
    if (persist.prestigedBadges.includes('ifrit')) {
      const extra = Math.floor(pending * 0.02);
      if (extra > 0) store.addScoreA(extra);
    }

    // Nessie prestige passive: +1 pt on every Watch commit
    if (persist.prestigedBadges.includes('nessie')) store.addScoreA(1);

    // Kraken-Nessie synergy: +3 credits on Watch commit
    if (hasSynergy(activeBadges, 'kraken_nessie')) store.addScoreB(3);

    // Badge challenge: commit_big
    checkBadgeChallengeProgress('commit_big', 1, pending);

    store.commitPendingB();

    // Salamander: bonus pts from pending credits
    if (hasBadge(activeBadges, 'ifrit')) {
      const level = badgeLevel(persist.badgeLevels, 'ifrit');
      const ratio = [0.10, 0.20, 0.30, 0.40][level] ?? 0.10;
      const bonus = Math.floor(pending * ratio);
      if (bonus > 0) store.addScoreA(bonus);
    }

    // Trucker's Die: +5/8 pts on every commit; L2 also +1 credit
    const relicsCommit = useGameStore.getState().relics;
    if (relicsCommit.includes('trucker_die')) {
      const rl_die = persist.relicLevels?.['trucker_die'] ?? 0;
      store.addScoreA(rl_die >= 1 ? 8 : 5);
      if (rl_die >= 2) store.addScoreB(1);
    }
    // Thermos L2: +1 credit per commit
    if (relicsCommit.includes('thermos') && (persist.relicLevels?.['thermos'] ?? 0) >= 2) store.addScoreB(1);
    // Trucker's Pride set: +2 pts per commit
    if (hasRelicSet(relicsCommit, 'truckers_pride')) store.addScoreA(2);

    // Challenge progress: watch_credits completion check
    if (store.flashChallenge?.type === 'watch_credits') {
      const ch = store.flashChallenge;
      if (ch.progress >= ch.target) {
        store.addScoreA(30);
        store.clearFlash();
        // Manticore trial: completed a flash challenge
        if (hasBadge(activeBadges, 'manticore')) {
          const prevMant = useGameStore.getState().trialProgress['manticore'] ?? 0;
          if (prevMant < (BADGE_TRIALS['manticore']?.target ?? 3)) {
            store.updateTrialProgress('manticore', 1);
            if (!persist.completedTrials.includes('manticore') && prevMant + 1 >= (BADGE_TRIALS['manticore']?.target ?? 3)) {
              persist.completeTrial('manticore');
              doFlash('Manticore Trial complete!', '#ff4488');
            }
          }
        }
      }
    }
  }

  // ── A: spot ─────────────────────────────────────────────────────────────────

  function pressA() {
    if (store.patrolVisible) return;
    if (store.bossVisible) return;
    if (useGameStore.getState().mpZapped) return;
    if (store.scoreB < 1 && !store.infiniteCredits) return;

    store.logAggression();
    let freeSspot = false;

    if (store.bWatching && bTimerRef.current) {
      commitWatch();
      clearInterval(bTimerRef.current);
      const iv = bInterval(store.scoreA, hasBadge(activeBadges, 'centaur'), badgeLevel(persist.badgeLevels, 'centaur'));
      bTimerRef.current = setInterval(onBTick, store.hWatchDouble ? iv / 2 : iv);
    }
    if (store.nextACKeepB) store.setEffect({ nextACKeepB: false });

    // All-in power-up: score full credit balance
    if (store.nextAAllIn) {
      store.addScoreA(store.scoreB);
      store.setScoreB(0);
      store.setEffect({ nextAAllIn: false });
      checkCoinsFromScore(store.scoreB);
      return;
    }

    const liveScoreB = useGameStore.getState().scoreB;
    const { points, newCredits } = spotPoints(
      store.scoreA,
      liveScoreB,
      weather,
      store.doublePoints,
      store.grassVisible && store.grassOn,
      store.grassOn,
      store.hGeologist,
      store.hDJ,
      store.hBirdwatcher,
      activeBadges,
      persist.badgeLevels,
      store.spotCount
    );

    if (!store.infiniteCredits) {
      const gsA = useGameStore.getState();
      const relicsA = gsA.relics;
      const rl_coin = relicsA.includes('lucky_coin') ? (persist.relicLevels?.['lucky_coin'] ?? 0) : -1;
      let freeChance = rl_coin >= 0 ? (rl_coin >= 1 ? 0.15 : 0.10) : 0;
      if (persist.prestigedBadges.includes('griffin')) freeChance += 0.05;
      if (hasBadge(activeBadges, 'griffin') && persist.completedTrials.includes('griffin')) freeChance += 0.20;
      if (hasRelicSynergy(relicsA, 'lucky_streak')) freeChance = Math.max(freeChance, 0.30);
      const activationFree = gsA.relicFreeSpots > 0;
      freeSspot = activationFree || (freeChance > 0 && Math.random() < freeChance);
      if (activationFree && freeSspot) store.setRelicFreeSpots(gsA.relicFreeSpots - 1);
      // Griffin trial: get 20 free spots from Griffin (not from relic activation)
      if (freeSspot && !activationFree && hasBadge(activeBadges, 'griffin')) {
        const prevGr = useGameStore.getState().trialProgress['griffin'] ?? 0;
        if (prevGr < (BADGE_TRIALS['griffin']?.target ?? 20)) {
          store.updateTrialProgress('griffin', 1);
          if (!persist.completedTrials.includes('griffin') && prevGr + 1 >= (BADGE_TRIALS['griffin']?.target ?? 20)) {
            persist.completeTrial('griffin');
            doFlash('Griffin Trial complete!', '#aaffaa');
          }
        }
      }
      if (freeSspot) {
        // no credit deduction; lucky_coin L2: free spots give +1 pt bonus (applied below)
      } else {
        const spareTire = purchases.includes('spare_tire') && !store.spareTireUsed && newCredits <= 0;
        if (spareTire) { store.setScoreB(1); store.useSpareTire(); doFlash('Spare Tire used!', '#ffaa00'); }
        else store.setScoreB(newCredits);
      }
    }
    // Venom curse: extra credit cost
    if (!store.infiniteCredits && useGameStore.getState().activeCurses.includes('venom')) {
      store.addScoreB(-1);
    }

    const openRoad = store.roadEventId === 'open_road' && Date.now() < store.roadEventExpiry;
    const liveState = useGameStore.getState();
    const relicsNow = liveState.relics;
    const cursesNow = liveState.activeCurses;
    const spotCountNow = liveState.spotCount;
    const stoneCursed = cursesNow.includes('stone_touch') && (spotCountNow + 1) % 5 === 0;
    const voidCursed  = cursesNow.includes('void_phase')  && (spotCountNow + 1) % 8 === 0;

    // Route sign: +1 or +2 pts (leveled); +3 per remaining activation spots
    const rl_route = relicsNow.includes('route_sign') ? (persist.relicLevels?.['route_sign'] ?? 0) : -1;
    let routeBonus = rl_route >= 0 ? (rl_route >= 1 ? 2 : 1) : 0;
    if (liveState.relicRouteBonusSpots > 0) { routeBonus += 3; store.setRelicRouteBonusSpots(liveState.relicRouteBonusSpots - 1); }

    // Rabbit's foot: leveled chance + activation bonus
    const rl_rabbit = relicsNow.includes('rabbit_foot') ? (persist.relicLevels?.['rabbit_foot'] ?? 0) : -1;
    let rabbitBonus = 0;
    if (liveState.relicRabbitBonusSpots > 0) {
      rabbitBonus = 5; store.setRelicRabbitBonusSpots(liveState.relicRabbitBonusSpots - 1);
    } else if (rl_rabbit >= 0) {
      const chance = rl_rabbit >= 1 ? 0.30 : 0.20;
      if (Math.random() < chance) rabbitBonus = rl_rabbit >= 2 ? 5 : rl_rabbit >= 1 ? 3 : 2;
    }

    // Lucky coin L2: free spot gives +1 bonus pt
    const luckyL2Bonus = (freeSspot && relicsNow.includes('lucky_coin') && (persist.relicLevels?.['lucky_coin'] ?? 0) >= 2) ? 1 : 0;

    const bigfootMult = liveState.bigfootEventActive ? 3 : 1;
    if (liveState.bigfootEventActive) { store.setBigfootEventActive(false); doFlash('👣 Bigfoot 3× Spot!', '#aaffaa'); }
    const effectivePoints = (stoneCursed || voidCursed) ? 0 : (points * bigfootMult) + (openRoad ? 1 : 0) + routeBonus + rabbitBonus + luckyL2Bonus;
    if (stoneCursed || voidCursed) doFlash('☠️ Curse blocked your score!', '#880000');
    store.addScoreA(effectivePoints);

    // Bigfoot prestige passive: 2% chance of +3 bonus pts
    if (persist.prestigedBadges.includes('bigfoot') && effectivePoints > 0 && Math.random() < 0.02) {
      store.addScoreA(3);
    }

    // Badge challenges: pts_total and spot_count
    if (effectivePoints > 0) checkBadgeChallengeProgress('pts_total', effectivePoints);
    checkBadgeChallengeProgress('spot_count', 1);

    store.setEffect({ stackHoldCount: store.spotCount + 1 } as any);
    useGameStore.setState(s => ({ spotCount: s.spotCount + 1 }));

    // Streak
    store.incrementStreak();
    const streak = useGameStore.getState().spotStreak;
    const rawBonus = streakBonus(streak);
    const bonus = (rawBonus > 0 && hasSynergy(activeBadges, 'dragon_phoenix')) ? rawBonus * 2 : rawBonus;
    if (bonus > 0) {
      store.addScoreA(bonus);
      if (streak === 5 || streak === 10 || streak === 15) doFlash(`🔥 ${streak}-Streak! +${bonus}`, '#ff8800');
    }

    // CB Radio: hot spot bonus
    const cbBonus = useGameStore.getState().cbNextSpotBonus;
    if (cbBonus > 0) {
      store.addScoreA(cbBonus);
      store.setCbNextSpotBonus(0);
    }

    checkCoinsFromScore(effectivePoints);

    // Thunderbird: +2 pts per spot in rainy weather (or all weather with synergy)
    if (hasBadge(activeBadges, 'thunderbird') && effectivePoints > 0) {
      if (weather === 'rainy' || hasSynergy(activeBadges, 'thunderbird_ifrit')) store.addScoreA(2);
      // Trial done: +1 pt in any weather
      if (persist.completedTrials.includes('thunderbird')) store.addScoreA(1);
    }
    // Thunderbird prestige: +1 pt per spot in all weather
    if (persist.prestigedBadges.includes('thunderbird') && effectivePoints > 0) store.addScoreA(1);

    // Thunderbird trial: score 300 pts from rainy-weather spots with Thunderbird active
    if (hasBadge(activeBadges, 'thunderbird') && effectivePoints > 0 && weather === 'rainy') {
      const prev = useGameStore.getState().trialProgress['thunderbird'] ?? 0;
      if (prev < (BADGE_TRIALS['thunderbird']?.target ?? 300)) {
        store.updateTrialProgress('thunderbird', effectivePoints);
        if (!persist.completedTrials.includes('thunderbird') && prev + effectivePoints >= (BADGE_TRIALS['thunderbird']?.target ?? 300)) {
          persist.completeTrial('thunderbird');
          doFlash('Thunderbird Trial complete!', '#aaffff');
        }
      }
    }

    // Kirin: detect multiplier firing; trial tracking + trial effect + prestige
    if (hasBadge(activeBadges, 'kirin')) {
      const kirinLevel = badgeLevel(persist.badgeLevels, 'kirin');
      const kirinNth = [10, 8, 6, 5][kirinLevel] ?? 10;
      if ((store.spotCount + 1) % kirinNth === 0) {
        // Trial tracking
        const prevKi = useGameStore.getState().trialProgress['kirin'] ?? 0;
        store.updateTrialProgress('kirin', 1);
        if (!persist.completedTrials.includes('kirin') && prevKi + 1 >= (BADGE_TRIALS['kirin']?.target ?? 15)) {
          persist.completeTrial('kirin');
          doFlash('Kirin Trial complete!', '#ffdd44');
        }
        // Trial done: +10 pts when multiplier fires
        if (persist.completedTrials.includes('kirin')) store.addScoreA(10);
      }
    }
    // Kirin prestige: +5 pts every 12th spot globally
    if (persist.prestigedBadges.includes('kirin') && (store.spotCount + 1) % 12 === 0 && effectivePoints > 0) {
      store.addScoreA(5);
    }

    // Nessie badge event: 1/250 → +30 pts
    if (hasBadge(activeBadges, 'nessie') && Math.random() < 1 / 250) {
      store.addScoreA(30);
      doFlash('🌊 Nessie spotted! +30 pts', '#00ccff');
      // Nessie trial: trigger the legendary sighting event
      if (!persist.completedTrials.includes('nessie')) {
        store.updateTrialProgress('nessie', 1);
        persist.completeTrial('nessie');
        doFlash('Nessie Trial complete!', '#00ccff');
      }
    }

    // Bigfoot badge event: 1/200 → next spot is 3×
    if (hasBadge(activeBadges, 'bigfoot') && Math.random() < 1 / 200) {
      store.setBigfootEventActive(true);
      doFlash('👣 Bigfoot sighting! Next spot 3×', '#aaffaa');
      // Bigfoot trial: trigger 2 encounter events with Bigfoot active
      const prevBf = useGameStore.getState().trialProgress['bigfoot'] ?? 0;
      if (prevBf < (BADGE_TRIALS['bigfoot']?.target ?? 2)) {
        store.updateTrialProgress('bigfoot', 1);
        if (!persist.completedTrials.includes('bigfoot') && prevBf + 1 >= (BADGE_TRIALS['bigfoot']?.target ?? 2)) {
          persist.completeTrial('bigfoot');
          doFlash('Bigfoot Trial complete!', '#aaffaa');
        }
      }
    }

    // Thunderbird badge event: rainy + thunderbird → 1/150 → +10 credits
    if (hasBadge(activeBadges, 'thunderbird') && weather === 'rainy' && Math.random() < 1 / 150) {
      store.addScoreB(10);
      doFlash('⚡ Thunderbird calls! +10 credits', '#aaffff');
    }

    // Griffin badge event: lucky break → +15 credits
    if (hasBadge(activeBadges, 'griffin') && Math.random() < 1 / 200) {
      store.addScoreB(15);
      doFlash('🦅 Griffin lucky break! +15 credits', '#aaffaa');
    }

    // Challenge: spot3
    if (store.flashChallenge?.type === 'spot3') {
      store.updateChallengeProgress(1);
      if (store.flashChallenge.progress + 1 >= store.flashChallenge.target) {
        store.addScoreA(25);
        store.clearFlash();
        // Manticore trial: completed a flash challenge
        if (hasBadge(activeBadges, 'manticore')) {
          const prevMant = useGameStore.getState().trialProgress['manticore'] ?? 0;
          if (prevMant < (BADGE_TRIALS['manticore']?.target ?? 3)) {
            store.updateTrialProgress('manticore', 1);
            if (!persist.completedTrials.includes('manticore') && prevMant + 1 >= (BADGE_TRIALS['manticore']?.target ?? 3)) {
              persist.completeTrial('manticore');
              doFlash('Manticore Trial complete!', '#ff4488');
            }
          }
        }
      }
    }

    checkPatrolTrigger();
    checkDifficulty(store.scoreA + points);

    // Boss encounter (rematch bosses spawn at 2× rate)
    const rematchId = useGameStore.getState().rematchBossId;
    const bossSpawnChance = rematchId ? 1 / 75 : 1 / 150;
    if (Math.random() < bossSpawnChance) {
      let boss;
      if (rematchId) {
        boss = BOSSES.find(b => b.id === rematchId) ?? pickRandom(BOSSES);
      } else if (hasBadge(activeBadges, 'valkyrie')) {
        const picks = [pickRandom(BOSSES), pickRandom(BOSSES), pickRandom(BOSSES)];
        boss = picks.reduce((a, b) => (b.fleeCoins > a.fleeCoins ? b : a));
      } else {
        boss = pickRandom(BOSSES);
      }
      store.setBoss(boss.id);
    }

    // 1/40 chance to find a relic
    if (Math.random() < 1 / 40) {
      const held = useGameStore.getState().relics;
      const available = RELICS.map(r => r.id).filter(id => !held.includes(id));
      if (available.length > 0) {
        const found = pickRandom(available);
        if (held.length < 3) {
          store.addRelic(found);
          const r = RELICS.find(x => x.id === found)!;
          doFlash(`Found ${r.emoji} ${r.name}!`, '#ffd700');
        } else {
          store.setPendingRelic(found);
        }
      }
    }
  }

  // ── Coins from scoring ────────────────────────────────────────────────────────

  function checkCoinsFromScore(pts: number) {
    if (pts <= 0) return;
    let threshold = hasBadge(activeBadges, 'unicorn')
      ? 15 - badgeLevel(persist.badgeLevels, 'unicorn') * 3
      : 25;
    if (hasBadge(activeBadges, 'unicorn') && persist.completedTrials.includes('unicorn')) threshold = Math.max(3, threshold - 3);
    if (persist.prestigedBadges.includes('unicorn')) threshold = Math.max(3, threshold - 3);
    if (hasSynergy(activeBadges, 'unicorn_leprechaun')) threshold = Math.min(threshold, 15);
    const relicsC = useGameStore.getState().relics;
    const rl_bottle = relicsC.includes('bottle_cap') ? (persist.relicLevels?.['bottle_cap'] ?? 0) : -1;
    if (rl_bottle >= 1) threshold = Math.max(5, threshold - 5); // L1: threshold -5 pts
    if (hasRelicSynergy(relicsC, 'loose_change')) threshold = Math.min(threshold, 20);
    if (hasRelicSet(relicsC, 'lucky_haul')) threshold = Math.min(threshold, 20);
    coinAccRef.current += pts;
    const earned = Math.floor(coinAccRef.current / threshold);
    if (earned > 0) {
      coinAccRef.current -= earned * threshold;
      const bottleCapBonus = rl_bottle >= 2 ? 2 : rl_bottle >= 0 ? 1 : 0;
      persist.addCoins(earned + bottleCapBonus);

      // Unicorn trial: earn 30 coins from spot scoring with Unicorn active
      if (hasBadge(activeBadges, 'unicorn')) {
        const prevUni = useGameStore.getState().trialProgress['unicorn'] ?? 0;
        if (prevUni < (BADGE_TRIALS['unicorn']?.target ?? 30)) {
          store.updateTrialProgress('unicorn', earned);
          if (!persist.completedTrials.includes('unicorn') && prevUni + earned >= (BADGE_TRIALS['unicorn']?.target ?? 30)) {
            persist.completeTrial('unicorn');
            doFlash('Unicorn Trial complete!', '#ffaaff');
          }
        }
      }
      // Phoenix trial: earn 50 coins in one game with Phoenix active
      if (hasBadge(activeBadges, 'phoenix')) {
        const prevPh = useGameStore.getState().trialProgress['phoenix'] ?? 0;
        if (prevPh < (BADGE_TRIALS['phoenix']?.target ?? 50)) {
          store.updateTrialProgress('phoenix', earned);
          if (!persist.completedTrials.includes('phoenix') && prevPh + earned >= (BADGE_TRIALS['phoenix']?.target ?? 50)) {
            persist.completeTrial('phoenix');
            doFlash('Phoenix Trial complete!', '#ff8800');
          }
        }
      }
      // Leprechaun trial: earn 40 coins from spot scoring with Leprechaun active
      if (hasBadge(activeBadges, 'leprechaun')) {
        const prevLep = useGameStore.getState().trialProgress['leprechaun'] ?? 0;
        if (prevLep < (BADGE_TRIALS['leprechaun']?.target ?? 40)) {
          store.updateTrialProgress('leprechaun', earned);
          if (!persist.completedTrials.includes('leprechaun') && prevLep + earned >= (BADGE_TRIALS['leprechaun']?.target ?? 40)) {
            persist.completeTrial('leprechaun');
            doFlash('Leprechaun Trial complete!', '#44ff88');
          }
        }
      }
    }
  }

  // ── Difficulty ────────────────────────────────────────────────────────────────

  function checkDifficulty(newScore: number) {
    const thresholds = [200, 500, 800, 1000];
    for (const t of thresholds) {
      if (newScore >= t && !store.lockedThresholds.includes(t)) {
        store.addLockedThreshold(t);
        doFlash('Level Up! Watch slows…', '#ffff00');
        // Restart watch interval at new (slower) rate if currently watching
        if (bTimerRef.current) {
          clearInterval(bTimerRef.current);
          const newInterval = bInterval(newScore, hasBadge(activeBadges, 'centaur'), badgeLevel(persist.badgeLevels, 'centaur'));
          const actual = useGameStore.getState().hWatchDouble ? newInterval / 2 : newInterval;
          bTimerRef.current = setInterval(onBTick, actual);
        }
      }
    }
  }

  // ── Flash system ─────────────────────────────────────────────────────────────

  function scheduleFlash() {
    let [minMs, maxMs] = flashInterval(store.scoreA, weather);
    if (persist.prestigedBadges.includes('dragon')) {
      minMs = Math.floor(minMs * 1.1);
      maxMs = Math.floor(maxMs * 1.1);
    }
    if (hasBadge(activeBadges, 'dragon') && persist.completedTrials.includes('dragon')) {
      minMs = Math.floor(minMs * 1.2);
      maxMs = Math.floor(maxMs * 1.2);
    }
    const delay = randInt(minMs, maxMs);
    flashTimerRef.current = setTimeout(doRandomFlash, delay);
  }

  function doFlash(text: string, color: string) {
    store.setFlash(text, color);
    setTimeout(() => store.clearFlash(), 3000);
  }

  function checkBadgeChallengeProgress(type: BadgeChallengeType, delta: number, pendingVal?: number) {
    const bc = useGameStore.getState().badgeChallenge;
    if (!bc || bc.completed || bc.type !== type) return;
    if (type === 'commit_big' && (bc.threshold ?? 0) > 0 && (pendingVal ?? 0) < (bc.threshold ?? 0)) return;
    store.updateBadgeChallengeProgress(delta);
    const updated = useGameStore.getState().badgeChallenge!;
    if (updated.progress >= updated.target) {
      store.completeBadgeChallenge();
      persist.addCoins(updated.reward);
      doFlash(`🏅 Challenge done! +${updated.reward} coins`, '#ffcc44');
    }
  }

  function doRandomFlash() {
    const score = store.scoreA;

    // Dragon: block every other flash for the first 5 flash events (1st, 3rd, 5th blocked)
    if (hasBadge(activeBadges, 'dragon') && store.dragonFlashesUsed < 5) {
      const newCount = store.dragonFlashesUsed + 1;
      store.markFlashBlockUsed();
      // Dragon trial: exhaust the full 5-event shield
      const prevDr = useGameStore.getState().trialProgress['dragon'] ?? 0;
      if (prevDr < (BADGE_TRIALS['dragon']?.target ?? 5)) {
        store.updateTrialProgress('dragon', 1);
        if (!persist.completedTrials.includes('dragon') && prevDr + 1 >= (BADGE_TRIALS['dragon']?.target ?? 5)) {
          persist.completeTrial('dragon');
          doFlash('Dragon Trial complete!', '#4488ff');
        }
      }
      if (newCount % 2 === 1) { // odd events (1,3,5) are blocked
        checkBadgeChallengeProgress('flash_block', 1);
        scheduleFlash();
        return;
      }
    }

    const flashTypes = ['steal', 'challenge_spot', 'challenge_watch', 'challenge_l2'];
    const weights = score >= 800
      ? [4, 2, 2, 2]
      : [2, 2, 2, 2];

    // weighted pick
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = flashTypes[0];
    for (let i = 0; i < flashTypes.length; i++) {
      r -= weights[i];
      if (r <= 0) { chosen = flashTypes[i]; break; }
    }

    switch (chosen) {
      case 'steal': {
        if (store.powerups.length > 0) {
          const kitsuneLevel = hasBadge(activeBadges, 'kitsune') ? badgeLevel(persist.badgeLevels, 'kitsune') : -1;
          const alwaysBlock = hasSynergy(activeBadges, 'kitsune_bigfoot');
          const kitsunePrestigeBonus = persist.prestigedBadges.includes('kitsune') ? 0.15 : 0;
          const blockChance = alwaysBlock ? 1.0 : Math.min(1, (kitsuneLevel >= 0 ? ([0.25, 0.40, 0.55, 0.70][kitsuneLevel] ?? 0.25) : 0) + kitsunePrestigeBonus);
          if (Math.random() < blockChance) {
            doFlash('Steal blocked! (Kitsune)', '#aa44ff');
            checkBadgeChallengeProgress('steal_block', 1);
            if (hasBadge(activeBadges, 'kitsune')) {
              const prev = useGameStore.getState().trialProgress['kitsune'] ?? 0;
              store.updateTrialProgress('kitsune', 1);
              if (!persist.completedTrials.includes('kitsune') && prev + 1 >= (BADGE_TRIALS['kitsune']?.target ?? 8)) {
                persist.completeTrial('kitsune');
                doFlash('Kitsune Trial complete!', '#aa44ff');
              }
              if (persist.completedTrials.includes('kitsune') && Math.random() < 0.30) {
                const code = generatePowerup(1, region, false, false);
                store.addPowerup(code);
              }
            }
          } else {
            store.removePowerup(store.powerups[0]);
            doFlash('Power-up stolen!', '#aa44ff');
          }
        } else {
          doFlash('Steal attempt (empty)', '#aa44ff');
        }
        break;
      }
      case 'challenge_spot': {
        const manticore = hasBadge(activeBadges, 'manticore');
        let mult = manticore ? ([1.3, 1.5, 1.7, 2.0][badgeLevel(persist.badgeLevels, 'manticore')] ?? 1.3) : 1;
        if (persist.prestigedBadges.includes('manticore')) mult *= 1.10;
        const duration = Math.round(20000 * mult);
        store.setFlashChallenge({ type: 'spot3', target: 3, progress: 0, deadline: Date.now() + duration });
        doFlash('Challenge: Spot 3 in 20s!', '#ff8800');
        setTimeout(() => { if (store.flashChallenge?.type === 'spot3') store.clearFlash(); }, duration);
        if (manticore && persist.completedTrials.includes('manticore')) store.addScoreA(5);
        break;
      }
      case 'challenge_watch': {
        const manticoreW = hasBadge(activeBadges, 'manticore');
        let multW = manticoreW ? ([1.3, 1.5, 1.7, 2.0][badgeLevel(persist.badgeLevels, 'manticore')] ?? 1.3) : 1;
        if (persist.prestigedBadges.includes('manticore')) multW *= 1.10;
        const target = randInt(15, 40);
        const durationW = Math.round(30000 * multW);
        doFlash(`Challenge: Watch ${target} credits!`, '#00ccff');
        store.setFlashChallenge({ type: 'watch_credits', target, progress: 0, deadline: Date.now() + durationW });
        setTimeout(() => { if (store.flashChallenge?.type === 'watch_credits') store.clearFlash(); }, durationW);
        if (manticoreW && persist.completedTrials.includes('manticore')) store.addScoreA(5);
        break;
      }
      case 'challenge_l2': {
        const manticoreL = hasBadge(activeBadges, 'manticore');
        let multL = manticoreL ? ([1.3, 1.5, 1.7, 2.0][badgeLevel(persist.badgeLevels, 'manticore')] ?? 1.3) : 1;
        if (persist.prestigedBadges.includes('manticore')) multL *= 1.10;
        const durationL = Math.round(60000 * multL);
        doFlash('Challenge: Earn L2+ power-up!', '#88ff44');
        store.setFlashChallenge({ type: 'earn_l2', target: 1, progress: 0, deadline: Date.now() + durationL });
        setTimeout(() => { if (store.flashChallenge?.type === 'earn_l2') store.clearFlash(); }, durationL);
        if (manticoreL && persist.completedTrials.includes('manticore')) store.addScoreA(5);
        break;
      }
    }
    scheduleFlash();
  }

  // ── Decay ─────────────────────────────────────────────────────────────────────

  function startDecay() {
    decayTimerRef.current = setInterval(() => {
      const score = store.scoreA;
      let rate = decayRate(score, region);
      if (rate === 0) return;
      if (persist.prestigedBadges.includes('yeti')) rate = Math.max(1, Math.floor(rate * 0.8));
      const threshold = decayThreshold(score);
      if (store.scoreB > threshold) {
        if (hasBadge(activeBadges, 'yeti')) return;
        if (store.hTrucker) return;
        store.addScoreB(-rate);
      }
    }, 10000);
  }

  // ── Tourist ────────────────────────────────────────────────────────────────────

  function scheduleTourist() {
    const delay = randInt(60000, 120000);
    touristTimerRef.current = setTimeout(() => {
      if (!store.touristVisible) {
        const t = pickRandom(TOURISTS);
        store.setTourist(t.id);
        setTimeout(() => { if (store.touristVisible) store.setTourist(null); }, 10000);
      }
      scheduleTourist();
    }, delay);
  }

  function onTouristResult(pts: number) {
    store.addScoreA(pts);
  }

  // ── Road Events ───────────────────────────────────────────────────────────────

  function scheduleRoadEvent() {
    const delay = randInt(90000, 180000);
    roadEventTimerRef.current = setTimeout(() => {
      const heldRelics = useGameStore.getState().relics;
      const roll = Math.random();
      let ev;
      const baseEvents = ROAD_EVENTS.filter(e => e.id !== 'market' && e.id !== 'mountain_pass');
      if (heldRelics.includes('change_jar') && roll < 0.30) {
        ev = ROAD_EVENTS.find(e => e.id === 'market')!;
      } else if (heldRelics.includes('atlas') && roll < 0.20) {
        ev = ROAD_EVENTS.find(e => e.id === 'mountain_pass')!;
      } else {
        ev = pickRandom(baseEvents);
      }
      if (ev.duration > 0) {
        // Passive timed event
        const expiry = Date.now() + ev.duration * 1000;
        store.setRoadEvent(ev.id, expiry);
        setRoadEventBanner({ name: ev.name, desc: ev.desc, color: ev.color, duration: ev.duration });
        setTimeout(() => setRoadEventBanner(null), 4000);
        setTimeout(() => store.setRoadEvent(null), ev.duration * 1000);
      } else {
        // Interactive event — auto-dismiss after 15s
        store.setRoadEvent(ev.id, 0);
        setTimeout(() => {
          if (useGameStore.getState().roadEventId === ev.id) store.setRoadEvent(null);
        }, 15000);
      }
      scheduleRoadEvent();
    }, delay);
  }

  function onGasStation(stop: boolean) {
    store.setRoadEvent(null);
    if (stop) {
      store.addScoreB(-10);
      store.addScoreA(25);
    }
  }

  function onShortcut(take: boolean) {
    store.setRoadEvent(null);
    if (take) {
      persist.spendCoins(8);
      store.addScoreA(30);
    }
  }

  function onMarket(trade: boolean) {
    store.setRoadEvent(null);
    if (trade && store.scoreB >= 20) {
      store.addScoreB(-20);
      persist.addCoins(8);
      doFlash('🏪 Trade complete! +8 coins', '#aa8800');
    }
  }

  function onMountainPass(take: boolean) {
    store.setRoadEvent(null);
    if (take && persist.coins >= 5) {
      persist.spendCoins(5);
      const code = generatePowerup(3, region, false, false);
      store.addPowerup(code);
      doFlash('⛰️ Mountain Pass! L3 power-up!', '#aa66ff');
    }
  }

  function handleRelicActivate(id: string) {
    const gs = useGameStore.getState();
    if (gs.relicActUsed.includes(id)) return;
    if (id === 'bottle_cap' && gs.scoreB < 10) { doFlash('Need 10 credits to activate!', '#ff4444'); return; }
    store.activateRelic(id);
    switch (id) {
      case 'rabbit_foot':
        store.setRelicRabbitBonusSpots(gs.relicRabbitBonusSpots + 3);
        doFlash('🐾 Rabbit Foot! Next 3 Spots +5 pts', '#ffd700'); break;
      case 'thermos': {
        store.setRelicWatchBoostExpiry(Date.now() + 20000);
        doFlash('☕ Thermos! Watch 2× faster for 20s', '#ffd700');
        if (bTimerRef.current) {
          clearInterval(bTimerRef.current);
          const ivl = bInterval(store.scoreA, hasBadge(activeBadges, 'centaur'), badgeLevel(persist.badgeLevels, 'centaur'));
          bTimerRef.current = setInterval(onBTick, Math.floor(ivl * 0.5));
        }
        break;
      }
      case 'route_sign':
        store.setRelicRouteBonusSpots(gs.relicRouteBonusSpots + 15);
        doFlash('🛤️ Route Sign! Next 15 Spots +3 pts', '#ffd700'); break;
      case 'atlas':
        store.setRelicForceL3(true);
        doFlash('🗺️ Atlas! Next power-up forced L3', '#ffd700'); break;
      case 'lucky_coin':
        store.setRelicFreeSpots(gs.relicFreeSpots + 3);
        doFlash('🪙 Lucky Coin! Next 3 Spots free', '#ffd700'); break;
      case 'trucker_die':
        store.addScoreA(25);
        doFlash('🎲 Trucker\'s Die! +25 pts', '#ffd700'); break;
      case 'compass':
        store.setRivalScore(Math.max(0, gs.rivalScore - 25));
        doFlash('🧭 Compass! Rival −25 pts', '#ffd700'); break;
      case 'bottle_cap':
        store.addScoreB(-10);
        persist.addCoins(5);
        doFlash('🔩 Bottle Cap! −10 credits → +5 coins', '#ffd700'); break;
      case 'change_jar':
        persist.addCoins(20);
        doFlash('🫙 Change Jar! +20 coins', '#ffd700'); break;
    }
  }

  // ── Powerup Craft & Fuse ─────────────────────────────────────────────────────

  function handleCraft(idx: number) {
    const code = store.powerups[idx];
    if (!code) return;
    const tier = parseInt(code[0]);
    if (tier >= 3) return;
    const cost = tier === 1 ? 12 : 20;
    if (!persist.spendCoins(cost)) { doFlash(`Need ${cost} coins to craft!`, '#ff4444'); return; }
    const sub = code[1];
    const newCode = `${tier + 1}${sub}`;
    store.craftPowerup(idx, newCode);
    const def = POWERUPS.find(p => p.code === newCode);
    doFlash(`⬆ Crafted ${def?.name ?? newCode}!`, '#a855f7');
  }

  function handleFuse(tier: 1 | 2) {
    const newCode = generatePowerup((tier + 1) as 2 | 3, region, store.luckyRoll, store.powerSurge);
    store.fusePowerups(tier, newCode);
    if (store.luckyRoll) store.setEffect({ luckyRoll: false });
    if (store.powerSurge) store.setEffect({ powerSurge: false });
    const def = POWERUPS.find(p => p.code === newCode);
    doFlash(`✨ Fused 3×L${tier} → ${def?.name ?? newCode}!`, '#f59e0b');
  }

  // ── CB Chatter ────────────────────────────────────────────────────────────────

  function scheduleChatter() {
    const delay = randInt(45000, 90000);
    cbChatterRef.current = setTimeout(doChatter, delay);
  }

  function doChatter() {
    const messages = [
      { id: 'hot_spot',    text: '📻 Breaker — hot spot ahead!',       color: '#ff8800' },
      { id: 'credits',     text: '📻 Easy miles out here! +20 credits', color: '#00ccff' },
      { id: 'pts',         text: '📻 Good hunting! +15 pts',            color: '#aaffaa' },
      { id: 'patrol_warn', text: '📻 Bear in the air, back it down!',   color: '#ffaa00' },
    ];
    const msg = pickRandom(messages);
    doFlash(msg.text, msg.color);
    switch (msg.id) {
      case 'hot_spot':
        store.setCbNextSpotBonus(15);
        break;
      case 'credits':
        store.addScoreB(20);
        break;
      case 'pts':
        store.addScoreA(15);
        break;
      // patrol_warn: display only, no mechanical effect
    }
    scheduleChatter();
  }

  // ── Hitchhiker ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const delay = purchases.includes('cb_radio') ? randInt(25000, 55000) : randInt(45000, 90000);
    const t = setTimeout(() => {
      const h = pickRandom(HITCHHIKERS);
      setHitchhikerPopup({ name: h.name, description: h.description, duration: h.duration });
      setTimeout(() => setHitchhikerPopup(null), 4000);

      if (h.duration > 0) {
        const expiry = Date.now() + h.duration * 1000;
        store.setHitchhiker(h.id, expiry);
        setTimeout(() => store.clearHitchhikerEffects(), h.duration * 1000);
      } else {
        if (h.effect === 'bingo_auto') {
          const unmarked = store.bingoMarked.map((v, i) => v ? -1 : i).filter(i => i >= 0);
          const picks = unmarked.slice(0, 2);
          picks.forEach(i => store.markBingo(i));
        } else if (h.effect === 'foodie') {
          store.addScoreB(-15);
          store.addScoreA(20);
        }
      }
    }, delay);
    return () => clearTimeout(t);
  }, []);

  // ── Rival ─────────────────────────────────────────────────────────────────────

  function scheduleRival() {
    rivalTimerRef.current = setInterval(() => {
      if (store.rivalSkipCount > 0) {
        store.decrementRivalSkip();
        return;
      }
      // Kraken: 20% chance to freeze rival for 2 turns when not already frozen
      if (hasBadge(activeBadges, 'kraken') && store.rivalFrozenTurns === 0 && Math.random() < 0.20) {
        store.setRivalFrozenTurns(2);
        const prevK = useGameStore.getState().trialProgress['kraken'] ?? 0;
        if (prevK < (BADGE_TRIALS['kraken']?.target ?? 3)) {
          store.updateTrialProgress('kraken', 1);
          if (!persist.completedTrials.includes('kraken') && prevK + 1 >= (BADGE_TRIALS['kraken']?.target ?? 3)) {
            persist.completeTrial('kraken');
            doFlash('Kraken Trial complete!', '#4488ff');
          }
        }
        return;
      }
      let { newRivalScore, frozenTurns } = rivalAction(
        store.rivalScore, store.scoreA,
        store.rivalFrozenTurns,
        hasBadge(activeBadges, 'kraken'),
        badgeLevel(persist.badgeLevels, 'kraken')
      );
      const relicsR = useGameStore.getState().relics;
      // Kraken prestige: rival grows 15% slower globally
      if (persist.prestigedBadges.includes('kraken')) {
        const delta = newRivalScore - store.rivalScore;
        if (delta > 0) newRivalScore = store.rivalScore + Math.floor(delta * 0.85);
      }
      if (relicsR.includes('compass') || hasRelicSynergy(relicsR, 'road_warrior') || hasRelicSet(relicsR, 'truckers_pride')) {
        const rl_compass = relicsR.includes('compass') ? (persist.relicLevels?.['compass'] ?? 0) : 0;
        let baseReduction = rl_compass >= 2 ? 0.40 : rl_compass >= 1 ? 0.30 : relicsR.includes('compass') ? 0.20 : 0;
        if ((relicsR.includes('route_sign') && (persist.relicLevels?.['route_sign'] ?? 0) >= 2)) baseReduction = Math.min(0.60, baseReduction + 0.10);
        if (hasRelicSynergy(relicsR, 'road_warrior')) baseReduction = Math.max(baseReduction, 0.30);
        if (hasRelicSet(relicsR, 'truckers_pride')) baseReduction = Math.max(baseReduction, 0.30);
        const delta = newRivalScore - store.rivalScore;
        if (delta > 0) newRivalScore = store.rivalScore + Math.floor(delta * (1 - baseReduction));
      }
      store.setRivalScore(newRivalScore);
      store.setRivalFrozenTurns(frozenTurns);
    }, 5000);
  }

  // ── Patrol ───────────────────────────────────────────────────────────────────

  function checkPatrolTrigger() {
    // Only trigger if tapping 4+ times in the last second
    const pressesLastSecond = useGameStore.getState().aggressionLog.filter(t => Date.now() - t < 1000).length;
    if (pressesLastSecond < 4) return;
    const gs = useGameStore.getState();
    const speedTrapActive = gs.roadEventId === 'speed_trap' && Date.now() < gs.roadEventExpiry;
    let shuckReduction = hasBadge(activeBadges, 'shuck')
      ? ([0.20, 0.30, 0.40, 0.55][badgeLevel(persist.badgeLevels, 'shuck')] ?? 0.20)
      : 0;
    if (hasBadge(activeBadges, 'shuck') && persist.completedTrials.includes('shuck')) shuckReduction = Math.min(0.80, shuckReduction + 0.10);
    if (persist.prestigedBadges.includes('shuck')) shuckReduction = Math.min(0.80, shuckReduction + 0.10);
    const aggression = Math.min(1, (pressesLastSecond / 4) * (speedTrapActive ? 2 : 1)) * (1 - shuckReduction);
    if (checkPatrol(region, aggression)) {
      if (purchases.includes('cb_radio')) {
        store.setFlash('📻 Breaker — smokey ahead!', '#ffaa00');
        setTimeout(() => store.clearFlash(), 3000);
      }
      const patrolDelay = purchases.includes('cb_radio') ? 5000 : 0;
      setTimeout(() => {
        store.setPatrolVisible(true);
        store.resetStreak();
        const relicsP = useGameStore.getState().relics;
        if (relicsP.includes('change_jar')) {
          const rl_jar = persist.relicLevels?.['change_jar'] ?? 0;
          const jarCoins = hasRelicSet(relicsP, 'lucky_haul') ? 10 : rl_jar >= 1 ? 8 : 5;
          persist.addCoins(jarCoins);
          if (rl_jar >= 2) store.addScoreA(5); // L2: +5 pts on patrol
        }
        // Pause B ticks for the duration of the stop
        if (bTimerRef.current) {
          clearInterval(bTimerRef.current);
          bTimerRef.current = null;
          patrolPausedWatch.current = true;
        }
        patrolBlockRef.current = setTimeout(() => {
          store.setPatrolVisible(false);
          if (patrolPausedWatch.current) {
            patrolPausedWatch.current = false;
            const interval = bInterval(store.scoreA, hasBadge(activeBadges, 'centaur'), badgeLevel(persist.badgeLevels, 'centaur'));
            bTimerRef.current = setInterval(onBTick, store.hWatchDouble ? interval / 2 : interval);
          }
        }, 15000);
      }, patrolDelay);
    } else {
      // Shuck trial: tap aggressively 30× without triggering patrol, Black Shuck active
      if (hasBadge(activeBadges, 'shuck')) {
        const prevSh = useGameStore.getState().trialProgress['shuck'] ?? 0;
        if (prevSh < (BADGE_TRIALS['shuck']?.target ?? 30)) {
          store.updateTrialProgress('shuck', 1);
          if (!persist.completedTrials.includes('shuck') && prevSh + 1 >= (BADGE_TRIALS['shuck']?.target ?? 30)) {
            persist.completeTrial('shuck');
            doFlash('Black Shuck Trial complete!', '#884400');
          }
        }
      }
    }
  }

  // ── Power-up activation ──────────────────────────────────────────────────────

  function activatePowerup(code: string) {
    store.removePowerup(code);
    const tier = parseInt(code[0]) as 1 | 2 | 3;
    const sub = code[1];

    // Sphinx prestige passive: +1 pt on any power-up activation
    if (persist.prestigedBadges.includes('sphinx')) store.addScoreA(1);

    // Sphinx: bonus pts for activating any powerup
    if (hasBadge(activeBadges, 'sphinx')) {
      const level = badgeLevel(persist.badgeLevels, 'sphinx');
      let sBonus = [5, 8, 12, 15][level] ?? 5;
      if (persist.completedTrials.includes('sphinx')) sBonus += 3;
      store.addScoreA(sBonus);

      // Sphinx trial: activate 10 L2+ power-ups in one game
      if (tier >= 2) {
        const prev = useGameStore.getState().trialProgress['sphinx'] ?? 0;
        if (prev < (BADGE_TRIALS['sphinx']?.target ?? 10)) {
          store.updateTrialProgress('sphinx', 1);
          if (!persist.completedTrials.includes('sphinx') && prev + 1 >= (BADGE_TRIALS['sphinx']?.target ?? 10)) {
            persist.completeTrial('sphinx');
            doFlash('Sphinx Trial complete!', '#ffdd44');
          }
        }
      }
    }

    // Sphinx-Griffin synergy: +1 free credit on activation
    if (hasSynergy(activeBadges, 'sphinx_griffin')) store.addScoreB(1);

    // Badge challenge: powerup_use
    checkBadgeChallengeProgress('powerup_use', 1);

    switch (code) {
      case '1a':
      case '2a': {
        const duration = code === '1a' ? 5000 : 10000;
        const savedB = store.scoreB;
        store.setScoreB(999);
        store.setEffect({ infiniteCredits: true, infiniteExpiry: Date.now() + duration });
        if (infiniteRef.current) clearTimeout(infiniteRef.current);
        infiniteRef.current = setTimeout(() => {
          store.setEffect({ infiniteCredits: false });
          store.setScoreB(savedB);
        }, duration);
        doFlash(`Infinite Credits (${duration / 1000}s)!`, '#00ffcc');
        break;
      }
      case '1b':
      case '2b': {
        const duration = code === '1b' ? 5000 : 10000;
        store.setEffect({ doublePoints: true, doublePointsExpiry: Date.now() + duration });
        if (doubleRef.current) clearTimeout(doubleRef.current);
        doubleRef.current = setTimeout(() => store.setEffect({ doublePoints: false }), duration);
        doFlash(`Double Points (${duration / 1000}s)!`, '#ffff00');
        break;
      }
      case '1c': store.setEffect({ luckyRoll: true }); doFlash('Lucky Roll ready!', '#aaffaa'); break;
      case '1d': store.addScoreB(25); doFlash('Energy Drink! +25 credits', '#aaffff'); break;
      case '1e': store.setEffect({ nextACKeepB: true }); doFlash('Hold Boost ready!', '#aaaaff'); break;
      case '2c': store.setEffect({ jackpotHold: true }); doFlash('Jackpot Hold ready!', '#aa44ff'); break;
      case '2d': {
        store.setEffect({ grassVisible: true, grassExpiry: Date.now() + 5000 });
        if (grassRef.current) clearTimeout(grassRef.current);
        grassRef.current = setTimeout(() => store.setEffect({ grassVisible: false, grassOn: false }), 5000);
        doFlash('Grass Vision!', '#44ff44');
        break;
      }
      case '2e': store.setEffect({ powerSurge: true }); doFlash('Power Surge ready!', '#ff8800'); break;
      case '3a': store.addScoreA(40); doFlash('Full Throttle! +40 pts', '#ff4488'); break;
      case '3b': {
        store.setPendingB(store.pendingB * 2);
        doFlash('Double Down!', '#ffaa00');
        break;
      }
      case '3c': { store.rerollTopPowerup(region); doFlash('Rerolled!', '#aaaaff'); break; }
      case '3d': store.setEffect({ nextAAllIn: true }); doFlash('All In ready!', '#ff0000'); break;
      case '3e': store.setEffect({ stackHold: true, stackHoldCount: 0 }); doFlash('Stack Hold!', '#ffdd44'); break;
    }
  }

  // ── Bingo callbacks ──────────────────────────────────────────────────────────

  function bossScaleMultiplier(score: number): number {
    if (score >= 1000) return 2.0;
    if (score >= 800)  return 1.75;
    if (score >= 500)  return 1.5;
    if (score >= 200)  return 1.25;
    return 1.0;
  }

  function onBossResult(fled: boolean, won: boolean, winPts: number, winCoins: number, curse: string | null) {
    const boss = BOSSES.find(b => b.id === store.bossId);
    const scale = bossScaleMultiplier(store.scoreA);
    store.setBoss(null);
    if (fled) {
      persist.spendCoins(Math.round((boss?.fleeCoins ?? 5) * scale));
      store.setRematchBossId(boss?.id ?? null);
      doFlash(`${boss?.name ?? 'Boss'} will find you again...`, '#ff8800');
    } else {
      store.setRematchBossId(null);
      if (won) {
        store.addScoreA(winPts);
        persist.addCoins(winCoins);
        doFlash(`Defeated ${boss?.name ?? 'Boss'}!`, '#ffd700');
        // Valkyrie trial: win 5 boss fights with Valkyrie active
        if (hasBadge(activeBadges, 'valkyrie')) {
          const prevV = useGameStore.getState().trialProgress['valkyrie'] ?? 0;
          store.updateTrialProgress('valkyrie', 1);
          if (!persist.completedTrials.includes('valkyrie') && prevV + 1 >= (BADGE_TRIALS['valkyrie']?.target ?? 5)) {
            persist.completeTrial('valkyrie');
            doFlash('Valkyrie Trial complete!', '#ffaaff');
          }
          // Trial done: +10 pts per boss win
          if (persist.completedTrials.includes('valkyrie')) store.addScoreA(10);
        }
        // Valkyrie prestige: +5 pts on every boss win
        if (persist.prestigedBadges.includes('valkyrie')) store.addScoreA(5);
        checkBadgeChallengeProgress('boss_win', 1);
      } else {
        store.addScoreA(-Math.round((boss?.losePts ?? 10) * scale));
        if ((boss?.loseCoins ?? 0) > 0) persist.spendCoins(Math.round(boss!.loseCoins * scale));
        if ((boss?.loseCredits ?? 0) > 0) store.addScoreB(-Math.round(boss!.loseCredits * scale));
        if (curse) {
          store.addCurse(curse);
          if (curse === 'cursed_powerups') store.setCursedPowerupsLeft(3);
        }
        doFlash(`${boss?.name ?? 'Boss'} wins...`, '#ff3333');
      }
    }
  }

  function onBossDealt() {
    const boss = BOSSES.find(b => b.id === useGameStore.getState().bossId);
    store.setBoss(null);
    if (!boss?.deal) return;
    const deal = boss.deal;
    if (deal.type === 'powerup') {
      const top = useGameStore.getState().powerups[0];
      if (top) store.removePowerup(top);
    } else if (deal.type === 'coins') {
      persist.spendCoins(deal.cost);
    } else if (deal.type === 'credits') {
      store.addScoreB(-deal.cost);
    }
    if (deal.pts > 0) store.addScoreA(deal.pts);
    doFlash(`🤝 Deal struck with ${boss.name}!`, '#aaffaa');
  }

  function onBingo(coins: number, pts: number, label: string) {
    persist.addCoins(coins);
    store.addScoreA(pts);
    doFlash(label, '#ffd700');
    // Wendigo trial: complete 3 bingo boards in one game with Wendigo active
    if (hasBadge(activeBadges, 'wendigo')) {
      const prevW = useGameStore.getState().trialProgress['wendigo'] ?? 0;
      if (prevW < (BADGE_TRIALS['wendigo']?.target ?? 3)) {
        store.updateTrialProgress('wendigo', 1);
        if (!persist.completedTrials.includes('wendigo') && prevW + 1 >= (BADGE_TRIALS['wendigo']?.target ?? 3)) {
          persist.completeTrial('wendigo');
          doFlash('Wendigo Trial complete!', '#88aaff');
        }
      }
    }
  }

  // ── Menu / back ───────────────────────────────────────────────────────────────

  function goToMenu() {
    clearAllTimers();
    if (activeBadges.length > 0) persist.recordBadgeUse(activeBadges);
    // Set cooldowns for badges used this game before ticking
    for (const id of activeBadges) {
      const level = badgeLevel(persist.badgeLevels, id);
      const cooldownGames = Math.max(0, 3 - level); // lv0→3, lv1→2, lv2→1, lv3→0
      if (cooldownGames > 0) {
        // +1 so the immediate tickCooldowns lands on cooldownGames
        persist.setBadgeCooldown(id, cooldownGames + 1);
      }
    }
    persist.setCoinFloor(0);
    persist.tickCooldowns();
    if (purchases.includes('cb_radio')) persist.tickCbRadio();
    router.replace('/');
  }

  function onRelicSwap(swapOutId: string) {
    store.removeRelic(swapOutId);
    const newId = useGameStore.getState().pendingRelic!;
    store.addRelic(newId);
    store.setPendingRelic(null);
    const r = RELICS.find(x => x.id === newId)!;
    doFlash(`Swapped in ${r.emoji} ${r.name}!`, '#ffd700');
  }

  function onRelicKeep() {
    store.setPendingRelic(null);
  }

  // ── render ────────────────────────────────────────────────────────────────────

  const { scoreA, scoreB, pendingB, bWatching, toggleMode,
    powerups, flashVisible, flashText, flashColor,
    doublePoints, grassVisible, grassOn, infiniteCredits,
    patrolVisible, rivalScore, activeBadges: storeActiveBadges,
    flashChallenge, hGeologist, hTrucker, hDJ,
    bossVisible, bossId, hHunter, nextBadgeId, rematchBossId } = store;

  const effectiveBadges = activeBadges;

  return (
    <View style={styles.container}>
      {/* Flash overlay */}
      <FlashOverlay visible={flashVisible} text={flashText} color={flashColor} />

      {/* Patrol overlay */}
      {patrolVisible && (
        <View style={styles.patrolOverlay}>
          <Text style={styles.patrolText}>🚨 Highway Patrol 🚨</Text>
          <Text style={styles.patrolSub}>Pulled over! Wait 15s…</Text>
        </View>
      )}

      {/* MP result overlay */}
      {store.mpResult && (
        <View style={styles.resultOverlay}>
          <Text style={styles.resultText}>
            {store.mpResult === 'win' ? '🏆 You Win!' : store.mpResult === 'lose' ? '😔 You Lose' : '🤝 Tie!'}
          </Text>
          <Text style={styles.resultSub}>
            You: {scoreA}  ·  Opp: {store.mpOpponentScore}
          </Text>
          <TouchableOpacity style={styles.resultBtn} onPress={goToMenu}>
            <Text style={styles.resultBtnText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Zap overlay */}
      {store.mpZapped && (
        <View style={styles.zapOverlay}>
          <Text style={styles.zapText}>⚡ ZAPPED! ⚡</Text>
          <Text style={styles.zapSub}>Can't spot for 5s</Text>
        </View>
      )}

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={goToMenu}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
        <Text style={styles.conditionText}>
          {region} · {weather}
        </Text>
        {mpActive && (
          <View style={styles.mpTopRight}>
            <Text style={[styles.opponentScore, store.mpOpponentScore > scoreA && { color: '#f88' }]}>
              {store.mpOpponentScore > scoreA ? '▲' : store.mpOpponentScore < scoreA ? '▼' : '='} Opp: {store.mpOpponentScore}
            </Text>
            <Text style={styles.mpTimer}>
              {Math.floor(store.mpTimeLeft / 60)}:{String(store.mpTimeLeft % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
      </View>

      {/* Scores */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Sightings</Text>
          <Text style={styles.scoreValue}>{scoreA}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Credits</Text>
          <Text style={styles.scoreValue}>
            {infiniteCredits ? '∞' : scoreB}
            {pendingB > 0 ? ` +${pendingB}` : ''}
          </Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Rival</Text>
          <Text style={styles.scoreValue}>{rivalScore}</Text>
        </View>
      </View>
      {rematchBossId && (
        <Text style={styles.rematchWarning}>
          ⚔️ {BOSSES.find(b => b.id === rematchBossId)?.name ?? 'Boss'} is hunting you!
        </Text>
      )}

      {/* Active effects bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.effectsRow}>
        {store.spotStreak >= 5 && (
          <Text style={[styles.effectChip, { backgroundColor: '#3a1500', color: '#ff8800' }]}>
            🔥 {store.spotStreak}-Streak {streakBonus(store.spotStreak) > 0 ? `+${streakBonus(store.spotStreak)}` : ''}
          </Text>
        )}
        {doublePoints  && <Text style={styles.effectChip}>2× Points</Text>}
        {grassVisible  && <Text style={styles.effectChip}>🌿 Grass</Text>}
        {infiniteCredits && <Text style={styles.effectChip}>∞ Credits</Text>}
        {hGeologist    && <Text style={styles.effectChip}>Geologist +1</Text>}
        {hTrucker      && <Text style={styles.effectChip}>Trucker No Decay</Text>}
        {hDJ           && <Text style={styles.effectChip}>DJ 2×</Text>}
        {flashChallenge && (
          <Text style={[styles.effectChip, { backgroundColor: '#333300' }]}>
            {flashChallenge.type}: {flashChallenge.progress}/{flashChallenge.target}
          </Text>
        )}
        {store.badgeChallenge && !store.badgeChallenge.completed && (
          <Text style={[styles.effectChip, { backgroundColor: '#1a0033', color: '#cc88ff' }]}>
            🏅 {store.badgeChallenge.desc}: {store.badgeChallenge.progress}/{store.badgeChallenge.target}
          </Text>
        )}
        {store.badgeChallenge?.completed && (
          <Text style={[styles.effectChip, { backgroundColor: '#001a00', color: '#88ff88' }]}>
            ✓ Badge Challenge +{store.badgeChallenge.reward}¢
          </Text>
        )}
        {nextBadgeId && (
          <Text style={[styles.effectChip, { backgroundColor: '#1a3300' }]}>
            📻 {BADGES.find(b => b.id === nextBadgeId)?.name ?? nextBadgeId}
          </Text>
        )}
        {store.relics.map(id => {
          const r = RELICS.find(x => x.id === id);
          const used = store.relicActUsed.includes(id);
          return r ? (
            <TouchableOpacity
              key={id}
              onPress={() => handleRelicActivate(id)}
              style={[styles.effectChip, { backgroundColor: used ? '#1a1000' : '#2a1a00' }]}
            >
              <Text style={{ color: used ? '#886600' : '#ffd700', fontSize: 11 }}>
                {r.emoji} {r.name}{used ? ' ✓' : ' ▶'}
              </Text>
            </TouchableOpacity>
          ) : null;
        })}
        {RELIC_SYNERGIES.filter(syn => syn.relics.every(r => store.relics.includes(r))).map(syn => (
          <Text key={syn.id} style={[styles.effectChip, { backgroundColor: '#001522', color: '#88ccff' }]}>
            ✨ {syn.name}
          </Text>
        ))}
        {RELIC_SETS.filter(set => set.relics.every(r => store.relics.includes(r))).map(set => (
          <Text key={set.id} style={[styles.effectChip, { backgroundColor: '#1a1400', color: '#ffdd88' }]}>
            🏆 {set.name}
          </Text>
        ))}
        {store.activeCurses.map(id => (
          <Text key={id} style={[styles.effectChip, { backgroundColor: '#2a0000', color: '#ff7777' }]}>
            ☠️ {id.replace(/_/g, ' ')}
          </Text>
        ))}
        {BADGE_SYNERGIES.filter(syn => syn.badges.every(b => activeBadges.includes(b))).map(syn => (
          <Text key={syn.id} style={[styles.effectChip, { backgroundColor: '#001a2a', color: '#aaccff' }]}>
            ✨ {syn.name}
          </Text>
        ))}
      </ScrollView>

      {/* Grass switch */}
      {grassVisible && (
        <View style={styles.grassRow}>
          <Text style={styles.grassLabel}>Grass</Text>
          <Switch
            value={grassOn}
            onValueChange={(v) => store.setEffect({ grassOn: v })}
            thumbColor={grassOn ? '#4caf50' : '#555'}
          />
        </View>
      )}

      {/* Power-up list */}
      <View style={styles.powerupSection}>
        <PowerupList
          powerups={powerups}
          powerupsCrafted={store.powerupsCrafted}
          coins={persist.coins}
          onActivate={activatePowerup}
          onCraft={handleCraft}
          onFuse={handleFuse}
        />
      </View>

      {/* Main buttons */}
      <View style={styles.mainButtons}>
        {/* A */}
        <TouchableOpacity
          style={[styles.gameBtn, styles.aBtn, (scoreB < 1 && !infiniteCredits || store.mpZapped) && styles.btnDisabled]}
          onPress={pressA}
          disabled={scoreB < 1 && !infiniteCredits || store.mpZapped}
        >
          <Text style={styles.gameBtnLabel}>Spot</Text>
          <Text style={styles.gameBtnSub}>−1 credit</Text>
        </TouchableOpacity>

        {/* B */}
        {toggleMode === 'tap' ? (
          <TouchableOpacity
            style={[styles.gameBtn, styles.bBtn, bWatching && styles.bBtnActive]}
            onPress={() => bWatching ? stopWatch() : startWatch()}
          >
            <Text style={styles.gameBtnLabel}>Watch</Text>
            <Text style={styles.gameBtnSub}>{bWatching ? 'Tap to stop' : 'Tap to start'}</Text>
          </TouchableOpacity>
        ) : (
          <Pressable
            style={[styles.gameBtn, styles.bBtn, bWatching && styles.bBtnActive]}
            onPressIn={startWatch}
            onPressOut={stopWatch}
          >
            <Text style={styles.gameBtnLabel}>Watch</Text>
            <Text style={styles.gameBtnSub}>Hold</Text>
          </Pressable>
        )}
      </View>

      {/* Toggle mode */}
      <View style={styles.modeRow}>
        <Text style={styles.modeLabel}>Watch mode:</Text>
        <TouchableOpacity
          style={[styles.modeChip, toggleMode === 'tap' && styles.modeActive]}
          onPress={() => store.setToggleMode('tap')}
        >
          <Text style={styles.modeChipText}>Tap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, toggleMode === 'hold' && styles.modeActive]}
          onPress={() => store.setToggleMode('hold')}
        >
          <Text style={styles.modeChipText}>Hold</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setBingoVisible(true)}>
          <Text style={styles.secondaryBtnText}>Bingo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setAlphaVisible(true)}>
          <Text style={styles.secondaryBtnText}>A–Z</Text>
        </TouchableOpacity>
        {mpActive && (
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.zapBtn, scoreB < 15 && styles.zapBtnDisabled]}
            onPress={pressZap}
            disabled={scoreB < 15}
          >
            <Text style={styles.secondaryBtnText}>⚡ Zap</Text>
            <Text style={styles.zapCost}>−15 credits</Text>
          </TouchableOpacity>
        )}
        {mpActive && store.mpOpponentHasCbRadio && purchases.includes('cb_radio') && (
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.deceiveBtn, scoreB < 10 && styles.zapBtnDisabled]}
            onPress={pressDeceive}
            disabled={scoreB < 10}
          >
            <Text style={styles.secondaryBtnText}>📻 Deceive</Text>
            <Text style={styles.zapCost}>−10 credits</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tourist prompt */}
      <TouristOverlay onResult={onTouristResult} />

      {hitchhikerPopup && (
        <HitchhikerBanner
          name={hitchhikerPopup.name}
          description={hitchhikerPopup.description}
          duration={hitchhikerPopup.duration}
          visible={!!hitchhikerPopup}
        />
      )}

      {/* Bingo modal */}
      <BingoCard visible={bingoVisible} onClose={() => setBingoVisible(false)} onBingo={onBingo} />

      {/* Alphabet hunt modal */}
      <AlphabetHunt visible={alphaVisible} onClose={() => setAlphaVisible(false)} />

      {/* Boss fight modal */}
      <BossFightOverlay
        visible={bossVisible}
        bossId={bossId}
        purchases={purchases}
        hunterActive={hHunter}
        valkyrieBonus={hasBadge(activeBadges, 'valkyrie') ? [0.10, 0.15, 0.20, 0.25][badgeLevel(persist.badgeLevels, 'valkyrie')] ?? 0.10 : 0}
        activeBadges={activeBadges}
        currentRelics={store.relics}
        coins={persist.coins}
        topPowerup={store.powerups[0] ?? null}
        scoreB={scoreB}
        scoreA={scoreA}
        isRematch={!!rematchBossId}
        onResult={onBossResult}
        onDeal={onBossDealt}
      />

      {/* Road event banner (passive events) */}
      {roadEventBanner && (
        <RoadEventBanner
          name={roadEventBanner.name}
          desc={roadEventBanner.desc}
          color={roadEventBanner.color}
          duration={roadEventBanner.duration}
          visible={!!roadEventBanner}
        />
      )}

      {/* Road event overlay (interactive events) */}
      <RoadEventOverlay
        onGasStation={onGasStation}
        onShortcut={onShortcut}
        onMarket={onMarket}
        onMountainPass={onMountainPass}
        coins={persist.coins}
        credits={scoreB}
      />

      {/* Relic swap modal */}
      <RelicSwapOverlay
        visible={!!store.pendingRelic}
        currentRelics={store.relics}
        newRelicId={store.pendingRelic ?? ''}
        onSwap={onRelicSwap}
        onKeep={onRelicKeep}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', paddingTop: 50 },

  patrolOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(200,0,0,0.8)',
    zIndex: 200,
    justifyContent: 'center', alignItems: 'center',
  },
  patrolText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  patrolSub: { color: '#fdd', fontSize: 16, marginTop: 8 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 8,
  },
  menuBtn: { backgroundColor: '#2a2a3a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  menuText: { color: '#aaa', fontSize: 13 },
  conditionText: { flex: 1, color: '#666', textAlign: 'center', fontSize: 12 },
  opponentScore: { color: '#aaa', fontSize: 12 },
  mpTopRight: { alignItems: 'flex-end' },
  mpTimer: { color: '#ffdd44', fontSize: 14, fontWeight: 'bold' },

  resultOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 99,
    justifyContent: 'center', alignItems: 'center',
  },
  resultText: { color: '#fff', fontSize: 40, fontWeight: 'bold', marginBottom: 12 },
  resultSub: { color: '#aaa', fontSize: 18, marginBottom: 32 },
  resultBtn: { backgroundColor: '#2a2a5a', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  resultBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  zapOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(80,80,0,0.55)', zIndex: 50,
    justifyContent: 'center', alignItems: 'center', pointerEvents: 'none',
  },
  zapText: { color: '#ffff00', fontSize: 36, fontWeight: 'bold' },
  zapSub: { color: '#ffdd88', fontSize: 16, marginTop: 8 },

  zapBtn: { backgroundColor: '#3a2200', borderColor: '#ff8800', borderWidth: 1 },
  zapBtnDisabled: { opacity: 0.4 },
  zapCost: { color: '#ff8800', fontSize: 10, textAlign: 'center' },
  deceiveBtn: { backgroundColor: '#2a002a', borderColor: '#aa44ff', borderWidth: 1 },

  scoreRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 8 },
  scoreBox: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#111', marginHorizontal: 2, borderRadius: 6 },
  scoreLabel: { color: '#666', fontSize: 10 },
  scoreValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  rematchWarning: { color: '#ff8800', fontSize: 12, textAlign: 'center', marginBottom: 4 },

  effectsRow: { paddingHorizontal: 8, marginBottom: 6 },
  effectChip: {
    backgroundColor: '#1a2a1a', color: '#aaffaa',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, fontSize: 11, marginRight: 6,
    overflow: 'hidden',
  },

  grassRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 6,
  },
  grassLabel: { color: '#4caf50', marginRight: 8 },

  powerupSection: { paddingHorizontal: 12, marginBottom: 8 },

  mainButtons: {
    flexDirection: 'row', paddingHorizontal: 12, gap: 8,
    marginBottom: 12,
  },
  gameBtn: {
    flex: 1, padding: 20, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  aBtn:      { backgroundColor: '#1a3a1a' },
  bBtn:      { backgroundColor: '#1a1a4a' },
  bBtnActive:{ backgroundColor: '#3a3a8a' },
  btnDisabled: { opacity: 0.35 },
  gameBtnLabel: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  gameBtnSub:   { color: '#aaa', fontSize: 12, marginTop: 4 },

  modeRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 8, marginBottom: 12,
  },
  modeLabel: { color: '#666', fontSize: 12 },
  modeChip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 14, borderWidth: 1, borderColor: '#334', backgroundColor: '#111',
  },
  modeActive: { backgroundColor: '#4a9eff', borderColor: '#4a9eff' },
  modeChipText: { color: '#fff', fontSize: 12 },

  bottomRow: {
    flexDirection: 'row', paddingHorizontal: 12, gap: 8,
  },
  secondaryBtn: {
    flex: 1, padding: 12, backgroundColor: '#1a1a2e',
    borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: '#334',
  },
  secondaryBtnText: { color: '#aaa', fontWeight: '600', fontSize: 14 },
});
