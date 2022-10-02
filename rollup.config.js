import { nodeResolve } from "@rollup/plugin-node-resolve"

export default [
{
    input: "./editor.js",
    output: {
        file: "./dist/editor.bundle.js",
        format: "iife"
    },
    plugins: [nodeResolve()]
}
]