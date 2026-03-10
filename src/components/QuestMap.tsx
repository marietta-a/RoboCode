import React, { useMemo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, ArrowLeft, Star, Trophy, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GameLevel } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QuestMapProps {
  levels: GameLevel[];
  unlockedLevels: number[];
  highScores: Record<number, number>;
  onSelectLevel: (idx: number) => void;
  onBack: () => void;
}

export const QuestMap: React.FC<QuestMapProps> = ({
  levels,
  unlockedLevels,
  highScores,
  onSelectLevel,
  onBack
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Calculate positions for a winding path
  const levelPositions = useMemo(() => {
    const totalLevels = levels.length;
    return levels.map((_, i) => {
      // Create a winding S-shape
      // x oscillates between -120 and 120
      const x = Math.sin(i * 0.8) * 120;
      // Reverse y so Level 1 (i=0) is at the bottom
      const y = (totalLevels - 1 - i) * 140;
      return { x, y };
    });
  }, [levels]);

  // Scroll to current level on mount
  useEffect(() => {
    const currentLevelId = Math.max(...unlockedLevels);
    const currentIdx = levels.findIndex(l => l.id === currentLevelId);
    if (currentIdx !== -1 && scrollContainerRef.current) {
      const pos = levelPositions[currentIdx];
      // Center the level in the viewport
      const scrollY = pos.y + 140 - scrollContainerRef.current.clientHeight / 2;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, scrollY),
        behavior: 'smooth'
      });
    }
  }, [unlockedLevels, levels, levelPositions]);

  // Generate SVG path data
  const pathData = useMemo(() => {
    if (levelPositions.length < 2) return "";
    let d = `M ${levelPositions[0].x + 200} ${levelPositions[0].y + 50}`;
    for (let i = 1; i < levelPositions.length; i++) {
      const prev = levelPositions[i - 1];
      const curr = levelPositions[i];
      // Use quadratic curves for smoothness
      const cpX = (prev.x + curr.x) / 2 + 200;
      const cpY = (prev.y + curr.y) / 2 + 50;
      d += ` Q ${prev.x + 200} ${curr.y + 50}, ${curr.x + 200} ${curr.y + 50}`;
    }
    return d;
  }, [levelPositions]);

  return (
    <div className="flex flex-col w-full h-screen bg-gradient-to-b from-[#87CEEB] via-[#E0F2FE] to-[#BAE6FD] overflow-hidden">
      {/* Header - Static */}
      <div className="flex-none z-50 w-full bg-white/90 backdrop-blur-md border-b border-blue-200 p-4 flex items-center justify-between px-8 shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-full transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Menu</span>
        </button>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-black text-blue-900 tracking-tight drop-shadow-sm">ROBO ADVENTURE</h2>
          <div className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">The Coding Quest</div>
        </div>
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-5 py-2 rounded-full font-black shadow-lg border-2 border-white/20">
          <Trophy className="w-5 h-5" />
          <span>{Object.keys(highScores).length} / {levels.length}</span>
        </div>
      </div>

      {/* Scrollable Map Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden relative pb-48"
      >
        <div className="flex flex-col items-center w-full">
          <div className="relative mt-24 mb-24" style={{ height: levelPositions.length * 140 + 100 }}>
            {/* Path SVG */}
            <svg 
              className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none" 
              width="400" 
              height={levelPositions.length * 140 + 100}
              style={{ overflow: 'visible' }}
            >
              {/* Shadow path */}
              <path
                d={pathData}
                fill="none"
                stroke="rgba(0,0,0,0.05)"
                strokeWidth="24"
                strokeLinecap="round"
              />
              {/* Main path */}
              <path
                d={pathData}
                fill="none"
                stroke="white"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Dotted indicator */}
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray="1 15"
              />
            </svg>

            {/* Level Nodes */}
            <div className="relative left-1/2 -translate-x-1/2 w-[400px]">
              {/* Start Label */}
              <div 
                className="absolute text-blue-900 font-black text-xl tracking-widest uppercase opacity-40"
                style={{ 
                  left: levelPositions[0].x + 200 - 30,
                  top: levelPositions[0].y + 100
                }}
              >
                Start
              </div>

              {/* Finish Label */}
              <div 
                className="absolute text-blue-900 font-black text-xl tracking-widest uppercase opacity-40"
                style={{ 
                  left: levelPositions[levels.length - 1].x + 200 - 35,
                  top: levelPositions[levels.length - 1].y - 60
                }}
              >
                Finish
              </div>

              {levels.map((level, idx) => {
                const pos = levelPositions[idx];
                const isUnlocked = unlockedLevels.includes(level.id);
                const isCompleted = unlockedLevels.includes(level.id + 1);
                const isCurrent = isUnlocked && !isCompleted;

                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{ 
                      position: 'absolute',
                      left: pos.x + 200 - 40, // Center on path
                      top: pos.y,
                    }}
                    className="z-10"
                  >
                    <div className="relative group">
                      {/* Tooltip on hover */}
                      {isUnlocked && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <div className="bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-xl whitespace-nowrap shadow-xl">
                            {level.description}
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
                        </div>
                      )}

                      <motion.button
                        whileHover={isUnlocked ? { scale: 1.1, rotate: 5 } : {}}
                        whileTap={isUnlocked ? { scale: 0.9 } : {}}
                        onClick={() => isUnlocked && onSelectLevel(idx)}
                        className={cn(
                          "w-24 h-24 rounded-[32px] flex items-center justify-center text-3xl font-black shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-4 transition-all relative",
                          isUnlocked 
                            ? isCurrent 
                              ? "bg-gradient-to-br from-blue-400 to-blue-600 border-white text-white ring-8 ring-blue-400/20 shadow-[0_8px_0_0_#1e40af]" 
                              : "bg-gradient-to-br from-white to-blue-50 border-white text-blue-600 hover:from-blue-50 hover:to-blue-100 shadow-[0_8px_0_0_#d1d5db]"
                            : "bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed shadow-none"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        ) : !isUnlocked ? (
                          <Lock className="w-8 h-8" />
                        ) : (
                          <span className="drop-shadow-md">{level.id}</span>
                        )}

                        {/* Stars based on high score (mock logic for visual) */}
                        {isCompleted && (
                          <div className="absolute -top-2 -right-2 flex gap-0.5">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          </div>
                        )}

                        {/* Current level indicator */}
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -inset-4 rounded-full border-4 border-blue-400 pointer-events-none"
                          />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(15)].map((_, i) => {
          const Icon = [Star, Trophy, CheckCircle2, Sparkles][i % 4];
          const color = ['text-yellow-400', 'text-blue-400', 'text-pink-400', 'text-emerald-400'][i % 4];
          return (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -40, 0],
                x: [0, 20, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 8 + Math.random() * 8,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              className={cn("absolute", color)}
              style={{ 
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }}
            >
              <Icon className="w-6 h-6 fill-current" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
