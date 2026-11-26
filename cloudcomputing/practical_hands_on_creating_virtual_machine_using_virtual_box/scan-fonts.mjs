import { chromium } from 'playwright'
const b = await chromium.launch({ executablePath: '/opt/google/chrome/chrome' })
const p = await b.newPage({ viewport: { width: 1280, height: 720 } })
const bad = []
for (let i = 1; i <= 49; i++) {
  await p.goto(`http://localhost:5199/?all#/${i}`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  const r = await p.evaluate(() => {
    const sec = [...document.querySelectorAll('section')].find((s) => {
      const b = s.getBoundingClientRect()
      return b.width > 100 && getComputedStyle(s).opacity !== '0'
    })
    if (!sec) return { title: '', groups: [] }
    const groups = []
    const record = (name, nodes) => {
      const sizes = {}
      nodes.forEach((n) => {
        const t = (n.textContent || '').trim()
        if (!t) return
        const s = getComputedStyle(n).fontSize
        ;(sizes[s] ||= []).push(t.slice(0, 34))
      })
      const keys = Object.keys(sizes)
      if (keys.length > 1) groups.push({ name, sizes })
    }
    // bullet primary texts within one list
    sec.querySelectorAll('ul').forEach((ul, i) =>
      record(`bullets[${i}]`, [...ul.querySelectorAll(':scope > li > span:last-child > span:first-child')]))
    // card titles within one grid
    const cardTitles = [...sec.querySelectorAll('h3')]
    if (cardTitles.length > 1) record('card titles', cardTitles)
    return { title: (sec.querySelector('h1,h2')?.textContent || '').trim().slice(0, 34), groups }
  })
  if (r.groups.length) bad.push({ slide: i, ...r })
}
if (!bad.length) console.log('No slide has mixed text sizes within a bullet list or card row')
for (const s of bad) {
  console.log(`\nslide ${s.slide}  <${s.title}>`)
  for (const g of s.groups) {
    console.log(`  ${g.name}:`)
    for (const [size, texts] of Object.entries(g.sizes)) console.log(`     ${size}  ${texts.join(' | ').slice(0, 96)}`)
  }
}
await b.close()
