import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { Chip, IconButton, SegmentedButtons, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'
import type { EditingTool } from '@ddg/shared'

const TOOLS: { value: EditingTool; label: string; icon: string }[] = [
  { value: 'brush', label: '画笔', icon: 'brush' },
  { value: 'fill', label: '填充', icon: 'format-color-fill' },
  { value: 'eraser', label: '橡皮', icon: 'eraser' },
  { value: 'eyedropper', label: '吸管', icon: 'eyedropper' },
  { value: 'pan', label: '拖拽', icon: 'pan' }
]

export default function EditPalette() {
  const selectedTool = useAppStore((s) => s.selectedTool)
  const setSelectedTool = useAppStore((s) => s.setSelectedTool)
  const colorStats = useAppStore((s) => s.colorStats)
  const selectedEditColor = useAppStore((s) => s.selectedEditColor)
  const setSelectedEditColor = useAppStore((s) => s.setSelectedEditColor)
  const undo = useAppStore((s) => s.undo)
  const redo = useAppStore((s) => s.redo)
  const editMode = useAppStore((s) => s.editMode)
  const setEditMode = useAppStore((s) => s.setEditMode)

  const handleToolChange = (value: string) => {
    if (value === 'pan') {
      setEditMode(false)
    } else {
      setEditMode(true)
      setSelectedTool(value as EditingTool)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolRow}>
        <IconButton icon="undo" onPress={undo} size={20} />
        <IconButton icon="redo" onPress={redo} size={20} />
        <SegmentedButtons
          value={editMode ? selectedTool : 'pan'}
          onValueChange={handleToolChange}
          buttons={TOOLS.map((t) => ({ value: t.value, label: t.label }))}
          density="small"
          style={styles.toolButtons}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.paletteScroll}
      >
        {colorStats.map((stat, i) => (
          <Chip
            key={`${stat.color.hex}-${i}`}
            style={[
              styles.chip,
              selectedEditColor?.hex === stat.color.hex && styles.chipSelected
            ]}
            onPress={() => setSelectedEditColor(stat.color)}
            compact
          >
            <View style={[styles.colorDot, { backgroundColor: stat.color.hex }]} />
            <Text variant="labelSmall">{stat.code} ({stat.count})</Text>
          </Chip>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e7ed'
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  toolButtons: { flex: 1 },
  paletteScroll: { paddingHorizontal: 8, paddingBottom: 8 },
  chip: { marginRight: 6 },
  chipSelected: { borderColor: '#409EFF', borderWidth: 2 },
  colorDot: { width: 14, height: 14, borderRadius: 3, marginRight: 4 }
})
