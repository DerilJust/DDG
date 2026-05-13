import { View, ScrollView, StyleSheet } from 'react-native'
import { Appbar, Text } from 'react-native-paper'
import { useAppStore } from '@/src/store/appStore'

export default function EditorPage() {
  const infoText = useAppStore((s) => s.infoText)
  const hasImage = useAppStore((s) => !!s.originalImageUrl)

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="拼豆图纸编辑器" />
      </Appbar.Header>
      <ScrollView style={styles.content}>
        {!hasImage ? (
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.hint}>{infoText}</Text>
          </View>
        ) : (
          <Text variant="bodyMedium" style={styles.hint}>{infoText}</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  hint: { textAlign: 'center', color: '#909399', marginTop: 8 }
})
