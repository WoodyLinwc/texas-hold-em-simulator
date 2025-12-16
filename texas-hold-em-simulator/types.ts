export enum Suit {
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
  Spades = '♠',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

export interface Card {
  rank: Rank;
  suit: Suit;
  id: string; // unique identifier for React keys
}

export enum GameStage {
  Idle = 'Idle',
  PreFlop = 'PreFlop',
  Flop = 'Flop',
  Turn = 'Turn',
  River = 'River',
  Showdown = 'Showdown',
  Analyzing = 'Analyzing',
  Results = 'Results',
}

export interface HandAnalysis {
  winner: 'Player' | 'Split' | string; // 'Opponent 1' etc
  winningHandDescription: string;
  playerHandDescription: string;
  opponentHandDescriptions: string[];
  equities: {
    preflop: number;
    flop: number;
    turn: number;
    river: number;
  };
  commentary: string;
}