import React from 'react';
import { ChevronRight, Bug, Antenna, Glasses, Zap, Crown, Headphones, Wind } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';
import { RobotState } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RobotProps {
  size?: 'sm' | 'md' | 'lg';
  state?: RobotState | null;
  color: string;
  accessory: string | null;
  className?: string;
}

export const Robot: React.FC<RobotProps> = ({ 
  size = 'md', 
  state = null, 
  color, 
  accessory,
  className 
}) => {
  const displayColor = state?.status === 'CRASHED' ? 'bg-rose-500' : 
                      state?.status === 'SUCCESS' ? 'bg-emerald-500' : color;
  
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-24 h-24 rounded-3xl'
  };

  const iconSize = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-12 h-12'
  };

  const actionVariants = {
    idle: { y: 0, rotate: 0, scale: 1 },
    walking: {
      y: [0, -4, 0],
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.4, repeat: Infinity }
    },
    jumping: {
      y: [0, -15, 0],
      scale: [1, 1.1, 1],
      transition: { duration: 0.5 }
    },
    spinning: {
      rotate: [0, 360],
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      variants={actionVariants}
      animate={state?.currentAction || 'idle'}
      className={cn(
        sizeClasses[size],
        "flex items-center justify-center text-white shadow-lg transition-colors relative",
        displayColor,
        className
      )}
    >
      {state?.status === 'CRASHED' ? <Bug className={iconSize[size]} /> : <ChevronRight className={iconSize[size]} />}
      
      {/* Accessories */}
      {accessory === 'antenna' && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 text-slate-600", size === 'lg' ? "-top-8" : "-top-3")}>
          <Antenna className={size === 'lg' ? "w-10 h-10" : "w-4 h-4"} />
        </div>
      )}
      {accessory === 'glasses' && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 text-white/80", size === 'lg' ? "top-4" : "top-1")}>
          <Glasses className={size === 'lg' ? "w-14 h-14" : "w-5 h-5"} />
        </div>
      )}
      {accessory === 'bowtie' && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 text-rose-400", size === 'lg' ? "-bottom-4" : "-bottom-1")}>
          <Zap className={cn("rotate-180 fill-current", size === 'lg' ? "w-8 h-8" : "w-3 h-3")} />
        </div>
      )}
      {accessory === 'crown' && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 text-amber-400", size === 'lg' ? "-top-10" : "-top-4")}>
          <Crown className={cn("fill-current", size === 'lg' ? "w-12 h-12" : "w-5 h-5")} />
        </div>
      )}
      {accessory === 'headphones' && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 text-slate-800", size === 'lg' ? "-top-2" : "-top-1")}>
          <Headphones className={size === 'lg' ? "w-16 h-16" : "w-7 h-7"} />
        </div>
      )}
      {accessory === 'cape' && (
        <div className={cn("absolute left-1/2 -translate-x-1/2 text-rose-500 opacity-80", size === 'lg' ? "top-4 -z-10" : "top-1 -z-10")}>
          <Wind className={cn("fill-current", size === 'lg' ? "w-20 h-20" : "w-8 h-8")} />
        </div>
      )}
    </motion.div>
  );
};
