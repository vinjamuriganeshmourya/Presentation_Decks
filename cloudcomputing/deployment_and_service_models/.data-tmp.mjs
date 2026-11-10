import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const [file, out] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/usr/bin/brave-browser' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const WALK = [8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28]
const all = {}
for (const n of WALK) {
  await p.goto(`file://${file}?nav=steps&noauto#/${n}`, { waitUntil: 'load' }); await p.waitForTimeout(2200)
  const base = await p.evaluate(() => {
    const sec = document.querySelector('section')
    const card = sec.querySelector('.rounded-card.shadow-card')
    let col = card.parentElement; while (col && col.children.length < 2) col = col.parentElement
    const right = [...col.children].find(c => !c.contains(card))
    const kids = [...right.children]
    const out = { kicker: sec.querySelector('header, h2')?.parentElement?.innerText.split('\n')[0], title: sec.querySelector('h2')?.textContent, url: card.querySelector('.rounded-pill')?.textContent.trim(), cardW: card.getBoundingClientRect().width, cardH: card.getBoundingClientRect().height, chip: null, items: [], extra: [], tips: [] }
    for (const k of kids) {
      const t = k.innerText.trim()
      if (k.querySelector('ol')) { out.items = [...k.querySelectorAll('li')].map(li => li.children[1].textContent.trim()); continue }
      if (k.classList.contains('grid')) continue
      const tip = k.querySelector('.rounded-card[style*="background"]')
      if (tip) { out.tips.push({ bg: tip.style.background, title: tip.querySelector('p')?.textContent.trim(), body: tip.querySelector('div > div')?.textContent.trim() }); continue }
      if (/^(Step \d+|7[AB] · .*)$/.test(t)) { out.chip = t; continue }
      if (t) out.extra.push({ text: t, cls: (k.querySelector('p,span')?.className || '') })
    }
    return out
  })
  base.focus = []
  for (let k = 0; k < 6; k++) {
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1300)
    if (!(await p.evaluate(() => location.hash)).startsWith(`#/${n}`)) break
    base.focus.push(await p.evaluate(() => {
      const g = [...document.querySelectorAll('section .grid')].find(x => x.querySelector('.rounded-card.border-l-\\[5px\\]'))
      if (!g) return null
      const vis = [...g.children].filter(c => !c.classList.contains('invisible')).map(c => c.querySelector('.rounded-card')).filter(c => c && +getComputedStyle(c).opacity > 0.5)
      const c = vis[vis.length - 1]
      return c ? { title: c.children[0].textContent.trim(), body: c.children[1]?.textContent.trim(), border: c.style.borderColor, mono: c.children[1]?.className.includes('mono') } : null
    }))
  }
  all[n] = base
  console.log(n, JSON.stringify(base).slice(0, 400))
}
writeFileSync(`${out}/data.json`, JSON.stringify(all, null, 1))
await b.close()
