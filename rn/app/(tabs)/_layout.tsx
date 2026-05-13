import { Tabs } from 'expo-router'
import { useTheme } from 'react-native-paper'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

export default function TabLayout() {
  const theme = useTheme()
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { fontWeight: '600' }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '编辑器',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="grid" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="target" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          title: '帮助',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="help-circle" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  )
}
