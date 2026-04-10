export type PerlerColor = {
  r: number;
  g: number;
  b: number;
  hex: string;
  info?: Record<string, string>;
};

export type PatternCell = {
  color: PerlerColor;
  code: string;
};

export type PaletteItem = {
  code: string;
  color: PerlerColor;
  count: number;
};

export type ColorStat = {
  color: PerlerColor;
  count: number;
  code: string;
};

export type ColorInfo = PerlerColor;

export const gcd = (a: number, b: number): number => {
  return b === 0 ? a : gcd(b, a % b);
};

export const findClosestColor = (color: { r: number; g: number; b: number }, colorMap: PerlerColor[]): PerlerColor => {
  let closestColor = colorMap[0];
  let minDistance = Infinity;

  colorMap.forEach((mapColor) => {
    const distance = Math.sqrt(
      Math.pow(color.r - mapColor.r, 2) +
      Math.pow(color.g - mapColor.g, 2) +
      Math.pow(color.b - mapColor.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = mapColor;
    }
  });

  return closestColor;
};

export const quantizeColorsUtil = (pixels: Uint8ClampedArray, count: number, perlerColors: PerlerColor[]): PerlerColor[] => {
  if (!perlerColors.length) return [];
  
  const colorFreq: Record<string, number> = {};

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const closestColor = findClosestColor({ r, g, b }, perlerColors);
    const key = `${closestColor.r},${closestColor.g},${closestColor.b}`;
    colorFreq[key] = (colorFreq[key] || 0) + 1;
  }

  const sortedColors = Object.keys(colorFreq)
    .sort((a, b) => colorFreq[b] - colorFreq[a])
    .slice(0, count);

  return sortedColors
    .map((colorStr) => {
      const [r, g, b] = colorStr.split(',').map(Number);
      const found = perlerColors.find((color) => color.r === r && color.g === g && color.b === b);
      return found || { r, g, b, hex: '', info: {} as Record<string, string> };
    })
    .filter((color) => color && typeof color === 'object');
};

export const buildPatternPalette = (perlerColors: PerlerColor[], patternGrid: PatternCell[][], brand: string): PaletteItem[] => {
  const usageMap: Record<string, number> = {};

  patternGrid.forEach((row) => {
    row.forEach((cell) => {
      if (cell?.color) {
        const key = `${cell.color.r},${cell.color.g},${cell.color.b}`;
        usageMap[key] = (usageMap[key] || 0) + 1;
      }
    });
  });

  return perlerColors
    .filter((color) => color.info && color.info[brand])
    .map((color) => ({
      code: color.info![brand],
      color,
      count: usageMap[`${color.r},${color.g},${color.b}`] || 0
    }))
    .sort((a, b) => {
      const countDiff = b.count - a.count;
      if (countDiff !== 0) return countDiff;
      return a.code.localeCompare(b.code);
    });
};

/**
 * 构建拼豆颜色统计
 * @param patternGrid - 拼豆图纸数据（二维数组）
 * @returns 按颜色代码排序的颜色统计数组
 */
export const buildColorStats = (patternGrid: PatternCell[][]): ColorStat[] => {
  // 使用对象统计每种颜色的使用次数
  const usage: Record<string, ColorStat> = {};
  
  // 遍历图纸中的每个格子
  patternGrid.forEach((row) => {
    row.forEach((cell) => {
      // 跳过空格子或没有代码的格子
      if (!cell || !cell.code) return;
      
      // 以RGB值作为唯一标识符
      const key = `${cell.color.r},${cell.color.g},${cell.color.b}`;
      
      // 如果是新颜色，初始化统计对象
      if (!usage[key]) {
        usage[key] = {
          color: cell.color,
          count: 0,
          code: cell.code
        };
      }
      
      // 累计数量
      usage[key].count++;
    });
  });

  // 按颜色代码排序（而不是按数量排序）
  return Object.values(usage).sort((a, b) => {
    // 按代码字母顺序排序
    return a.code.localeCompare(b.code);
  });
};

export const setGridSizeByImageRatio = (width: number, height: number, maxSize = 100): { width: number; height: number } => {
  if (!width || !height) return { width: 0, height: 0 };
  const aspect = width / height;
  if (width <= maxSize && height <= maxSize) {
    return {
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height))
    };
  }

  if (aspect >= 1) {
    return {
      width: maxSize,
      height: Math.max(1, Math.round(maxSize / aspect))
    };
  }

  return {
    width: Math.max(1, Math.round(maxSize * aspect)),
    height: maxSize
  };
};