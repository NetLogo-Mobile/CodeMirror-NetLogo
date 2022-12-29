import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: './src/editor.ts',
    output: {
      file: './dist/editor.bundle.js',
      format: 'iife',
      banner: `
/** For String.prototype.matchAll */
if(!String.prototype.matchAll) {
    String.prototype.matchAll = function (rx) {
        if (typeof rx === "string") rx = new RegExp(rx, "g"); // coerce a string to be a global regex
        rx = new RegExp(rx); // Clone the regex so we don't update the last index on the regex they pass us
        let cap = []; // the single capture
        let all = []; // all the captures (return this)
        while ((cap = rx.exec(this)) !== null) all.push(cap); // execute and add
        return all; // profit!
    };
}
      `,
    },
    plugins: [typescript(), nodeResolve()],
  },
];
