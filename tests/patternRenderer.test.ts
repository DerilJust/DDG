import { describe, it, expect } from 'vitest'
import {
  getContrastColor,
  normalizeGridBounds,
  clampToGrid,
  calculateCellPosition,
  calculateAxisLabelPositions,
  createPreviewOverlay
} from '../src/utils/patternRenderer'
import type { GridBounds } from '../src/utils/patternRenderer'

describe('getContrastColor', () => {
  it('白色背景返回黑色文字', () => {
    expect(getContrastColor(255, 255, 255)).toBe('#000000')
  })

  it('黑色背景返回白色文字', () => {
    expect(getContrastColor(0, 0, 0)).toBe('#ffffff')
  })

  it('亮度=128返回白色（不大于128）', () => {
    // 128 * 299 + 128 * 587 + 128 * 114 = 1000*128 = 128000 /1000 = 128
    expect(getContrastColor(128, 128, 128)).toBe('#ffffff')
  })

  it('红色返回白色', () => {
    // 255*299=76245 /1000=76.245 <128
    expect(getContrastColor(255, 0, 0)).toBe('#ffffff')
  })

  it('黄绿色返回黑色', () => {
    // 100*299 + 200*587 + 50*114 = 29900+117400+5700 /1000 = 153 > 128
    expect(getContrastColor(100, 200, 50)).toBe('#000000')
  })
})

describe('normalizeGridBounds', () => {
  it('已经规范化的边界不变', () => {
    const bounds: GridBounds = { x1: 0, y1: 0, x2: 10, y2: 20 }
    expect(normalizeGridBounds(bounds)).toEqual(bounds)
  })

  it('x1>x2时交换', () => {
    const bounds: GridBounds = { x1: 10, y1: 0, x2: 0, y2: 20 }
    const result = normalizeGridBounds(bounds)
    expect(result.x1).toBe(0)
    expect(result.x2).toBe(10)
  })

  it('y1>y2时交换', () => {
    const bounds: GridBounds = { x1: 0, y1: 20, x2: 10, y2: 0 }
    const result = normalizeGridBounds(bounds)
    expect(result.y1).toBe(0)
    expect(result.y2).toBe(20)
  })

  it('两轴都反转', () => {
    const bounds: GridBounds = { x1: 10, y1: 20, x2: 0, y2: 0 }
    const result = normalizeGridBounds(bounds)
    expect(result).toEqual({ x1: 0, y1: 0, x2: 10, y2: 20 })
  })
})

describe('clampToGrid', () => {
  it('边界内点不变', () => {
    expect(clampToGrid(5, 5, 30, 30)).toEqual({ x: 5, y: 5 })
  })

  it('负x clamp到0', () => {
    expect(clampToGrid(-5, 5, 30, 30).x).toBe(0)
  })

  it('x>=gridW clamp到gridW-1', () => {
    expect(clampToGrid(100, 5, 30, 30).x).toBe(29)
  })

  it('负y clamp到0', () => {
    expect(clampToGrid(5, -5, 30, 30).y).toBe(0)
  })

  it('y>=gridH clamp到gridH-1', () => {
    expect(clampToGrid(5, 100, 30, 30).y).toBe(29)
  })
})

describe('calculateCellPosition', () => {
  const cellSize = 20
  const margin = 12
  const interval = 5

  it('(0,0)位置计算正确', () => {
    const pos = calculateCellPosition(0, 0, cellSize, margin, interval)
    expect(pos.cellX).toBe(12)
    expect(pos.cellY).toBe(12)
  })

  it('x=4时是major grid line（(4+1)%5===0）', () => {
    const pos = calculateCellPosition(4, 0, cellSize, margin, interval)
    expect(pos.isMajorGridLineX).toBe(true)
  })

  it('x=3时不是major grid line', () => {
    const pos = calculateCellPosition(3, 0, cellSize, margin, interval)
    expect(pos.isMajorGridLineX).toBe(false)
  })

  it('x=9时也是major grid line', () => {
    const pos = calculateCellPosition(9, 0, cellSize, margin, interval)
    expect(pos.isMajorGridLineX).toBe(true)
  })

  it('普通格子位置按公式计算', () => {
    const pos = calculateCellPosition(2, 3, cellSize, margin, interval)
    expect(pos.cellX).toBe(12 + 2 * 20)
    expect(pos.cellY).toBe(12 + 3 * 20)
    expect(pos.x).toBe(2)
    expect(pos.y).toBe(3)
  })
})

describe('calculateAxisLabelPositions', () => {
  it('首尾总是包含标签', () => {
    const positions = calculateAxisLabelPositions(30, 20, 12, 5)
    expect(positions[0].index).toBe(0)
    expect(positions[positions.length - 1].index).toBe(29)
  })

  it('中间按interval产生标签', () => {
    const positions = calculateAxisLabelPositions(30, 20, 12, 5)
    const indices = positions.map((p) => p.index)
    // 30个格子, interval=5: 有标签的为 0, 4, 9, 14, 19, 24, 29
    expect(indices).toContain(4)
    expect(indices).toContain(9)
    expect(indices).toContain(14)
    expect(indices).toContain(19)
    expect(indices).toContain(24)
  })

  it('首尾isEdge为true', () => {
    const positions = calculateAxisLabelPositions(30, 20, 12, 5)
    expect(positions[0].isEdge).toBe(true)
    expect(positions[positions.length - 1].isEdge).toBe(true)
  })

  it('小dimension也正确', () => {
    const positions = calculateAxisLabelPositions(5, 20, 12, 5)
    expect(positions).toHaveLength(2) // 0 和 4
    expect(positions[0].index).toBe(0)
    expect(positions[1].index).toBe(4)
  })

  it('halfAxisMargin计算标签x坐标', () => {
    const positions = calculateAxisLabelPositions(10, 20, 12, 1)
    positions.forEach((p) => {
      expect(p.y).toBe(6) // halfAxisMargin = 12/2
    })
  })
})

describe('createPreviewOverlay', () => {
  it('创建rgba填充色', () => {
    const overlay = createPreviewOverlay([{ x: 0, y: 0 }], { r: 255, g: 0, b: 0 })
    expect(overlay.fillColor).toBe('rgba(255, 0, 0, 0.45)')
  })

  it('默认描边色为#409EFF', () => {
    const overlay = createPreviewOverlay([{ x: 0, y: 0 }], { r: 0, g: 0, b: 0 })
    expect(overlay.strokeColor).toBe('#409EFF')
  })

  it('自定义描边色', () => {
    const overlay = createPreviewOverlay([{ x: 0, y: 0 }], { r: 0, g: 0, b: 0 }, '#FF0000')
    expect(overlay.strokeColor).toBe('#FF0000')
  })

  it('颜色值正确映射', () => {
    const overlay = createPreviewOverlay([{ x: 1, y: 2 }], { r: 100, g: 150, b: 200 })
    expect(overlay.fillColor).toBe('rgba(100, 150, 200, 0.45)')
    expect(overlay.cells).toEqual([{ x: 1, y: 2 }])
  })
})
