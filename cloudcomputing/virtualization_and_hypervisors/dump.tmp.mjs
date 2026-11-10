import { chromium } from 'playwright'
import fs from 'node:fs'
const [out, from, to] = [process.argv[2], +process.argv[3], +process.argv[4]]
const b = await chromium.launch({ executablePath: '/usr/bin/brave-browser' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
let txt = ''
for (let i = from; i <= to; i++) {
  await p.goto(`http://127.0.0.1:5273/?all#/${i}`, { waitUntil: 'load' })
  await p.waitForTimeout(2000)
  const t = await p.evaluate(() => (document.querySelector('main section, section')?.innerText || '').replace(/\n+/g, ' | '))
  txt += `\n=== ${i}: ${t}\n`
  await p.screenshot({ path: `${out}/${String(i).padStart(2, '0')}.png` })
}
fs.writeFileSync(`${out}/text.txt`, txt)
await b.close()
