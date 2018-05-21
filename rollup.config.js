import typescript from 'rollup-plugin-typescript2'

export default {
  entry: 'src/Container.ts',
  dest: 'dist/index.js',
  format: 'es',
  plugins: [
    typescript()
  ]
}
