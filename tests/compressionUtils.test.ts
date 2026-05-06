import { describe, it, expect } from 'vitest'
import {
  compressPatternGrid,
  buildReverseBrandMapping,
  decompressPatternGrid
} from '../src/utils/compressionUtils'
import type { PatternCell, PerlerColor } from '../src/utils/patternUtils'

const makeColor = (r: number, g: number, b: number, hex: string, info?: Record<string, string>): PerlerColor => ({
  r, g, b, hex, info: info ?? {}
})

const makeCell = (color: PerlerColor, code: string): PatternCell => ({ color, code })

const red = makeColor(250, 244, 200, '#FAF4C8', { MARD: 'A01', COCO: 'E02' })
const green = makeColor(255, 255, 213, '#FFFFD5', { MARD: 'A02', COCO: 'E01' })

describe('compressPatternGrid', () => {
  it('空grid产生正确格式', () => {
    expect(compressPatternGrid([], 0, 0, 'MARD')).toBe('MARD:0x0||')
  })

  it('单格压缩，count=1省略前缀', () => {
    const grid: PatternCell[][] = [[makeCell(red, 'A01')]]
    expect(compressPatternGrid(grid, 1, 1, 'MARD')).toBe('MARD:1x1|A01|0')
  })

  it('两个连续同色格合并为一个run', () => {
    const grid: PatternCell[][] = [
      [makeCell(red, 'A01'), makeCell(red, 'A01')]
    ]
    expect(compressPatternGrid(grid, 2, 1, 'MARD')).toBe('MARD:2x1|A01|2:0')
  })

  it('两个不同色格不合并，count=1省略', () => {
    const grid: PatternCell[][] = [
      [makeCell(red, 'A01'), makeCell(green, 'A02')]
    ]
    expect(compressPatternGrid(grid, 2, 1, 'MARD')).toBe('MARD:2x1|A01,A02|0,1')
  })

  it('多行网格跨行也合并', () => {
    const grid: PatternCell[][] = [
      [makeCell(red, 'A01'), makeCell(red, 'A01')],
      [makeCell(red, 'A01'), makeCell(red, 'A01')]
    ]
    expect(compressPatternGrid(grid, 2, 2, 'MARD')).toBe('MARD:2x2|A01|4:0')
  })

  it('无品牌信息的颜色用_代替', () => {
    const noBrand = makeColor(100, 100, 100, '#646464')
    const grid: PatternCell[][] = [[makeCell(noBrand, '')]]
    expect(compressPatternGrid(grid, 1, 1, 'MARD')).toBe('MARD:1x1|_|0')
  })

  it('不同品牌产生不同代码，品牌写入头部', () => {
    const grid: PatternCell[][] = [[makeCell(red, 'A01')]]
    const resultMard = compressPatternGrid(grid, 1, 1, 'MARD')
    const resultCoco = compressPatternGrid(grid, 1, 1, 'COCO')
    expect(resultMard).toBe('MARD:1x1|A01|0')
    expect(resultCoco).toBe('COCO:1x1|E02|0')
  })

  it('空行正确处理（白色用_）', () => {
    const white = makeColor(255, 255, 255, '#FFFFFF')
    const grid: PatternCell[][] = [
      [makeCell(white, ''), makeCell(white, '')]
    ]
    expect(compressPatternGrid(grid, 2, 1, 'MARD')).toBe('MARD:2x1|_|2:0')
  })
})

describe('buildReverseBrandMapping', () => {
  it('MARD品牌返回code到hex的映射', () => {
    const map = buildReverseBrandMapping('MARD')
    expect(map['A01']).toBe('#FAF4C8')
    expect(map['A02']).toBe('#FFFFD5')
  })

  it('COCO品牌返回映射', () => {
    const map = buildReverseBrandMapping('COCO')
    expect(map['E02']).toBe('#FAF4C8')
    expect(map['E01']).toBe('#FFFFD5')
  })

  it('未知品牌返回空对象', () => {
    expect(buildReverseBrandMapping('UNKNOWN')).toEqual({})
  })
})

describe('decompressPatternGrid', () => {
  it('往返：压缩再解压得到一致的尺寸和codes', () => {
    const grid: PatternCell[][] = [
      [makeCell(red, 'A01'), makeCell(green, 'A02')],
      [makeCell(green, 'A02'), makeCell(red, 'A01')]
    ]
    const compressed = compressPatternGrid(grid, 2, 2, 'MARD')
    const decompressed = decompressPatternGrid(compressed)
    expect(decompressed).not.toBeNull()
    expect(decompressed!.gridWidth).toBe(2)
    expect(decompressed!.gridHeight).toBe(2)
    expect(decompressed!.patternGrid[0][0].code).toBe('A01')
    expect(decompressed!.patternGrid[0][1].code).toBe('A02')
    expect(decompressed!.patternGrid[1][0].code).toBe('A02')
    expect(decompressed!.patternGrid[1][1].code).toBe('A01')
  })

  it('往返：空白格_变为空code', () => {
    const white = makeColor(255, 255, 255, '#FFFFFF')
    const grid: PatternCell[][] = [[makeCell(white, '')]]
    const compressed = compressPatternGrid(grid, 1, 1, 'MARD')
    const decompressed = decompressPatternGrid(compressed)
    expect(decompressed!.patternGrid[0][0].code).toBe('')
  })

  it('缺少|返回null', () => {
    expect(decompressPatternGrid('30x30')).toBeNull()
  })

  it('无效宽度返回null', () => {
    expect(decompressPatternGrid('MARD:0x30|A01|0')).toBeNull()
  })

  it('无效高度返回null', () => {
    expect(decompressPatternGrid('MARD:30x0|A01|0')).toBeNull()
  })

  it('负数尺寸返回null', () => {
    expect(decompressPatternGrid('MARD:-1x30|A01|0')).toBeNull()
  })

  it('NaN尺寸返回null', () => {
    expect(decompressPatternGrid('MARD:abcx30|A01|0')).toBeNull()
  })

  it('头部缺少品牌返回null', () => {
    expect(decompressPatternGrid('30x30|palette|runs')).toBeNull()
  })

  it('count为0返回null', () => {
    expect(decompressPatternGrid('MARD:1x1|A01|0:0')).toBeNull()
  })

  it('count为NaN返回null', () => {
    expect(decompressPatternGrid('MARD:1x1|A01|abc:0')).toBeNull()
  })

  it('palette索引越界返回null', () => {
    expect(decompressPatternGrid('MARD:1x1|A01|1')).toBeNull()
  })

  it('行数不匹配返回null', () => {
    expect(decompressPatternGrid('MARD:1x2|A01|0')).toBeNull()
  })
})
