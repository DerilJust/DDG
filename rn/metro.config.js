const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// 让 Metro 能够解析 rn/ 外部的 packages/shared/
config.watchFolders = [
  ...config.watchFolders || [],
  path.resolve(__dirname, '../packages/shared')
]

// 让 Metro 解析 @ddg/shared 的路径
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@ddg/shared': path.resolve(__dirname, '../packages/shared')
  }
}

module.exports = config
