const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, '../packages/shared')
]

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@ddg/shared': path.resolve(__dirname, '../packages/shared')
  }
}

module.exports = config
