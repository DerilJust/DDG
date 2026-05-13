import { View, StyleSheet } from 'react-native'
import { Appbar, Text } from 'react-native-paper'
import SkiaCanvas from '@/src/components/SkiaCanvas'
import { useAppStore } from '@/src/store/appStore'

export default function EditorPage() {
  const editMode = useAppStore((s) => s.editMode)
  const hasImage = useAppStore((s) => !!s.originalImageUrl)

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="拼豆图纸编辑器" />
      </Appbar.Header>
      {hasImage ? (
        <SkiaCanvas editMode={editMode} />
      ) : (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={styles.hint}>请上传图片并生成图纸</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  hint: { textAlign: 'center', color: '#909399', marginTop: 8 }
})
