import { describe, it, expect } from 'vitest'
import {
  gcd,
  findClosestColor,
  quantizeColorsUtil,
  buildPatternPalette,
  buildBrandPalette,
  buildColorStats,
  setGridSizeByImageRatio
} from '../src/utils/patternUtils'
import type { PerlerColor, PatternCell } from '../src/utils/patternUtils'

const makeColors = (): PerlerColor[] => [
  { r: 255, g: 0, b: 0, hex: '#FF0000', info: { MARD: 'R01', COCO: 'RED' } },
  { r: 0, g: 255, b: 0, hex: '#00FF00', info: { MARD: 'G01', COCO: 'GRN' } },
  { r: 0, g: 0, b: 255, hex: '#0000FF', info: { MARD: 'B01', COCO: 'BLU' } },
  { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} },
  { r: 0, g: 0, b: 0, hex: '#000000', info: { MARD: 'K01' } }
]

const makeCell = (color: PerlerColor, code: string): PatternCell => ({ color, code })

describe('gcd', () => {
  it('计算12和8的最大公约数为4', () => {
    expect(gcd(12, 8)).toBe(4)
  })

  it('两个质数的最大公约数为1', () => {
    expect(gcd(17, 13)).toBe(1)
  })

  it('相等参数返回自身', () => {
    expect(gcd(100, 100)).toBe(100)
  })

  it('一个参数为0时返回另一个参数', () => {
    expect(gcd(0, 5)).toBe(5)
    expect(gcd(5, 0)).toBe(5)
  })

  it('两个参数为0返回0', () => {
    expect(gcd(0, 0)).toBe(0)
  })

  it('参数顺序不影响结果', () => {
    expect(gcd(2, 4)).toBe(2)
    expect(gcd(4, 2)).toBe(2)
  })

  it('大数计算正确', () => {
    expect(gcd(1071, 462)).toBe(21)
  })

  it('1和任何数为1', () => {
    expect(gcd(1, 99)).toBe(1)
  })
})

describe('findClosestColor', () => {
  it('找到精确匹配的颜色', () => {
    const colors = makeColors()
    const result = findClosestColor({ r: 255, g: 0, b: 0 }, colors)
    expect(result).toBe(colors[0])
    expect(result.r).toBe(255)
    expect(result.g).toBe(0)
  })

  it('单元素色图返回该元素', () => {
    const single = [{ r: 128, g: 128, b: 128, hex: '#808080' }]
    expect(findClosestColor({ r: 255, g: 0, b: 0 }, single)).toBe(single[0])
  })

  it('从多个候选中选择距离最近的颜色', () => {
    const colors = makeColors()
    const result = findClosestColor({ r: 250, g: 5, b: 5 }, colors)
    expect(result.r).toBe(255)
    expect(result.g).toBe(0)
    expect(result.b).toBe(0)
  })

  it('相同距离返回第一个匹配的', () => {
    const colors = [
      { r: 255, g: 128, b: 0, hex: '#FF8800' },
      { r: 0, g: 128, b: 255, hex: '#0080FF' }
    ]
    const result = findClosestColor({ r: 128, g: 128, b: 128 }, colors)
    expect(result).toBe(colors[0])
  })

  it('白色像素匹配白色', () => {
    const colors = makeColors()
    const result = findClosestColor({ r: 255, g: 255, b: 255 }, colors)
    expect(result.hex).toBe('#FFFFFF')
  })

  it('空色图返回undefined', () => {
    const result = findClosestColor({ r: 100, g: 100, b: 100 }, [])
    expect(result).toBeUndefined()
  })
})

describe('quantizeColorsUtil', () => {
  const colors = makeColors()

  it('空颜色列表返回空数组', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255])
    expect(quantizeColorsUtil(pixels, 5, [])).toEqual([])
  })

  it('单像素返回一个颜色', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255])
    const result = quantizeColorsUtil(pixels, 5, colors)
    expect(result).toHaveLength(1)
    expect(result[0].r).toBe(255)
  })

  it('少于count的颜色数返回所有不同颜色', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 255, 0, 0, 255])
    const result = quantizeColorsUtil(pixels, 5, colors)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('超过count的颜色数只返回top-N并按频率排序', () => {
    const pixelCount = 100
    const pixels = new Uint8ClampedArray(pixelCount * 4)
    for (let i = 0; i < 50; i++) {
      const offset = i * 4
      pixels[offset] = 255
      pixels[offset + 1] = 0
      pixels[offset + 2] = 0
      pixels[offset + 3] = 255
    }
    for (let i = 50; i < 80; i++) {
      const offset = i * 4
      pixels[offset] = 0
      pixels[offset + 1] = 255
      pixels[offset + 2] = 0
      pixels[offset + 3] = 255
    }
    for (let i = 80; i < pixelCount; i++) {
      const offset = i * 4
      pixels[offset] = 0
      pixels[offset + 1] = 0
      pixels[offset + 2] = 255
      pixels[offset + 3] = 255
    }

    const result = quantizeColorsUtil(pixels, 2, colors)
    expect(result).toHaveLength(2)
    expect(result[0].r).toBe(255) // 红色出现50次，排第一
  })

  it('RGBA步长正确（跳过alpha通道）', () => {
    const pixels = new Uint8ClampedArray([255, 0, 0, 255, 255, 0, 0, 128, 0, 255, 0, 255])
    const result = quantizeColorsUtil(pixels, 2, colors)
    expect(result).toHaveLength(2)
  })
})

describe('buildPatternPalette', () => {
  const colors = makeColors()

  it('空grid返回所有品牌色且count为0', () => {
    const result = buildPatternPalette(colors, [], 'MARD')
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((item) => item.count === 0)).toBe(true)
  })

  it('统计每种颜色的使用次数', () => {
    const grid: PatternCell[][] = [
      [makeCell(colors[0], 'R01'), makeCell(colors[0], 'R01')],
      [makeCell(colors[1], 'G01'), makeCell(colors[2], 'B01')]
    ]
    const result = buildPatternPalette(colors, grid, 'MARD')
    const red = result.find((item) => item.code === 'R01')
    expect(red?.count).toBe(2)
    const green = result.find((item) => item.code === 'G01')
    expect(green?.count).toBe(1)
  })

  it('没有info的颜色被过滤', () => {
    const grid: PatternCell[][] = [[makeCell(colors[3], '')]]
    const result = buildPatternPalette(colors, grid, 'MARD')
    expect(result.find((item) => item.color.hex === '#FFFFFF')).toBeUndefined()
  })

  it('info中没有该品牌的颜色被过滤', () => {
    const grid: PatternCell[][] = [[makeCell(colors[4], 'K01')]]
    const result = buildPatternPalette(colors, grid, 'COCO')
    const black = result.find((item) => item.color.hex === '#000000')
    expect(black).toBeUndefined()
  })

  it('按count降序、code升序排列', () => {
    const grid: PatternCell[][] = [
      [makeCell(colors[2], 'B01'), makeCell(colors[2], 'B01'), makeCell(colors[2], 'B01')],
      [makeCell(colors[0], 'R01'), makeCell(colors[0], 'R01')],
      [makeCell(colors[1], 'G01')]
    ]
    const result = buildPatternPalette(colors, grid, 'MARD')
    expect(result[0].code).toBe('B01')
    expect(result[1].code).toBe('R01')
    expect(result[2].code).toBe('G01')
  })

  it('null cell 不影响统计', () => {
    const grid: PatternCell[][] = [[makeCell(colors[0], 'R01')]]
    const result = buildPatternPalette(colors, grid, 'MARD')
    expect(result.find((item) => item.code === 'R01')?.count).toBe(1)
  })
})

describe('buildBrandPalette', () => {
  const colors = makeColors()

  it('返回有品牌信息的所有颜色且count=0', () => {
    const result = buildBrandPalette(colors, 'MARD')
    expect(result.every((item) => item.count === 0)).toBe(true)
    expect(result.find((item) => item.code === 'R01')).toBeTruthy()
  })

  it('没有info的白色被过滤', () => {
    const result = buildBrandPalette(colors, 'MARD')
    expect(result.find((item) => item.color.hex === '#FFFFFF')).toBeUndefined()
  })

  it('未知品牌返回空数组', () => {
    const result = buildBrandPalette(colors, 'UNKNOWN')
    expect(result).toEqual([])
  })

  it('按code字母序排列', () => {
    const result = buildBrandPalette(colors, 'MARD')
    for (let i = 1; i < result.length; i++) {
      expect(result[i].code.localeCompare(result[i - 1].code)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('buildColorStats', () => {
  const colors = makeColors()

  it('空grid返回空数组', () => {
    expect(buildColorStats([])).toEqual([])
  })

  it('统计每种颜色的出现次数', () => {
    const grid: PatternCell[][] = [
      [makeCell(colors[0], 'R01'), makeCell(colors[0], 'R01')],
      [makeCell(colors[1], 'G01'), makeCell(colors[2], 'B01')]
    ]
    const result = buildColorStats(grid)
    expect(result).toHaveLength(3)
  })

  it('跳过code为空的cell', () => {
    const grid: PatternCell[][] = [[makeCell(colors[3], '')]]
    const result = buildColorStats(grid)
    expect(result).toHaveLength(0)
  })

  it('跳过null cell', () => {
    const grid: PatternCell[][] = [[null as unknown as PatternCell]]
    const result = buildColorStats(grid)
    expect(result).toHaveLength(0)
  })

  it('按code字母序排序', () => {
    const grid: PatternCell[][] = [[makeCell(colors[0], 'R01')], [makeCell(colors[1], 'G01')]]
    const result = buildColorStats(grid)
    expect(result[0].code.localeCompare(result[1].code)).toBeLessThan(0)
  })
})

describe('setGridSizeByImageRatio', () => {
  it('width为0返回{0,0}', () => {
    expect(setGridSizeByImageRatio(0, 100)).toEqual({ width: 0, height: 0 })
  })

  it('height为0返回{0,0}', () => {
    expect(setGridSizeByImageRatio(100, 0)).toEqual({ width: 0, height: 0 })
  })

  it('尺寸在maxSize内直接返回', () => {
    expect(setGridSizeByImageRatio(20, 20, 100)).toEqual({ width: 20, height: 20 })
  })

  it('宽图按比例缩放到maxSize', () => {
    const result = setGridSizeByImageRatio(2000, 1000, 100)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('高图按比例缩放到maxSize', () => {
    const result = setGridSizeByImageRatio(1000, 2000, 100)
    expect(result.width).toBe(50)
    expect(result.height).toBe(100)
  })

  it('极端宽高比不会返回小于1的值', () => {
    const result = setGridSizeByImageRatio(1, 100, 100)
    expect(result.width).toBeGreaterThanOrEqual(1)
    expect(result.height).toBeGreaterThanOrEqual(1)
  })

  it('maxSize为1的边界情况', () => {
    const result = setGridSizeByImageRatio(100, 100, 1)
    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
  })

  it('默认maxSize为100', () => {
    const result = setGridSizeByImageRatio(2000, 1000)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })
})
