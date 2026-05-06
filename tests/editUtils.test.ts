import { describe, it, expect } from 'vitest'
import { clonePatternGrid, areColorsEqual, fillConnectedRegion } from '../src/utils/editUtils'
import type { PerlerColor, PatternCell } from '../src/utils/patternUtils'

const makeRed: PerlerColor = { r: 255, g: 0, b: 0, hex: '#FF0000' }
const makeGreen: PerlerColor = { r: 0, g: 255, b: 0, hex: '#00FF00' }
const makeBlue: PerlerColor = { r: 0, g: 0, b: 255, hex: '#0000FF' }

const makeCell = (color: PerlerColor, code: string): PatternCell => ({ color, code })

describe('clonePatternGrid', () => {
  it('深拷贝后修改不影啍原始grid', () => {
    const original: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const cloned = clonePatternGrid(original)
    cloned[0][0].color = { ...makeGreen }

    expect(original[0][0].color.r).toBe(255)
    expect(original[0][0].color.g).toBe(0)
    expect(cloned[0][0].color.r).toBe(0)
    expect(cloned[0][0].color.g).toBe(255)
  })

  it('修改cloned的code不影响原始', () => {
    const original: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const cloned = clonePatternGrid(original)
    cloned[0][0].code = 'CHANGED'

    expect(original[0][0].code).toBe('R01')
    expect(cloned[0][0].code).toBe('CHANGED')
  })

  it('空grid返回空数组', () => {
    expect(clonePatternGrid([])).toEqual([])
  })

  it('多行多列深拷贝正确', () => {
    const original: PatternCell[][] = [
      [makeCell(makeRed, 'R01'), makeCell(makeGreen, 'G01')],
      [makeCell(makeBlue, 'B01'), makeCell(makeRed, 'R01')]
    ]
    const cloned = clonePatternGrid(original)
    expect(cloned).toHaveLength(2)
    expect(cloned[0]).toHaveLength(2)
    cloned[1][0].code = 'XX'
    expect(original[1][0].code).toBe('B01')
  })
})

describe('areColorsEqual', () => {
  it('相同颜色返回true', () => {
    expect(areColorsEqual(makeRed, { ...makeRed })).toBe(true)
  })

  it('不同r返回false', () => {
    expect(areColorsEqual(makeRed, { r: 254, g: 0, b: 0, hex: '#FE0000' })).toBe(false)
  })

  it('不同g返回false', () => {
    expect(areColorsEqual(makeRed, { r: 255, g: 1, b: 0, hex: '#FF0100' })).toBe(false)
  })

  it('不同b返回false', () => {
    expect(areColorsEqual(makeRed, { r: 255, g: 0, b: 1, hex: '#FF0001' })).toBe(false)
  })

  it('相同RGB不同hex返回false', () => {
    expect(areColorsEqual(makeRed, { r: 255, g: 0, b: 0, hex: '#ff0000' })).toBe(false)
  })

  it('同一引用返回true', () => {
    expect(areColorsEqual(makeRed, makeRed)).toBe(true)
  })
})

describe('fillConnectedRegion', () => {
  it('单格区域填充', () => {
    const grid: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const result = fillConnectedRegion(grid, 0, 0, makeGreen, 'G01')
    expect(result[0][0].color.r).toBe(0)
    expect(result[0][0].code).toBe('G01')
  })

  it('2x2同色区域全部填充', () => {
    const grid: PatternCell[][] = [
      [makeCell(makeRed, 'R01'), makeCell(makeRed, 'R01')],
      [makeCell(makeRed, 'R01'), makeCell(makeRed, 'R01')]
    ]
    const result = fillConnectedRegion(grid, 0, 0, makeGreen, 'G01')
    expect(result[0][0].code).toBe('G01')
    expect(result[0][1].code).toBe('G01')
    expect(result[1][0].code).toBe('G01')
    expect(result[1][1].code).toBe('G01')
  })

  it('相同颜色且相同代码时不填充(提前返回)', () => {
    const grid: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const result = fillConnectedRegion(grid, 0, 0, makeRed, 'R01')
    expect(result[0][0].code).toBe('R01')
  })

  it('相同颜色但不同代码继续填充', () => {
    const grid: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const result = fillConnectedRegion(grid, 0, 0, makeRed, 'R02')
    expect(result[0][0].code).toBe('R02')
  })

  it('不同颜色阻隔不填充', () => {
    const grid: PatternCell[][] = [
      [makeCell(makeRed, 'R01'), makeCell(makeGreen, 'G01')],
      [makeCell(makeRed, 'R01'), makeCell(makeRed, 'R01')]
    ]
    const result = fillConnectedRegion(grid, 0, 0, makeBlue, 'B01')
    expect(result[0][0].code).toBe('B01')
    expect(result[0][1].code).toBe('G01') // 不填充
    expect(result[1][0].code).toBe('B01')
    expect(result[1][1].code).toBe('B01')
  })

  it('x越界返回原grid', () => {
    const grid: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const result = fillConnectedRegion(grid, 5, 0, makeGreen, 'G01')
    expect(result[0][0].code).toBe('R01')
  })

  it('y越界返回原grid', () => {
    const grid: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const result = fillConnectedRegion(grid, 0, 5, makeGreen, 'G01')
    expect(result[0][0].code).toBe('R01')
  })

  it('负坐标返回原grid', () => {
    const grid: PatternCell[][] = [[makeCell(makeRed, 'R01')]]
    const result = fillConnectedRegion(grid, -1, 0, makeGreen, 'G01')
    expect(result[0][0].code).toBe('R01')
  })

  it('空grid不变', () => {
    const grid: PatternCell[][] = []
    const result = fillConnectedRegion(grid, 0, 0, makeGreen, 'G01')
    expect(result).toEqual([])
  })

  it('对角线方向不填充（仅4方向）', () => {
    const grid: PatternCell[][] = [
      [makeCell(makeRed, 'R01'), makeCell(makeGreen, 'G01')],
      [makeCell(makeGreen, 'G01'), makeCell(makeRed, 'R01')]
    ]
    const result = fillConnectedRegion(grid, 0, 0, makeBlue, 'B01')
    expect(result[0][0].code).toBe('B01')
    expect(result[0][1].code).toBe('G01') // 对角线不填充
    expect(result[1][0].code).toBe('G01')
    expect(result[1][1].code).toBe('R01')
  })

  it('访问数组防止循环填充', () => {
    // 4x4 全红，填充全部, visited数组防止无限循环
    const grid: PatternCell[][] = Array.from({ length: 4 }, () =>
      Array.from({ length: 4 }, () => makeCell(makeRed, 'R01'))
    )
    const result = fillConnectedRegion(grid, 0, 0, makeGreen, 'G01')
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        expect(result[y][x].code).toBe('G01')
      }
    }
  })

  it('边界上的格子正确填充', () => {
    const grid: PatternCell[][] = [
      [makeCell(makeRed, 'R01'), makeCell(makeRed, 'R01')],
      [makeCell(makeRed, 'R01'), makeCell(makeRed, 'R01')]
    ]
    const result = fillConnectedRegion(grid, 0, 0, makeGreen, 'G01')
    expect(result[0][0].code).toBe('G01')
  })
})
