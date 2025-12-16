import { Card, Rank, Suit } from '../types';

const SUITS = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
const RANKS = [
  Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
  Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace
];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        rank,
        suit,
        id: `${rank}${suit}`
      });
    });
  });
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const cardToString = (card: Card): string => `${card.rank}${card.suit}`;

// Helper to remove specific cards from a deck (used when forcing opponent hands)
export const removeCardsFromDeck = (deck: Card[], cardsToRemove: Card[]): Card[] => {
  const idsToRemove = new Set(cardsToRemove.map(c => c.id));
  return deck.filter(c => !idsToRemove.has(c.id));
};

// Generate a strong hand for opponent
export const generateOpponentHand = (deck: Card[], playerHand: Card[]): { hand: Card[], remainingDeck: Card[] } => {
  const isStrong = Math.random() < 0.5;
  let remainingDeck = removeCardsFromDeck(deck, playerHand);
  
  // Helper to find a card in the deck
  const findCard = (r: Rank, s?: Suit): Card | undefined => {
    return remainingDeck.find(c => c.rank === r && (s ? c.suit === s : true));
  };

  if (!isStrong) {
    // 50% Random
    const c1 = remainingDeck.pop()!;
    const c2 = remainingDeck.pop()!;
    return { hand: [c1, c2], remainingDeck };
  }

  // 50% Strong: AA, AK, QQ, 9T suited
  const strongTypes = ['AA', 'AK', 'QQ', '9Ts'];
  const type = strongTypes[Math.floor(Math.random() * strongTypes.length)];

  let hand: Card[] = [];

  if (type === 'AA') {
    const ace1 = findCard(Rank.Ace);
    if (ace1) {
       remainingDeck = removeCardsFromDeck(remainingDeck, [ace1]);
       const ace2 = findCard(Rank.Ace);
       if (ace2) {
         remainingDeck = removeCardsFromDeck(remainingDeck, [ace2]);
         hand = [ace1, ace2];
       }
    }
  } else if (type === 'QQ') {
     const q1 = findCard(Rank.Queen);
     if (q1) {
        remainingDeck = removeCardsFromDeck(remainingDeck, [q1]);
        const q2 = findCard(Rank.Queen);
        if (q2) {
          remainingDeck = removeCardsFromDeck(remainingDeck, [q2]);
          hand = [q1, q2];
        }
     }
  } else if (type === 'AK') {
    const a = findCard(Rank.Ace);
    if (a) {
       remainingDeck = removeCardsFromDeck(remainingDeck, [a]);
       const k = findCard(Rank.King);
       if (k) {
         remainingDeck = removeCardsFromDeck(remainingDeck, [k]);
         hand = [a, k];
       }
    }
  } else if (type === '9Ts') {
     // Try to find T and 9 of same suit
     const ten = findCard(Rank.Ten);
     if (ten) {
        const nine = findCard(Rank.Nine, ten.suit);
        if (nine) {
           remainingDeck = removeCardsFromDeck(remainingDeck, [ten, nine]);
           hand = [ten, nine];
        }
     }
  }

  // Fallback if specific strong cards were taken by player (e.g. player has A A, can't make AA)
  if (hand.length < 2) {
    const c1 = remainingDeck.pop()!;
    const c2 = remainingDeck.pop()!;
    hand = [c1, c2];
  }

  return { hand, remainingDeck };
};