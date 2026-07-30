import { access, readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = new URL('../dist/', import.meta.url)
const indexPath = new URL('index.html', dist)

await access(indexPath)
const html = await readFile(indexPath, 'utf8')

if (!html.includes('/LianTongSK-1785314735/assets/')) {
  throw new Error('Built index.html does not contain the required GitHub Pages base path')
}
if (html.includes('github_pat_') || html.includes('Authorization: Bearer')) {
  throw new Error('Potential credential pattern found in built index.html')
}

const assetsDir = new URL('assets/', dist)
const files = await readdir(assetsDir)
if (!files.some((file) => file.endsWith('.js'))) throw new Error('No JavaScript asset was emitted')
if (!files.some((file) => file.endsWith('.css'))) throw new Error('No CSS asset was emitted')

let bytes = 0
const assetsPath = fileURLToPath(assetsDir)
for (const file of files) bytes += (await stat(join(assetsPath, file))).size

console.log(`Build verified: ${files.length} assets, ${(bytes / 1024).toFixed(1)} KiB total`)
