import { Gesture } from 'react-native-gesture-handler'
import { useSharedValue, withTiming } from 'react-native-reanimated'

export function useGesture(options?: { enabled?: boolean }) {
  const scale = useSharedValue(1)
  const offsetX = useSharedValue(0)
  const offsetY = useSharedValue(0)

  const savedScale = useSharedValue(1)
  const savedOffsetX = useSharedValue(0)
  const savedOffsetY = useSharedValue(0)

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.5, Math.min(3, savedScale.value * e.scale))
    })

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedOffsetX.value = offsetX.value
      savedOffsetY.value = offsetY.value
    })
    .onUpdate((e) => {
      offsetX.value = savedOffsetX.value + e.translationX
      offsetY.value = savedOffsetY.value + e.translationY
    })

  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture)

  const resetViewport = () => {
    scale.value = withTiming(1, { duration: 200 })
    offsetX.value = withTiming(0, { duration: 200 })
    offsetY.value = withTiming(0, { duration: 200 })
  }

  return { scale, offsetX, offsetY, composedGesture, resetViewport }
}
