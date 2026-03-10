
export type Direction = 'UP' | 'RIGHT' | 'DOWN' | 'LEFT';

export type CommandType = 
  | 'MOVE' 
  | 'TURN_LEFT' 
  | 'TURN_RIGHT' 
  | 'PICKUP' 
  | 'REPEAT' 
  | 'CALL_FUNCTION';

export interface Command {
  id: string;
  type: CommandType;
  value?: number | string; // For REPEAT (count) or CALL_FUNCTION (name)
  nestedCommands?: Command[]; // For REPEAT
}

export type GamePhase = 'MENU' | 'CUSTOMIZING' | 'QUEST_MAP' | 'PLAYING' | 'PAUSED' | 'SUCCESS' | 'FAILED';

export interface RobotState {
  x: number;
  y: number;
  direction: Direction;
  inventory: string[];
  status: 'IDLE' | 'RUNNING' | 'CRASHED' | 'SUCCESS';
  message: string;
  currentAction?: 'walking' | 'jumping' | 'spinning' | 'idle';
}

export interface GameLevel {
  id: number;
  gridSize: number;
  startPos: { x: number; y: number };
  startDir: Direction;
  targetPos: { x: number; y: number };
  obstacles: { x: number; y: number }[];
  items: { x: number; y: number; id: string }[];
  description: string;
}
