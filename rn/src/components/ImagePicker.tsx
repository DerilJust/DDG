import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Button, Card, Text } from 'react-native-paper'
import * as ExpoImagePicker from 'expo-image-picker'
import { router } from 'expo-router'

export default function ImagePicker() {
  const pickImage = async () => {
    const permResult = await ExpoImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permResult.granted) return

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    router.push({
      pathname: '/image-crop',
      params: { imageUri: asset.uri, width: asset.width, height: asset.height }
    })
  }

  const takePhoto = async () => {
    const permResult = await ExpoImagePicker.requestCameraPermissionsAsync()
    if (!permResult.granted) return

    const result = await ExpoImagePicker.launchCameraAsync({
      quality: 1
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    router.push({
      pathname: '/image-crop',
      params: { imageUri: asset.uri, width: asset.width, height: asset.height }
    })
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium">上传图片</Text>
        <View style={styles.buttons}>
          <Button mode="contained" onPress={pickImage} icon="image">
            从相册选择
          </Button>
          <Button mode="outlined" onPress={takePhoto} icon="camera">
            拍照
          </Button>
        </View>
      </Card.Content>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { margin: 8 },
  buttons: { marginTop: 12, gap: 8 }
})
