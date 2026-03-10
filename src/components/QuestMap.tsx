import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, ArrowLeft } from 'lucide-react';
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
  return (
    <div className="flex-1 flex flex-col items-center p-12 max-w-6xl mx-auto w-full">
      <div className="text-center mb-16 space-y-4">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">The Coding Quest</h2>
        <p className="text-xl text-slate-500 font-medium">Unlock levels and master the art of debugging!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {levels.map((level, idx) => {
          const isUnlocked = unlockedLevels.includes(level.id);
          const isCompleted = unlockedLevels.includes(level.id + 1);

          return (
            <motion.button
              key={level.id}
              whileHover={isUnlocked ? { scale: 1.02, y: -5 } : {}}
              onClick={() => {
                if (isUnlocked) {
                  onSelectLevel(idx);
                }
              }}
              className={cn(
                "relative p-8 rounded-[32px] border-4 transition-all text-left flex flex-col gap-6 h-64",
                isUnlocked 
                  ? "bg-white border-slate-100 shadow-xl hover:shadow-2xl hover:border-blue-200" 
                  : "bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black",
                  isUnlocked ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                )}>
                  {level.id}
                </div>
                {isCompleted ? (
                  <div className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                ) : !isUnlocked ? (
                  <div className="text-slate-400">
                    <Lock className="w-6 h-6" />
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Level {level.id}</h3>
                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{level.description}</p>
                {highScores[level.id] !== undefined && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Best: {highScores[level.id]}</span>
                  </div>
                )}
              </div>

              {!isUnlocked && (
                <div className="mt-auto text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Locked
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="mt-16 flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Customization
      </button>
    </div>
  );
};
