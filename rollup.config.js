import tsc from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import {terser} from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'


export default {
  input: 'src/entry.ts',
  output: { file: 'docs/app.js', format: 'esm', sourcemap: true },
  plugins: [
    commonjs(),
    tsc(),
    resolve(),
    json(),
    process.env.minify ? terser() : {},
  ]
}