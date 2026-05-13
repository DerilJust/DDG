import React, { useMemo } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { Canvas, Rect, Text as SkiaText, Group, useFont } from '@shopify/react-native-skia'
import { GestureDetector } from 'react-native-gesture-handler'
import { useDerivedValue } from 'react-native-reanimated'
import { useAppStore } from '../store/appStore'
import { useGesture } from '../hooks/useGesture'
import { Button, Text, useTheme } from 'react-native-paper'

const CELL_SIZE = 12
const AXIS_MARGIN = 16
const FONT_SIZE = 6

const screenWidth = Dimensions.get('window').width

interface SkiaCanvasProps {
  editMode: boolean
  onCellPress?: (x: number, y: number) => void
}

function SkiaCanvas({ editMode, onCellPress }: SkiaCanvasProps) {
  const patternGrid = useAppStore((s) => s.patternGrid)
  const showNumbers = useAppStore((s) => s.showNumbers)
  const gridWidth = useAppStore((s) => s.gridWidth)
  const gridHeight = useAppStore((s) => s.gridHeight)
  const theme = useTheme()

  const { scale, offsetX, offsetY, composedGesture, resetViewport } = useGesture({
    enabled: true
  })

  const font = useFont(undefined, FONT_SIZE)

  const cells = useMemo(() => {
    return patternGrid.flatMap((row, y) =>
      row.map((cell, x) => ({
        x: AXIS_MARGIN + x * CELL_SIZE,
        y: AXIS_MARGIN + y * CELL_SIZE,
        color: cell.color.hex,
        code: cell.code,
        isBlank: !cell.code
      }))
    )
  }, [patternGrid])

  const transform = useDerivedValue(() => {
    return [{ translateX: offsetX.value }, { translateY: offsetY.value }, { scale: scale.value }]
  })

  return (
    <View style={styles.container}>
      <GestureDetector gesture={composedGesture}>
        <Canvas style={styles.canvas}>
          <Rect x={0} y={0} width={2000} height={2000} color="#f0f2f5" />

          <Group transform={transform} origin={{ x: 0, y: 0 }}>
            {Array.from({ length: gridWidth + 1 }, (_, i) => (
              <Rect
                key={`vg-${i}`}
                x={AXIS_MARGIN + i * CELL_SIZE - 0.5}
                y={AXIS_MARGIN}
                width={1}
                height={gridHeight * CELL_SIZE}
                color="#e0e0e0"
              />
            ))}

            {Array.from({ length: gridHeight + 1 }, (_, i) => (
              <Rect
                key={`hg-${i}`}
                x={AXIS_MARGIN}
                y={AXIS_MARGIN + i * CELL_SIZE - 0.5}
                width={gridWidth * CELL_SIZE}
                height={1}
                color="#e0e0e0"
              />
            ))}

            {cells.map((cell) => (
              <Rect
                key={`c-${cell.x}-${cell.y}`}
                x={cell.x}
                y={cell.y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                color={cell.color}
              />
            ))}

            {showNumbers &&
              font &&
              cells
                .filter((c) => !c.isBlank)
                .map((cell) => (
                  <SkiaText
                    key={`t-${cell.x}-${cell.y}`}
                    x={cell.x + 1}
                    y={cell.y + CELL_SIZE - 2}
                    text={cell.code}
                    color="#000000"
                    font={font}
                  />
                ))}
          </Group>
        </Canvas>
      </GestureDetector>

      <View style={styles.controls}>
        <Text variant="bodySmall" style={styles.zoomText}>
          {Math.round(scale.value * 100)}%
        </Text>
        <Button mode="text" compact onPress={resetViewport}>
          重置视图
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  canvas: { flex: 1 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e7ed'
  },
  zoomText: { color: '#909399' }
})

export default SkiaCanvas
