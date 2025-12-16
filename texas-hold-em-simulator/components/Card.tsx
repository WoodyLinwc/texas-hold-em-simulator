import React from 'react';
import { Card as CardType, Suit } from '../types';

interface CardProps {
  card?: CardType; // If undefined, renders a card back
  hidden?: boolean;
  className?: string;
  large?: boolean;
  small?: boolean;
}

const Card: React.FC<CardProps> = ({ card, hidden, className = "", large = false, small = false }) => {
  // Adjust sizing classes based on props
  // We allow className to override width/height but we provide defaults
  
  // Default dimensions if not overridden by className
  const defaultDims = large 
    ? 'w-24 h-36' 
    : small 
      ? 'w-[3.2rem] h-[4.8rem]' 
      : 'w-16 h-24 sm:w-20 sm:h-28';

  const padding = large ? 'p-2' : small ? 'p-[2px]' : 'p-1';
  
  // Combine defaults with passed className
  // If className has width/height, it will override these due to CSS specificity or order if using Tailwind merge (which we aren't, but usually it works if passed later in class list)
  // However, here we construct the class string.
  
  if (hidden || !card) {
    return (
      <div className={`relative ${defaultDims} bg-blue-800 rounded-lg border-2 border-white shadow-lg flex items-center justify-center overflow-hidden ${className}`}>
        <div className="absolute inset-1 border border-blue-600 rounded opacity-50 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
        <div className={`rounded-full bg-blue-900 border-2 border-blue-400 flex items-center justify-center ${small ? 'w-8 h-8' : 'w-12 h-12'}`}>
          <span className={`text-blue-400 font-bold ${small ? 'text-sm' : 'text-xl'}`}>♠</span>
        </div>
      </div>
    );
  }

  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  
  // Typography sizing
  const rankSize = large 
    ? 'text-3xl' 
    : small 
      ? 'text-sm font-bold' 
      : 'text-lg sm:text-xl';

  const smallSuitSize = large 
    ? 'text-xl' 
    : small 
      ? 'text-[0.6rem]' 
      : 'text-xs sm:text-sm';

  const centerSuitSize = large 
    ? 'text-6xl' 
    : small 
      ? 'text-2xl' 
      : 'text-4xl sm:text-5xl';

  return (
    <div className={`relative ${defaultDims} ${padding} bg-white rounded-lg shadow-xl flex flex-col items-center justify-between select-none transform transition-transform hover:-translate-y-1 overflow-hidden ${className}`}>
      {/* Top Left Corner */}
      <div className={`self-start flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-gray-900'} card-font`}>
        <div className={`${rankSize} font-bold`}>{card.rank}</div>
        <div className={smallSuitSize}>{card.suit}</div>
      </div>
      
      {/* Center Suit (Absolute) */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${centerSuitSize} ${isRed ? 'text-red-600' : 'text-gray-900'} pointer-events-none`}>
        {card.suit}
      </div>

      {/* Bottom Right Corner */}
      <div className={`self-end flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'} card-font`}>
        <div className={`${rankSize} font-bold`}>{card.rank}</div>
        <div className={smallSuitSize}>{card.suit}</div>
      </div>
    </div>
  );
};

export default Card;