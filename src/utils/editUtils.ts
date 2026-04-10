import type { PatternCell, PerlerColor } from './patternUtils';

export const clonePatternGrid = (grid: PatternCell[][]): PatternCell[][] => {
  return grid.map(row => row.map(cell => ({
    color: { ...cell.color },
    code: cell.code
  })));
};

export const areColorsEqual = (a: PerlerColor, b: PerlerColor): boolean => {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.hex === b.hex;
};

export const fillConnectedRegion = (
  grid: PatternCell[][],
  startX: number,
  startY: number,
  newColor: PerlerColor,
  newCode: string
): PatternCell[][] => {
  const height = grid.length;
  if (height === 0) return grid;
  const width = grid[0].length;
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return grid;

  const startCell = grid[startY][startX];
  const originalColor = startCell.color;
  if (areColorsEqual(originalColor, newColor) && startCell.code === newCode) {
    return grid;
  }

  const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const visited: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  while (stack.length) {
    const { x, y } = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[y][x]) continue;

    const cell = grid[y][x];
    if (!areColorsEqual(cell.color, originalColor) || cell.code !== startCell.code) {
      continue;
    }

    visited[y][x] = true;
    grid[y][x] = {
      color: { ...newColor },
      code: newCode
    };

    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  return grid;
};
