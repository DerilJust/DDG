import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { List, Checkbox, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'

export default function ColorHighlightList() {
  const colorStats = useAppStore((s) => s.colorStats)
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())

  const toggleColor = (hex: string) => {
    const next = new Set(highlighted)
    if (next.has(hex)) next.delete(hex)
    else next.add(hex)
    setHighlighted(next)
  }

  return (
    <View>
      <Text variant="titleMedium" style={styles.title}>颜色列表</Text>
      {colorStats.map((stat) => (
        <List.Item
          key={stat.color.hex}
          title={`${stat.code} (${stat.count})`}
          left={() => (
            <View style={[styles.swatch, { backgroundColor: stat.color.hex }]} />
          )}
          right={() => (
            <Checkbox
              status={highlighted.has(stat.color.hex) ? 'checked' : 'unchecked'}
              onPress={() => toggleColor(stat.color.hex)}
            />
          )}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  title: { padding: 8 },
  swatch: { width: 24, height: 24, borderRadius: 4, margin: 8 }
})
