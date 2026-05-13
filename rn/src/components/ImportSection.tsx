import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { Button, TextInput, Text } from 'react-native-paper'
import { useAppStore } from '../store/appStore'

export default function ImportSection() {
  const [input, setInput] = useState('')
  const importFromCompressed = useAppStore((s) => s.importFromCompressed)

  const handleImport = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const ok = importFromCompressed(trimmed)
    if (ok) {
      Alert.alert('导入成功', '图纸已导入')
      setInput('')
    } else {
      Alert.alert('导入失败', '无效的压缩字符串格式')
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">导入压缩数据</Text>
      <TextInput
        mode="outlined"
        multiline
        value={input}
        onChangeText={setInput}
        placeholder="粘贴压缩字符串..."
        style={styles.input}
      />
      <Button mode="contained" onPress={handleImport}>
        导入
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 8, gap: 8 },
  input: { minHeight: 80 }
})
