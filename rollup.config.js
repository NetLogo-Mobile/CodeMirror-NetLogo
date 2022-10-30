import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: './src/editor.ts',
    output: {
      file: './dist/editor.bundle.js',
      format: 'iife',
    },
    plugins: [typescript(), nodeResolve()],
  },
];
