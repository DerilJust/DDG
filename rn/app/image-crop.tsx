import React, { useState, useEffect, useCallback } from 'react'
import { View, Image, StyleSheet, Dimensions, ScrollView } from 'react-native'
import { Button, Text, TextInput, SegmentedButtons } from 'react-native-paper'
import { useLocalSearchParams, router } from 'expo-router'
import { useAppStore } from '@/src/store/appStore'
import { useImageProcessor } from '@/src/hooks/useImageProcessor'

const screenWidth = Dimensions.get('window').width

const BRANDS = [
  { value: 'MARD', label: 'MARD' },
  { value: 'COCO', label: 'COCO' },
  { value: '漫漫', label: '漫漫' },
  { value: '盼盼', label: '盼盼' },
  { value: '咪小窝', label: '咪小窝' }
]

export default function ImageCropPage() {
  const {
    imageUri,
    width: w,
    height: h
  } = useLocalSearchParams<{
    imageUri: string
    width: string
    height: string
  }>()

  const imageWidth = Number(w) || screenWidth
  const imageHeight = Number(h) || screenWidth
  const aspectRatio = imageHeight > 0 ? imageWidth / imageHeight : 1

  const [gridWidth, setGridWidth] = useState(30)
  const [gridHeight, setGridHeight] = useState(30)
  const [colorCount, setColorCount] = useState(20)
  const [selectedBrand, setSelectedBrand] = useState('MARD')

  const setOriginalImage = useAppStore((s) => s.setOriginalImage)
  const setOriginalImageSize = useAppStore((s) => s.setOriginalImageSize)
  const setStoreGridWidth = useAppStore((s) => s.setGridWidth)
  const setStoreGridHeight = useAppStore((s) => s.setGridHeight)
  const setStoreColorCount = useAppStore((s) => s.setColorCount)
  const setStoreBrand = useAppStore((s) => s.setSelectedBrand)
  const loadColorData = useAppStore((s) => s.loadColorData)
  const { generatePattern } = useImageProcessor()

  const displayHeight = (screenWidth - 32) / aspectRatio

  const handleWidthChange = useCallback(
    (val: number) => {
      const w = Math.round(val)
      setGridWidth(w)
      setGridHeight(Math.max(1, Math.round(w / aspectRatio)))
    },
    [aspectRatio]
  )

  // Initialize grid from image aspect ratio
  useEffect(() => {
    const initialW = 30
    setGridWidth(initialW)
    setGridHeight(Math.max(1, Math.round(initialW / aspectRatio)))
  }, [])

  const handleConfirm = async () => {
    loadColorData()
    setOriginalImage({ uri: imageUri!, name: 'photo.jpg' })
    setOriginalImageSize(imageWidth, imageHeight)
    setStoreGridWidth(gridWidth)
    setStoreGridHeight(gridHeight)
    setStoreColorCount(colorCount)
    setStoreBrand(selectedBrand)
    await generatePattern(imageUri!)
    router.back()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.preview}>
        <Image
          source={{ uri: imageUri! }}
          style={[styles.image, { width: screenWidth - 32, height: displayHeight }]}
          resizeMode="contain"
        />
      </View>

      <Text variant="labelLarge" style={styles.fieldLabel}>
        网格宽度
      </Text>
      <TextInput
        mode="outlined"
        keyboardType="number-pad"
        value={String(gridWidth)}
        onChangeText={(text) => {
          const val = Math.max(5, Math.min(100, Number(text) || 5))
          handleWidthChange(val)
        }}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.fieldLabel}>
        网格高度
      </Text>
      <TextInput
        mode="outlined"
        keyboardType="number-pad"
        value={String(gridHeight)}
        onChangeText={(text) => {
          const val = Math.max(5, Math.min(100, Number(text) || 5))
          setGridHeight(val)
        }}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.fieldLabel}>
        颜色数量
      </Text>
      <TextInput
        mode="outlined"
        keyboardType="number-pad"
        value={String(colorCount)}
        onChangeText={(text) => {
          const val = Math.max(1, Math.min(50, Number(text) || 1))
          setColorCount(val)
        }}
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.sectionTitle}>
        品牌
      </Text>
      <SegmentedButtons
        value={selectedBrand}
        onValueChange={setSelectedBrand}
        buttons={BRANDS}
        density="small"
      />

      <Button mode="contained" onPress={handleConfirm} style={styles.confirmBtn}>
        确认生成
      </Button>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16 },
  preview: { alignItems: 'center', marginVertical: 16 },
  image: { borderRadius: 8 },
  fieldLabel: { marginTop: 12 },
  input: { marginTop: 4 },
  sectionTitle: { marginTop: 16 },
  confirmBtn: { marginTop: 24 }
})
