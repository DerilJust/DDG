import type { PatternCell, PerlerColor } from './patternUtils'
import colorSystemMapping from '../colorMap/colorSystemMapping.json'

export function compressPatternGrid(
  patternGrid: PatternCell[][],
  gridWidth: number,
  gridHeight: number,
  selectedBrand: string
): string {
  const runs: string[] = []
  let currentCode: string | null = null
  let currentCount = 0

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const cell = patternGrid[y]?.[x]
      const code = (cell?.color?.info?.[selectedBrand] as string | undefined) || '_'

      if (code === currentCode) {
        currentCount++
      } else {
        if (currentCount > 0 && currentCode !== null) {
          runs.push(`${currentCount}:${currentCode}`)
        }
        currentCode = code
        currentCount = 1
      }
    }
  }

  if (currentCount > 0 && currentCode !== null) {
    runs.push(`${currentCount}:${currentCode}`)
  }

  return `${gridWidth}x${gridHeight}|${runs.join(',')}`
}

export function buildReverseBrandMapping(brand: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const [hex, info] of Object.entries(colorSystemMapping)) {
    const code = (info as Record<string, string>)[brand]
    if (code) {
      map[code] = hex
    }
  }
  return map
}

function hexToColor(hex: string): PerlerColor {
  const r = parseInt(hex.substring(1, 3), 16)
  const g = parseInt(hex.substring(3, 5), 16)
  const b = parseInt(hex.substring(5, 7), 16)
  return { r, g, b, hex, info: {} }
}

export function decompressPatternGrid(
  compressed: string,
  selectedBrand: string
): { patternGrid: PatternCell[][]; gridWidth: number; gridHeight: number } | null {
  try {
    const pipeIdx = compressed.indexOf('|')
    if (pipeIdx === -1) return null
    const header = compressed.substring(0, pipeIdx)
    const runsStr = compressed.substring(pipeIdx + 1)
    const dims = header.split('x')
    const gridWidth = parseInt(dims[0])
    const gridHeight = parseInt(dims[1])
    if (isNaN(gridWidth) || isNaN(gridHeight) || gridWidth <= 0 || gridHeight <= 0) return null

    const reverseMap = buildReverseBrandMapping(selectedBrand)
    const runs = runsStr.split(',')
    const grid: PatternCell[][] = []
    let currentRow: PatternCell[] = []

    for (const run of runs) {
      const colonIdx = run.indexOf(':')
      if (colonIdx === -1) return null
      const count = parseInt(run.substring(0, colonIdx))
      const code = run.substring(colonIdx + 1)
      if (isNaN(count) || count <= 0) return null

      const hex = code === '_' ? '#FFFFFF' : (reverseMap[code] || '#FFFFFF')
      const color = hexToColor(hex)
      const finalCode = code === '_' ? '' : code

      for (let i = 0; i < count; i++) {
        currentRow.push({ color, code: finalCode })
        if (currentRow.length === gridWidth) {
          grid.push(currentRow)
          currentRow = []
        }
      }
    }

    if (currentRow.length > 0 || grid.length !== gridHeight) return null
    return { patternGrid: grid, gridWidth, gridHeight }
  } catch {
    return null
  }
}
