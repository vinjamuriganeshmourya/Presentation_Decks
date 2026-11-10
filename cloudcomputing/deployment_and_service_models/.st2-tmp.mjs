import { chromium } from 'playwright'
const [file, n, presses] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/usr/bin/brave-browser' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.goto(`file://${file}?nav=steps&noauto#/${n}`, { waitUntil: 'load' }); await p.waitForTimeout(2200)
for (let k = 0; k < +presses; k++) {
  const h = await p.evaluate(() => {
    const card = document.querySelector('section .rounded-card.shadow-card')
    const walk = (e, d) => { if (d > 6) return ''; const cs = e.getAttribute && (e.getAttribute('style') || ''); const cls = typeof e.className === 'string' ? e.className : ''; const tag = e.tagName.toLowerCase(); const src = e.tagName === 'IMG' ? ` src=${e.src.slice(0, 25)}…(${e.naturalWidth}x${e.naturalHeight})` : ''; const txt = e.children.length === 0 && e.textContent.trim() ? ` "${e.textContent.trim().slice(0, 40)}"` : ''; return '  '.repeat(d) + `<${tag} .${cls.slice(0, 70)} style="${cs.replace(/url\(data:[^)]{0,9999999}\)/g, 'url(DATA)').slice(0, 220)}"${src}${txt}>\n` + [...e.children].map(c => walk(c, d + 1)).join('') }
    return walk(card, 0)
  })
  console.log(`=== press ${k}\n` + h)
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1500)
}
await b.close()
