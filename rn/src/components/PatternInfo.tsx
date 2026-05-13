import React from 'react'
import { View, StyleSheet } from 'react-native'
import { DataTable, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'

export default function PatternInfo() {
  const colorStats = useAppStore((s) => s.colorStats)

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">颜色统计 ({colorStats.length} 种)</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>颜色</DataTable.Title>
          <DataTable.Title numeric>代码</DataTable.Title>
          <DataTable.Title numeric>数量</DataTable.Title>
        </DataTable.Header>
        {colorStats.map((stat, i) => (
          <DataTable.Row key={i}>
            <DataTable.Cell>
              <View style={styles.colorRow}>
                <View style={[styles.swatch, { backgroundColor: stat.color.hex }]} />
                <Text variant="bodySmall">{stat.color.hex}</Text>
              </View>
            </DataTable.Cell>
            <DataTable.Cell numeric>{stat.code}</DataTable.Cell>
            <DataTable.Cell numeric>{stat.count}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 8 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 16, height: 16, borderRadius: 3 }
})
