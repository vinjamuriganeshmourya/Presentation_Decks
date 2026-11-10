import { chromium } from 'playwright'
import { writeFileSync } from 'node:fs'
const [file, out] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/usr/bin/brave-browser' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const WALK = [8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28]
const res = {}
for (const n of WALK) {
  await p.goto(`file://${file}?nav=steps&noauto#/${n}`, { waitUntil: 'load' }); await p.waitForTimeout(2200)
  const steps = []
  for (let k = 0; k < 8; k++) {
    const st = await p.evaluate(() => {
      const card = document.querySelector('section .rounded-card.shadow-card')
      const vp = card.children[1]; const bg = vp.children[0]; const cs = getComputedStyle(bg)
      const rings = [...vp.querySelectorAll('.ss-ring')].map(r => ({ cls: r.className, style: r.getAttribute('style') }))
      const sec = document.querySelector('section')
      const vis = [...sec.querySelectorAll('p, span, li, h3, div')].filter(e => e.children.length === 0 && e.textContent.trim() && !card.contains(e)).map(e => { let o = 1, x = e; while (x && x !== sec) { o *= +getComputedStyle(x).opacity; x = x.parentElement } return [e.textContent.trim().slice(0, 60), +o.toFixed(2)] })
      return { vp: [vp.clientWidth, vp.clientHeight], bgSize: cs.backgroundSize, bgPos: cs.backgroundPosition, bgTransform: cs.transform, bgStyleNoUrl: (bg.getAttribute('style') || '').replace(/url\("[^"]*"\)/, 'url(IMG)'), rings, vis, url: bg.style.backgroundImage.slice(5, -2) }
    })
    if (k === 0) { const m = st.url.match(/^data:image\/(\w+);base64,(.*)$/); writeFileSync(`${out}/img/s${n}.${m[1]}`, Buffer.from(m[2], 'base64')) }
    delete st.url
    steps.push(st)
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1400)
    if (!(await p.evaluate(() => location.hash)).startsWith(`#/${n}`)) break
  }
  res[n] = steps
  console.log(n, 'steps', steps.length, steps[0].vp, steps.map(s => s.bgStyleNoUrl).join(' | ').slice(0, 300))
}
writeFileSync(`${out}/walk.json`, JSON.stringify(res, null, 1))
await b.close()
