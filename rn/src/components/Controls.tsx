import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Card, Text, SegmentedButtons, Switch } from 'react-native-paper'
import Slider from '@react-native-community/slider'
import { useAppStore } from '../store/appStore'

const BRANDS = [
  { value: 'MARD', label: 'MARD' },
  { value: 'COCO', label: 'COCO' },
  { value: '漫漫', label: '漫漫' },
  { value: '盼盼', label: '盼盼' },
  { value: '咪小窝', label: '咪小窝' }
]

export default function Controls() {
  const gridWidth = useAppStore((s) => s.gridWidth)
  const gridHeight = useAppStore((s) => s.gridHeight)
  const colorCount = useAppStore((s) => s.colorCount)
  const selectedBrand = useAppStore((s) => s.selectedBrand)
  const showNumbers = useAppStore((s) => s.showNumbers)
  const lockAspectRatio = useAppStore((s) => s.lockAspectRatio)

  const setGridWidth = useAppStore((s) => s.setGridWidth)
  const setGridHeight = useAppStore((s) => s.setGridHeight)
  const setColorCount = useAppStore((s) => s.setColorCount)
  const setSelectedBrand = useAppStore((s) => s.setSelectedBrand)
  const setShowNumbers = useAppStore((s) => s.setShowNumbers)
  const setLockAspectRatio = useAppStore((s) => s.setLockAspectRatio)

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">参数设置</Text>

        <Text variant="labelMedium">网格宽度: {gridWidth}</Text>
        <Slider
          value={gridWidth}
          onValueChange={(v) => setGridWidth(Math.round(v))}
          minimumValue={5}
          maximumValue={100}
          step={1}
        />

        <Text variant="labelMedium">网格高度: {gridHeight}</Text>
        <Slider
          value={gridHeight}
          onValueChange={(v) => setGridHeight(Math.round(v))}
          minimumValue={5}
          maximumValue={100}
          step={1}
        />

        <View style={styles.row}>
          <Text variant="labelMedium">锁定宽高比</Text>
          <Switch value={lockAspectRatio} onValueChange={setLockAspectRatio} />
        </View>

        <Text variant="labelMedium">颜色数量: {colorCount}</Text>
        <Slider
          value={colorCount}
          onValueChange={(v) => setColorCount(Math.round(v))}
          minimumValue={1}
          maximumValue={50}
          step={1}
        />

        <Text variant="labelMedium" style={styles.sectionTitle}>
          品牌
        </Text>
        <SegmentedButtons
          value={selectedBrand}
          onValueChange={setSelectedBrand}
          buttons={BRANDS}
          density="small"
        />

        <View style={styles.row}>
          <Text variant="labelMedium">显示编号</Text>
          <Switch value={showNumbers} onValueChange={setShowNumbers} />
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  sectionTitle: { marginTop: 8 }
})
