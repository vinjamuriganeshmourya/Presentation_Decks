import type { CSSProperties, ReactNode } from 'react'
import {
  Activity, AppWindow, ArrowLeftRight, Blocks, Bug, Check, ChevronRight, CircleCheck, Cloud, Cog, Copy, Database, Download, FileCode2, Files, GitBranch,
  Globe, Hammer, HardDrive, Hash, List, Package, PenLine, Play, Plug, RefreshCw, Search, Settings, ShieldCheck, Snowflake, Square, Tag, Trash2, X,
} from 'lucide-react'
import { colors } from '@/design/tokens'
import { useInstant } from '@/motion/instant'
import { Arrow, At, BOX_W, Card, Label, Stage, STILL, useCycle } from '../scene'
import { TILE_SKIN } from '../card'
import { ClayTerminal, LAB } from '../d3/kit'
import { AN_W, IsoAnalogy } from '../iso/frames'
import { Badge, BulletLine, fx } from './fx'
import { Crop, LockGlyph, Logo, Mono as FrameMono, Slab, STACK, StepLabel, Tile } from './frames'

/**
 * SECTION · DOCKER (slides 22 to 32): image vs container, pull and run, Part A
 * steps, the run command term by term, check stop remove, Dockerfile layers,
 * build caching, and the two analogies. Every string is the spec's.
 *
 * Corrections pass (user, 2026-11-03, `dist-single/slides-5-56-corrections.md`):
 * every figure is driven by ONE `useCycle` whose states are the steps (G12), the
 * point the figure is acting out is lit beside it, every bullet is the kit's
 * `BulletLine` (G7), arrows draw line then head and leave head first (G8), and
 * the analogies are drawn objects with one colour per path (G4).
 *
 *   22  image (frozen, locked, tagged) -> one container -> two more -> one removed, the image kept
 *   23  recipe card -> oven -> three cakes, each its own topping; image -> daemon -> three containers
 *   24  client -> socket -> cache miss -> pull -> container -> repeat run (cache hit); T07-1b the same figure
 *   26  pull, list, run hello-world, ps, ps -a: images on the shelf become containers
 *   27  run web-demo, ps, browser, stop, rm
 *   28  T09-1 (T09-1b merged back): command, then each term lit with its box (boxes stay), then the note
 *   29  a terminal: each command line lit in turn with its expected result under it
 *   30  a VS Code editor: line by line, the hover note, the layer dropping onto the stack
 *   31  COPY changes, its cache clears, then everything after it
 *   32  a house built floor by floor, the top floor redone; the stack built the same way
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'
const T = (ms = 420, d = 0) => `all ${ms}ms ${EASE} ${d}ms`

/** The session's `Mono`, kept on one line (a command never breaks across a line end). */
function Mono({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      <FrameMono>{children}</FrameMono>
    </span>
  )
}

/** Shown / faded / hidden, the one rule every highlight uses: the current part full, the rest at 0.3. */
const dimmed = (focus: boolean, any: boolean) => (STILL || !any || focus ? 1 : 0.3)

/* ------------------------------------------------------------------ shared drawings */

/** A small container box: a writable bar (its own colour) on two cobalt layer bars, in a raised tile. */
function ContainerGlyph({ w = 48, top = STACK.writable, run = false }: { w?: number; top?: string; run?: boolean }) {
  const bw = w - 14
  return (
    <div className="relative flex flex-col items-center gap-[3px] rounded-[10px] p-[7px]" style={{ width: w, ...TILE_SKIN }}>
      <span className="block rounded-[4px]" style={{ width: bw, height: 7, background: top }} />
      <span className="block rounded-[4px]" style={{ width: bw, height: 7, background: STACK.layer }} />
      <span className="block rounded-[4px]" style={{ width: bw, height: 7, background: STACK.layer }} />
      {run && (
        <span className="absolute grid place-items-center rounded-full" style={{ right: -8, top: -8, width: 18, height: 18, background: colors.success, color: colors.white }}>
          <Cog size={12} strokeWidth={2.6} {...fx('spin', 0, 3)} />
        </span>
      )}
    </div>
  )
}

/** A browser window: a title bar with three dots and an address bar, a pale page. */
function BrowserGlyph({ w = 60 }: { w?: number }) {
  const h = Math.round(w * 0.74)
  return (
    <div className="overflow-hidden rounded-[9px]" style={{ width: w, height: h, ...TILE_SKIN }}>
      <div className="flex items-center gap-[3px] px-[6px]" style={{ height: 13, background: LAB.navy }}>
        {[LAB.red, LAB.yellow, LAB.green].map((c) => (
          <span key={c} className="block rounded-full" style={{ width: 5, height: 5, background: c }} />
        ))}
        <span className="ml-1 block flex-1 rounded-full" style={{ height: 5, background: 'rgba(255,255,255,0.55)' }} />
      </div>
      <div className="flex flex-col gap-[4px] p-[6px]">
        <span className="block rounded-full" style={{ width: '70%', height: 6, background: STACK.layer }} />
        <span className="block rounded-full" style={{ width: '90%', height: 4, background: LAB.lavDeep }} />
        <span className="block rounded-full" style={{ width: '80%', height: 4, background: LAB.lavDeep }} />
      </div>
    </div>
  )
}

/** A tile's heading word (`Image`, `Container`, `Daemon`). */
function TileHead({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <div className="text-center font-heading font-bold leading-tight" style={{ fontSize: size, color: colors.brandDark }}>
      {children}
    </div>
  )
}

/** A cache tick: green when kept, grey when cleared; it pops when it turns green. */
function Tick({ on, size = 28 }: { on: boolean; size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: on ? colors.success : '#D5DCE8', color: colors.white, transform: on ? 'scale(1)' : 'scale(0.86)', transition: `background 420ms ${EASE}, transform 460ms cubic-bezier(0.34,1.56,0.64,1)` }}>
      <Check size={size * 0.55} strokeWidth={3} />
    </span>
  )
}

/** Read-only image layers: cobalt slabs with a lock each, `n` of them, no writable slot. */
function ImgStack({ w, n = 3, h = 40, size = 14, shackle = false }: { w: number; n?: number; h?: number; size?: number; shackle?: boolean }) {
  return (
    <div className="flex flex-col" style={{ width: w, gap: 6 }}>
      {Array.from({ length: n }, (_, i) => (
        <Slab key={i} w={w} h={h} fill={STACK.layer} size={size}>
          <span className={`block ${shackle && i === 0 ? fx('shackle', 0, 3.4).className : ''}`} style={shackle && i === 0 ? fx('shackle', 0, 3.4).style : undefined}>
            <LockGlyph size={size * 0.75} />
          </span>
        </Slab>
      ))}
    </div>
  )
}

/** A layer slab with an icon before its word (FROM, COPY, EXPOSE): the icon says what the layer holds. */
function IconSlab({ w, h = 46, icon, word, lit = false, size = 17, fill = STACK.layer }: { w: number; h?: number; icon: ReactNode; word: string; lit?: boolean; size?: number; fill?: string }) {
  return (
    <Slab w={w} h={h} fill={fill} lit={lit} size={size}>
      <span className="inline-flex items-center gap-2">
        <span className="grid place-items-center [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>
        {word}
      </span>
    </Slab>
  )
}

/**
 * An arrow along a polyline (stage units) that follows G8: the line draws tail to
 * head, then the head appears; on exit the head goes first, then the line retracts.
 */
function PathArrow({ pts, on, tone = colors.brand, delay = 0, width = 2.5 }: { pts: [number, number][]; on: boolean; tone?: string; delay?: number; width?: number }) {
  const instant = useInstant()
  const H = 9
  const [ax, ay] = pts[pts.length - 2]
  const [bx, by] = pts[pts.length - 1]
  const a = Math.atan2(by - ay, bx - ax)
  const base: [number, number] = [bx - Math.cos(a) * H, by - Math.sin(a) * H]
  const line = [...pts.slice(0, -1), base]
  const d = line.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')
  const px = Math.cos(a + Math.PI / 2) * 5
  const py = Math.sin(a + Math.PI / 2) * 5
  const head = `M ${bx} ${by} L ${base[0] + px} ${base[1] + py} L ${base[0] - px} ${base[1] - py} Z`
  const xs = [...pts.map((p) => p[0]), base[0] + px, base[0] - px]
  const ys = [...pts.map((p) => p[1]), base[1] + py, base[1] - py]
  const minX = Math.floor(Math.min(...xs) - 3)
  const minY = Math.floor(Math.min(...ys) - 3)
  const t = instant ? 'none' : on ? `stroke-dashoffset 760ms cubic-bezier(0.65,0,0.35,1) ${delay}ms, opacity 160ms ${delay}ms` : `stroke-dashoffset 480ms cubic-bezier(0.65,0,0.35,1) 200ms, opacity 160ms 620ms`
  const ht = instant ? 'none' : on ? `opacity 240ms ${delay + 740}ms` : 'opacity 160ms 0ms'
  return (
    <svg aria-hidden className="pointer-events-none absolute" style={{ left: minX, top: minY, overflow: 'visible' }} width={Math.ceil(Math.max(...xs) + 3) - minX} height={Math.ceil(Math.max(...ys) + 3) - minY}>
      <g transform={`translate(${-minX} ${-minY})`}>
        <path d={d} stroke={tone} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray="1" style={{ strokeDashoffset: on ? 0 : 1, opacity: on ? 1 : 0, transition: t }} />
        <path d={head} fill={tone} style={{ opacity: on ? 1 : 0, transition: ht }} />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ bullets (G7) and the points frame */

type BKind = 'ring' | 'tick' | 'arrow' | 'diamond' | 'icon'
type BItem = { text: ReactNode; icon?: ReactNode; kind?: BKind }

/** The TR's points as raised tiles, each with the kit's `BulletLine` marker (centred on the first line); `lit` is the one the figure is on. */
function BPoints({ items, width = 452, size = 18, gap = 10, lit = -1, equal = false }: { items: BItem[]; width?: number; size?: number; gap?: number; lit?: number; equal?: boolean }) {
  return (
    /* `equal`: every box as tall as the tallest, its words centred in it (slide 31, user 2026-11-04) */
    <div className={equal ? 'grid shrink-0' : 'flex shrink-0 flex-col'} style={{ width, gap, ...(equal ? { gridAutoRows: '1fr' } : {}) }}>
      {items.map((it, i) => {
        const on = !STILL && i === lit
        return (
          <div
            key={i}
            className={`rounded-2xl px-3.5 py-2.5 ${equal ? 'flex items-center' : ''}`}
            style={{
              ...TILE_SKIN,
              boxShadow: on ? `inset 0 0 0 2px ${colors.brand}, 0 12px 24px -14px ${colors.brand}` : TILE_SKIN.boxShadow,
              background: on ? 'linear-gradient(180deg, #F4F8FF 0%, #E3ECFD 100%)' : TILE_SKIN.background,
              transform: on ? 'translateX(4px)' : 'none',
              transition: T(),
            }}
          >
            <BulletLine kind={it.kind ?? (it.icon ? 'icon' : 'ring')} icon={it.icon} size={size} lineH={1.4}>
              {it.text}
            </BulletLine>
          </div>
        )
      })}
    </div>
  )
}

function BFigure({ id, kicker, title, lead, lesson, points, lit, figure, pointsW = 452, figH = 380, size = 18, equal = false }: { id: string; kicker: string; title: string; lead?: string; lesson: string; points: BItem[]; lit: number; figure: ReactNode; pointsW?: number; figH?: number; size?: number; equal?: boolean }) {
  return (
    <Card id={id} kicker={kicker} title={title} lead={lead} lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 24 }}>
        <BPoints items={points} width={pointsW} lit={lit} size={size} equal={equal} />
        <Stage w={BOX_W - pointsW - 24} h={figH} active={false}>
          {figure}
        </Stage>
      </div>
    </Card>
  )
}

/** A round icon chip (no words): what a tile holds, said with a picture. */
function IconChip({ children, tone = colors.brand, bg = '#E8F0FF', size = 32, className = '', style }: { children: ReactNode; tone?: string; bg?: string; size?: number; className?: string; style?: CSSProperties }) {
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-[10px] ${className}`} style={{ width: size, height: size, background: bg, color: tone, boxShadow: `inset 0 0 0 1.5px ${tone}33`, ...style }}>
      {children}
    </span>
  )
}

/* ================================================================== 22 · T06-1 image vs container */

const C_X = (i: number) => 212 + i * 136
const C_W = 128

function ImageScene({ k }: { k: number }) {
  /* 0 the image alone, 1 a container from it, 2 two more, 3 one removed while the image stays */
  const shown = (i: number) => (i === 0 ? k >= 1 : k >= 2)
  const removed = (i: number) => i === 2 && k === 3
  return (
    <>
      {/* the image: frozen, locked, stored by ID and tag */}
      <At x={14} y={64}>
        <Tile w={172} lit={k === 0 || k === 2}>
          <div className="flex flex-col items-center gap-2.5 py-1">
            <div className="flex items-center gap-2">
              <Logo name="docker" h={24} />
              <TileHead>Image</TileHead>
            </div>
            <ImgStack w={152} h={44} shackle />
            <div className="flex items-center gap-2">
              <IconChip tone="#0EA5E9" bg="#E0F2FE"><Snowflake size={18} {...fx('spin', 0, 9)} /></IconChip>
              <IconChip><Tag size={17} /></IconChip>
              <IconChip><Hash size={17} /></IconChip>
              <IconChip tone={colors.brandDark} bg="#EEF2FA"><HardDrive size={17} /></IconChip>
            </div>
          </div>
        </Tile>
        <span className="absolute" style={{ right: -10, top: -12 }}>
          <Badge on={k === 3} ring={colors.success} size={34}><ShieldCheck size={19} color={colors.success} /></Badge>
        </span>
      </At>

      {/* one image, many containers: the connectors leave the image's top and drop onto each container */}
      {[0, 1, 2].map((i) => (
        <PathArrow key={i} pts={[[100, 62], [100, 30], [C_X(i) + C_W / 2, 30], [C_X(i) + C_W / 2, 62]]} on={shown(i) && !removed(i)} />
      ))}

      {[0, 1, 2].map((i) => (
        <At key={i} x={C_X(i)} y={64}>
          <div
            style={{
              opacity: shown(i) ? (removed(i) ? 0.3 : 1) : 0,
              transform: shown(i) ? (removed(i) ? 'scale(0.95)' : 'none') : 'translateY(-16px)',
              filter: removed(i) ? 'grayscale(1)' : 'none',
              transition: T(420, i === 2 && k === 2 ? 160 : 0),
            }}
          >
            <Tile w={C_W} lit={(k === 1 && i === 0) || (k === 2 && i > 0)}>
              <div className="flex flex-col items-center gap-2 py-1">
                <TileHead size={15}>Container</TileHead>
                <div className="flex items-center gap-1.5" style={{ height: 22 }}>
                  <span className="grid place-items-center rounded-full" style={{ width: 22, height: 22, background: removed(i) ? '#D5DCE8' : colors.success, color: colors.white }}>
                    <Cog size={14} strokeWidth={2.6} {...(removed(i) ? {} : fx('spin', -i, 4))} />
                  </span>
                  <Activity size={18} color={removed(i) ? colors.muted : colors.success} {...(removed(i) ? {} : fx('glow', i * 0.3, 1.6))} />
                </div>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <Slab w={C_W - 16} h={42} fill={STACK.writable} size={14}>
                    <span className="inline-flex items-center gap-1">
                      <PenLine size={13} strokeWidth={2.6} {...fx('wrench', i * 0.4, 2.4)} />
                      Writable
                    </span>
                  </Slab>
                  <ImgStack w={C_W - 16} h={36} size={13} />
                </div>
              </div>
            </Tile>
          </div>
          <span className="absolute" style={{ left: C_W / 2 - 20, top: 112 }}>
            <Badge on={removed(i)} ring={colors.danger} size={40}><Trash2 size={21} color={colors.danger} /></Badge>
          </span>
        </At>
      ))}
    </>
  )
}

export function ImageVsContainer({ lesson }: { lesson: string }) {
  const k = useCycle(4, 1700, 3)
  return (
    <BFigure
      id="T06-1"
      kicker="Image Vs Container"
      title="Template Vs Instance"
      lead="An image is a frozen, read-only template; a container is that template brought to life with its own writable layer on top"
      lesson={lesson}
      lit={k}
      points={[
        { icon: <Snowflake />, text: 'Image: built once, never changes, stored by ID and tag' },
        { icon: <PenLine />, text: 'Container: created from an image, has a thin writable layer' },
        { icon: <Copy />, text: 'One image can start many independent containers' },
        { icon: <Trash2 />, text: 'Deleting a container never deletes its source image' },
      ]}
      figure={<ImageScene k={k} />}
    />
  )
}

/* ================================================================== 23 · T06-AN recipe analogy */

/** One colour per path (G4): each cake and each container keeps its own colour from source to item. */
const PATHS = [colors.accent, '#16A34A', '#7C3AED']
const TOPS = ['#FF8FB1', '#9BE15D', '#B794F6']

/** A cake on a plate: two sponge tiers, icing in its own colour, a cherry. */
function Cake({ w = 104, icing }: { w?: number; icing: string }) {
  return (
    <svg width={w} height={w * 0.76} viewBox="0 0 100 76" aria-hidden>
      <ellipse cx="50" cy="69" rx="47" ry="6" fill="#DCE5F7" />
      <ellipse cx="50" cy="67" rx="44" ry="4.5" fill="#FFFFFF" stroke="#C9D5EE" />
      <rect x="12" y="40" width="76" height="26" rx="7" fill={LAB.wood} />
      <rect x="12" y="52" width="76" height="3" fill="#F6E1C8" opacity="0.8" />
      <rect x="12" y="40" width="76" height="9" rx="5" fill={icing} />
      <path d="M 12 46 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 5 7 10 0 q 3 5 6 0" fill="none" stroke={icing} strokeWidth="3" />
      <rect x="26" y="20" width="48" height="22" rx="6" fill={LAB.wood} />
      <rect x="26" y="20" width="48" height="8" rx="4" fill={icing} />
      <path d="M 26 26 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0 q 4 6 8 0" fill="none" stroke={icing} strokeWidth="3" />
      {[20, 34, 50, 66, 80].map((x) => (
        <circle key={x} cx={x} cy={60} r="1.6" fill="#FFFFFF" opacity="0.8" />
      ))}
      <path d="M 50 14 q 3 -8 9 -9" stroke="#3F7D3A" strokeWidth="1.6" fill="none" />
      <circle cx="50" cy="15" r="6" fill={LAB.red} />
      <circle cx="48" cy="13" r="2" fill="#FFFFFF" opacity="0.6" />
    </svg>
  )
}

/** A recipe card: an orange heading bar with a whisk, the ingredients each with its own picture, the numbered method. */
function RecipeCard() {
  const ing = [
    { c: '#FCE7A8', s: '#E0B43A' }, // egg
    { c: '#FFFFFF', s: '#B9C6E0' }, // flour
    { c: '#D6E8FF', s: '#6DAAFF' }, // milk
    { c: '#FFD9E6', s: '#FF8FB1' }, // icing sugar
  ]
  return (
    <svg width={124} height={164} viewBox="0 0 124 164" aria-hidden style={{ transform: 'rotate(-4deg)' }}>
      <rect x="3" y="5" width="118" height="156" rx="12" fill="#C9D5EE" opacity="0.5" />
      <rect x="0" y="0" width="118" height="156" rx="12" fill="#FFFFFF" stroke="#CFDCF5" strokeWidth="1.5" />
      <rect x="10" y="10" width="98" height="24" rx="8" fill={LAB.orange} />
      {/* a whisk on the heading */}
      <g transform="translate(20 14)" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round">
        <path d="M 8 16 L 8 9" />
        <path d="M 8 9 C 2 6 3 0 8 0 C 13 0 14 6 8 9" />
        <path d="M 8 9 C 5 6 6 2 8 1.5 C 10 2 11 6 8 9" />
      </g>
      <rect x="40" y="18" width="58" height="7" rx="3.5" fill="#FFFFFF" opacity="0.85" />
      {ing.map((g, i) => (
        <g key={i} transform={`translate(14 ${44 + i * 18})`}>
          <circle cx="6" cy="6" r="6" fill={g.c} stroke={g.s} strokeWidth="1.5" />
          <rect x="18" y="3" width={[56, 66, 48, 60][i]} height="6" rx="3" fill={LAB.lavDeep} />
        </g>
      ))}
      <line x1="12" y1="120" x2="106" y2="120" stroke="#E3EAF7" strokeWidth="1.5" />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(14 ${128 + i * 14})`}>
          <circle cx="5" cy="4" r="5" fill={colors.brand} />
          <rect x="15" y="1.5" width={[74, 58][i]} height="5" rx="2.5" fill={LAB.lavDeep} />
        </g>
      ))}
    </svg>
  )
}

/** An oven: a charcoal body, a glowing window while it bakes, two knobs and the heat rising. */
function Oven({ on }: { on: boolean }) {
  return (
    <div className="relative" style={{ width: 86, height: 96 }}>
      <svg width={86} height={96} viewBox="0 0 86 96" aria-hidden className="absolute inset-0">
        <rect x="2" y="16" width="82" height="76" rx="10" fill={LAB.charcoal} />
        <rect x="2" y="16" width="82" height="16" rx="8" fill="#55545E" />
        <circle cx="18" cy="24" r="4" fill="#C9C9D2" />
        <circle cx="32" cy="24" r="4" fill="#C9C9D2" />
        <rect x="52" y="21" width="24" height="6" rx="3" fill={on ? LAB.green : '#77767F'} style={{ transition: T() }} />
        <rect x="12" y="40" width="62" height="42" rx="6" fill="#26252C" />
        <rect x="12" y="40" width="62" height="42" rx="6" fill={LAB.orange} style={{ opacity: on ? 0.85 : 0, transition: T(600) }} className={on ? fx('glow', 0, 1.4).className : ''} />
        <rect x="22" y="62" width="42" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />
        <rect x="16" y="35" width="54" height="3" rx="1.5" fill="#9897A2" />
      </svg>
      {/* heat rising over the oven while it bakes */}
      {on &&
        [0, 1, 2].map((i) => (
          <span key={i} className={`absolute block rounded-full ${fx('job', -i * 0.9, 2.7).className}`} style={{ ...fx('job', -i * 0.9, 2.7).style, left: 26 + i * 14, top: 2, width: 6, height: 12, background: '#FFB27A' }} />
        ))}
    </div>
  )
}

const FAN_Y = [78, 200, 322]
const ITEM_CX = 378

/**
 * One source, one maker, three made from it. `k`: 0 the source, 1 the maker
 * starts, 2..4 one item each (its path lit, the others faded), 5 all of them.
 */
function FanScene({ k, source, maker, item, itemW }: { k: number; source: ReactNode; maker: ReactNode; item: (i: number) => ReactNode; itemW: number }) {
  const cur = k >= 2 && k <= 4 ? k - 2 : -1
  const x1 = 252
  const x2 = ITEM_CX - itemW / 2 - 8
  return (
    <>
      <At x={74} y={200} cx cy>
        <div style={{ opacity: cur >= 0 && !STILL ? 0.55 : 1, transition: T() }}>{source}</div>
      </At>
      <Arrow x1={138} y1={200} x2={160} y2={200} on={k >= 1} tone={colors.brandDark} />
      <At x={206} y={200} cx cy>
        {maker}
      </At>
      {FAN_Y.map((y, i) => (
        <div key={i} style={{ opacity: dimmed(cur === i, cur >= 0), transition: T() }}>
          <PathArrow pts={[[x1, 200], [x1 + 18, 200], [x2, y]]} on={k >= 2 + i} tone={PATHS[i]} width={cur === i ? 3.5 : 2.5} />
        </div>
      ))}
      {FAN_Y.map((y, i) => (
        <At key={i} x={ITEM_CX} y={y} cx cy>
          <div style={{ opacity: k >= 2 + i ? dimmed(cur === i, cur >= 0) : 0, transform: k >= 2 + i ? (cur === i ? 'scale(1.06)' : 'none') : 'translateX(-14px) scale(0.9)', transition: T(520) }}>{item(i)}</div>
        </At>
      ))}
    </>
  )
}

function CakeScene({ k }: { k: number }) {
  return (
    <FanScene
      k={k}
      source={
        <div className="flex flex-col items-center gap-2">
          <RecipeCard />
          <Label strong size={16}>Recipe card</Label>
        </div>
      }
      maker={<Oven on={k >= 1 && k <= 4} />}
      itemW={112}
      item={(i) => (
        <div className="relative">
          <Cake w={112} icing={TOPS[i]} />
          <span className="absolute block rounded-full" style={{ left: 4, top: 30, width: 10, height: 10, background: PATHS[i], boxShadow: `0 0 0 3px ${PATHS[i]}33` }} />
        </div>
      )}
    />
  )
}

function ImageFanScene({ k }: { k: number }) {
  return (
    <FanScene
      k={k}
      source={
        <div className="flex flex-col items-center gap-2">
          <Tile w={126}>
            <div className="flex flex-col items-center gap-2 py-1">
              <Logo name="docker" h={22} />
              <ImgStack w={108} h={30} size={12} shackle />
            </div>
          </Tile>
          <Label strong size={16}>Image</Label>
        </div>
      }
      maker={
        <div className="grid place-items-center rounded-[18px]" style={{ width: 82, height: 82, ...TILE_SKIN, boxShadow: `${TILE_SKIN.boxShadow}${k >= 1 && k <= 4 ? `, 0 0 0 3px ${colors.brand}55` : ''}`, transition: T() }}>
          <div className={k >= 1 && k <= 4 ? fx('bob', 0, 1.4).className : ''} style={fx('bob', 0, 1.4).style}>
            <Logo name="docker" h={40} />
          </div>
          <span className="absolute" style={{ right: -6, bottom: -6 }}>
            <IconChip size={26} tone={colors.white} bg={colors.brand}><Cog size={16} {...(k >= 1 && k <= 4 ? fx('spin', 0, 3) : {})} /></IconChip>
          </span>
        </div>
      }
      itemW={164}
      item={(i) => (
        <div className="flex items-center gap-2.5 rounded-[14px] p-2.5 pr-3.5" style={{ ...TILE_SKIN, boxShadow: `${TILE_SKIN.boxShadow}, inset 4px 0 0 ${PATHS[i]}` }}>
          <ContainerGlyph w={50} top={TOPS[i]} run />
          <span className="font-heading text-[17px] font-bold" style={{ color: colors.brandDark }}>Container</span>
        </div>
      )}
    />
  )
}

export function RecipeAnalogy({ lesson }: { lesson: string }) {
  /* one cycle drives both scenes, so the cake and its container arrive on the same press */
  const k = useCycle(6, 1600, 5)
  return (
    <IsoAnalogy
      id="T06-AN"
      kicker="Image Vs Container"
      title="One recipe, many cakes"
      text="A cake recipe card is reused to bake many separate cakes, just as one Docker image can start many independent containers"
      lesson={lesson}
      everyday={{ label: 'One recipe, many cakes', scene: <CakeScene k={k} /> }}
      cloud={{ label: 'One image, many containers', scene: <ImageFanScene k={k} /> }}
      bare
      h={400}
    />
  )
}

/* ================================================================== 24, 25 · T07-1 pull and run */

const PULL_POINTS_W = 560

/**
 * 0 the client, 1 the request over the socket, 2 the cache check misses, 3 the
 * pull from the registry (layers flowing down), 4 the container starts, 5 a
 * repeat run: the cache hits and the registry is skipped.
 */
function PullScene({ k }: { k: number }) {
  const GREY = '#B8C3D6'
  const repeat = k === 5
  const checked = k >= 2
  const miss = checked && !repeat
  const pulling = k === 3
  return (
    <>
      {/* client */}
      <At x={62} y={124} cx>
        <div className="flex flex-col items-center gap-1" style={{ transform: k === 0 || k === 5 ? 'translateY(-3px)' : 'none', transition: T() }}>
          <ClayTerminal w={96} lit={k === 0 || k === 1 || k === 5} />
          <Label strong size={16}>Client</Label>
        </div>
      </At>

      {/* client -> daemon over the API socket, a request riding it */}
      <Arrow x1={114} y1={168} x2={200} y2={168} on={k >= 1} />
      {(k === 1 || k === 5) && !STILL && <span aria-hidden className={`absolute block rounded-full ${fx('flow', 0, 1.4).className}`} style={{ ...fx('flow', 0, 1.4).style, left: 116, top: 162, width: 12, height: 12, background: colors.accent, boxShadow: `0 0 0 4px ${colors.accent}33`, ['--dx' as string]: '68px' } as CSSProperties} />}
      <At x={154} y={182} cx>
        <Label size={14} tone="brand">API socket</Label>
      </At>

      {/* daemon */}
      <At x={204} y={118}>
        <Tile w={124} lit={k >= 1 && k <= 4}>
          <div className="flex flex-col items-center gap-1 py-1">
            <div className={k >= 1 ? fx('bob', 0, 1.6).className : ''} style={fx('bob', 0, 1.6).style}>
              <Logo name="docker" h={30} />
            </div>
            <TileHead>Daemon</TileHead>
          </div>
        </Tile>
      </At>

      {/* the local image cache: icon and words centred in their box, the result badge on its corner */}
      <At x={162} y={236}>
        <div
          className="relative flex items-center justify-center gap-2 rounded-[14px] px-3"
          style={{ width: 172, height: 48, ...TILE_SKIN, boxShadow: `${TILE_SKIN.boxShadow}${checked ? `, 0 0 0 3px ${miss ? colors.danger : colors.success}55` : ''}`, transition: T() }}
        >
          <span className={`grid place-items-center ${k === 2 || k === 5 ? fx('hop', 0, 1.2).className : ''}`} style={{ ...fx('hop', 0, 1.2).style, color: colors.brandDark }}>
            {k === 2 || k === 5 ? <Search size={18} /> : <Database size={18} />}
          </span>
          <span className="whitespace-nowrap text-[14px] font-semibold leading-none" style={{ color: colors.ink }}>Local image cache</span>
          <span className="absolute" style={{ right: -10, top: -10 }}>
            <Badge on={checked} ring={miss ? colors.danger : colors.success} size={26}>
              {miss ? <X size={15} color={colors.danger} strokeWidth={3} /> : <Check size={15} color={colors.success} strokeWidth={3} />}
            </Badge>
          </span>
        </div>
      </At>

      {/* daemon -> registry, dashed: THE pull, only on a miss */}
      <Arrow x1={330} y1={132} x2={372} y2={92} dashed tone={k >= 3 && !repeat ? colors.accent : GREY} on={k >= 3 && !repeat} />
      <At x={206} y={78}>
        <Label mono size={14} tone={k >= 3 && !repeat ? 'warn' : 'muted'} icon={<Package />}>docker pull</Label>
      </At>
      {/* the layers coming down from the registry while it pulls */}
      {pulling &&
        !STILL &&
        [0, 1, 2].map((i) => (
          <span key={i} aria-hidden className={`absolute block rounded-[3px] ${fx('flow', -i * 0.5, 1.5).className}`} style={{ ...fx('flow', -i * 0.5, 1.5).style, left: 384, top: 92, width: 22, height: 7, background: STACK.layer, ['--dx' as string]: '-40px', ['--dy' as string]: '36px' } as CSSProperties} />
        ))}

      {/* daemon -> container */}
      <Arrow x1={330} y1={196} x2={372} y2={258} on={k >= 4} />

      {/* registry */}
      <At x={376} y={14}>
        <Tile w={136} dim={k < 3 || repeat} lit={pulling}>
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="flex items-center gap-1.5">
              <Cloud size={18} color={colors.brand} />
              <TileHead>Registry</TileHead>
            </div>
            <Logo name="docker" h={26} caption="Docker Hub" />
          </div>
        </Tile>
      </At>

      {/* container created */}
      <At x={376} y={232}>
        <div style={{ opacity: k >= 4 ? 1 : 0.25, transition: T() }}>
          <Tile w={136} lit={k >= 4}>
            <div className="flex flex-col items-center gap-1.5 py-1">
              <ContainerGlyph w={46} run={k >= 4} />
              <TileHead size={15}>Container</TileHead>
            </div>
          </Tile>
        </div>
      </At>

      {/* which run this is */}
      <At x={20} y={326}>
        <div className="flex items-center gap-2">
          <Label mono size={14} icon={<Play />}>docker run hello-world</Label>
          <Label size={14} strong tone={repeat ? 'good' : 'warn'} icon={repeat ? <RefreshCw /> : <Download />}>{repeat ? 'repeat run' : 'cache miss'}</Label>
        </div>
      </At>
    </>
  )
}

/** T07-1, first half (user, 2026-10-30: split): the lead and the two commands. */
export function PullRun({ lesson }: { lesson: string }) {
  const k = useCycle(6, 1500, 5)
  return (
    <BFigure
      id="T07-1"
      kicker="Client Daemon Registry"
      title="Pull And Run Flow"
      lead="Running an image that the daemon does not have locally triggers a pull from a registry, Docker Hub by default, before a container starts"
      lesson={lesson}
      lit={k === 3 ? 0 : k === 1 || k === 4 ? 1 : -1}
      points={[
        { icon: <Package />, text: <>Explicit pull: <Mono>docker pull nginx:alpine</Mono> fetches an image with no container created, the same mechanism <Mono>docker run</Mono> triggers automatically</> },
        { icon: <Play />, text: <><Mono>docker run hello-world</Mono>: no flags, image name only, pulled if absent locally</> },
      ]}
      figure={<PullScene k={k} />}
      pointsW={PULL_POINTS_W}
    />
  )
}

/** T07-1, second half: the socket, the cache check and the repeat run, with the same figure. */
export function PullRun2({ lesson }: { lesson: string }) {
  const k = useCycle(6, 1500, 5)
  return (
    <BFigure
      id="T07-1b"
      kicker="Client Daemon Registry"
      title="Pull And Run Flow"
      lesson={lesson}
      lit={k === 1 ? 0 : k === 2 ? 1 : k === 5 ? 2 : -1}
      points={[
        { icon: <Plug />, text: "Client sends the request over the daemon's local API socket" },
        { icon: <Database />, text: 'Daemon checks its local image cache first by name and tag' },
        { icon: <RefreshCw />, text: 'Pulled layers are cached, so a repeat run skips the registry' },
      ]}
      figure={<PullScene k={k} />}
      pointsW={PULL_POINTS_W}
    />
  )
}

/* ================================================================== 26, 27 · T08 Part A steps */

const PA_POINTS_W = 640

/** A pulled image on the shelf: three locked layer bars and its name. */
function ImageChip({ name, on, lit }: { name: string; on: boolean; lit?: boolean }) {
  return (
    <div style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(-18px)', transition: T(520) }}>
      <div className="flex items-center gap-2.5 rounded-[12px] px-2.5" style={{ width: 172, height: 54, ...TILE_SKIN, boxShadow: `${TILE_SKIN.boxShadow}${lit ? `, 0 0 0 3px ${colors.brand}66` : ''}`, transition: T() }}>
        <div className="flex flex-col gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="grid place-items-center rounded-[4px]" style={{ width: 34, height: 9, background: STACK.layer }}>
              <LockGlyph size={5} />
            </span>
          ))}
        </div>
        <span className="font-mono text-[14px] font-semibold" style={{ color: colors.brandDark, fontVariantLigatures: 'none' }}>{name}</span>
      </div>
    </div>
  )
}

/** A container card: the glyph, its name, its state on the corner. */
function CtrCard({ name, on, state, lit, children }: { name: string; on: boolean; state: 'run' | 'exit' | 'stop' | 'gone'; lit?: boolean; children?: ReactNode }) {
  const gone = state === 'gone'
  return (
    <div style={{ opacity: on ? (gone ? 0.18 : state === 'run' ? 1 : 0.7) : 0, transform: on ? (gone ? 'scale(0.92)' : 'none') : 'translateX(-16px)', filter: state === 'run' ? 'none' : 'grayscale(0.8)', transition: T(520) }}>
      <div className="flex items-center gap-2.5 rounded-[12px] px-2.5" style={{ width: 188, height: 62, ...TILE_SKIN, boxShadow: `${TILE_SKIN.boxShadow}${lit ? `, 0 0 0 3px ${colors.brand}66` : ''}`, transition: T() }}>
        <ContainerGlyph w={42} run={state === 'run'} />
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-mono text-[14px] font-semibold leading-none" style={{ color: colors.brandDark, fontVariantLigatures: 'none' }}>{name}</span>
          {children}
        </div>
      </div>
    </div>
  )
}

const SHELF = { x: 14, y: 100, w: 196, h: 200 }
const CTR_X = 236

/** The images shelf (the local cache) and the registry above it. */
function Shelf({ lit, children, pullOn, pullLit }: { lit: boolean; children: ReactNode; pullOn: boolean; pullLit: boolean }) {
  return (
    <>
      <At x={SHELF.x + 30} y={12}>
        <div className="flex items-center gap-2 rounded-[12px] px-3" style={{ height: 48, ...TILE_SKIN }}>
          <Cloud size={22} color={colors.brand} />
          <Logo name="docker" h={24} />
        </div>
      </At>
      <Arrow x1={SHELF.x + 82} y1={64} x2={SHELF.x + 82} y2={SHELF.y - 4} on={pullOn} tone={pullLit ? colors.accent : colors.brand} />
      <At x={SHELF.x} y={SHELF.y}>
        <div className="relative rounded-[16px]" style={{ width: SHELF.w, height: SHELF.h, background: 'rgba(232,240,255,0.55)', boxShadow: `inset 0 0 0 ${lit ? 3 : 1.5}px ${lit ? colors.brand : '#CFDCF5'}`, transition: T() }}>
          <span className="absolute" style={{ left: 10, top: 10 }}>
            <IconChip size={28} tone={colors.brandDark} bg="#FFFFFF"><HardDrive size={16} /></IconChip>
          </span>
          <span className="absolute" style={{ right: 10, top: 10 }}>
            <Badge on={lit} size={28}><List size={16} color={colors.brand} /></Badge>
          </span>
          <div className="absolute flex flex-col gap-2.5" style={{ left: 12, top: 48 }}>{children}</div>
        </div>
      </At>
    </>
  )
}

/** A dashed ring around the containers while `docker ps` looks at them, a magnifier on its corner. */
function PsRing({ on, y, h }: { on: boolean; y: number; h: number }) {
  return (
    <At x={CTR_X - 8} y={y}>
      <div className="relative rounded-[16px]" style={{ width: 204, height: h, boxShadow: `inset 0 0 0 2px ${colors.brand}`, background: 'rgba(232,240,255,0.35)', opacity: on ? 1 : 0, transition: T() }}>
        <span className="absolute" style={{ right: -12, top: -12 }}>
          <Badge on={on} size={30}><Search size={17} color={colors.brand} {...fx('hop', 0, 1.2)} /></Badge>
        </span>
      </div>
    </At>
  )
}

function StatusChip({ children, tone }: { children: ReactNode; tone: string }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 text-[12px] font-semibold leading-none" style={{ height: 20, background: `${tone}1A`, color: tone, boxShadow: `inset 0 0 0 1px ${tone}55` }}>
      {children}
    </span>
  )
}

function PartAScene1({ k }: { k: number }) {
  /* 0 nothing local; 1 pull nginx:alpine; 2 docker images; 3 run hello-world; 4 docker ps; 5 docker ps -a */
  return (
    <>
      <Shelf lit={k === 2} pullOn={k >= 1} pullLit={k === 1 || k === 3}>
        <ImageChip name="nginx:alpine" on={k >= 1} lit={k === 1} />
        <ImageChip name="hello-world" on={k >= 3} lit={k === 3} />
      </Shelf>
      <PsRing on={k === 4 || k === 5} y={110} h={150} />
      <PathArrow pts={[[SHELF.x + 184, 230], [CTR_X - 20, 230], [CTR_X - 4, 156]]} on={k >= 3} />
      <At x={CTR_X} y={122}>
        <CtrCard name="hello-world" on={k >= 3} state={k >= 4 ? 'exit' : 'run'} lit={k === 3}>
          <div style={{ opacity: k >= 5 ? 1 : 0, transition: T() }}>
            <StatusChip tone={colors.muted}><Square size={9} fill="currentColor" />Exited (0)</StatusChip>
          </div>
        </CtrCard>
      </At>
      {/* what hello-world printed */}
      <At x={CTR_X + 6} y={198}>
        <div className="relative rounded-[12px] px-3 py-2 text-[14px] font-semibold leading-none" style={{ ...TILE_SKIN, color: colors.ink, boxShadow: `${TILE_SKIN.boxShadow}, inset 3px 0 0 ${colors.success}`, opacity: k >= 3 ? 1 : 0, transform: k >= 3 ? 'none' : 'translateY(-8px)', transition: T(420, 300) }}>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <CircleCheck size={15} color={colors.success} />
            Hello from Docker!
          </span>
        </div>
      </At>
    </>
  )
}

function PartAScene2({ k }: { k: number }) {
  /* 0 the state Part A left; 6 run web-demo; 7 ps; 8 browser; 9 stop; 10 rm */
  const state = k >= 5 ? 'gone' : k >= 4 ? 'stop' : 'run'
  return (
    <>
      <Shelf lit={false} pullOn pullLit={false}>
        <ImageChip name="nginx:alpine" on lit={k === 1} />
        <ImageChip name="hello-world" on />
      </Shelf>
      <PsRing on={k === 2 || k === 5} y={18} h={154} />
      <At x={CTR_X} y={26}>
        <CtrCard name="hello-world" on state="exit">
          <StatusChip tone={colors.muted}><Square size={9} fill="currentColor" />Exited (0)</StatusChip>
        </CtrCard>
      </At>
      <PathArrow pts={[[SHELF.x + 184, 178], [CTR_X - 20, 178], [CTR_X - 4, 132]]} on={k >= 1 && k < 5} />
      <At x={CTR_X} y={102}>
        <CtrCard name="web-demo" on={k >= 1} state={state} lit={k === 1 || k === 2}>
          <div className="flex items-center gap-1.5">
            <StatusChip tone={state === 'run' ? colors.success : colors.muted}>
              <Plug size={11} />
              8080:80
            </StatusChip>
            <span style={{ opacity: k >= 4 && k < 5 ? 1 : 0, transition: T() }}>
              <StatusChip tone={colors.danger}><Square size={9} fill="currentColor" /></StatusChip>
            </span>
          </div>
        </CtrCard>
        <span className="absolute" style={{ left: 168, top: -10 }}>
          <Badge on={k === 2} ring={colors.success} size={26}><Check size={15} color={colors.success} strokeWidth={3} /></Badge>
        </span>
        <span className="absolute" style={{ left: 80, top: 14 }}>
          <Badge on={k >= 5} ring={colors.danger} size={34}><Trash2 size={18} color={colors.danger} /></Badge>
        </span>
      </At>
      {/* the browser at localhost:8080 */}
      <PathArrow pts={[[CTR_X + 94, 168], [CTR_X + 94, 206]]} on={k >= 3 && k < 4} tone={colors.success} />
      <At x={CTR_X} y={210}>
        <div className="flex flex-col gap-2 rounded-[14px] p-2.5" style={{ width: 188, ...TILE_SKIN, opacity: k >= 3 ? (k >= 4 ? 0.35 : 1) : 0, transform: k >= 3 ? 'none' : 'translateY(10px)', transition: T(520) }}>
          <div className="flex items-center gap-1.5 rounded-full px-2" style={{ height: 22, background: '#EEF2FA' }}>
            <Globe size={13} color={colors.brand} />
            <span className="font-mono text-[12px]" style={{ color: colors.ink, fontVariantLigatures: 'none' }}>localhost:8080</span>
          </div>
          <div className="flex items-center gap-2">
            <BrowserGlyph w={46} />
            <span className="text-[14px] font-bold leading-tight" style={{ color: colors.ink }}>Welcome to nginx!</span>
          </div>
        </div>
      </At>
    </>
  )
}

/** The step's bullet: done steps tick, the current one leads on, the rest wait (G7). */
const stepKind = (i: number, k: number): BKind => (STILL || k > i + 1 ? 'tick' : k === i + 1 ? 'arrow' : 'ring')

function PartAFrame({ id, lead, lesson, items, k, figure }: { id: string; lead?: string; lesson: string; items: ReactNode[]; k: number; figure: ReactNode }) {
  return (
    <BFigure
      id={id}
      kicker="Part A Practical Steps"
      title="Images To Containers"
      lead={lead}
      lesson={lesson}
      lit={k - 1}
      size={17}
      figH={320}
      pointsW={PA_POINTS_W}
      points={items.map((text, i) => ({ text, kind: stepKind(i, k) }))}
      figure={figure}
    />
  )
}

export function PartA1({ lesson }: { lesson: string }) {
  const k = useCycle(6, 1600, 5)
  return (
    <PartAFrame
      id="T08-1"
      lead="Part A works with an existing image, tracing every command from an explicit pull to removing a running web server container"
      lesson={lesson}
      k={k}
      figure={<PartAScene1 k={k} />}
      items={[
        <>Step 1: <Mono>docker pull nginx:alpine</Mono> fetches the image explicitly, before any container runs</>,
        <>Step 2: <Mono>docker images</Mono> lists images already pulled</>,
        <>Step 3: <Mono>docker run hello-world</Mono>; expected Hello from Docker!</>,
        <>Step 4: <Mono>docker ps</Mono> shows currently running containers</>,
        <>Step 5: <Mono>docker ps -a</Mono> shows <Mono>hello-world</Mono> as Exited (0)</>,
      ]}
    />
  )
}

export function PartA2({ lesson }: { lesson: string }) {
  const k = useCycle(6, 1600, 5)
  return (
    <PartAFrame
      id="T08-2"
      lesson={lesson}
      k={k}
      figure={<PartAScene2 k={k} />}
      items={[
        <>Step 6: <Mono>docker run -d --name web-demo -p 8080:80 nginx:alpine</Mono> starts a server</>,
        <>Step 7: <Mono>docker ps</Mono> confirms <Mono>web-demo</Mono> running with its port mapping</>,
        <>Step 8: browser at <Mono>localhost:8080</Mono> shows Welcome to nginx!</>,
        <>Step 9: <Mono>docker stop web-demo</Mono> halts the container</>,
        <>Step 10: <Mono>docker rm web-demo</Mono> removes it; <Mono>docker ps -a</Mono> confirms it is gone</>,
      ]}
    />
  )
}

/* ================================================================== 28 · T09-1, T09-1b the run command, term by term */

/** A small picture of what each term does (G11): no words beyond the term's own values. */
function SlotArt({ i, on }: { i: number; on: boolean }) {
  const run = on && !STILL
  if (i === 0)
    return (
      <div className="flex items-center gap-3">
        <ClayTerminal w={70} lit={on} />
        <div className="relative" style={{ opacity: 0.9 }}>
          <ContainerGlyph w={52} run />
          <span className={`absolute ${run ? fx('lift', 0, 2.2).className : ''}`} style={{ ...fx('lift', 0, 2.2).style, left: -10, bottom: -10 }}>
            <IconChip size={24} tone={colors.white} bg={LAB.navy}><Activity size={14} /></IconChip>
          </span>
        </div>
      </div>
    )
  if (i === 1)
    return (
      <div className="relative flex items-center gap-1">
        <ContainerGlyph w={56} />
        <svg width="26" height="20" aria-hidden><path d="M 0 10 C 10 2 16 18 26 10" stroke={colors.brandDark} strokeWidth="2" fill="none" strokeDasharray="3 3" /></svg>
        <span className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1 ${run ? fx('wrench', 0, 2.6).className : ''}`} style={{ ...fx('wrench', 0, 2.6).style, background: '#FFF4E0', boxShadow: `inset 0 0 0 1.5px ${colors.warning}`, transformOrigin: '0% 50%' }}>
          <Tag size={14} color="#9A5B00" />
          <span className="font-mono text-[14px] font-semibold" style={{ color: '#9A5B00', fontVariantLigatures: 'none' }}>web-demo</span>
        </span>
      </div>
    )
  if (i === 2)
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <IconChip size={42} tone={colors.brandDark} bg="#EEF2FA"><AppWindow size={22} /></IconChip>
          <span className="font-mono text-[14px] font-bold" style={{ color: colors.brandDark }}>8080</span>
        </div>
        <div className="relative" style={{ width: 54, height: 20 }}>
          <span className="absolute left-0 right-0 top-[9px] block rounded-full" style={{ height: 2, background: colors.brand }} />
          {run && <span aria-hidden className={`absolute block rounded-full ${fx('flow', 0, 1.3).className}`} style={{ ...fx('flow', 0, 1.3).style, left: 0, top: 4, width: 12, height: 12, background: colors.accent, ['--dx' as string]: '42px' } as CSSProperties} />}
          <ArrowLeftRight size={16} color={colors.brand} className="absolute" style={{ left: 19, top: -14 }} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <ContainerGlyph w={46} run />
          <span className="font-mono text-[14px] font-bold" style={{ color: colors.brandDark }}>80</span>
        </div>
      </div>
    )
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-2">
        <Logo name="docker" h={22} />
        <ImgStack w={70} h={18} size={10} shackle={run} />
      </div>
      <span className="font-mono text-[14px] font-semibold" style={{ color: colors.brandDark, fontVariantLigatures: 'none' }}>nginx:alpine</span>
    </div>
  )
}

const SLOTS: { token: string; meaning: ReactNode }[] = [
  { token: '-d', meaning: <><Mono>-d</Mono>: run in background</> },
  { token: '--name web-demo', meaning: <><Mono>--name web-demo</Mono>: name the container</> },
  { token: '-p 8080:80', meaning: <><Mono>-p 8080:80</Mono>: map host port 8080 to container port 80</> },
  { token: 'nginx:alpine', meaning: <><Mono>nginx:alpine</Mono>: the image used</> },
]

/** A dark code panel with its location in the title bar (the spec's `code.location`). */
function CodePanel({ location, children, style }: { location: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="overflow-hidden rounded-[16px]" style={{ background: colors.brandDeep, boxShadow: '0 18px 36px -22px rgba(16,32,58,0.65)', ...style }}>
      <div className="flex items-center gap-2 px-4" style={{ height: 36, background: 'rgba(255,255,255,0.07)' }}>
        {[LAB.red, LAB.yellow, LAB.green].map((c) => (
          <span key={c} className="block rounded-full" style={{ width: 10, height: 10, background: c }} />
        ))}
        <span className="ml-2 font-mono text-[14px]" style={{ color: 'rgba(255,255,255,0.78)', fontVariantLigatures: 'none' }}>
          {location}
        </span>
      </div>
      {children}
    </div>
  )
}

/**
 * The command, one term lit at a time (G10, slides 20 and 21 the reference), round 2 (user, 2026-11-03):
 * T09-1 and T09-1b merged back into one slide. Steps: the command whole -> `-d` -> `--name` -> `-p` ->
 * `nginx:alpine` -> all four boxes even. The lit term full and the rest of the command at 0.3; each term's box
 * appears in the 2x2 grid when its term is lit and stays (faded while a later term is lit), so the full
 * state shows all four boxes. The Nginx note was removed (user, 2026-11-04).
 */
function RunPanel() {
  const k = useCycle(6, 2200, 5)
  const cur = k >= 1 && k <= 4 ? k - 1 : -1
  const tok = (i: number) => {
    const on = cur === i
    return (
      <span
        className="rounded-[6px] px-1 py-[5px] leading-[1.2]"
        style={{ background: on ? colors.accent : 'rgba(255,255,255,0.08)', color: on ? colors.brandDeep : '#FFFFFF', boxShadow: `inset 0 -3px 0 ${on ? colors.accentDark : 'rgba(109,170,255,0.7)'}`, opacity: cur < 0 || on ? 1 : 0.3, transition: T(380) }}
      >
        {SLOTS[i].token}
      </span>
    )
  }
  return (
    <div className="flex flex-col gap-3" style={{ width: BOX_W }}>
      <CodePanel location="Terminal (VS Code, PowerShell on Windows)">
        <div className="flex flex-wrap items-center gap-x-[0.6em] px-6 py-4 font-mono text-[26px] leading-none" style={{ color: '#FFFFFF', fontVariantLigatures: 'none' }}>
          <ChevronRight size={24} color={LAB.green} className="-mr-2" />
          <span style={{ opacity: cur < 0 ? 1 : 0.3, transition: T(380) }}>docker run</span>
          {tok(0)}
          {tok(1)}
          {tok(2)}
          {tok(3)}
          <span className={`inline-block ${fx('blink', 0, 1).className}`} style={{ ...fx('blink', 0, 1).style, width: 13, height: 26, background: 'rgba(255,255,255,0.75)' }} />
        </div>
      </CodePanel>
      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map((_, i) => {
          const on = cur === i
          const shown = STILL || k >= i + 1
          return (
            <div
              key={i}
              className="relative flex items-center gap-5 rounded-[16px] px-4 py-3"
              style={{ ...TILE_SKIN, minHeight: 100, boxShadow: on ? `${TILE_SKIN.boxShadow}, 0 0 0 3px ${colors.accent}` : TILE_SKIN.boxShadow, opacity: !shown ? 0 : cur < 0 || on ? 1 : 0.45, transform: shown ? 'none' : 'translateY(-12px)', transition: T(460) }}
            >
              <div className="grid shrink-0 place-items-center rounded-[12px]" style={{ width: 196, height: 84, background: '#F3F7FF', boxShadow: 'inset 0 0 0 1px #DCE6F8' }}>
                <div style={{ transform: 'scale(0.92)' }}>
                  <SlotArt i={i} on={on} />
                </div>
              </div>
              <div className="text-[19px] leading-snug" style={{ color: colors.ink }}>{SLOTS[i].meaning}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** T09-1, the run command term by term (round 2, 2026-11-03: T09-1 and T09-1b merged back into one slide). */
export function RunCommand({ lesson }: { lesson: string }) {
  return (
    <Card id="T09-1" kicker="Container Lifecycle Commands" title="Run Check Stop Remove" lead="A long-running service container is started, mapped to a host port, then checked, stopped and removed through the client-daemon flow" lesson={lesson}>
      <RunPanel />
    </Card>
  )
}

/** Stand-in, NOT in the deck: the merged slide, kept only so cvDeck compiles until its `T09-1b` line is removed. */
export function RunCommand2({ lesson }: { lesson: string }) {
  return <RunCommand lesson={lesson} />
}

/* ================================================================== 29 · T09-2 check, stop, remove */

const CHECKS: { cmd: ReactNode; note: ReactNode }[] = [
  { cmd: 'docker images', note: <><Mono>docker images</Mono>: lists cached images before running</> },
  { cmd: 'docker ps', note: <><Mono>docker ps</Mono>: expected <Mono>web-demo</Mono> Up, PORTS <Mono>0.0.0.0:8080-&gt;80/tcp</Mono></> },
  { cmd: <span className="inline-flex items-center gap-2"><Globe size={17} color={LAB.sky} />localhost:8080</span>, note: 'Browser at port 8080: expected the Welcome to nginx! page' },
  { cmd: 'docker stop web-demo', note: <><Mono>docker stop web-demo</Mono>: expected the container name echoed back</> },
  { cmd: 'docker rm web-demo', note: <><Mono>docker rm web-demo</Mono>: expected <Mono>web-demo</Mono> absent from <Mono>docker ps -a</Mono></> },
]

/** The commands in a terminal, each with its expected result under it (the slide-30 layout), lit one line at a time. */
export function CheckStopRemove({ lesson }: { lesson: string }) {
  const k = useCycle(6, 1800, 5)
  const cur = k - 1
  const LEFT = 660
  const RIGHT = BOX_W - LEFT - 30
  return (
    <Card id="T09-2" kicker="Container Lifecycle Commands" title="Run Check Stop Remove" lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 30 }}>
        <div className="overflow-hidden rounded-[16px]" style={{ width: LEFT, background: '#1E1E1E', boxShadow: '0 18px 36px -22px rgba(16,32,58,0.65)' }}>
          <div className="flex items-center gap-2 px-4" style={{ height: 34, background: '#2D2D2D' }}>
            {[LAB.red, LAB.yellow, LAB.green].map((c) => (
              <span key={c} className="block rounded-full" style={{ width: 10, height: 10, background: c }} />
            ))}
            <span className="ml-auto flex items-center gap-2" style={{ color: '#A0A0A0' }}>
              <Logo name="docker" h={16} />
              <Settings size={14} />
            </span>
          </div>
          <div className="flex flex-col gap-1 px-3 py-2">
            {CHECKS.map((c, i) => {
              const on = cur === i
              const reached = STILL || k > i
              return (
                <div key={i} className="flex flex-col gap-1 rounded-[10px] px-2.5 py-1" style={{ background: on ? 'rgba(255,138,61,0.14)' : 'transparent', boxShadow: on ? `inset 3px 0 0 ${colors.accent}` : 'none', opacity: STILL || cur < 0 || on ? 1 : reached ? 0.45 : 0.3, transition: T(380) }}>
                  <div className="flex items-center gap-2 font-mono text-[18px] leading-none" style={{ color: '#E7E7E7', fontVariantLigatures: 'none', height: 22 }}>
                    <ChevronRight size={17} color={LAB.green} />
                    <span>{c.cmd}</span>
                    {on && !STILL && <span className={`inline-block ${fx('blink', 0, 1).className}`} style={{ ...fx('blink', 0, 1).style, width: 9, height: 18, background: '#E7E7E7' }} />}
                  </div>
                  <div className="ml-6 w-fit rounded-[8px] bg-white px-2.5 py-1 text-[15px] leading-tight" style={{ color: colors.ink, opacity: reached ? 1 : 0, transform: reached ? 'none' : 'translateY(-6px)', transition: T(420) }}>
                    {c.note}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <figure className="m-0 flex flex-col items-start gap-3" style={{ width: RIGHT, opacity: STILL || cur < 0 || cur === 2 ? 1 : 0.45, transform: cur === 2 && !STILL ? 'translateY(-4px)' : 'none', transition: T() }}>
          <StepLabel>Browser Check: Step 8</StepLabel>
          <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 10, width: '100%' }}>
            <Crop name="slide-09-1" highlight={[[7, 6, 152, 34], [416, 66, 362, 58]]} maxW={RIGHT} maxH={250} alt="Browser at localhost:8080 showing Welcome to nginx!" />
          </div>
          <figcaption className="text-[16px] font-semibold leading-snug" style={{ color: colors.ink }}>
            Browser at <Mono>localhost:8080</Mono>: “Welcome to nginx!” confirms <Mono>web-demo</Mono> is serving traffic
          </figcaption>
        </figure>
      </div>
    </Card>
  )
}

/* ================================================================== 30 · T10-1 Dockerfile to layers (a VS Code editor) */

const DOCKERFILE: { kw: string; rest: { t: string; c: string }[]; note: ReactNode }[] = [
  { kw: 'FROM', rest: [{ t: 'nginx:alpine', c: '#4EC9B0' }], note: <>Line 1: <Mono>FROM</Mono> sets the base layer</> },
  { kw: 'COPY', rest: [{ t: 'index.html', c: '#CE9178' }, { t: '/usr/share/nginx/html/index.html', c: '#CE9178' }], note: <>Line 2: <Mono>COPY</Mono> adds the HTML layer</> },
  { kw: 'EXPOSE', rest: [{ t: '80', c: '#B5CEA8' }], note: <>Line 3: <Mono>EXPOSE</Mono> documents port 80, not published yet</> },
]

const VS = { bg: '#1F1F1F', side: '#181818', tab: '#1F1F1F', tabOff: '#181818', line: '#2B2B2B', gutter: '#6E7681', text: '#CCCCCC', kw: '#569CD6', status: '#007ACC' }

function VsEditor({ k, w }: { k: number; w: number }) {
  const cur = k - 1
  return (
    <div className="overflow-hidden rounded-[12px]" style={{ width: w, background: VS.bg, boxShadow: '0 18px 36px -22px rgba(16,32,58,0.7), 0 0 0 1px #2B2B2B' }}>
      {/* title bar */}
      <div className="relative flex items-center gap-3 px-3" style={{ height: 32, background: VS.side, borderBottom: `1px solid ${VS.line}` }}>
        <Logo name="vscode" h={16} />
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-[6px] px-3" style={{ height: 22, width: 260, background: '#2A2A2A', boxShadow: 'inset 0 0 0 1px #3C3C3C', color: '#9D9D9D' }}>
          <Search size={12} />
          <span className="font-mono text-[12px]" style={{ fontVariantLigatures: 'none' }}>cloud-docker-demo</span>
        </div>
        <div className="ml-auto flex items-center gap-3" style={{ color: '#9D9D9D' }}>
          <span className="block" style={{ width: 10, height: 1.5, background: '#9D9D9D' }} />
          <span className="block" style={{ width: 10, height: 10, border: '1.5px solid #9D9D9D' }} />
          <X size={13} />
        </div>
      </div>
      <div className="flex">
        {/* activity bar */}
        <div className="flex flex-col items-center gap-4 py-3" style={{ width: 44, background: VS.side, color: '#858585' }}>
          <span style={{ color: '#FFFFFF', boxShadow: '-12px 0 0 -10px #FFFFFF' }}><Files size={20} /></span>
          <Search size={19} />
          <GitBranch size={19} />
          <Bug size={19} />
          <Blocks size={19} />
          <span className="mt-auto"><Settings size={18} /></span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          {/* tab */}
          <div className="flex items-end" style={{ height: 34, background: VS.tabOff, borderBottom: `1px solid ${VS.line}` }}>
            <div className="flex items-center gap-2 px-3.5" style={{ height: 34, background: VS.tab, borderTop: `2px solid ${VS.status}`, color: '#FFFFFF' }}>
              <Logo name="docker" h={14} />
              <span className="text-[13px]">Dockerfile</span>
              <X size={12} color="#9D9D9D" />
            </div>
          </div>
          {/* breadcrumb */}
          <div className="flex items-center gap-1 px-3 text-[12px]" style={{ height: 24, color: '#A9A9A9' }}>
            <span>cloud-docker-demo</span>
            <ChevronRight size={12} />
            <Logo name="docker" h={11} />
            <span>Dockerfile</span>
          </div>
          {/* code */}
          <div className="flex flex-col py-1.5" style={{ gap: 4 }}>
            {DOCKERFILE.map((l, i) => {
              const on = cur === i
              const note = STILL || on
              return (
                <div key={l.kw} className="flex flex-col" style={{ opacity: STILL || cur < 0 || on ? 1 : 0.3, transition: T(380) }}>
                  <div className="flex items-center font-mono text-[19px]" style={{ height: 34, background: on ? 'rgba(255,255,255,0.07)' : 'transparent', boxShadow: on ? `inset 3px 0 0 ${colors.accent}, inset 0 0 0 1px #3A3A3A` : 'none', fontVariantLigatures: 'none', transition: T(380) }}>
                    <span className="text-right" style={{ width: 40, paddingRight: 14, color: on ? '#C6C6C6' : VS.gutter }}>{i + 1}</span>
                    <span style={{ color: VS.kw }}>{l.kw}</span>
                    {l.rest.map((r) => (
                      <span key={r.t} style={{ color: r.c, marginLeft: '0.6em' }}>{r.t}</span>
                    ))}
                    {on && !STILL && <span className={`inline-block ${fx('blink', 0, 1).className}`} style={{ ...fx('blink', 0, 1).style, marginLeft: 2, width: 2, height: 22, background: '#AEAFAD' }} />}
                  </div>
                  {/* the hover note under its line, like the editor's hover widget */}
                  <div className="flex items-center" style={{ height: 44, paddingLeft: 52 }}>
                    <div className="inline-flex items-center gap-2 rounded-[8px] bg-white px-3 text-[16px] leading-none" style={{ height: 34, color: colors.ink, boxShadow: `0 8px 18px -10px rgba(0,0,0,0.6), inset 0 0 0 1px #D0D7E2`, opacity: note ? 1 : 0, transform: note ? 'none' : 'translateY(-6px)', transition: T(420) }}>
                      <span>{l.note}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* status bar */}
      <div className="flex items-center gap-4 px-3 text-[12px]" style={{ height: 24, background: VS.status, color: '#FFFFFF' }}>
        <span className="flex items-center gap-1"><GitBranch size={12} /></span>
        <span className="flex items-center gap-1"><CircleCheck size={12} /></span>
        <span className="ml-auto flex items-center gap-1.5"><Logo name="docker" h={11} />Dockerfile</span>
      </div>
    </div>
  )
}

const LAYER_ICONS = { FROM: <Package />, COPY: <FileCode2 />, EXPOSE: <Plug /> } as const

export function DockerfileLayers({ lesson }: { lesson: string }) {
  /* 0 nothing built, then FROM, COPY, EXPOSE: the lit line, its note and its layer arrive together */
  const k = useCycle(4, 2200, 3)
  const PANEL = 760
  const SIDE = BOX_W - PANEL - 28
  const building = k >= 1 && !STILL
  return (
    <Card id="T10-1" kicker="Layers Build Caching" title="Dockerfile To Layers" lead="Each instruction that changes files (COPY, RUN, ADD) adds a layer on top of the base image; a rebuild reuses unchanged layers instead of redoing their work." lesson={lesson}>
      <div className="flex items-center" style={{ width: BOX_W, gap: 28 }}>
        <VsEditor k={k} w={PANEL} />
        <Stage w={SIDE} h={330} active={false}>
          {/* the build: the Dockerfile goes in, the hammer works, the layers stack up */}
          <At x={SIDE / 2} y={20} cx>
            <div className="flex items-center gap-3">
              <IconChip size={40} tone={colors.brandDark} bg="#EEF2FA"><FileCode2 size={22} /></IconChip>
              <span className="block rounded-full" style={{ width: 30, height: 3, background: colors.brand }} />
              <IconChip size={40} tone={colors.white} bg={colors.brand}>
                <Hammer size={22} {...(building ? fx('wrench', 0, 1.4) : {})} />
              </IconChip>
              <span className="block rounded-full" style={{ width: 30, height: 3, background: colors.brand }} />
              <Logo name="docker" h={30} />
            </div>
          </At>
          <At x={(SIDE - 230) / 2} y={84}>
            <div className="flex flex-col" style={{ width: 230, gap: 8 }}>
              {(['EXPOSE', 'COPY', 'FROM'] as const).map((w, j) => {
                const n = 3 - j
                const on = k >= n
                return (
                  <div key={w} style={{ opacity: on ? 1 : 0.12, transform: on ? 'none' : 'translateY(-26px)', transition: `opacity 360ms ${EASE}, transform 620ms cubic-bezier(0.34,1.4,0.64,1)` }}>
                    <IconSlab w={230} h={50} icon={LAYER_ICONS[w]} word={w} lit={k === n && !STILL} size={18} />
                  </div>
                )
              })}
              <div className="flex items-center justify-center gap-2 rounded-[12px]" style={{ height: 34, background: '#EEF2FA', boxShadow: 'inset 0 0 0 1.5px #CFDCF5' }}>
                <Layers3Glyph />
              </div>
            </div>
          </At>
        </Stage>
      </div>
    </Card>
  )
}

/** The image the layers make: three stacked bars under a lock, drawn. */
function Layers3Glyph() {
  return (
    <svg width="40" height="22" viewBox="0 0 40 22" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={4 + i * 2} y={2 + i * 6.5} width={32 - i * 4} height="5" rx="2.5" fill={STACK.layer} opacity={1 - i * 0.2} />
      ))}
    </svg>
  )
}

/* ================================================================== 31 · T10-2 build caching */

/** A small warn pill whose word is centred both ways in its box. */
function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 font-heading text-[15px] font-semibold leading-none" style={{ height: 28, background: '#FFF4E0', color: '#9A5B00', boxShadow: `inset 0 0 0 1.5px ${colors.warning}` }}>
      {children}
    </span>
  )
}

/** A layer row: the slab, then its cache tick, a rebuild spinner while it is redone. */
function CacheRow({ word, w, kept, redo, lit }: { word: 'FROM' | 'COPY' | 'EXPOSE'; w: number; kept: boolean; redo: boolean; lit: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ transform: lit ? 'translateY(-2px)' : 'none', transition: T() }}>
        <IconSlab w={w} h={48} icon={LAYER_ICONS[word]} word={word} lit={lit} size={18} />
      </div>
      <Tick on={kept} />
      <span className="grid place-items-center" style={{ width: 28, opacity: redo || kept ? 1 : 0, transition: T() }}>
        {redo ? <RefreshCw size={20} color={colors.accent} {...(STILL ? {} : fx('spin', 0, 1.4))} /> : <Database size={19} color={colors.success} />}
      </span>
    </div>
  )
}

function CacheScene({ k }: { k: number }) {
  /* 0 every layer cached; 1 COPY changes: its cache clears; 2 everything after COPY clears too and is redone, FROM stays cached */
  const W = 260
  const X = 160
  return (
    <>
      <At x={X} y={92}>
        <div className="flex flex-col" style={{ gap: 12 }}>
          <CacheRow word="EXPOSE" w={W} kept={k < 2} redo={k >= 2} lit={k === 2} />
          <CacheRow word="COPY" w={W} kept={k < 1} redo={k >= 1} lit={k === 1} />
          <CacheRow word="FROM" w={W} kept redo={false} lit={false} />
        </div>
      </At>
      {/* the invalidation runs up the stack from the change */}
      <PathArrow pts={[[X - 26, 92 + 60 * 1 + 24], [X - 44, 92 + 60 * 1 + 24], [X - 44, 92 + 24], [X - 12, 92 + 24]]} on={k >= 2} tone={colors.accent} />
      <At x={X - 22} y={92 + 60 * 1 + 24} cy>
        <div style={{ transform: 'translateX(-100%)', opacity: k >= 1 ? 1 : 0, transition: T() }}>
          <Pill>
            <PenLine size={14} {...(k >= 1 ? fx('wrench', 0, 1.8) : {})} />
            Changed
          </Pill>
        </div>
      </At>
      <At x={X} y={290}>
        <div className="flex items-center gap-2" style={{ width: W, justifyContent: 'center' }}>
          <Logo name="docker" h={26} />
          <span className="block rounded-full" style={{ width: 40, height: 3, background: colors.brand }} />
          <Layers3Glyph />
        </div>
      </At>
    </>
  )
}

export function BuildCache({ lesson }: { lesson: string }) {
  const k = useCycle(3, 2000, 2)
  return (
    <BFigure
      id="T10-2"
      kicker="Layers Build Caching"
      title="Dockerfile To Layers"
      lesson={lesson}
      lit={k}
      equal
      points={[
        { icon: <Hash />, text: 'Cache key: instruction plus the files it touches' },
        { icon: <RefreshCw />, text: 'A changed instruction invalidates it and every layer after' },
        { icon: <Database />, text: 'Stable instructions first, frequently changing ones last' },
      ]}
      figure={<CacheScene k={k} />}
    />
  )
}

/* ================================================================== 32 · T10-AN house analogy */

/** Rows shared by the house and the stack, so each floor lines up with its layer (centre y in the 400 stage). */
const ROWS = { top: 158, lower: 254, base: 344 }

/** A windowed wall band. */
function Windows({ x, y, n, w, gap, h = 26, lit }: { x: number; y: number; n: number; w: number; gap: number; h?: number; lit?: boolean }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={x + i * (w + gap)} y={y} width={w} height={h} rx="3" fill={lit ? '#FFE9A8' : '#BFD8FF'} stroke="#FFFFFF" strokeWidth="2.5" />
          <line x1={x + i * (w + gap) + w / 2} y1={y} x2={x + i * (w + gap) + w / 2} y2={y + h} stroke="#FFFFFF" strokeWidth="1.5" />
        </g>
      ))}
    </>
  )
}

/**
 * The steps of slide 33 (round 2, user 2026-11-03: the right side's line came too early; every element
 * audited so each arrives after what it connects). One `useCycle` drives both sides:
 *   0 empty stages (the Dockerfile -> Docker header on the right)
 *   1 foundation + its tag and tick · 2 lower floors + tag, tick · 3 top floor and roof + tag, tick
 *   4 the dashed arrow house -> build (both panels and the finished house on screen)
 *   5 FROM + tick, cache · 6 line FROM -> COPY (G8) · 7 COPY · 8 line COPY -> EXPOSE (G8) · 9 EXPOSE
 *   10 the top floor redone (scaffold, hammer, its tick cleared, the floors below faded)
 *   11 EXPOSE rebuilt (lit, refresh, its tick cleared, FROM and COPY faded): the complete state
 */
const HS = { base: 1, low: 2, top: 3, arrow: 4, from: 5, l1: 6, copy: 7, l2: 8, expose: 9, houseRedo: 10, stackRedo: 11 } as const
const HS_N = 12

/**
 * The house: a stone foundation, two brick lower floors (a door, windows), a top
 * floor and its roof, each ticked as built; then the top floor redone: scaffolding
 * and a hammer on it, the floors below kept with their ticks and faded back (G4).
 */
function HouseScene({ k }: { k: number }) {
  const redo = STILL || k >= HS.houseRedo
  const fade = (part: 'top' | 'low' | 'base') => (STILL || !redo ? 1 : part === 'top' ? 1 : 0.3)
  const floorOn = (n: number) => STILL || k >= [HS.base, HS.low, HS.top][n]
  const anim = (n: number): CSSProperties => ({ opacity: floorOn(n) ? 1 : 0, transform: floorOn(n) ? 'none' : 'translateY(-24px)', transition: `opacity 360ms ${EASE}, transform 600ms cubic-bezier(0.34,1.4,0.64,1)` })
  const tags: { text: string; y: number; n: number; part: 'top' | 'low' | 'base' }[] = [
    { text: 'Top floor', y: ROWS.top, n: 2, part: 'top' },
    { text: 'Lower floors', y: ROWS.lower, n: 1, part: 'low' },
    { text: 'Foundation', y: ROWS.base, n: 0, part: 'base' },
  ]
  return (
    <>
      <svg width={470} height={400} viewBox="0 0 470 400" aria-hidden className="absolute inset-0">
        {/* ground */}
        <rect x="0" y="370" width="470" height="30" fill="#DDE8D5" />
        <path d="M 0 370 H 470" stroke="#9DBF8E" strokeWidth="3" />
        {/* foundation: stone blocks */}
        <g style={{ ...anim(0), opacity: floorOn(0) ? fade('base') : 0 }}>
          <rect x="22" y="326" width="276" height="40" rx="5" fill="#8B8A93" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={26 + i * 45.5 + (i % 2 ? 0 : 0)} y="330" width="41" height="15" rx="2" fill="#A3A2AB" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={48 + i * 45.5} y="348" width="41" height="14" rx="2" fill="#9A99A2" />
          ))}
        </g>
        {/* lower floors: brick with a door and windows */}
        <g style={{ ...anim(1), opacity: floorOn(1) ? fade('low') : 0 }}>
          <rect x="34" y="212" width="252" height="114" fill="#C8674A" />
          {Array.from({ length: 9 }, (_, r) => (
            <line key={r} x1="34" y1={224 + r * 12} x2="286" y2={224 + r * 12} stroke="#B25A3F" strokeWidth="1.2" />
          ))}
          <rect x="30" y="266" width="260" height="6" fill="#E9D8C8" />
          <Windows x={50} y={224} n={4} w={36} gap={26} lit={redo} />
          <Windows x={50} y={284} n={1} w={36} gap={0} />
          <Windows x={198} y={284} n={2} w={30} gap={20} />
          {/* door */}
          <rect x="120" y="282" width="40" height="44" rx="4" fill="#6B3E26" />
          <circle cx="152" cy="306" r="2.5" fill="#FCC82B" />
          <rect x="114" y="324" width="52" height="4" fill="#5A3420" />
        </g>
        {/* top floor and roof */}
        <g style={{ ...anim(2), opacity: floorOn(2) ? fade('top') : 0 }}>
          <rect x="34" y="132" width="252" height="80" fill={redo ? '#FFD9A8' : LAB.wood} style={{ transition: `fill 600ms ${EASE}` }} />
          <rect x="30" y="206" width="260" height="6" fill="#E9D8C8" />
          <Windows x={56} y={150} n={4} w={34} gap={26} />
          {/* balcony rail */}
          <path d="M 44 196 H 276" stroke="#FFFFFF" strokeWidth="2" opacity="0.7" />
          <path d="M 18 134 L 160 62 L 302 134 Z" fill={LAB.red} />
          <path d="M 30 128 L 160 70" stroke="#FFFFFF" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
          <rect x="222" y="74" width="20" height="36" fill="#8B3A2A" />
        </g>
        {/* the redo: scaffolding round the top floor */}
        <g style={{ opacity: redo ? 1 : 0, transition: T(520) }}>
          <rect x="34" y="132" width="252" height="80" fill="none" stroke={colors.accent} strokeWidth="3" strokeDasharray="8 6" />
          {[24, 296].map((x) => (
            <g key={x}>
              <line x1={x} y1="118" x2={x} y2="214" stroke="#E0A93A" strokeWidth="4" />
              <line x1={x - 8} y1="140" x2={x + 8} y2="140" stroke="#E0A93A" strokeWidth="3" />
              <line x1={x - 8} y1="180" x2={x + 8} y2="180" stroke="#E0A93A" strokeWidth="3" />
            </g>
          ))}
        </g>
      </svg>
      {/* the hammer at work on the top floor */}
      <At x={140} y={150}>
        <div style={{ opacity: redo ? 1 : 0, transition: T() }}>
          <IconChip size={40} tone={colors.white} bg={colors.accent}>
            <Hammer size={22} {...(redo && !STILL ? fx('wrench', 0, 0.9) : {})} />
          </IconChip>
        </div>
      </At>
      {/* the floor names, each with its tick */}
      {tags.map((t) => (
        <At key={t.text} x={312} y={t.y} cy>
          <div className="flex items-center gap-2" style={{ opacity: floorOn(t.n) ? fade(t.part) : 0, transition: T(420, 200) }}>
            <Label strong size={15}>{t.text}</Label>
            <Tick on={t.part === 'top' ? !redo : true} size={26} />
          </div>
        </At>
      ))}
    </>
  )
}

/** The same build as layers: FROM (foundation), COPY (lower floors), EXPOSE (top floor), each on the row of its floor. */
function HouseStackScene({ k }: { k: number }) {
  const redo = STILL || k >= HS.stackRedo
  const rows: { word: 'FROM' | 'COPY' | 'EXPOSE'; y: number; n: number }[] = [
    { word: 'EXPOSE', y: ROWS.top, n: HS.expose },
    { word: 'COPY', y: ROWS.lower, n: HS.copy },
    { word: 'FROM', y: ROWS.base, n: HS.from },
  ]
  const W = 260
  const SLAB_H = 54
  const cx = 70 + W / 2
  return (
    <>
      <At x={70} y={30}>
        <div className="flex items-center gap-3">
          <IconChip size={40} tone={colors.brandDark} bg="#EEF2FA"><FileCode2 size={22} /></IconChip>
          <span className="block rounded-full" style={{ width: 34, height: 3, background: colors.brand }} />
          <Logo name="docker" h={34} />
        </div>
      </At>
      {/* the lines joining the layers, each drawn up from the layer below once it is in place (G8: line, then head) */}
      <div className="absolute inset-0" style={{ opacity: !STILL && redo ? 0.3 : 1, transition: T() }}>
        <Arrow x1={cx} y1={ROWS.base - SLAB_H / 2 - 2} x2={cx} y2={ROWS.lower + SLAB_H / 2 + 3} on={STILL || k >= HS.l1} />
        <Arrow x1={cx} y1={ROWS.lower - SLAB_H / 2 - 2} x2={cx} y2={ROWS.top + SLAB_H / 2 + 3} on={STILL || k >= HS.l2} />
      </div>
      {rows.map((r) => {
        const on = STILL || k >= r.n
        const top = r.word === 'EXPOSE'
        const focus = STILL || !redo || top
        return (
          <At key={r.word} x={70} y={r.y} cy>
            <div className="flex items-center gap-3" style={{ opacity: on ? (focus ? 1 : 0.3) : 0, transform: on ? 'none' : 'translateY(-24px)', transition: `opacity 360ms ${EASE}, transform 600ms cubic-bezier(0.34,1.4,0.64,1)` }}>
              <IconSlab w={W} h={SLAB_H} icon={LAYER_ICONS[r.word]} word={r.word} lit={top && redo} size={19} />
              <Tick on={top ? !redo : true} size={26} />
              <span className="grid place-items-center" style={{ width: 26 }}>
                {top && redo ? <RefreshCw size={20} color={colors.accent} {...(STILL ? {} : fx('spin', 0, 1.4))} /> : <Database size={19} color={colors.success} />}
              </span>
            </div>
          </At>
        )
      })}
    </>
  )
}

/**
 * The dashed "same idea" arrow between the two panels, drawn locally so it can be a step (the shared
 * `IsoAnalogy` shows its arrow from the start): G8, the dashes uncover tail to head, then the head; on
 * exit the head goes first, then the dashes retract.
 */
function SameIdeaArrow({ on }: { on: boolean }) {
  const instant = useInstant()
  const show = STILL || on
  return (
    <div className="relative" style={{ width: 120, height: 20 }} aria-hidden>
      <span
        className="absolute block"
        style={{
          left: 10, top: 9, width: 92, height: 2.5,
          backgroundImage: `repeating-linear-gradient(90deg, ${colors.brand} 0 7px, transparent 7px 14px)`,
          clipPath: show ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: instant ? 'none' : show ? `clip-path 760ms cubic-bezier(0.65,0,0.35,1)` : `clip-path 480ms cubic-bezier(0.65,0,0.35,1) 200ms`,
        }}
      />
      <svg className="absolute" style={{ left: 100, top: 4 }} width={12} height={12} viewBox="0 0 12 12">
        <path d="M 11 6 L 1 1 L 1 11 Z" fill={colors.brand} style={{ opacity: show ? 1 : 0, transition: instant ? 'none' : show ? 'opacity 240ms 760ms' : 'opacity 160ms 0ms' }} />
      </svg>
    </div>
  )
}

export function HouseAnalogy({ lesson }: { lesson: string }) {
  /* one cycle drives both sides, in the order of the HS steps above */
  const k = useCycle(HS_N, 1500, HS_N - 1)
  const H = 400
  return (
    <Card id="T10-AN" kicker="Layers Build Caching" title="A house built floor by floor" lesson={lesson}>
      <div className="flex items-start" style={{ width: BOX_W }}>
        <Stage w={AN_W} h={H} active={false}>
          <div role="img" aria-label="A house built floor by floor" className="absolute inset-0">
            <HouseScene k={k} />
          </div>
        </Stage>
        <div className="flex items-center justify-center" style={{ width: BOX_W - AN_W * 2, height: H }}>
          <SameIdeaArrow on={k >= HS.arrow} />
        </div>
        <Stage w={AN_W} h={H} active={false}>
          <div role="img" aria-label="Build caching" className="absolute inset-0">
            <HouseStackScene k={k} />
          </div>
        </Stage>
      </div>
    </Card>
  )
}

/** This section's own keyframes (corrections pass 2026-11-03), appended to the deck's CSS by cvDeck.tsx. */
export const DOCKER_CSS = ``
