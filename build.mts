import glob from 'tiny-glob'
import fs from 'fs-extra'
import { build } from 'esbuild'
import { makeExtbuild } from 'extbuild'

glob('src/**/*.{ts,cjs}').then((files) => {
  const entryPoints = files.filter(f => !f.endsWith('spec.ts'))
    .map((f) => {
      if (f.endsWith('js')) {
        fs.copySync(f, f.replace('src', 'dist'))
        return null
      }
      return f
    }).filter(Boolean) as string[]
  // noinspection JSIgnoredPromiseFromCall
  build({
    entryPoints,
    outdir: 'dist',
    format: 'esm',
    plugins: [
      makeExtbuild(),
    ],
    bundle: false,
    minify: false,
    sourcemap: false,
    platform: 'node',
    target: 'es2020',
  })
})
