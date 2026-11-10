import { chromium } from 'playwright'
const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1280,height:720}})
await p.goto('http://localhost:5211/?all#/16'); await p.waitForTimeout(2600)
console.log(await p.evaluate(() => {
  const box = document.querySelector('[data-zone=space1]'); const out=[]
  let el = box; let d=0
  const walk=(e,d)=>{ if(d>4) return; const r=e.getBoundingClientRect(); out.push('  '.repeat(d)+e.tagName+' '+(e.className?.baseVal??e.className).toString().slice(0,50)+` y${Math.round(r.top)}..${Math.round(r.bottom)} h${Math.round(r.height)}`); for(const c of e.children) walk(c,d+1)}
  walk(box,0); return out.join('\n')
}))
await b.close()
