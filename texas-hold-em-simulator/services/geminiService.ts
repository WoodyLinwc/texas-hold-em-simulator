import { Card, Rank, Suit } from "../types";
import { createDeck, removeCardsFromDeck } from "../utils/deck";

// --- Types & Constants ---
const RANK_VALUE: Record<Rank, number> = {
  [Rank.Two]: 0, [Rank.Three]: 1, [Rank.Four]: 2, [Rank.Five]: 3,
  [Rank.Six]: 4, [Rank.Seven]: 5, [Rank.Eight]: 6, [Rank.Nine]: 7,
  [Rank.Ten]: 8, [Rank.Jack]: 9, [Rank.Queen]: 10, [Rank.King]: 11,
  [Rank.Ace]: 12
};

const SUIT_VALUE: Record<Suit, number> = {
  [Suit.Clubs]: 0, [Suit.Diamonds]: 1, [Suit.Hearts]: 2, [Suit.Spades]: 3
};

const HAND_TYPES = [
  "High Card", "Pair", "Two Pair", "Three of a Kind", 
  "Straight", "Flush", "Full House", "Four of a Kind", "Straight Flush"
];

interface HandResult {
  score: number; // Numeric score for comparison
  typeIndex: number; // Index in HAND_TYPES
  description: string;
  kickers: number[];
}

// --- Evaluator Logic ---

// Returns a comparable score and description for a 5-7 card hand
const evaluateHand = (cards: Card[]): HandResult => {
  if (cards.length === 0) return { score: 0, typeIndex: 0, description: "Fold", kickers: [] };

  // Convert to numeric representation for processing
  const nums = cards.map(c => ({
    r: RANK_VALUE[c.rank],
    s: SUIT_VALUE[c.rank as unknown as any] || SUIT_VALUE[c.suit], // typesafety fallback
    rankStr: c.rank
  })).sort((a, b) => b.r - a.r);

  const ranks = nums.map(c => c.r);
  const suits = nums.map(c => c.s);

  // Frequency map
  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  
  const four = Object.keys(counts).find(key => counts[parseInt(key)] === 4);
  const three = Object.keys(counts).filter(key => counts[parseInt(key)] === 3).map(Number).sort((a,b) => b-a);
  const pairs = Object.keys(counts).filter(key => counts[parseInt(key)] === 2).map(Number).sort((a,b) => b-a);

  // Flush Check
  const suitCounts: Record<number, number> = {};
  let flushSuit = -1;
  for (const s of suits) {
    suitCounts[s] = (suitCounts[s] || 0) + 1;
    if (suitCounts[s] >= 5) flushSuit = s;
  }
  const flushCards = flushSuit !== -1 ? nums.filter(c => c.s === flushSuit) : [];

  // Straight Check (get unique ranks descending)
  const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => b - a);
  const getStraightHigh = (rks: number[]) => {
    for (let i = 0; i <= rks.length - 5; i++) {
      if (rks[i] - rks[i+4] === 4) return rks[i];
    }
    // Wheel (A-5 straight)
    if (rks.includes(12) && rks.includes(0) && rks.includes(1) && rks.includes(2) && rks.includes(3)) return 3; // 5 high straight
    return -1;
  };
  
  const straightHigh = getStraightHigh(uniqueRanks);

  // Straight Flush Check
  let straightFlushHigh = -1;
  if (flushSuit !== -1) {
    const flushRanks = flushCards.map(c => c.r);
    // Remove duplicates just in case, though unlikely for single deck with distinct suits unless bug
    const uniqueFlushRanks = Array.from(new Set(flushRanks)).sort((a,b) => b-a);
    straightFlushHigh = getStraightHigh(uniqueFlushRanks);
  }

  // Determine Hand Type
  let typeIndex = 0;
  let mainRanks: number[] = [];
  let kickerRanks: number[] = [];

  if (straightFlushHigh !== -1) {
    typeIndex = 8;
    mainRanks = [straightFlushHigh];
  } else if (four) {
    typeIndex = 7;
    const f = parseInt(four);
    mainRanks = [f];
    kickerRanks = ranks.filter(r => r !== f).slice(0,1);
  } else if (three.length >= 1 && pairs.length >= 1) {
    typeIndex = 6; // Full House (Trip + Pair)
    mainRanks = [three[0], pairs[0]];
  } else if (three.length >= 2) {
    typeIndex = 6; // Full House (Trip + Trip -> Trip + Pair)
    mainRanks = [three[0], three[1]];
  } else if (flushSuit !== -1) {
    typeIndex = 5;
    mainRanks = flushCards.map(c => c.r).slice(0, 5);
  } else if (straightHigh !== -1) {
    typeIndex = 4;
    mainRanks = [straightHigh];
  } else if (three.length === 1) {
    typeIndex = 3;
    mainRanks = [three[0]];
    kickerRanks = ranks.filter(r => r !== three[0]).slice(0, 2);
  } else if (pairs.length >= 2) {
    typeIndex = 2;
    mainRanks = [pairs[0], pairs[1]];
    kickerRanks = ranks.filter(r => r !== pairs[0] && r !== pairs[1]).slice(0, 1);
  } else if (pairs.length === 1) {
    typeIndex = 1;
    mainRanks = [pairs[0]];
    kickerRanks = ranks.filter(r => r !== pairs[0]).slice(0, 3);
  } else {
    typeIndex = 0;
    mainRanks = [];
    kickerRanks = ranks.slice(0, 5);
  }

  // Construct score: Type (4 bits) | Main1 (4 bits) | Main2 (4 bits) | Kickers...
  // Simple large number construction
  let score = typeIndex * 100000000;
  
  // Add values for main components (like pair ranks)
  if (mainRanks.length > 0) score += mainRanks[0] * 1000000;
  if (mainRanks.length > 1) score += mainRanks[1] * 10000;
  
  // Add values for kickers/remaining high cards (needed for Flush/HighCard comparison)
  // We use weights to ensure order matters
  if (typeIndex === 5 || typeIndex === 0) {
      // Flush or High Card: all 5 cards matter
      const scoreRanks = typeIndex === 5 ? mainRanks : kickerRanks;
      score += (scoreRanks[0] || 0) * 1000000;
      score += (scoreRanks[1] || 0) * 10000;
      score += (scoreRanks[2] || 0) * 100;
      score += (scoreRanks[3] || 0) * 1;
      score += (scoreRanks[4] || 0) * 0.01;
  } else {
      // Others use kickerRanks
      if (kickerRanks.length > 0) score += kickerRanks[0] * 100;
      if (kickerRanks.length > 1) score += kickerRanks[1] * 1;
      if (kickerRanks.length > 2) score += kickerRanks[2] * 0.01;
  }

  // Generate description
  const getRankName = (v: number) => Object.keys(RANK_VALUE).find(key => RANK_VALUE[key as Rank] === v);
  const typeName = HAND_TYPES[typeIndex];
  let desc = typeName;
  
  if (typeIndex === 8) desc = `${getRankName(mainRanks[0])}-High Straight Flush`;
  else if (typeIndex === 7) desc = `Four of a Kind, ${getRankName(mainRanks[0])}s`;
  else if (typeIndex === 6) desc = `Full House, ${getRankName(mainRanks[0])}s full of ${getRankName(mainRanks[1])}s`;
  else if (typeIndex === 5) desc = `Flush, ${getRankName(mainRanks[0])} High`;
  else if (typeIndex === 4) desc = `Straight, ${getRankName(mainRanks[0])} High`;
  else if (typeIndex === 3) desc = `Three of a Kind, ${getRankName(mainRanks[0])}s`;
  else if (typeIndex === 2) desc = `Two Pair, ${getRankName(mainRanks[0])}s and ${getRankName(mainRanks[1])}s`;
  else if (typeIndex === 1) desc = `Pair of ${getRankName(mainRanks[0])}s`;
  else desc = `High Card ${getRankName(kickerRanks[0])}`;

  return { score, typeIndex, description: desc, kickers: kickerRanks };
};

// --- Simulation Logic ---

const simulateEquity = (pHand: Card[], oHands: Card[][], currentBoard: Card[], iterations: number = 500): number => {
  let wins = 0;
  let splits = 0;
  
  // Create a base deck excluding known cards
  const fullDeck = createDeck();
  const allOpponentCards = oHands.flat();
  const knownCardIds = new Set([...pHand, ...allOpponentCards, ...currentBoard].map(c => c.id));
  const unknownDeck = fullDeck.filter(c => !knownCardIds.has(c.id));

  for (let i = 0; i < iterations; i++) {
    // Shuffle unknown cards
    const simDeck = [...unknownDeck];
    // Fisher-Yates shuffle partial
    for (let k = simDeck.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [simDeck[k], simDeck[j]] = [simDeck[j], simDeck[k]];
    }

    const cardsNeeded = 5 - currentBoard.length;
    const simBoard = [...currentBoard, ...simDeck.slice(0, cardsNeeded)];

    const pResult = evaluateHand([...pHand, ...simBoard]);
    
    // Evaluate all opponents
    let maxOpponentScore = -1;
    for (const oHand of oHands) {
        const oResult = evaluateHand([...oHand, ...simBoard]);
        if (oResult.score > maxOpponentScore) {
            maxOpponentScore = oResult.score;
        }
    }

    if (pResult.score > maxOpponentScore) wins++;
    else if (pResult.score === maxOpponentScore) splits++;
  }

  return (wins + (splits / 2)) / iterations;
};

// --- Main Analysis Function ---

export const analyzeGame = async (
  playerHand: Card[],
  opponentHands: Card[][],
  board: Card[]
) => {
  // We use a small delay to allow UI to render 'loading' state if needed, though local is fast
  await new Promise(resolve => setTimeout(resolve, 50));

  const playerFinal = evaluateHand([...playerHand, ...board]);
  
  // Evaluate all opponents
  const opponentFinals = opponentHands.map(h => evaluateHand([...h, ...board]));
  
  let bestOpponentScore = -1;
  let bestOpponentIndex = -1;

  opponentFinals.forEach((res, idx) => {
      if (res.score > bestOpponentScore) {
          bestOpponentScore = res.score;
          bestOpponentIndex = idx;
      }
  });

  let winner: 'Player' | 'Split' | string;
  let winningHandDescription = "";

  if (playerFinal.score > bestOpponentScore) {
      winner = 'Player';
      winningHandDescription = playerFinal.description;
  } else if (playerFinal.score < bestOpponentScore) {
      winner = `Opponent ${bestOpponentIndex + 1}`;
      winningHandDescription = opponentFinals[bestOpponentIndex].description;
  } else {
      // Check if it's actually a tie with the best opponent
      if (playerFinal.score === bestOpponentScore) {
          winner = 'Split';
          winningHandDescription = playerFinal.description;
      } else {
          // Player loses to multiple opponents who tied each other?
          // Simplification: Player loses
          winner = `Opponent ${bestOpponentIndex + 1}`;
          winningHandDescription = opponentFinals[bestOpponentIndex].description;
      }
  }

  // Calculate retrospective equities
  // Pre-flop
  const eqPre = simulateEquity(playerHand, opponentHands, [], 800);
  
  // Flop (if reached)
  const flopCards = board.length >= 3 ? board.slice(0, 3) : [];
  const eqFlop = flopCards.length === 3 ? simulateEquity(playerHand, opponentHands, flopCards, 800) : 0;

  // Turn (if reached)
  const turnCards = board.length >= 4 ? board.slice(0, 4) : [];
  const eqTurn = turnCards.length === 4 ? simulateEquity(playerHand, opponentHands, turnCards, 800) : 0;

  // River (current result)
  const eqRiver = winner === 'Player' ? 1 : (winner === 'Split' ? 0.5 : 0);

  // Generate simple commentary
  let commentary = "";
  if (winner === 'Player') {
    if (eqPre < (1 / (opponentHands.length + 1))) commentary = "Amazing win! You beat the odds against multiple opponents.";
    else if (eqPre > 0.7) commentary = "Dominant performance. You were ahead most of the way.";
    else commentary = `Well played. Your ${playerFinal.description} secured the pot.`;
  } else if (winner.startsWith('Opponent')) {
    commentary = `${winner} takes it with ${winningHandDescription}. Tough field today!`;
  } else {
    commentary = "It's a split pot! A rare tie game.";
  }

  return {
    winner,
    winningHandDescription,
    playerHandDescription: playerFinal.description,
    opponentHandDescriptions: opponentFinals.map(r => r.description),
    equities: {
      preflop: Math.round(eqPre * 100),
      flop: board.length >= 3 ? Math.round(eqFlop * 100) : 0,
      turn: board.length >= 4 ? Math.round(eqTurn * 100) : 0,
      river: Math.round(eqRiver * 100),
    },
    commentary
  };
};