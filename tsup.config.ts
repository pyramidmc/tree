import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/**/*.ts'],
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: true,
  format: ['cjs'],
  outDir: 'dist',
  dts: true
})