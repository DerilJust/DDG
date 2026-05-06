import { describe, it, expect } from 'vitest'
import {
  normalizeSelection,
  clampPointToGrid,
  getPendingCells,
  type SelectionRect,
  type PendingSelection
} from '../src/utils/selectionUtils'

describe('normalizeSelection', () => {
  const gridW = 30
  const gridH = 30

  it('边界内选区保持不变', () => {
    const rect: SelectionRect = { x1: 5, y1: 5, x2: 10, y2: 10 }
    const result = normalizeSelection(rect, gridW, gridH)
    expect(result).toEqual({ type: 'area', x1: 5, y1: 5, x2: 10, y2: 10 })
  })

  it('x1为负数clamp到0', () => {
    const rect: SelectionRect = { x1: -5, y1: 5, x2: 10, y2: 10 }
    const result = normalizeSelection(rect, gridW, gridH)
    expect(result.x1).toBe(0)
  })

  it('x2超过gridW-1时clamp', () => {
    const rect: SelectionRect = { x1: 5, y1: 5, x2: 35, y2: 10 }
    const result = normalizeSelection(rect, gridW, gridH)
    expect(result.x2).toBe(29)
  })

  it('y1为负数clamp到0', () => {
    const rect: SelectionRect = { x1: 5, y1: -5, x2: 10, y2: 10 }
    const result = normalizeSelection(rect, gridW, gridH)
    expect(result.y1).toBe(0)
  })

  it('y2超过gridH-1时clamp', () => {
    const rect: SelectionRect = { x1: 5, y1: 5, x2: 10, y2: 35 }
    const result = normalizeSelection(rect, gridW, gridH)
    expect(result.y2).toBe(29)
  })

  it('四角全越界', () => {
    const rect: SelectionRect = { x1: -10, y1: -10, x2: 100, y2: 100 }
    const result = normalizeSelection(rect, 10, 10)
    expect(result).toEqual({ type: 'area', x1: 0, y1: 0, x2: 9, y2: 9 })
  })
})

describe('clampPointToGrid', () => {
  it('边界内点保持不变', () => {
    expect(clampPointToGrid(5, 5, 30, 30)).toEqual({ x: 5, y: 5 })
  })

  it('负x clamp到0', () => {
    expect(clampPointToGrid(-5, 5, 30, 30).x).toBe(0)
  })

  it('x超界clamp到gridW-1', () => {
    expect(clampPointToGrid(100, 5, 30, 30).x).toBe(29)
  })

  it('负y clamp到0', () => {
    expect(clampPointToGrid(5, -5, 30, 30).y).toBe(0)
  })

  it('y超界clamp到gridH-1', () => {
    expect(clampPointToGrid(5, 100, 30, 30).y).toBe(29)
  })

  it('grid为1x1时所有输入都返回{0,0}', () => {
    expect(clampPointToGrid(100, 100, 1, 1)).toEqual({ x: 0, y: 0 })
    expect(clampPointToGrid(-1, -1, 1, 1)).toEqual({ x: 0, y: 0 })
  })
})

describe('getPendingCells', () => {
  it('null选区返回空数组', () => {
    expect(getPendingCells(null, 30, 30)).toEqual([])
  })

  it('cell类型返回单个点', () => {
    const sel: PendingSelection = { type: 'cell', x: 2, y: 3 }
    expect(getPendingCells(sel, 30, 30)).toEqual([{ x: 2, y: 3 }])
  })

  it('cell类型越界坐标clamp', () => {
    const sel: PendingSelection = { type: 'cell', x: 100, y: -5 }
    expect(getPendingCells(sel, 30, 30)).toEqual([{ x: 29, y: 0 }])
  })

  it('area类型x1<x2 y1<y2返回矩形所有格子', () => {
    const sel: PendingSelection = { type: 'area', x1: 0, y1: 0, x2: 1, y2: 1 }
    const cells = getPendingCells(sel, 30, 30)
    expect(cells).toHaveLength(4)
    expect(cells).toContainEqual({ x: 0, y: 0 })
    expect(cells).toContainEqual({ x: 1, y: 0 })
    expect(cells).toContainEqual({ x: 0, y: 1 })
    expect(cells).toContainEqual({ x: 1, y: 1 })
  })

  it('area类型x1>x2仍正常工作', () => {
    const sel: PendingSelection = { type: 'area', x1: 2, y1: 0, x2: 0, y2: 1 }
    const cells = getPendingCells(sel, 30, 30)
    expect(cells).toHaveLength(6)
  })

  it('area类型y1>y2仍正常工作', () => {
    const sel: PendingSelection = { type: 'area', x1: 0, y1: 2, x2: 1, y2: 0 }
    const cells = getPendingCells(sel, 30, 30)
    expect(cells).toHaveLength(6)
  })

  it('area类型越界坐标clamp', () => {
    const sel: PendingSelection = { type: 'area', x1: -5, y1: -5, x2: 100, y2: 100 }
    const cells = getPendingCells(sel, 10, 10)
    expect(cells).toHaveLength(100) // 10x10 全选
  })

  it('1x1 area返回单格', () => {
    const sel: PendingSelection = { type: 'area', x1: 5, y1: 5, x2: 5, y2: 5 }
    const cells = getPendingCells(sel, 30, 30)
    expect(cells).toEqual([{ x: 5, y: 5 }])
  })
})
