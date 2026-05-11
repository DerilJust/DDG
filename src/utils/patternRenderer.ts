import type { PatternCell } from './patternUtils'

export interface RenderOptions {
  gridWidth: number
  gridHeight: number
  cellSize: number
  axisMargin: number
  showNumbers: boolean
  showGridLines: boolean
  gridLineInterval: number
  gridLineColor: {
    major: string
    minor: string
  }
  majorGridLineWidth: number
  minorGridLineWidth: number
  highlightedColorKeys?: Set<string>
  showCoordinateBorder?: boolean
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
  majorGridLineWidth: 2,
  minorGridLineWidth: 1,
  showCoordinateBorder: false
}

export function getContrastColor(r: number, g: number, b: number): string {
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

export interface GridBounds {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function normalizeGridBounds(bounds: GridBounds): GridBounds {
  return {
    x1: Math.min(bounds.x1, bounds.x2),
    y1: Math.min(bounds.y1, bounds.y2),
    x2: Math.max(bounds.x1, bounds.x2),
    y2: Math.max(bounds.y1, bounds.y2)
  }
}

export function clampToGrid(
  x: number,
  y: number,
  gridWidth: number,
  gridHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(gridWidth - 1, x)),
    y: Math.max(0, Math.min(gridHeight - 1, y))
  }
}

export interface CellPosition {
  x: number
  y: number
  cellX: number
  cellY: number
  isMajorGridLineX: boolean
  isMajorGridLineY: boolean
}

export function calculateCellPosition(
  x: number,
  y: number,
  cellSize: number,
  axisMargin: number,
  gridLineInterval: number
): CellPosition {
  const cellX = axisMargin + x * cellSize
  const cellY = axisMargin + y * cellSize
  const isMajorGridLineX = (x + 1) % gridLineInterval === 0
  const isMajorGridLineY = (y + 1) % gridLineInterval === 0

  return { x, y, cellX, cellY, isMajorGridLineX, isMajorGridLineY }
}

export interface LabelPosition {
  index: number
  x: number
  y: number
  isEdge: boolean
}

export function calculateAxisLabelPositions(
  dimension: number,
  cellSize: number,
  axisMargin: number,
  labelInterval: number
): LabelPosition[] {
  const positions: LabelPosition[] = []
  const halfAxisMargin = axisMargin / 2

  for (let i = 0; i < dimension; i++) {
    if (i === 0 || i === dimension - 1 || (i + 1) % labelInterval === 0) {
      positions.push({
        index: i,
        x: axisMargin + i * cellSize + cellSize / 2,
        y: halfAxisMargin,
        isEdge: i === 0 || i === dimension - 1
      })
    }
  }

  return positions
}

export interface PreviewOverlay {
  cells: Array<{ x: number; y: number }>
  bounds?: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  fillColor: string
  strokeColor: string
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
  }
}

export function drawPatternToCanvas(
  ctx: CanvasRenderingContext2D,
  _canvas: HTMLCanvasElement,
  patternGrid: PatternCell[][],
  options: Partial<RenderOptions> = {}
): void {
  const opts: RenderOptions = { ...DEFAULT_RENDER_OPTIONS, ...options }
  const {
    gridWidth,
    gridHeight,
    cellSize,
    axisMargin,
    showNumbers,
    showCoordinateBorder,
    gridLineColor,
    majorGridLineWidth,
    minorGridLineWidth
  } = opts

  if (!patternGrid.length || !patternGrid[0]) return

  const borderOffset = showCoordinateBorder ? 1 : 0
  const effGridWidth = gridWidth + borderOffset * 2
  const effGridHeight = gridHeight + borderOffset * 2

  const pw = effGridWidth * cellSize + axisMargin * 2
  const ph = effGridHeight * cellSize + axisMargin * 2

  ctx.clearRect(0, 0, pw, ph)

  if (showCoordinateBorder) {
    drawCoordinateBorderFill(ctx, gridWidth, gridHeight, cellSize, axisMargin)
  }

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = patternGrid[y]?.[x]
      if (!cell) continue

      const cellX = axisMargin + (x + borderOffset) * cellSize
      const cellY = axisMargin + (y + borderOffset) * cellSize

      const highlightActive = opts.highlightedColorKeys && opts.highlightedColorKeys.size > 0
      const cellKey = highlightActive ? `${cell.color.r},${cell.color.g},${cell.color.b}` : ''
      if (highlightActive) {
        ctx.globalAlpha = opts.highlightedColorKeys!.has(cellKey) ? 1.0 : 0.25
      }

      ctx.fillStyle = `rgb(${cell.color.r}, ${cell.color.g}, ${cell.color.b})`
      ctx.fillRect(cellX, cellY, cellSize, cellSize)
      ctx.globalAlpha = 1.0

      if (showNumbers && cellSize >= 20 && cell.code) {
        if (highlightActive && !opts.highlightedColorKeys!.has(cellKey)) {
          continue
        }
        const colorCode = cell.code
        let fontSize = cellSize * 0.55

        ctx.font = `${fontSize}px Arial`
        const textWidth = ctx.measureText(colorCode).width

        if (textWidth > cellSize * 0.75) {
          fontSize = ((cellSize * 0.75) / textWidth) * fontSize
          ctx.font = `${fontSize}px Arial`
        }

        const textX = cellX + cellSize / 2
        const textY = cellY + cellSize / 2

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'
        ctx.lineWidth = 2
        ctx.strokeText(colorCode, textX, textY)
        ctx.fillStyle = getContrastColor(cell.color.r, cell.color.g, cell.color.b)
        ctx.fillText(colorCode, textX, textY)
      }
    }
  }
  const offset = axisMargin
  const lineStartX = axisMargin
  const lineStartY = axisMargin
  const lineEndX = axisMargin + effGridWidth * cellSize
  const lineEndY = axisMargin + effGridHeight * cellSize

  if (showCoordinateBorder) {
    // 所有网格线（含坐标边框）统一用细线
    ctx.beginPath()
    ctx.strokeStyle = gridLineColor.minor
    ctx.lineWidth = minorGridLineWidth
    for (let i = 0; i <= effGridWidth; i++) {
      ctx.moveTo(i * cellSize + offset, lineStartY)
      ctx.lineTo(i * cellSize + offset, lineEndY)
    }
    for (let j = 0; j <= effGridHeight; j++) {
      ctx.moveTo(lineStartX, j * cellSize + offset)
      ctx.lineTo(lineEndX, j * cellSize + offset)
    }
    ctx.stroke()

    // 仅拼豆图纸内部按每5格画粗线（排除坐标边框格子）
    ctx.beginPath()
    ctx.strokeStyle = gridLineColor.major
    ctx.lineWidth = majorGridLineWidth
    for (let i = 1; i <= gridWidth + 1; i++) {
      if ((i - 1) % 5 === 0) {
        ctx.moveTo(i * cellSize + offset, lineStartY)
        ctx.lineTo(i * cellSize + offset, lineEndY)
      }
    }
    for (let j = 1; j <= gridHeight + 1; j++) {
      if ((j - 1) % 5 === 0) {
        ctx.moveTo(lineStartX, j * cellSize + offset)
        ctx.lineTo(lineEndX, j * cellSize + offset)
      }
    }
    ctx.stroke()
  } else {
    // 画所有的细线
    ctx.beginPath()
    ctx.strokeStyle = gridLineColor.minor
    ctx.lineWidth = minorGridLineWidth

    // 画垂直方向的细线
    for (let i = 0; i <= effGridWidth; i++) {
      if (i % 5 !== 0) {
        ctx.moveTo(i * cellSize + offset, lineStartY)
        ctx.lineTo(i * cellSize + offset, lineEndY)
      }
    }
    // 画水平方向的细线
    for (let j = 0; j <= effGridHeight; j++) {
      if (j % 5 !== 0) {
        ctx.moveTo(lineStartX, j * cellSize + offset)
        ctx.lineTo(lineEndX, j * cellSize + offset)
      }
    }
    ctx.stroke()

    // 画所有的粗线
    ctx.beginPath()
    ctx.strokeStyle = gridLineColor.major
    ctx.lineWidth = majorGridLineWidth

    // 画垂直方向的粗线
    for (let i = 0; i <= effGridWidth; i++) {
      if (i % 5 === 0) {
        ctx.moveTo(i * cellSize + offset, lineStartY)
        ctx.lineTo(i * cellSize + offset, lineEndY)
      }
    }
    // 画水平方向的粗线
    for (let j = 0; j <= effGridHeight; j++) {
      if (j % 5 === 0) {
        ctx.moveTo(lineStartX, j * cellSize + offset)
        ctx.lineTo(lineEndX, j * cellSize + offset)
      }
    }
    ctx.stroke()
  }

  if (showCoordinateBorder) {
    drawCoordinateBorderLabels(ctx, gridWidth, gridHeight, cellSize, axisMargin)
  } else if (showNumbers) {
    drawAxisLabels(ctx, pw, ph, gridWidth, gridHeight, cellSize, axisMargin)
  }
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  pw: number,
  ph: number,
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  axisMargin: number
): void {
  ctx.save()

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, pw, axisMargin)
  ctx.fillRect(0, 0, axisMargin, ph)
  ctx.fillRect(0, ph - axisMargin, pw, axisMargin)
  ctx.fillRect(pw - axisMargin, 0, axisMargin, ph)

  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(axisMargin, axisMargin)
  ctx.lineTo(axisMargin, ph - axisMargin)
  ctx.moveTo(axisMargin, axisMargin)
  ctx.lineTo(pw - axisMargin, axisMargin)
  ctx.stroke()

  ctx.fillStyle = '#333'
  ctx.font = 'bold 12px Arial'
  ctx.textBaseline = 'middle'

  const labelInterval = cellSize >= 20 ? 1 : 5

  for (let i = 0; i < gridWidth; i++) {
    if (i === 0 || i === gridWidth - 1 || (i + 1) % labelInterval === 0) {
      const label = `${i + 1}`
      const x = axisMargin + i * cellSize + cellSize / 2
      const topY = axisMargin / 2
      const bottomY = ph - axisMargin / 2

      ctx.textAlign = 'center'
      ctx.fillText(label, x, topY)
      ctx.fillText(label, x, bottomY)
    }
  }

  for (let i = 0; i < gridHeight; i++) {
    if (i === 0 || i === gridHeight - 1 || (i + 1) % labelInterval === 0) {
      const label = `${i + 1}`
      const y = axisMargin + i * cellSize + cellSize / 2
      const leftX = axisMargin / 2
      const rightX = pw - axisMargin / 2

      ctx.textAlign = 'right'
      ctx.fillText(label, leftX, y)
      ctx.textAlign = 'left'
      ctx.fillText(label, rightX, y)
    }
  }

  ctx.restore()
}

function drawCoordinateBorderFill(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  axisMargin: number
): void {
  ctx.fillStyle = '#f0f0f0'

  for (let c = 0; c <= gridWidth + 1; c++) {
    ctx.fillRect(axisMargin + c * cellSize, axisMargin, cellSize, cellSize)
    ctx.fillRect(
      axisMargin + c * cellSize,
      axisMargin + (gridHeight + 1) * cellSize,
      cellSize,
      cellSize
    )
  }

  for (let r = 1; r <= gridHeight; r++) {
    ctx.fillRect(axisMargin, axisMargin + r * cellSize, cellSize, cellSize)
    ctx.fillRect(
      axisMargin + (gridWidth + 1) * cellSize,
      axisMargin + r * cellSize,
      cellSize,
      cellSize
    )
  }
}

function drawCoordinateBorderLabels(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  cellSize: number,
  axisMargin: number
): void {
  ctx.save()

  const fontSize = Math.max(Math.min(cellSize * 0.45, 12), 7)
  ctx.fillStyle = '#555'
  ctx.font = `bold ${fontSize}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let c = 1; c <= gridWidth; c++) {
    const label = `${c}`
    const x = axisMargin + c * cellSize + cellSize / 2
    const topY = axisMargin + cellSize / 2
    const bottomY = axisMargin + (gridHeight + 1) * cellSize + cellSize / 2
    ctx.fillText(label, x, topY)
    ctx.fillText(label, x, bottomY)
  }

  for (let r = 1; r <= gridHeight; r++) {
    const label = `${r}`
    const y = axisMargin + r * cellSize + cellSize / 2
    const leftX = axisMargin + cellSize / 2
    const rightX = axisMargin + (gridWidth + 1) * cellSize + cellSize / 2
    ctx.fillText(label, leftX, y)
    ctx.fillText(label, rightX, y)
  }

  ctx.restore()
}

export function drawPreviewOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: PreviewOverlay,
  cellSize: number,
  axisMargin: number
): void {
  if (!overlay.cells.length) return

  ctx.save()

  ctx.fillStyle = overlay.fillColor
  overlay.cells.forEach(({ x, y }) => {
    ctx.fillRect(axisMargin + x * cellSize, axisMargin + y * cellSize, cellSize, cellSize)
  })

  if (overlay.bounds) {
    const { x1, y1, x2, y2 } = normalizeGridBounds(overlay.bounds)
    ctx.strokeStyle = overlay.strokeColor
    ctx.lineWidth = 2
    ctx.strokeRect(
      axisMargin + x1 * cellSize,
      axisMargin + y1 * cellSize,
      (x2 - x1 + 1) * cellSize,
      (y2 - y1 + 1) * cellSize
    )
  }

  ctx.restore()
}
