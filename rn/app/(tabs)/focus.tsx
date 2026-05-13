import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { Appbar } from 'react-native-paper'
import SkiaCanvas from '@/src/components/SkiaCanvas'
import ColorHighlightList from '@/src/components/ColorHighlightList'
import ImportSection from '@/src/components/ImportSection'
import { useAppStore } from '@/src/store/appStore'

export default function FocusPage() {
  const editMode = useAppStore((s) => s.editMode)
  const hasPattern = useAppStore((s) => s.patternGrid.length > 0)

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Focus 模式" />
      </Appbar.Header>
      {hasPattern ? (
        <View style={styles.content}>
          <View style={styles.canvas}>
            <SkiaCanvas editMode={editMode} />
          </View>
          <ScrollView style={styles.sidebar}>
            <ImportSection />
            <ColorHighlightList />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.empty}>
          <ImportSection />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, flexDirection: 'row' },
  canvas: { flex: 1 },
  sidebar: { width: 200, borderLeftWidth: 1, borderLeftColor: '#e4e7ed' },
  empty: { flex: 1, padding: 16 }
})
