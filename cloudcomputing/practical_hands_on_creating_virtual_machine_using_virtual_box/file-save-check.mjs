/**
 * file-save-check: the built deck saves INTO ITSELF (generate-slides section 2d). Copies the built HTML
 * to a temp folder, opens it in Playwright's Chromium with the file dialog stubbed to write that copy,
 * edits a word and deletes a slide, then opens the copy in a fresh profile and expects both.
 * Run after `npm run build:html`:  node file-save-check.mjs [slide-hash, default the first walk slide]
 */
import { readFileSync as rf, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
const D = process.cwd()
const CFG = JSON.parse(rf(D + '/deck.config.json', 'utf8'))
const S = mkdtempSync(tmpdir() + '/file-save-check-')
const { chromium } = await import(D + '/node_modules/playwright/index.mjs')
import { copyFileSync, readFileSync, writeFileSync, statSync } from 'node:fs'
const FILE = S + '/' + CFG.htmlName + '.html'
copyFileSync(D + '/dist-single/' + CFG.htmlName + '.html', FILE)
const URL = 'file://' + FILE
const b = await chromium.launch()
const found = (p) => p.evaluate(() => [...document.querySelectorAll('section *')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && /EDITED/.test(n.textContent))).map(e => e.textContent.slice(0, 60)))

// 0. does real Chromium expose the API on a file:// page?
let p = await (await b.newContext()).newPage()
await p.goto(URL); await p.waitForTimeout(1500)
console.log('real API on file://:', await p.evaluate(() => typeof window.showSaveFilePicker))
await p.context().close()

// 1. presenter edits + deletes, the picker stubbed to write the real file on disk
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } })
await ctx.exposeFunction('__writeFile', (data) => { writeFileSync(FILE, data); return true })
await ctx.addInitScript(() => {
  window.showSaveFilePicker = async () => ({
    name: 'deck.html',
    queryPermission: async () => 'granted',
    createWritable: async () => { let buf = ''; return { write: async (d) => { buf += d }, close: async () => { await window.__writeFile(buf) } } },
  })
})
p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.goto(URL + '#/' + (process.argv[2] || '9-email') + ''); await p.waitForTimeout(2000)
await p.getByRole('button', { name: /^Edit the text/ }).first().click(); await p.waitForTimeout(400)
await p.locator('[data-edit-key]').nth(5).click(); await p.keyboard.press('End'); await p.keyboard.type(' EDITED')
await p.waitForTimeout(2500)
console.log('badge:', await p.evaluate(() => document.querySelector('[data-file-save]')?.textContent))
let html = readFileSync(FILE, 'utf8')
console.log('file has state:', (html.match(/<script id="deck-state">[^<]{0,200}/) || ['NONE'])[0])
// delete slide "stop-autopay" through the picker
await p.keyboard.press('Escape')
await p.evaluate(() => document.querySelector('[aria-label^="Stop editing"]')?.click())
await p.keyboard.press('g'); await p.waitForTimeout(800)
const del = p.locator('[aria-label="Delete this slide"]')
console.log('delete buttons:', await del.count())
if (await del.count()) { await del.nth(Math.max(0, (await del.count()) - 5)).click({ force: true }); await p.waitForTimeout(2500) }
html = readFileSync(FILE, 'utf8')
console.log('state scripts in file:', (html.match(/<script id="deck-state">/g) || []).length, '| size MB', (statSync(FILE).size / 1e6).toFixed(2))
console.log('file state:', (html.match(/<script id="deck-state">([^<]{0,300})/) || [])[1])
await ctx.close()

// 2. "the person you shared it with": fresh browser, no localStorage, no stub
p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.goto(URL + '#/' + (process.argv[2] || '9-email') + ''); await p.waitForTimeout(2500)
console.log('recipient sees edit:', await found(p))
console.log('recipient deck:', await p.evaluate(() => JSON.stringify({ total: window.__DECK__?.total, deleted: window.__DECK__?.deleted, view: window.__DECK__?.view })))
console.log('recipient has Edit button:', await p.locator('[aria-label^="Edit the text"]').count())
const recip = await p.evaluate(() => ({ total: window.__DECK__?.total, deleted: window.__DECK__?.deleted?.length }))
const ok = (await found(p)).length > 0 && recip.deleted === 1 && (await p.locator('[aria-label^="Edit the text"]').count()) === 1
await b.close()
console.log(ok ? '\nFILE SAVE OK: the shared copy opens with the edit, the deletion and the controls.' : '\nFILE SAVE FAILED')
process.exit(ok ? 0 : 1)
