import { useCallback } from 'react'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import UPNG from 'upng-js'
import {
  findClosestColor,
  quantizeColorsUtil,
  ceilToMultipleOf5,
  type PatternCell
} from '@ddg/shared'
import { useAppStore } from '../store/appStore'

function decodeBase64ToPixels(base64: string): Uint8ClampedArray | null {
  const cleaned = base64.replace(/^data:image\/png;base64,/, '')
  const binaryStr = atob(cleaned)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  const img = UPNG.decode(bytes.buffer)
  if (!img) return null
  const rgba = UPNG.toRGBA8(img)
  if (!rgba || !rgba.length) return null
  return new Uint8ClampedArray(rgba[0] instanceof ArrayBuffer ? new Uint8Array(rgba[0] as ArrayBuffer) : rgba[0] as Uint8Array)
}

export function useImageProcessor() {
  // stable reference — getState() reads latest each call
  const generatePattern = useCallback(async (imageUri: string) => {
    const { gridWidth, gridHeight, colorCount, perlerColors, selectedBrand, padToMultipleOf5 } =
      useAppStore.getState()

    if (!perlerColors.length) {
      useAppStore.getState().loadColorData()
      if (!useAppStore.getState().perlerColors.length) {
        useAppStore.setState({ infoText: '颜色数据加载失败' })
        return
      }
    }

    const originalWidth = Math.max(5, gridWidth)
    const originalHeight = Math.max(5, gridHeight)

    let effectiveWidth = originalWidth
    let effectiveHeight = originalHeight
    let leftPad = 0
    let topPad = 0

    if (padToMultipleOf5) {
      effectiveWidth = ceilToMultipleOf5(originalWidth)
      effectiveHeight = ceilToMultipleOf5(originalHeight)
      leftPad = Math.floor((effectiveWidth - originalWidth) / 2)
      topPad = Math.floor((effectiveHeight - originalHeight) / 2)
    }

    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: effectiveWidth, height: effectiveHeight } }],
      { format: SaveFormat.PNG, base64: true }
    )

    if (!result.base64) {
      useAppStore.setState({ infoText: '图片处理失败' })
      return
    }

    const pixels = decodeBase64ToPixels(result.base64)
    if (!pixels) {
      useAppStore.setState({ infoText: '图片解码失败' })
      return
    }

    const colors = useAppStore.getState().perlerColors
    const colorMap = quantizeColorsUtil(pixels, colorCount, colors)

    const blankCell: PatternCell = {
      color: { r: 255, g: 255, b: 255, hex: '#FFFFFF', info: {} as Record<string, string> },
      code: ''
    }

    const grid: PatternCell[][] = []
    for (let y = 0; y < effectiveHeight; y++) {
      const row: PatternCell[] = []
      for (let x = 0; x < effectiveWidth; x++) {
        const inPadding =
          padToMultipleOf5 &&
          (x < leftPad ||
            x >= leftPad + originalWidth ||
            y < topPad ||
            y >= topPad + originalHeight)
        if (inPadding) {
          row.push({ ...blankCell })
        } else {
          const index = (y * effectiveWidth + x) * 4
          const r = pixels[index]
          const g = pixels[index + 1]
          const b = pixels[index + 2]
          const closestColor = findClosestColor({ r, g, b }, colorMap)
          const colorCode = closestColor.info ? closestColor.info[selectedBrand] || '' : ''
          row.push({ color: closestColor, code: colorCode })
        }
      }
      grid.push(row)
    }

    useAppStore.setState({
      patternGrid: grid,
      gridWidth: effectiveWidth,
      gridHeight: effectiveHeight,
      infoText: `已生成: ${effectiveWidth}x${effectiveHeight} 网格, ${colorCount} 种颜色`
    })
    useAppStore.getState().refreshColorStats()
  }, [])

  return { generatePattern }
}
