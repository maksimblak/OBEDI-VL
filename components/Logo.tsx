
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'footer';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'default' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Container */}
      <div className="relative w-11 h-11 flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
        <svg 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
        >
          <defs>
            {/* Main Body Gradient: Purple to Pink */}
            <linearGradient id="bagGradient" x1="14" y1="6" x2="14" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" /> {/* Indigo-400 */}
              <stop offset="40%" stopColor="#c084fc" /> {/* Purple-400 */}
              <stop offset="100%" stopColor="#e879f9" /> {/* Fuchsia-400 */}
            </linearGradient>
            
            {/* Side Depth Gradient: Darker Purple */}
            <linearGradient id="sideGradient" x1="24" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
               <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo-600 */}
               <stop offset="100%" stopColor="#7e22ce" /> {/* Purple-700 */}
            </linearGradient>

            {/* Inner Fold Gradient */}
            <linearGradient id="foldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6b21a8" />
            </linearGradient>
          </defs>

          {/* Bag Side (Perspective depth) */}
          <path 
            d="M23 9.5 L23 25.5 L28 23.5 L28 7.5 L23 9.5Z" 
            fill="url(#sideGradient)" 
          />

          {/* Bag Front Body */}
          <path 
            d="M4 9.5 L4 26 C4 27.1 4.9 28 6 28 H23 V9.5 H4Z" 
            fill="url(#bagGradient)" 
          />

          {/* Top Jagged Line (Paper Effect) */}
          {/* This path draws the wavy top of the bag */}
          <path 
            d="M4 9.5 L6.5 7 L9 9.5 L11.5 7 L14 9.5 L16.5 7 L19 9.5 L21.5 7 L23 9.5 L25.5 7 L28 8" 
            stroke="#f0abfc" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
            className="drop-shadow-sm"
          />

          {/* Highlight line for volume */}
          <path 
            d="M4.5 10 H22.5" 
            stroke="white" 
            strokeOpacity="0.2" 
            strokeWidth="0.5" 
          />

          {/* Vertical crease line */}
          <path 
            d="M23 28 L28 23.5" 
            stroke="white" 
            strokeOpacity="0.1" 
            strokeWidth="0.5" 
          />

        </svg>
      </div>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-widest text-xl uppercase ${
          variant === 'footer' ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400'
        }`}>
          ОБЕДЫ-VL
        </span>
      </div>
    </div>
  );
};
