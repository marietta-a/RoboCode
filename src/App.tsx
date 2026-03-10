/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowUp, 
  RotateCw, 
  RotateCcw as RotateLeftIcon, 
  Package, 
  Repeat, 
  Code2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  Info,
  Bug,
  Zap,
  Palette,
  Antenna,
  Glasses,
  User,
  Map as MapIcon,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  Command, 
  CommandType, 
  RobotState, 
  Direction, 
  GameLevel,
  GamePhase
} from './types';
import { LevelManager } from './levels';
import { RobotCustomizer } from './components/RobotCustomizer';
import { QuestMap } from './components/QuestMap';
import { GamePlay } from './components/GamePlay';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const LEVELS = LevelManager.getLevels();

const COMMAND_DEFS: { type: CommandType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'MOVE', label: 'Move Forward', icon: <ArrowUp className="w-4 h-4" />, color: 'bg-blue-500' },
  { type: 'TURN_LEFT', label: 'Turn Left', icon: <RotateLeftIcon className="w-4 h-4" />, color: 'bg-indigo-500' },
  { type: 'TURN_RIGHT', label: 'Turn Right', icon: <RotateCw className="w-4 h-4" />, color: 'bg-indigo-500' },
  { type: 'PICKUP', label: 'Pick Up', icon: <Package className="w-4 h-4" />, color: 'bg-amber-500' },
  { type: 'REPEAT', label: 'Repeat', icon: <Repeat className="w-4 h-4" />, color: 'bg-purple-500' },
  { type: 'CALL_FUNCTION', label: 'Do "The Dance"', icon: <Zap className="w-4 h-4" />, color: 'bg-pink-500' },
];

const BIOMES = [
  { color: 'bg-purple-900/20', label: 'Cosmic Core', icon: '🚀', seed: 'space' },
  { color: 'bg-indigo-500/10', label: 'Cloud Peaks', icon: '☁️', seed: 'mountain' },
  { color: 'bg-amber-500/10', label: 'Silicon Desert', icon: '🏜️', seed: 'desert' },
  { color: 'bg-blue-500/10', label: 'Data Ocean', icon: '🌊', seed: 'ocean' },
  { color: 'bg-emerald-500/10', label: 'Circuit Jungle', icon: '🌿', seed: 'jungle' },
];

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('QUEST_MAP');
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [levelIdx, setLevelIdx] = useState(0);
  const currentLevel = LEVELS[levelIdx];
  
  const currentBiome = BIOMES[Math.floor((LEVELS.length - 1 - levelIdx) / 10)];

  const [robotColor, setRobotColor] = useState('bg-blue-600');
  const [robotAccessory, setRobotAccessory] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [highScores, setHighScores] = useState<Record<number, number>>({});
  const [functions, setFunctions] = useState<Record<string, Command[]>>({
    'The Dance': [
      { id: 'f1', type: 'TURN_LEFT' },
      { id: 'f2', type: 'TURN_RIGHT' },
      { id: 'f3', type: 'TURN_LEFT' },
      { id: 'f4', type: 'TURN_RIGHT' },
    ]
  });
  const [editingFunction, setEditingFunction] = useState<string | null>(null);

  // Fetch progress on mount
  useEffect(() => {
    fetch('/api/progress')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setUnlockedLevels(data.unlocked_levels || [1]);
          setRobotColor(data.robot_color || 'bg-blue-600');
          setRobotAccessory(data.robot_accessory || null);
          setTotalScore(data.total_score || 0);
          if (data.custom_functions && Object.keys(data.custom_functions).length > 0) {
            setFunctions(data.custom_functions);
          }
          
          const scores: Record<number, number> = {};
          data.high_scores?.forEach((s: any) => {
            scores[s.level_id] = s.score;
          });
          setHighScores(scores);
        }
      })
      .catch(err => console.error("Failed to fetch progress:", err));
  }, []);

  // Save progress when it changes
  useEffect(() => {
    const saveProgress = async () => {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unlocked_levels: unlockedLevels,
            robot_color: robotColor,
            robot_accessory: robotAccessory,
            total_score: totalScore,
            custom_functions: functions
          })
        });
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    };

    // Debounce save
    const timer = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timer);
  }, [unlockedLevels, robotColor, robotAccessory, totalScore, functions]);

  const [robot, setRobot] = useState<RobotState>({
    x: currentLevel.startPos.x,
    y: currentLevel.startPos.y,
    direction: currentLevel.startDir,
    inventory: [],
    status: 'IDLE',
    message: 'Ready to code!'
  });

  const [program, setProgram] = useState<Command[]>([]);
  const [activeContainerId, setActiveContainerId] = useState<string | null>(null);
  const runIdRef = useRef(0);

  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const isPaused = phase === 'PAUSED';
  const pauseRef = useRef(false);

  useEffect(() => {
    pauseRef.current = isPaused;
  }, [isPaused]);

  // Sound Effects using Web Audio API
  const playSound = useCallback((type: 'action' | 'error' | 'success' | 'pickup' | 'start' | 'click') => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'action') {
      // Mechanical step sound
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'pickup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      // Simple major triad chime
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(freq, now + i * 0.1);
        g.gain.setValueAtTime(0.1, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        o.start(now + i * 0.1);
        o.stop(now + i * 0.1 + 0.3);
      });
    } else if (type === 'start') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }, []);

  const resetRobot = useCallback(() => {
    runIdRef.current += 1;
    setIsExecuting(false);
    setRobot({
      x: currentLevel.startPos.x,
      y: currentLevel.startPos.y,
      direction: currentLevel.startDir,
      inventory: [],
      status: 'IDLE',
      message: 'Ready to code!'
    });
    setActiveCommandId(null);
    setScore(0);
  }, [currentLevel]);

  useEffect(() => {
    resetRobot();
  }, [levelIdx, resetRobot]);

  const addCommand = (type: CommandType, funcName?: string) => {
    if (isExecuting) return;
    playSound('click');
    const newCommand: Command = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: type === 'REPEAT' ? 2 : (type === 'CALL_FUNCTION' ? (funcName || 'The Dance') : undefined),
      nestedCommands: type === 'REPEAT' ? [] : undefined
    };

    if (editingFunction) {
      setFunctions(prev => {
        const currentFuncProg = prev[editingFunction] || [];
        if (activeContainerId) {
          const updateNested = (cmds: Command[]): Command[] => {
            return cmds.map(c => {
              if (c.id === activeContainerId) {
                return { ...c, nestedCommands: [...(c.nestedCommands || []), newCommand] };
              }
              if (c.nestedCommands) {
                return { ...c, nestedCommands: updateNested(c.nestedCommands) };
              }
              return c;
            });
          };
          return { ...prev, [editingFunction]: updateNested(currentFuncProg) };
        } else {
          return { ...prev, [editingFunction]: [...currentFuncProg, newCommand] };
        }
      });
    } else {
      if (activeContainerId) {
        setProgram(prev => {
          const updateNested = (cmds: Command[]): Command[] => {
            return cmds.map(c => {
              if (c.id === activeContainerId) {
                return { ...c, nestedCommands: [...(c.nestedCommands || []), newCommand] };
              }
              if (c.nestedCommands) {
                return { ...c, nestedCommands: updateNested(c.nestedCommands) };
              }
              return c;
            });
          };
          return updateNested(prev);
        });
      } else {
        setProgram([...program, newCommand]);
      }
    }
  };

  const removeCommand = (id: string) => {
    if (isExecuting) return;
    const removeFromList = (cmds: Command[]): Command[] => {
      return cmds
        .filter(c => c.id !== id)
        .map(c => ({
          ...c,
          nestedCommands: c.nestedCommands ? removeFromList(c.nestedCommands) : undefined
        }));
    };

    if (editingFunction) {
      setFunctions(prev => ({
        ...prev,
        [editingFunction]: removeFromList(prev[editingFunction] || [])
      }));
    } else {
      setProgram(removeFromList(program));
    }
    if (activeContainerId === id) setActiveContainerId(null);
  };

  const updateRepeatCount = (id: string, count: number) => {
    const updateInList = (cmds: Command[]): Command[] => {
      return cmds.map(c => {
        if (c.id === id) return { ...c, value: count };
        if (c.nestedCommands) return { ...c, nestedCommands: updateInList(c.nestedCommands) };
        return c;
      });
    };

    if (editingFunction) {
      setFunctions(prev => ({
        ...prev,
        [editingFunction]: updateInList(prev[editingFunction] || [])
      }));
    } else {
      setProgram(updateInList(program));
    }
  };

  const createFunction = (name: string) => {
    if (functions[name]) return;
    setFunctions(prev => ({ ...prev, [name]: [] }));
    setEditingFunction(name);
  };

  const deleteFunction = (name: string) => {
    setFunctions(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    if (editingFunction === name) setEditingFunction(null);
    // Also remove calls to this function from program
    const removeCalls = (cmds: Command[]): Command[] => {
      return cmds
        .filter(c => !(c.type === 'CALL_FUNCTION' && c.value === name))
        .map(c => ({
          ...c,
          nestedCommands: c.nestedCommands ? removeCalls(c.nestedCommands) : undefined
        }));
    };
    setProgram(removeCalls(program));
  };

  const runProgram = async () => {
    if (program.length === 0 || isExecuting) return;
    resetRobot();
    playSound('start');
    
    runIdRef.current += 1;
    const currentRunId = runIdRef.current;

    setIsExecuting(true);
    setPhase('PLAYING');
    let currentRobotState: RobotState = { 
      ...robot, 
      x: currentLevel.startPos.x,
      y: currentLevel.startPos.y,
      direction: currentLevel.startDir,
      inventory: [],
      status: 'RUNNING', 
      message: 'Executing...' 
    };
    setRobot(currentRobotState);

    const flattenedCommands: Command[] = [];
    
    const expand = (cmds: Command[]) => {
      for (const cmd of cmds) {
        if (cmd.type === 'REPEAT') {
          const count = Number(cmd.value) || 0;
          for (let i = 0; i < count; i++) {
            if (cmd.nestedCommands) expand(cmd.nestedCommands);
          }
        } else if (cmd.type === 'CALL_FUNCTION') {
          const funcName = String(cmd.value);
          if (functions[funcName]) expand(functions[funcName]);
        } else {
          flattenedCommands.push(cmd);
        }
      }
    };

    expand(program);

    for (let i = 0; i < flattenedCommands.length; i++) {
      if (runIdRef.current !== currentRunId) return;

      // Handle Pause
      while (pauseRef.current) {
        if (runIdRef.current !== currentRunId) return;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const cmd = flattenedCommands[i];
      setActiveCommandId(cmd.id);
      
      if (cmd.type === 'MOVE' || cmd.type === 'TURN_LEFT' || cmd.type === 'TURN_RIGHT') {
        playSound('action');
      }

      let { x, y, direction, inventory, status, message } = currentRobotState;
      let action: 'walking' | 'jumping' | 'spinning' | 'idle' = 'idle';

      if (cmd.type === 'MOVE') {
        action = 'walking';
        if (direction === 'UP') y--;
        else if (direction === 'DOWN') y++;
        else if (direction === 'LEFT') x--;
        else if (direction === 'RIGHT') x++;

        // Check bounds
        if (x < 0 || x >= currentLevel.gridSize || y < 0 || y >= currentLevel.gridSize) {
          status = 'CRASHED';
          message = "Ouch! I hit a wall! Check your instructions.";
          playSound('error');
          setScore(s => Math.max(0, s - 50));
        } else if (currentLevel.obstacles.some(obs => obs.x === x && obs.y === y)) {
          status = 'CRASHED';
          message = "Bonk! There's an obstacle there!";
          playSound('error');
          setScore(s => Math.max(0, s - 50));
        } else {
          setScore(s => s + 10);
        }
      } else if (cmd.type === 'TURN_LEFT') {
        action = 'spinning';
        const dirs: Direction[] = ['UP', 'LEFT', 'DOWN', 'RIGHT'];
        direction = dirs[(dirs.indexOf(direction) + 1) % 4];
        setScore(s => s + 5);
      } else if (cmd.type === 'TURN_RIGHT') {
        action = 'spinning';
        const dirs: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
        direction = dirs[(dirs.indexOf(direction) + 1) % 4];
        setScore(s => s + 5);
      } else if (cmd.type === 'PICKUP') {
        action = 'jumping';
        const itemIdx = currentLevel.items.findIndex(item => item.x === x && item.y === y);
        if (itemIdx !== -1) {
          inventory = [...inventory, currentLevel.items[itemIdx].id];
          playSound('pickup');
          setScore(s => s + 100);
        } else {
          status = 'CRASHED';
          message = "Nothing to pick up here! Is this a bug?";
          playSound('error');
          setScore(s => Math.max(0, s - 25));
        }
      }

      // Check success
      if (status !== 'CRASHED' && x === currentLevel.targetPos.x && y === currentLevel.targetPos.y) {
        if (inventory.length === currentLevel.items.length) {
          status = 'SUCCESS';
          message = "Wooohooo! Mission Complete!";
          playSound('success');
          setScore(s => s + 500);
          setTotalScore(prev => prev + 500);
          setProgram([]);
          setPhase('SUCCESS');
          
          // Save high score
          fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ level_id: currentLevel.id, score: score + 500 })
          }).then(res => res.json())
            .then(data => {
              if (data.status === 'new_high_score') {
                setHighScores(prev => ({ ...prev, [currentLevel.id]: data.score }));
              }
            });
          
          // Unlock next level
          const nextLevelId = currentLevel.id + 1;
          if (LEVELS.find(l => l.id === nextLevelId) && !unlockedLevels.includes(nextLevelId)) {
            setUnlockedLevels(prev => [...prev, nextLevelId]);
          }
        }
      }

      if (status === 'CRASHED') {
        setPhase('FAILED');
      }

      currentRobotState = { ...currentRobotState, x, y, direction, inventory, status, message, currentAction: action };
      setRobot(currentRobotState);

      await new Promise(resolve => setTimeout(resolve, 600));

      if (runIdRef.current !== currentRunId) return;

      if (status === 'CRASHED' || status === 'SUCCESS') {
        break;
      }
    }

    if (runIdRef.current !== currentRunId) {
      setIsExecuting(false);
      return;
    }

    // Reset action to idle
    setRobot(prev => ({ ...prev, currentAction: 'idle' }));

    if (currentRobotState.status === 'RUNNING') {
      setRobot(prev => ({ ...prev, status: 'IDLE', message: "Program finished, but I'm not at the goal yet!" }));
      setPhase('FAILED');
    }
    
    setIsExecuting(false);
  };

  const togglePause = () => {
    if (phase === 'PLAYING') setPhase('PAUSED');
    else if (phase === 'PAUSED') setPhase('PLAYING');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#87CEEB] via-[#E0F2FE] to-[#BAE6FD]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">RoboCode</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">The Debugging Adventure</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {phase === 'QUEST_MAP' && (
            <button 
              onClick={() => setPhase('CUSTOMIZING')}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Palette className="w-5 h-5" />
              <span className="text-sm font-bold hidden sm:inline">Customize</span>
            </button>
          )}
          {(phase === 'PLAYING' || phase === 'PAUSED' || phase === 'SUCCESS' || phase === 'FAILED') && (
            <button 
              onClick={() => {
                resetRobot();
                setPhase('QUEST_MAP');
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <MapIcon className="w-5 h-5" />
              <span className="text-sm font-bold hidden sm:inline">Quest Map</span>
            </button>
          )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {phase === 'CUSTOMIZING' && (
          <div className="flex-1 flex flex-col overflow-y-auto relative">
            {/* Biome Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={cn("absolute inset-0 transition-colors duration-1000", BIOMES[4].color)}>
                <img 
                  src={`https://picsum.photos/seed/${BIOMES[4].seed}/1200/800`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <RobotCustomizer 
              robotColor={robotColor}
              setRobotColor={setRobotColor}
              robotAccessory={robotAccessory}
              setRobotAccessory={setRobotAccessory}
              onStart={() => setPhase('QUEST_MAP')}
            />
          </div>
        )}
        {phase === 'QUEST_MAP' && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <QuestMap 
              levels={LEVELS}
              unlockedLevels={unlockedLevels}
              highScores={highScores}
              onSelectLevel={(idx) => {
                setLevelIdx(idx);
                setPhase('PLAYING');
                resetRobot();
              }}
              onBack={() => setPhase('CUSTOMIZING')}
            />
          </div>
        )}
        {(phase === 'PLAYING' || phase === 'PAUSED' || phase === 'SUCCESS' || phase === 'FAILED') && (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Biome Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={cn("absolute inset-0 transition-colors duration-1000", currentBiome.color)}>
                <img 
                  src={`https://picsum.photos/seed/${currentBiome.seed}/1200/800`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col items-center justify-center h-full opacity-5 select-none">
                  <span className="text-[20rem] mb-4">{currentBiome.icon}</span>
                  <span className="text-9xl font-black uppercase tracking-widest">{currentBiome.label}</span>
                </div>
              </div>
            </div>

            <GamePlay 
              currentLevel={currentLevel}
              robot={robot}
              program={program}
              isRunning={isExecuting}
              isPaused={isPaused}
              activeCommandId={activeCommandId}
              activeContainerId={activeContainerId}
              robotColor={robotColor}
              robotAccessory={robotAccessory}
              commandDefs={COMMAND_DEFS}
              score={score}
              addCommand={addCommand}
              removeCommand={removeCommand}
              updateRepeatCount={updateRepeatCount}
              runProgram={runProgram}
              togglePause={togglePause}
              resetRobot={() => {
                resetRobot();
                setPhase('PLAYING');
              }}
              setProgram={setProgram}
              setActiveContainerId={setActiveContainerId}
              functions={functions}
              editingFunction={editingFunction}
              setEditingFunction={setEditingFunction}
              createFunction={createFunction}
              deleteFunction={deleteFunction}
            />
            
            {/* Overlays */}
            <AnimatePresence>
              {isPaused && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
                  >
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <RotateCcw className="w-10 h-10 animate-spin-slow" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Game Paused</h2>
                    <p className="text-slate-500 mb-8">Take a breath! Your robot is waiting for your signal.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => {
                          resetRobot();
                          setPhase('PLAYING');
                        }}
                        className="px-6 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        Restart
                      </button>
                      <button 
                        onClick={togglePause}
                        className="px-6 py-3 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                      >
                        Resume
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {phase === 'SUCCESS' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-emerald-900/20 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[40px] p-10 shadow-2xl max-w-md w-full text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                      <CheckCircle2 className="w-12 h-12" />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-400 rounded-full"
                      />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">MISSION COMPLETE!</h2>
                    <div className="bg-slate-50 rounded-2xl p-4 mb-8">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
                      <p className="text-5xl font-black text-blue-600">{score}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={() => setPhase('QUEST_MAP')}
                        className="px-8 py-4 rounded-2xl bg-slate-900 font-bold text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                      >
                        Back to Quest Map <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {phase === 'FAILED' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-rose-900/20 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-[40px] p-10 shadow-2xl max-w-md w-full text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                    <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Bug className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">OOH NOOO!</h2>
                    <p className="text-slate-500 mb-8 text-lg font-medium">{robot.message}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setPhase('QUEST_MAP')}
                        className="px-6 py-4 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                      >
                        Give Up
                      </button>
                      <button 
                        onClick={() => {
                          resetRobot();
                          setPhase('PLAYING');
                        }}
                        className="px-6 py-4 rounded-2xl bg-rose-600 font-bold text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                      >
                        Retry
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
