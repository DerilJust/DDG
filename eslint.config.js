import pluginVue from 'eslint-plugin-vue'
import prettierConfig from 'eslint-config-prettier'

export default [
  ...pluginVue.configs['flat/recommended'],
  {
    ignores: ['node_modules/', 'dist/']
  },
  {
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off'
    }
  },
  prettierConfig
]
