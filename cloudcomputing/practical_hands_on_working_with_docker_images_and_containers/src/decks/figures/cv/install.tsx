import { Box, Cloud, Cog, Download, Info, Layers, Lock, Monitor, MousePointerClick, Play, Power, Server, SquareTerminal, Terminal } from 'lucide-react'
import { Badge, LitFigure, ZoomBadge, fx } from './fx'
import { VisualTable } from './vtable'
/* the Ubuntu mark in the Windows and Apple marks' navy (#1F2A44), for slide 12's OS column (user, 2026-11-04) */
import ubuntuInk from './marks/ubuntu-ink.png'
import type { CSSProperties, ReactNode } from 'react'
import { colors } from '@/design/tokens'
import { Callout } from '@/ui'
import { useAutoAnim } from '@/deck/autoAnim'
import { Arrow, At, BOX_W, Card, STILL, Traveller, useBeatState, useBuild, useCycle } from '../scene'
import { ClayTerminal, Icon3D, RichCloud } from '../d3/kit'
import { MARK, Mono, SHOT_GROUP_H, SHOT_MAX_W, SHOT_MID, SHOT_MIN_G, SHOT_SIZE, shot, StepLabel, textLines, Tile, type MarkName, type Rect } from './frames'

/**
 * SECTION 2 · DOCKER AND ITS INSTALL (slides 11 to 21).
 *
 *   11  T04-1   the five parts: client -> daemon, the daemon wired to images,
 *               containers and the registry; the loop lights each part and its
 *               point in turn, a dot carries the command along each wire, each
 *               part's badge (lock: read-only, play: running, download: pulled)
 *               pops in with it
 *   12  T05-1   the per-OS table, each step in a cell led by its own icon
 *   13-19       `ShotPair` (G9): step label, rule, the full TR capture beside a
 *               zoom of the marked part (same capture), the caption in a box under;
 *               no rings or numbers on either picture (user, 2026-11-04)
 *   20  T05-S8  the full-width capture, its two rings lit in turn with their halves of the caption
 *   21  T05-S8b the two commands, line by line with their notes (G10), click a line to pin it (G11)
 *
 * Every string is the spec's. Harness URLs hold the complete state.
 */

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

/* ------------------------------------------------------------------ T04-1 */

/** A part of the diagram: a raised tile, its picture over its name, lit in its turn, faded while another part is lit. */
function Part({ x, y, w, h, lit, dim, name, badge, children }: { x: number; y: number; w: number; h: number; lit: boolean; dim: boolean; name: ReactNode; badge?: ReactNode; children: ReactNode }) {
  return (
    <At x={x} y={y}>
      <div className="relative" style={{ opacity: dim ? 0.38 : 1, transform: lit ? 'scale(1.04)' : 'scale(1)', transition: `opacity 420ms ${EASE}, transform 460ms ${EASE}` }}>
        <Tile w={w} h={h} lit={lit} className="flex flex-col items-center justify-center gap-2">
          {children}
          <span className="text-center font-heading text-[16px] font-semibold leading-tight" style={{ color: lit ? colors.brandDark : colors.ink, transition: `color 420ms ${EASE}` }}>
            {name}
          </span>
        </Tile>
        {badge && <span className="absolute" style={{ right: -9, top: -9 }}>{badge}</span>}
      </div>
    </At>
  )
}

/** Three small container boxes, no words (the card names none); they drop in one by one while the part is lit. */
function Boxes({ lit }: { lit: boolean }) {
  return (
    <div className="flex items-end gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={`${i}-${lit}`}
          className={`block rounded-[6px] ${lit && !STILL ? 'cvx cvx-pop' : ''}`}
          style={{ width: 26, height: 26, background: i === 1 ? colors.brand : '#7FA6FF', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.14), 0 6px 10px -8px rgba(16,32,58,0.6)', animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </div>
  )
}

const ic = (n: ReactNode, cls?: { className: string; style: CSSProperties }) => (
  <span className={cls?.className} style={{ ...cls?.style, display: 'grid', placeItems: 'center' }}>{n}</span>
)

function PartsDiagram({ k }: { k: number }) {
  /* 0 client, 1 daemon, 2 images, 3 containers, 4 registry, 5 rest (every part on, none lit) */
  const rest = k === 5
  const dim = (i: number) => !rest && k !== i
  const seen = (i: number) => rest || k >= i
  const wire = (i: number) => (k === i ? colors.accent : colors.brand)
  return (
    <div className="absolute inset-0">
      <Arrow x1={130} y1={180} x2={170} y2={180} tone={wire(0)} />
      <Arrow x1={318} y1={140} x2={364} y2={74} tone={wire(2)} />
      <Arrow x1={318} y1={180} x2={364} y2={180} tone={wire(3)} />
      <Arrow x1={318} y1={220} x2={364} y2={286} tone={wire(4)} />
      {/* the command travels the wire of the part being lit */}
      <Traveller path={[[130, 180], [170, 180]]} run={k === 0} k={`c-${k}`} dur={1.1} />
      <Traveller path={[[318, 140], [364, 74]]} run={k === 2} k={`i-${k}`} dur={1.1} />
      <Traveller path={[[318, 180], [364, 180]]} run={k === 3} k={`k-${k}`} dur={1.1} />
      <Traveller path={[[318, 220], [364, 286]]} run={k === 4} k={`r-${k}`} dur={1.1} />

      <Part x={14} y={115} w={116} h={130} lit={k === 0} dim={dim(0)} name="Docker client"
        badge={<Badge on={seen(0)} size={28}>{ic(<Terminal size={15} color={colors.brand} />, k === 0 ? fx('blink', 0, 0.9) : undefined)}</Badge>}>
        <ClayTerminal w={72} />
      </Part>
      <Part x={170} y={105} w={148} h={150} lit={k === 1} dim={dim(1)} name={<>Docker daemon<br />(dockerd)</>}
        badge={<Badge on={seen(1)} size={30}>{ic(<Cog size={17} color={colors.brand} />, fx('spin', 0, k === 1 ? 1.6 : 6))}</Badge>}>
        <img src={MARK.docker} alt="Docker" draggable={false} className={`block w-auto select-none ${k === 1 ? 'cvx cvx-bob' : ''}`} style={{ height: 40, ['--fx-dur' as string]: '0.9s' }} />
      </Part>
      <Part x={364} y={22} w={128} h={104} lit={k === 2} dim={dim(2)} name="Images"
        badge={<Badge on={seen(2)} size={28}>{ic(<Lock size={14} color={colors.brand} />, k === 2 ? fx('shackle', 0, 1.8) : undefined)}</Badge>}>
        <span className={k === 2 ? 'cvx cvx-lift' : ''} style={{ display: 'block' }}><Icon3D name="data-storage" w={50} /></span>
      </Part>
      <Part x={364} y={136} w={128} h={88} lit={k === 3} dim={dim(3)} name="Containers"
        badge={<Badge on={seen(3)} size={28}>{ic(<Play size={13} color={colors.success} fill={colors.success} />, k === 3 ? fx('glow', 0, 1) : undefined)}</Badge>}>
        <Boxes lit={k === 3} />
      </Part>
      <Part x={364} y={234} w={128} h={118} lit={k === 4} dim={dim(4)} name="Registry"
        badge={<Badge on={seen(4)} size={28}>{ic(<Download size={14} color={colors.brand} />, k === 4 ? fx('hop', 0, 1.1) : undefined)}</Badge>}>
        <div className="flex flex-col items-center gap-1">
          <span className={k === 4 ? 'cvx cvx-lift' : ''} style={{ display: 'block' }}><RichCloud w={52} /></span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[14px] font-medium leading-tight" style={{ color: colors.muted }}>
            <img src={MARK.docker} alt="" draggable={false} className="block w-auto select-none" style={{ height: 15 }} />
            Docker Hub
          </span>
        </div>
      </Part>
    </div>
  )
}

export function DockerParts({ lesson }: { lesson: string }) {
  /* one press per part, in the points' order, then the rest frame with every part on; harness URLs hold the rest */
  const k = useCycle(6, 2400, 5)
  return (
    <LitFigure
      id="T04-1"
      kicker={'Docker Architecture Map'}
      title={'Five Core Parts'}
      lead={'Docker runs as a client-server system: a command-line client talks to a background daemon that builds and runs containers using images pulled from a registry'}
      lesson={lesson}
      lit={k}
      points={[
        { icon: <SquareTerminal />, text: <>Docker client: CLI issuing commands like <Mono>docker run</Mono></> },
        { icon: <Server />, text: 'Docker daemon (dockerd): service building and managing containers' },
        { icon: <Layers />, text: 'Images: read-only templates stored locally or in a registry' },
        { icon: <Box />, text: 'Containers: running instances created from images' },
        { icon: <Cloud />, text: 'Registry: remote store such as Docker Hub for images' },
      ]}
      figure={<PartsDiagram k={k} />}
      pointsW={580}
      pointSize={17}
      figH={366}
    />
  )
}

/* ------------------------------------------------------------------ T05-1 */

function Os({ mark, src, children }: { mark: MarkName; src?: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-heading font-semibold">
      <img src={src ?? MARK[mark]} alt="" draggable={false} className="block w-auto shrink-0 select-none" style={{ height: 26 }} />
      {children}
    </span>
  )
}

/** One setup step inside a cell: its icon (a logo where the step names a product), then the words as written. */
function Stp({ i, on, mark, icon, cls, children }: { i: number; on: boolean; mark?: MarkName; icon?: ReactNode; cls?: { className: string; style: CSSProperties }; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span key={`${on}`} className={on && !STILL ? 'cvx cvx-pop' : ''} style={{ display: 'inline-grid', animationDelay: `${0.15 + i * 0.14}s` }}>
        <span aria-hidden className={`grid h-[24px] w-[24px] place-items-center rounded-[7px] ${cls?.className ?? ''}`} style={{ background: colors.surface2, color: colors.brand, ...cls?.style }}>
          {mark ? <img src={MARK[mark]} alt="" draggable={false} className="block select-none" style={{ height: 15, width: 'auto' }} /> : icon}
        </span>
      </span>
      <span>{children}</span>
    </span>
  )
}

export function SetupPerOs({ lesson }: { lesson: string }) {
  /* one OS per press; as a row lands its step icons pop in left to right (VS Code, the terminal, Docker, the open click) */
  const shown = useBuild(3, 560)
  const on = (r: number) => r < shown
  const sep = '; '
  return (
    <Card id="T05-1" kicker={'Docker Installation Steps'} title={'Setup Per OS'} lead={'Docker installs differently per operating system, but every path ends with the same two verification commands before any practical work begins'} lesson={lesson}>
      <div style={{ width: BOX_W }}>
        <VisualTable
          shown={shown}
          columns={[
            { label: 'OS', icon: <Monitor size={16} />, weight: 1 },
            { label: 'Key Setup Steps', icon: <span className={fx('spin', 0, 6).className} style={{ ...fx('spin', 0, 6).style, display: 'grid' }}><Cog size={16} /></span>, weight: 3.4 },
          ]}
          rows={[
            { cells: [<Os mark="windows">Windows</Os>, <span className="leading-[1.9]"><Stp i={0} on={on(0)} mark="vscode">Install VS Code</Stp>{sep}<Stp i={1} on={on(0)} icon={<Terminal size={14} />}><Mono>wsl --install</Mono></Stp>{sep}<Stp i={2} on={on(0)} mark="docker">Docker Desktop (WSL 2 backend)</Stp>{sep}<Stp i={3} on={on(0)} icon={<MousePointerClick size={14} />}>open Docker Desktop</Stp></span>] },
            { cells: [<Os mark="macos">macOS</Os>, <span className="leading-[1.9]"><Stp i={0} on={on(1)} mark="vscode">Install VS Code</Stp>{sep}<Stp i={1} on={on(1)} mark="docker">Docker Desktop (Apple Silicon or Intel build)</Stp>{sep}<Stp i={2} on={on(1)} icon={<MousePointerClick size={14} />}>open Docker Desktop</Stp></span>] },
            { cells: [<Os mark="ubuntu" src={ubuntuInk}>Linux / Ubuntu</Os>, <span className="leading-[1.9]"><Stp i={0} on={on(2)} mark="vscode">Install VS Code</Stp>{sep}<Stp i={1} on={on(2)} icon={<Download size={14} />} cls={fx('hop', 0, 2)}><Mono>sudo apt install docker.io</Mono></Stp>{sep}<Stp i={2} on={on(2)} icon={<Power size={14} />} cls={fx('glow', 0, 1.8)}><Mono>sudo systemctl start docker</Mono></Stp></span>] },
          ]}
          size={18}
        />
      </div>
    </Card>
  )
}

/* ------------------------------------------------------------------ screenshots */

const ringsOf = (h: Rect | Rect[]): Rect[] => (Array.isArray(h[0]) ? (h as Rect[]) : [h as Rect])

/**
 * A TR capture drawn as a background (the element IS the visible window), with
 * its rings; each ring shows when `on[i]`, popping in and pulsing, the newest
 * one brightest. `crop` is in source pixels.
 */
function ShotView({ name, crop, scale: s, rings, on, cur = -1, alt, ringW = 2.5, badges = false, badgeOn, badgeDim, place = [] }: { name: string; crop?: Rect; scale: number; rings: Rect[]; on: boolean[]; cur?: number; alt: string; ringW?: number; badges?: boolean; badgeOn?: boolean[]; badgeDim?: boolean[]; place?: (Place | undefined)[] }) {
  const [W, H] = SHOT_SIZE[name]
  const [x, y, w, h] = crop ?? [0, 0, W, H]
  const vw = Math.round(w * s)
  const vh = Math.round(h * s)
  return (
    /* square corners, nothing clipped (user, 2026-11-04) */
    <div className="relative" style={{ width: vw, height: vh, boxShadow: '0 18px 36px -22px rgba(16,32,58,0.55), inset 0 0 0 1px rgba(16,32,58,0.08)', background: colors.white }}>
      <div role="img" aria-label={alt} className="absolute inset-0 select-none" style={{ backgroundImage: `url(${shot(name)})`, backgroundSize: `${W * s}px ${H * s}px`, backgroundPosition: `${-x * s}px ${-y * s}px`, backgroundRepeat: 'no-repeat' }} />
      {rings.map((r, i) => {
        const [l, t, rw, rh] = ringBox(r, x, y, s, vw, vh)
        return (
          <span
            key={i}
            aria-hidden
            className={`absolute rounded-md ${on[i] && !STILL && (cur === -1 || cur === i) ? 'cv-ring' : ''}`}
            style={{
              left: l, top: t, width: rw, height: rh,
              border: `${ringW}px solid ${colors.accent}`, boxShadow: `0 0 0 4px ${colors.accent}30`,
              opacity: on[i] ? (cur === -1 || cur === i ? 1 : 0.45) : 0,
              transform: on[i] ? 'scale(1)' : 'scale(1.18)',
              transition: `opacity 360ms ${EASE}, transform 460ms cubic-bezier(0.34,1.56,0.64,1)`,
            }}
          />
        )
      })}
      {badges &&
        rings.map((r, i) => {
          const [bx, by] = badgeAt(ringBox(r, x, y, s, vw, vh), vw, vh, place[i])
          const shown = (badgeOn ?? on)[i]
          return <ZoomBadge key={`b${i}`} n={i + 1} on={shown} size={BADGE} style={{ position: 'absolute', left: bx, top: by, ...(shown && badgeDim?.[i] ? { opacity: 0.45 } : {}) }} />
        })}
    </div>
  )
}

const BADGE = 26

/** A ring's badge spot: a corner just outside it, or beside it on the right / left, centred on its height. */
type Place = 'tl' | 'tr' | 'bl' | 'br' | 'r' | 'l'

/** A ring's box in view pixels (2px outside the marked region), clamped to the capture so no edge is cropped. */
function ringBox([hx, hy, hw, hh]: Rect, x: number, y: number, s: number, vw: number, vh: number): Rect {
  const l = Math.max(0, (hx - x) * s - 2)
  const t = Math.max(0, (hy - y) * s - 2)
  const r = Math.min(vw, (hx - x + hw) * s + 2)
  const b = Math.min(vh, (hy - y + hh) * s + 2)
  return [l, t, r - l, b - t]
}

/**
 * Where a ring's number sits: on one of the ring's corners, just outside it so
 * it never covers what the ring marks, and wholly inside the capture. Tries
 * top-left, top-right, bottom-left, bottom-right; if no outside corner fits,
 * it sits inside the top-right corner.
 */
function badgeAt([l, t, w, h]: Rect, vw: number, vh: number, place?: Place): [number, number] {
  const S = BADGE
  const IN = 5 // how far the disc overlaps the ring's own border
  const M = 3 // margin from the capture's edge
  const fits = ([bx, by]: [number, number]) => bx >= M && by >= M && bx + S <= vw - M && by + S <= vh - M
  const cands: [number, number][] = [
    [l - S + IN, t - S + IN],
    [l + w - IN, t - S + IN],
    [l - S + IN, t + h - IN],
    [l + w - IN, t + h - IN],
    /* beside the corner, along the ring's left or right side */
    [l - S - 2, t],
    [l + w + 2, t],
  ]
  /* a slide may name the spot, where the auto corner would sit on the capture's own text */
  const named: Partial<Record<Place, [number, number]>> = { tl: cands[0], tr: cands[1], bl: cands[2], br: cands[3], r: [l + w + 4, t + h / 2 - S / 2], l: [l - S - 4, t + h / 2 - S / 2] }
  if (place && named[place] && fits(named[place]!)) return named[place]!
  return cands.find(fits) ?? [Math.min(vw - S - M, l + w - S - 4), Math.max(M, t + 4)]
}

/** The explanation under a screenshot: a box with an info tile, the caption's words as written. */
function ExplainBox({ children, width = BOX_W }: { children: ReactNode; width?: number }) {
  return (
    <div className="flex items-start gap-3.5 rounded-2xl px-5 py-3.5" style={{ width, background: 'linear-gradient(180deg, #FFFFFF 0%, #F4F8FF 100%)', boxShadow: `inset 0 0 0 1px ${colors.line}, inset 4px 0 0 0 ${colors.brand}, 0 10px 24px -18px rgba(16,32,58,0.5)` }}>
      <span aria-hidden className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px]" style={{ background: colors.brand, color: colors.white }}>
        <Info size={17} />
      </span>
      <div className="min-w-0 text-[17px] font-semibold leading-[1.5]" style={{ color: colors.ink, paddingTop: 2 }}>
        {children}
      </div>
    </div>
  )
}

/** The step label with the rule under it (G9), the rule drawing in from the left. */
function StepHead({ label, n }: { label: ReactNode; n?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      <StepLabel n={n}>{label}</StepLabel>
      <span aria-hidden className="block h-px w-full" style={{ background: `linear-gradient(90deg, ${colors.brand}66 0%, ${colors.line} 40%)` }} />
    </div>
  )
}

/**
 * THE SCREENSHOT SLIDE (user, 2026-11-04): the step label with its rule, the TR capture whole (no zoom
 * copy), its orange rings kept and no numbers, the explanation in a box under it; the three as one group
 * centred on the slide (`SHOT_MID`), the capture as large as the body's height allows (`SHOT_GROUP_H`)
 * but never above its source size. Steps (useBuild, one per press): each ring in turn. Harness URLs
 * hold every ring on.
 */
const HEAD_H = 40 // StepHead: the 22px label, its 10px gap and the rule
const GROUP_GAP = 14
export function ShotPair({ label, n, name, highlight, alt, chars, children }: { label: ReactNode; n?: number; name: string; highlight: Rect | Rect[]; alt: string; chars: number; children: ReactNode }) {
  const rings = ringsOf(highlight)
  const [W, H] = SHOT_SIZE[name]
  /* the scale the height leaves once the explanation's lines are counted (counted twice: the width they wrap in depends on the scale) */
  const fit = (lines: number) => Math.min(SHOT_MAX_W / W, (SHOT_GROUP_H - HEAD_H - 2 * GROUP_GAP - (30 + lines * 26)) / H, 1)
  const groupW = (s: number) => Math.max(Math.round(W * s), SHOT_MIN_G)
  const lines = Math.max(textLines(chars, groupW(fit(2))), textLines(chars, groupW(fit(1))))
  const s = fit(lines)
  const G = groupW(s)
  const b = useBuild(rings.length, 700)
  const cur = STILL || b >= rings.length ? -1 : b - 1
  return (
    <div style={{ width: BOX_W }}>
      <div className="flex flex-col" style={{ width: G, marginLeft: SHOT_MID - G / 2, gap: GROUP_GAP }}>
        <StepHead label={label} n={n} />
        <div className="flex justify-center">
          <ShotView name={name} scale={s} rings={rings} on={rings.map((_, i) => STILL || b >= i + 1)} cur={cur} alt={alt} />
        </div>
        <ExplainBox width={G}>{children}</ExplainBox>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ T05-S1 .. T05-S7 */

const K = 'Docker Installation Steps'
const T = 'Setup Per OS'

function ShotSlide({ id, lesson, step, caption, name, highlight }: { id: string; lesson: string; step: string; caption: string; name: string; highlight: Rect | Rect[]; place?: (Place | undefined)[] }) {
  return (
    <Card id={id} kicker={K} title={T} lesson={lesson}>
      <ShotPair label={step} name={name} highlight={highlight} alt={caption} chars={caption.length}>
        {caption}
      </ShotPair>
    </Card>
  )
}

export function InstallStep1({ lesson }: { lesson: string }) {
  /* each 2px ring's edges sit in the gaps between the lines (measured on a 2x render), so no ring crosses a letter */
  return (
    <ShotSlide
      id="T05-S1" lesson={lesson}
      step={'Step 1: Confirm WSL 2 Is Enabled (Windows)'}
      caption={'PowerShell confirms WSL is installed/updated and the Virtual Machine Platform feature is Enabled, required before Docker Desktop will run on Windows'}
      name="slide-05-1"
      highlight={[[0, 198, 522, 30], [0, 348, 196, 13]]}
      place={[undefined, 'r']}
    />
  )
}

export function InstallStep2({ lesson }: { lesson: string }) {
  return (
    <ShotSlide
      id="T05-S2" lesson={lesson}
      step={'Step 2: Choose Installation Options'}
      caption={'Docker Desktop installer: Configuration screen, per-user installation with the WSL 2 backend'}
      name="slide-05-2"
      highlight={[32, 106, 520, 104]}
    />
  )
}

export function InstallStep3({ lesson }: { lesson: string }) {
  return (
    <ShotSlide
      id="T05-S3" lesson={lesson}
      step={'Step 3: Installation Completes'}
      caption={'Docker Desktop installer confirms “Installation succeeded”'}
      name="slide-05-3"
      highlight={[20, 80, 160, 24]}
    />
  )
}

export function InstallStep4({ lesson }: { lesson: string }) {
  return (
    <ShotSlide
      id="T05-S4" lesson={lesson}
      step={'Step 4: Sign In Or Skip'}
      caption={'First launch: Docker prompts to sign in or create a Docker Hub account; signing in is optional for local use and can be skipped'}
      name="slide-05-4"
      highlight={[810, 204, 48, 28]}
    />
  )
}

export function InstallStep5({ lesson }: { lesson: string }) {
  return (
    <ShotSlide
      id="T05-S5" lesson={lesson}
      step={'Step 5: Redirected To The Desktop App'}
      caption={'After sign-in (or skip), Docker redirects back to the desktop app'}
      name="slide-05-5"
      highlight={[48, 120, 250, 40]}
    />
  )
}

export function InstallStep6({ lesson }: { lesson: string }) {
  return (
    <ShotSlide
      id="T05-S6" lesson={lesson}
      step={'Step 6: Confirm The Redirect'}
      caption={'Windows asks permission to open Docker Desktop, confirms the handoff from browser back to the installed app'}
      name="slide-05-6"
      highlight={[184, 102, 124, 34]}
    />
  )
}

export function InstallStep7({ lesson }: { lesson: string }) {
  return (
    <ShotSlide
      id="T05-S7" lesson={lesson}
      step={'Step 7: Docker Desktop Opens'}
      caption={'Docker Desktop\'s Containers tab on first launch, empty, since nothing has been run yet'}
      name="slide-05-7"
      highlight={[[12, 104, 222, 32], [560, 286, 372, 64]]}
      place={['br']}
    />
  )
}

/* ------------------------------------------------------------------ T05-S8, T05-S8b */

/**
 * The line being explained (G10): the cycle's own index, or the one a click
 * pinned (G11). Auto animation off, a press clears a pin; on, a pin holds until
 * it is clicked again. Returns [lit, cycle index, toggle]. `n` lines, then the
 * rest state (every line on), which harness URLs hold.
 */
function useLines(n: number): [number, number, (i: number) => void] {
  const k = useCycle(n + 1, 2800, n)
  const auto = useAutoAnim()
  const [pick, setPick] = useBeatState<number>(auto ? -1 : k, () => -1)
  const lit = pick >= 0 ? pick : k < n ? k : -1
  return [lit, k, (i: number) => setPick(pick === i ? -1 : i)]
}

/** A clickable bit of the slide (a line, a clause): a plain button that gives the arrow keys back after a click. */
function Pin({ onPick, children, className = '', style }: { onPick: () => void; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        onPick()
        e.currentTarget.blur()
      }}
      className={`m-0 cursor-pointer border-0 p-0 text-left ${className}`}
      style={{ background: 'none', font: 'inherit', color: 'inherit', ...style }}
    >
      {children}
    </button>
  )
}

const dimOf = (lit: number, i: number) => (lit === -1 || lit === i ? 1 : 0.32)

/** T05-S8, first half (user, 2026-10-30: split): the step and the real terminal output, the full capture (too wide for two across). Its caption box was removed (user, 2026-11-04). */
export function InstallStep8({ lesson }: { lesson: string }) {
  const rings: Rect[] = [[28, 126, 530, 32], [28, 230, 1072, 66]]
  const [lit] = useLines(2)
  const [W, H] = SHOT_SIZE['slide-05-8']
  /* the caption box went (2026-11-04), so the capture takes some of the space it left: 286 -> 360 tall (Group D) */
  const s = Math.min(1060 / W, 360 / H, 1)
  return (
    <Card id="T05-S8" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 14 }}>
        <StepHead label={'Step 8: Verify From The Terminal'} />
        <div className="relative">
          {/* each ring's number (ZoomBadge, round 2) on the ring's corner inside the capture, lit with its half of the caption */}
          <ShotView name="slide-05-8" scale={s} rings={rings} on={[true, true]} cur={lit} alt="docker --version and docker run hello-world output" badges badgeDim={rings.map((_, i) => lit !== -1 && lit !== i)} />
        </div>
      </div>
    </Card>
  )
}

const PANEL_W = 460

/** T05-S8, second half (user, 2026-10-30: split): the two commands with their line notes, and the Linux note; line by line (G10), a click pins a line (G11). */
export function InstallStep8b({ lesson }: { lesson: string }) {
  const [lit, k, toggle] = useLines(2)
  const shownNote = (i: number) => lit === -1 || i <= k || lit === i
  const cmd = (i: number, text: string) => {
    const on = lit === i
    const last = i === 1
    return (
      <Pin onPick={() => toggle(i)} className="relative flex w-full items-center gap-3 px-4 font-mono text-[17px]" style={{ background: on ? '#26364F' : '#1E1E1E', color: '#E7E7E7', fontVariantLigatures: 'none', borderRadius: last ? '0 0 12px 12px' : 0, minHeight: 52, boxShadow: on ? `inset 4px 0 0 0 ${colors.accent}` : 'none', transition: `background 360ms ${EASE}, box-shadow 360ms ${EASE}` }}>
        <span style={{ color: on ? colors.accent : '#858585', transition: `color 360ms ${EASE}` }}>{i + 1}</span>
        <span style={{ opacity: dimOf(lit, i), transition: `opacity 360ms ${EASE}` }}>{text}</span>
        {/* the cursor waits at the end of the line being explained */}
        <span aria-hidden className={on && !STILL ? 'cvx cvx-blink' : ''} style={{ display: 'inline-block', width: 9, height: 19, background: '#E7E7E7', opacity: on ? 1 : 0, transition: `opacity 200ms ${EASE}` }} />
      </Pin>
    )
  }
  const note = (i: number, text: string) => {
    const on = lit === i
    const shown = shownNote(i)
    return (
      <div className="flex items-center pl-6">
        <Pin
          onPick={() => toggle(i)}
          className="relative w-full rounded-xl px-4 py-2.5 text-[17px] leading-snug"
          style={{
            color: colors.ink,
            background: on ? 'linear-gradient(180deg, #FFF7EF 0%, #FFEBD9 100%)' : colors.white,
            boxShadow: on ? `inset 0 0 0 2px ${colors.accent}, 0 12px 24px -16px ${colors.accent}` : `inset 0 0 0 1px ${colors.line}`,
            opacity: shown ? dimOf(lit, i) : 0,
            transform: shown ? 'none' : 'translateX(-16px)',
            transition: `opacity 380ms ${EASE}, transform 440ms ${EASE}, background 360ms ${EASE}, box-shadow 360ms ${EASE}`,
          }}
        >
          {/* the bubble's tail, pointing back at its line */}
          <span aria-hidden className="absolute" style={{ left: -8, top: '50%', width: 14, height: 14, marginTop: -7, transform: 'rotate(45deg)', background: on ? '#FFF2E6' : colors.white, boxShadow: on ? `-2px 2px 0 0 ${colors.accent}` : `-1px 1px 0 0 ${colors.line}`, transition: `all 360ms ${EASE}` }} />
          <span className="relative">{text}</span>
        </Pin>
      </div>
    )
  }
  return (
    <Card id="T05-S8b" kicker={K} title={T} lesson={lesson}>
      <div className="flex flex-col" style={{ width: BOX_W, gap: 36 }}>
        <div className="grid" style={{ gridTemplateColumns: `${PANEL_W}px 1fr`, gridTemplateRows: 'auto minmax(52px, auto) minmax(52px, auto)', rowGap: 0 }}>
          <div className="flex items-center gap-2.5 px-4 py-2 text-[15px] font-semibold" style={{ background: '#2D2D2D', color: '#E7E7E7', borderRadius: '12px 12px 0 0' }}>
            <span aria-hidden className="flex gap-1.5">
              {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} className="block h-[10px] w-[10px] rounded-full" style={{ background: c }} />)}
            </span>
            <img src={MARK.vscode} alt="" draggable={false} className="block select-none" style={{ height: 16, width: 'auto' }} />
            {'Terminal (VS Code, PowerShell on Windows)'}
          </div>
          <div />
          {cmd(0, 'docker --version')}
          {note(0, 'Line 1: Displays the installed Docker CLI version')}
          {cmd(1, 'docker run hello-world')}
          {note(1, 'Line 2: Verifies that Docker can run a container; it typically pulls the image if needed and prints Hello from Docker!')}
        </div>
        <div style={{ width: 760 }}>
          <Callout kind="warning" asStep={false} className="!p-4 [&>div>p:first-child]:hidden [&>div>div]:!mt-0 [&>div>div]:text-[17px]">
            <b className="font-heading font-semibold">Linux OS:</b> If a Docker command fails due to permission issues, try running it with <Mono>sudo</Mono>, for example, <span className="whitespace-nowrap"><Mono>sudo docker run hello-world</Mono></span>
          </Callout>
        </div>
      </div>
    </Card>
  )
}

/** This section's own keyframes (corrections pass 2026-11-03), appended to the deck's CSS by cvDeck.tsx. */
export const INSTALL_CSS = ``
