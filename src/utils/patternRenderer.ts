import type { PatternCell } from './patternUtils';

export interface RenderOptions {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  axisMargin: number;
  showNumbers: boolean;
  showGridLines: boolean;
  gridLineInterval: number;
  gridLineColor: {
    major: string;
    minor: string;
  };
  majorGridLineWidth: number;
  minorGridLineWidth: number;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  gridWidth: 30,
  gridHeight: 30,
  cellSize: 20,
  axisMargin: 12,
  showNumbers: false,
  showGridLines: true,
  gridLineInterval: 5,
  gridLineColor: {
    major: '#333',
    minor: '#ddd'
  },
  majorGridLineWidth: 1.5,
  minorGridLineWidth: 0.5
};

export function getContrastColor(r: number, g: number, b: number): string {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

export interface GridBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function normalizeGridBounds(bounds: GridBounds): GridBounds {
  return {
    x1: Math.min(bounds.x1, bounds.x2),
    y1: Math.min(bounds.y1, bounds.y2),
    x2: Math.max(bounds.x1, bounds.x2),
    y2: Math.max(bounds.y1, bounds.y2)
  };
}

export function clampToGrid(x: number, y: number, gridWidth: number, gridHeight: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(gridWidth - 1, x)),
    y: Math.max(0, Math.min(gridHeight - 1, y))
  };
}

export interface CellPosition {
  x: number;
  y: number;
  cellX: number;
  cellY: number;
  isMajorGridLineX: boolean;
  isMajorGridLineY: boolean;
}

export function calculateCellPosition(
  x: number,
  y: number,
  cellSize: number,
  axisMargin: number,
  gridLineInterval: number
): CellPosition {
  const cellX = axisMargin + x * cellSize;
  const cellY = axisMargin + y * cellSize;
  const isMajorGridLineX = (x + 1) % gridLineInterval === 0;
  const isMajorGridLineY = (y + 1) % gridLineInterval === 0;

  return { x, y, cellX, cellY, isMajorGridLineX, isMajorGridLineY };
}

export interface LabelPosition {
  index: number;
  x: number;
  y: number;
  isEdge: boolean;
}

export function calculateAxisLabelPositions(
  dimension: number,
  cellSize: number,
  axisMargin: number,
  labelInterval: number
): LabelPosition[] {
  const positions: LabelPosition[] = [];
  const halfAxisMargin = axisMargin / 2;

  for (let i = 0; i < dimension; i++) {
    if (i === 0 || i === dimension - 1 || (i + 1) % labelInterval === 0) {
      positions.push({
        index: i,
        x: axisMargin + i * cellSize + cellSize / 2,
        y: halfAxisMargin,
        isEdge: i === 0 || i === dimension - 1
      });
    }
  }

  return positions;
}

export interface PreviewOverlay {
  cells: Array<{ x: number; y: number }>;
  bounds?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  fillColor: string;
  strokeColor: string;
}

export function createPreviewOverlay(
  cells: Array<{ x: number; y: number }>,
  fillColor: { r: number; g: number; b: number },
  strokeColor: string = '#409EFF'
): PreviewOverlay {
  return {
    cells,
    fillColor: `rgba(${fillColor.r}, ${fillColor.g}, ${fillColor.b}, 0.45)`,
    strokeColor
  };
}

export function drawPatternToCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  patternGrid: PatternCell[][],
  options: Partial<RenderOptions> = {}
): void {
  const opts: RenderOptions = { ...DEFAULT_RENDER_OPTIONS, ...options };
  const { gridWidth, gridHeight, cellSize, axisMargin, showNumbers, gridLineInterval, gridLineColor, majorGridLineWidth, minorGridLineWidth } = opts;

  if (!patternGrid.length || !patternGrid[0]) return;

  canvas.width = gridWidth * cellSize + axisMargin * 2;
  canvas.height = gridHeight * cellSize + axisMargin * 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = patternGrid[y]?.[x];
      if (!cell) continue;

      const { cellX, cellY, isMajorGridLineX, isMajorGridLineY } = calculateCellPosition(x, y, cellSize, axisMargin, gridLineInterval);

      ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`;
      ctx.fillRect(cellX, cellY, cellSize, cellSize);

      if (isMajorGridLineX || isMajorGridLineY) {
        ctx.beginPath();
        ctx.strokeStyle = gridLineColor.major;
        ctx.lineWidth = majorGridLineWidth;
        if (isMajorGridLineX) {
          ctx.moveTo(cellX + cellSize, cellY);
          ctx.lineTo(cellX + cellSize, cellY + cellSize);
          ctx.stroke();
        }
        if (isMajorGridLineY) {
          ctx.moveTo(cellX, cellY + cellSize);
          ctx.lineTo(cellX + cellSize, cellY + cellSize);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = gridLineColor.minor;
        ctx.lineWidth = minorGridLineWidth;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }

      if (showNumbers && cellSize >= 20 && cell.code) {
        const colorCode = cell.code;
        let fontSize = cellSize * 0.55;

        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(colorCode).width;

        if (textWidth > cellSize * 0.75) {
          fontSize = (cellSize * 0.75 / textWidth) * fontSize;
          ctx.font = `${fontSize}px Arial`;
        }

        const textX = cellX + cellSize / 2;
        const textY = cellY + cellSize / 2;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 2;
        ctx.strokeText(colorCode, textX, textY);
        ctx.fillStyle = getContrastColor(cell.color.r, cell.color.g, cell.color.b);
        ctx.fillText(colorCode, textX, textY);
      }
    }
  }

  if (showNumbers) {
    drawAxisLabels(ctx, canvas, gridWidth, gridHeight, cellSize, axisMargin);
  }
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  axisMargin: number
): void {
  ctx.save();

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, axisMargin);
  ctx.fillRect(0, 0, axisMargin, canvas.height);
  ctx.fillRect(0, canvas.height - axisMargin, canvas.width, axisMargin);
  ctx.fillRect(canvas.width - axisMargin, 0, axisMargin, canvas.height);

  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(axisMargin, axisMargin);
  ctx.lineTo(axisMargin, canvas.height - axisMargin);
  ctx.moveTo(axisMargin, axisMargin);
  ctx.lineTo(canvas.width - axisMargin, axisMargin);
  ctx.stroke();

  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px Arial';
  ctx.textBaseline = 'middle';

  const labelInterval = cellSize >= 20 ? 1 : 5;

  for (let i = 0; i < gridWidth; i++) {
    if (i === 0 || i === gridWidth - 1 || (i + 1) % labelInterval === 0) {
      const label = `${i + 1}`;
      const x = axisMargin + i * cellSize + cellSize / 2;
      const topY = axisMargin / 2;
      const bottomY = canvas.height - axisMargin / 2;

      ctx.textAlign = 'center';
      ctx.fillText(label, x, topY);
      ctx.fillText(label, x, bottomY);
    }
  }

  for (let i = 0; i < gridHeight; i++) {
    if (i === 0 || i === gridHeight - 1 || (i + 1) % labelInterval === 0) {
      const label = `${i + 1}`;
      const y = axisMargin + i * cellSize + cellSize / 2;
      const leftX = axisMargin / 2;
      const rightX = canvas.width - axisMargin / 2;

      ctx.textAlign = 'right';
      ctx.fillText(label, leftX, y);
      ctx.textAlign = 'left';
      ctx.fillText(label, rightX, y);
    }
  }

  ctx.restore();
}

export function drawPreviewOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: PreviewOverlay,
  cellSize: number,
  axisMargin: number
): void {
  if (!overlay.cells.length) return;

  ctx.save();

  ctx.fillStyle = overlay.fillColor;
  overlay.cells.forEach(({ x, y }) => {
    ctx.fillRect(axisMargin + x * cellSize, axisMargin + y * cellSize, cellSize, cellSize);
  });

  if (overlay.bounds) {
    const { x1, y1, x2, y2 } = normalizeGridBounds(overlay.bounds);
    ctx.strokeStyle = overlay.strokeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      axisMargin + x1 * cellSize,
      axisMargin + y1 * cellSize,
      (x2 - x1 + 1) * cellSize,
      (y2 - y1 + 1) * cellSize
    );
  }

  ctx.restore();
}
