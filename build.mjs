import esbuild from 'esbuild'
import fs from 'fs'

const watch = process.argv.includes('--watch')

if (!fs.existsSync('dist')) fs.mkdirSync('dist')

// Inline jszip into ui.html
const jszipSrc = fs.readFileSync('node_modules/jszip/dist/jszip.min.js', 'utf8')
let uiHtml = fs.readFileSync('src/ui.html', 'utf8')
uiHtml = uiHtml.replace('/* __JSZIP_INLINE__ */', jszipSrc)
fs.writeFileSync('dist/ui.html', uiHtml)

const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  target: 'es2017',
  platform: 'browser',
  define: {
    '__html__': JSON.stringify(uiHtml)
  }
}

if (watch) {
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  console.log('Watching for changes...')
} else {
  await esbuild.build(buildOptions)
  console.log('Build complete!')
}
