import { colors } from '@/design/tokens'
import { useBeats, iconByName } from '@/ui'
import { Clock, Gauge } from 'lucide-react'
import { Card, Stage, At, Fade, Label, Note, Slider, useLoop, BOX_W } from './scene'
import { useEase } from './art'
import { ClayCalendar, Crate } from './clay-a'
import { CARD_SKIN } from './card'
import whyLeft from './img/why-left.png'
import whyRight from './img/why-right.png'
import lit0 from './img/tile-lit-0.png'
import lit1 from './img/tile-lit-1.png'
import lit2 from './img/tile-lit-2.png'
import frost0 from './img/tile-frost-0.png'
import frost1 from './img/tile-frost-1.png'
import frost2 from './img/tile-frost-2.png'

/**
 * SLIDE 5, WHY CLOUD EMERGED (user, 2026-10-16): the exact illustration of
 * the reference render "Cloud Computing: From Guesswork to Scale",
 * proportionate to the slide. Each card IS the render's card, cut six pixels
 * inside its border with the render's own text wiped (a horizontal gradient
 * fill across each text block, `scratchpad` pipeline recorded in the session
 * CLAUDE.md), so the deck's DOM text sits where the render's did (content
 * rule 17: labels are DOM). The rack, coins, plinth, cloud, cables, tiles
 * and meter are the render's pixels; nothing is redrawn.
 *
 * What still moves (global rule 3, review 2026-10-16): the Demand slider runs
 * by itself, a constant-speed ping-pong with no reset, and the picture
 * follows it: the chips' numbers, and the nine rented tiles, each a cut of
 * the render's own lit or frosted tile laid over the card and cross-faded as
 * demand lights or frees it. The render's base shows its top row lit, so a
 * cell carries the cut of the other state and fades it in when its state
 * differs from the base.
 */

const OWNED = 6
const ServerIcon = iconByName.server
const CheckIcon = iconByName.check

function needOf(d: number) {
  return Math.round(d * 9)
}

/* the two card cuts: 714x386 and 756x386 in the render, scaled to one 284px row */
const H = 284
const LEFT_W = 522
const RIGHT_W = 558
const SR = RIGHT_W / 756

/* the nine tile cells in the right cut (render pixels), each 80x39 */
const CELL_X = [84, 189, 294]
const CELL_Y = [243, 287, 331]
const LIT = [lit0, lit1, lit2]
const FROST = [frost0, frost1, frost2]

/* the cuts are decoded when the deck loads, not when slide 5 mounts: a 200KB card decoding on the mount frame slows the glide in (nav-stress-check, 2026-10-16) */
if (typeof window !== 'undefined') {
  for (const src of [whyLeft, whyRight, ...LIT, ...FROST]) {
    const im = new Image()
    im.decoding = 'async'
    im.src = src
  }
}

export function WhyCloud({ lesson }: { lesson: string }) {
  const beat = useBeats(4)
  /* the render's resting numbers (2 billed, 4 paid idle) are the held frame: still = 0.25 */
  const demand = useLoop(8000, { mode: 'pingpong', still: 0.25 })
  const need = needOf(demand)
  const idle = Math.max(0, OWNED - need)
  const short = Math.max(0, need - OWNED)
  const ease = useEase()
  return (
    <Card id="why-emerged" kicker="Cloud Computing Overview" title="Why Cloud Emerged" lead="Traditional IT ties hardware purchases to guesses about future demand, locking capital years before the load actually arrives" lesson={lesson} beat={beat} total={4}>
      <div className="flex gap-[30px]">
        <Stage w={LEFT_W} h={H} active={false} style={{ ...CARD_SKIN, background: `url(${whyLeft}) center / 100% 100% no-repeat` }}>
          <At x={18} y={12}>
            <Label strong size={16} tone="dark">On-premise IT</Label>
            <Note size={15} className="mt-1.5">Organisation buys, installs, maintains hardware</Note>
          </At>
          <At x={246} y={92} w={270}>
            <div className="flex flex-col items-start gap-2.5">
              <Label tone="lift" size={15} raised icon={<ServerIcon />}>{'5 servers bought on a guess'}</Label>
              <Fade on={idle > 0}>
                <Label tone="warn" size={15} raised icon={<Clock />}>{`${idle} paid, idle`}</Label>
              </Fade>
              <Fade on={short > 0}>
                <Label tone="bad" size={15} raised>{`Short by ${short}: order more, wait weeks`}</Label>
              </Fade>
            </div>
          </At>
          {/* when short: the crate on order and the weeks it takes */}
          <At x={252} y={206}><div style={{ opacity: short > 0 ? 1 : 0, transition: ease }}><Crate w={72} /></div></At>
          <At x={340} y={202}><div style={{ opacity: short > 0 ? 1 : 0, transition: ease }}><ClayCalendar w={60} page="6" /></div></At>
        </Stage>
        <Stage w={RIGHT_W} h={H} active={false} style={{ ...CARD_SKIN, background: `url(${whyRight}) center / 100% 100% no-repeat` }}>
          <At x={18} y={12}>
            <Label strong size={16} tone="solid">Cloud IT</Label>
            <Note size={15} className="mt-1.5">Computing rented as a metered service</Note>
          </At>
          {CELL_Y.map((cy, r) =>
            CELL_X.map((cx, c) => {
              const i = r * 3 + c
              const lit = i < need
              const baseLit = r === 0
              const show = lit !== baseLit
              return (
                <img
                  key={i}
                  src={lit ? LIT[c] : FROST[c]}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="pointer-events-none absolute select-none"
                  style={{ left: cx * SR, top: cy * SR, width: 80 * SR, height: 39 * SR, opacity: show ? 1 : 0, transition: ease }}
                />
              )
            }),
          )}
          <At x={414} y={214} cx><Label size={15} tone="good" raised iconRound icon={<CheckIcon />}>{`${need} billed`}</Label></At>
        </Stage>
      </div>
      <div className="mt-3 flex items-center justify-between" style={{ width: BOX_W }}>
        <Slider value={demand} onChange={() => undefined} label="Demand" width={360} fill auto />
        <Fade on={beat >= 4}>
          <span className="inline-flex items-center gap-2.5 rounded-pill py-1.5 pl-2 pr-5 font-heading text-[16px] font-semibold" style={{ background: colors.white, color: colors.brandDark, boxShadow: `inset 0 0 0 1.5px ${colors.brand}, 0 10px 20px -12px rgba(16,32,58,0.35)` }}>
            <span className="grid h-7 w-7 place-items-center rounded-full [&>svg]:h-4 [&>svg]:w-4" style={{ background: colors.brand, color: colors.white }} aria-hidden>
              <Gauge />
            </span>
            Shift driven by cost, scale and speed pressures
          </span>
        </Fade>
      </div>
    </Card>
  )
}
