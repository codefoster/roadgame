import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '../stores/gameStore';
import { checkBingoLines, pickRandom } from '../lib/gameLogic';
import { usePersistentStore } from '../stores/persistentStore';

const BINGO_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const ALL_BADGES = [
  'bigfoot','phoenix','unicorn','kraken','yeti','dragon','leprechaun',
  'mermaid','sphinx','centaur','griffin','basilisk','selkie','thunderbird',
  'nessie','banshee','kirin','manticore','wendigo','valkyrie',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onBingo: (coins: number, pts: number, label: string) => void;
}

export default function BingoCard({ visible, onClose, onBingo }: Props) {
  const { bingoCard, bingoMarked, markBingo, resetBingo, goldenTiles, activeBadges, addScoreA, nextBadgeId, setNextBadge } = useGameStore();
  const { addCoins, earnBadge, badges, badgeLevels } = usePersistentStore();
  const [prevLines, setPrevLines] = useState<number[]>([]);

  const wendigoLevel = badgeLevels['wendigo'] ?? 0;
  const wendigoPts = activeBadges.includes('wendigo') ? ([20, 25, 30, 40][wendigoLevel] ?? 20) : 0;

  function handleMark(idx: number) {
    if (bingoMarked[idx]) return;
    markBingo(idx);
    const newMarked = bingoMarked.map((v, i) => i === idx ? true : v);

    const lines = checkBingoLines(newMarked);
    const newLines = lines.filter(l => !prevLines.includes(l));
    if (newLines.length === 0) return;

    // Count max golden tiles in any single completed line
    const maxGoldenInLine = Math.max(...newLines.map(lineIdx =>
      BINGO_LINES[lineIdx].filter(cell => goldenTiles.includes(cell)).length
    ));

    let coins = newLines.length * 5;
    let pts = newLines.length * (5 + wendigoPts);
    let label = 'BINGO!';

    if (maxGoldenInLine >= 2) {
      coins = newLines.length * 10;
      pts = newLines.length * (10 + wendigoPts);
      label = 'DOUBLE GOLDEN BINGO!';
      const unowned = ALL_BADGES.filter(id => !badges.includes(id));
      if (unowned.length > 0) {
        const badgeToEarn = nextBadgeId ?? pickRandom(unowned);
        earnBadge(badgeToEarn);
        // Re-roll next badge preview for CB Radio
        if (nextBadgeId) {
          const remaining = unowned.filter(id => id !== badgeToEarn);
          setNextBadge(remaining.length > 0 ? pickRandom(remaining) : null);
        }
      }
    } else if (maxGoldenInLine === 1) {
      coins = newLines.length * 10;
      pts = newLines.length * (10 + wendigoPts);
      label = 'GOLDEN BINGO!';
    }

    setPrevLines([]);
    resetBingo();
    onBingo(coins, pts, label);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Bingo</Text>
          <Text style={styles.hint}>✦ = golden tile · 2 golden in a line = badge</Text>

          <View style={styles.grid}>
            {bingoCard.map((item, idx) => {
              const isGolden = goldenTiles.includes(idx);
              const isMarked = bingoMarked[idx];
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.cell,
                    isGolden && styles.goldenCell,
                    isMarked && (isGolden ? styles.goldenMarked : styles.markedCell),
                  ]}
                  onPress={() => handleMark(idx)}
                >
                  {isGolden && !isMarked && <Text style={styles.goldenStar}>✦</Text>}
                  <Text style={[styles.cellText, isMarked && styles.markedText]} numberOfLines={2}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={() => { resetBingo(); setPrevLines([]); }}>
            <Text style={styles.resetText}>Reset Card (−30 pts)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  hint: { color: '#ffd700', fontSize: 11, textAlign: 'center', marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '33.33%', height: 64,
    borderWidth: 1, borderColor: '#444',
    justifyContent: 'center', alignItems: 'center',
    padding: 4, backgroundColor: '#0d0d1a',
  },
  goldenCell: { borderColor: '#aa8800', backgroundColor: '#1a1400' },
  markedCell: { backgroundColor: '#2d6a2d' },
  goldenMarked: { backgroundColor: '#7a5500' },
  goldenStar: { color: '#ffd700', fontSize: 10, position: 'absolute', top: 3, right: 4 },
  cellText: { color: '#ccc', fontSize: 10, textAlign: 'center' },
  markedText: { color: '#fff', fontWeight: 'bold' },
  resetBtn: { marginTop: 10, padding: 8, backgroundColor: '#5a0000', borderRadius: 6, alignItems: 'center' },
  resetText: { color: '#ffaaaa', fontSize: 13 },
  closeBtn: { marginTop: 8, padding: 10, backgroundColor: '#333', borderRadius: 8, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold' },
});
