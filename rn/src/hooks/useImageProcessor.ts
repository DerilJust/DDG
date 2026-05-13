import { useCallback } from 'react'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import {
  findClosestColor,
  quantizeColorsUtil,
  ceilToMultipleOf5,
  type PerlerColor,
  type PatternCell
} from '@ddg/shared'
import { useAppStore } from '../store/appStore'

function decodeBase64ToPixels(base64: string, width: number, height: number): Uint8ClampedArray {
  const cleaned = base64.replace(/^data:image\/png;base64,/, '')
  const binaryStr = atob(cleaned)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }

  // 简单解析 PNG：跳过 8 字节签名，查找第一个 IHDR 后的原始像素数据
  const dataView = new DataView(bytes.buffer)
  const pixelData = new Uint8ClampedArray(width * height * 4)
  let offset = 8
  let pixelIdx = 0

  while (offset < bytes.length - 12 && pixelIdx < pixelData.length) {
    const chunkLen = dataView.getUint32(offset)
    const chunkType = String.fromCharCode(
      bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]
    )
    offset += 8

    if (chunkType === 'IDAT') {
      const dataStart = offset
      for (let j = 0; j < Math.min(chunkLen, pixelData.length - pixelIdx); j++) {
        pixelData[pixelIdx + j] = bytes[dataStart + j]
      }
      pixelIdx += chunkLen
    }

    offset += chunkLen + 4 // +4 for CRC
  }

  return pixelData
}

export function useImageProcessor() {
  const generatePattern = useCallback(async (imageUri: string) => {
    const store = useAppStore.getState()
    const { gridWidth, gridHeight, colorCount, perlerColors, selectedBrand, padToMultipleOf5 } = store

    if (!perlerColors.length) {
      store.loadColorData()
      const updated = useAppStore.getState()
      if (!updated.perlerColors.length) {
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

    // 缩放图片到目标尺寸
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: effectiveWidth, height: effectiveHeight } }],
      { format: SaveFormat.PNG, base64: true }
    )

    if (!result.base64) {
      useAppStore.setState({ infoText: '图片处理失败' })
      return
    }

    // 解码像素数据
    const pixels = decodeBase64ToPixels(result.base64, effectiveWidth, effectiveHeight)
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
