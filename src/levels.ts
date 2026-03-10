import { GameLevel, Direction } from './types';

export class LevelManager {
  static readonly TOTAL_LEVELS = 50;

  static getLevel(id: number): GameLevel {
    // Seeded random based on level id
    let seed = id * 15485863; // Use a large prime
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Difficulty scaling
    const gridSize = Math.min(12, 5 + Math.floor((id - 1) / 8));
    const obstacleCount = Math.floor(gridSize * gridSize * (0.1 + (id / 150)));
    const itemCount = Math.min(5, Math.floor((id - 1) / 10));

    let level: GameLevel;
    let attempts = 0;

    do {
      attempts++;
      const startPos = { x: 0, y: gridSize - 1 };
      const targetPos = { x: gridSize - 1, y: 0 };
      const obstacles: { x: number; y: number }[] = [];
      const items: { x: number; y: number; id: string }[] = [];

      // Random obstacles
      for (let i = 0; i < obstacleCount; i++) {
        const obs = {
          x: Math.floor(random() * gridSize),
          y: Math.floor(random() * gridSize)
        };
        if (
          (obs.x === startPos.x && obs.y === startPos.y) ||
          (obs.x === targetPos.x && obs.y === targetPos.y) ||
          obstacles.some(o => o.x === obs.x && o.y === obs.y)
        ) continue;
        obstacles.push(obs);
      }

      // Random items
      for (let i = 0; i < itemCount; i++) {
        let itemPos;
        let itemAttempts = 0;
        do {
          itemPos = {
            x: Math.floor(random() * gridSize),
            y: Math.floor(random() * gridSize)
          };
          itemAttempts++;
        } while (
          itemAttempts < 20 && (
            (itemPos.x === startPos.x && itemPos.y === startPos.y) ||
            (itemPos.x === targetPos.x && itemPos.y === targetPos.y) ||
            obstacles.some(o => o.x === itemPos.x && o.y === itemPos.y) ||
            items.some(it => it.x === itemPos.x && it.y === itemPos.y)
          )
        );
        if (itemAttempts < 20) {
          items.push({ ...itemPos, id: `item-${id}-${i}` });
        }
      }

      level = {
        id,
        gridSize,
        startPos,
        startDir: 'UP',
        targetPos,
        obstacles,
        items,
        description: this.generateDescription(id, itemCount)
      };

    } while (!this.isSolvable(level) && attempts < 100);

    return level;
  }

  private static generateDescription(id: number, itemCount: number): string {
    const themes = [
      "The Training Grounds",
      "Rusty Corridors",
      "The Silicon Valley",
      "Binary Bastion",
      "Circuit City",
      "The Motherboard Maze",
      "Quantum Quagmire",
      "Logic Labyrinth",
      "The Firewall",
      "Mainframe Mountain"
    ];
    const theme = themes[Math.floor((id - 1) / 5) % themes.length];
    return `${theme} (Level ${id}): ${itemCount > 0 ? `Collect ${itemCount} energy cores and reach the goal!` : "Find the path to the exit!"}`;
  }

  private static isSolvable(level: GameLevel): boolean {
    const { gridSize, startPos, targetPos, obstacles, items } = level;
    
    const canReach = (from: { x: number; y: number }, to: { x: number; y: number }): boolean => {
      const queue = [from];
      const visited = new Set([`${from.x},${from.y}`]);
      
      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (curr.x === to.x && curr.y === to.y) return true;
        
        const neighbors = [
          { x: curr.x + 1, y: curr.y },
          { x: curr.x - 1, y: curr.y },
          { x: curr.x, y: curr.y + 1 },
          { x: curr.x, y: curr.y - 1 }
        ];
        
        for (const next of neighbors) {
          const key = `${next.x},${next.y}`;
          if (
            next.x >= 0 && next.x < gridSize &&
            next.y >= 0 && next.y < gridSize &&
            !obstacles.some(o => o.x === next.x && o.y === next.y) &&
            !visited.has(key)
          ) {
            visited.add(key);
            queue.push(next);
          }
        }
      }
      return false;
    };

    // Must be able to reach all items from start, and target from each item
    // For simplicity, just check if all items and target are reachable from start
    // and if target is reachable from each item.
    if (!canReach(startPos, targetPos)) return false;
    for (const item of items) {
      if (!canReach(startPos, item)) return false;
      if (!canReach(item, targetPos)) return false;
    }

    return true;
  }

  static getLevels(count: number = this.TOTAL_LEVELS): GameLevel[] {
    const levels: GameLevel[] = [];
    for (let i = 1; i <= count; i++) {
      levels.push(this.getLevel(i));
    }
    return levels;
  }
}
