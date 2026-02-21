import React from 'react';
import { motion } from 'motion/react';
import { CarConfig, BodyStyle } from '../types';

interface GarageDisplayProps {
  config: CarConfig;
}

export function GarageDisplay({ config }: GarageDisplayProps) {
  // SVG Paths for different body styles - More realistic silhouettes
  const getBodyPath = (style: BodyStyle) => {
    switch (style) {
      case 'wedge':
        // Rounded nose, chamfered rear
        return "M 30,60 L 280,60 L 280,20 L 270,20 L 30,55 Q 20,56 30,60 Z"; 
      case 'block':
        // Rounded corners
        return "M 25,60 L 275,60 Q 280,60 280,55 L 280,25 Q 280,20 275,20 L 25,20 Q 20,20 20,25 L 20,55 Q 20,60 25,60 Z";
      case 'bullet':
        // Aerodynamic curve
        return "M 40,60 L 280,60 L 280,20 L 270,20 Q 150,20 40,50 Q 30,55 40,60 Z";
      case 'shark':
        // Detailed fin and nose
        return "M 30,60 L 280,60 L 280,25 L 160,25 L 120,5 L 100,25 L 30,55 Q 20,56 30,60 Z";
      default:
        return "M 30,60 L 280,60 L 280,20 L 30,60 Z";
    }
  };

  return (
    <div className="flex-1 h-full bg-gradient-to-b from-gray-50 to-gray-200 flex flex-col items-center justify-center overflow-hidden relative rounded-xl border border-gray-200 shadow-inner">
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <motion.div
        className="relative w-full max-w-3xl aspect-[2/1] flex items-center justify-center"
        animate={{ 
          y: [0, -8, 0],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <svg viewBox="0 0 320 160" className="w-full h-full drop-shadow-xl overflow-visible">
          <defs>
            <linearGradient id="bodyHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="40%" stopColor="white" stopOpacity="0.1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bodyShadow" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="black" stopOpacity="0.3" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="wheelRim" cx="50%" cy="50%" r="50%">
              <stop offset="40%" stopColor="#e5e7eb" />
              <stop offset="90%" stopColor="#9ca3af" />
              <stop offset="100%" stopColor="#4b5563" />
            </radialGradient>
            <filter id="groundShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
            </filter>
          </defs>

          {/* Ground Shadow */}
          <ellipse cx="160" cy="115" rx="140" ry="12" fill="black" opacity="0.2" filter="url(#groundShadow)" />

          <g transform="translate(10, 40)">
            {/* Main Body Color */}
            <path
              d={getBodyPath(config.bodyStyle)}
              fill={config.color}
              stroke="#1f2937"
              strokeWidth="1.5"
            />

            {/* Body Highlight (Top) */}
            <path
              d={getBodyPath(config.bodyStyle)}
              fill="url(#bodyHighlight)"
              style={{ mixBlendMode: 'overlay' }}
            />

            {/* Body Shadow (Bottom) */}
            <path
              d={getBodyPath(config.bodyStyle)}
              fill="url(#bodyShadow)"
              style={{ mixBlendMode: 'multiply' }}
            />

            {/* Stickers */}
            {config.stickers.map((sticker, i) => {
              let content = '';
              if (sticker === 'flames') content = '🔥';
              if (sticker === 'lightning') content = '⚡';
              if (sticker === 'star') content = '⭐';
              if (sticker === 'skull') content = '💀';
              if (sticker === 'flag') content = '🏁';
              if (sticker === 'number') content = '1️⃣';
              
              const x = 60 + (i * 45) % 200;
              const y = 45; 

              return (
                <text
                  key={i}
                  x={x}
                  y={y}
                  fontSize="22"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.3))' }}
                >
                  {content}
                </text>
              );
            })}

            {/* Wheels */}
            {[60, 240].map((cx, i) => (
              <g key={i} transform={`translate(${cx}, 60)`}>
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  {/* Tire */}
                  <circle cx="0" cy="0" r="20" fill="#1f2937" stroke="#000" strokeWidth="1" />
                  {/* Rim */}
                  <circle cx="0" cy="0" r="12" fill="url(#wheelRim)" stroke="#4b5563" strokeWidth="0.5" />
                  {/* Hub Detail */}
                  <circle cx="0" cy="0" r="3" fill="#374151" />
                  {/* Spokes/Detail */}
                  <line x1="-12" y1="0" x2="12" y2="0" stroke="#6b7280" strokeWidth="1" opacity="0.5" />
                  <line x1="0" y1="-12" x2="0" y2="12" stroke="#6b7280" strokeWidth="1" opacity="0.5" />
                </motion.g>
              </g>
            ))}
          </g>
        </svg>
      </motion.div>
      
      <div className="absolute bottom-6 flex flex-col items-center space-y-1">
        <div className="text-gray-400 text-xs font-mono uppercase tracking-widest">
          Garage Mode
        </div>
        <div className="text-gray-300 text-[10px] font-sans">
          {config.name} • {config.totalWeightOz}oz • {config.bodyStyle.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
