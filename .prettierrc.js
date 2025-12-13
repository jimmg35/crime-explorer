module.exports = {
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  printWidth: 80,
  tabWidth: 2,
  trailingComma: 'none',
  singleQuote: true,
  semi: false,
  importOrder: [
    'react',
    '^(?!react)\\w+$',
    'next',
    '^@app/(.*)$',
    '^@containers/(.*)$',
    '^@components/(.*)$',
    '^@store/(.*)$',
    '^@lib/(.*)$',
    '^@hooks/(.*)$',
    '^@mui/(.*)$',
    '^@arcgis/(.*)$',
    '^[./]'
  ],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true
}
