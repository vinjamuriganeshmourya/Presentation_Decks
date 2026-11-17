import type { ReactNode } from 'react'
import { BookOpen, Hourglass, Lock, Network, RadioTower, Router, Ruler, Server, ServerCog, ShieldAlert, ZoomIn } from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { At, BOX_W, Card, Fade, Label, STILL, Stage, useBuild } from '../scene'
import { TILE_SKIN } from '../card'
import { CvIcon, fx, LitFigure, LitPoints } from './fx'
import { Mono, NET } from './frames'
import { Cidr, Disc, EASE, Host, SPRING } from './subnets-parts'

/**
 * T08-1 and T08-1b · THE RESERVED ADDRESS COST, made concrete: the /24 block as
 * its 256 addresses (one square each), and beside it a ZOOM of the block's
 * corners at a size where each reserved address shows what AWS keeps it for
 * (network, router, DNS, future use, broadcast: the point's own list, as icons
 * with no caption) and the first usable one takes a host. T08-1b puts the /28
 * beside it at the same square size, zooms it too, fills its 11 usable
 * addresses and turns a 12th host away, then locks the /24's range.
 */

const CELL = 12
const CELL_GAP = 2
const GRID_PAD = 8
const gridSize = (side: number) => side * CELL + (side - 1) * CELL_GAP + GRID_PAD * 2
/** AWS reserves the first four addresses of a subnet and the last: the squares that shade. */
const reservedOf = (n: number) => new Set([0, 1, 2, 3, n - 1])

/** The five reserved addresses' functions, in the point's order (network, router, DNS, future use, broadcast). */
const RESERVED_ICONS = [Network, Router, BookOpen, Hourglass, RadioTower]

/**
 * A subnet's address block as `side` x `side` small squares in a frame (the TR
 * guidance). The five reserved squares shade when `shaded`, the usable ones fill
 * when `filled`, sweeping in address order. Each square is a DOM span.
 */
function AddressGrid({ side, shaded, filled, framed = true }: { side: number; shaded: boolean; filled: boolean; framed?: boolean }) {
  const instant = useInstant()
  const n = side * side
  const reserved = reservedOf(n)
  const size = gridSize(side)
  return (
    <div className="rounded-[10px]" style={{ width: size, height: size, padding: GRID_PAD, ...TILE_SKIN, opacity: framed ? 1 : 0 }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${side}, ${CELL}px)`, gap: CELL_GAP }}>
        {Array.from({ length: n }, (_, i) => {
          const r = reserved.has(i)
          const on = r ? shaded : filled
          return (
            <span
              key={i}
              aria-hidden
              className="block rounded-[2px]"
              style={{
                width: CELL,
                height: CELL,
                background: on ? (r ? NET.lit : colors.brand) : colors.surface2,
                opacity: on ? (r ? 1 : 0.82) : 1,
                transform: on ? 'scale(1)' : 'scale(0.62)',
                transition: instant ? 'none' : `background 360ms ${EASE} ${r ? (i === n - 1 ? 320 : i * 80) : i * 3}ms, transform 420ms ${SPRING} ${r ? (i === n - 1 ? 320 : i * 80) : i * 3}ms`,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

/**
 * One address in a zoom: a reserved one (the template orange, its function's
 * icon) or a usable one (brand blue; `taken` puts a host's glyph on it). Empty
 * outline until it is `on`.
 */
function ZoomTile({ size, reserved, icon, on, taken = false, delay = 0 }: { size: number; reserved: boolean; icon?: ReactNode; on: boolean; taken?: boolean; delay?: number }) {
  const instant = useInstant()
  const tone = reserved ? NET.lit : colors.brand
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-[9px]"
      style={{
        width: size,
        height: size,
        color: colors.white,
        background: on ? (reserved ? `linear-gradient(180deg, #FFA562 0%, ${NET.lit} 100%)` : taken ? `linear-gradient(180deg, #4A7BFF 0%, ${colors.brand} 100%)` : '#DCE7FF') : colors.white,
        boxShadow: on ? `inset 0 0 0 1.5px ${tone}, 0 6px 12px -8px ${tone}` : `inset 0 0 0 1.5px ${colors.line}`,
        transform: on ? 'scale(1)' : 'scale(0.86)',
        transition: instant ? 'none' : `background 360ms ${EASE} ${delay}ms, box-shadow 360ms ${EASE} ${delay}ms, transform 460ms ${SPRING} ${delay}ms`,
      }}
    >
      <span className="grid place-items-center" style={{ opacity: on && (reserved || taken) ? 1 : 0, transform: on && (reserved || taken) ? 'scale(1)' : 'scale(0.4)', transition: instant ? 'none' : `opacity 300ms ${EASE} ${delay + 120}ms, transform 420ms ${SPRING} ${delay + 120}ms` }}>
        {icon}
      </span>
    </span>
  )
}

/** The three dots of a zoom's skipped rows (the addresses between its first and last rows). */
function Skip({ w }: { w: number }) {
  return (
    <span aria-hidden className="flex items-center justify-center gap-2" style={{ width: w }}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="block rounded-full" style={{ width: 7, height: 7, background: '#B8C8E6' }} />
      ))}
    </span>
  )
}

/** The magnifier between a block and its zoom. */
function Glass({ on, size = 28 }: { on: boolean; size?: number }) {
  return (
    <Fade on={on} lift={0}>
      <Disc size={size} tone={NET.lit} ink={NET.lit}>
        <span className="sb-glass grid place-items-center">
          <ZoomIn size={Math.round(size * 0.54)} strokeWidth={2.6} />
        </span>
      </Disc>
    </Fade>
  )
}

/** A legend chip: a swatch in the square's colour, then the card's word. */
function Swatch({ color, children }: { color: string; children: ReactNode }) {
  return (
    <Label size={14} strong raised icon={<span className="block rounded-[3px]" style={{ width: 12, height: 12, background: color }} />}>
      {children}
    </Label>
  )
}

/** The lock that closes on the /24's label: its shackle drops shut as it arrives. */
function ClosingLock({ size = 28 }: { size?: number }) {
  return (
    <span aria-hidden className="grid place-items-center rounded-full" style={{ width: size, height: size, background: NET.lock, boxShadow: `0 0 0 3px ${colors.white}, 0 8px 16px -8px rgba(16,32,58,0.6)` }}>
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ overflow: 'visible' }}>
        <g className="sb-shackle">
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </g>
        <rect x="3.5" y="11" width="17" height="10.5" rx="2" fill={colors.white} fillOpacity={0.18} />
      </svg>
    </span>
  )
}

/* the stage is 546 x 380 (pointsW 540, so every point holds to two lines: R7): the /24 frame (238 square) on the left, its zoom or the /28 on the right */
const S8 = {
  big: { x: 20, y: 50 },
  labelY: 18,
  chipsY: 302,
  right: 292,
  zoom: { y: 50, size: 238, tile: 46, gap: 8, pad: 15 },
  small: { y: 50 },
  zoom28: { y: 148, tile: 30, gap: 6, pad: 10 },
}
const BIG = gridSize(16)

/** The /24's ringed corners: the first four squares and the last, the parts the zoom shows. */
function CornerRings({ on }: { on: boolean }) {
  const ox = S8.big.x + GRID_PAD
  const oy = S8.big.y + GRID_PAD
  const step = CELL + CELL_GAP
  const ring = (x: number, y: number, w: number, h: number, d: number) => (
    <At x={x} y={y}>
      <Fade on={on} lift={0} delay={d}>
        <span aria-hidden className="block rounded-[5px]" style={{ width: w, height: h, boxShadow: `0 0 0 2px ${NET.lit}`, background: 'transparent' }} />
      </Fade>
    </At>
  )
  return (
    <>
      {ring(ox - 3, oy - 3, 4 * step - CELL_GAP + 6, CELL + 6, 0)}
      {ring(ox + 15 * step - 3, oy + 15 * step - 3, CELL + 6, CELL + 6, 320)}
    </>
  )
}

/**
 * The zoom of the /24's corners, a 4 x 4 of large addresses: the top row is the
 * block's first four (reserved: network, router, DNS, future use), the next row
 * starts the usable ones (the first takes a host), the dots skip the middle, the
 * last row ends on the broadcast address.
 */
function CornerZoom({ reserved, usable }: { reserved: boolean; usable: boolean }) {
  const z = S8.zoom
  const at = (c: number, r: number) => ({ x: z.pad + c * (z.tile + z.gap), y: z.pad + r * (z.tile + z.gap) })
  const icon = (i: number) => {
    const I = RESERVED_ICONS[i]
    return <I size={22} strokeWidth={2.3} />
  }
  const tiles: ReactNode[] = []
  for (let c = 0; c < 4; c++) {
    const p = at(c, 0)
    tiles.push(
      <At key={`r0${c}`} x={p.x} y={p.y}>
        <ZoomTile size={z.tile} reserved icon={icon(c)} on={reserved} delay={c * 90} />
      </At>,
    )
  }
  for (let c = 0; c < 4; c++) {
    const p = at(c, 1)
    tiles.push(
      <At key={`r1${c}`} x={p.x} y={p.y}>
        <ZoomTile size={z.tile} reserved={false} on={usable} delay={c * 60} />
      </At>,
    )
  }
  for (let c = 0; c < 4; c++) {
    const p = at(c, 3)
    tiles.push(
      <At key={`r3${c}`} x={p.x} y={p.y}>
        {c === 3 ? <ZoomTile size={z.tile} reserved icon={icon(4)} on={reserved} delay={380} /> : <ZoomTile size={z.tile} reserved={false} on={usable} delay={240 + c * 60} />}
      </At>,
    )
  }
  const host = at(0, 1)
  return (
    <div className="relative rounded-[14px]" style={{ width: z.size, height: z.size, ...TILE_SKIN }}>
      {tiles}
      <At x={z.pad} y={at(0, 2).y + z.tile / 2 - 4}>
        <Skip w={z.size - z.pad * 2} />
      </At>
      {/* the first usable address takes the subnet's first host */}
      <At x={host.x + z.tile / 2} y={host.y + z.tile / 2} cx cy>
        {usable && !STILL ? (
          <span className="sb-drop block" style={{ animationDelay: '520ms' }}>
            <Host icon="server-stack" size={36} />
          </span>
        ) : (
          <Host icon="server-stack" size={36} on={usable} />
        )}
      </At>
    </div>
  )
}

/** T08-1's build (`k`, 0 to 3): the empty grid, its /24 label, the five reserved squares (zoomed with their functions), the 251 usable and the first host. */
function SizingScene({ k }: { k: number }) {
  const label = k >= 1
  const shaded = k >= 2
  const filled = k >= 3
  return (
    <>
      <At x={S8.big.x} y={S8.labelY}>
        <Fade on={label}>
          <Cidr tone="brand" strong icon={<Ruler />}>
            /24
          </Cidr>
        </Fade>
      </At>
      <At x={S8.big.x} y={S8.big.y}>
        <AddressGrid side={16} shaded={shaded} filled={filled} />
      </At>
      <CornerRings on={shaded} />
      <At x={S8.big.x} y={S8.chipsY}>
        <Fade on={filled}>
          <div className="flex items-center gap-2">
            <Cidr>256 Addresses</Cidr>
            <Cidr tone="brand" strong>
              251 Usable
            </Cidr>
          </div>
        </Fade>
      </At>
      {/* the magnifier between the block and its zoom */}
      <At x={(S8.big.x + BIG + S8.right) / 2} y={S8.zoom.y + S8.zoom.size / 2} cx cy>
        <Glass on={shaded} />
      </At>
      <At x={S8.right} y={S8.zoom.y}>
        <CornerZoom reserved={shaded} usable={filled} />
      </At>
      {/* the /28's words, held unshown as they always were on this slide (T08-1b shows them): the slide's text is unchanged */}
      <At x={S8.right} y={S8.labelY}>
        <Fade on={false} lift={0}>
          <div className="flex flex-col items-start gap-2">
            <Cidr tone="brand" strong>
              /28
            </Cidr>
            <Cidr>16 Addresses</Cidr>
            <Cidr tone="brand" strong>
              11 Usable
            </Cidr>
          </div>
        </Fade>
      </At>
      {/* the legend: what a shaded square and a filled square are */}
      <At x={S8.right + S8.zoom.size / 2} y={S8.chipsY} cx>
        <div className="flex items-center gap-1.5">
          <Fade on={shaded}>
            <Swatch color={NET.lit}>AWS-Reserved</Swatch>
          </Fade>
          <Fade on={filled}>
            <Swatch color={colors.brand}>Usable</Swatch>
          </Fade>
        </div>
      </At>
    </>
  )
}

/**
 * The /28 zoomed, all 16 addresses: the five reserved with their functions, the
 * 11 usable taking a host each, one by one (`full`).
 */
function Zoom28({ on, full }: { on: boolean; full: boolean }) {
  const z = S8.zoom28
  const size = z.pad * 2 + 4 * z.tile + 3 * z.gap
  const reserved = reservedOf(16)
  let u = 0
  return (
    <div className="relative rounded-[14px]" style={{ width: size, height: size, ...TILE_SKIN }}>
      {Array.from({ length: 16 }, (_, i) => {
        const r = reserved.has(i)
        const I = r ? RESERVED_ICONS[i === 15 ? 4 : i] : Server
        const d = r ? (i === 15 ? 360 : i * 80) : 160 + u++ * 95
        return (
          <At key={i} x={z.pad + (i % 4) * (z.tile + z.gap)} y={z.pad + Math.floor(i / 4) * (z.tile + z.gap)}>
            <ZoomTile size={z.tile} reserved={r} icon={<I size={r ? 16 : 15} strokeWidth={2.4} />} on={r ? on : full} taken={!r} delay={d} />
          </At>
        )
      })}
    </div>
  )
}
const Z28 = S8.zoom28.pad * 2 + 4 * S8.zoom28.tile + 3 * S8.zoom28.gap

/* T08-1b's two panels (FS review 2026-11-04: "two stages in one image, recompose so both read clearly"): the /24 on
   its own card, the /28 on its own card beside it, each with its own header; both at the same square size */
const P24 = { w: 286, h: 364 }
const P28 = { w: 330, h: 364 }
const PANEL_GAP = 20
const T08B_POINTS_W = BOX_W - P24.w - P28.w - PANEL_GAP - 24

/** The /24 card: its header (the lock closes on it when the range is fixed), the block, its counts. */
function Panel24({ lock }: { lock: boolean }) {
  return (
    <>
      <At x={18} y={18}>
        <Cidr tone="brand" strong icon={<Ruler />}>
          /24
        </Cidr>
      </At>
      {/* the lock sits on the /24 label: its range is fixed */}
      <At x={124} y={31} cx cy>
        {lock && !STILL ? (
          <span className="cvx-pop block">
            <ClosingLock />
          </span>
        ) : (
          <Fade on={lock} lift={0}>
            <ClosingLock />
          </Fade>
        )}
      </At>
      <At x={(P24.w - BIG) / 2} y={58}>
        <div className="rounded-[10px]" style={{ boxShadow: lock ? `0 0 0 2.5px ${NET.lock}` : '0 0 0 0 transparent', transition: `box-shadow 420ms ${EASE} 300ms` }}>
          <AddressGrid side={16} shaded filled />
        </div>
      </At>
      <At x={P24.w / 2} y={58 + BIG + 18} cx>
        <div className="flex items-center gap-2">
          <Cidr>256 Addresses</Cidr>
          <Cidr tone="brand" strong>
            251 Usable
          </Cidr>
        </div>
      </At>
    </>
  )
}

/**
 * The /28 card (`k` 0 to 2): its header and true-size block with its counts; the magnifier and the zoom of its 16
 * addresses (the five reserved with their functions); then the 11 usable fill one by one and a 12th host arrives,
 * finds no address and is turned away (a warning over it). The legend at its foot.
 */
function Panel28({ k }: { k: number }) {
  const small = k >= 1
  const full = k >= 2
  const s28 = gridSize(4)
  const zy = 58 + s28 + 32
  const hostX = 18 + Z28 + (P28.w - 18 - Z28) / 2
  return (
    <>
      <At x={18} y={18}>
        <Fade on={small}>
          <Cidr tone="brand" strong icon={<Ruler />}>
            /28
          </Cidr>
        </Fade>
      </At>
      <At x={18} y={58}>
        <Fade on={small} lift={0}>
          <AddressGrid side={4} shaded={small} filled={small} />
        </Fade>
      </At>
      <At x={18 + s28 + 16} y={60}>
        <Fade on={small}>
          <div className="flex flex-col items-start gap-2">
            <Cidr>16 Addresses</Cidr>
            <Cidr tone="brand" strong>
              11 Usable
            </Cidr>
          </div>
        </Fade>
      </At>
      <At x={18 + s28 / 2} y={58 + s28 + 16} cx cy>
        <Glass on={small} size={24} />
      </At>
      <At x={18} y={zy}>
        <Fade on={small} lift={0}>
          <Zoom28 on={small} full={full} />
        </Fade>
      </At>
      {/* the 12th host arrives once the 11 are taken, finds no address and is turned away */}
      <At x={hostX} y={zy + Z28 / 2 + 22} cx cy>
        {full && !STILL ? (
          <span className="sb-bounce block" style={{ animationDelay: '1350ms' }}>
            <Host icon="server-stack" size={46} badge={<span className="cvx-pop block" style={{ animationDelay: '2100ms' }}><Disc size={22} tone={colors.danger} fill={colors.danger} ink={colors.white}><ShieldAlert size={12} strokeWidth={2.6} /></Disc></span>} />
          </span>
        ) : (
          <Host icon="server-stack" size={46} on={full} badge={<Disc size={22} tone={colors.danger} fill={colors.danger} ink={colors.white}><ShieldAlert size={12} strokeWidth={2.6} /></Disc>} />
        )}
      </At>
      <At x={hostX} y={zy + Z28 / 2 - 30} cx cy>
        {full && !STILL ? (
          <span className="cvx-pop block" style={{ animationDelay: '2100ms' }}>
            <span className={`${fx('glow', 0, 1.6).className} block`} style={fx('glow', 0, 1.6).style}>
              <CvIcon name="warning" w={32} />
            </span>
          </span>
        ) : (
          <Fade on={full} lift={0}>
            <CvIcon name="warning" w={32} />
          </Fade>
        )}
      </At>
      <At x={P28.w / 2} y={P28.h - 36} cx>
        <div className="flex items-center gap-2">
          <Swatch color={NET.lit}>AWS-Reserved</Swatch>
          <Swatch color={colors.brand}>Usable</Swatch>
        </div>
      </At>
    </>
  )
}

const T08_POINTS: ReactNode[] = [
  'The bigger the number, the smaller the subnet, and every subnet pays a fixed address tax before any host gets an IP',
  'AWS reserves five addresses per subnet for network, router, DNS, future use, and broadcast functions',
  <>
    A <Mono>/24</Mono> subnet provides 256 addresses but only 251 remain usable after these reservations
  </>,
  /* the TR's two /28 lines, now two points so each holds to two lines (FS review 2026-11-04: max two lines a point;
     the TR has them as two lines already, so nothing is cut or added) */
  <>
    A <Mono>/28</Mono> is the smallest subnet AWS allows
  </>,
  'It has 16 addresses but only 11 usable, so it saves VPC space but can run out of IPs quickly',
  "A subnet's CIDR range cannot change after creation, so plan for extra space from the start",
]
const T08_ICONS: ReactNode[] = [<Ruler key="0" size={20} />, <ServerCog key="1" size={20} />, <Server key="2" size={20} />, <ZoomIn key="3" size={20} />, <ShieldAlert key="4" size={20} />, <Lock key="5" size={20} />]

/** T08-1, split in two (user, 2026-10-30, G6): the lead and the /24 points; then the /28 and the fixed range. */
export function CidrSizing({ lesson }: { lesson: string }) {
  const k = useBuild(4, 1200, 1300)
  return (
    <LitFigure
      id="T08-1"
      kicker="CIDR Subnet Sizing"
      title="Reserved Address Cost"
      lead="Sizing a subnet means choosing its prefix length, the /number in its CIDR (Classless Inter-Domain Routing) range"
      lesson={lesson}
      points={T08_POINTS.slice(0, 3).map((text, i) => ({ icon: T08_ICONS[i], text }))}
      lit={k - 1}
      pointsW={540}
      pointSize={16}
      figH={380}
      figure={<SizingScene k={k} />}
    />
  )
}

/** T08-1b: the /28 points, then the two cards side by side (the /24 as T08-1 left it, the /28 being built). */
export function CidrSizing2({ lesson }: { lesson: string }) {
  const k = useBuild(4, 2400, 1200)
  return (
    <Card id="T08-1b" kicker="CIDR Subnet Sizing" title="Reserved Address Cost" lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <LitPoints items={T08_POINTS.slice(3).map((text, i) => ({ icon: T08_ICONS[i + 3], text }))} lit={k - 1} width={T08B_POINTS_W} size={16} />
        <div className="flex items-center" style={{ gap: PANEL_GAP }}>
          <Stage w={P24.w} h={P24.h} active={false}>
            <Panel24 lock={k >= 3} />
          </Stage>
          <Stage w={P28.w} h={P28.h} active={false}>
            <Panel28 k={Math.min(k, 2)} />
          </Stage>
        </div>
      </div>
    </Card>
  )
}

export const SIZING_CSS = ``
