/**
 * Crops the bottom-right control cluster and the dot rail on a light slide and a
 * dark slide, so the deck chrome can be checked for legibility against both
 * stage families rather than assumed.
 */
import { chromium } from 'playwright'

const URL = process.argv[2] ?? 'http://localhost:5173'
const OUT = process.argv[3] ?? '/tmp/claude-1000/-home-nxtwave-Web-Slides/d1ea3893-5898-44ad-868c-ba0c1cdd14b1/scratchpad/shots'

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

// 11 = light content slide, 13 = night section breaker.
for (const [n, name] of [
  [11, 'light'],
  [13, 'night'],
]) {
  await page.goto(`${URL}/?all#/${n}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({
    path: `${OUT}/chrome-${name}.png`,
    clip: { x: 330, y: 660, width: 950, height: 60 },
  })
}

await browser.close()
console.log('cropped chrome strips written')
