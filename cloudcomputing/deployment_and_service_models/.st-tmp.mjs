import { chromium } from 'playwright'
const [file, out, n] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: '/usr/bin/brave-browser' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
await p.goto(`file://${file}?nav=steps&noauto#/${n}`, { waitUntil: 'load' }); await p.waitForTimeout(2200)
const dumpDom = () => p.evaluate(() => {
  const s = document.querySelector('section')
  const img = [...s.querySelectorAll('img')].sort((a, b) => b.naturalWidth * b.naturalHeight - a.naturalWidth * a.naturalHeight)[0]
  const chain = []; let e = img
  for (let i = 0; i < 5 && e; i++) { chain.push(`${e.tagName}.${(e.className && e.className.baseVal === undefined ? e.className : '').slice(0, 60)} style=${(e.getAttribute('style') || '').slice(0, 160)}`); e = e.parentElement }
  const ring = [...s.querySelectorAll('*')].filter(x => /ring|outline|highlight|spot/i.test(x.className && x.className.baseVal === undefined ? x.className : '') && x.getBoundingClientRect().width > 20).map(x => x.className.slice(0, 50) + ' ' + JSON.stringify(x.getBoundingClientRect().toJSON()).slice(0, 90)).slice(0, 4)
  return { nat: [img.naturalWidth, img.naturalHeight], src: img.src.slice(0, 30), box: img.getBoundingClientRect().toJSON(), chain, ring, step: document.body.innerText.match(/Step \d+|7[AB] · \w+/)?.[0] }
})
for (let k = 0; k < 5; k++) {
  console.log('--- press', k, JSON.stringify(await dumpDom()))
  await p.screenshot({ path: `${out}/s${n}_${k}.png` })
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1500)
  if (!(await p.evaluate(() => location.hash)).startsWith(`#/${n}`)) { console.log('left slide at press', k + 1); break }
}
await b.close()
