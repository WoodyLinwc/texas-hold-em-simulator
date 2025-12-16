import React, { useState } from 'react';
import { HandAnalysis, Card as CardType } from '../types';
import { X, Trophy, AlertCircle, ArrowRight, Users, Sparkles, Home } from 'lucide-react';
import Card from './Card';

interface AnalysisModalProps {
  analysis: HandAnalysis | null;
  playerHand: CardType[];
  opponentHands: CardType[][];
  board: CardType[];
  onClose: (forceStrong: boolean) => void;
  onHome: () => void;
}

type TabStage = 'preflop' | 'flop' | 'turn' | 'river';

const AnalysisModal: React.FC<AnalysisModalProps> = ({ analysis, playerHand, opponentHands, board, onClose, onHome }) => {
  if (!analysis) return null;

  // Determine initial tab based on board length (usually river since we run it twice/complete board now)
  const initialTab: TabStage = board.length === 5 ? 'river' : board.length === 4 ? 'turn' : board.length >= 3 ? 'flop' : 'preflop';
  const [activeTab, setActiveTab] = useState<TabStage>(initialTab);

  const getEquity = (stage: TabStage) => analysis.equities[stage];
  
  const getVisibleBoard = (stage: TabStage) => {
    switch (stage) {
      case 'preflop': return [];
      case 'flop': return board.slice(0, 3);
      case 'turn': return board.slice(0, 4);
      case 'river': return board.slice(0, 5);
    }
  };

  const getIsStageAvailable = (stage: TabStage) => {
    switch (stage) {
      case 'preflop': return true;
      case 'flop': return board.length >= 3;
      case 'turn': return board.length >= 4;
      case 'river': return board.length >= 5;
    }
  };

  const visibleBoard = getVisibleBoard(activeTab);
  const currentEquity = getEquity(activeTab);
  const isStageAvailable = getIsStageAvailable(activeTab);

  const TabButton = ({ stage, label }: { stage: TabStage, label: string }) => {
    const isActive = activeTab === stage;
    const available = getIsStageAvailable(stage);

    return (
      <button
        onClick={() => available && setActiveTab(stage)}
        disabled={!available}
        className={`
          flex-1 py-3 px-2 text-sm sm:text-base font-medium transition-all relative
          ${isActive ? 'text-emerald-400 bg-gray-800' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}
          ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {label}
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        )}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-950">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className={analysis.winner === 'Player' ? "text-yellow-400" : "text-gray-400"} />
              {analysis.winner === 'Player' ? 'You Won!' : analysis.winner.startsWith('Opponent') ? `${analysis.winner} Won` : 'Split Pot'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{analysis.winningHandDescription}</p>
          </div>
          <button onClick={() => onClose(false)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <X className="text-gray-400" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-950/50">
          <TabButton stage="preflop" label="Pre-Flop" />
          <TabButton stage="flop" label="Flop" />
          <TabButton stage="turn" label="Turn" />
          <TabButton stage="river" label="River" />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8 bg-gray-900">
          
          {/* Stats Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Left: Win Rate Indicator */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 flex flex-col items-center justify-center text-center gap-2 h-full">
              <h3 className="text-gray-400 uppercase text-xs font-semibold tracking-wider">Your Win Probability</h3>
              {isStageAvailable ? (
                <div className="flex items-baseline justify-center gap-1 text-emerald-400 drop-shadow-lg">
                  <span className="text-6xl font-bold">{currentEquity}</span>
                  <span className="text-2xl font-medium text-emerald-600">%</span>
                </div>
              ) : (
                <div className="text-gray-500 italic text-lg py-4">Stage not reached</div>
              )}
              {isStageAvailable && (
                 <div className="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${currentEquity}%` }}
                    />
                 </div>
              )}
            </div>

            {/* Right: Board State Visual */}
            <div className="flex flex-col items-center justify-center gap-4 min-h-[160px]">
               <h3 className="text-gray-400 uppercase text-xs font-semibold tracking-wider">Board at this Stage</h3>
               <div className="flex gap-2 justify-center">
                 {visibleBoard.length > 0 ? (
                   visibleBoard.map((card, i) => (
                     <div key={card.id} className="transform scale-90 sm:scale-100">
                       <Card card={card} />
                     </div>
                   ))
                 ) : (
                   <div className="h-24 sm:h-28 flex items-center justify-center text-gray-600 border-2 border-dashed border-gray-800 rounded-lg w-full px-8">
                      No community cards yet
                   </div>
                 )}
               </div>
            </div>

          </div>

          {/* Hands Comparison */}
          <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/30">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" /> 
              Final Hands
            </h3>
            
            <div className="flex flex-col gap-6">
               {/* Player */}
               <div className={`flex items-center gap-4 p-3 rounded-lg ${analysis.winner === 'Player' ? 'bg-emerald-900/30 border border-emerald-800' : ''}`}>
                  <div className="flex gap-2 shrink-0">
                    {playerHand.map((c, i) => <Card key={i} card={c} className="scale-75 origin-left w-12 h-16 sm:w-16 sm:h-24" />)}
                  </div>
                  <div>
                      <div className="text-emerald-400 font-bold text-lg">You</div>
                      <div className="text-sm text-gray-400">{analysis.playerHandDescription}</div>
                  </div>
                  {analysis.winner === 'Player' && <Trophy className="ml-auto text-yellow-400 w-6 h-6" />}
               </div>

               {/* Opponents */}
               {opponentHands.map((hand, idx) => {
                   const oppName = `Opponent ${idx + 1}`;
                   const isWinner = analysis.winner === oppName || analysis.winner === 'Split' && analysis.winningHandDescription === analysis.opponentHandDescriptions[idx]; // Approximate check for split
                   return (
                    <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg ${isWinner ? 'bg-red-900/30 border border-red-800' : ''}`}>
                        <div className="flex gap-2 shrink-0">
                            {hand.map((c, i) => <Card key={i} card={c} className="scale-75 origin-left w-12 h-16 sm:w-16 sm:h-24" />)}
                        </div>
                        <div>
                            <div className="text-red-400 font-bold text-lg">{oppName}</div>
                            <div className="text-sm text-gray-400">{analysis.opponentHandDescriptions[idx]}</div>
                        </div>
                        {isWinner && <Trophy className="ml-auto text-yellow-400 w-6 h-6" />}
                    </div>
                   );
               })}
            </div>
          </div>
          
           {/* Commentary */}
           <div className="flex items-start gap-3 text-gray-400 text-sm bg-gray-950 p-4 rounded-lg border border-gray-800">
              <AlertCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
              <p>"{analysis.commentary}"</p>
           </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button 
             onClick={onHome}
             className="text-gray-400 hover:text-white font-medium flex items-center gap-2 transition-colors px-2 py-2"
          >
             <Home className="w-4 h-4" /> Back to Menu
          </button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
                onClick={() => onClose(true)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 order-2 sm:order-1"
            >
                <Sparkles className="w-4 h-4 text-yellow-300" /> Deal Strong Pair
            </button>

            <button 
                onClick={() => onClose(false)}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 order-1 sm:order-2"
            >
                Play Next Hand <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisModal;