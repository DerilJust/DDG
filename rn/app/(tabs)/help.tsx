import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Text, Card } from 'react-native-paper'

const SECTIONS = [
  {
    title: '快速上手',
    content:
      '1. 点击"从相册选择"或"拍照"上传图片\n2. 调整网格参数和颜色数量\n3. 确认后自动生成拼豆图纸\n4. 使用编辑器微调图案'
  },
  {
    title: '编辑器工具',
    content:
      '画笔：点击格子改变颜色\n填充：点击区域统一上色\n橡皮：清除格子颜色\n吸管：从图纸中吸取颜色\n拖拽：移动画布视角'
  },
  {
    title: '参数说明',
    content:
      '网格大小：拼豆作品的宽度和高度（单位：豆）\n颜色数量：限制使用的颜色种类（1-50）\n品牌选择：不同品牌颜色代码不同'
  },
  {
    title: '快捷操作',
    content: '双指缩放：放大/缩小画布\n单指拖拽：平移画布\n撤销/重做：底部工具栏按钮'
  },
  {
    title: '导入导出',
    content: '压缩字符串：复制图纸数据，可在其他设备粘贴导入\nFocus模式：可查看和筛选特定颜色'
  }
]

export default function HelpPage() {
  return (
    <ScrollView style={styles.container}>
      {SECTIONS.map((s) => (
        <Card key={s.title} style={styles.card}>
          <Card.Title title={s.title} />
          <Card.Content>
            <Text variant="bodyMedium">{s.content}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  card: { marginBottom: 8 }
})
