import React, { useState, useEffect, useCallback } from "react";
import { Card as CardType, GameStage, HandAnalysis, Rank } from "./types";
import { createDeck, shuffleDeck, generateOpponentHand } from "./utils/deck";
import { analyzeGame } from "./services/geminiService";
import Card from "./components/Card";
import AnalysisModal from "./components/AnalysisModal";
import {
  Loader2,
  User,
  ShieldAlert,
  Users,
  Sparkles,
  Smartphone,
  LogOut,
} from "lucide-react";

const App: React.FC = () => {
  const [stage, setStage] = useState<GameStage>(GameStage.Idle);
  const [numOpponents, setNumOpponents] = useState(1);
  const [deck, setDeck] = useState<CardType[]>([]);
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [opponentHands, setOpponentHands] = useState<CardType[][]>([]);
  const [board, setBoard] = useState<CardType[]>([]);
  const [analysis, setAnalysis] = useState<HandAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const isSmallHeight = window.innerHeight < 600;
      setIsMobileLandscape(isLandscape && isSmallHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const startNewGame = useCallback(
    (forceStrongPlayer: boolean = false) => {
      setStage(GameStage.PreFlop);
      setBoard([]);
      setAnalysis(null);
      setError(null);

      let currentDeck: CardType[] = [];
      let pHand: CardType[] = [];

      if (forceStrongPlayer) {
        const fullDeck = createDeck();
        const highRanks = [
          Rank.Ten,
          Rank.Jack,
          Rank.Queen,
          Rank.King,
          Rank.Ace,
        ];
        const randomRank =
          highRanks[Math.floor(Math.random() * highRanks.length)];
        const cardsOfRank = fullDeck.filter((c) => c.rank === randomRank);
        pHand = cardsOfRank.slice(0, 2);
        const idsToRemove = new Set(pHand.map((c) => c.id));
        currentDeck = shuffleDeck(
          fullDeck.filter((c) => !idsToRemove.has(c.id))
        );
      } else {
        currentDeck = shuffleDeck(createDeck());
        const p1 = currentDeck.pop()!;
        const p2 = currentDeck.pop()!;
        pHand = [p1, p2];
      }

      setPlayerHand(pHand);

      const newOpponentHands: CardType[][] = [];

      for (let i = 0; i < numOpponents; i++) {
        const { hand, remainingDeck } = generateOpponentHand(currentDeck, []);
        newOpponentHands.push(hand);
        currentDeck = remainingDeck;
      }

      setOpponentHands(newOpponentHands);
      setDeck(currentDeck);
    },
    [numOpponents]
  );

  const quitGame = useCallback(() => {
    setStage(GameStage.Idle);
    setBoard([]);
    setPlayerHand([]);
    setOpponentHands([]);
    setAnalysis(null);
  }, []);

  const handleAction = (action: "bet" | "check" | "fold") => {
    if (action === "fold") {
      setStage(GameStage.Showdown);
      setTimeout(() => startAnalysis(), 500);
      return;
    }

    switch (stage) {
      case GameStage.PreFlop:
        const flop1 = deck[deck.length - 1];
        const flop2 = deck[deck.length - 2];
        const flop3 = deck[deck.length - 3];
        setBoard([flop1, flop2, flop3]);
        setDeck((prev) => prev.slice(0, -3));
        setStage(GameStage.Flop);
        break;

      case GameStage.Flop:
        const turn = deck[deck.length - 1];
        setBoard((prev) => [...prev, turn]);
        setDeck((prev) => prev.slice(0, -1));
        setStage(GameStage.Turn);
        break;

      case GameStage.Turn:
        const river = deck[deck.length - 1];
        setBoard((prev) => [...prev, river]);
        setDeck((prev) => prev.slice(0, -1));
        setStage(GameStage.River);
        break;

      case GameStage.River:
        setStage(GameStage.Showdown);
        setTimeout(() => startAnalysis(), 1000);
        break;
    }
  };

  const startAnalysis = async () => {
    setStage(GameStage.Analyzing);

    let currentBoard = [...board];
    let currentDeck = [...deck];

    while (currentBoard.length < 5 && currentDeck.length > 0) {
      const card = currentDeck.pop()!;
      currentBoard.push(card);
    }

    setBoard(currentBoard);
    setDeck(currentDeck);

    try {
      const result = await analyzeGame(playerHand, opponentHands, currentBoard);
      setAnalysis(result);
      setStage(GameStage.Results);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze game. 游戏分析失败。");
      setStage(GameStage.Showdown);
    }
  };

  const getOpponentClasses = (index: number, total: number): string => {
    const base =
      "absolute flex flex-col items-center gap-2 transition-all duration-500 z-10";

    if (total === 1) {
      return `${base} top-[5%] left-1/2 -translate-x-1/2 scale-[0.6] sm:scale-100 sm:top-[8%]`;
    }

    if (total === 2) {
      if (index === 0)
        return `${base} top-[5%] left-[20%] -translate-x-1/2 scale-[0.55] sm:scale-100 sm:top-[8%] sm:left-[25%]`;
      if (index === 1)
        return `${base} top-[5%] left-[80%] -translate-x-1/2 scale-[0.55] sm:scale-100 sm:top-[8%] sm:left-[75%]`;
    }

    if (total === 3) {
      if (index === 0)
        return `${base} top-[18%] left-1 -translate-y-1/2 origin-left scale-[0.55] sm:scale-100 sm:top-[35%] sm:left-[10%]`;
      if (index === 1)
        return `${base} top-[2%] left-1/2 -translate-x-1/2 origin-top scale-[0.55] sm:scale-100 sm:top-[8%]`;
      if (index === 2)
        return `${base} top-[18%] right-1 -translate-y-1/2 origin-right scale-[0.55] sm:scale-100 sm:top-[35%] sm:right-[10%]`;
    }

    if (total === 4) {
      if (index === 0)
        return `${base} top-[22%] left-1 -translate-y-1/2 origin-left scale-[0.55] sm:scale-100 sm:top-[35%] sm:left-[8%]`;
      if (index === 1)
        return `${base} top-[2%] left-[15%] -translate-x-1/2 origin-top scale-[0.55] sm:scale-100 sm:top-[8%] sm:left-[30%]`;
      if (index === 2)
        return `${base} top-[2%] left-[85%] -translate-x-1/2 origin-top scale-[0.55] sm:scale-100 sm:top-[8%] sm:left-[70%]`;
      if (index === 3)
        return `${base} top-[22%] right-1 -translate-y-1/2 origin-right scale-[0.55] sm:scale-100 sm:top-[35%] sm:right-[8%]`;
    }
    return base;
  };

  if (isMobileLandscape) {
    return (
      <div className="min-h-screen felt-bg flex items-center justify-center p-6 z-50">
        <div className="bg-gray-900/90 backdrop-blur border border-gray-700 p-8 rounded-2xl flex flex-col items-center text-center max-w-sm shadow-2xl">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Smartphone className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Please Rotate Device
            <br />
            请旋转设备
          </h2>
          <p className="text-gray-400">
            The table looks best in portrait mode on mobile devices.
            <br />
            竖屏模式下牌桌显示效果最佳。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen felt-bg flex flex-col font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 sm:h-16 bg-gray-900/80 backdrop-blur border-b border-gray-700 flex items-center justify-between px-4 sm:px-6 z-30 relative">
        <h1 className="text-lg sm:text-xl font-bold text-emerald-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">Texas Hold'em 德州扑克</span>
          <span className="sm:hidden">德州扑克</span>
        </h1>
        {stage !== GameStage.Idle && (
          <button
            onClick={quitGame}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800 py-1.5 px-3 rounded-lg"
          >
            <LogOut className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">Quit 退出</span>
            <span className="sm:hidden">退出</span>
          </button>
        )}
      </div>

      {/* Main Table Area */}
      <div className="flex-1 relative flex flex-col items-center p-2 w-full max-w-7xl mx-auto overflow-hidden">
        {stage === GameStage.Idle ? (
          <div className="mt-10 sm:mt-0 flex flex-col items-center justify-center h-full text-center space-y-6 sm:space-y-8 animate-in zoom-in duration-300 bg-gray-900/40 p-6 sm:p-10 rounded-3xl border border-gray-700 backdrop-blur-sm mx-4">
            <div>
              <div className="text-4xl sm:text-6xl mb-4">♠️ ♥️ ♣️ ♦️</div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
                Ready to Play? 准备好了吗？
              </h2>
              <p className="text-emerald-200 text-sm sm:text-base max-w-md mx-auto mt-2 sm:mt-4">
                Challenge the computer. The opponents play strong hands 50% of
                the time.
                <br />
                挑战电脑。对手有50%的概率会拿到强牌。
              </p>
            </div>

            {/* Opponent Selector */}
            <div className="flex flex-col items-center gap-3">
              <label className="text-gray-300 text-xs sm:text-sm uppercase tracking-wider font-semibold">
                Number of Opponents 对手数量
              </label>
              <div className="flex gap-2 sm:gap-4 p-2 bg-gray-800 rounded-lg">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumOpponents(n)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl transition-all ${
                      numOpponents === n
                        ? "bg-emerald-600 text-white shadow-lg scale-110"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-xs mx-auto">
              <button
                onClick={() => startNewGame(false)}
                className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-lg sm:text-xl font-bold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                Deal Cards 发牌 <ArrowRightIcon className="w-5 h-5" />
              </button>

              <button
                onClick={() => startNewGame(true)}
                className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-yellow-300" /> Deal Strong
                Pair 发强牌
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Opponent Areas */}
            {opponentHands.map((hand, idx) => {
              const classes = getOpponentClasses(idx, opponentHands.length);
              return (
                <div key={`opp-group-${idx}`} className={classes}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-900 rounded-full flex items-center justify-center border-2 border-red-400 shadow-lg">
                      <User className="text-red-200 w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-red-200 font-bold text-xs sm:text-sm bg-black/30 px-2 py-0.5 rounded-full">
                      <span className="hidden sm:inline">Opp</span> {idx + 1}
                    </span>
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    {hand.map((card, cIdx) => (
                      <Card
                        key={`opp-${idx}-${cIdx}`}
                        card={card}
                        hidden={
                          stage !== GameStage.Showdown &&
                          stage !== GameStage.Analyzing &&
                          stage !== GameStage.Results
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Community Cards (Center) */}
            <div className="absolute top-[40%] sm:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 sm:gap-4 z-0">
              {board.map((card, idx) => (
                <div
                  key={card.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards"
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <Card
                    card={card}
                    small
                    className="w-[3.2rem] h-[4.8rem] sm:w-20 sm:h-28"
                  />
                </div>
              ))}
              {Array.from({ length: 5 - board.length }).map((_, idx) => (
                <div
                  key={`placeholder-${idx}`}
                  className="w-[3.2rem] h-[4.8rem] sm:w-20 sm:h-28 rounded-lg border-2 border-dashed border-white/10 bg-white/5"
                />
              ))}
            </div>

            {/* Player Area (Bottom) */}
            <div className="absolute bottom-28 sm:bottom-36 flex flex-col items-center gap-2 transition-all duration-500 z-10 scale-[0.8] sm:scale-100 origin-bottom">
              <div className="flex gap-2 sm:gap-4">
                {playerHand.map((card, idx) => (
                  <Card
                    key={`player-${idx}`}
                    card={card}
                    large
                    className="shadow-2xl"
                  />
                ))}
              </div>
              <span className="text-emerald-200 font-bold text-sm bg-black/30 px-3 py-1 rounded-full mt-2">
                You 你
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Bar */}
      {stage !== GameStage.Idle &&
        stage !== GameStage.Analyzing &&
        stage !== GameStage.Results &&
        stage !== GameStage.Showdown && (
          <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 bg-gray-900 border-t border-gray-800 p-2 sm:p-4 flex items-center justify-center gap-3 sm:gap-4 z-20">
            <button
              onClick={() => handleAction("fold")}
              className="px-6 sm:px-8 py-2 sm:py-3 bg-red-900/80 hover:bg-red-800 text-red-200 text-sm sm:text-base font-bold rounded-lg transition-colors border border-red-700/50"
            >
              Fold 弃牌
            </button>
            <button
              onClick={() => handleAction("check")}
              className="px-6 sm:px-8 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white text-sm sm:text-base font-bold rounded-lg transition-colors border border-gray-600"
            >
              Check 过牌
            </button>
            <button
              onClick={() => handleAction("bet")}
              className="px-8 sm:px-10 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-bold rounded-lg transition-colors border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-900/50 flex flex-col items-center justify-center leading-none"
            >
              <span>BET 下注</span>
            </button>
          </div>
        )}

      {stage === GameStage.Analyzing && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 sm:p-8 rounded-2xl border border-emerald-500/30 flex flex-col items-center gap-4 animate-pulse">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 animate-spin" />
            <p className="text-emerald-400 font-mono text-sm sm:text-base">
              Calculating Odds... 计算概率中...
            </p>
          </div>
        </div>
      )}

      {stage === GameStage.Results && (
        <AnalysisModal
          analysis={analysis}
          playerHand={playerHand}
          opponentHands={opponentHands}
          board={board}
          onClose={startNewGame}
          onHome={quitGame}
        />
      )}

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 w-11/12 sm:w-auto text-sm sm:text-base">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline opacity-80 hover:opacity-100 whitespace-nowrap"
          >
            Dismiss 关闭
          </button>
        </div>
      )}
    </div>
  );
};

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default App;
