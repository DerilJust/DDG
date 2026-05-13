import { View, StyleSheet } from 'react-native'
import { Appbar, Text } from 'react-native-paper'
import ImagePicker from '@/src/components/ImagePicker'
import SkiaCanvas from '@/src/components/SkiaCanvas'
import { useAppStore } from '@/src/store/appStore'

export default function EditorPage() {
  const infoText = useAppStore((s) => s.infoText)
  const editMode = useAppStore((s) => s.editMode)
  const hasImage = useAppStore((s) => !!s.originalImageUrl)

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="拼豆图纸编辑器" />
      </Appbar.Header>
      {!hasImage ? (
        <View style={styles.empty}>
          <ImagePicker />
          <Text variant="bodyMedium" style={styles.hint}>
            {infoText}
          </Text>
        </View>
      ) : (
        <View style={styles.editor}>
          <SkiaCanvas editMode={editMode} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center' },
  hint: { textAlign: 'center', color: '#909399', marginTop: 8 },
  editor: { flex: 1 }
})
