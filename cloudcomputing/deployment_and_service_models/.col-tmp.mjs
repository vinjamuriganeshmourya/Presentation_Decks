import { chromium } from 'playwright'
const [file, ...nums] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/usr/bin/brave-browser' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
for (const n of nums) {
  await p.goto(`file://${file}?all#/${n}`, { waitUntil: 'load' }); await p.waitForTimeout(2000)
  const h = await p.evaluate(() => {
    const card = document.querySelector('section .rounded-card.shadow-card')
    let col = card.parentElement; while (col && col.children.length < 2) col = col.parentElement
    const right = [...col.children].find(c => !c.contains(card))
    const walk = (e, d) => { if (d > 7) return ''; const cls = typeof e.className === 'string' ? e.className : (e.className?.baseVal ?? ''); const st = (e.getAttribute('style') || '').slice(0, 140); const txt = e.children.length === 0 && e.textContent.trim() ? ` "${e.textContent.trim()}"` : ''; return '  '.repeat(d) + `<${e.tagName.toLowerCase()} .${cls.slice(0, 110)}${st ? ' style=' + st : ''}>${txt}\n` + [...e.children].map(c => walk(c, d + 1)).join('') }
    return 'LAYOUT ' + col.className + '\n' + walk(right, 0)
  })
  console.log(`##### ${n}\n${h}`)
}
await b.close()
