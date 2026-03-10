import React from 'react';
import { motion } from 'motion/react';
import { Palette, Sparkles, Trash2, Antenna, Glasses, Zap, ChevronRight, Crown, Headphones, Wind } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Robot } from './Robot';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RobotCustomizerProps {
  robotColor: string;
  setRobotColor: (color: string) => void;
  robotAccessory: string | null;
  setRobotAccessory: (acc: string | null) => void;
  onStart: () => void;
}

export const RobotCustomizer: React.FC<RobotCustomizerProps> = ({
  robotColor,
  setRobotColor,
  robotAccessory,
  setRobotAccessory,
  onStart
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[40px] border border-slate-200 shadow-xl p-12 w-full flex flex-col items-center gap-12"
      >
        <div className="text-center space-y-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Meet Your Robo!</h2>
          <p className="text-slate-500 font-medium">Customize your partner for the coding adventure.</p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500" />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Robot size="lg" color={robotColor} accessory={robotAccessory} />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Palette className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-800">Body Color</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['bg-blue-600', 'bg-rose-600', 'bg-emerald-600', 'bg-amber-500', 'bg-purple-600', 'bg-slate-800', 'bg-pink-400', 'bg-cyan-500'].map(color => (
                <button
                  key={color}
                  onClick={() => setRobotColor(color)}
                  className={cn(
                    "h-12 rounded-2xl transition-all ring-offset-4",
                    color,
                    robotColor === color ? "ring-4 ring-blue-400 scale-110 shadow-lg" : "hover:scale-105 opacity-80 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-800">Accessories</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: null, icon: <Trash2 className="w-5 h-5" />, label: 'None' },
                { id: 'antenna', icon: <Antenna className="w-5 h-5" />, label: 'Antenna' },
                { id: 'glasses', icon: <Glasses className="w-5 h-5" />, label: 'Glasses' },
                { id: 'bowtie', icon: <Zap className="w-5 h-5" />, label: 'Bowtie' },
                { id: 'crown', icon: <Crown className="w-5 h-5" />, label: 'Crown' },
                { id: 'headphones', icon: <Headphones className="w-5 h-5" />, label: 'Music' },
                { id: 'cape', icon: <Wind className="w-5 h-5" />, label: 'Cape' },
              ].map(acc => (
                <button
                  key={acc.label}
                  onClick={() => setRobotAccessory(acc.id)}
                  className={cn(
                    "h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                    robotAccessory === acc.id 
                      ? "bg-blue-50 border-blue-500 text-blue-600 shadow-md" 
                      : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  {acc.icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-5 bg-blue-600 text-white rounded-3xl text-xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
        >
          Start Adventure
          <ChevronRight className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );
};
