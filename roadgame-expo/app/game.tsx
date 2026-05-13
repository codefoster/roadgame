import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Region, Weather, TOURISTS, HITCHHIKERS, BOSSES, BADGES, ROAD_EVENTS } from '../src/constants/game';
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

// ─── helpers ──────────────────────────────────────────────────────────────────

function hasBadge(activeBadges: string[], id: string) {
  return activeBadges.includes(id);
}
function badgeLevel(badgeLevels: Record<string, number>, id: string) {
  return badgeLevels[id] ?? 0;
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
  const relayRef        = useRef<RelayClient | null>(null);
  const infiniteRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const doubleRef       = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const grassRef        = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const patrolBlockRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const roadEventTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coinAccRef      = useRef(0); // accumulated points toward next coin
  const patrolPausedWatch = useRef(false);

  const [bingoVisible, setBingoVisible] = useState(false);
  const [alphaVisible, setAlphaVisible] = useState(false);
  const [hitchhikerPopup, setHitchhikerPopup] = useState<{ name: string; description: string; duration: number } | null>(null);
  const [roadEventBanner, setRoadEventBanner] = useState<{ name: string; desc: string; color: string; duration: number } | null>(null);

  // ── init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    store.initGame({ weather, region, activeBadges, purchases });

    // Phoenix: set coin floor for this game
    if (activeBadges.includes('phoenix')) {
      const level = badgeLevel(persist.badgeLevels, 'phoenix');
      persist.setCoinFloor(5 + level * 5);
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

    if (mpActive) setupMultiplayer();

    return () => clearAllTimers();
  }, []);

  function clearAllTimers() {
    [bTimerRef, decayTimerRef, rivalTimerRef, mpSyncRef].forEach(r => r.current && clearInterval(r.current));
    [flashTimerRef, touristTimerRef, patrolTimerRef, infiniteRef, doubleRef, grassRef, patrolBlockRef, roadEventTimerRef]
      .forEach(r => r.current && clearTimeout(r.current));
    relayRef.current?.stop();
  }

  // ── multiplayer ─────────────────────────────────────────────────────────────

  function setupMultiplayer() {
    const client = new RelayClient(params.roomCode!, (msg) => {
      if (msg.type === 'sync' && msg.payload) {
        store.setMpOpponentScore(msg.payload.score as number ?? 0);
      }
    });
    client.start();
    relayRef.current = client;
    mpSyncRef.current = setInterval(() => {
      client.send('sync', { score: useGameStore.getState().scoreA });
    }, 2000);
  }

  // ── B: watch ────────────────────────────────────────────────────────────────

  function startWatch() {
    if (bTimerRef.current) return;
    store.setBWatching(true);
    const interval = bInterval(
      store.scoreA, hasBadge(activeBadges, 'centaur'),
      badgeLevel(persist.badgeLevels, 'centaur')
    );
    const actualInterval = store.hWatchDouble ? interval / 2 : interval;
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

  function commitWatch() {
    const pending = store.pendingB;
    if (pending <= 0) return;

    const tier = watchTier(pending);
    if (tier > 0) {
      const code = generatePowerup(
        tier as 1|2|3, region,
        store.luckyRoll, store.powerSurge
      );
      store.addPowerup(code);
      if (store.luckyRoll) store.setEffect({ luckyRoll: false });
      if (store.powerSurge) store.setEffect({ powerSurge: false });

      // Challenge: earn l2+
      if (store.flashChallenge?.type === 'earn_l2' && tier >= 2) {
        store.updateChallengeProgress(1);
      }
    }

    // Nessie patience bonus every 20s
    if (hasBadge(activeBadges, 'nessie')) {
      const level = badgeLevel(persist.badgeLevels, 'nessie');
      store.addScoreA(1 + level);
    } else if (pending >= 10) {
      const mermaidBonus = hasBadge(activeBadges, 'mermaid')
        ? 10 + badgeLevel(persist.badgeLevels, 'mermaid') * 5
        : 5;
      store.addScoreA(mermaidBonus);
    }

    store.commitPendingB();

    // Salamander: bonus pts from pending credits
    if (hasBadge(activeBadges, 'ifrit')) {
      const level = badgeLevel(persist.badgeLevels, 'ifrit');
      const ratio = [0.10, 0.20, 0.30, 0.40][level] ?? 0.10;
      const bonus = Math.floor(pending * ratio);
      if (bonus > 0) store.addScoreA(bonus);
    }

    // Challenge progress: watch_credits completion check
    if (store.flashChallenge?.type === 'watch_credits') {
      const ch = store.flashChallenge;
      if (ch.progress >= ch.target) {
        store.addScoreA(30);
        store.clearFlash();
      }
    }
  }

  // ── A: spot ─────────────────────────────────────────────────────────────────

  function pressA() {
    if (store.patrolVisible) return;
    if (store.bossVisible) return;
    if (store.scoreB < 1 && !store.infiniteCredits) return;

    store.logAggression();

    if (store.bWatching && bTimerRef.current) {
      commitWatch();
      clearInterval(bTimerRef.current);
      bTimerRef.current = setInterval(onBTick, 1000);
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
      const spareTire = purchases.includes('spare_tire') && !store.spareTireUsed && newCredits <= 0;
      if (spareTire) { store.setScoreB(1); store.useSpareTire(); doFlash('Spare Tire used!', '#ffaa00'); }
      else store.setScoreB(newCredits);
    }
    const openRoad = store.roadEventId === 'open_road' && Date.now() < store.roadEventExpiry;
    store.addScoreA(points + (openRoad ? 1 : 0));
    store.setEffect({ stackHoldCount: store.spotCount + 1 } as any);
    // actually increment spotCount
    useGameStore.setState(s => ({ spotCount: s.spotCount + 1 }));

    checkCoinsFromScore(points);

    // Challenge: spot3
    if (store.flashChallenge?.type === 'spot3') {
      store.updateChallengeProgress(1);
      if (store.flashChallenge.progress + 1 >= store.flashChallenge.target) {
        store.addScoreA(25);
        store.clearFlash();
      }
    }

    checkPatrolTrigger();
    checkDifficulty(store.scoreA + points);

    // 1/150 chance of boss encounter
    if (Math.random() < 1 / 150) {
      const boss = pickRandom(BOSSES);
      store.setBoss(boss.id);
    }
  }

  // ── Coins from scoring ────────────────────────────────────────────────────────

  function checkCoinsFromScore(pts: number) {
    if (pts <= 0) return;
    const threshold = hasBadge(activeBadges, 'unicorn')
      ? 15 - badgeLevel(persist.badgeLevels, 'unicorn') * 3
      : 25;
    coinAccRef.current += pts;
    const earned = Math.floor(coinAccRef.current / threshold);
    if (earned > 0) {
      coinAccRef.current -= earned * threshold;
      persist.addCoins(earned);
    }
  }

  // ── Difficulty ────────────────────────────────────────────────────────────────

  function checkDifficulty(newScore: number) {
    const thresholds = [200, 500, 800, 1000];
    for (const t of thresholds) {
      if (newScore >= t && !store.lockedThresholds.includes(t)) {
        store.addLockedThreshold(t);
        doFlash('Level Up!', '#ffff00');
      }
    }
  }

  // ── Flash system ─────────────────────────────────────────────────────────────

  function scheduleFlash() {
    const [minMs, maxMs] = flashInterval(store.scoreA, weather);
    const delay = randInt(minMs, maxMs);
    flashTimerRef.current = setTimeout(doRandomFlash, delay);
  }

  function doFlash(text: string, color: string) {
    store.setFlash(text, color);
    setTimeout(() => store.clearFlash(), 3000);
  }

  function doRandomFlash() {
    const score = store.scoreA;

    // Dragon: block every other flash for the first 5 flash events (1st, 3rd, 5th blocked)
    if (hasBadge(activeBadges, 'dragon') && store.dragonFlashesUsed < 5) {
      const newCount = store.dragonFlashesUsed + 1;
      store.markFlashBlockUsed();
      if (newCount % 2 === 1) { // odd events (1,3,5) are blocked
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
          const coyoteLevel = hasBadge(activeBadges, 'kitsune') ? badgeLevel(persist.badgeLevels, 'kitsune') : -1;
          const blockChance = coyoteLevel >= 0 ? ([0.25, 0.40, 0.55, 0.70][coyoteLevel] ?? 0.25) : 0;
          if (Math.random() < blockChance) {
            doFlash('Steal blocked! (Coyote)', '#aa44ff');
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
        const mult = manticore ? ([1.3, 1.5, 1.7, 2.0][badgeLevel(persist.badgeLevels, 'manticore')] ?? 1.3) : 1;
        const duration = Math.round(20000 * mult);
        store.setFlashChallenge({ type: 'spot3', target: 3, progress: 0, deadline: Date.now() + duration });
        doFlash('Challenge: Spot 3 in 20s!', '#ff8800');
        setTimeout(() => { if (store.flashChallenge?.type === 'spot3') store.clearFlash(); }, duration);
        break;
      }
      case 'challenge_watch': {
        const manticoreW = hasBadge(activeBadges, 'manticore');
        const multW = manticoreW ? ([1.3, 1.5, 1.7, 2.0][badgeLevel(persist.badgeLevels, 'manticore')] ?? 1.3) : 1;
        const target = randInt(15, 40);
        const durationW = Math.round(30000 * multW);
        doFlash(`Challenge: Watch ${target} credits!`, '#00ccff');
        store.setFlashChallenge({ type: 'watch_credits', target, progress: 0, deadline: Date.now() + durationW });
        setTimeout(() => { if (store.flashChallenge?.type === 'watch_credits') store.clearFlash(); }, durationW);
        break;
      }
      case 'challenge_l2': {
        const manticoreL = hasBadge(activeBadges, 'manticore');
        const multL = manticoreL ? ([1.3, 1.5, 1.7, 2.0][badgeLevel(persist.badgeLevels, 'manticore')] ?? 1.3) : 1;
        const durationL = Math.round(60000 * multL);
        doFlash('Challenge: Earn L2+ power-up!', '#88ff44');
        store.setFlashChallenge({ type: 'earn_l2', target: 1, progress: 0, deadline: Date.now() + durationL });
        setTimeout(() => { if (store.flashChallenge?.type === 'earn_l2') store.clearFlash(); }, durationL);
        break;
      }
    }
    scheduleFlash();
  }

  // ── Decay ─────────────────────────────────────────────────────────────────────

  function startDecay() {
    decayTimerRef.current = setInterval(() => {
      const score = store.scoreA;
      const rate = decayRate(score, region);
      if (rate === 0) return;
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
      const ev = pickRandom(ROAD_EVENTS);
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
      const { newRivalScore, frozenTurns } = rivalAction(
        store.rivalScore, store.scoreA,
        store.rivalFrozenTurns,
        hasBadge(activeBadges, 'kraken'),
        badgeLevel(persist.badgeLevels, 'kraken')
      );
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
    const shuckReduction = hasBadge(activeBadges, 'shuck')
      ? ([0.20, 0.30, 0.40, 0.55][badgeLevel(persist.badgeLevels, 'shuck')] ?? 0.20)
      : 0;
    const aggression = Math.min(1, (pressesLastSecond / 4) * (speedTrapActive ? 2 : 1)) * (1 - shuckReduction);
    if (checkPatrol(region, aggression)) {
      if (purchases.includes('cb_radio')) {
        store.setFlash('📻 Breaker — smokey ahead!', '#ffaa00');
        setTimeout(() => store.clearFlash(), 3000);
      }
      const patrolDelay = purchases.includes('cb_radio') ? 5000 : 0;
      setTimeout(() => {
        store.setPatrolVisible(true);
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
    }
  }

  // ── Power-up activation ──────────────────────────────────────────────────────

  function activatePowerup(code: string) {
    store.removePowerup(code);
    const tier = parseInt(code[0]) as 1 | 2 | 3;
    const sub = code[1];

    // Sphinx: bonus pts for activating any powerup
    if (hasBadge(activeBadges, 'sphinx')) {
      const level = badgeLevel(persist.badgeLevels, 'sphinx');
      const bonus = [5, 8, 12, 15][level] ?? 5;
      store.addScoreA(bonus);
    }

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

  function onBossResult(fled: boolean, won: boolean, winPts: number, winCoins: number) {
    const boss = BOSSES.find(b => b.id === store.bossId);
    store.setBoss(null);
    if (fled) {
      persist.spendCoins(boss?.fleeCoins ?? 5);
    } else if (won) {
      store.addScoreA(winPts);
      persist.addCoins(winCoins);
      doFlash(`Defeated ${boss?.name ?? 'Boss'}!`, '#ffd700');
    } else {
      store.addScoreA(-(boss?.losePts ?? 10));
      if ((boss?.loseCoins ?? 0) > 0) persist.spendCoins(boss!.loseCoins);
      if ((boss?.loseCredits ?? 0) > 0) store.addScoreB(-boss!.loseCredits);
      doFlash(`${boss?.name ?? 'Boss'} wins...`, '#ff3333');
    }
  }

  function onBingo(coins: number, pts: number, label: string) {
    persist.addCoins(coins);
    store.addScoreA(pts);
    doFlash(label, '#ffd700');
  }

  // ── Menu / back ───────────────────────────────────────────────────────────────

  function goToMenu() {
    clearAllTimers();
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
    router.replace('/');
  }

  // ── render ────────────────────────────────────────────────────────────────────

  const { scoreA, scoreB, pendingB, bWatching, toggleMode,
    powerups, flashVisible, flashText, flashColor,
    doublePoints, grassVisible, grassOn, infiniteCredits,
    patrolVisible, rivalScore, activeBadges: storeActiveBadges,
    flashChallenge, hGeologist, hTrucker, hDJ,
    bossVisible, bossId, hHunter, nextBadgeId } = store;

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

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn} onPress={goToMenu}>
          <Text style={styles.menuText}>Menu</Text>
        </TouchableOpacity>
        <Text style={styles.conditionText}>
          {region} · {weather}
        </Text>
        {mpActive && (
          <Text style={styles.opponentScore}>Opp: {store.mpOpponentScore}</Text>
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

      {/* Active effects bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.effectsRow}>
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
        {nextBadgeId && (
          <Text style={[styles.effectChip, { backgroundColor: '#1a3300' }]}>
            📻 {BADGES.find(b => b.id === nextBadgeId)?.name ?? nextBadgeId}
          </Text>
        )}
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
        <PowerupList powerups={powerups} onActivate={activatePowerup} />
      </View>

      {/* Main buttons */}
      <View style={styles.mainButtons}>
        {/* A */}
        <TouchableOpacity
          style={[styles.gameBtn, styles.aBtn, (scoreB < 1 && !infiniteCredits) && styles.btnDisabled]}
          onPress={pressA}
          disabled={scoreB < 1 && !infiniteCredits}
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
        onResult={onBossResult}
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
        coins={persist.coins}
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
  opponentScore: { color: '#f44', fontSize: 13 },

  scoreRow: { flexDirection: 'row', paddingHorizontal: 8, marginBottom: 8 },
  scoreBox: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#111', marginHorizontal: 2, borderRadius: 6 },
  scoreLabel: { color: '#666', fontSize: 10 },
  scoreValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

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
