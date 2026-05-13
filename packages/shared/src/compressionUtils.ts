import type { PatternCell, PerlerColor } from './patternUtils'
import colorSystemMapping from './colorMap/colorSystemMapping.json'

/**
 * 压缩拼豆图纸为字符串。
 * 格式: BRAND:WxH|palette|runs
 * - palette: 逗号分隔的唯一颜色代码列表（索引即位置）
 * - runs: 逗号分隔的游程，格式为 `count:index`（count=1 时省略为 `index`）
 */
export function compressPatternGrid(
  patternGrid: PatternCell[][],
  gridWidth: number,
  gridHeight: number,
  selectedBrand: string
): string {
  const codeToIndex: Record<string, number> = {}
  const palette: string[] = []

  const getIndex = (code: string): number => {
    if (codeToIndex[code] === undefined) {
      codeToIndex[code] = palette.length
      palette.push(code)
    }
    return codeToIndex[code]
  }

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
          const idx = getIndex(currentCode)
          runs.push(currentCount === 1 ? `${idx}` : `${currentCount}:${idx}`)
        }
        currentCode = code
        currentCount = 1
      }
    }
  }

  if (currentCount > 0 && currentCode !== null) {
    const idx = getIndex(currentCode)
    runs.push(currentCount === 1 ? `${idx}` : `${currentCount}:${idx}`)
  }

  return `${selectedBrand}:${gridWidth}x${gridHeight}|${palette.join(',')}|${runs.join(',')}`
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
  compressed: string
): { patternGrid: PatternCell[][]; gridWidth: number; gridHeight: number } | null {
  try {
    const parts = compressed.split('|')
    if (parts.length !== 3) return null

    const [header, paletteStr, runsStr] = parts

    const colonIdx = header.indexOf(':')
    if (colonIdx === -1) return null
    const brand = header.substring(0, colonIdx)
    const dimsStr = header.substring(colonIdx + 1)

    const dims = dimsStr.split('x')
    const gridWidth = parseInt(dims[0])
    const gridHeight = parseInt(dims[1])
    if (isNaN(gridWidth) || isNaN(gridHeight) || gridWidth <= 0 || gridHeight <= 0) return null

    const palette = paletteStr ? paletteStr.split(',') : []
    const reverseMap = buildReverseBrandMapping(brand)

    const paletteLookup: { color: PerlerColor; code: string }[] = palette.map((code) => {
      if (code === '_') {
        return { color: hexToColor('#FFFFFF'), code: '' }
      }
      const hex = reverseMap[code] || '#FFFFFF'
      return { color: hexToColor(hex), code }
    })

    const runs = runsStr ? runsStr.split(',') : []
    const grid: PatternCell[][] = []
    let currentRow: PatternCell[] = []

    for (const run of runs) {
      let count: number
      let index: number

      const colonIdx = run.indexOf(':')
      if (colonIdx === -1) {
        count = 1
        index = parseInt(run)
      } else {
        count = parseInt(run.substring(0, colonIdx))
        index = parseInt(run.substring(colonIdx + 1))
      }

      if (
        isNaN(count) ||
        count <= 0 ||
        isNaN(index) ||
        index < 0 ||
        index >= paletteLookup.length
      ) {
        return null
      }

      const entry = paletteLookup[index]
      for (let i = 0; i < count; i++) {
        currentRow.push({ color: entry.color, code: entry.code })
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
