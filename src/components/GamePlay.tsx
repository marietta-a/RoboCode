import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCcw, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Zap, 
  Code2,
  Plus,
  Settings2,
  ChevronLeft,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Command, RobotState, GameLevel, CommandType } from '../types';
import { Robot } from './Robot';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GamePlayProps {
  currentLevel: GameLevel;
  robot: RobotState;
  program: Command[];
  isRunning: boolean;
  isPaused: boolean;
  activeCommandId: string | null;
  activeContainerId: string | null;
  robotColor: string;
  robotAccessory: string | null;
  commandDefs: { type: CommandType; label: string; icon: React.ReactNode; color: string }[];
  score: number;
  addCommand: (type: CommandType) => void;
  removeCommand: (id: string) => void;
  updateRepeatCount: (id: string, count: number) => void;
  runProgram: () => void;
  togglePause: () => void;
  resetRobot: () => void;
  setProgram: (prog: Command[]) => void;
  setActiveContainerId: (id: string | null) => void;
}

export const GamePlay: React.FC<GamePlayProps> = ({
  currentLevel,
  robot,
  program,
  isRunning,
  isPaused,
  activeCommandId,
  activeContainerId,
  robotColor,
  robotAccessory,
  commandDefs,
  score,
  addCommand,
  removeCommand,
  updateRepeatCount,
  runProgram,
  togglePause,
  resetRobot,
  setProgram,
  setActiveContainerId,
  functions,
  editingFunction,
  setEditingFunction,
  createFunction,
  deleteFunction
}) => {
  const [newFuncName, setNewFuncName] = React.useState('');
  const [isCreatingFunc, setIsCreatingFunc] = React.useState(false);

  const currentProgram = editingFunction ? functions[editingFunction] : program;
  const renderCommand = (cmd: Command, index: number, isNested = false) => {
    const def = commandDefs.find(d => d.type === cmd.type);
    const isActive = activeCommandId === cmd.id;
    const isContainer = cmd.type === 'REPEAT';
    const isSelectedContainer = activeContainerId === cmd.id;

    let label = def?.label;
    if (cmd.type === 'CALL_FUNCTION') {
      label = `Do "${cmd.value}"`;
    }

    return (
      <motion.div
        key={cmd.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "group relative flex flex-col gap-2 p-3 rounded-2xl border transition-all",
          isActive ? "border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200" : "border-slate-100 bg-slate-50/50",
          isContainer && isSelectedContainer && "border-purple-400 bg-purple-50/30 ring-2 ring-purple-200",
          isNested && "ml-4 border-l-4"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm", def?.color)}>
            {def?.icon}
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">{label}</p>
            {cmd.type === 'REPEAT' && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Times:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={cmd.value as number}
                  onChange={(e) => updateRepeatCount(cmd.id, parseInt(e.target.value) || 1)}
                  className="w-12 h-6 bg-white border border-slate-200 rounded-md text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isContainer && (
              <button
                onClick={() => setActiveContainerId(isSelectedContainer ? null : cmd.id)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isSelectedContainer ? "bg-purple-100 text-purple-600" : "text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                )}
                title={isSelectedContainer ? "Stop adding here" : "Add commands inside"}
              >
                <Code2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => removeCommand(cmd.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {cmd.nestedCommands && cmd.nestedCommands.length > 0 && (
          <div className="space-y-2 mt-1">
            {cmd.nestedCommands.map((nested, nIdx) => renderCommand(nested, nIdx, true))}
          </div>
        )}
        
        {isContainer && isSelectedContainer && cmd.nestedCommands?.length === 0 && (
          <div className="ml-4 p-4 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50/50 flex flex-col items-center justify-center gap-2">
            <Code2 className="w-6 h-6 text-purple-300" />
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Adding inside loop...</p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <main className="flex-1 grid grid-cols-12 gap-4 p-4 lg:gap-6 lg:p-6 max-w-[1600px] mx-auto w-full h-full overflow-hidden">
      {/* Left Column: Grid & Status */}
      <div className="col-span-7 flex flex-col gap-4 lg:gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">
        {/* Grid Area */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-4 lg:p-8 flex flex-col items-center justify-center relative min-h-[300px] lg:min-h-[500px]">
           <div className="absolute top-6 left-8 flex items-center gap-3 text-slate-400 max-w-[80%]">
              <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] leading-tight">{currentLevel.description}</span>
           </div>

           <div 
             className="grid gap-2 p-6 bg-slate-50 rounded-[40px] border border-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] mt-8"
             style={{ 
               gridTemplateColumns: `repeat(${currentLevel.gridSize}, 1fr)`,
               width: '100%',
               maxWidth: '480px',
               aspectRatio: '1/1'
             }}
           >
             {Array.from({ length: currentLevel.gridSize * currentLevel.gridSize }).map((_, i) => {
               const x = i % currentLevel.gridSize;
               const y = Math.floor(i / currentLevel.gridSize);
               const isRobot = robot.x === x && robot.y === y;
               const isTarget = currentLevel.targetPos.x === x && currentLevel.targetPos.y === y;
               const isObstacle = currentLevel.obstacles.some(o => o.x === x && o.y === y);
               const item = currentLevel.items.find(it => it.x === x && it.y === y);
               const isCollected = robot.inventory.includes(item?.id || '');

               return (
                 <div 
                   key={i} 
                   className={cn(
                     "relative rounded-xl flex items-center justify-center transition-all duration-300",
                     isObstacle ? "bg-slate-200" : "bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-slate-50",
                     isTarget && "bg-emerald-50/50 border-2 border-emerald-100"
                   )}
                 >
                   {isTarget && (
                     <div className="absolute inset-0 flex items-center justify-center opacity-30">
                       <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                     </div>
                   )}
                   
                   {item && !isCollected && (
                     <motion.div 
                       initial={{ scale: 0.8 }}
                       animate={{ scale: [0.8, 1.1, 0.8] }}
                       transition={{ repeat: Infinity, duration: 2 }}
                       className="text-amber-500"
                     >
                       <Zap className="w-6 h-6 fill-current" />
                     </motion.div>
                   )}

                   {isRobot && (
                     <motion.div 
                       layoutId="robot"
                       className="relative z-10"
                       animate={{ 
                         rotate: robot.direction === 'UP' ? 0 : 
                                 robot.direction === 'RIGHT' ? 90 : 
                                 robot.direction === 'DOWN' ? 180 : 270 
                       }}
                     >
                       <Robot size="md" state={robot} color={robotColor} accessory={robotAccessory} />
                       {/* Robot Eyes/Front */}
                       <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full" />
                     </motion.div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>

        {/* Status & Score Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className={cn(
            "p-6 rounded-[28px] border flex items-center gap-5 transition-all shadow-sm",
            robot.status === 'IDLE' && "bg-white border-slate-100",
            robot.status === 'RUNNING' && "bg-blue-50 border-blue-100 text-blue-700",
            robot.status === 'CRASHED' && "bg-rose-50 border-rose-100 text-rose-700",
            robot.status === 'SUCCESS' && "bg-emerald-50 border-emerald-100 text-emerald-700"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              robot.status === 'IDLE' && "bg-slate-50 text-slate-300",
              robot.status === 'RUNNING' && "bg-blue-100 text-blue-600 animate-pulse",
              robot.status === 'CRASHED' && "bg-rose-100 text-rose-600",
              robot.status === 'SUCCESS' && "bg-emerald-100 text-emerald-600"
            )}>
              {robot.status === 'IDLE' && <Play className="w-7 h-7" />}
              {robot.status === 'RUNNING' && <Play className="w-7 h-7 fill-current" />}
              {robot.status === 'CRASHED' && <AlertCircle className="w-7 h-7" />}
              {robot.status === 'SUCCESS' && <CheckCircle2 className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-40 mb-0.5">Robot Status</p>
              <p className="text-xl font-bold tracking-tight">{robot.message}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-[28px] flex items-center gap-5 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <Zap className="w-7 h-7 fill-current" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Current Score</p>
              <motion.p 
                key={score}
                initial={{ scale: 1.2, color: '#f59e0b' }}
                animate={{ scale: 1, color: '#0f172a' }}
                className="text-3xl font-black tracking-tighter"
              >
                {score.toLocaleString()}
              </motion.p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Editor */}
      <div className="col-span-5 flex flex-col gap-4 lg:gap-6 h-full overflow-hidden">
        {/* Controls */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Command Palette</h2>
            <div className="flex gap-3">
              <button 
                onClick={resetRobot}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                title="Reset Robot"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setProgram([])}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                title="Clear Program"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {commandDefs.filter(d => d.type !== 'CALL_FUNCTION').map(def => (
              <button
                key={def.type}
                onClick={() => addCommand(def.type)}
                disabled={isRunning}
                className={cn(
                  "flex items-center gap-2 lg:gap-4 p-2 lg:p-4 rounded-2xl border border-slate-50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200 transition-all text-left group",
                  isRunning && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0", def.color)}>
                  {def.icon}
                </div>
                <span className="text-sm font-bold text-slate-700 leading-tight">{def.label}</span>
              </button>
            ))}
            
            {/* Custom Function Buttons */}
            {Object.keys(functions).map(funcName => (
              <button
                key={funcName}
                onClick={() => addCommand('CALL_FUNCTION', funcName)}
                disabled={isRunning || editingFunction === funcName}
                className={cn(
                  "flex items-center gap-2 lg:gap-4 p-2 lg:p-4 rounded-2xl border border-slate-50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-200 transition-all text-left group",
                  (isRunning || editingFunction === funcName) && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 bg-pink-500">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold text-slate-700 leading-tight">Do "{funcName}"</span>
              </button>
            ))}
          </div>

          <button
            onClick={isRunning ? togglePause : runProgram}
            disabled={(isRunning && !isPaused && false) || (!isRunning && program.length === 0)}
            className={cn(
              "w-full py-3 lg:py-5 rounded-2xl flex items-center justify-center gap-2 lg:gap-4 text-lg lg:text-xl font-black transition-all shadow-xl",
              !isRunning && program.length === 0 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                : isRunning 
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-0.5"
            )}
          >
            {isRunning ? (
              <>
                <RotateCcw className={cn("w-6 h-6", isPaused && "animate-spin-slow")} />
                {isPaused ? "Resume" : "Pause"}
              </>
            ) : (
              <>
                <Play className={cn("w-6 h-6", program.length > 0 && "fill-current")} />
                "Run Program"
              </>
            )}
          </button>
        </div>

        {/* Program Editor */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {editingFunction && (
                <button 
                  onClick={() => {
                    setEditingFunction(null);
                    setActiveContainerId(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {editingFunction ? `Editing: ${editingFunction}` : "Main Program"}
              </h2>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{currentProgram.length} Steps</span>
          </div>

          {!editingFunction && (
            <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
              <button 
                onClick={() => {
                  setEditingFunction(null);
                  setActiveContainerId(null);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  !editingFunction ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
              >
                Main
              </button>
              {Object.keys(functions).map(name => (
                <div key={name} className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      setEditingFunction(name);
                      setActiveContainerId(null);
                    }}
                    className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {name}
                  </button>
                  <button 
                    onClick={() => deleteFunction(name)}
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => setIsCreatingFunc(true)}
                className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> New Function
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {currentProgram.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-6 py-12">
                  <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                    <Code2 className="w-10 h-10 opacity-20" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-40">Add some commands to start!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentProgram.map((cmd, idx) => renderCommand(cmd, idx))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Create Function Modal Overlay */}
          <AnimatePresence>
            {isCreatingFunc && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full"
                >
                  <h3 className="text-xl font-black text-slate-900 mb-4">Create New Function</h3>
                  <p className="text-sm text-slate-500 mb-6">Give your function a cool name like "Super Jump" or "Victory Spin"!</p>
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Function Name..."
                    value={newFuncName}
                    onChange={(e) => setNewFuncName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newFuncName.trim()) {
                        createFunction(newFuncName.trim());
                        setNewFuncName('');
                        setIsCreatingFunc(false);
                      }
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setIsCreatingFunc(false);
                        setNewFuncName('');
                      }}
                      className="px-6 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (newFuncName.trim()) {
                          createFunction(newFuncName.trim());
                          setNewFuncName('');
                          setIsCreatingFunc(false);
                        }
                      }}
                      className="px-6 py-3 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pro-Tip */}
          <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-5 flex gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-xs text-amber-900/70 leading-relaxed font-medium">
              <span className="font-bold text-amber-900">Pro-Tip:</span> It's okay to break the game! If Robo crashes, look at your program and try to find the "bug". Fixing it is how you become a master coder!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
