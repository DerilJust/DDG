import { View, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'

export default function EditorPage() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">拼豆图纸编辑器</Text>
      <Text variant="bodyMedium" style={styles.hint}>功能开发中...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hint: { color: '#909399', marginTop: 8 }
})
