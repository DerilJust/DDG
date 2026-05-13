import React, { useCallback } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Button, Text } from 'react-native-paper'
import * as Clipboard from 'expo-clipboard'
import { compressPatternGrid } from '@ddg/shared'
import { useAppStore } from '../store/appStore'

export default function ExportPreview() {
  const patternGrid = useAppStore((s) => s.patternGrid)
  const gridWidth = useAppStore((s) => s.gridWidth)
  const gridHeight = useAppStore((s) => s.gridHeight)
  const selectedBrand = useAppStore((s) => s.selectedBrand)

  const handleExportCompressed = useCallback(async () => {
    const compressed = compressPatternGrid(patternGrid, gridWidth, gridHeight, selectedBrand)
    await Clipboard.setStringAsync(compressed)
    Alert.alert('已复制', '压缩字符串已复制到剪贴板')
  }, [patternGrid, gridWidth, gridHeight, selectedBrand])

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">导出图纸</Text>
      <View style={styles.buttons}>
        <Button mode="contained" onPress={handleExportCompressed} icon="clipboard-text">
          复制压缩字符串
        </Button>
        <Text variant="bodySmall" style={styles.hint}>
          可粘贴到其他设备导入
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 8, gap: 8 },
  buttons: { gap: 8 },
  hint: { color: '#909399', textAlign: 'center' }
})
